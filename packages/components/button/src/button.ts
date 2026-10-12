import { MorphisElement, define, property, litStyles, type TemplateResult } from '@eka-morphis/core';
import style from './button.css?inline';
import buttonTemplate from './button.template.html?html';

export type ButtonVariant = 'primary' | 'secondary';

/** Data yang dioper ke template `button.template.html`. */
interface ButtonTemplateContext {
  variant: ButtonVariant;
  disabled: boolean;
  onClick: () => void;
}

const renderButton = buttonTemplate as (ctx: ButtonTemplateContext) => TemplateResult;

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

  override render(): TemplateResult {
    return renderButton({
      variant: this.variant,
      disabled: this.disabled,
      onClick: this.#onClick,
    });
  }

  #onClick = (): void => {
    if (this.disabled) return;
    this.emit('ui-click', { variant: this.variant });
  };
}

define('ui-button', UiButton);
