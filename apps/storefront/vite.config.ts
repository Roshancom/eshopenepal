import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  const backendUrl = process.env.VITE_API_URL || process.env.BACKEND_URL || 'http://localhost:3001';
  // Derive the base backend URL (strip /api suffix if VITE_API_URL includes it)
  const backendBaseUrl = backendUrl.replace(/\/api$/, '');

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '../../'),
      },
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
        '/uploads': {
          target: backendBaseUrl,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
