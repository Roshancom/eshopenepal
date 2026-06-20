import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Resolve backend root — works both from monorepo root and standalone deployment
const backendRoot = fs.existsSync(path.join(process.cwd(), 'apps', 'backend'))
  ? path.join(process.cwd(), 'apps', 'backend')
  : process.cwd();

// Load backend-specific .env first, then root .env (dotenv won't overwrite already-set vars)
dotenv.config({ path: path.join(backendRoot, '.env') });
dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.warn('⚠️  DATABASE_URL not set — using local JSON fallback database.');
}

let pool = null;
let mysqlWorking = false;
let healthCheckTimer = null;

const RECONNECT_INTERVAL_MS = Number(process.env.DB_RECONNECT_INTERVAL) || 30000;
const POOL_ACQUIRE_TIMEOUT_MS = Number(process.env.DB_ACQUIRE_TIMEOUT) || 10000;
const POOL_CONNECT_TIMEOUT_MS = Number(process.env.DB_CONNECT_TIMEOUT) || 10000;

/**
 * Create a fresh MySQL connection pool using the DATABASE_URL.
 */
function createPool() {
  const url = new URL(DATABASE_URL);
  const p = mysql.createPool({
    host: url.hostname,
    port: Number(url.port),
    user: url.username,
    password: url.password,
    database: url.pathname.replace('/', ''),
    ssl: { rejectUnauthorized: false },
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // ── Timeouts ───────────────────────────────────────────────────────
    acquireTimeout: POOL_ACQUIRE_TIMEOUT_MS,   // Max ms to wait for a conn from pool
    connectTimeout: POOL_CONNECT_TIMEOUT_MS,    // Max ms to establish a TCP/SSL connection
  });
  return p;
}

async function initPool() {
  if (!DATABASE_URL) return;
  try {
    pool = createPool();

    // FIXED: Actually verify the connection works before trusting it
    const conn = await pool.getConnection();
    conn.release();
    mysqlWorking = true;
    console.log('✅ MySQL connection verified and active.');
  } catch (err) {
    console.warn('⚠️ MySQL unavailable, falling back to local JSON store:', err?.message || err);
    mysqlWorking = false;
    // If there was an old pool from a previous retry, end it
    if (pool) { try { await pool.end(); } catch (_) {} }
    pool = null;
  }
}

/**
 * Periodic health check — attempts to reconnect to MySQL if it is down.
 * Runs every RECONNECT_INTERVAL_MS while MySQL is unavailable.
 */
async function checkMySqlHealth() {
  if (mysqlWorking || !DATABASE_URL) return;
  try {
    const newPool = createPool();
    const conn = await newPool.getConnection();
    conn.release();
    // Swap old pool for the new working one
    if (pool) {
      try { await pool.end(); } catch (_) {}
    }
    pool = newPool;
    mysqlWorking = true;
    console.log('✅ MySQL connection restored after health check.');
  } catch (_) {
    // Still unavailable — will retry on the next interval
  }
}

// Start periodic health check (non-blocking, runs only when MySQL is down)
healthCheckTimer = setInterval(checkMySqlHealth, RECONNECT_INTERVAL_MS);
healthCheckTimer.unref(); // Don't keep the process alive just for this timer

// Run pool init immediately (non-blocking)
initPool();

// ─────────────────────────────────────────────────────────────────────────────
// LOCAL JSON FALLBACK DATABASE
// ─────────────────────────────────────────────────────────────────────────────

const localDbPath = path.join(backendRoot, 'data_store.json');

function readLocalDb() {
  if (!fs.existsSync(localDbPath)) {
    const initialSchema = {
      users: [],
      categories: [],
      products: [],
      cart: [],
      coupons: [],
      orders: [],
      order_items: [],
      billing_address: []
    };
    fs.writeFileSync(localDbPath, JSON.stringify(initialSchema, null, 2));
    return initialSchema;
  }
  try {
    return JSON.parse(fs.readFileSync(localDbPath, 'utf8'));
  } catch (err) {
    return { users: [], categories: [], products: [], cart: [], coupons: [], orders: [], order_items: [], billing_address: [] };
  }
}

function writeLocalDb(data) {
  fs.writeFileSync(localDbPath, JSON.stringify(data, null, 2));
}

