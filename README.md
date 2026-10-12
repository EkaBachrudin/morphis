# Morphis — monorepo komponen

Pustaka komponen **framework-agnostic** yang dibangun sekali sebagai **Custom
Elements** (Web Components native) dengan **Lit 3 + TypeScript**, lalu dapat
dipakai di framework apa pun, HTML biasa, maupun Twig/Drupal.

- Sumber kebenaran: Lit 3 (LitElement) + TypeScript
- Enkapsulasi: Shadow DOM (`mode: 'open'`)
- Styling: Tailwind v4 (build-time, `@apply`) + design token `--ui-*`
- Theming: CSS custom property + `::part()` + `::slotted()`
- Distribusi: **paket npm per komponen** (versioning independen) + markup HTML untuk Drupal
- Prinsip: *build once, run anywhere* — custom element standar (Lit), tanpa compiler framework per-target, tanpa version floor

Lihat [`docs/architecture.md`](docs/architecture.md) untuk arsitektur lengkap.

## Masalah developer & solusinya

| Masalah umum | Solusi Morphis |
| --- | --- |
| Komponen harus ditulis ulang per framework (React/Vue/Angular/Svelte). | Satu Custom Element native (`<ui-button>`) berjalan di semua framework karena browser memperlakukannya sebagai elemen HTML biasa. |
| Library framework punya *version floor* — artefak build hanya jalan di konsumen ≥ versi build. | **Nol version floor**: hanya memakai standar web (Custom Elements, Shadow DOM, ES Modules), bukan compiler framework. |
| Menambah framework/versi baru menuntut build ulang. | Tidak ada multi-target compile; satu bundel cukup untuk semua konsumen. |
| CSS library bertabrakan dengan CSS aplikasi induk. | **Shadow DOM** (`mode: 'open'`) mengenkapsulasi style & markup penuh — tak bocor keluar dan tak terpengaruh CSS aplikasi. |
| Ganti tema/warna butuh rebuild library. | Theming runtime via design token `--ui-*` yang **diwariskan menembus shadow boundary**; override tanpa build ulang. |
| Susah menata elemen internal komponen dari luar. | Ekspos lewat `part="..."` (`ui-button::part(label)`) dan `::slotted()` untuk konten slot. |
| Integrasi ke CMS/Drupal ribet, butuh build tooling. | Cukup salin **tiga file** (`tokens.css`, `*.iife.js`, `*.markup.html`) — script klasik tanpa `type="module"`. |
| Memperbaiki satu komponen memaksa penaikan versi semua komponen. | **Paket npm per komponen** dengan semver independen (Changesets); memperbaiki `card` tidak menaikkan `button`. |
| Dokumentasi API cepat usang / drift dengan kode. | **Custom Elements Manifest** (`custom-elements.json`) men-generate tabel API Storybook otomatis dari anotasi JSDoc. |
| Runtime framework membengkakkan ukuran bundel. | **Runtime minimal** (Lit ±5–6 KB gzip, di-*share* lintas komponen) + entry per komponen sehingga tree-shakable. |
| Event komponen tidak sampai ke framework induk. | `CustomEvent` dengan `bubbles: true, composed: true` menembus shadow dan ditangkap framework induk. |

## Kemudahan (Developer Experience)

- **Generator komponen** — `npm run gen -- component badge` langsung membuat paket
  `@morphis/<nama>` (package.json, tsconfig, `src/{nama}.ts`, `.css`,
  `.template.html`, `env.d.ts`, `.markup.html`, `.stories.ts`, `.test.ts`) dan
  mendaftarkannya di meta.
- **Satu permukaan dokumentasi (Storybook)** — contoh live, controls, **tabel API
  otomatis** (Attributes/Events/Slots/CSS Parts/CSS Custom Properties dari CEM),
  snippet per-framework lewat toolbar **Framework** (Native/Twig/React/Vue/Angular),
  panduan, dan addon a11y.
