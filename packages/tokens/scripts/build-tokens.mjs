import StyleDictionary from 'style-dictionary';
import { resolve } from 'node:path';

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
console.log('tokens -> packages/tokens/dist/tokens.css');
