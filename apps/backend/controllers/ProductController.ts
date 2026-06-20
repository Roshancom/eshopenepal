import pool from '../config/db.js';

export async function getAllProducts(req: any, res: any) {
  try {
    const { categoryId } = req.query;
    let query = 'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id';
    let params: any[] = [];
    if (categoryId) {
      query += ' WHERE p.category_id = ?';
      params.push(Number(categoryId));
    }
    const [products] = await pool.query(query, params);
    return res.json(products);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving products' });
  }
}

export async function getProductById(req: any, res: any) {
  try {
    const { id } = req.params;
    const [products] = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?',
      [Number(id)]
    );
    const list = products as any[];
    if (list.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json(list[0]);
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error retrieving product' });
  }
}

export async function createProduct(req: any, res: any) {
  try {
    const { name, description, price, sale_price, stock, category_id } = req.body;
    let image_url = req.body.image_url || '';

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const [result] = await pool.query(
      'INSERT INTO products (name, description, price, sale_price, stock, category_id, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        name,
        description || '',
        parseFloat(price),
        sale_price ? parseFloat(sale_price) : null,
        parseInt(stock || '0', 10),
        category_id ? parseInt(category_id, 10) : null,
        image_url
      ]
    );

    return res.status(201).json({
      message: 'Product created successfully',
      productId: (result as any).insertId
    });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error creating product' });
  }
}

export async function updateProduct(req: any, res: any) {
  try {
    const { id } = req.params;
    const { name, description, price, sale_price, stock, category_id } = req.body;
    let image_url = req.body.image_url;

    if (req.file) {
      image_url = `/uploads/${req.file.filename}`;
    }

    const [existing] = await pool.query('SELECT * FROM products WHERE id = ?', [Number(id)]);
    const list = existing as any[];
    if (list.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const oldProduct = list[0];
    const finalName = name !== undefined ? name : oldProduct.name;
    const finalDesc = description !== undefined ? description : oldProduct.description;
    const finalPrice = price !== undefined ? parseFloat(price) : oldProduct.price;
    const finalSalePrice = sale_price !== undefined ? (sale_price ? parseFloat(sale_price) : null) : oldProduct.sale_price;
    const finalStock = stock !== undefined ? parseInt(stock, 10) : oldProduct.stock;
    const finalCategoryId = category_id !== undefined ? (category_id ? parseInt(category_id, 10) : null) : oldProduct.category_id;
    const finalImageUrl = image_url !== undefined ? image_url : oldProduct.image_url;

    await pool.query(
      'UPDATE products SET name = ?, description = ?, price = ?, sale_price = ?, stock = ?, category_id = ?, image_url = ? WHERE id = ?',
      [
        finalName,
        finalDesc,
        finalPrice,
        finalSalePrice,
        finalStock,
        finalCategoryId,
        finalImageUrl,
        Number(id)
      ]
    );

    return res.json({ message: 'Product updated successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error updating product' });
  }
}

export async function deleteProduct(req: any, res: any) {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM products WHERE id = ?', [Number(id)]);
    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ message: 'Product deleted successfully' });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Server error deleting product' });
  }
}
