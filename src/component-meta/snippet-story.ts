import { findComponent } from './model';
import { snippetFor, type Framework } from './snippets';

/**
 * Render snippet contoh untuk story Storybook.
 *
 * Dipanggil dari story function dengan `context.globals` (nilai toolbar
 * "Framework"). Tidak memakai preview hook (`useGlobals`) karena itu hanya
 * valid di decorator/story function, dan story ini memang story function —
 * namun membaca `context.globals` lebih sederhana dan bebas hook.
 */
export function renderSnippet(tag: string, globals: Record<string, unknown>): HTMLElement {
  const framework = (globals.framework as Framework) ?? 'native';
  const doc = findComponent(tag);
  const pre = document.createElement('pre');
  pre.style.margin = '0';
  const code = document.createElement('code');
  code.textContent = doc ? snippetFor(doc, framework) : `Komponen ${tag} tidak ditemukan.`;
  pre.append(code);
  return pre;
}
