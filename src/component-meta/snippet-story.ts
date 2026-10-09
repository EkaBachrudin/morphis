import { findComponent } from './model';
import { snippetFor, type Framework } from './snippets';
import { bundleDownloadFor, downloadsFor } from './downloads';

const STYLE_ID = 'morphis-snippet-downloads-styles';

const STYLES = `
.morphis-snippet {
  margin: 0;
}
.morphis-downloads {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem 0.75rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid color-mix(in srgb, currentColor 15%, transparent);
  font-size: 0.8125rem;
}
.morphis-downloads__bundle {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  background: var(--ui-color-primary, #2563eb);
  color: var(--ui-color-on-primary, #ffffff);
  font-weight: 600;
  text-decoration: none;
}
.morphis-downloads__bundle:hover {
  background: var(--ui-color-primary-hover, #1d4ed8);
}
.morphis-downloads__title {
  font-weight: 600;
  margin-right: 0.25rem;
}
.morphis-downloads__link {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 2px;
  opacity: 0.85;
}
.morphis-downloads__link:hover {
  opacity: 1;
}
.morphis-downloads__badge {
  margin-left: 0.25rem;
  padding: 0 0.25rem;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 4px;
  font-size: 0.625rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.7;
}
`;

function ensureStyles(): void {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = STYLES;
  document.head.append(style);
}

function downloadsBlock(tag: string): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'morphis-downloads';

  const bundle = bundleDownloadFor(tag);
  const bundleLink = document.createElement('a');
  bundleLink.className = 'morphis-downloads__bundle';
  bundleLink.href = bundle.href;
  bundleLink.download = bundle.file;
  bundleLink.textContent = bundle.label;
  wrap.append(bundleLink);

  const title = document.createElement('span');
  title.className = 'morphis-downloads__title';
  title.textContent = 'atau per file';
  wrap.append(title);

  for (const item of downloadsFor(tag)) {
    const link = document.createElement('a');
    link.className = 'morphis-downloads__link';
    link.href = item.href;
    link.download = item.file;
    link.textContent = item.label;
    if (item.minified) {
      const badge = document.createElement('span');
      badge.className = 'morphis-downloads__badge';
      badge.textContent = 'min';
      link.append(badge);
    }
    wrap.append(link);
  }

  return wrap;
}

/**
 * Render snippet contoh untuk story Storybook.
 *
 * Dipanggil dari story function dengan `context.globals` (nilai toolbar
 * "Framework"). Tidak memakai preview hook (`useGlobals`) karena itu hanya
 * valid di decorator/story function, dan story ini memang story function —
 * namun membaca `context.globals` lebih sederhana dan bebas hook.
 *
 * Bila framework = `native`, snippet disertai tautan unduh file HTML, CSS, dan
 * JS (versi normal maupun minified) dari folder `downloads/`.
 */
export function renderSnippet(tag: string, globals: Record<string, unknown>): HTMLElement {
  const framework = (globals.framework as Framework) ?? 'native';
  const doc = findComponent(tag);
  const pre = document.createElement('pre');
  pre.style.margin = '0';
  const code = document.createElement('code');
  code.textContent = doc ? snippetFor(doc, framework) : `Komponen ${tag} tidak ditemukan.`;
  pre.append(code);

  if (framework !== 'native') return pre;

  ensureStyles();
  const container = document.createElement('div');
  container.className = 'morphis-snippet';
  container.append(pre, downloadsBlock(tag));
  return container;
}
