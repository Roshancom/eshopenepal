# 🛍️ eShopNepal — Full-Stack eCommerce Platform

A production-ready full-stack eCommerce store built with **Express.js**, **React + Vite**, **Tailwind CSS**, and **MySQL**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
```

Edit `.env` and set the required values:

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default: `3000`) |
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | 64-char random secret for JWT signing |
| `NODE_ENV` | `development` or `production` |

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Seed the Database (first-time setup)
```bash
npm run seed
```

This creates all tables and populates demo data:
- **Admin**: `admin@shop.com` / `admin123`
- **Customers**: `john@shop.com` / `user123` (and 4 others)
- **Coupons**: `SAVE10` (10%), `FLAT20` (20%), `WELCOME5` (5%)
- **15 products** across 5 categories

### 4. Start Development Server
```bash
npm run dev
```

Opens at **http://localhost:3000** — API and frontend served together.

---

## 🗄️ Database

### MySQL Connection
Set `DATABASE_URL` in your `.env`:
```env
DATABASE_URL=mysql://user:password@host:port/dbname?ssl-mode=REQUIRED
```

**Local fallback**: If `DATABASE_URL` is not set or MySQL is unreachable, the app automatically uses a local JSON file (`backend/data_store.json`) for persistence. All features work in fallback mode.

### Connection Status
On startup, the server logs:
- `✅ MySQL connection verified and active.` — connected to real MySQL
- `⚠️ MySQL unavailable, falling back to local JSON store` — using JSON fallback

---

## 🏗️ Project Structure

```
eshopnepal/
├── server.ts              # Unified Express + Vite server entry point
├── vite.config.ts         # Vite/React build config
├── package.json
├── .env                   # Your local config (never commit this)
├── .env.example           # Template for .env
│
├── src/                   # React frontend (Vite SPA)
│   ├── main.tsx
│   ├── App.tsx
│   ├── types.ts
│   ├── components/        # Reusable UI components
│   ├── context/           # React contexts (Auth, Cart)
│   └── utils/
│       └── api.ts         # Axios API client
│
└── backend/               # Express API
    ├── config/
    │   └── db.js          # MySQL pool + local JSON fallback
    ├── controllers/       # Business logic
    ├── routes/            # Express route definitions
    ├── middleware/
    │   └── auth.ts        # JWT authentication
    └── seed.js            # Database seeder
```

---

## 📋 API Routes

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register consumer |
| POST | `/api/auth/login` | Public | Consumer login |
| POST | `/api/auth/admin/login` | Public | Admin login |
| GET | `/api/auth/me` | User | Get current user |
| GET | `/api/products` | Public | List products |
| GET | `/api/products/:id` | Public | Product detail |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/:id` | Admin | Update product |
| DELETE | `/api/products/:id` | Admin | Delete product |
| GET | `/api/categories` | Public | List categories |
| POST | `/api/categories` | Admin | Create category |
| GET | `/api/cart` | User | Get cart |
| POST | `/api/cart/add` | User | Add to cart |
| PUT | `/api/cart/update` | User | Update quantity |
| DELETE | `/api/cart/remove/:id` | User | Remove item |
| POST | `/api/orders/place` | User | Place order |
| GET | `/api/orders/my-orders` | User | My orders |
| GET | `/api/orders` | Admin | All orders |
| PUT | `/api/orders/:id/status` | Admin | Update status |
| GET | `/api/billing` | User | Get billing address |
| POST | `/api/billing` | User | Save billing address |
| GET | `/api/coupons` | Admin | List coupons |
| POST | `/api/coupons/apply` | User | Apply coupon |
| POST | `/api/coupons` | Admin | Create coupon |
| GET | `/api/reports/sales` | Admin | Sales report |
| GET | `/api/reports/top-products` | Admin | Top products |
| GET | `/api/health` | Public | Health check |

---

## 🏭 Production Build

```bash
npm run build
npm start
```

Set `NODE_ENV=production` in your environment. The production server serves the compiled React SPA from `dist/`.

---

## 🔒 Security Notes

- JWT tokens stored in `httpOnly` cookies (not accessible from JavaScript)
- Cookies are `secure: true` + `sameSite: strict` in production
- File uploads are validated for type (JPEG/PNG/WebP/GIF) and size (max 5MB)
- Restrict `ALLOWED_ORIGIN` in production to your frontend domain
