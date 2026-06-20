import pool from '../config/db.js';

export async function getAllCategories(req: any, res: any) {
  try {
    const [categories] = await pool.query('SELECT * FROM categories ORDER BY id ASC');
    return res.json(categories);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving categories' });
  }
}

export async function createCategory(req: any, res: any) {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const [existing] = await pool.query('SELECT * FROM categories WHERE name = ?', [name]);
    if ((existing as any[]).length > 0) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const [result] = await pool.query('INSERT INTO categories (name) VALUES (?)', [name]);
    return res.status(201).json({
      message: 'Category created successfully',
      categoryId: (result as any).insertId,
      name
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating category' });
  }
}

export async function deleteCategory(req: any, res: any) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [Number(id)]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    return res.json({ message: 'Category deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error deleting category' });
  }
}
