# Morphis — Dokumen Arsitektur

> Pustaka komponen reusable yang **benar-benar framework-agnostic**: dibangun
> sekali dengan **Web Components native** (Custom Elements + Shadow DOM +
> HTML Templates + ES Modules), lalu bisa dipakai di **framework apa saja dan
> versi berapa saja** maupun HTML/Twig native — dengan theming runtime memakai
> **CSS custom property** dan `::part()`.

- **Status**: Monorepo aktif (migrasi dari single-package selesai)
- **Namespace**: `ui-` (tag custom element, class internal, `part`)
- **Nama paket**: `@morphis/*` (paket per komponen + `@morphis/components` meta + `@morphis/core` + `@morphis/tokens` + `@morphis/react`)
- **Struktur**: npm workspaces + Changesets (versioning independen per paket)
- **Prinsip**: build once, run anywhere — tanpa version floor, tanpa lock-in.

---

## 1. Ringkasan

Morphis adalah monorepo npm untuk membangun pustaka komponen UI yang:

1. Ditulis **sekali** sebagai **Custom Element** (Lit 3 + TypeScript).
2. Berjalan langsung di **semua framework & semua versi** karena browser
   memperlakukan tag custom (`<ui-button>`) sebagai elemen HTML native.
3. Menghasilkan **HTML + CSS + JS** siap pakai yang bisa "dicomot" langsung
   oleh developer Drupal ke dalam Twig, maupun oleh pengguna HTML biasa.
4. Terenkapsulasi (**Shadow DOM**) sehingga style/markup tidak bocor ke aplikasi
   induk dan tidak terpengaruh CSS aplikasi.
5. Mudah **dimodifikasi** (ganti satu file komponen / override CSS variable /
   `::part()`).
6. Mudah **didokumentasikan** (Storybook + Custom Elements Manifest).

### Keputusan kunci

| Aspek | Keputusan |
|---|---|
| Sumber kebenaran | **Lit 3 (LitElement) + TypeScript** |
| Runtime | **Lit 3** + native API (Custom Elements, Shadow DOM, ES Modules) |
| Enkapsulasi style | **Shadow DOM** (`mode: 'open'`) |
| Theming | **CSS custom property `--ui-*`** (diwariskan menembus shadow) + `::part()` + `::slotted()` |
| Komunikasi | **Atribut/property** + **`CustomEvent`** (`bubbles: true, composed: true`) |
| Build | **Vite (library mode)** → ESM; bundle penuh + entry per komponen |
| Distribusi | Paket npm **per komponen** (versioning independen) + meta-bundle `@morphis/components` + markup HTML + varian IIFE |
| Integrasi Drupal | **Tidak ada paket khusus**; developer Drupal menyalin `dist/*.iife.js` + `tokens.css` + markup |
| SSR | Client-side / progressive enhancement |
| Dokumentasi | Storybook + Custom Elements Manifest |
| Struktur repo | **npm workspaces** (paket per komponen) + **Changesets** untuk versioning independen |

---

## 2. Latar Belakang & Masalah

Kebutuhan: komponen reusable yang bisa diintegrasikan ke **semua framework
frontend (versi apa pun)** sekaligus bisa menjadi **HTML native** untuk
Twig/Drupal, mudah dimodifikasi, dan mudah didokumentasikan.

Pendekatan "kompilasi ke komponen native per framework" (mis. Mitosis) gagal
memenuhi kata **"versi apa pun"**: tiap target punya *version floor*, dan
library Angular mengunci versi build (artefak hanya jalan di konsumen ≥ versi
build). Itu berarti setiap framework baru/versi baru menuntut build ulang.

Pendekatan yang menang: **standar web**. Web Component adalah elemen HTML
native; React/Angular/Vue/Svelte/Solid/Qwik semuanya pada akhirnya merender
DOM, dan DOM mendukung custom element. Karena itu satu bundel cukup untuk semua.

Tiga sumbu keputusan:

| Sumbu | Pilihan | Konsekuensi |
|---|---|---|
| Target runtime | Web Component vs kode native per framework | **WC** jalan di semua framework/versi; native punya DX terbaik tapi butuh kompilasi multi-target + version floor |
| Cara render | Client-side vs SSR | WC berbasis DOM; SSR + Shadow DOM itu rumit → pilih client-side/progressive enhancement |
| Cara styling | Encapsulated vs global CSS | **Shadow DOM** aman dari tabrakan; theming lewat CSS variable + `::part()` |

Mitigasi utama: **web standards** (tanpa compiler framework) + **design token
berbasis CSS variable** + **`::part()`** + **light-weight base class**.

---

