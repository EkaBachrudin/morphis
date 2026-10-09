import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: { '@morphis/core': resolve(import.meta.dirname, 'src/core/index.ts') },
  },
  build: {
    target: 'es2021',
    emptyOutDir: false,
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});
