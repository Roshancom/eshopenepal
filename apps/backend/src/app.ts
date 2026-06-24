// IMPORTANT: dotenv must be loaded FIRST, before any other imports
import 'dotenv/config';

import express from 'express';
import fs from 'fs';
import cors from 'cors';
import db from '../config/db.js';
import { resolveBackendDir, normalizeImageUrls } from './utils/paths.js';

// Route imports
import authRoutes from '../routes/authRoutes.js';
import productRoutes from '../routes/productRoutes.js';
import categoryRoutes from '../routes/categoryRoutes.js';
import cartRoutes from '../routes/cartRoutes.js';
import couponRoutes from '../routes/couponRoutes.js';
import orderRoutes from '../routes/orderRoutes.js';
import billingRoutes from '../routes/billingRoutes.js';
import customerRoutes from '../routes/customerRoutes.js';
import reportRoutes from '../routes/reportRoutes.js';
import esewaRoutes from '../routes/esewaRoutes.js';

const app = express();

// CORS — allow the frontend dev server origin
const allowedOrigins: string[] = [
  process.env.ALLOWED_ORIGIN,
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
].filter((x): x is string => Boolean(x));

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Response middleware: normalize image_url to absolute URLs ────────
// Must be registered BEFORE route handlers so res.json is intercepted.
app.use((req, res, next) => {
  const origJson = res.json.bind(res);
  res.json = (body: unknown) => origJson(normalizeImageUrls(req, body));
  next();
});

const uploadsDir = resolveBackendDir('uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch {
  // Filesystem may be read-only (e.g. Vercel serverless) — skip silently
}
app.use('/uploads', express.static(uploadsDir));

// ── API Routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/esewa', esewaRoutes);

// Payment config check for frontend Stripe integration
app.get('/api/payments/config', (req, res) => {
  const hasStripeKeys = !!(process.env.STRIPE_PUBLIC_KEY && process.env.STRIPE_SECRET_KEY);
  res.json({
    stripeEnabled: hasStripeKeys,
    publicKey: process.env.STRIPE_PUBLIC_KEY || null,
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

export default app;
