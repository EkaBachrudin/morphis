import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'glob';
import { copyFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { litTemplate } from './vite-plugin-lit-template.mjs';

const root = resolve(import.meta.dirname, '..');

const aliases = {
  '@morphis/core': resolve(root, 'packages/core/src/index.ts'),
  '@morphis/button': resolve(root, 'packages/components/button/src/button.ts'),
  '@morphis/card': resolve(root, 'packages/components/card/src/card.ts'),
  '@morphis/input': resolve(root, 'packages/components/input/src/input.ts'),
  '@morphis/select': resolve(root, 'packages/components/select/src/select.ts'),
};

async function buildEntry({ entry, outDir, fileName, format, external, name }) {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [litTemplate(), tailwindcss()],
    resolve: { alias: aliases },
    build: {
      target: 'es2021',
      emptyOutDir: false,
      outDir,
      lib: {
        entry,
        formats: [format],
        fileName: () => fileName,
        ...(name ? { name } : {}),
      },
      rollupOptions: { external: external ?? [] },
      cssCodeSplit: false,
      minify: 'esbuild',
      write: true,
    },
  });
}

function pascal(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

const componentFiles = globSync('packages/components/*/src/*.ts', {
  cwd: root,
  ignore: ['**/*.stories.ts', '**/*.test.ts', '**/*.d.ts'],
});

for (const file of componentFiles) {
  const entry = resolve(root, file);
  const pkgDir = resolve(root, dirname(dirname(file)));
  const name = basename(pkgDir);
  const outDir = join(pkgDir, 'dist');

  // ESM per komponen: `lit` + `@morphis/core` di-external agar konsumen
  // (bundler) men-dedupe runtime dan komponen tetap tree-shakable.
  await buildEntry({
    entry,
    outDir,
    fileName: `${name}.js`,
    format: 'es',
    external: [/^lit($|\/)/, '@morphis/core'],
  });
  // IIFE untuk Drupal: self-contained (Lit + core ikut dibundel).
  await buildEntry({
    entry,
    outDir,
    fileName: `${name}.iife.js`,
    format: 'iife',
    name: `Morphis${pascal(name)}`,
  });

  mkdirSync(outDir, { recursive: true });
  copyFileSync(
    join(pkgDir, 'src', `${name}.markup.html`),
    join(outDir, `${name}.html`),
  );

  console.log(`components -> packages/components/${name}/dist (${name}.js, ${name}.iife.js, ${name}.html)`);
}

await buildEntry({
  entry: resolve(root, 'packages/components/src/index.ts'),
  outDir: resolve(root, 'packages/components/dist'),
  fileName: 'morphis.js',
  format: 'es',
});
copyFileSync(
  resolve(root, 'packages/tokens/dist/tokens.css'),
  resolve(root, 'packages/components/dist/tokens.css'),
);
console.log('components -> packages/components/dist (morphis.js, tokens.css)');

await buildEntry({
  entry: resolve(root, 'packages/react/src/index.tsx'),
  outDir: resolve(root, 'packages/react/dist'),
  fileName: 'react.js',
  format: 'es',
  external: ['react', 'react/jsx-runtime', /^@morphis\//],
});
console.log('components -> packages/react/dist (react.js)');
