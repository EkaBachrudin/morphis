# React + TypeScript (custom elements)

Komponen Morphis adalah custom element standar (`<ui-*>`). React merender-nya,
tetapi TypeScript tidak mengenali tag tersebut secara otomatis sehingga muncul
error:

```
Property 'ui-other-offer' does not exist on type 'JSX.IntrinsicElements'.
```

Ada dua cara mengatasinya.

## 1. Pakai wrapper bertipe dari `@eka-morphis/react` (disarankan)

Wrapper menangani property, atribut, dan event (`on<Event>`) sekaligus memberi
autocomplete tanpa augmentasi JSX.

```bash
npm i @eka-morphis/react
```

```tsx
import { OtherOffer } from '@eka-morphis/react';
import '@eka-morphis/tokens/tokens.css';

const CARDS = [
  { offer: 'roaming', label: 'Roaming', badge: 'Streaming', badgeIcon: 'plane', title: 'Roaming' },
];

export function Example() {
  return (
    <OtherOffer
      title="Penawaran Paket Lainnya"
      footerLabel="Lihat Selengkapnya"
      cards={CARDS}
      onUiOfferClick={(event) => console.log((event as CustomEvent).detail)}
    />
  );
}
```

Wrapper yang tersedia: `Button`, `Input`, `Card`, `Select`, `OtherOffer`.
Untuk komponen lain, buat wrapper sendiri:

```tsx
import { createComponent } from '@eka-morphis/react';
import type { UiBadge } from '@eka-morphis/badge';

export const Badge = createComponent<UiBadge>('ui-badge');
```

## 2. Pakai tag mentah + augmentasi JSX

Bila ingin tetap menulis `<ui-other-offer>` langsung, deklarasikan tipenya di
project React Anda. Buat `src/custom-elements.d.ts`:

```ts
import type { DetailedHTMLProps, HTMLAttributes } from 'react';
import type { UiOtherOffer } from '@eka-morphis/other-offer';

type UiOtherOfferAttributes = {
  title?: string;
  subtitle?: string;
  'footer-label'?: string;
  cards?: string;
};

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'ui-other-offer': DetailedHTMLProps<
        HTMLAttributes<UiOtherOffer>,
        UiOtherOffer
      > & UiOtherOfferAttributes;
    }
  }
}
```

> React 19 menghapus namespace global `JSX` (kini `React.JSX`), karena itu
> augmentasi memakai `declare module 'react'`. Untuk React ≤ 18 gunakan
> `declare global { namespace JSX { interface IntrinsicElements { ... } } }`.

Tambahkan satu blok per tag yang dipakai. Setelah mengubah `.d.ts`, restart TS
server atau jalankan ulang build.

## Catatan atribut

- Nama atribut mengikuti `kebab-case` yang tercatat di
  `custom-elements.json` (CEM). Contoh: property `footerLabel` dipetakan ke
  atribut `footer-label`.
- Atribut kompleks seperti `cards`/`options` menerima **string JSON**:
  `cards='[{ "offer": "…", "label": "…" }]'`.
- Event komponen (`ui-offer-click`, `ui-view-all`, `ui-click`, `ui-change`)
  ditangkap lewat `addEventListener` (atau `on<Event>` pada wrapper React).
