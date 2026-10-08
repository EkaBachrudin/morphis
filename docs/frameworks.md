# Integrasi Framework

Prinsip Morphis: **import sekali** agar custom element terdaftar, lalu pakai tag
HTML-nya. Karena `<ui-*>` adalah elemen native, **semua versi framework** bekerja
tanpa build khusus dan tanpa version floor.

```ts
// cukup sekali (biasanya di entry/main)
import '@morphis/components';
```

Lihat [`theming.md`](theming.md) untuk daftar atribut, slot, part, dan event
tiap komponen.

## Kontrak yang dipakai semua framework

| Interaksi | Mekanisme |
|---|---|
| Mengirim data masuk | atribut (string) atau property (objek/boolean) |
| Menerima data keluar | `CustomEvent` dengan `bubbles: true, composed: true` |
| Komposisi konten | `<slot>` (default & bernama) |
| Enkapsulasi style | Shadow DOM + `::part()` |
| Tema | CSS custom property `--ui-*` yang diwariskan menembus shadow |

Nama event: `ui-click`, `ui-input`, `ui-change`.

---

## React

### React ≥ 19 — langsung

```tsx
import '@morphis/components';
import { useRef } from 'react';

export function App() {
  const ref = useRef<HTMLElement>(null);
  return (
    <ui-button ref={ref} variant="primary">Simpan</ui-button>
  );
}
```

React 19 mendukung property dan custom event pada custom element secara
deklaratif.

### React 16.8 – 18 — pakai wrapper `@morphis/components/react`

```tsx
import { Button, Input, Card } from '@morphis/components/react';
import '@morphis/components/tokens.css';

export function Form() {
  return (
    <Card variant="outlined">
      <span slot="header">Kontak</span>
      <Input label="Email" type="email" value="a@b.c" />
      <Button
        variant="primary"
        onUiClick={(event) => console.log(event.detail)}
      >
        Simpan
      </Button>
    </Card>
  );
}
```

- Props non-event (`variant`, `disabled`, `value`, `label`, ...) otomatis
  diterapkan sebagai property bila ada, jika tidak sebagai atribut.
- Handler `on<PascalCase>` di-bind ke event kebab-case: `onUiClick` → `ui-click`.
- `ref` diteruskan ke elemen custom (`ref.current` = `HTMLElement`).
- Butuh React sebagai **peer dependency opsional**; hanya khusus React <19.

`createComponent` tersedia untuk membungkus komponen lain:

```tsx
import { createComponent } from '@morphis/components/react';
const MyThing = createComponent<HTMLElement>('ui-thing');
```

---

## Vue 3

Vue memperlakukan `<ui-*>` sebagai elemen native; cukup tandai sebagai custom
element agar compiler tidak mengira ini komponen Vue.

```ts
// vite.config.ts
import vue from '@vitejs/plugin-vue';
export default {
  plugins: [
    vue({
      template: {
        compilerOptions: { isCustomElement: (tag) => tag.startsWith('ui-') },
      },
    }),
  ],
};
```

```vue
<script setup lang="ts">
import '@morphis/components';
import '@morphis/components/tokens.css';

function onClick(event: CustomEvent) {
  console.log(event.detail);
}
</script>

<template>
  <ui-button variant="primary" @ui-click="onClick">Simpan</ui-button>
  <ui-input label="Email" type="email" />
</template>
```

Vue 3 memetakan `@ui-click` menjadi `onUiClick` secara otomatis.

---

## Svelte

```svelte
<script lang="ts">
  import '@morphis/components';
  import '@morphis/components/tokens.css';
  function onClick(event: CustomEvent) {
    console.log(event.detail);
  }
</script>

<ui-button variant="primary" on:ui-click={onClick}>Simpan</ui-button>
<ui-input label="Email" type="email" />
```

SvelteKit: impor komponen di boundary client (`onMount`/`browser`) agar tidak
menyentuh SSR, dan muat `tokens.css` global untuk mencegah FOUC.

---

## Angular

```ts
// main.ts
import '@morphis/components';
import '@morphis/components/tokens.css';
```

```ts
// app.module.ts
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

@NgModule({ schemas: [CUSTOM_ELEMENTS_SCHEMA] })
export class AppModule {}
```

```html
<ui-button variant="primary" (ui-click)="onClick($event)">Simpan</ui-button>
```

Standalone components: tambahkan `CUSTOM_ELEMENTS_SCHEMA` di `schemas` komponen.

---

## Solid / Qwik

```tsx
import '@morphis/components';
```

```tsx
// Solid
<ui-button variant="primary" on:ui-click={onClick}>Simpan</ui-button>

// Qwik
<ui-button variant="primary" onClick$={onClick}>Simpan</ui-button>
```

Event custom ditangkap seperti event DOM biasa.

---

## Meta-framework (Next/Nuxt/SvelteKit)

- Impor komponen di **client boundary** saja (hindari SSR).
- Muat `tokens.css` di dokumen global untuk mencegah FOUC.
- Untuk menyembunyikan komponen yang belum terdefinisi:

```css
:not(:defined) { visibility: hidden; }
```

---

## Mengirim data kompleks

Atribut hanya string. Untuk nilai kompleks, set property lewat ref:

```tsx
const ref = useRef<HTMLElement>(null);
useEffect(() => { if (ref.current) (ref.current as any).label = 'Email'; }, []);
```

Wrapper React `@morphis/components/react` menangani ini otomatis (property bila
tersedia, atribut jika tidak).