function emulateSqlQuery(sql, params = []) {
  const store = readLocalDb();
  let sqlClean = sql.trim().replace(/\s+/g, ' ');
  const sqlLower = sqlClean.toLowerCase();

  // DROP TABLE
  if (sqlLower.startsWith('drop table')) {
    const tableNameMatch = sqlClean.match(/exists\s+(\w+)/i) || sqlClean.match(/table\s+(\w+)/i);
    if (tableNameMatch) {
      const tbName = tableNameMatch[1].toLowerCase();
      store[tbName] = [];
      writeLocalDb(store);
    }
    return [{ affectedRows: 0 }];
  }

  // CREATE TABLE
  if (sqlLower.startsWith('create table')) {
    const tableNameMatch = sqlLower.match(/create table (?:if not exists )?(\w+)/);
    if (tableNameMatch) {
      const tbName = tableNameMatch[1];
      if (!store[tbName]) {
        store[tbName] = [];
        writeLocalDb(store);
      }
    }
    return [{ affectedRows: 0 }];
  }

  // INSERT INTO
  if (sqlLower.startsWith('insert into')) {
    const tableMatch = sqlClean.match(/insert into\s+(\w+)/i);
    if (tableMatch) {
      const tbName = tableMatch[1].toLowerCase();
      if (!store[tbName]) store[tbName] = [];

      const colsMatch = sqlClean.match(/insert into\s+\w+\s*\(([^)]+)\)/i);
      let columns = [];
      if (colsMatch) {
        columns = colsMatch[1].split(',').map(c => c.trim().replace(/`/g, ''));
      }

      const row = {};
      const nextId = store[tbName].length > 0 ? Math.max(...store[tbName].map(r => r.id || 0)) + 1 : 1;
      row.id = nextId;

      if (columns.length > 0) {
        columns.forEach((col, idx) => { row[col] = params[idx]; });
      }

      if (tbName === 'users' && !row.role) row.role = 'consumer';
      if (!row.created_at) row.created_at = new Date().toISOString();

      store[tbName].push(row);
      writeLocalDb(store);
      return [{ insertId: row.id, affectedRows: 1 }];
    }
  }

  // REPLACE INTO / INSERT ON DUPLICATE KEY UPDATE
  if (sqlLower.startsWith('replace into') || sqlLower.includes('on duplicate key update')) {
    if (sqlLower.includes('billing_address')) {
      const [userId, fullName, phone, address, city, state, zip, country] = params;
      const idx = store.billing_address.findIndex(r => r.user_id === userId);
      if (idx !== -1) {
        store.billing_address[idx] = { ...store.billing_address[idx], full_name: fullName, phone, address, city, state, zip, country };
        writeLocalDb(store);
        return [{ affectedRows: 1 }];
      } else {
        const nextId = store.billing_address.length > 0 ? Math.max(...store.billing_address.map(r => r.id || 0)) + 1 : 1;
        store.billing_address.push({ id: nextId, user_id: userId, full_name: fullName, phone, address, city, state, zip, country });
        writeLocalDb(store);
        return [{ insertId: nextId, affectedRows: 1 }];
      }
    }
  }

  // UPDATE
  if (sqlLower.startsWith('update')) {
    const tableMatch = sqlLower.match(/update\s+(\w+)/);
    if (tableMatch) {
      const tbName = tableMatch[1];
      const whereMatch = sqlClean.match(/where\s+(.+)$/i);
      let rowsToUpdate = [...(store[tbName] || [])];

      if (whereMatch) {
        const whereClause = whereMatch[1].toLowerCase().replace(/\s+/g, ' ');
        if (whereClause.includes('id = ?')) {
          const idVal = params[params.length - 1];
          rowsToUpdate = rowsToUpdate.filter(r => String(r.id) === String(idVal));
        } else if (whereClause.includes('user_id = ? and product_id = ?')) {
          const uId = params[1], pId = params[2];
          rowsToUpdate = rowsToUpdate.filter(r => String(r.user_id) === String(uId) && String(r.product_id) === String(pId));
        } else if (whereClause.includes('user_id = ?')) {
          const uId = params[params.length - 1];
          rowsToUpdate = rowsToUpdate.filter(r => String(r.user_id) === String(uId));
        }
      }

      // Apply SET values
      const setMatch = sqlLower.match(/set\s+(.+?)\s+where/i);
      if (setMatch) {
        const setParts = setMatch[1].split(',').map(s => s.trim());
        const setFields = setParts.map(p => p.split('=')[0].trim().replace(/`/g, ''));
        rowsToUpdate.forEach(row => {
          const storeRow = store[tbName].find(r => r.id === row.id);
          if (storeRow) {
            setFields.forEach((field, i) => {
              // Handle stock = stock - ? pattern
              if (setParts[i].includes('stock - ?')) {
                storeRow.stock = (storeRow.stock || 0) - params[i];
              } else {
                storeRow[field] = params[i];
              }
            });
          }
        });
      } else {
        // Fallback: handle simple known patterns
        rowsToUpdate.forEach(row => {
          const storeRow = store[tbName].find(r => r.id === row.id);
          if (!storeRow) return;
          if (sqlLower.includes('quantity = ?')) storeRow.quantity = params[0];
          else if (sqlLower.includes('status = ?')) storeRow.status = params[0];
          else if (sqlLower.includes('is_active = ?')) storeRow.is_active = params[0];
          else if (sqlLower.includes('full_name = ?')) {
            const [full_name, phone, address, city, state, zip, country] = params;
            Object.assign(storeRow, { full_name, phone, address, city, state, zip, country });
          }
        });
      }

      writeLocalDb(store);
      return [{ affectedRows: rowsToUpdate.length }];
    }
  }

  // DELETE
  if (sqlLower.startsWith('delete')) {
    const tableMatch = sqlClean.match(/delete\s+from\s+(\w+)/i);
    if (tableMatch) {
      const tbName = tableMatch[1].toLowerCase();
      const whereMatch = sqlClean.match(/where\s+(.+)$/i);
      const initialLen = store[tbName]?.length || 0;

      if (whereMatch && store[tbName]) {
        const whereClause = whereMatch[1].toLowerCase();
        if (whereClause.includes('user_id = ? and (id = ? or product_id = ?)')) {
          const [uId, itemId, prodId] = params;
          store[tbName] = store[tbName].filter(r =>
            !(String(r.user_id) === String(uId) && (String(r.id) === String(itemId) || String(r.product_id) === String(prodId)))
          );
        } else if (whereClause.includes('user_id = ? and product_id = ?')) {
          const [uId, pId] = params;
          store[tbName] = store[tbName].filter(r => !(String(r.user_id) === String(uId) && String(r.product_id) === String(pId)));
        } else if (whereClause.includes('user_id = ?')) {
          const uId = params[0];
          store[tbName] = store[tbName].filter(r => String(r.user_id) !== String(uId));
        } else if (whereClause.includes('id = ?')) {
          const idVal = params[0];
          store[tbName] = store[tbName].filter(r => String(r.id) !== String(idVal));
        }
      } else {
        store[tbName] = [];
      }

      writeLocalDb(store);
      return [{ affectedRows: initialLen - (store[tbName]?.length || 0) }];
    }
  }

  // SELECT
  if (sqlLower.startsWith('select')) {
    const fromMatch = sqlClean.match(/from\s+(\w+)/i);
    if (fromMatch) {
      const tbName = fromMatch[1].toLowerCase();
      let results = JSON.parse(JSON.stringify(store[tbName] || []));

      // WHERE filtering
      const whereMatch = sqlClean.match(/where\s+(.+?)(?:\s+order by|\s+limit|$)/i);
      if (whereMatch) {
        const whereClause = whereMatch[1].trim().toLowerCase().replace(/\s+/g, ' ');
        if (whereClause.includes('email = ? or username = ?')) {
          const val = params[0];
          results = results.filter(r => r.email === val || r.username === val);
        } else if (whereClause.includes('(email = ? or username = ?) and role =')) {
          const val = params[0];
          results = results.filter(r => (r.email === val || r.username === val) && r.role === 'admin');
        } else if (whereClause.includes('email = ?')) {
          results = results.filter(r => r.email === params[0]);
        } else if (whereClause.includes('username = ?')) {
          results = results.filter(r => r.username === params[0]);
        } else if (whereClause.includes('user_id = ? and product_id = ?')) {
          results = results.filter(r => String(r.user_id) === String(params[0]) && String(r.product_id) === String(params[1]));
        } else if (whereClause.includes('user_id = ?')) {
          results = results.filter(r => String(r.user_id) === String(params[0]));
        } else if (whereClause.includes('order_id = ?')) {
          results = results.filter(r => String(r.order_id) === String(params[0]));
        } else if (whereClause.includes('p.id = ?') || (whereClause.includes('id = ?') && !whereClause.includes('user_id') && !whereClause.includes('order_id'))) {
          results = results.filter(r => String(r.id) === String(params[0]));
        } else if (whereClause.includes('category_id = ?')) {
          results = results.filter(r => String(r.category_id) === String(params[0]));
        } else if (whereClause.includes('code = ? and is_active = 1')) {
          results = results.filter(r => r.code?.toUpperCase() === params[0]?.toUpperCase() && r.is_active);
        } else if (whereClause.includes('code = ?')) {
          results = results.filter(r => r.code?.toUpperCase() === params[0]?.toUpperCase());
        } else if (whereClause.includes("role = 'consumer'")) {
          results = results.filter(r => r.role === 'consumer');
        }
      }

      // JOIN simulation: products + categories
      if (tbName === 'products' && sqlLower.includes('categor')) {
        results = results.map(p => {
          const cat = store.categories.find(c => String(c.id) === String(p.category_id));
          return { ...p, category_name: cat ? cat.name : null };
        });
      }

      // JOIN simulation: cart + products
      if (tbName === 'cart' && sqlLower.includes('products')) {
        results = results.map(c => {
          const prod = store.products.find(p => String(p.id) === String(c.product_id));
          return prod ? { ...c, name: prod.name, price: prod.price, sale_price: prod.sale_price, image_url: prod.image_url, stock: prod.stock } : c;
        });
      }

      // JOIN simulation: orders + users
      if (tbName === 'orders' && sqlLower.includes('users')) {
        results = results.map(o => {
          const u = store.users.find(usr => String(usr.id) === String(o.user_id));
          return { ...o, username: u ? u.username : 'Unknown', email: u ? u.email : 'Unknown' };
        });
      }

      // JOIN simulation: order_items + products
      if (tbName === 'order_items' && sqlLower.includes('products')) {
        results = results.map(oi => {
          const prod = store.products.find(p => String(p.id) === String(oi.product_id));
          return prod ? { ...oi, name: prod.name, image_url: prod.image_url } : oi;
        });
      }

      // ORDER BY created_at DESC
      if (sqlLower.includes('order by') && sqlLower.includes('created_at desc')) {
        results.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
      }

      return [results];
    }
  }

  return [[]];
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTED DB INTERFACE
// ─────────────────────────────────────────────────────────────────────────────

