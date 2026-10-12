import { MorphisElement, define, html, property, litStyles } from '@morphis/core';
import style from './button.css?inline';

export type ButtonVariant = 'primary' | 'secondary';

/**
 * Tombol framework-agnostic.
 *
 * @element ui-button
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
  static override styles = litStyles(style);

  /** Gaya visual tombol. */
  @property({ reflect: true }) variant: ButtonVariant = 'primary';

  /** Menonaktifkan tombol. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  override render() {
    return html`
      <button
        class="ui-button ui-button--${this.variant}"
        part="button"
        type="button"
        ?disabled=${this.disabled}
        @click=${this.#onClick}
      >
        <slot name="icon" part="icon"></slot>
        <span class="ui-button__label" part="label"><slot></slot></span>
      </button>
    `;
  }

  #onClick = (): void => {
    if (this.disabled) return;
    this.emit('ui-click', { variant: this.variant });
  };
}

define('ui-button', UiButton);
