import { defineConfig, type Plugin } from 'vitest/config';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';

// Custom elements can't be re-registered via `customElements.define`, so any
// change under src/ must trigger a full page reload (not an in-place HMR update).
function fullReloadOnSourceChange(): Plugin {
  return {
    name: 'morphis:full-reload',
    apply: 'serve',
    hotUpdate({ file }) {
      if (file.replace(/\\/g, '/').includes('/src/')) {
        this.environment.hot.send({ type: 'full-reload' });
        return [];
      }
      return undefined;
    },
  };
}

export default defineConfig({
  plugins: [tailwindcss(), fullReloadOnSourceChange()],
  resolve: {
    alias: { '@morphis/core': resolve(import.meta.dirname, 'src/core/index.ts') },
  },
  server: {
    port: 5173,
    open: '/',
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
