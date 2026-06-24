import pool from "../config/db.js";

export async function placeOrder(req: any, res: any) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res
        .status(401)
        .json({ error: "Unauthorized: user not found in request" });
    }

    const { payment_method, coupon_code } = req.body;

    // ── 1. Fetch cart items ───────────────────────────────────────────────────
    const [cartItems] = await pool.query(
      `SELECT c.*, p.name, p.price, p.sale_price, p.stock
       FROM cart c
       JOIN products p ON c.product_id = p.id
       WHERE c.user_id = ?`,
      [userId],
    );
    const list = cartItems as any[];

    if (list.length === 0) {
      return res.status(400).json({ error: "Your cart is empty" });
    }

    // ── 2. Stock pre-check (fast fail before entering transaction) ────────────
    for (const item of list) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.name}". Available: ${item.stock}, requested: ${item.quantity}`,
        });
      }
    }

    // ── 3. Price helper (single source of truth) ──────────────────────────────
    const getItemPrice = (item: any): number =>
      item.sale_price != null
        ? parseFloat(item.sale_price)
        : parseFloat(item.price);

    // ── 4. Calculate subtotal ─────────────────────────────────────────────────
    let total = list.reduce(
      (sum, item) => sum + getItemPrice(item) * item.quantity,
      0,
    );

    // ── 5. Apply coupon if provided ───────────────────────────────────────────
    let appliedCoupon: any = null;

    if (coupon_code) {
      const [coupons] = await pool.query(
        `SELECT * FROM coupons
         WHERE code = ?
           AND is_active = 1
           AND (expires_at IS NULL OR expires_at > NOW())
           AND (max_uses IS NULL OR uses_count < max_uses)`,
        [coupon_code.trim().toUpperCase()],
      );
      const couponList = coupons as any[];

      if (couponList.length > 0) {
        appliedCoupon = couponList[0];
        const discountAmount = total * (appliedCoupon.discount_percent / 100);
        total = Math.max(0, total - discountAmount);
      }
      // If coupon not found/invalid → silently skip (or swap with a 400 if you prefer strict mode)
    }

    // Round to 2 decimal places to avoid floating-point drift in DB
    total = Math.round(total * 100) / 100;

    const finalPaymentMethod = payment_method || "Cash on Delivery";

    // ── 6. Run everything inside your transaction wrapper ─────────────────────
    const orderId = await pool.transaction(async (conn: any) => {
      // 6a. Create the order record
      const [orderResult] = await conn.query(
        `INSERT INTO orders (user_id, total_amount, payment_method, status)
         VALUES (?, ?, ?, ?)`,
        [userId, total, finalPaymentMethod, "Pending"],
      );
      const newOrderId = (orderResult as any).insertId;

      if (!newOrderId) {
        throw new Error("Failed to create order: no insertId returned");
      }

      // 6b. Insert order items + atomic stock decrement with race-condition guard
      for (const item of list) {
        const itemPrice = getItemPrice(item);

        await conn.query(
          `INSERT INTO order_items (order_id, product_id, quantity, price)
           VALUES (?, ?, ?, ?)`,
          [newOrderId, item.product_id, item.quantity, itemPrice],
        );

        // ✅ Atomic check: only decrement if stock is still sufficient
        const [stockResult] = await conn.query(
          `UPDATE products
           SET stock = stock - ?
           WHERE id = ? AND stock >= ?`,
          [item.quantity, item.product_id, item.quantity],
        );

        // If no rows updated → another request already consumed the stock
        if ((stockResult as any).affectedRows === 0) {
          throw new Error(
            `Stock depleted for "${item.name}" during checkout. Please review your cart.`,
          );
        }
      }

      // 6c. Increment coupon usage count if a coupon was applied
      if (appliedCoupon) {
        await conn.query(
          `UPDATE coupons SET uses_count = uses_count + 1 WHERE id = ?`,
          [appliedCoupon.id],
        );
      }

      // 6d. Clear the cart
      await conn.query("DELETE FROM cart WHERE user_id = ?", [userId]);

      return newOrderId;
    });

    // ── 7. Success response ───────────────────────────────────────────────────
    return res.status(201).json({
      message: "Order placed successfully",
      orderId,
      total_amount: total,
      payment_method: finalPaymentMethod,
      ...(appliedCoupon && { coupon_applied: appliedCoupon.code }),
    });
  } catch (err: any) {
    console.error("Place order error:", err);

    // Surface stock-depletion errors as 409 Conflict, not 500
    if (err?.message?.includes("Stock depleted")) {
      return res.status(409).json({ error: err.message });
    }

    const message =
      process.env.NODE_ENV === "development"
        ? `Server error: ${err?.message || err}`
        : "Server error placing order";

    return res.status(500).json({ error: message });
  }
}

export async function getMyOrders(req: any, res: any) {
  try {
    const userId = req.user.id;
    const [orders] = await pool.query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
      [userId],
    );
    return res.json(orders);
  } catch (err: any) {
    console.error("Get my orders error:", err);
    return res
      .status(500)
      .json({ error: "Server error retrieving your orders" });
  }
}

export async function getAllOrders(req: any, res: any) {
  try {
    const [orders] = await pool.query(
      "SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC",
    );
    return res.json(orders);
  } catch (err: any) {
    console.error("Get all orders error:", err);
    return res
      .status(500)
      .json({ error: "Server error retrieving all orders" });
  }
}

export async function getOrderDetails(req: any, res: any) {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      "SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?",
      [Number(id)],
    );
    const orderList = orders as any[];
    if (orderList.length === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    const order = orderList[0];

    // Verify access: admin or order owner only
    if (req.user.role !== "admin" && req.user.id !== order.user_id) {
      return res.status(403).json({ error: "Access unauthorized" });
    }

    const [billing] = await pool.query(
      "SELECT * FROM billing_address WHERE user_id = ?",
      [order.user_id],
    );
    const billingList = billing as any[];
    order.billing_address = billingList.length > 0 ? billingList[0] : null;

    const [items] = await pool.query(
      "SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?",
      [Number(id)],
    );
    order.items = items;

    return res.json(order);
  } catch (err: any) {
    console.error("Get order details error:", err);
    return res
      .status(500)
      .json({ error: "Server error retrieving order details" });
  }
}

export async function updateOrderStatus(req: any, res: any) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: "Status is required" });
    }

    const validStatuses = [
      "Pending",
      "Processing",
      "Shipped",
      "Completed",
      "Cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const [result] = await pool.query(
      "UPDATE orders SET status = ? WHERE id = ?",
      [status, Number(id)],
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    return res.json({ message: "Order status updated successfully" });
  } catch (err: any) {
    console.error("Update order status error:", err);
    return res
      .status(500)
      .json({ error: "Server error updating order status" });
  }
}
