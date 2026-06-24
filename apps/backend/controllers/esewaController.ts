import crypto from 'crypto';
import pool from '../config/db.js';

// ── eSewa UAT (Test) Configuration ───────────────────────────────────────
const ESEWA_MERCHANT_ID = process.env.ESEWA_MERCHANT_ID || 'EPAYTEST';
const ESEWA_SECRET_KEY = process.env.ESEWA_SECRET_KEY || '8gBm/:&EnhH.1/q';

// eSewa UAT endpoints
const ESEWA_FORM_URL = 'https://rc-epay.esewa.com.np/api/epay/main/v2/form';
const ESEWA_VERIFY_URL = 'https://rc.esewa.com.np/api/epay/transaction/status/';

// Base URL for callbacks — configurable via env
const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';

/**
 * Generate HMAC-SHA256 signature for eSewa payment request.
 * Signed fields: total_amount,transaction_uuid,product_code
 */
function generateSignature(totalAmount: string, transactionUuid: string, productCode: string): string {
  const message = `total_amount=${totalAmount},transaction_uuid=${transactionUuid},product_code=${productCode}`;
  return crypto
    .createHmac('sha256', ESEWA_SECRET_KEY)
    .update(message)
    .digest('base64');
}

/**
 * POST /api/esewa/initiate
 *
 * Returns eSewa form data for redirect. The order must already be created
 * by POST /api/orders/place with payment_method: "eSewa".
 */
export async function initiatePayment(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { order_id, total_amount } = req.body;

    if (!order_id || !total_amount) {
      return res.status(400).json({ error: 'order_id and total_amount are required' });
    }

    // Verify the order exists and belongs to this user
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [Number(order_id), userId]
    );
    const orderList = orders as any[];
    if (orderList.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderList[0];
    if (order.payment_method !== 'eSewa') {
      return res.status(400).json({ error: 'This order is not an eSewa payment' });
    }

    // Generate unique transaction UUID for eSewa
    const transactionUuid = `ESHOP-${order.id}-${Date.now()}`;

    // Calculate amounts (no extra tax/service/delivery charges)
    const amount = Number(total_amount);
    const taxAmount = 0;
    const serviceCharge = 0;
    const deliveryCharge = 0;
    const totalAmount = amount + taxAmount + serviceCharge + deliveryCharge;

    // Format total_amount consistently — must match what eSewa returns for signature verification
    const totalAmountStr = totalAmount.toFixed(2);

    // Generate HMAC signature using the formatted string (must match eSewa's expected format)
    const signature = generateSignature(totalAmountStr, transactionUuid, ESEWA_MERCHANT_ID);

    // Return form data for the frontend to auto-submit
    return res.json({
      formUrl: ESEWA_FORM_URL,
      formData: {
        amount: amount.toFixed(2),
        tax_amount: taxAmount.toFixed(2),
        product_service_charge: serviceCharge.toFixed(2),
        product_delivery_charge: deliveryCharge.toFixed(2),
        total_amount: totalAmountStr,
        transaction_uuid: transactionUuid,
        product_code: ESEWA_MERCHANT_ID,
        success_url: `${BASE_URL}/api/esewa/success`,
        failure_url: `${BASE_URL}/api/esewa/failure`,
        signed_field_names: 'total_amount,transaction_uuid,product_code',
        signature,
      },
      transaction_uuid: transactionUuid,
    });
  } catch (err: any) {
    console.error('eSewa initiate payment error:', err);
    const message = process.env.NODE_ENV === 'development'
      ? `Server error: ${err?.message || err}`
      : 'Failed to initiate eSewa payment';
    return res.status(500).json({ error: message });
  }
}

/**
 * POST /api/esewa/cleanup
 *
 * Deletes a pending eSewa order if the user cancelled/failed to reach eSewa.
 * Restores stock AND cart items so the user doesn't lose their cart.
 */
export async function cleanupOrder(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    // Only clean up if the order is still Pending and eSewa
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND status = ? AND payment_method = ?',
      [Number(order_id), userId, 'Pending', 'eSewa']
    );
    const orderList = orders as any[];
    if (orderList.length === 0) {
      return res.json({ message: 'Order already processed or not found' });
    }

    // Get order items to restore stock and cart
    const [items] = await pool.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      [Number(order_id)]
    );
    const itemList = items as any[];

    // Restore stock for each item
    for (const item of itemList) {
      await pool.query(
        'UPDATE products SET stock = stock + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

    // Restore cart items so the user doesn't lose them
    for (const item of itemList) {
      // Check if cart entry already exists (shouldn't, but be safe)
      const [existing] = await pool.query(
        'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
        [userId, item.product_id]
      );
      const existingList = existing as any[];
      if (existingList.length === 0) {
        await pool.query(
          'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
          [userId, item.product_id, item.quantity]
        );
      }
    }

    // Delete order items then the order
    await pool.query('DELETE FROM order_items WHERE order_id = ?', [Number(order_id)]);
    await pool.query('DELETE FROM orders WHERE id = ?', [Number(order_id)]);

    return res.json({ message: 'Order cleaned up successfully' });
  } catch (err: any) {
    console.error('eSewa cleanup error:', err);
    return res.status(500).json({ error: 'Failed to clean up order' });
  }
}

