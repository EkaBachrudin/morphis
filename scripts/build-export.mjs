import { copyFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'custom-elements.json');
const target = resolve(root, 'packages/components/custom-elements.json');

if (!existsSync(source)) {
  console.error('custom-elements.json belum dibuat — jalankan build:cem dulu.');
  process.exit(1);
}

copyFileSync(source, target);
console.log('manifest -> packages/components/custom-elements.json');
