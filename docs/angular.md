# Angular + TypeScript (custom elements)

Komponen Morphis adalah custom element standar (`<ui-*>`). Angular bisa
merender-nya, tetapi TypeScript perlu diberi tahu dua hal:

1. `CUSTOM_ELEMENTS_SCHEMA` agar Angular tidak mengeluh soal tag `<ui-*>`.
2. Deklarasi tipe untuk import `*.css` (lihat bawah) agar tidak muncul
   `TS2882`.

## Render tag `<ui-*>`

Daftarkan `CUSTOM_ELEMENTS_SCHEMA` di komponen yang memakainya (standalone atau
NgModule). Untuk event, ikut tipe `UiOtherOffer` dan pakai `addEventListener`
seperti DOM biasa.

```ts
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import '@eka-morphis/other-offer';

@Component({
  selector: 'app-example',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<ui-other-offer [attr.title]="title"></ui-other-offer>`,
})
export class ExampleComponent {
  title = 'Penawaran Paket Lainnya';
}
```

## Kenapa muncul `TS2882`

```
Cannot find module or type declarations for side-effect import of
'@eka-morphis/tokens/tokens.css'. ts(2882)
```

TypeScript tidak mengenali `.css` sebagai modul: sebuah *side-effect import*
harus bisa diresolusi ke kode atau ke deklarasi tipe, sedangkan stylesheet bukan
keduanya.

- **React (Vite/Next)** lolos begitu saja karena template-nya menyertakan
  deklarasi wildcard: Vite lewat `vite/client` (`declare module '*.css' {}`) dan
  Next lewat `next-env.d.ts`.
- **Angular** default `tsconfig`-nya `"types": []` dan tidak menyertakan
  deklarasi wildcard `.css`. Angular CLI tetap bisa mem-bundle import CSS saat
  build, tetapi type-checker-nya tidak tahu — `ng build` bisa jalan, yang merah
  hanya `tsc`/IDE.

Pemicu: sejak TypeScript 5.6 ada flag `noUncheckedSideEffectImports`, dan
TypeScript 6.0 mengecek side-effect import secara default.

> Sejak `@eka-morphis/tokens` versi terbaru, import
> `.../tokens.css` sudah membawa deklarasi tipe sehingga error ini umumnya
> hilang. Bila masih muncul (mis. versi lama), gunakan salah satu opsi di bawah.

## Opsi A — deklarasi wildcard (paling langsung)

Buat file di project, mis. `src/css.d.ts`:

```ts
declare module '*.css';
```

Pastikan file ikut masuk `include` di `tsconfig` (default `src/**/*` sudah
mencakup). Restart TS server / IDE bila perlu.

## Opsi B — muat token via `angular.json` (disarankan untuk token global)

Untuk design token `--ui-*` yang memang global, paling rapi dimuat lewat build
Angular, bukan lewat import TS:

```json
// angular.json
{
  "projects": {
    "<app>": {
      "architect": {
        "build": {
          "options": {
            "styles": [
              "node_modules/@eka-morphis/tokens/dist/tokens.css",
              "src/styles.css"
            ]
          }
        }
      }
    }
  }
}
```

Dengan cara ini tidak ada import TS sama sekali untuk token, dan theming via
`--ui-*` tetap berjalan karena custom property diwariskan.

## Catatan atribut

- Nama atribut mengikuti `kebab-case` di `custom-elements.json` (CEM), mis.
  property `footerLabel` → atribut `footer-label`.
- Atribut kompleks (`cards`/`options`) menerima **string JSON**.
- Event (`ui-offer-click`, `ui-click`, `ui-change`, dll.) ditangkap lewat
  `addEventListener` atau binding Angular.
