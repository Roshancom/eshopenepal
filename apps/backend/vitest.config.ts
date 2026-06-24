import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules'],
    // ESM support
    server: {
      deps: {
        inline: [/@eshopnepal\/shared/],
      },
    },
  },
  // Resolve .js imports to .ts for local modules (the backend uses .js extensions in imports)
  resolve: {
    alias: {
      // no-op — vitest handles .ts natively; .js → .ts resolution is configured below
    },
  },
});
