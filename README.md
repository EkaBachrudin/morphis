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
npm run storybook          # Storybook dev di :6006
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

React ≥19 tidak butuh wrapper. Lihat [`docs/frameworks.md`](docs/frameworks.md).

## Dokumentasi & contoh

- [`npm run dev`](http://localhost:5173) — **docs UI**: sidebar komponen, preview
  interaktif, tabel API (dari CEM), dan snippet per-framework (Native/Twig/React/Vue/Angular)
- [`npm run storybook`](http://localhost:6006) — Storybook: docs per komponen +
  panduan (Intro/Theming/Drupal/Accessibility) + addon a11y
- [`docs/architecture.md`](docs/architecture.md) — arsitektur lengkap
- [`docs/drupal-integration.md`](docs/drupal-integration.md) — cara menyalin ke Drupal/Twig
- [`docs/theming.md`](docs/theming.md) — token, `::part()`, daftar event/slot/atribut
- [`docs/frameworks.md`](docs/frameworks.md) — integrasi React/Vue/Svelte/Angular/Solid
- [`examples/playground.html`](examples/playground.html) — demo semua komponen (jalankan `npx serve .`)
- [`examples/drupal/`](examples/drupal) — `morphis.libraries.yml` + contoh Twig

## Menambah komponen

```bash
npm run gen -- component <nama>   # buat .ts/.css/template/markup/stories/test + daftarkan di src/index.ts
```

Tambahkan anotasi JSDoc `@attr` pada komponen agar tabel & kontrol di docs UI
terisi otomatis (tipe, default, deskripsi).

## Pengembangan lokal

```bash
npm run storybook   # Storybook (HMR) di :6006
npm run dev         # docs UI live (HMR) di :5173 dari src/
npm run serve       # pratinjau hasil build dist/ di :4399
```

- `npm run dev` memuat komponen langsung dari `src/` sehingga edit `.ts/.css/
  .template.html` langsung tampil (full reload otomatis).
- Docs UI mengambil data API dari `custom-elements.json` (dibangun otomatis oleh
  `npm run dev`) dan contoh dari `*.markup.html`.
- Perubahan token (`src/tokens/tokens.json`) perlu `npm run build:tokens` lalu
  reload.

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
