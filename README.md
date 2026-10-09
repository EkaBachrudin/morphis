# Morphis — monorepo komponen

Pustaka komponen **framework-agnostic** yang dibangun sekali sebagai **Custom
Elements** (Web Components native) dengan TypeScript, lalu dapat dipakai di
framework apa pun, HTML biasa, maupun Twig/Drupal.

- Sumber kebenaran: Vanilla Custom Elements + TypeScript
- Enkapsulasi: Shadow DOM (`mode: 'open'`)
- Styling: Tailwind v4 (build-time, `@apply`) + design token `--ui-*`
- Theming: CSS custom property + `::part()` + `::slotted()`
- Distribusi: **paket npm per komponen** (versioning independen) + markup HTML untuk Drupal

Lihat [`docs/architecture.md`](docs/architecture.md) untuk arsitektur lengkap.

## Paket

| Paket | Isi |
| --- | --- |
| `@morphis/core` | Base class `MorphisElement` + helper (`define`, `emit`, `interpolate`, `applyStyles`) |
| `@morphis/tokens` | `tokens.css` (design token `--ui-*`) |
| `@morphis/button`, `@morphis/card`, `@morphis/input`, `@morphis/select`, … | Satu Web Component per paket (versi independen) |
| `@morphis/react` | Wrapper tipis untuk React 16.8–18 |
| `@morphis/components` | Meta-bundle: `morphis.js` (semua komponen) + `tokens.css` |

## Perintah

```bash
npm install
npm run build              # tokens + core + semua paket komponen + types + CEM
npm test                   # Vitest + @open-wc/testing (unit + integrasi React/Vue)
npm run test:e2e           # Playwright: visual regression + audit a11y (axe)
npm run test:e2e:update    # regenerasi baseline screenshot
npm run storybook          # Storybook (workbench + dokumentasi lengkap) di :6006
npm run build-storybook    # build Storybook statis -> storybook-static/
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
npm run lint:styles        # Stylelint
npm run gen -- component badge   # scaffold paket komponen baru
npm run changeset          # catat perubahan untuk rilis
npm run version-packages   # naikkan versi paket yang berubah
npm run release            # build + publish paket yang berubah
```

> Visual regression memakai Chromium milik Playwright (`npx playwright install
> chromium`). Baseline disimpan di `e2e/**-snapshots/`. Jalankan
> `test:e2e:update` hanya setelah perubahan tampilan yang disengaja.

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

## Theming runtime (tanpa rebuild)

```css
:root {
  --ui-color-primary: #e11d48;
}
```

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
- [`examples/playground.html`](examples/playground.html) — demo semua komponen (jalankan `npm run serve`)
- [`examples/drupal/`](examples/drupal) — `morphis.libraries.yml` + contoh Twig

## Menambah komponen

```bash
npm run gen -- component <nama>   # buat paket @morphis/<nama> + daftarkan di meta
npm install                       # link workspace
```

Generator membuat `packages/components/<nama>/` berisi `package.json`,
`tsconfig.json`, dan `src/{<nama>.ts,.css,.template.html,.markup.html,.stories.ts,.test.ts}`.

Tambahkan anotasi JSDoc `@attr`/`@slot`/`@csspart`/`@fires`/`@cssprop` pada
komponen. CEM hasilnya mengisi **tabel API Storybook** secara otomatis.

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
  (tailwindlabs/tailwindcss#15005). `MorphisElement` mengekstrak rule
  `@property` dari tiap stylesheet komponen dan mengangkatnya ke
  `document.adoptedStyleSheets` sekali, sehingga utility `ring`, `shadow`,
  `gradient`, `translate`, dll. tetap bekerja.
- Utilitas Tailwind **hanya** dipakai di dalam `@apply` pada file CSS komponen,
  tidak pernah di markup. Markup hanya berisi struktur + BEM + `<slot>`.
- Setiap file CSS komponen wajib diawali
  `@reference "../../../../src/styles/base.css"`.
