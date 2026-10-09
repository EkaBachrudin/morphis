# Morphis — Dokumen Arsitektur

> Pustaka komponen reusable yang **benar-benar framework-agnostic**: dibangun
> sekali dengan **Web Components native** (Custom Elements + Shadow DOM +
> HTML Templates + ES Modules), lalu bisa dipakai di **framework apa saja dan
> versi berapa saja** maupun HTML/Twig native — dengan theming runtime memakai
> **CSS custom property** dan `::part()`.

- **Status**: Draf arsitektur (disetujui untuk dieksekusi)
- **Namespace**: `ui-` (tag custom element, class internal, `part`)
- **Nama paket**: `@morphis/components` (satu paket npm)
- **Struktur**: Satu paket npm — tanpa workspace, turbo, atau changesets.
- **Prinsip**: build once, run anywhere — tanpa version floor, tanpa lock-in.

---

## 1. Ringkasan

Morphis adalah satu paket npm untuk membangun pustaka komponen UI yang:

1. Ditulis **sekali** sebagai **Custom Element** (Vanilla Web Component + TypeScript).
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
| Sumber kebenaran | **Vanilla Custom Elements + TypeScript** |
| Runtime | **Native browser API** (Custom Elements, Shadow DOM, Template, ES Modules) |
| Enkapsulasi style | **Shadow DOM** (`mode: 'open'`) |
| Theming | **CSS custom property `--ui-*`** (diwariskan menembus shadow) + `::part()` + `::slotted()` |
| Komunikasi | **Atribut/property** + **`CustomEvent`** (`bubbles: true, composed: true`) |
| Build | **Vite (library mode)** → ESM; bundle penuh + entry per komponen |
| Distribusi | Satu paket npm + CDN (jsDelivr/unpkg) + markup HTML |
| Integrasi Drupal | **Tidak ada paket khusus**; developer Drupal mencomot dari `dist/` |
| SSR | Client-side / progressive enhancement |
| Dokumentasi | Storybook + Custom Elements Manifest |
| Struktur repo | **Satu paket npm** (single-package); tanpa pnpm workspace/turbo/changesets |

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

| Kriteria | Stencil | Lit | **Vanilla WC** | Mitosis |
|---|---|---|---|---|
| Output framework native | Wrapper otomatis | Tidak | **Tidak perlu** | Ya, semua |
| Output Web Component | Ya | Ya | **Ya** | Ya |
| Jalan di semua versi framework | Ya (CE) | Ya (CE) | **Ya (CE)** | Tidak (version floor) |
| Runtime ekstra | Compiler + runtime | ~5KB | **0 (native)** | Per-target |
| DX reaktif | Tinggi | **Tinggi** | Manual (base class) | Tinggi |
| Ukuran paket | Sedang | Kecil | **Terkecil** | Besar (banyak target) |
| Lock-in | Compiler | Rendah | **Nol** | Medium |
| Dokumentasi otomatis | CEM | CEM | **CEM** | Manual |
| **Keputusan** | | | **Dipilih** | |

**Alasan memilih Vanilla Web Components**: nol runtime, nol lock-in, dan
memenuhi tujuan "framework apa saja, versi berapa saja". Lit tetap dicatat
sebagai jalur migrasi DX jika proyek membesar (Lit juga menghasilkan custom
element yang sama, jadi kompatibel).

---

## 4. Arsitektur Styling: Shadow DOM + Tailwind v4 + Tokens

### 4.1 Prinsip

- **Shadow DOM** (`attachShadow({ mode: 'open' })`) untuk enkapsulasi penuh.
  `mode: 'open'` dipilih agar DevTools, testing, dan `::part()` bekerja.
- Tailwind v4 dipakai **hanya di build-time** per komponen untuk menulis style
  dengan `@apply`. Hasil CSS final **di-inject ke dalam shadow root**, bukan
  ditempel global.
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

## 5. Struktur Repo (Single-Package)

```
reusable-components/
├── package.json
├── tsconfig.json / tsconfig.build.json
├── vite.config.ts
├── custom-elements-manifest.config.mjs
├── .storybook/
│   ├── main.ts
│   └── preview.ts
├── src/
│   ├── index.ts                 # auto-register semua komponen
│   ├── tokens/tokens.json       # Style Dictionary → dist/tokens.css
│   ├── styles/base.css          # konteks @apply + blok @theme
│   ├── core/                    # base class MorphisElement + helper
│   │   └── {element.ts, sheet.ts, emit.ts, define.ts, interpolate.ts, index.ts}
│   ├── component-meta/          # model docs (dari CEM) + generator snippet + tabel API (Storybook)
│   └── components/              # SUMBER KEBENARAN (vanilla custom elements)
│       ├── button/{button.ts, button.css, button.template.html, button.markup.html, button.stories.ts}
│       ├── input/...
│       └── card/...
├── scripts/
│   ├── build-tokens.mjs         # Style Dictionary
│   └── build-export.mjs         # salin markup ke dist/
├── dist/                        # ARTEFAK "comot" untuk Drupal/HTML
│   ├── morphis.js               # bundle penuh (auto-register semua)
│   ├── components/*.js          # entry per komponen (tree-shakable)
│   ├── tokens.css
│   ├── markup/*.html
│   └── types/                   # deklarasi TypeScript
├── custom-elements.json         # hasil CEM
└── docs/                        # dokumen internal (architecture.md)
```

