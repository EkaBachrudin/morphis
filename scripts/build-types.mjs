import { spawnSync } from 'node:child_process';
import { globSync } from 'glob';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const componentConfigs = globSync('packages/components/*/tsconfig.json', { cwd: root }).sort();
const configs = [
  ...componentConfigs,
  'packages/components/tsconfig.json',
  'packages/react/tsconfig.json',
];

for (const config of configs) {
  const result = spawnSync('npx', ['tsc', '-p', config], { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log(`types -> ${config}`);
}
