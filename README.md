# Morphis — `@morphis/components`

Pustaka komponen **framework-agnostic** yang dibangun sekali sebagai **Custom
Elements** (Web Components native) dengan TypeScript, lalu dapat dipakai di
framework apa pun, HTML biasa, maupun Twig/Drupal.

- Sumber kebenaran: Vanilla Custom Elements + TypeScript
- Enkapsulasi: Shadow DOM (`mode: 'open'`)
- Styling: Tailwind v4 (build-time, `@apply`) + design token `--ui-*`
- Theming: CSS custom property + `::part()` + `::slotted()`
- Distribusi: satu paket npm + CDN + markup HTML untuk Drupal

Lihat [`docs/architecture.md`](docs/architecture.md) untuk arsitektur lengkap.

## Perintah

```bash
npm install
npm run build              # tokens + komponen + types + CEM + markup -> dist/
npm test                   # Vitest + @open-wc/testing (unit + integrasi React/Vue)
npm run test:e2e           # Playwright: visual regression + audit a11y (axe)
npm run test:e2e:update    # regenerasi baseline screenshot
npm run storybook          # Storybook (workbench + dokumentasi lengkap) di :6006
npm run build-storybook    # build Storybook statis -> storybook-static/
npm run typecheck          # tsc --noEmit
npm run lint               # ESLint
npm run lint:styles        # Stylelint
npm run gen -- component badge   # scaffold komponen baru
```

> Visual regression memakai Chromium milik Playwright (`npx playwright install
> chromium`). Baseline disimpan di `e2e/**-snapshots/`. Jalankan
> `test:e2e:update` hanya setelah perubahan tampilan yang disengaja.

## Konsumsi (HTML / CDN)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@morphis/components/dist/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@morphis/components/dist/morphis.js"></script>

<ui-button variant="primary">Simpan</ui-button>
```

## Theming runtime (tanpa rebuild)

```css
:root {
  --ui-color-primary: #e11d48;
}
```

## React wrapper (opsional, untuk React <19)

```tsx
import { Button, Input, Card } from '@morphis/components/react';
import '@morphis/components/tokens.css';

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
npm run gen -- component <nama>   # buat .ts/.css/template/markup/stories/test + daftarkan di src/index.ts
```

Tambahkan anotasi JSDoc `@attr`/`@slot`/`@csspart`/`@fires`/`@cssprop` pada
komponen. CEM hasilnya mengisi **tabel API Storybook** secara otomatis.

## Pengembangan lokal

```bash
npm run storybook   # Storybook (HMR) di :6006
npm run serve       # pratinjau hasil build dist/ di :4399
```

- Perubahan token (`src/tokens/tokens.json`) perlu `npm run build` (atau
  `build:tokens`) lalu reload.
- Halaman API di Storybook dibaca dari `custom-elements.json`, jadi jalankan
  `npm run build:cem` (sudah termasuk pada `npm run storybook`) setelah mengubah
  JSDoc komponen.

## Publikasi

```bash
npm run build            # prepublishOnly menjalankan ini otomatis
npm pack --dry-run       # cek isi paket (hanya dist/ + custom-elements.json)
npm publish              # scoped -> access: public (lihat publishConfig)
```

Versi dinaikkan manual (`npm version patch|minor|major`) sebelum publish.

## Catatan teknis penting

- **Tailwind v4 `@property` tidak berlaku di dalam Shadow DOM**
  (tailwindlabs/tailwindcss#15005). `MorphisElement` mengekstrak rule
  `@property` dari tiap stylesheet komponen dan mengangkatnya ke
  `document.adoptedStyleSheets` sekali, sehingga utility `ring`, `shadow`,
  `gradient`, `translate`, dll. tetap bekerja.
- Utilitas Tailwind **hanya** dipakai di dalam `@apply` pada file CSS komponen,
  tidak pernah di markup. Markup hanya berisi struktur + BEM + `<slot>`.
- Setiap file CSS komponen wajib diawali `@reference "../../styles/base.css"`.