/**
 * GET /api/esewa/success
 *
 * Callback from eSewa after successful payment.
 * Decodes the response, verifies HMAC signature + eSewa API, updates order status.
 *
 * eSewa v2 redirects to: success_url?data=<base64-encoded-JSON>
 */
export async function paymentSuccess(req: any, res: any) {
  try {
    // eSewa v2 sends the response as the "data" query parameter
    const encodedData = req.query.data;

    if (!encodedData) {
      return res.redirect(
        `${getFrontendUrl()}/#/payment-result?status=error&message=No+payment+response+received`
      );
    }

    // Decode the base64 response from eSewa
    let responseData: any;
    try {
      const decoded = Buffer.from(encodedData as string, 'base64').toString('utf-8');
      responseData = JSON.parse(decoded);
    } catch {
      return res.redirect(
        `${getFrontendUrl()}/#/payment-result?status=error&message=Invalid+payment+response`
      );
    }

    const { transaction_uuid, product_code, total_amount, ref_id, signature } = responseData;

    // ── Step 1: Verify HMAC signature to prevent tampering ──
    if (!signature) {
      console.error('eSewa response missing signature — rejecting');
      return res.redirect(
        `${getFrontendUrl()}/#/payment-result?status=error&message=Payment+response+missing+signature`
      );
    }

    const computedSignature = generateSignature(
      String(total_amount),
      transaction_uuid,
      product_code
    );
    if (computedSignature !== signature) {
      console.error('eSewa signature mismatch — possible tampering detected');
      return res.redirect(
        `${getFrontendUrl()}/#/payment-result?status=error&message=Payment+signature+verification+failed`
      );
    }

    // ── Step 2: Verify payment with eSewa API ──
    const verificationResult = await verifyPayment(product_code, total_amount, transaction_uuid);

    const orderId = extractOrderIdFromUuid(transaction_uuid);

    if (verificationResult.status === 'COMPLETE') {
      // Update order status to Paid
      if (orderId) {
        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['Paid', orderId]
        );
      }

      return res.redirect(
        `${getFrontendUrl()}/#/payment-result?status=success&orderId=${orderId || ''}&refId=${ref_id || ''}`
      );
    } else {
      // Payment not verified — mark as Failed
      if (orderId) {
        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['Failed', orderId]
        );
      }

      return res.redirect(
        `${getFrontendUrl()}/#/payment-result?status=failed&message=Payment+verification+failed`
      );
    }
  } catch (err: any) {
    console.error('eSewa success callback error:', err);
    return res.redirect(
      `${getFrontendUrl()}/#/payment-result?status=error&message=Payment+processing+error`
    );
  }
}

/**
 * GET /api/esewa/failure
 *
 * Callback from eSewa after failed/cancelled payment.
 */
export async function paymentFailure(req: any, res: any) {
  try {
    const { transaction_uuid } = req.query;

    // Mark order as Failed if we have the transaction UUID
    if (transaction_uuid) {
      const orderId = extractOrderIdFromUuid(transaction_uuid as string);
      if (orderId) {
        await pool.query(
          'UPDATE orders SET status = ? WHERE id = ?',
          ['Failed', orderId]
        );
      }
    }

    return res.redirect(
      `${getFrontendUrl()}/#/payment-result?status=failed&message=Payment+was+cancelled+or+failed`
    );
  } catch (err: any) {
    console.error('eSewa failure callback error:', err);
    return res.redirect(
      `${getFrontendUrl()}/#/payment-result?status=error&message=Payment+processing+error`
    );
  }
}

/**
 * POST /api/esewa/verify
 *
 * Manual verification endpoint — frontend can call this to check payment status.
 */
export async function verifyPaymentManual(req: any, res: any) {
  try {
    const { product_code, total_amount, transaction_uuid } = req.body;

    if (!product_code || !total_amount || !transaction_uuid) {
      return res.status(400).json({
        error: 'product_code, total_amount, and transaction_uuid are required',
      });
    }

    const result = await verifyPayment(product_code, total_amount, transaction_uuid);
    return res.json(result);
  } catch (err: any) {
    console.error('eSewa verify error:', err);
    return res.status(500).json({ error: 'Payment verification failed' });
  }
}

// ── Helper Functions ──────────────────────────────────────────────────────

/**
 * Verify payment status with eSewa API.
 */
async function verifyPayment(
  productCode: string,
  totalAmount: number | string,
  transactionUuid: string,
): Promise<{ status: string; message?: string }> {
  try {
    const params = new URLSearchParams({
      product_code: productCode,
      total_amount: String(totalAmount),
      transaction_uuid: transactionUuid,
    });

    const response = await fetch(`${ESEWA_VERIFY_URL}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.error('eSewa verification HTTP error:', response.status);
      return { status: 'ERROR', message: `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { status: data.status || 'UNKNOWN', message: data.message };
  } catch (err: any) {
    console.error('eSewa verification network error:', err?.message || err);
    return { status: 'ERROR', message: err?.message || 'Network error' };
  }
}

/**
 * Extract order ID from eSewa transaction UUID.
 * UUID format: ESHOP-{orderId}-{timestamp}
 */
function extractOrderIdFromUuid(uuid: string): number | null {
  const match = uuid.match(/^ESHOP-(\d+)-/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Get the frontend URL for redirects.
 */
function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:5173';
}