Tidak ada paket hasil kompilasi framework (`react/`, `vue/`, `svelte/`,
`solid/`, `qwik/`, `angular/`, `wc/`) — hanya satu paket sumber.

> **Mengapa single-package?** Distribusi utama memang satu paket npm. Memecah
> `core`/`tokens` menjadi paket terpisah hanya berguna bila keduanya perlu
> semver independen atau dikonsumsi pihak lain secara terpisah. Selama belum,
> satu paket menghilangkan overhead workspace/turbo/changesets tanpa kehilangan
> apa pun. Migrasi ke monorepo tetap terbuka bila kebutuhan itu muncul.

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
    "style-dictionary": "^5.0.0",
    "@custom-elements-manifest/analyzer": "^0.11.0",
    "storybook": "^10.0.0",
    "@storybook/web-components-vite": "^10.0.0"
  }
}
```

> `cem analyze` dipakai **tanpa** flag `--litelement` karena sumbernya vanilla
> custom element, bukan Lit. (Flag itu khusus Lit dan akan salah membaca metadata.)

### 6.3 Base class `MorphisElement`

Bertanggung jawab atas: attach shadow, adopsi stylesheet, rendering template,
lifecycle reaktif, dan emit event.

```ts
// src/core/element.ts
import { sheetFrom } from './sheet';
import { emit } from './emit';

export abstract class MorphisElement extends HTMLElement {
  static styles: string[] = [];
  static template = '';
  protected root: ShadowRoot;
  #listenersAttached = false;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    if (!this.#listenersAttached) {
      this.#listenersAttached = true;
      this.attachEventListeners?.();
    }
    this.render();
    this.onConnected?.();
  }

  protected render() {
    this.renderTemplate();
    this.root.adoptedStyleSheets = (this.constructor as typeof MorphisElement)
      .styles.map(sheetFrom);
  }

  protected renderTemplate() {
    this.root.innerHTML = (this.constructor as typeof MorphisElement)
      .template;
  }

  protected emit<T>(type: string, detail: T) {
    emit(this, type, detail);
  }

  // Hook sekali-pasang untuk listener (delegasi di shadow root).
  protected attachEventListeners?(): void;
  protected onConnected?(): void;
}
```

```ts
// src/core/emit.ts
export function emit<T>(host: HTMLElement, type: string, detail: T) {
  host.dispatchEvent(
    new CustomEvent(type, { detail, bubbles: true, composed: true }),
  );
}
```

```ts
// src/core/sheet.ts
const cache = new Map<string, CSSStyleSheet>();
export function sheetFrom(css: string): CSSStyleSheet {
  let sheet = cache.get(css);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    cache.set(css, sheet);
  }
  return sheet;
}
```

```ts
// src/core/define.ts
export function define(tag: string, ctor: CustomElementConstructor) {
  if (typeof customElements !== 'undefined' && !customElements.get(tag)) {
    customElements.define(tag, ctor);
  }
}
```

```ts
// src/core/interpolate.ts
export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) =>
    key in values ? String(values[key]) : '',
  );
}
```

> Fallback: jika `adoptedStyleSheets` tidak tersedia (browser lama), inject
> `<style>` ke template. Karena target kita evergreen, fallback bersifat opsional.

### 6.4 Storybook & CEM

- Storybook dengan `@storybook/web-components-vite`; story menampilkan props,
  event, slot, dan `part` yang tersedia.
- `cem analyze` menghasilkan `custom-elements.json` untuk auto API docs.
- `.storybook/preview.ts` memuat manifest itu dengan
  `setCustomElementsManifest(manifest)` sehingga panel docs/controls terisi
  otomatis, dan meng-import `dist/tokens.css` + `src/index.ts`.

---

## 7. Kontrak Komponen

```ts
// src/components/button/button.ts
import { MorphisElement, define, interpolate } from '@morphis/core';
import style from './button.css?inline';
import template from './button.template.html?raw';

export type ButtonVariant = 'primary' | 'secondary';

export class UiButton extends MorphisElement {
  static styles = [style];
  static template = template;

