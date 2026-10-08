import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const componentsDir = join(root, 'src', 'components');
const outDir = join(root, 'dist', 'markup');

mkdirSync(outDir, { recursive: true });

let count = 0;
for (const entry of readdirSync(componentsDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const dir = join(componentsDir, entry.name);
  for (const file of readdirSync(dir)) {
    if (!file.endsWith('.markup.html')) continue;
    const name = file.replace('.markup.html', '');
    const source = readFileSync(join(dir, file), 'utf8');
    writeFileSync(join(outDir, `${name}.html`), source);
    count += 1;
  }
}

console.log(`markup -> dist/markup (${count} file)`);
