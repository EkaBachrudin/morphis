import { MorphisElement, define, interpolate } from '@morphis/core';
import style from './button.css?inline';
import template from './button.template.html?raw';

export type ButtonVariant = 'primary' | 'secondary';

/**
 * Tombol framework-agnostic.
 *
 * @element ui-button
 *
 * @attr {'primary'|'secondary'} [variant=primary] - Gaya visual tombol.
 * @attr {boolean} [disabled=false] - Menonaktifkan tombol.
 *
 * @slot - Label teks tombol.
 * @slot icon - Ikon opsional di sisi kiri label.
 *
 * @csspart button - Elemen `<button>` internal.
 * @csspart icon - Wrapper untuk slot ikon.
 * @csspart label - Wrapper untuk slot label.
 *
 * @cssprop [--ui-color-primary=#2563eb] - Warna latar varian `primary`.
 * @cssprop [--ui-color-primary-hover=#1d4ed8] - Warna latar `primary` saat hover.
 * @cssprop [--ui-color-on-primary=#ffffff] - Warna teks varian `primary`.
 * @cssprop [--ui-color-surface=#ffffff] - Warna latar varian `secondary`.
 * @cssprop [--ui-color-on-surface=#111827] - Warna teks varian `secondary`.
 * @cssprop [--ui-color-border=#e5e7eb] - Warna border varian `secondary`.
 *
 * @fires ui-click - Dipancarkan saat tombol diklik. `detail: { variant }`.
 */
export class UiButton extends MorphisElement {
  static override styles = [style];
  static override template = template;

  static get observedAttributes(): string[] {
    return ['variant', 'disabled'];
  }

  get variant(): ButtonVariant {
    return (this.getAttribute('variant') as ButtonVariant) ?? 'primary';
  }

  set variant(value: ButtonVariant) {
    this.setAttribute('variant', value);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(value: boolean) {
    this.toggleAttribute('disabled', value);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  protected attachEventListeners(): void {
    this.root.addEventListener('click', (event) => {
      const button = (event.target as HTMLElement).closest('.ui-button');
      if (!button || this.disabled) return;
      this.emit('ui-click', { variant: this.variant });
    });
  }

  protected override renderTemplate(): void {
    this.root.innerHTML = interpolate(UiButton.template, { variant: this.variant });
    const button = this.root.querySelector<HTMLButtonElement>('.ui-button');
    button?.toggleAttribute('disabled', this.disabled);
  }
}

define('ui-button', UiButton);