## 3. Perbandingan Strategi (dan alasan pemilihan)

| Kriteria | Stencil | **Lit** | Vanilla WC | Mitosis |
|---|---|---|---|---|
| Output framework native | Wrapper otomatis | Tidak | Tidak perlu | Ya, semua |
| Output Web Component | Ya | **Ya** | Ya | Ya |
| Jalan di semua versi framework | Ya (CE) | **Ya (CE)** | Ya (CE) | Tidak (version floor) |
| Runtime ekstra | Compiler + runtime | **±5–6 KB gzip** | 0 (native) | Per-target |
| DX reaktif | Tinggi | **Tinggi** | Manual (base class) | Tinggi |
| Ukuran paket | Sedang | **Kecil** | Terkecil | Besar (banyak target) |
| Lock-in | Compiler | **Rendah** | Nol | Medium |
| Dokumentasi otomatis | CEM | **CEM** | CEM | Manual |
| **Keputusan** | | **Dipilih** | | |

**Alasan memilih Lit**: DX reaktif tinggi (reactive properties, `render()`
deklaratif dengan `html`, update differential yang menjaga fokus/selection),
didukung CEM (`litelement`) untuk auto-API, dan tetap menghasilkan **custom
element standar** sehingga klaim "framework apa saja, versi berapa saja"
terjaga. Trade-off: runtime ±5–6 KB gzip (di-*share* lintas komponen) yang
menggantikan klaim "0 runtime" pada iterasi vanilla sebelumnya.

---

## 4. Arsitektur Styling: Shadow DOM + Tailwind v4 + Tokens

### 4.1 Prinsip

- **Shadow DOM** (`attachShadow({ mode: 'open' })`) untuk enkapsulasi penuh.
  `mode: 'open'` dipilih agar DevTools, testing, dan `::part()` bekerja.
- Tailwind v4 dipakai **hanya di build-time** per komponen untuk menulis style
  dengan `@apply`. CSS hasil build di-*inline* sebagai string, lalu diserahkan
  ke Lit lewat helper `litStyles()` dan diadopsi ke shadow root
  (`adoptedStyleSheets`), bukan ditempel global.
- **Jembatan `@theme`**: agar `@apply bg-primary` (dan utility token lain) valid,
  token wajib didaftarkan di blok `@theme` pada `base.css`, mis.
  `--color-primary: var(--ui-color-primary, #2563eb)`. `:host` boleh menimpanya
  per komponen.
- Utility Tailwind **tidak** ditulis di markup; markup berisi struktur + slot.
- **Design token** (`--ui-*`) didefinisikan global di `:root`; custom property
  otomatis **diwariskan menembus shadow boundary**, sehingga themer bisa
  mengganti tema tanpa rebuild.
- Elemen internal yang boleh ditata dari luar diberi atribut `part="..."` dan
  bisa di-target dengan `ui-button::part(label)`.
- Konten yang diproyeksikan lewat `<slot>` ditata dengan `::slotted()`.
- Preflight Tailwind **tidak** di-inject ke tiap komponen (menghindari
  duplikasi besar); hanya style komponen.

### 4.2 Rantai token → tema runtime

```
tokens.json (Style Dictionary)
      └─► :root { --ui-color-primary: #2563eb; ... }        (global, dimuat sekali)
             └─► :host { --color-primary: var(--ui-color-primary, #2563eb); }
                    └─► .ui-button--primary { background: var(--color-primary); }
                           └─► Themer override --ui-color-primary → tanpa build ulang
```

Karena custom property diwariskan, override di `:root`, `.tema`, atau bahkan
langsung di elemen (`<ui-button style="--ui-color-primary:#e11d48">`) tetap
sampai ke dalam shadow.

### 4.3 Entry CSS

Ada **satu file token global** dan **satu file CSS per komponen**.

```css
/* dist/tokens.css — dihasilkan dari src/tokens/tokens.json, dimuat sekali oleh konsumen */
:root {
  --ui-color-primary:       #2563eb;
  --ui-color-primary-hover: #1d4ed8;
  --ui-color-on-primary:    #ffffff;
  --ui-color-surface:       #ffffff;
  --ui-color-on-surface:    #111827;
  --ui-color-border:        #e5e7eb;
}
```

