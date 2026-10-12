---
"@morphis/core": minor
"@morphis/button": minor
"@morphis/card": minor
"@morphis/input": minor
"@morphis/select": minor
"@morphis/components": minor
"@morphis/react": minor
---

feat!: fondasi komponen pindah ke **Lit 3**.

- `MorphisElement` kini menurunkan `LitElement` (reactive properties + `render()`
  deklaratif dengan `html`); helper `emit()` dipertahankan.
- `@morphis/core` mengekspor `html`, `css`, `nothing`, `property`, `state`,
  `repeat`, dan `litStyles`; menghapus `interpolate()`.
- File `*.template.html` dihapus — template hidup di dalam `render()`.
- CEM memakai `litelement: true`; **Attributes** dibaca otomatis dari `@property`.
- Build ESM menge-*external* `lit` & `@morphis/core`; varian IIFE dan meta-bundle
  membundel keduanya (self-contained).
- Runtime Lit ±5–6 KB gzip di-*share* lintas komponen (menggantikan klaim "0 runtime").