  static get observedAttributes() {
    return ['variant', 'disabled'];
  }

  get variant(): ButtonVariant {
    return (this.getAttribute('variant') as ButtonVariant) ?? 'primary';
  }
  set variant(value: ButtonVariant) {
    this.setAttribute('variant', value);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }
  set disabled(value: boolean) {
    this.toggleAttribute('disabled', value);
  }

  attributeChangedCallback() {
    if (this.isConnected) this.render();
  }

  // Dipasang sekali saat connect; memakai delegasi agar tahan re-render.
  protected attachEventListeners() {
    this.root.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest('.ui-button');
      if (!button || this.disabled) return;
      this.emit('ui-click', { variant: this.variant });
    });
  }

  protected renderTemplate() {
    this.root.innerHTML = interpolate(UiButton.template, { variant: this.variant });
    const button = this.root.querySelector('.ui-button');
    button?.toggleAttribute('disabled', this.disabled);
  }
}

define('ui-button', UiButton);
```

```html
<!-- src/components/button/button.template.html -->
<button class="ui-button ui-button--{{variant}}" part="button" type="button">
  <slot name="icon" part="icon"></slot>
  <span class="ui-button__label" part="label"><slot></slot></span>
</button>
```

> **Binding template**: file `.html?raw` diimpor sebagai string, jadi tidak ada
> ekspresi JS yang dievaluasi di dalamnya. Placeholder `{{...}}` diganti oleh
> helper `interpolate()` (`src/core/interpolate.ts`), lalu state seperti
> `disabled` diterapkan lewat DOM setelah `innerHTML`. Style **tidak** ikut di
> template; ia di-adopt dari `static styles` via `adoptedStyleSheets` (lihat §6.3).

- **Props/atribut** → `observedAttributes` + getter/setter.
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
 src/components/*/{ts,css,template} ─► Vite ─┬─► dist/components/*.js ──┐
                                             ├─► dist/morphis.js ───────┤
                                             └─► custom-elements.json ──┤
                                                                        ▼
                                            Storybook ◄── stories   dist/markup/*.html
                                                        per komponen (referensi Twig)
```

Pipeline (semua dalam satu paket): tiap komponen dikompilasi sebagai entry Vite
terpisah; CSS komponen di-adopt ke shadow. `tokens.css` di-ship terpisah dan
dimuat konsumen. `morphis.js` adalah bundel penuh untuk konsumsi CDN. CEM dan
markup dihasilkan dari sumber yang sama ke `custom-elements.json` dan `dist/`.

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
import '@morphis/components';
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
import '@morphis/components';
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
import '@morphis/components';
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
(`custom-elements.json` + `src/components/*/*.markup.html`):

- **Storybook** (`@storybook/web-components-vite`) di `.storybook/` — dokumentasi
  lengkap sekaligus *workbench*: story per komponen
  (`src/components/<name>/<name>.stories.ts`), MDX per komponen
  (`src/components/<name>/<name>.mdx`) dengan contoh live, controls, dan tabel API
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
| Ubah tampilan komponen | `src/components/<name>/<name>.ts` + `<name>.css` | semua konsumen berubah saat build |
| Ubah CSS satu komponen | `src/components/<name>/<name>.css` | hanya komponen itu berubah |
| Beda perilaku khusus | override class / extend `MorphisElement` | tanpa ubah sumber inti |
| Ganti warna/spacing global | `src/tokens/tokens.json` | semua komponen ikut |
| Themer ganti tema | `--ui-*` di `:root` | tanpa build ulang |
| Tata elemen internal | `ui-x::part(...)` | tanpa build ulang |
| Tambah komponen | `npm run gen component` (generator ditunda) | scaffold TS + CSS + story + markup |

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
| CEM tidak membaca getter/setter kompleks | Anotasi JSDoc + `@attr`/`@slot`/`@part`/`@event` |
| Slot tanpa konten merusak a11y | Slot default + fallback; uji dengan addon a11y |
| Bundel membesar | `preserveModules`/entry per komponen; audit ukuran di CI |

---

## 13. Roadmap

**Fase 0 — Fondasi**
- Init single-package npm (`package.json`, `tsconfig`, `vite.config.ts`).
- `src/tokens` (Style Dictionary) → `dist/tokens.css`.
- `src/core` (`MorphisElement`, `sheet`, `emit`, `define`, `interpolate`).
- `src/styles/base.css` (konteks `@apply` + blok `@theme`, tidak di-ship global).
- Lint (stylelint + eslint), CI dasar.

**Fase 1 — PoC 3 komponen**
- `button`, `input`, `card` sebagai custom element vanilla + Shadow DOM.
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
- Storybook Web Components: https://storybook.js.org/docs/web-components
