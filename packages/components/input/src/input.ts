import { MorphisElement, define, interpolate } from '@morphis/core';
import style from './input.css?inline';
import template from './input.template.html?raw';

/**
 * Input teks framework-agnostic.
 *
 * @element ui-input
 *
 * @attr {'text'|'email'|'password'|'number'|'search'|'tel'|'url'} [type=text] - Tipe input HTML.
 * @attr {string} [value] - Nilai awal input.
 * @attr {string} [placeholder] - Teks placeholder.
 * @attr {string} [label] - Label yang ditampilkan di atas input.
 * @attr {boolean} [disabled=false] - Menonaktifkan input.
 * @attr {boolean} [readonly=false] - Membuat input hanya-baca.
 * @attr {string} [name] - Nama field untuk form submission.
 * @attr {boolean} [invalid=false] - Menandai input dalam keadaan tidak valid.
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
  static override styles = [style];
  static override template = template;

  #input?: HTMLInputElement;
  #labelEl?: HTMLElement;
  #labelSlot?: HTMLSlotElement;

  static get observedAttributes(): string[] {
    return ['value', 'type', 'placeholder', 'disabled', 'readonly', 'name', 'label', 'invalid'];
  }

  get value(): string {
    return this.#input?.value ?? this.getAttribute('value') ?? '';
  }

  set value(next: string) {
    this.setAttribute('value', next);
    if (this.#input && this.#input.value !== next) this.#input.value = next;
  }

  get type(): string {
    return this.getAttribute('type') ?? 'text';
  }

  set type(next: string) {
    this.setAttribute('type', next);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(next: boolean) {
    this.toggleAttribute('disabled', next);
  }

  attributeChangedCallback(): void {
    if (this.isConnected) this.render();
  }

  protected override render(): void {
    super.render();
    this.sync();
  }

  protected override renderTemplate(): void {
    if (this.#input) return;
    this.root.innerHTML = interpolate(UiInput.template, {
      label: this.getAttribute('label') ?? '',
    });
    this.#input = this.root.querySelector<HTMLInputElement>('.ui-input') ?? undefined;
    this.#labelEl = this.root.querySelector<HTMLElement>('.ui-field__label') ?? undefined;
    this.#labelSlot = this.root.querySelector<HTMLSlotElement>('slot[name="label"]') ?? undefined;
  }

  private sync(): void {
    const input = this.#input;
    if (!input) return;

    input.type = this.type;
    input.placeholder = this.getAttribute('placeholder') ?? '';
    input.disabled = this.disabled;
    input.readOnly = this.hasAttribute('readonly');
    input.toggleAttribute('aria-invalid', this.hasAttribute('invalid'));

    const name = this.getAttribute('name');
    if (name) input.name = name;
    else input.removeAttribute('name');

    const value = this.getAttribute('value') ?? '';
    if (document.activeElement !== input && input.value !== value) {
      input.value = value;
    }

    if (this.#labelEl) {
      const hasSlotted = Boolean(this.querySelector('[slot="label"]'));
      const hasLabel = hasSlotted || (this.getAttribute('label') ?? '') !== '';
      this.#labelEl.hidden = !hasLabel;
    }

    if (this.#labelSlot && !this.querySelector('[slot="label"]')) {
      this.#labelSlot.textContent = this.getAttribute('label') ?? '';
    }
  }

  protected attachEventListeners(): void {
    this.root.addEventListener('input', (event) => {
      const input = event.target as HTMLInputElement;
      if (!input.classList.contains('ui-input')) return;
      this.emit('ui-input', { value: input.value });
    });

    this.root.addEventListener('change', (event) => {
      const input = event.target as HTMLInputElement;
      if (!input.classList.contains('ui-input')) return;
      this.emit('ui-change', { value: input.value });
    });
  }
}

define('ui-input', UiInput);
