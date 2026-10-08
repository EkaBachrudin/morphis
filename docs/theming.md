# Theming & Kustomisasi Morphis

Semua kustomisasi runtime dilakukan lewat **CSS custom property** (`--ui-*`) dan
**Shadow Parts** (`::part()`). Tidak perlu build ulang dan tidak perlu menyentuh
kode komponen.

## 1. Tingkat kustomisasi

| Kebutuhan | Cara | Build ulang? |
|---|---|---|
| Ganti warna/spacing global | override `--ui-*` di `:root` | Tidak |
| Ganti warna per instance | set `--ui-*` di atribut `style` elemen | Tidak |
| Tata elemen internal tertentu | `ui-x::part(...)` | Tidak |
| Tata konten yang di-slot | `ui-x::slotted(...)` | Tidak |
| Ganti total tampilan | edit `src/components/<name>/<name>.css` | Ya |

## 2. Design token

Token global dihasilkan dari `src/tokens/tokens.json` ke `dist/tokens.css`.
Nilai default:

| Token | Default | Dipakai oleh |
|---|---|---|
| `--ui-color-primary` | `#2563eb` | button primary, ring input |
| `--ui-color-primary-hover` | `#1d4ed8` | button primary hover |
| `--ui-color-on-primary` | `#ffffff` | teks di atas primary |
| `--ui-color-surface` | `#ffffff` | latar button secondary, input, card |
| `--ui-color-on-surface` | `#111827` | teks utama |
| `--ui-color-border` | `#e5e7eb` | border input, card, pemisah |

Karena custom property **diwariskan menembus Shadow DOM**, override di level
mana pun akan sampai ke dalam komponen:

```css
/* global */
:root { --ui-color-primary: #e11d48; }

/* scoped ke sebuah seksi */
.theme-dark { --ui-color-surface: #0b1020; --ui-color-on-surface: #e5e7eb; }
```

```html
<!-- per instance, inline -->
<ui-button variant="primary" style="--ui-color-primary:#16a34a">Simpan</ui-button>
```

## 3. Shadow Parts per komponen

### `ui-button`

- Atribut: `variant` (`primary` | `secondary`), `disabled`
- Slot: default (label), `icon`
- Part: `button`, `icon`, `label`
- Event: `ui-click` (`detail: { variant }`)

```css
ui-button::part(button) {
  text-transform: uppercase;
  letter-spacing: 0.03em;
  border-radius: 0;
}
ui-button::part(icon) { color: currentColor; }
```

### `ui-input`

- Atribut: `value`, `type`, `placeholder`, `disabled`, `readonly`, `name`, `label`, `invalid`
- Slot: `label` (menggantikan atribut `label`)
- Part: `field`, `label`, `input`
- Event: `ui-input`, `ui-change` (`detail: { value }`)

```css
ui-input::part(input) {
  border-radius: 9999px;
  padding-inline: 1rem;
}
ui-input::part(label) {
  font-weight: 600;
  text-transform: uppercase;
}
```

### `ui-card`

- Atribut: `variant` (`elevated` | `outlined`)
- Slot: default (body), `header`, `footer` (header/footer otomatis tersembunyi bila kosong)
- Part: `card`, `header`, `body`, `footer`
- Event: —

```css
ui-card::part(card) {
  border-radius: 1.5rem;
  box-shadow: 0 10px 30px rgb(0 0 0 / 0.15);
}
ui-card::part(header) {
  background: var(--ui-color-surface);
}
```

## 4. Menata konten yang di-slot

Konten yang kamu tulis di light DOM (di antara tag `ui-*`) dapat ditata dengan
`::slotted()` dari dalam, tetapi **cara yang disarankan** adalah menata langsung
di CSS aplikasi karena konten itu milikmu:

```css
.ui-button__label { font-weight: 700; }
```

`::slotted()` hanya berguna bila kamu memaketkan style bersama komponen:

```css
ui-button::slotted(span[slot='icon']) {
  font-size: 1.25rem;
}
```

## 5. Mengganti tampilan total (build ulang)

Jika `::part()` dan token tidak cukup:

1. Edit `src/components/<name>/<name>.css` (dan `<name>.template.html` bila
   perlu mengubah struktur).
2. Jalankan `npm run build`.
3. Salin ulang `dist/` ke konsumen.

Ingat aturan disiplin:

- Utility Tailwind **hanya** di dalam `@apply` pada file CSS komponen — tidak
  pernah di markup.
- Rule BEM ditulis sebagai rule terpisah; native CSS nesting tidak mendukung
  `&--modifier`.
- Wajib diawali `@reference "../../styles/base.css"`.

## 6. Menambah token baru

1. Tambahkan entri di `src/tokens/tokens.json` (format DTCG).
2. Tambahkan pemetaannya di `src/styles/base.css` pada blok `@theme`
   (`--color-<nama>: var(--ui-color-<nama>, <fallback>)`).
3. Jalankan `npm run build:tokens` lalu pakai `@apply bg-<nama>` di CSS komponen.
