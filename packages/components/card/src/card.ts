import { MorphisElement, define, html, property, state, litStyles } from '@morphis/core';
import style from './card.css?inline';

export type CardVariant = 'elevated' | 'outlined';

function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot.assignedNodes({ flatten: true }).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''),
  );
}

/**
 * Kartu framework-agnostic dengan header/body/footer.
 *
 * @element ui-card
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
  static override styles = litStyles(style);

  /** Gaya visual kartu. */
  @property({ reflect: true }) variant: CardVariant = 'elevated';

  @state() private _headerEmpty = true;
  @state() private _footerEmpty = true;

  override render() {
    return html`
      <div class="ui-card ui-card--${this.variant}" part="card">
        <div class="ui-card__header" part="header" ?hidden=${this._headerEmpty}>
          <slot name="header" @slotchange=${this.#onHeaderSlot}></slot>
        </div>
        <div class="ui-card__body" part="body"><slot></slot></div>
        <div class="ui-card__footer" part="footer" ?hidden=${this._footerEmpty}>
          <slot name="footer" @slotchange=${this.#onFooterSlot}></slot>
        </div>
      </div>
    `;
  }

  override firstUpdated(): void {
    this.#sync(this.renderRoot.querySelector('slot[name="header"]'), true);
    this.#sync(this.renderRoot.querySelector('slot[name="footer"]'), false);
  }

  #onHeaderSlot = (event: Event): void => {
    this.#sync(event.target as HTMLSlotElement, true);
  };

  #onFooterSlot = (event: Event): void => {
    this.#sync(event.target as HTMLSlotElement, false);
  };

  #sync(slot: HTMLSlotElement | null, header: boolean): void {
    if (!slot) return;
    const empty = !slotHasContent(slot);
    if (header) this._headerEmpty = empty;
    else this._footerEmpty = empty;
  }
}

define('ui-card', UiCard);