- **Snippet siap tempel** — tiap paket menghasilkan `<nama>.js` (ESM), `<nama>.iife.js`
  (script klasik untuk Drupal), dan `<nama>.markup.html` (markup untuk Twig).
- **Wrapper React opsional** (`@morphis/react`) untuk React 16.8–18; React ≥19 tidak butuh wrapper.
- **Rantai kualitas** — Vitest + `@open-wc/testing-helpers` (unit + integrasi React/Vue),
  Playwright (visual regression + audit a11y axe), ESLint (TypeScript via `typescript-eslint`,
  CSS via `@eslint/css`), `tsc --noEmit`.
- **Rilis per paket** — Changesets dengan semver independen + CI otomatis.

## Paket

| Paket | Isi |
| --- | --- |
| `@morphis/core` | Base class `MorphisElement` (extends `LitElement`) + helper (`define`, `emit`, `litStyles`) + re-export Lit (`html`, `css`, `nothing`, `property`, `state`, `repeat`) |
| `@morphis/tokens` | `tokens.css` (design token `--ui-*`) |
| `@morphis/button`, `@morphis/card`, `@morphis/input`, `@morphis/select`, … | Satu Web Component per paket (versi independen) |
| `@morphis/react` | Wrapper tipis untuk React 16.8–18 |
| `@morphis/components` | Meta-bundle: `morphis.js` (semua komponen) + `tokens.css` |

## Perintah

```bash
npm install
npm run build              # tokens + core + semua paket komponen + types + CEM
npm test                   # Vitest + @open-wc/testing-helpers (unit + integrasi React/Vue)
npm run test:e2e           # Playwright: visual regression + audit a11y (axe)
npm run test:e2e:update    # regenerasi baseline screenshot
npm run storybook          # Storybook (workbench + dokumentasi lengkap) di :6006
npm run build-storybook    # build Storybook statis -> storybook-static/
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
npm run lint:styles        # ESLint untuk CSS (via @eslint/css)
npm run audit:prod         # npm audit khusus produksi (devDependencies diabaikan)
npm run audit:ci           # gate audit CI (gagal hanya pada severity critical)
npm run gen -- component badge   # scaffold paket komponen baru
npm run changeset          # catat perubahan untuk rilis
npm run version-packages   # naikkan versi paket yang berubah
npm run release            # build + publish paket yang berubah
```

> Visual regression memakai Chromium milik Playwright (`npx playwright install
> chromium`). Baseline disimpan di `e2e/**-snapshots/`. Jalankan
> `test:e2e:update` hanya setelah perubahan tampilan yang disengaja.

## Arsitektur singkat

- **Base class** `MorphisElement` (`@morphis/core`): turunan `LitElement`
  (reactive properties + `render()` deklaratif dengan `html`), ditambah helper
  `emit` event.
- **Enkapsulasi**: Shadow DOM (`mode: 'open'`) agar DevTools, testing, dan
  `::part()` bekerja.
- **Styling**: Tailwind v4 hanya di *build-time* melalui `@apply` pada file CSS
  komponen; hasilnya di-inject ke shadow root, bukan global.
- **Token**: `--ui-*` didefinisikan global (`tokens.css`), fallback ditulis di
  `:host`, dan diwariskan menembus shadow.

## Konsumsi

### Meta-bundle (semua komponen sekaligus)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@morphis/components/dist/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@morphis/components/dist/morphis.js"></script>

<ui-button variant="primary">Simpan</ui-button>
```

### Per komponen (versi independen)

```js
import '@morphis/button';   // mendaftarkan <ui-button>
import '@morphis/tokens/tokens.css';
```

### Drupal (comot native, tanpa CDN)

Salin **tiga file** dari paket yang dipakai ke tema Drupal:

```
@morphis/tokens/dist/tokens.css        -> libraries/morphis/tokens.css
@morphis/button/dist/button.iife.js    -> libraries/morphis/button.iife.js
@morphis/button/dist/button.html       -> markup siap tempel ke Twig
```

`*.iife.js` adalah script klasik (tidak butuh `type="module"`); `*.js` ESM
tersedia untuk bundler modern. Lihat [`examples/drupal/`](examples/drupal).

Contoh Twig:

```twig
{{ attach_library('tema/morphis') }}

