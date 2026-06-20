import 'dotenv/config';
import db from './config/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadData() {
  const dataPath = path.join(__dirname, 'data_store.json');
  return JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
}

// Convert ISO 8601 timestamp (e.g. '2026-06-10T09:32:25.398Z') to MySQL-compatible format
function toMysqlDate(iso) {
  if (!iso) return null;
  return iso.replace('T', ' ').replace('Z', '').split('.')[0];
}

async function seed() {
  console.log('🌱 Starting database seeding...\n');

  const data = loadData();

  // Wait for MySQL connection to be ready (the pool initializes async)
  console.log('⏳ Waiting for MySQL connection...');
  let waited = 0;
  while (!db.isMySqlActive && waited < 10000) {
    await new Promise(r => setTimeout(r, 200));
    waited += 200;
  }
  if (db.isMySqlActive) {
    console.log('✅ MySQL connected.\n');
  } else {
    console.log('⚠️ MySQL not available after 10s — using local JSON store fallback.\n');
  }

  try {
    // ─── 1. Drop existing tables (respect FK order) ───────────────────
    console.log('🧹 Dropping existing tables...');
    await db.query('DROP TABLE IF EXISTS billing_address');
    await db.query('DROP TABLE IF EXISTS order_items');
    await db.query('DROP TABLE IF EXISTS orders');
    await db.query('DROP TABLE IF EXISTS cart');
    await db.query('DROP TABLE IF EXISTS coupons');
    await db.query('DROP TABLE IF EXISTS products');
    await db.query('DROP TABLE IF EXISTS categories');
    await db.query('DROP TABLE IF EXISTS users');
    console.log('✔ All tables dropped.\n');

    // ─── 2. Create tables ─────────────────────────────────────────────
    console.log('📐 Creating tables...');

    await db.query(`
      CREATE TABLE users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('consumer', 'admin') DEFAULT 'consumer',
        google_id VARCHAR(255) DEFAULT NULL,
        full_name VARCHAR(255) DEFAULT NULL,
        profile_picture_url VARCHAR(500) DEFAULT NULL,
        auth_provider ENUM('email', 'google') DEFAULT 'email',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✔ users');

    await db.query(`
      CREATE TABLE categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✔ categories');

    await db.query(`
      CREATE TABLE products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        sale_price DECIMAL(10, 2) DEFAULT NULL,
        stock INT DEFAULT 0,
        category_id INT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      )
    `);
    console.log('  ✔ products');

    await db.query(`
      CREATE TABLE cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✔ cart');

    await db.query(`
      CREATE TABLE coupons (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        discount_percent INT NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('  ✔ coupons');

    await db.query(`
      CREATE TABLE orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_amount DECIMAL(10, 2),
        payment_method VARCHAR(100) DEFAULT 'Cash on Delivery',
        status VARCHAR(50) DEFAULT 'Pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✔ orders');

    await db.query(`
      CREATE TABLE order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        order_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✔ order_items');

    await db.query(`
      CREATE TABLE billing_address (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL UNIQUE,
        full_name VARCHAR(255),
        phone VARCHAR(50),
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(100),
        zip VARCHAR(20),
        country VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('  ✔ billing_address');
    console.log('✔ All tables created.\n');

    // ─── 3. Seed users ────────────────────────────────────────────────
    console.log('👤 Seeding users...');
    for (const u of data.users) {
      await db.query(
        'INSERT INTO users (id, username, email, password, role, google_id, full_name, profile_picture_url, auth_provider, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [u.id, u.username, u.email, u.password, u.role, u.google_id || null, u.full_name || null, u.profile_picture_url || null, u.auth_provider || 'email', toMysqlDate(u.created_at)]
      );
    }
    console.log(`  ✔ ${data.users.length} users seeded.`);

    // ─── 4. Seed categories ───────────────────────────────────────────
    console.log('📂 Seeding categories...');
    for (const c of data.categories) {
      await db.query(
        'INSERT INTO categories (id, name, created_at) VALUES (?, ?, ?)',
        [c.id, c.name, toMysqlDate(c.created_at)]
      );
    }
    console.log(`  ✔ ${data.categories.length} categories seeded.`);

    // ─── 5. Seed products ─────────────────────────────────────────────
    console.log('📦 Seeding products...');
    for (const p of data.products) {
      await db.query(
        'INSERT INTO products (id, name, description, price, sale_price, stock, category_id, image_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [p.id, p.name, p.description, p.price, p.sale_price, p.stock, p.category_id, p.image_url, toMysqlDate(p.created_at)]
      );
    }
    console.log(`  ✔ ${data.products.length} products seeded.`);

    // ─── 6. Seed cart items ───────────────────────────────────────────
    console.log('🛒 Seeding cart...');
    for (const c of data.cart) {
      await db.query(
        'INSERT INTO cart (id, user_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.user_id, c.product_id, c.quantity, toMysqlDate(c.created_at)]
      );
    }
    console.log(`  ✔ ${data.cart.length} cart items seeded.`);

    // ─── 7. Seed coupons ─────────────────────────────────────────────
    console.log('🎟️  Seeding coupons...');
    for (const c of data.coupons) {
      await db.query(
        'INSERT INTO coupons (id, code, discount_percent, is_active, created_at) VALUES (?, ?, ?, ?, ?)',
        [c.id, c.code, c.discount_percent, c.is_active, toMysqlDate(c.created_at)]
      );
    }
    console.log(`  ✔ ${data.coupons.length} coupons seeded.`);

    // ─── 8. Seed orders ───────────────────────────────────────────────
    console.log('🧾 Seeding orders...');
    for (const o of data.orders) {
      await db.query(
        'INSERT INTO orders (id, user_id, total_amount, payment_method, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [
          o.id,
          o.user_id,
          o.total_amount ?? null,
          o.payment_method ?? 'Cash on Delivery',
          o.status ?? 'Pending',
          toMysqlDate(o.created_at),
        ]
      );
    }
    console.log(`  ✔ ${data.orders.length} orders seeded.`);

    // ─── 9. Seed order items ──────────────────────────────────────────
    console.log('📋 Seeding order items...');
    for (const oi of data.order_items) {
      await db.query(
        'INSERT INTO order_items (id, order_id, product_id, quantity, price, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [oi.id, oi.order_id, oi.product_id, oi.quantity, oi.price ?? null, toMysqlDate(oi.created_at)]
      );
    }
    console.log(`  ✔ ${data.order_items.length} order items seeded.`);

    // ─── 10. Seed billing addresses ───────────────────────────────────
    console.log('🏠 Seeding billing addresses...');
    for (const b of data.billing_address) {
      await db.query(
        'INSERT INTO billing_address (id, user_id, full_name, phone, address, city, state, zip, country, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [b.id, b.user_id, b.full_name, b.phone, b.address, b.city, b.state, b.zip, b.country, toMysqlDate(b.created_at)]
      );
    }
    console.log(`  ✔ ${data.billing_address.length} billing addresses seeded.`);

    // ─── Summary ──────────────────────────────────────────────────────
    console.log('\n🎉 Database seeded successfully!');
    console.log('────────────────────────────────────────────────');
    console.log(`  Users:            ${data.users.length}`);
    console.log(`  Categories:       ${data.categories.length}`);
    console.log(`  Products:         ${data.products.length}`);
    console.log(`  Cart items:       ${data.cart.length}`);
    console.log(`  Coupons:          ${data.coupons.length}`);
    console.log(`  Orders:           ${data.orders.length}`);
    console.log(`  Order items:      ${data.order_items.length}`);
    console.log(`  Billing addrs:    ${data.billing_address.length}`);
    console.log('────────────────────────────────────────────────');
    console.log('  Admin login: admin@shop.com (password as stored)');
    console.log('  Consumer:    john@shop.com   (password as stored)');
    console.log('────────────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err);
    process.exit(1);
  }
}

seed();
