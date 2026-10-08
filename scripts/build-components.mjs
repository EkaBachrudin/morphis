import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'glob';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const alias = { '@morphis/core': resolve(root, 'src/core/index.ts') };

const componentEntries = Object.fromEntries(
  globSync('src/components/*/*.ts', {
    cwd: root,
    ignore: ['**/*.stories.ts', '**/*.test.ts'],
  }).map((file) => [
    file.replace(/^src\//, '').replace(/\.ts$/, ''),
    { entry: resolve(root, file) },
  ]),
);

const targets = [
  { name: 'morphis', entry: resolve(root, 'src/index.ts') },
  {
    name: 'react',
    entry: resolve(root, 'src/react/index.tsx'),
    external: ['react', 'react/jsx-runtime'],
  },
  ...Object.entries(componentEntries).map(([name, value]) => ({
    name,
    entry: value.entry,
  })),
];

// Each entry is built in its own pass so the output is fully self-contained
// (no shared Rollup chunk), which keeps `dist/components/*.js` usable via CDN.
for (const { name, entry, external } of targets) {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [tailwindcss()],
    resolve: { alias },
    build: {
      target: 'es2021',
      emptyOutDir: false,
      lib: {
        entry,
        formats: ['es'],
        fileName: () => `${name}.js`,
      },
      rollupOptions: { external: external ?? [] },
      cssCodeSplit: false,
      minify: 'esbuild',
      write: true,
    },
  });
  console.log(`components -> dist/${name}.js`);
}
