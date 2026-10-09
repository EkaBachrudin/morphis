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
const dir = join(root, 'packages', 'components', name);
const srcDir = join(dir, 'src');
const tag = `ui-${name}`;
const className = `Ui${name
  .split('-')
  .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
  .join('')}`;

if (existsSync(dir) && !force) {
  console.error(`Komponen "${name}" sudah ada di ${dir}. Gunakan --force untuk menimpa.`);
  process.exit(1);
}

mkdirSync(srcDir, { recursive: true });

const files = {
  [`${name}.css`]: `@reference "../../../../src/styles/base.css";

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
  [`${name}.markup.html`]: `<!-- Consumer markup — paste into Twig or plain HTML. Load @morphis/${name} (dist/${name}.js atau ${name}.iife.js) + @morphis/tokens tokens.css once. -->
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
  [`${name}.mdx`]: `import { Meta, Canvas, Controls } from '@storybook/addon-docs/blocks';
import * as Stories from './${name}.stories';
import '@morphis/component-meta/component-api';

<Meta of={Stories} />

# ${tag}

<ui-component-version tag="${tag}"></ui-component-version>

## Contoh

<Canvas of={Stories.Default} />

## Snippet penggunaan

<Canvas of={Stories.Snippet} />

## API

<Controls of={Stories.Default} />

<ui-component-api tag="${tag}"></ui-component-api>
`,
  [`${name}.stories.ts`]: `import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { ${className} } from './${name}';
import { renderSnippet } from '@morphis/component-meta/snippet-story';

const meta: Meta = {
  title: 'Components/${className}',
  component: '${tag}',
  render: () => document.createElement('${tag}') as ${className},
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const Snippet: Story = {
  render: (_args, context) => renderSnippet('${tag}', context.globals),
};
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
  [`package.json`]: `${JSON.stringify(
    {
      name: `@morphis/${name}`,
      version: '0.1.0',
      description: `Framework-agnostic ${name} Web Component by Morphis`,
      license: 'MIT',
      author: 'Morphis',
      type: 'module',
      main: `./dist/${name}.js`,
      module: `./dist/${name}.js`,
      types: `./dist/types/${name}.d.ts`,
      exports: {
        '.': {
          types: `./dist/types/${name}.d.ts`,
          default: `./dist/${name}.js`,
        },
        './markup': `./dist/${name}.html`,
      },
      files: ['dist'],
      sideEffects: ['**/*.js'],
      publishConfig: { access: 'public' },
      dependencies: { '@morphis/core': '^0.1.0' },
    },
    null,
    2,
  )}\n`,
  [`tsconfig.json`]: `${JSON.stringify(
    {
      extends: '../../../tsconfig.package.json',
      compilerOptions: {
        rootDir: 'src',
        outDir: 'dist/types',
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.stories.ts', 'src/**/*.test.ts'],
    },
    null,
    2,
  )}\n`,
};

for (const [file, content] of Object.entries(files)) {
  const target = file === 'package.json' || file === 'tsconfig.json' ? join(dir, file) : join(srcDir, file);
  writeFileSync(target, content);
}

const metaIndexPath = join(root, 'packages', 'components', 'src', 'index.ts');
const importLine = `import '@morphis/${name}';`;
const exportLine = `export * from '@morphis/${name}';`;

let index = readFileSync(metaIndexPath, 'utf8');
if (!index.includes(importLine)) {
  const lines = index.split('\n').filter((line) => line.trim() !== '');
  const imports = lines.filter((line) => line.startsWith('import '));
  const exports = lines.filter((line) => line.startsWith('export '));
  imports.push(importLine);
  exports.push(exportLine);
  imports.sort();
  exports.sort();
  index = `${[...imports, '', ...exports].join('\n')}\n`;
  writeFileSync(metaIndexPath, index);
}

console.log(`Komponen dibuat: packages/components/${name}/`);
for (const file of Object.keys(files)) {
  const target = file === 'package.json' || file === 'tsconfig.json' ? '' : 'src/';
  console.log(`  - ${target}${file}`);
}
console.log(`Terdaftar di packages/components/src/index.ts sebagai <${tag}>.`);
console.log('Langkah berikut: npm install (link workspace) lalu npm run build.');
