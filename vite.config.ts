import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

const root = import.meta.dirname;

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: [
      { find: /^@morphis\/core$/, replacement: resolve(root, 'packages/core/src/index.ts') },
      { find: /^@morphis\/button$/, replacement: resolve(root, 'packages/components/button/src/button.ts') },
      { find: /^@morphis\/card$/, replacement: resolve(root, 'packages/components/card/src/card.ts') },
      { find: /^@morphis\/input$/, replacement: resolve(root, 'packages/components/input/src/input.ts') },
      { find: /^@morphis\/select$/, replacement: resolve(root, 'packages/components/select/src/select.ts') },
      { find: /^@morphis\/react$/, replacement: resolve(root, 'packages/react/src/index.tsx') },
      { find: /^@morphis\/component-meta$/, replacement: resolve(root, 'src/component-meta/index.ts') },
      {
        find: /^@morphis\/component-meta\/(.*)$/,
        replacement: `${resolve(root, 'src/component-meta')}/$1`,
      },
    ],
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
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'packages/**/*.test.ts', 'packages/**/*.test.tsx'],
  },
});
