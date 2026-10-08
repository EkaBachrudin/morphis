# Cara Menyalin Morphis ke Drupal

Morphis adalah HTML native (Custom Elements) + satu file JS kecil + satu file
token CSS. **Tidak ada framework JavaScript yang perlu dipasang di Drupal** —
tidak perlu React/Vue/Angular, tidak perlu npm di sisi tema.

Artefak yang dibutuhkan ada di `dist/`:

```
dist/
├── morphis.js               # bundle penuh (auto-register semua komponen) — untuk CDN/HTML
├── components/*/*.js        # per komponen (opsional, muat yang dipakai saja)
├── tokens.css               # WAJIB (global, dimuat sekali)
├── markup/*.html            # contoh markup siap tempel ke Twig
└── types/                   # deklarasi TypeScript (untuk konsumen TS, bukan Drupal)
```

## 1. Salin file ke tema

Salin `dist/tokens.css` dan `dist/morphis.js` (atau hanya `dist/components/**`
yang dipakai) ke dalam tema, misalnya:

```
themes/custom/mytheme/
└── libraries/
    └── morphis/
        ├── morphis.js
        └── tokens.css
```

## 2. Definisikan Drupal library

`themes/custom/mytheme/mytheme.libraries.yml`:

```yaml
morphis:
  version: 0.1.0
  css:
    base:
      libraries/morphis/tokens.css: {}
  js:
    libraries/morphis/morphis.js:
      attributes:
        type: module
```

`version` sebaiknya diisi agar cache busting berjalan. Tipe `module` wajib
karena Morphis adalah ESM.

## 3. Attach library

**Global** (semua halaman) — `mytheme.info.yml`:

```yaml
libraries:
  - mytheme/morphis
```

**Per template** (disarankan agar hemat) — di dalam file Twig:

```twig
{{ attach_library('mytheme/morphis') }}
```

## 4. Tempel markup ke Twig

Ambil contoh dari `dist/markup/*.html`. Markup akhir adalah HTML native + slot:

```twig
{{ attach_library('mytheme/morphis') }}

<ui-button variant="{{ button_variant|default('primary') }}">
  <span slot="icon">{{ icon }}</span>
  {{ label }}
</ui-button>
```

```twig
<ui-card variant="outlined">
  <span slot="header">{{ title }}</span>
  {{ body }}
  <span slot="footer">{{ footer }}</span>
</ui-card>
```

> **Aturan:** jangan menulis utility Tailwind di markup Twig. Atribut yang
> tersedia hanyalah atribut publik komponen (lihat `custom-elements.json` atau
> Storybook). Styling dilakukan lewat token `--ui-*` atau `::part()`.

## 5. Theming tanpa build

Override token di CSS tema (dimuat setelah `tokens.css`):

```css
:root {
  --ui-color-primary: #e11d48;
  --ui-color-primary-hover: #be123c;
}
```

Atau per instance:

```twig
<ui-button variant="primary" style="--ui-color-primary:#16a34a">Simpan</ui-button>
```

Lihat [`theming.md`](theming.md) untuk daftar token dan `part` lengkap.

## 6. Progressive enhancement & FOUC

Komponen baru terdefinisi setelah `morphis.js` dieksekusi. `tokens.css`
dirender sejak awal sehingga warna dasar sudah benar. Untuk menyembunyikan
konten yang belum terdefinisi:

```css
ui-button:not(:defined),
ui-input:not(:defined),
ui-card:not(:defined) {
  visibility: hidden;
}
```

Jangan mengatur `display: none` pada elemen `:not(:defined)` jika komponen
penting untuk tata letak, cukup `visibility`.

## 7. Alternatif CDN (tanpa menyalin file)

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@morphis/components/dist/tokens.css">
<script type="module" src="https://cdn.jsdelivr.net/npm/@morphis/components/dist/morphis.js"></script>
```

Atau per komponen:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@morphis/components/dist/components/button/button.js"></script>
```

## 8. Menata elemen internal

Gunakan Shadow Parts:

```css
ui-button::part(button) {
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

ui-input::part(input) {
  border-radius: 9999px;
}
```

## Checklist

- [ ] `tokens.css` dimuat **sebelum** markup komponen.
- [ ] `morphis.js` dimuat dengan `type: module`.
- [ ] Override token ditulis setelah `tokens.css`.
- [ ] Cache di-clear setelah mengganti file (`drush cr`).
- [ ] Tidak ada utility Tailwind di Twig.
