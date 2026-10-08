import type { AttrDoc } from './model';

export interface Control {
  name: string;
  kind: 'select' | 'boolean' | 'text';
  options?: string[];
  value: string | boolean;
}

function optionsFromType(type: string | undefined): string[] | undefined {
  if (!type) return undefined;
  const matches = type.match(/'([^']+)'/g);
  if (!matches || matches.length === 0) return undefined;
  return matches.map((token) => token.replace(/'/g, ''));
}

export function controlsFor(attrs: AttrDoc[]): Control[] {
  return attrs.map((attr) => {
    const options = optionsFromType(attr.type);
    if (options) {
      return {
        name: attr.name,
        kind: 'select',
        options,
        value: attr.default && options.includes(attr.default) ? attr.default : options[0],
      };
    }
    if ((attr.type ?? '').trim() === 'boolean') {
      return { name: attr.name, kind: 'boolean', value: attr.default === 'true' };
    }
    return { name: attr.name, kind: 'text', value: attr.default ?? '' };
  });
}

/** Menyelaraskan nilai kontrol dengan atribut yang ada di contoh markup. */
export function syncControlsFromMarkup(controls: Control[], markup: string): void {
  const template = document.createElement('template');
  template.innerHTML = markup;
  const el = template.content.firstElementChild;
  if (!el) return;

  for (const control of controls) {
    if (!el.hasAttribute(control.name)) continue;
    control.value = control.kind === 'boolean' ? true : el.getAttribute(control.name) ?? '';
  }
}

export function applyControls(el: HTMLElement, controls: Control[]): void {
  for (const control of controls) {
    if (control.kind === 'boolean') {
      if (control.value) el.setAttribute(control.name, '');
      else el.removeAttribute(control.name);
      continue;
    }
    const value = String(control.value);
    if (value === '') el.removeAttribute(control.name);
    else el.setAttribute(control.name, value);
  }
}
