import { unsafeCSS, type CSSResult } from 'lit';

const registeredProperties = new Set<string>();
let propertySheet: CSSStyleSheet | undefined;
let propertySheetAttached = false;

/**
 * Tailwind v4 emits `@property` rules that are ignored inside Shadow DOM.
 * We lift them to a single document-level stylesheet so utilities that depend
 * on registered custom properties (ring, shadow, gradient, translate, ...)
 * resolve correctly. See tailwindlabs/tailwindcss#15005.
 */
function hoistCustomProperties(css: string): void {
  if (typeof document === 'undefined' || typeof CSSPropertyRule === 'undefined') {
    return;
  }

  const probe = new CSSStyleSheet();
  probe.replaceSync(css);

  let added = false;
  for (const rule of probe.cssRules) {
    if (!(rule instanceof CSSPropertyRule)) continue;
    if (registeredProperties.has(rule.name)) continue;
    registeredProperties.add(rule.name);
    propertySheet ??= new CSSStyleSheet();
    propertySheet.insertRule(rule.cssText);
    added = true;
  }

  if (added && propertySheet && !propertySheetAttached) {
    propertySheetAttached = true;
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, propertySheet];
  }
}

/**
 * Reset `box-sizing` untuk shadow root.
 *
 * Preflight Tailwind tidak ikut ke Shadow DOM (stylesheet komponen hanya
 * me-`@reference` base), sehingga elemen ber-`w-full` + padding meluber ke
 * kanan. Ditulis di luar `@layer` agar menang atas rule ber-`@layer`.
 */
const BOX_SIZING_RESET = ':host, *, *::before, *::after { box-sizing: border-box; }\n';

/**
 * Menyiapkan string CSS komponen untuk `static styles` Lit.
 *
 * Mengangkat rule `@property` (Tailwind v4) ke document level sekali, lalu
 * mengembalikan `CSSResult` yang diadopsi Lit ke shadow root.
 */
export function litStyles(css: string): CSSResult {
  hoistCustomProperties(css);
  return unsafeCSS(BOX_SIZING_RESET + css);
}
