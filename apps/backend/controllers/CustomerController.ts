import pool from '../config/db.js';

export async function getAllCustomers(req: any, res: any) {
  try {
    const [users] = await pool.query(
      "SELECT id, username, email, role, created_at FROM users WHERE role = 'consumer' ORDER BY created_at DESC"
    );
    return res.json(users);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving customers list' });
  }
}