```css
/* src/components/button/button.css — entry PER KOMPONEN */
@reference "../../styles/base.css"; /* konteks @apply, TANPA output base */

:host {
  --color-primary:       var(--ui-color-primary, #2563eb);
  --color-primary-hover: var(--ui-color-primary-hover, #1d4ed8);
  --color-on-primary:    var(--ui-color-on-primary, #ffffff);
  --color-surface:       var(--ui-color-surface, #ffffff);
  --color-on-surface:    var(--ui-color-on-surface, #111827);
  --color-border:        var(--ui-color-border, #e5e7eb);
}

@layer components {
  .ui-button {
    @apply inline-flex items-center justify-center rounded-md font-medium transition-colors;
    @apply focus-visible:outline-none disabled:opacity-50;
  }
  .ui-button--primary       { @apply bg-primary text-on-primary; }
  .ui-button--primary:hover { @apply bg-primary-hover; }
  .ui-button--secondary     { @apply bg-surface text-on-surface border border-border; }
  .ui-button__icon          { @apply h-4 w-4 shrink-0; }
  .ui-button__label         { @apply truncate; }
}
```

File CSS ini dikompilasi oleh Vite menjadi CSS biasa, lalu **di-inject ke
shadow root** (lihat §6 & §7).

### 4.4 Klasifikasi styling konsumen

| Kebutuhan themer | Cara |
|---|---|
| Ganti warna/spacing global | override `--ui-*` di `:root` |
| Ganti warna per instance | set `--ui-*` di atribut `style` elemen |
| Tata elemen internal tertentu | `ui-button::part(label) { ... }` |
| Tata konten slot | `ui-button::slotted(p) { ... }` |
| Ganti total tampilan | `overrides/` atau ganti file `button.css` |

### 4.5 Catatan penting: native nesting ≠ Sass

CSS nesting **tidak** mendukung konkatenasi `&--modifier`. Modifier dan elemen
BEM harus ditulis sebagai **rule terpisah** (atau `&.ui-button--primary`), dan
semua rule BEM dibungkus `@layer components`.

### 4.6 Aturan disiplin (wajib)

1. Utility Tailwind hanya di dalam `@apply` di CSS komponen — **tidak** di markup.
2. Markup (template shadow) hanya struktur + BEM `ui-*` + `<slot>`.
3. Sumber komponen **tidak** memakai global CSS class; semua style masuk shadow.
4. Selalu `attachShadow({ mode: 'open' })`; jangan `closed`.
5. Tiap komponen punya satu file CSS entry sendiri; wajib `@reference` ke
   `base.css` (konteks `@apply`) dan rule BEM di `@layer components`.
6. Preflight global **tidak** boleh di-inject per komponen.
7. Setiap elemen yang perlu di-tata dari luar diberi `part="..."`.
8. Token hanya didefinisikan sebagai `--ui-*`; nilai fallback ditulis di `:host`.

---

## 5. Struktur Repo (Monorepo / npm Workspaces)

```
reusable-components/
├── package.json                 # private workspace root (workspaces: packages/*, packages/components/*)
├── tsconfig.json / tsconfig.package.json
├── vite.config.ts
├── custom-elements-manifest.config.mjs
├── .changeset/                  # Changesets (versioning independen)
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── packages/
│   ├── core/                    # @morphis/core — MorphisElement (extends LitElement) + helper
│   │   └── src/{element,sheet,emit,define,index}.ts
│   ├── tokens/                  # @morphis/tokens
│   │   ├── src/tokens.json      # Style Dictionary → dist/tokens.css
│   │   └── scripts/build-tokens.mjs
│   ├── components/              # @morphis/components (meta-bundle)
│   │   ├── package.json
│   │   ├── src/index.ts         # re-export semua komponen
│   │   └── dist/morphis.js, tokens.css, custom-elements.json
│   │   └── button/              # @morphis/button (versi independen)
│   │       ├── package.json, tsconfig.json
│   │       └── src/{button.ts, button.css,
│   │                button.markup.html, button.stories.ts, button.test.ts, button.mdx}
│   │   └── card/  input/  select/ ...
│   └── react/                   # @morphis/react — wrapper React <19
├── src/                         # dev app Storybook (bukan paket terbit)
│   ├── styles/base.css          # konteks @apply + blok @theme
│   ├── component-meta/          # model docs (dari CEM) + snippet + tabel API
│   ├── guides/                  # panduan Storybook (*.mdx)
│   └── integrations/            # uji integrasi React/Vue
├── scripts/                     # build-components.mjs, build-types.mjs, build-export.mjs, generate-component.mjs
├── custom-elements.json         # hasil CEM (root)
└── docs/                        # dokumen internal (architecture.md)
```

Tiap paket komponen punya `dist/` sendiri berisi: `<nama>.js` (ESM),
`<nama>.iife.js` (script klasik), `<nama>.html` (markup), dan `types/` —
semuanya siap disalin ("dicomot") untuk Drupal/HTML.

