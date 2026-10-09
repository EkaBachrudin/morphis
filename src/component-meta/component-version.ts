import { define } from '@morphis/core';
import { findComponent } from './model';

const STYLE_ID = 'morphis-component-version-styles';

const STYLES = `
.morphis-version {
  display: inline-block;
  margin: 0 0 1rem;
  padding: 0.125rem 0.5rem;
  border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 8%, transparent);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.75rem;
  font-weight: 600;
  line-height: 1.6;
  vertical-align: middle;
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

export class UiComponentVersion extends HTMLElement {
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
    this.innerHTML = doc?.version
      ? `<span class="morphis-version">v${esc(doc.version)}</span>`
      : '';
  }
}

define('ui-component-version', UiComponentVersion);