<ui-button variant="{{ button_variant|default('primary') }}">
  <span slot="icon">{{ icon }}</span>
  {{ label }}
</ui-button>
```

## Theming runtime (tanpa rebuild)

```css
:root {
  --ui-color-primary: #e11d48;
}
```

| Kebutuhan | Cara |
| --- | --- |
| Ganti warna/spacing global | Override `--ui-*` di `:root` |
| Ganti warna per instance | Set `--ui-*` di atribut `style` elemen |
| Tata elemen internal tertentu | `ui-button::part(label) { ... }` |
| Tata konten slot | `ui-button::slotted(p) { ... }` |
| Ganti total tampilan | `overrides/` atau ganti file `<nama>.css` |

Karena custom property diwariskan, override di `:root`, `.tema`, atau langsung di
elemen (`<ui-button style="--ui-color-primary:#e11d48">`) tetap sampai ke dalam
shadow — **tanpa rebuild**.

## React wrapper (opsional, untuk React <19)

```tsx
import { Button, Input, Card } from '@morphis/react';
import '@morphis/tokens/tokens.css';

<Button variant="primary" onUiClick={(e) => console.log(e.detail)}>Simpan</Button>
```

React ≥19 tidak butuh wrapper. Lihat panduan **Framework** di Storybook.

## Dokumentasi & contoh

Satu permukaan dokumentasi (**Storybook**), satu sumber data
(`custom-elements.json` + `*.markup.html`):

- [`npm run storybook`](http://localhost:6006) — **dokumentasi lengkap**:
  - per komponen: contoh live, tabel API (Attributes/Events/Slots/CSS Parts/CSS
    Custom Properties dari CEM), dan snippet per-framework lewat toolbar
    **Framework** (Native/Twig/React/Vue/Angular);
  - panduan: Mulai, Theming, Integrasi Drupal, Framework, Accessibility;
  - addon a11y.
- `docs/architecture.md` — arsitektur lengkap
- [`docs/publishing.md`](docs/publishing.md) — panduan rilis Changesets
- [`examples/playground.html`](examples/playground.html) — demo semua komponen (jalankan `npm run serve`)
- [`examples/drupal/`](examples/drupal) — `morphis.libraries.yml` + contoh Twig

## Menambah komponen

```bash
npm run gen -- component <nama>   # buat paket @morphis/<nama> + daftarkan di meta
npm install                       # link workspace
```

Generator membuat `packages/components/<nama>/` berisi `package.json`,
`tsconfig.json`, dan
`src/{<nama>.ts,.css,.template.html,.markup.html,.stories.ts,.test.ts}`.
Komponen dibuat dengan Lit: template ditulis di file `<nama>.template.html` dan
diimpor lewat suffix Vite `?html` (`vite-plugin-lit-template`), sedangkan state
dideklarasikan lewat `@property`/`@state`. Semua komponen bawaan memakai pola ini.

Anotasi JSDoc `@slot`/`@csspart`/`@fires`/`@cssprop` pada komponen mengisi
**tabel API Storybook** secara otomatis. Atribut **tidak** perlu `@attr` manual:
CEM (`litelement: true`) membacanya dari `@property`.

## Pengembangan lokal

```bash
npm run storybook   # Storybook (HMR) di :6006
npm run serve       # pratinjau hasil build di :4399
```

- Perubahan token (`packages/tokens/src/tokens.json`) perlu `npm run build`
  (atau `npm run build:tokens`) lalu reload.
- Halaman API di Storybook dibaca dari `custom-elements.json`, jadi jalankan
  `npm run build:cem` (sudah termasuk pada `npm run storybook`) setelah mengubah
  JSDoc komponen.

## Support matrix

Tidak ada **version floor**: arsitektur ini berjalan di framework/versi apa pun
yang bisa merender HTML. Yang ada hanyalah **catatan integrasi** kecil per framework.

| Target | Dukungan | Catatan integrasi |
| --- | --- | --- |
| HTML / Twig / Drupal | Langsung | Import `morphis.js` + `tokens.css`; theming via `--ui-*` / `::part()` |
| React ≥19 | Langsung | Property & event custom element deklaratif |
| React 16.8–18 | Langsung + wrapper | Atribut string; custom event via `ref` atau `@morphis/react` |
| Angular | Langsung | `CUSTOM_ELEMENTS_SCHEMA`; import sekali di `main.ts` |
| Vue 3 | Langsung | `compilerOptions.isCustomElement` untuk prefix `ui-` |
| Vue 2 | Langsung (opsional) | Gunakan via tag HTML; hindari binding Vue-specific |
| Svelte | Langsung | Import sekali; event `on:ui-*` |
| Solid / Qwik | Langsung | Import sekali; event seperti DOM biasa |
| Meta-framework (Next/Nuxt/SvelteKit) | Client hydration | Import di boundary client; anti-FOUC via tokens global |

## Publikasi (versioning independen)

Rilis diatur dengan [Changesets](https://github.com/changesets/changesets):

```bash
npm run changeset          # pilih paket + jenis bump, tulis ringkasan
npm run version-packages   # naikkan versi HANYA paket yang berubah
npm run release            # build + publish paket yang berubah
npm pack --dry-run -w @morphis/button   # cek isi satu paket
```

Paket yang tidak berubah tidak di-publish dan versinya tetap. CI menjalankan
alur ini otomatis lewat `.github/workflows/release.yml`.

Panduan lengkap: [`docs/publishing.md`](docs/publishing.md) (juga tersedia di
Storybook → **Panduan/Publikasi**).

## Catatan teknis penting

- **Tailwind v4 `@property` tidak berlaku di dalam Shadow DOM**
  (tailwindlabs/tailwindcss#15005). Helper `litStyles()` (`@morphis/core`)
  mengekstrak rule `@property` dari tiap stylesheet komponen dan mengangkatnya
  ke `document.adoptedStyleSheets` sekali, sehingga utility `ring`, `shadow`,
  `gradient`, `translate`, dll. tetap bekerja.
- Utilitas Tailwind **hanya** dipakai di dalam `@apply` pada file CSS komponen,
  tidak pernah di markup. Markup hanya berisi struktur + BEM + `<slot>`.
- Setiap file CSS komponen wajib diawali
  `@reference "../../../../src/styles/base.css"`.
- **Audit dependency**: `npm run audit:prod` dan `npm run audit:ci` melaporkan
  **0 vulnerability**. Rantai `braces` (GHSA-vfj7-8cjw-p6xm) yang sebelumnya
  masuk lewat tooling telah dihilangkan dengan mengganti analyzer ke
  `@lit-labs/analyzer` dan linter CSS ke `@eslint/css`.
- **Install script dependency** (npm ≥ 11.19 memblokirnya secara default):
  `esbuild` diizinkan lewat field `allowScripts` di `package.json`
  (`"esbuild": true`, name-only agar tetap berlaku saat versinya naik). Untuk
  merawat daftar ini: `npm install-scripts ls` (lihat yang belum di-approve) dan
  `npm install-scripts prune` (hapus entri basi).

## Catatan & batasan

- **Client-side / progressive enhancement** — Web Component baru aktif setelah JS
  jalan. Risiko FOUC dimitigasi dengan `tokens.css` global, style host minimal,
  `:not(:defined)`, dan define-on-client.
- **SSR + Shadow DOM** tergolong rumit, sehingga SSR tidak menjadi target utama.
- **React <19** tidak dapat bind custom event secara deklaratif → gunakan `ref`
  atau wrapper `@morphis/react`.
