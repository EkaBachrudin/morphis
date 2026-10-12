/**
 * Permukaan publik `@eka-morphis/core`.
 *
 * Menyediakan base class {@link MorphisElement}, helper (`define`, `emit`,
 * `litStyles`), dan re-export API Lit yang dipakai komponen (`html`, `css`,
 * `nothing`, `property`, `state`, tipe hasil render).
 */
export {
  html,
  css,
  nothing,
  LitElement,
  type TemplateResult,
  type CSSResult,
  type PropertyValues,
} from 'lit';
export { repeat } from 'lit/directives/repeat.js';
export { property, state } from 'lit/decorators.js';
export { MorphisElement } from './element';
export { emit } from './emit';
export { define } from './define';
export { litStyles } from './sheet';
