import { MorphisElement, define, interpolate } from '@morphis/core';
import style from './card.css?inline';
import template from './card.template.html?raw';

export type CardVariant = 'elevated' | 'outlined';

/**
 * Kartu framework-agnostic dengan header/body/footer.
 *
 * @element ui-card
 *
 * @attr {'elevated'|'outlined'} [variant=elevated] - Gaya visual kartu.
 *
 * @slot - Konten utama (body).
 * @slot header - Konten header. Disembunyikan bila kosong.
 * @slot footer - Konten footer. Disembunyikan bila kosong.
 *
 * @csspart card - Wrapper utama.
 * @csspart header - Area header.
 * @csspart body - Area body.
 * @csspart footer - Area footer.
 *
 * @cssprop [--ui-color-surface=#ffffff] - Warna latar kartu.
 * @cssprop [--ui-color-border=#e5e7eb] - Warna border/pemisah.
 */
export class UiCard extends MorphisElement {
  static override styles = [style];
  static override template = template;

  static get observedAttributes(): string[] {
    return ['variant'];
  }

  get variant(): CardVariant {
    return (this.getAttribute('variant') as CardVariant) ?? 'elevated';
  }

  set variant(value: CardVariant) {
    this.setAttribute('variant', value);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  protected override renderTemplate(): void {
    this.root.innerHTML = interpolate(UiCard.template, { variant: this.variant });
  }

  protected onConnected(): void {
    this.watchSlots();
  }

  private watchSlots(): void {
    this.root.querySelectorAll('slot').forEach((slot) => {
      const sync = (): void => {
        const wrapper = slot.parentElement;
        if (!wrapper) return;
        if (typeof slot.assignedNodes !== 'function') return;
        const assigned = slot.assignedNodes({ flatten: true });
        const visible = assigned.some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE ||
            (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''),
        );
        wrapper.hidden = !visible;
      };
      slot.addEventListener('slotchange', sync);
      sync();
    });
  }
}

define('ui-card', UiCard);
