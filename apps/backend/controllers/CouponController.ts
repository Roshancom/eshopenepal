import pool from '../config/db.js';

export async function applyCoupon(req: any, res: any) {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Coupon code is required' });
    }

    const [coupons] = await pool.query(
      'SELECT * FROM coupons WHERE code = ? AND is_active = 1',
      [code.trim().toUpperCase()]
    );
    const list = coupons as any[];

    if (list.length === 0) {
      return res.status(404).json({ error: 'Invalid or expired coupon code' });
    }

    return res.json({
      message: 'Coupon applied successfully',
      code: list[0].code,
      discount_percent: list[0].discount_percent
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error applying coupon' });
  }
}

export async function createCoupon(req: any, res: any) {
  try {
    const { code, discount_percent, is_active } = req.body;
    if (!code || discount_percent === undefined) {
      return res.status(400).json({ error: 'Coupon code and discount percent are required' });
    }

    const [existing] = await pool.query('SELECT * FROM coupons WHERE code = ?', [code.trim().toUpperCase()]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Coupon code already exists' });
    }

    await pool.query(
      'INSERT INTO coupons (code, discount_percent, is_active) VALUES (?, ?, ?)',
      [code.trim().toUpperCase(), Number(discount_percent), is_active !== undefined ? Boolean(is_active) : true]
    );

    return res.status(201).json({ message: 'Coupon created successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating coupon' });
  }
}

export async function getAllCoupons(req: any, res: any) {
  try {
    const [coupons] = await pool.query('SELECT * FROM coupons ORDER BY id DESC');
    return res.json(coupons);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving coupons' });
  }
}

export async function toggleCoupon(req: any, res: any) {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    await pool.query('UPDATE coupons SET is_active = ? WHERE id = ?', [Boolean(is_active), Number(id)]);
    return res.json({ message: 'Coupon status updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error updating status' });
  }
}
