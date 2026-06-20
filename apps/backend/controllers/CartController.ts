import pool from '../config/db.js';

export async function getCart(req: any, res: any) {
  try {
    const userId = req.user.id;
    const [items] = await pool.query(
      'SELECT c.*, p.name, p.price, p.sale_price, p.image_url, p.stock FROM cart c JOIN products p ON c.product_id = p.id WHERE c.user_id = ?',
      [userId]
    );
    return res.json(items);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving cart' });
  }
}

export async function addToCart(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    const qty = parseInt(quantity || '1', 10);

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    // Check if product exists
    const [products] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(product_id)]);
    if ((products as any[]).length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if item already exists in cart
    const [existing] = await pool.query(
      'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
      [userId, Number(product_id)]
    );
    const existingList = existing as any[];

    if (existingList.length > 0) {
      const newQty = existingList[0].quantity + qty;
      await pool.query(
        'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
        [newQty, userId, Number(product_id)]
      );
    } else {
      await pool.query(
        'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
        [userId, Number(product_id), qty]
      );
    }

    return res.json({ message: 'Product added to cart successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error adding to cart' });
  }
}

export async function updateCartQuantity(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { product_id, quantity } = req.body;
    const qty = parseInt(quantity, 10);

    if (!product_id || isNaN(qty) || qty <= 0) {
      return res.status(400).json({ error: 'Valid Product ID and positive quantity are required' });
    }

    await pool.query(
      'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
      [qty, userId, Number(product_id)]
    );

    return res.json({ message: 'Cart updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error updating cart' });
  }
}

export async function removeFromCart(req: any, res: any) {
  try {
    const userId = req.user.id;
    const { id } = req.params; // Can be cart ID or product ID

    // Delete matching user_id AND (cart.id = id OR product_id = id)
    await pool.query(
      'DELETE FROM cart WHERE user_id = ? AND (id = ? OR product_id = ?)',
      [userId, Number(id), Number(id)]
    );

    return res.json({ message: 'Item removed from cart successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error removing item' });
  }
}
