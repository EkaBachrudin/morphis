declare module '*.html?html' {
  import type { TemplateResult } from 'lit';

  /** Template Lit hasil kompilasi file `.html?html` oleh `vite-plugin-lit-template`. */
  const template: (ctx: any) => TemplateResult;
  export default template;
}
