import pool from '../config/db.js';

export async function placeOrder(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { payment_method, coupon_code } = req.body;

    // 1. Get user's cart items
    const [cartItems] = await pool.query(
      'SELECT c.*, p.name, p.price, p.sale_price, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
      [userId]
    );
    const list = cartItems as any[];

    if (list.length === 0) {
      return res.status(400).json({ error: 'Your cart is empty' });
    }

    // 2. Validate stock for all items up front
    for (const item of list) {
      if (item.stock < item.quantity) {
        return res.status(400).json({
          error: `Insufficient stock for "${item.name}". Available: ${item.stock}, requested: ${item.quantity}`
        });
      }
    }

    // 3. Calculate order total
    let total = 0;
    list.forEach(item => {
      const price = item.sale_price !== null && item.sale_price !== undefined
        ? parseFloat(item.sale_price)
        : parseFloat(item.price);
      total += price * item.quantity;
    });

    // 4. Apply coupon if provided
    if (coupon_code) {
      const [coupons] = await pool.query(
        'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
        [coupon_code.trim().toUpperCase()]
      );
      const couponList = coupons as any[];
      if (couponList.length > 0) {
        const discountAmount = total * (couponList[0].discount_percent / 100);
        total = Math.max(0, total - discountAmount);
      }
    }

    const finalPaymentMethod = payment_method || 'Cash on Delivery';

    // 5. FIXED: Wrap all writes in a transaction — if anything fails, everything rolls back
    const orderId = await pool.transaction(async (conn: any) => {
      // Create the order
      const [orderResult] = await conn.query(
        'INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, "Pending")',
        [userId, total, finalPaymentMethod]
      );
      const newOrderId = (orderResult as any).insertId;

      // Insert order items and decrement stock
      for (const item of list) {
        const itemPrice = item.sale_price !== null && item.sale_price !== undefined
          ? parseFloat(item.sale_price)
          : parseFloat(item.price);

        await conn.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
          [newOrderId, item.product_id, item.quantity, itemPrice]
        );

        await conn.query(
          'UPDATE products SET stock = stock - ? WHERE id = ?',
          [item.quantity, item.product_id]
        );
      }

      // Clear the user's cart
      await conn.query('DELETE FROM cart WHERE user_id = ?', [userId]);

      return newOrderId;
    });

    return res.status(201).json({
      message: 'Order placed successfully',
      orderId,
      total_amount: total
    });
  } catch (err: any) {
    console.error('Place order error:', err);
    return res.status(500).json({ error: 'Server error placing order' });
  }
}

export async function getMyOrders(req: any, res: any) {
  try {
    const userId = req.user.id;
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
    return res.json(orders);
  } catch (err: any) {
    console.error('Get my orders error:', err);
    return res.status(500).json({ error: 'Server error retrieving your orders' });
  }
}

export async function getAllOrders(req: any, res: any) {
  try {
    const [orders] = await pool.query(
      'SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id ORDER BY o.created_at DESC'
    );
    return res.json(orders);
  } catch (err: any) {
    console.error('Get all orders error:', err);
    return res.status(500).json({ error: 'Server error retrieving all orders' });
  }
}

export async function getOrderDetails(req: any, res: any) {
  try {
    const { id } = req.params;

    const [orders] = await pool.query(
      'SELECT o.*, u.username, u.email FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?',
      [Number(id)]
    );
    const orderList = orders as any[];
    if (orderList.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderList[0];

    // Verify access: admin or order owner only
    if (req.user.role !== 'admin' && req.user.id !== order.user_id) {
      return res.status(403).json({ error: 'Access unauthorized' });
    }

    const [billing] = await pool.query(
      'SELECT * FROM billing_address WHERE user_id = ?',
      [order.user_id]
    );
    const billingList = billing as any[];
    order.billing_address = billingList.length > 0 ? billingList[0] : null;

    const [items] = await pool.query(
      'SELECT oi.*, p.name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
      [Number(id)]
    );
    order.items = items;

    return res.json(order);
  } catch (err: any) {
    console.error('Get order details error:', err);
    return res.status(500).json({ error: 'Server error retrieving order details' });
  }
}

export async function updateOrderStatus(req: any, res: any) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const [result] = await pool.query(
      'UPDATE orders SET status = ? WHERE id = ?',
      [status, Number(id)]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ message: 'Order status updated successfully' });
  } catch (err: any) {
    console.error('Update order status error:', err);
    return res.status(500).json({ error: 'Server error updating order status' });
  }
}
