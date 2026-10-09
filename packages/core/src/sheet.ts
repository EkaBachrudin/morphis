const sheetCache = new Map<string, CSSStyleSheet>();
const registeredProperties = new Set<string>();
let propertySheet: CSSStyleSheet | undefined;
let propertySheetAttached = false;

export function supportsConstructableStylesheets(): boolean {
  return (
    typeof CSSStyleSheet !== 'undefined' &&
    typeof ShadowRoot !== 'undefined' &&
    'replaceSync' in CSSStyleSheet.prototype &&
    'adoptedStyleSheets' in ShadowRoot.prototype
  );
}

/**
 * Tailwind v4 emits `@property` rules that are ignored inside Shadow DOM.
 * We lift them to a single document-level stylesheet so utilities that depend
 * on registered custom properties (ring, shadow, gradient, translate, ...)
 * resolve correctly. See tailwindlabs/tailwindcss#15005.
 */
function hoistCustomProperties(sheet: CSSStyleSheet): void {
  if (typeof document === 'undefined' || typeof CSSPropertyRule === 'undefined') {
    return;
  }

  let added = false;
  for (const rule of sheet.cssRules) {
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

export function sheetFrom(css: string): CSSStyleSheet {
  let sheet = sheetCache.get(css);
  if (!sheet) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    sheetCache.set(css, sheet);
    hoistCustomProperties(sheet);
  }
  return sheet;
}

const STYLE_ATTR = 'data-morphis-style';

export function applyStyles(root: ShadowRoot, styles: string[]): void {
  if (supportsConstructableStylesheets()) {
    root.adoptedStyleSheets = styles.map(sheetFrom);
    return;
  }

  root.querySelectorAll(`style[${STYLE_ATTR}]`).forEach((node) => node.remove());
  for (const css of styles) {
    const style = document.createElement('style');
    style.setAttribute(STYLE_ATTR, '');
    style.textContent = css;
    root.append(style);
  }
}
