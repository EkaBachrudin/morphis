import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['src/tokens/tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'ui',
      buildPath: 'dist/',
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
console.log('tokens -> dist/tokens.css');
