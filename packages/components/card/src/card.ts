import { MorphisElement, define, property, state, litStyles, type TemplateResult } from '@eka-morphis/core';
import style from './card.css?inline';
import cardTemplate from './card.template.html?html';

export type CardVariant = 'elevated' | 'outlined';

/** Data yang dioper ke template `card.template.html`. */
interface CardTemplateContext {
  variant: CardVariant;
  headerEmpty: boolean;
  footerEmpty: boolean;
}

const renderCard = cardTemplate as (ctx: CardTemplateContext) => TemplateResult;

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

  override render(): TemplateResult {
    return renderCard({
      variant: this.variant,
      headerEmpty: this._headerEmpty,
      footerEmpty: this._footerEmpty,
    });
  }

  override firstUpdated(): void {
    const header = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="header"]');
    const footer = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="footer"]');
    header?.addEventListener('slotchange', this.#onHeaderSlot);
    footer?.addEventListener('slotchange', this.#onFooterSlot);
    this.#sync(header, true);
    this.#sync(footer, false);
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
