import pool from '../config/db.js';

export async function getBillingAddress(req: any, res: any) {
  try {
    const userId = req.user.id;
    const [addresses] = await pool.query('SELECT * FROM billing_address WHERE user_id = ?', [userId]);
    const list = addresses as any[];
    if (list.length === 0) {
      return res.json(null);
    }
    return res.json(list[0]);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving billing address' });
  }
}

export async function saveBillingAddress(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { full_name, phone, address, city, state, zip, country } = req.body;

    if (!full_name || !phone || !address || !city || !state || !zip || !country) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if billing address already exists
    const [existing] = await pool.query('SELECT * FROM billing_address WHERE user_id = ?', [userId]);
    const list = existing as any[];

    if (list.length > 0) {
      // Update
      await pool.query(
        'UPDATE billing_address SET full_name = ?, phone = ?, address = ?, city = ?, state = ?, zip = ?, country = ? WHERE user_id = ?',
        [full_name, phone, address, city, state, zip, country, userId]
      );
      return res.json({ message: 'Billing address updated successfully' });
    } else {
      // Insert
      await pool.query(
        'INSERT INTO billing_address (user_id, full_name, phone, address, city, state, zip, country) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [userId, full_name, phone, address, city, state, zip, country]
      );
      return res.status(201).json({ message: 'Billing address saved successfully' });
    }
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error saving billing address' });
  }
}
