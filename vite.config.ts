import { defineConfig } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { litTemplate } from './scripts/vite-plugin-lit-template.mjs';

const root = import.meta.dirname;

export default defineConfig({
  plugins: [litTemplate(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^@eka-morphis\/core$/, replacement: resolve(root, 'packages/core/src/index.ts') },
      { find: /^@eka-morphis\/button$/, replacement: resolve(root, 'packages/components/button/src/button.ts') },
      { find: /^@eka-morphis\/card$/, replacement: resolve(root, 'packages/components/card/src/card.ts') },
      { find: /^@eka-morphis\/input$/, replacement: resolve(root, 'packages/components/input/src/input.ts') },
      { find: /^@eka-morphis\/select$/, replacement: resolve(root, 'packages/components/select/src/select.ts') },
      { find: /^@eka-morphis\/other-offer$/, replacement: resolve(root, 'packages/components/other-offer/src/other-offer.ts') },
      { find: /^@eka-morphis\/react$/, replacement: resolve(root, 'packages/react/src/index.tsx') },
      { find: /^@eka-morphis\/component-meta$/, replacement: resolve(root, 'src/component-meta/index.ts') },
      {
        find: /^@eka-morphis\/component-meta\/(.*)$/,
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
