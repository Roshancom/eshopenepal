// IMPORTANT: dotenv must be loaded FIRST, before any other imports
import 'dotenv/config';

import app from './src/app.js';
import db from './config/db.js';

const PORT = Number(process.env.BACKEND_PORT) || Number(process.env.PORT) || 3001;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 eShopNepal API server running at http://0.0.0.0:${PORT}`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ── Port conflict (EADDRINUSE) handling ─────────────────────────────
server.on('error', (err: any) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`   Choose a different port by setting the BACKEND_PORT or PORT environment variable.`);
    process.exit(1);
  }
  throw err;
});

// ── Graceful shutdown handlers ──────────────────────────────────────
function shutdownGracefully(signal: string) {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    await db.close();
    console.log('👋 API server stopped.');
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
