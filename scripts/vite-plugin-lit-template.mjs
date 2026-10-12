import { readFileSync } from 'node:fs';

/**
 * Vite plugin: import file `.html` sebagai template Lit.
 *
 * Mengubah import bertanda `?html` menjadi fungsi template Lit, mis.
 *
 * ```ts
 * import template from './card.template.html?html';
 *
 * override render() {
 *   return template({ variant: this.variant });
 * }
 * ```
 *
 * Isi file `.html` diperlakukan **apa adanya** sebagai badan literal
 * `html\`...\`` — jadi bisa memuat ekspresi (`${...}`, `?attr=${...}`,
 * `@event=${...}`) maupun nested template `html\`...\`` (mis. untuk `repeat`),
 * dengan `ctx` sebagai objek yang dioper komponen. Backtick/backslash literal
 * ditulis seperti di TypeScript (`` \` ``, `\\`).
 *
 * Helper `html`, `nothing`, dan `repeat` dari `@morphis/core` tersedia di dalam
 * template tanpa import tambahan.
 *
 * Catatan: karena template berada di file terpisah, isinya tidak
 * di-type-check TypeScript. Jaga agar nama properti pada `ctx` sinkron dengan
 * objek yang dikirim dari `render()`.
 */
export function litTemplate() {
  const query = '?html';
  const suffix = /\.html\?html$/;
  const templateFiles = new Set();

  const fileFromId = (id) => id.slice(0, -query.length);

  return {
    name: 'morphis:lit-template',
    enforce: 'pre',

    load(id) {
      if (!suffix.test(id)) return null;

      const file = fileFromId(id);
      templateFiles.add(file);

      // Disisipkan apa adanya sebagai badan literal `html\`...\``. Jangan
      // di-escape agar nested template (mis. `repeat(..., () => html\`...\`)`)
      // tetap valid.
      const source = readFileSync(file, 'utf8');
      // Lihat perubahan file agar ikut memicu rebuild/HMR.
      this.addWatchFile(file);

      return {
        code: `import { html, nothing, repeat } from '@morphis/core';\nexport default (ctx) => html\`${source}\`;\n`,
        map: null,
      };
    },

    handleHotUpdate({ file, server }) {
      if (!templateFiles.has(file)) return;

      // Web Component perlu register ulang, jadi andalkan full reload.
      server.ws.send({ type: 'full-reload' });
      return [];
    },
  };
}
