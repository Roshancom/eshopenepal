# Checkout Issue Analysis Report

## Issue Summary

Placing an order from the checkout page fails with the error:
> **"Server error placing order"**

This is a generic 500 Internal Server Error returned by the backend at `POST /api/orders/place`.

---

## Checkout Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ CHECKOUT FLOW (End-to-End)                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [CheckoutView.tsx]                                              │
│       │ User fills billing form, clicks "Place Order"            │
│       ▼                                                          │
│  [App.tsx] handlePlaceOrder()                                    │
│       │                                                          │
│       │  1. billingApi.save(checkoutBilling)                     │
│       │     → POST /api/billing (saves billing address)          │
│       │                                                          │
│       │  2. ordersApi.place({ payment_method, coupon_code })     │
│       │     → POST /api/orders/place                             │
│       ▼                                                          │
│  [Backend: api-server.ts → src/app.ts → routes/orderRoutes.ts]   │
│       │                                                          │
│       │  authMiddleware → placeOrder()                           │
│       ▼                                                          │
│  [OrderController.ts: placeOrder]                                │
│       │                                                          │
│       │  1. SELECT cart items JOIN products (validate stock)     │
│       │  2. Calculate total amount                               │
│       │  3. Apply coupon if provided                             │
│       │  4. pool.transaction():                                  │
│       │     ├─ INSERT INTO orders                                │
│       │     ├─ INSERT INTO order_items (per cart item)           │
│       │     ├─ UPDATE products SET stock = stock - quantity      │
│       │     └─ DELETE FROM cart WHERE user_id = ?                │
│       │                                                          │
│       │  5. Return 201 { orderId, total_amount } on success      │
│       │     Return 500 { error: "Server error placing order" }   │
│       │          on exception                                    │
│       ▼                                                          │
│  [config/db.js]                                                  │
│       │                                                          │
│       │  Dual database layer:                                    │
│       │  ├─ MySQL (via mysql2/promise) ← real connection         │
│       │  └─ JSON file fallback (data_store.json)                 │
│       │                                                          │
│       │  Importantly: db.query()  → has MySQL→JSON fallback      │
│       │                db.transaction() → NO MySQL fallback      │
│       │                                                          │
│       ▼                                                          │
│  [Database]                                                      │
│       ├─ MySQL: Aiven Cloud (mysql://...aivencloud.com:19368)    │
│       └─ JSON: apps/backend/data_store.json                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Likely Root Cause

### 🔴 Primary: `db.transaction()` lacks MySQL→JSON fallback

The `db.transaction()` method in `config/db.js` has **two code paths**:

| Path | Condition | Behavior on Error |
|------|-----------|-------------------|
| MySQL | `mysqlWorking && pool` | ❌ **Throws error — no fallback** |
| JSON | else (fallback) | ✅ Uses `fakeConn` → `emulateSqlQuery` |

In contrast, `db.query()` (used by registration, cart, billing, etc.) **always has a fallback**:

```javascript
// db.query() — has fallback
async query(sql, params = []) {
    if (mysqlWorking && pool) {
      try {
        return await pool.query(sql, params);
      } catch (err) {
        // ✅ Falls back to JSON store
        return [emulateSqlQuery(sql, params), null];
      }
    }
    return [emulateSqlQuery(sql, params), null];
},
```

```javascript
// db.transaction() — NO fallback when mysqlWorking is true
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
        throw err;  // ❌ Throws to caller — no JSON fallback
      } finally {
        conn.release();
      }
    } else {
      // Fallback: fakeConn → emulateSqlQuery
    }
},
```

**This means:**
- If MySQL is reachable (`mysqlWorking = true`) but:
  - Tables don't exist (seed never run on MySQL)
  - Schema has mismatched columns/constraints
  - Foreign key constraint fails
- The transaction throws an unhandled error
- The error propagates to `placeOrder`'s catch block → returns 500 "Server error placing order"

**All non-transaction operations** (login, registration, cart add/update, billing save) succeed because `db.query()` gracefully catches MySQL errors and falls back to the JSON store.

---

## Error Location

| Component | Layer | Role |
|-----------|-------|------|
| `config/db.js` — `transaction()` method | **Backend / DB Layer** | Missing error fallback |
| `controllers/OrderController.ts` — line 91 | Backend / Controller | Generic catch block masks root cause |
| `storefront/src/App.tsx` — `handlePlaceOrder` | Frontend | Propagates error to toast |

The actual error originates from the **database transaction layer** (`db.transaction()`), but the controller's generic catch block (line 90-91) swallows the real error:

```typescript
} catch (err: any) {
    console.error('Place order error:', err);  // Only logged to server console
    return res.status(500).json({ error: 'Server error placing order' });  // Generic message
}
```

---

## Secondary Issues Found

### 1. INSERT INTO orders — status column param mismatch

In `OrderController.ts` line 56:
```sql
INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, "Pending")
```
With params: `[userId, total, finalPaymentMethod]` (3 params for 4 columns).

In the JSON store fallback, the `emulateSqlQuery` function maps params by index, so `row.status` becomes `undefined` instead of `"Pending"`.

**Impact:** Low — status gets a default `"Pending"` from the DB schema default in MySQL; in JSON store it's set to `undefined`.

### 2. Server logs don't forward errors to client

The `console.error('Place order error:', err)` on line 90 logs the real error to the server console, but the client only sees "Server error placing order". This makes debugging harder.

### 3. The JWT_SECRET uses a placeholder value

```env
JWT_SECRET=replace_with_a_64_char_random_secret_here
```

This is insecure but not related to the checkout error.

---

## Fix Recommendations

### 🔴 P0 — Add JSON store fallback to `db.transaction()`

Modify `db.transaction()` in `config/db.js` to catch MySQL errors and fall back to the JSON store, similar to `db.query()`:

```javascript
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
        // ⬇️ ADD: Fall back to JSON store like db.query() does
        console.warn('⚠️ MySQL transaction error, falling back to local store:', err?.message || err);
        const fakeConn = {
          query: async (sql, params) => [emulateSqlQuery(sql, params), null],
          execute: async (sql, params) => [emulateSqlQuery(sql, params), null],
        };
        return fn(fakeConn);
      } finally {
        conn.release();
      }
    } else {
      // Existing fallback
    },
```

### 🟡 P1 — Run seed on MySQL database

Ensure the database schema is created by running:
```bash
cd apps/backend && npx tsx seed.js
```

This creates all required tables (`orders`, `order_items`, etc.) in the MySQL database so that transactions don't fail due to missing tables or constraints.

### 🟡 P1 — Improve error reporting in `placeOrder`

Include the real error in the response for easier debugging (in development):

```typescript
} catch (err: any) {
    console.error('Place order error:', err);
    const message = process.env.NODE_ENV === 'development'
      ? `Server error: ${err.message}`
      : 'Server error placing order';
    return res.status(500).json({ error: message });
}
```

### 🟢 P2 — Fix INSERT INTO orders status param

Pass `"Pending"` as a parameter instead of hardcoding it in SQL:

```typescript
const [orderResult] = await conn.query(
  'INSERT INTO orders (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, ?)',
  [userId, total, finalPaymentMethod, 'Pending']
);
```

---

## Conclusion

The root cause is an **inconsistency between `db.query()` (has MySQL→JSON fallback) and `db.transaction()` (no fallback)** in `config/db.js`. All non-transactional operations work because they fall back gracefully to the JSON store when MySQL fails, but the order placement (which uses a transaction) throws an unhandled 500 error.

The fix is to add the same fallback logic to `db.transaction()` that already exists in `db.query()`, and/or ensure the MySQL database is properly seeded with the correct schema.
