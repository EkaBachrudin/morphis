---
"@eka-morphis/tokens": patch
"@eka-morphis/components": patch
---

fix(types): sertakan deklarasi tipe `tokens.css` (`tokens.css.d.ts`) dan ekspor
kondisi `types` sehingga `import '.../tokens.css'` tidak lagi memicu TS2882 di
konsumer TypeScript (mis. Angular).
