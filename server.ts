// IMPORTANT: dotenv must be loaded FIRST, before any other imports
import 'dotenv/config';

import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import db from './apps/backend/config/db.js';

// Route imports
import authRoutes from './apps/backend/routes/authRoutes.js';
import productRoutes from './apps/backend/routes/productRoutes.js';
import categoryRoutes from './apps/backend/routes/categoryRoutes.js';
import cartRoutes from './apps/backend/routes/cartRoutes.js';
import couponRoutes from './apps/backend/routes/couponRoutes.js';
import orderRoutes from './apps/backend/routes/orderRoutes.js';
import billingRoutes from './apps/backend/routes/billingRoutes.js';
import customerRoutes from './apps/backend/routes/customerRoutes.js';
import reportRoutes from './apps/backend/routes/reportRoutes.js';

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // CORS — use ALLOWED_ORIGIN in production, permissive in dev
  const allowedOrigin = process.env.ALLOWED_ORIGIN;
  app.use(cors({
    origin: allowedOrigin || true,
    credentials: true
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Ensure upload subdirectory exists and serve static uploads
  const uploadsDir = path.join(process.cwd(), 'apps', 'backend', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
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

  // Payment config check for frontend Stripe integration
  app.get('/api/payments/config', (req, res) => {
    const hasStripeKeys = !!(process.env.STRIPE_PUBLIC_KEY && process.env.STRIPE_SECRET_KEY);
    res.json({
      stripeEnabled: hasStripeKeys,
      publicKey: process.env.STRIPE_PUBLIC_KEY || null
    });
  });

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // ── Frontend Serving ───────────────────────────────────────────────────
  if (process.env.NODE_ENV !== 'production' && process.env.DISABLE_HMR !== 'true') {
    // Development: use Vite middleware for HMR
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      // Production: serve compiled static assets
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      // AI Studio / sandbox mode: Vite without HMR
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    }
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 eShopNepal server running at http://0.0.0.0:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });

  // ── Port conflict (EADDRINUSE) handling ─────────────────────────────
  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use by another process.`);
      console.error(`   Choose a different port by setting the PORT environment variable.`);
      process.exit(1);
    }
    throw err;
  });

  // ── Graceful shutdown handlers ──────────────────────────────────────
  function shutdownGracefully(signal) {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await db.close();
      console.log('👋 Server stopped.');
      process.exit(0);
    });
    // Force exit if graceful shutdown takes too long
    setTimeout(() => {
      console.error('⚠️ Forced shutdown after timeout.');
      process.exit(1);
    }, 10000).unref();
  }

  process.on('SIGTERM', () => shutdownGracefully('SIGTERM'));
  process.on('SIGINT', () => shutdownGracefully('SIGINT'));
}

startServer();
