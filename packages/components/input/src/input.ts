import {
  MorphisElement,
  define,
  html,
  nothing,
  property,
  state,
  litStyles,
} from '@morphis/core';
import style from './input.css?inline';

function slotHasContent(slot: HTMLSlotElement): boolean {
  return slot.assignedNodes({ flatten: true }).some(
    (node) =>
      node.nodeType === Node.ELEMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== ''),
  );
}

/**
 * Input teks framework-agnostic.
 *
 * @element ui-input
 *
 * @slot label - Label kustom, menggantikan atribut `label`.
 *
 * @csspart field - Wrapper `<label>`.
 * @csspart label - Elemen label.
 * @csspart input - Elemen `<input>` internal.
 *
 * @cssprop [--ui-color-border=#e5e7eb] - Warna border input.
 * @cssprop [--ui-color-primary=#2563eb] - Warna ring saat fokus.
 * @cssprop [--ui-color-surface=#ffffff] - Warna latar input.
 *
 * @fires ui-input - Setiap nilai berubah. `detail: { value }`.
 * @fires ui-change - Nilai dikomit. `detail: { value }`.
 */
export class UiInput extends MorphisElement {
  static override styles = litStyles(style);

  /** Nilai input. */
  @property({ reflect: true }) value = '';

  /** Tipe input HTML. */
  @property({ reflect: true }) type = 'text';

  /** Teks placeholder. */
  @property({ reflect: true }) placeholder = '';

  /** Nama field untuk form submission. */
  @property({ reflect: true }) name = '';

  /** Label yang ditampilkan di atas input. */
  @property({ reflect: true }) label = '';

  /** Menonaktifkan input. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Membuat input hanya-baca. */
  @property({ type: Boolean, reflect: true }) readonly = false;

  /** Menandai input dalam keadaan tidak valid. */
  @property({ type: Boolean, reflect: true }) invalid = false;

  @state() private _slotLabel = false;

  override render() {
    return html`
      <label class="ui-field" part="field">
        <span class="ui-field__label" part="label" ?hidden=${!this.#hasLabel()}>
          <slot name="label" @slotchange=${this.#onLabelSlot}>${this.label}</slot>
        </span>
        <input
          class="ui-input"
          part="input"
          type=${this.type}
          name=${this.name || nothing}
          placeholder=${this.placeholder}
          ?disabled=${this.disabled}
          ?readonly=${this.readonly}
          aria-invalid=${this.invalid ? '' : nothing}
          @input=${this.#onInput}
          @change=${this.#onChange}
        />
      </label>
    `;
  }

  override firstUpdated(): void {
    const slot = this.renderRoot.querySelector<HTMLSlotElement>('slot[name="label"]');
    if (slot) this._slotLabel = slotHasContent(slot);
    this.#syncValue();
  }

  override updated(): void {
    this.#syncValue();
  }

  #hasLabel(): boolean {
    return this._slotLabel || this.label !== '';
  }

  #syncValue(): void {
    const input = this.renderRoot.querySelector<HTMLInputElement>('.ui-input');
    if (!input) return;
    if (this.shadowRoot?.activeElement !== input && input.value !== this.value) {
      input.value = this.value;
    }
  }

  #onLabelSlot = (event: Event): void => {
    this._slotLabel = slotHasContent(event.target as HTMLSlotElement);
  };

  #onInput = (event: Event): void => {
    this.emit('ui-input', { value: (event.target as HTMLInputElement).value });
  };

  #onChange = (event: Event): void => {
    this.emit('ui-change', { value: (event.target as HTMLInputElement).value });
  };
}

define('ui-input', UiInput);