const db = {
  async query(sql, params = []) {
    if (mysqlWorking && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        console.warn('⚠️ MySQL query error, falling back to local store:', err?.message || err);
        return [emulateSqlQuery(sql, params), null];
      }
    }
    return [emulateSqlQuery(sql, params), null];
  },

  async execute(sql, params = []) {
    return this.query(sql, params);
  },

  /**
   * Run multiple queries inside a MySQL transaction.
   * Falls back gracefully if MySQL is unavailable (runs queries without transaction).
   */
  async transaction(fn) {
    if (mysqlWorking && pool) {
      const conn = await pool.getConnection();
      await conn.beginTransaction();
      try {
        const result = await fn(conn);
        await conn.commit();
        return result;
      } catch (err) {
        await conn.rollback();
        throw err;
      } finally {
        conn.release();
      }
    } else {
      // Fallback: run without real transaction (local JSON store is synchronous anyway)
      console.warn('⚠️ Transaction requested but MySQL unavailable. Running without transaction guarantee.');
      const fakeConn = {
        query: async (sql, params) => [emulateSqlQuery(sql, params), null],
        execute: async (sql, params) => [emulateSqlQuery(sql, params), null],
      };
      return fn(fakeConn);
    }
  },

  /**
   * Gracefully close the MySQL pool and stop health checks.
   * Safe to call even if MySQL was never initialised.
   */
  async close() {
    if (healthCheckTimer) {
      clearInterval(healthCheckTimer);
      healthCheckTimer = null;
    }
    if (pool) {
      try {
        await pool.end();
        console.log('🔌 MySQL connection pool closed.');
      } catch (err) {
        console.warn('⚠️ Error closing MySQL pool:', err?.message || err);
      }
      pool = null;
      mysqlWorking = false;
    }
  },

  /**
   * Returns whether the MySQL pool is currently active and verified.
   */
  get isMySqlActive() {
    return mysqlWorking;
  }
};

export default db;
