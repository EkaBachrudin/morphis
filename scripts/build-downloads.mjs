import { build } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'glob';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename, join } from 'node:path';
import { crc32, deflateRawSync } from 'node:zlib';
import { litTemplate } from './vite-plugin-lit-template.mjs';

const root = resolve(import.meta.dirname, '..');

const aliases = {
  '@morphis/core': resolve(root, 'packages/core/src/index.ts'),
  '@morphis/button': resolve(root, 'packages/components/button/src/button.ts'),
  '@morphis/card': resolve(root, 'packages/components/card/src/card.ts'),
  '@morphis/input': resolve(root, 'packages/components/input/src/input.ts'),
  '@morphis/select': resolve(root, 'packages/components/select/src/select.ts'),
  '@morphis/other-offer': resolve(root, 'packages/components/other-offer/src/other-offer.ts'),
};

const tokensCss = resolve(root, 'packages/tokens/dist/tokens.css');
const downloadsDir = resolve(root, 'downloads');

function pascal(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
}

function stripComment(html) {
  return html.replace(/^\s*<!--[\s\S]*?-->\s*/, '').trim();
}

function minifyHtml(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n/g, '')
    .trim();
}

function minifyCss(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{}:;,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim();
}

function exampleHtml({ name, markup, tokens, bundle }) {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Morphis — ${name}</title>
    <link rel="stylesheet" href="${tokens}" />
    <style>
      body {
        font-family: system-ui, sans-serif;
        margin: 0;
        padding: 2rem;
      }
      :not(:defined) {
        visibility: hidden;
      }
    </style>
  </head>
  <body>
    ${markup}
    <script src="${bundle}"></script>
  </body>
</html>
`;
}

async function buildIife({ entry, outFile, name, minify }) {
  await build({
    root,
    configFile: false,
    logLevel: 'warn',
    plugins: [litTemplate(), tailwindcss()],
    resolve: { alias: aliases },
    build: {
      target: 'es2021',
      emptyOutDir: false,
      outDir: dirname(outFile),
      lib: {
        entry,
        formats: ['iife'],
        name: `Morphis${pascal(name)}`,
        fileName: () => basename(outFile),
      },
      cssCodeSplit: false,
      minify: minify ? 'esbuild' : false,
      write: true,
    },
  });
}

function zipFiles(entries) {
  const chunks = [];
  const central = [];
  let offset = 0;

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.path, 'utf8');
    const data = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8');
    const crc = crc32(data) >>> 0;
    const compressed = deflateRawSync(data);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(compressed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(nameBuf.length, 26);

    chunks.push(local, nameBuf, compressed);

    const dir = Buffer.alloc(46);
    dir.writeUInt32LE(0x02014b50, 0);
    dir.writeUInt16LE(20, 4);
    dir.writeUInt16LE(20, 6);
    dir.writeUInt16LE(0x0800, 8);
    dir.writeUInt16LE(8, 10);
    dir.writeUInt16LE(0, 12);
    dir.writeUInt16LE(0x21, 14);
    dir.writeUInt32LE(crc, 16);
    dir.writeUInt32LE(compressed.length, 20);
    dir.writeUInt32LE(data.length, 24);
    dir.writeUInt16LE(nameBuf.length, 28);
    dir.writeUInt32LE(offset, 42);

    central.push(dir, nameBuf);
    offset += local.length + nameBuf.length + compressed.length;
  }

  const centralBuf = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);

  return Buffer.concat([...chunks, centralBuf, end]);
}

if (!existsSync(tokensCss)) {
  console.error('tokens.css belum dibuat — jalankan build:tokens dulu.');
  process.exit(1);
}

const tokensSource = readFileSync(tokensCss, 'utf8');
const tokensMin = minifyCss(tokensSource);

const componentFiles = globSync('packages/components/*/src/*.ts', {
  cwd: root,
  ignore: ['**/*.stories.ts', '**/*.test.ts', '**/*.d.ts'],
});

for (const file of componentFiles) {
  const entry = resolve(root, file);
  const pkgDir = resolve(root, dirname(dirname(file)));
  const name = basename(pkgDir);
  const outDir = join(downloadsDir, name);
  mkdirSync(outDir, { recursive: true });

  const iife = join(outDir, `${name}.iife.js`);
  const iifeMin = join(outDir, `${name}.iife.min.js`);

  await buildIife({ entry, outFile: iife, name, minify: false });
  await buildIife({ entry, outFile: iifeMin, name, minify: true });

  const markupFile = join(pkgDir, 'src', `${name}.markup.html`);
  const markup = stripComment(readFileSync(markupFile, 'utf8'));

  const example = exampleHtml({
    name,
    markup,
    tokens: 'tokens.css',
    bundle: `${name}.iife.js`,
  });
  const exampleMin = exampleHtml({
    name,
    markup,
    tokens: 'tokens.min.css',
    bundle: `${name}.iife.min.js`,
  });

  const files = [
    ['index.html', example],
    ['index.min.html', minifyHtml(exampleMin)],
    ['tokens.css', tokensSource],
    ['tokens.min.css', tokensMin],
    [`${name}.iife.js`, readFileSync(iife)],
    [`${name}.iife.min.js`, readFileSync(iifeMin)],
  ];

  for (const [fileName, data] of files) {
    writeFileSync(join(outDir, fileName), data);
  }

  const zip = zipFiles(files.map(([fileName, data]) => ({ path: `${name}/${fileName}`, data })));
  writeFileSync(join(outDir, `${name}.zip`), zip);

  console.log(
    `downloads -> downloads/${name} (index.html, index.min.html, tokens.css, tokens.min.css, ${name}.iife.js, ${name}.iife.min.js, ${name}.zip)`,
  );
}