> **Mengapa per komponen?** Agar setiap komponen punya **semver independen**:
> memperbaiki `card` tidak memaksa menaikkan versi `button`. npm hanya
> mem-version satu paket per nama, jadi ini mengharuskan paket terpisah dengan
> npm workspaces + Changesets. Meta-bundle `@morphis/components` tetap
> disediakan untuk konsumen yang ingin semua komponen sekaligus (versinya naik
> bila salah satu komponen naik).

---

## 6. Build & Konfigurasi

### 6.1 Vite library mode

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { globSync } from 'glob';
import { resolve } from 'node:path';

const componentEntries = Object.fromEntries(
  globSync('src/components/*/*.ts').map((file) => [
    file.replace(/^src\//, '').replace(/\.ts$/, ''), // "components/button"
    resolve(import.meta.dirname, file),
  ]),
);

export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: { '@morphis/core': resolve(import.meta.dirname, 'src/core/index.ts') },
  },
  build: {
    target: 'es2021',
    lib: {
      entry: { morphis: resolve(import.meta.dirname, 'src/index.ts'), ...componentEntries },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      output: { preserveModules: false },
    },
    cssCodeSplit: false,
    minify: 'esbuild',
  },
});
```

> Alias `@morphis/core` diselesaikan saat build (Vite) dan saat typecheck (tsconfig
> `paths`), sehingga kode komponen tetap memakai specifier yang stabil.

Output:
- `dist/morphis.js` — bundel penuh yang meng-`define` semua custom element
  (auto-register, untuk CDN/HTML/Twig).
- `dist/components/<name>.js` — entry per komponen (import satu = register satu).

### 6.2 `package.json` (mengikuti pola artikel)

```json
{
  "name": "@morphis/components",
  "version": "1.0.0",
  "description": "Framework-agnostic Web Components by Morphis",
  "type": "module",
  "main": "./dist/morphis.js",
  "module": "./dist/morphis.js",
  "exports": {
    ".": "./dist/morphis.js",
    "./tokens.css": "./dist/tokens.css",
    "./components/*": "./dist/components/*.js",
    "./markup/*": "./dist/markup/*.html"
  },
  "files": ["dist"],
  "scripts": {
    "clean": "rm -rf dist custom-elements.json",
    "build": "npm run clean && npm run build:components && npm run build:tokens && npm run build:types && npm run build:cem && npm run build:export",
    "build:components": "vite build",
    "build:tokens": "node scripts/build-tokens.mjs",
    "build:types": "tsc -p tsconfig.build.json",
    "build:cem": "cem analyze",
    "build:export": "node scripts/build-export.mjs",
    "dev": "vite",
    "typecheck": "tsc --noEmit",
    "storybook": "npm run build:tokens && npm run build:cem && storybook dev -p 6006",
    "build-storybook": "npm run build:tokens && npm run build:cem && storybook build",
    "prepublishOnly": "npm run build"
  },
  "devDependencies": {
    "vite": "^8.0.0",
    "@tailwindcss/vite": "^4.0.0",
    "tailwindcss": "^4.0.0",
    "lit": "^3.0.0",
    "style-dictionary": "^5.0.0",
    "@custom-elements-manifest/analyzer": "^0.11.0",
    "storybook": "^10.0.0",
    "@storybook/web-components-vite": "^10.0.0"
  }
}
```

> `@morphis/core` mendeklarasikan **`lit`** sebagai `dependency`; paket komponen
> cukup bergantung pada `@morphis/core`. Build ESM menge-*external* `lit` &
> `@morphis/core`, sedangkan varian IIFE dan meta-bundle membundel keduanya.

> `cem analyze` dikonfigurasi dengan **`litelement: true`** (`custom-elements-manifest.config.mjs`)
> karena sumbernya Lit. Plugin Lit membaca `@property` untuk **Attributes**,
> serta template `html` untuk **Slots**/**CSS Parts**; anotasi JSDoc `@slot`,
> `@csspart`, `@cssprop`, dan `@fires` melengkapi sisanya.

### 6.3 Base class `MorphisElement`

`MorphisElement` menurunkan **`LitElement`** sehingga komponen mendapatkan
reactive properties, `render()` deklaratif (`html`), dan siklus update Lit.
Base class hanya menambahkan helper `emit()` dan re-export API Lit.

```ts
// src/core/element.ts
import { LitElement } from 'lit';
import { emit } from './emit';

export abstract class MorphisElement extends LitElement {
  protected emit<T>(type: string, detail: T): void {
    emit(this, type, detail);
  }
}
```

```ts
// src/core/emit.ts
export function emit<T>(host: HTMLElement, type: string, detail: T): void {
  host.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true }),
  );
}
```

```ts
// src/core/sheet.ts
import { unsafeCSS, type CSSResult } from 'lit';

