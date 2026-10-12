import StyleDictionary from 'style-dictionary';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';

const root = resolve(import.meta.dirname, '..');

const sd = new StyleDictionary({
  source: [resolve(root, 'src/tokens.json')],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'ui',
      buildPath: `${resolve(root, 'dist')}/`,
      files: [
        {
          destination: 'tokens.css',
          format: 'css/variables',
          options: { outputReferences: true },
        },
      ],
    },
  },
  log: { warnings: 'warn', verbosity: 'default' },
});

await sd.buildAllPlatforms();

// Deklarasi tipe untuk side-effect import `@eka-morphis/tokens/tokens.css`,
// agar TypeScript tidak melaporkan TS2882 (css bukan modul yang bisa dibaca TS).
const dist = resolve(root, 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(resolve(dist, 'tokens.css.d.ts'), 'export {};\n');

console.log('tokens -> packages/tokens/dist/tokens.css (+ tokens.css.d.ts)');
