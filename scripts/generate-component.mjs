import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const rawArgs = process.argv.slice(2);
const args = rawArgs[0] === 'component' ? rawArgs.slice(1) : rawArgs;
const [name, ...flags] = args;

if (!name) {
  console.error('Usage: npm run gen -- component <name>   (contoh: npm run gen -- component badge)');
  process.exit(1);
}

if (!/^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(name)) {
  console.error(`Nama komponen "${name}" tidak valid. Gunakan kebab-case, mis. "badge" atau "data-table".`);
  process.exit(1);
}

const force = flags.includes('--force');
const dir = join(root, 'src', 'components', name);
const tag = `ui-${name}`;
const className = `Ui${name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')}`;

if (existsSync(dir) && !force) {
  console.error(`Komponen "${name}" sudah ada di ${dir}. Gunakan --force untuk menimpa.`);
  process.exit(1);
}

mkdirSync(dir, { recursive: true });

const files = {
  [`${name}.css`]: `@reference "../../styles/base.css";

:host {
  --color-surface: var(--ui-color-surface, #ffffff);
  --color-on-surface: var(--ui-color-on-surface, #111827);
  --color-border: var(--ui-color-border, #e5e7eb);
}

:host([hidden]) {
  display: none;
}

@layer components {
  .ui-${name} {
    @apply flex flex-col gap-2 rounded-md border border-border bg-surface p-4 text-on-surface;
  }
}
`,
  [`${name}.template.html`]: `<div class="ui-${name}" part="root">
  <slot></slot>
</div>
`,
  [`${name}.markup.html`]: `<!-- Consumer markup — paste into Twig or plain HTML. Load dist/morphis.js + dist/tokens.css once. -->
<${tag}>Konten</${tag}>
`,
  [`${name}.ts`]: `import { MorphisElement, define, interpolate } from '@morphis/core';
import style from './${name}.css?inline';
import template from './${name}.template.html?raw';

/**
 * Komponen ${tag}.
 *
 * @element ${tag}
 *
 * @slot - Konten utama.
 *
 * @csspart root - Elemen pembungkus.
 *
 * @cssprop [--ui-color-surface=#ffffff] - Warna latar.
 * @cssprop [--ui-color-on-surface=#111827] - Warna teks.
 * @cssprop [--ui-color-border=#e5e7eb] - Warna border.
 */
export class ${className} extends MorphisElement {
  static override styles = [style];
  static override template = template;

  static get observedAttributes(): string[] {
    return ['label'];
  }

  get label(): string {
    return this.getAttribute('label') ?? '';
  }

  set label(value: string) {
    this.setAttribute('label', value);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  protected override renderTemplate(): void {
    this.root.innerHTML = interpolate(${className}.template, { label: this.label });
  }
}

define('${tag}', ${className});
`,
  [`${name}.stories.ts`]: `import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { ${className} } from './${name}';

const meta: Meta = {
  title: 'Components/${className}',
  component: '${tag}',
  tags: ['autodocs'],
  render: () => document.createElement('${tag}') as ${className},
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};
`,
  [`${name}.test.ts`]: `import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing';
import { ${className} } from './${name}';

describe('${tag}', () => {
  it('registers the custom element', () => {
    expect(customElements.get('${tag}')).toBe(${className});
  });

  it('renders a shadow root with the root part', async () => {
    const el = await fixture<${className}>(html\`<${tag}>Konten</${tag}>\`);
    expect(el.shadowRoot?.querySelector('[part="root"]')).not.toBeNull();
  });
});
`,
};

for (const [file, content] of Object.entries(files)) {
  writeFileSync(join(dir, file), content);
}

const indexPath = join(root, 'src', 'index.ts');
const importLine = `import './components/${name}/${name}';`;
const exportLine = `export * from './components/${name}/${name}';`;

let index = readFileSync(indexPath, 'utf8');
if (!index.includes(importLine)) {
  const lines = index.split('\n').filter((line) => line.trim() !== '');
  const imports = lines.filter((line) => line.startsWith('import ')).sort();
  const exports = lines.filter((line) => line.startsWith('export ')).sort();
  imports.push(importLine);
  exports.push(exportLine);
  imports.sort();
  exports.sort();
  index = `${[...imports, '', ...exports].join('\n')}\n`;
  writeFileSync(indexPath, index);
}

console.log(`Komponen dibuat: src/components/${name}/`);
for (const file of Object.keys(files)) console.log(`  - ${file}`);
console.log(`Terdaftar di src/index.ts sebagai <${tag}>.`);