// Tailwind v4 memancarkan rule `@property` yang diabaikan di dalam Shadow DOM;
// rule ini diangkat ke `document.adoptedStyleSheets` sekali (tailwindcss#15005),
// lalu CSS dikembalikan sebagai `CSSResult` untuk `static styles` Lit.
function hoistCustomProperties(css: string): void {
  /* ...pindai CSSPropertyRule, dedup, sisipkan ke satu stylesheet global... */
}

export function litStyles(css: string): CSSResult {
  hoistCustomProperties(css);
  return unsafeCSS(css);
}
```

```ts
// src/core/define.ts
export function define(tag: string, ctor: CustomElementConstructor): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}
```

```ts
// src/core/index.ts — permukaan publik
export {
  html, css, nothing, LitElement,
  type TemplateResult, type CSSResult, type PropertyValues,
} from 'lit';
export { repeat } from 'lit/directives/repeat.js';
export { property, state } from 'lit/decorators.js';
export { MorphisElement } from './element';
export { emit } from './emit';
export { define } from './define';
export { litStyles } from './sheet';
```

> `interpolate()` dan adopsi stylesheet manual tidak lagi diperlukan: template
> ditangani `lit-html` lewat `render()`, sedangkan style diadopsi Lit dari
> `static styles`. `litStyles()` tetap ada khusus untuk workaround `@property`
> Tailwind dan sebagai pembungkus `unsafeCSS` untuk CSS hasil build.

### 6.4 Storybook & CEM

- Storybook dengan `@storybook/web-components-vite`; story menampilkan props,
  event, slot, dan `part` yang tersedia.
- `cem analyze` menghasilkan `custom-elements.json` untuk auto API docs, dengan
  `litelement: true` sehingga **Attributes** diambil otomatis dari `@property`.
- `.storybook/preview.ts` memuat manifest itu dengan
  `setCustomElementsManifest(manifest)` sehingga panel docs/controls terisi
  otomatis, dan meng-import `dist/tokens.css` + `src/index.ts`.

---

## 7. Kontrak Komponen

```ts
// packages/components/button/src/button.ts
import { MorphisElement, define, html, property, litStyles } from '@morphis/core';
import style from './button.css?inline';

export type ButtonVariant = 'primary' | 'secondary';

export class UiButton extends MorphisElement {
  static override styles = litStyles(style);

  @property({ reflect: true }) variant: ButtonVariant = 'primary';
  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`
      <button
        class="ui-button ui-button--${this.variant}"
        part="button"
        type="button"
        ?disabled=${this.disabled}
        @click=${this.#onClick}
      >
        <slot name="icon" part="icon"></slot>
        <span class="ui-button__label" part="label"><slot></slot></span>
      </button>
    `;
  }

  #onClick = (): void => {
    if (this.disabled) return;
    this.emit('ui-click', { variant: this.variant });
  };
}

