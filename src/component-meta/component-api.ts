import { define } from '@morphis/core';
import { findComponent, type ComponentDoc } from './model';
import './component-version';

const STYLE_ID = 'morphis-component-api-styles';

const STYLES = `
.morphis-api {
  margin: 0 0 1.5rem;
  color: inherit;
}
.morphis-api h3 {
  margin: 1.5rem 0 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.4;
}
.morphis-api h3:first-child {
  margin-top: 0;
}
.morphis-api table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}
.morphis-api th,
.morphis-api td {
  padding: 0.5rem 0.75rem;
  text-align: left;
  vertical-align: top;
  border: 1px solid color-mix(in srgb, currentColor 20%, transparent);
}
.morphis-api th {
  font-weight: 600;
  background: color-mix(in srgb, currentColor 6%, transparent);
}
.morphis-api code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9em;
}
.morphis-api .empty {
  margin: 0 0 0.5rem;
  font-style: italic;
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

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function code(value: string | undefined): string {
  return value ? `<code>${esc(value)}</code>` : '—';
}

function cell(value: string | undefined): string {
  return value?.trim() ? esc(value).replace(/\n/g, ' ') : '—';
}

function table(headers: string[], rows: string[][]): string {
  if (rows.length === 0) return '<p class="empty">Tidak ada.</p>';
  const head = `<tr>${headers.map((header) => `<th>${header}</th>`).join('')}</tr>`;
  const body = rows
    .map((row) => `<tr>${row.map((value) => `<td>${value}</td>`).join('')}</tr>`)
    .join('');
  return `<table><thead>${head}</thead><tbody>${body}</tbody></table>`;
}

function renderDoc(doc: ComponentDoc): string {
  const attributes = table(
    ['Nama', 'Tipe', 'Default', 'Deskripsi'],
    doc.attrs.map((a) => [code(a.name), code(a.type), code(a.default), cell(a.description)]),
  );
  const events = table(
    ['Nama', 'Tipe', 'Deskripsi'],
    doc.events.map((e) => [code(e.name), code(e.type), cell(e.description)]),
  );
  const slots = table(
    ['Nama', 'Deskripsi'],
    doc.slots.map((s) => [code(s.name), cell(s.description)]),
  );
  const parts = table(
    ['Nama', 'Deskripsi'],
    doc.parts.map((p) => [code(p.name), cell(p.description)]),
  );
  const cssProps = table(
    ['Custom property', 'Default', 'Deskripsi'],
    doc.cssProps.map((p) => [code(p.name), code(p.default), cell(p.description)]),
  );

  return `
<div class="morphis-api">
  <h3>Attributes</h3>
  ${attributes}
  <h3>Events</h3>
  ${events}
  <h3>Slots</h3>
  ${slots}
  <h3>CSS Parts</h3>
  ${parts}
  <h3>CSS Custom Properties</h3>
  ${cssProps}
</div>`;
}

export class UiComponentApi extends HTMLElement {
  static get observedAttributes(): string[] {
    return ['tag'];
  }

  get tag(): string {
    return this.getAttribute('tag') ?? '';
  }

  set tag(value: string) {
    this.setAttribute('tag', value);
  }

  connectedCallback(): void {
    this.render();
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  private render(): void {
    const doc = this.tag ? findComponent(this.tag) : undefined;
    ensureStyles();
    this.innerHTML = doc
      ? renderDoc(doc)
      : `<p class="morphis-api"><span class="empty">Komponen <code>${esc(
          this.tag,
        )}</code> tidak ditemukan.</span></p>`;
  }
}

define('ui-component-api', UiComponentApi);