define('ui-button', UiButton);
```

> **Binding template**: template hidup di dalam `render()` sebagai tagged
> template `html`, sehingga binding atribut (`variant`), boolean (`?disabled`),
> dan event (`@click`) semuanya deklaratif. lit-html melakukan update
> *differential* — hanya node yang berubah yang disentuh, sehingga fokus,
> posisi kursor, dan scroll internal terjaga. Style **tidak** ikut di markup; ia
> diserahkan lewat `static styles` (`litStyles()` → `adoptedStyleSheets`, §6.3).

- **Props/atribut** → `@property`/`@state` (reactive properties Lit).
- **Slots** → `<slot>` / `<slot name="...">` untuk komposisi konten.
- **Parts** → `part="..."` untuk styling dari luar.
- **Events** → `emit('ui-*', detail)`; `bubbles` + `composed` agar menembus
  shadow dan bisa ditangkap framework induk.
- **Namespace**: tag `ui-*`, class `.ui-x__y`, `part` bernama.

---

## 8. Alur Build

```
src/tokens/tokens.json ──► dist/tokens.css ───────────────────┐
                                                              │ (global, dimuat sekali)
 base.css (@reference + @theme) ──┐                           │
                                  ▼                           │
 packages/components/*/src/{ts,css} ─► Vite ─┬─► dist/*.js (ESM, external lit+core) ─┐
                                             ├─► dist/*.iife.js (self-contained) ────┤
                                             ├─► dist/morphis.js (meta, self-contained)
                                             └─► custom-elements.json ────────────────┤
                                                                                     ▼
                                            Storybook ◄── stories   dist/markup/*.html
                                                        per komponen (referensi Twig)
```

Pipeline: tiap komponen dikompilasi sebagai entry Vite terpisah. Varian **ESM**
menge-*external* `lit` & `@morphis/core` (konsumen/bundler men-dedupe runtime),
sedangkan varian **IIFE** (`*.iife.js`, untuk Drupal) dan **meta-bundle**
(`morphis.js`, untuk CDN) membundel Lit + core agar self-contained. `tokens.css`
di-ship terpisah dan dimuat konsumen. CEM dan markup dihasilkan dari sumber yang
sama ke `custom-elements.json` dan `dist/`.

---

## 9. Distribusi & Konsumsi

`dist/` adalah satu-satunya yang dibutuhkan konsumen (di-ship lewat npm):

```
dist/
├── morphis.js               # bundel penuh (auto-register semua komponen)
├── components/*.js          # per komponen (opsional, tree-shakable)
├── tokens.css               # WAJIB (global, dimuat sekali)
├── types/                   # deklarasi TypeScript
└── markup/
    ├── button.html
    ├── input.html
    └── card.html
```

Contoh `markup/button.html` (siap tempel ke Twig):

```html
<ui-button variant="primary">
  <span slot="icon">💾</span>
  Simpan
</ui-button>
```

### 9.1 Konsumsi HTML / CDN (tanpa framework)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@morphis/components/dist/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@morphis/components/dist/morphis.js"></script>

<ui-button variant="primary">Simpan</ui-button>
```

### 9.2 Konsumsi per-framework

Pola dasar: cukup `import` sekali (side-effect) agar custom element terdaftar,
lalu pakai tag HTML-nya. Karena ini elemen native, **semua versi framework**
bekerja tanpa build khusus.

**React** — import sekali + pakai tag; interaksi lewat `ref`:

```tsx
import '@morphis/button';
import { useRef } from 'react';

export function App() {
  const ref = useRef<HTMLElement>(null);
  return <ui-button ref={ref} variant="primary">Simpan</ui-button>;
}
```

- React ≥19 mendukung property & event custom element secara deklaratif.
- **React <19**: atribut dikirim sebagai string dan custom event tidak bisa
  di-bind deklaratif. Solusi: pasang `addEventListener` lewat `ref`, atau pakai
  wrapper tipis `@morphis/react` (opsional, Fase 3).

**Angular** — izinkan elemen tak dikenal + import sekali:

```ts
// main.ts
import '@morphis/button';
```

```ts
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({
  // ...
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
```

```html
<ui-button variant="primary" (ui-click)="onClick($event)">Simpan</ui-button>
```

**Vue 3** — dukung out-of-the-box; tandai sebagai custom element agar compiler
tidak mengira ini komponen Vue:

```ts
// vite.config.ts
export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (t) => t.startsWith('ui-') } } })],
});
```

```vue
<script setup>
import '@morphis/button';
</script>

<template>
  <ui-button variant="primary" @ui-click="onClick">Simpan</ui-button>
</template>
```

**Svelte / Solid / Qwik** — import sekali lalu pakai tag; event custom
ditangkap seperti event DOM biasa (`on:ui-click` / `onui-click`).

### 9.3 Alur konsumsi Drupal

1. Copy `tokens.css` **dan** `morphis.js` (atau `components/*.js` yang dipakai)
   ke tema Drupal (attach sebagai library).
2. Tempel markup (tag `ui-*` + slot) ke template Twig.
3. Override tema cukup dengan `:root { --ui-color-primary: ...; }`.
4. Untuk tata letak elemen internal tertentu gunakan `ui-button::part(label)`.

```twig
{# templates/... #}
{{ attach_library('tema/morphis') }}

<ui-button variant="{{ button_variant|default('primary') }}">
  <span slot="icon">{{ icon }}</span>
  {{ label }}
</ui-button>
```

> Karena markup akhir adalah HTML native + slot, tidak ada JavaScript framework
> yang perlu dipasang di Drupal — hanya satu modul JS kecil.

---

## 10. Dokumentasi

Satu permukaan dokumentasi (**Storybook**), satu sumber data
(`custom-elements.json` + `packages/components/*/src/*.markup.html`):

- **Storybook** (`@storybook/web-components-vite`) di `.storybook/` — dokumentasi
  lengkap sekaligus *workbench*: story per komponen
  (`packages/components/<name>/src/<name>.stories.ts`), MDX per komponen
  (`packages/components/<name>/src/<name>.mdx`) dengan contoh live, controls, dan tabel API
  lengkap.
- **Doc block `ui-component-api`** (`src/component-meta/component-api.ts`)
  merender tabel **Attributes/Events/Slots/CSS Parts/CSS Custom Properties** dari
  `custom-elements.json` secara dinamis — tanpa langkah generate.
- **Panduan** (`src/guides/*.mdx`) — Mulai, Theming, Integrasi Drupal, Framework,
  Accessibility.
- **Snippet per-framework** lewat story `Snippet` + toolbar **Framework**
  (Native/Twig/React/Vue/Angular), memakai `src/component-meta/{model,snippets}.ts`.
- **Auto API docs** dari Custom Elements Manifest (`custom-elements.json`) — satu
  sumber untuk Storybook dan `ui-component-api`.
- Addon **a11y** di Storybook untuk audit aksesibilitas.

Modul bersama `src/component-meta/{model,snippets,snippet-story,component-api}.ts`
mencegah duplikasi logika data/snippet.

---

## 11. Workflow Modifikasi

| Kebutuhan | Sentuh | Efek |
|---|---|---|
| Ubah tampilan komponen | `packages/components/<name>/src/<name>.ts` + `<name>.css` | semua konsumen paket itu berubah saat build |
| Ubah CSS satu komponen | `packages/components/<name>/src/<name>.css` | hanya komponen itu berubah |
| Beda perilaku khusus | override class / extend `MorphisElement` | tanpa ubah sumber inti |
| Ganti warna/spacing global | `packages/tokens/src/tokens.json` | semua komponen ikut |
| Themer ganti tema | `--ui-*` di `:root` | tanpa build ulang |
| Tata elemen internal | `ui-x::part(...)` | tanpa build ulang |
| Tambah komponen | `npm run gen -- component <nama>` | scaffold paket baru (@morphis/<nama>) + register di meta |

---

## 12. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Theming terasa lebih sulit karena Shadow DOM | Token `--ui-*` (diwariskan) + `::part()` + `::slotted()`; dokumentasikan daftar part |
| FOUC / SSR (WC baru muncul setelah JS) | `tokens.css` global selalu dirender; siapkan style host minimal; define-on-client; `:not(:defined)` styling |
| React <19 tak bisa bind custom event deklaratif | Gunakan `ref` + `addEventListener`; sediakan wrapper `@morphis/react` opsional |
| Vue menganggap `<ui-*>` sebagai komponen | Set `compilerOptions.isCustomElement` |
| Angular menolak tag tak dikenal | `CUSTOM_ELEMENTS_SCHEMA` |
| Preflight Tailwind terduplikasi per komponen | Jangan inject preflight ke shadow; hanya style komponen |
| `@apply` gagal di entry terpisah | Wajib `@reference "../../styles/base.css"`; rule BEM di `@layer components` |
| CSS nesting tak bisa `&--modifier` | Tulis rule BEM terpisah; enforce via stylelint |
| `customElements.define` dobel | `define()` menjaga dengan `customElements.get` |
| CEM tidak membaca getter/setter kompleks | `litelement: true` membaca `@property` otomatis untuk **Attributes**; anotasi `@slot`/`@csspart`/`@cssprop`/`@fires` melengkapi slot/part/event. |
| `useDefineForClassFields` meng-override accessor Lit | Set `false` di tsconfig (proyek memakai decorator legacy Lit). |
| `@property` Tailwind diabaikan di Shadow DOM | `litStyles()` mengangkat rule ke `document.adoptedStyleSheets` sekali (lihat §6.3). |
| Duplikasi runtime Lit di banyak entry | ESM menge-*external* `lit` + `@morphis/core`; IIFE/meta-bundle membundel (lihat §8). |
| Update Lit asinkron → assertion test terlalu awal | Tunggu `await el.updateComplete` (atau `elementUpdated` dari `@open-wc/testing`). |
| Slot tanpa konten merusak a11y | Slot default + fallback; uji dengan addon a11y |
| Bundel membesar (Lit ±5–6 KB gzip) | Runtime di-*share* lintas komponen; entry per komponen tetap tree-shakable; audit ukuran di CI |

---

## 13. Roadmap

**Fase 0 — Fondasi**
- Init single-package npm (`package.json`, `tsconfig`, `vite.config.ts`).
- `src/tokens` (Style Dictionary) → `dist/tokens.css`.
- `src/core` (`MorphisElement`, `sheet`, `emit`, `define`). *Catatan: `interpolate` awalnya dipakai di iterasi vanilla dan dihapus pada Fase 5 (Lit).*
- `src/styles/base.css` (konteks `@apply` + blok `@theme`, tidak di-ship global).
- Lint (stylelint + eslint), CI dasar.

**Fase 1 — PoC 3 komponen**
- `button`, `input`, `card` sebagai custom element + Shadow DOM (awalnya vanilla, kini berbasis Lit).
- CSS `ui-*` per komponen, di-adopt ke shadow.
- Vite build: bundle penuh + entry per komponen + `dist/tokens.css`.
- Storybook (`web-components-vite`) di `.storybook/` + controls + a11y.
- CEM (`custom-elements.json`).

**Fase 2 — Export & "Comot"**
- Generate `dist/` (JS bundle, JS per komponen, tokens.css, markup, types).
- Publikasi npm + uji CDN (jsDelivr/unpkg).
- Halaman docs "How to copy for Drupal"; verifikasi tempel ke Twig sederhana.

**Fase 3 — DX & Skala**
- Generator komponen (`npm run gen component`), versioning npm, auto-docs dari CEM.
- Wrapper opsional `@morphis/react` (ergonomi event React <19).
- Uji integrasi nyata React/Angular/Vue/Svelte/Solid.
- Visual regression + audit aksesibilitas.

**Fase 4 — Dokumentasi Lengkap di Storybook**
- Storybook menjadi **satu-satunya permukaan dokumentasi**: panduan
  (`src/guides/*.mdx`) + halaman komponen dengan tabel API lengkap dari CEM.
- Doc block `ui-component-api` merender Attributes/Events/Slots/CSS Parts/CSS
  Custom Properties secara dinamis.
- Pencarian Storybook, deploy statis (`storybook-static/`), dan migrasi panduan
  dari `docs/`.

**Fase 5 — Migrasi fondasi ke Lit (selesai)**
- `MorphisElement` menurunkan `LitElement`; `interpolate()`/`*.template.html`
  dihapus; reactive properties + `render()` deklaratif + `litStyles()`.
- CEM beralih ke `litelement: true`; build ESM menge-*external* `lit` &
  `@morphis/core`, IIFE/meta membundel.
- Seluruh dokumentasi (`README.md`, `docs/architecture.md`, panduan Storybook,
  generator) disesuaikan.

---

## 14. Support Matrix

Tidak ada **version floor**: arsitektur ini berjalan di framework/versi apa pun
yang bisa merender HTML. Yang ada hanyalah **catatan integrasi** (konfigurasi
kecil) per framework.

| Target | Dukungan | Catatan integrasi |
|---|---|---|
| HTML / Twig / Drupal | Langsung | Import `morphis.js` + `tokens.css`; theming via `--ui-*` / `::part()` |
| React ≥19 | Langsung | Property & event custom element deklaratif |
| React 16.8–18 | Langsung + wrapper | Atribut string; custom event via `ref` atau `@morphis/react` |
| Angular | Langsung | `CUSTOM_ELEMENTS_SCHEMA`; import sekali di `main.ts` |
| Vue 3 | Langsung | `compilerOptions.isCustomElement` untuk prefix `ui-` |
| Vue 2 | Langsung (opsional) | Gunakan via tag HTML; hindari binding Vue-specific |
| Svelte | Langsung | Import sekali; event `on:ui-*` |
| Solid / Qwik | Langsung | Import sekali; event seperti DOM biasa |
| Meta-framework (Next/Nuxt/SvelteKit) | Client hydration | Import komponen di boundary client; anti-FOUC via tokens global |

---

## 15. Referensi

- How To Build Framework-Agnostic UIs With Web Components (Anand Kumar) — dasar pendekatan
- MDN — Custom Elements: https://developer.mozilla.org/docs/Web/API/Web_components/Using_custom_elements
- MDN — Shadow DOM: https://developer.mozilla.org/docs/Web/API/Web_components/Using_shadow_DOM
- MDN — `::part()`: https://developer.mozilla.org/docs/Web/CSS/::part
- CSS Shadow Parts (W3C): https://drafts.csswg.org/css-shadow-parts/
- Custom Elements Manifest: https://github.com/webcomponents/custom-elements-manifest
- Custom Elements Everywhere (kompatibilitas per framework): https://custom-elements-everywhere.com/
- Tailwind CSS v4: https://tailwindcss.com/docs/theme
- Tailwind Functions & Directives (`@reference`, `@apply`): https://tailwindcss.com/docs/functions-and-directives
- Vite Library Mode: https://vite.dev/guide/build.html#library-mode
- Lit: https://lit.dev/
- Lit — Reactive properties: https://lit.dev/docs/components/properties/
- Lit — Templates & directives: https://lit.dev/docs/templates/overview/
- Lit — Decorators: https://lit.dev/docs/components/decorators/
- Storybook Web Components: https://storybook.js.org/docs/web-components
