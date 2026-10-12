import {
  MorphisElement,
  define,
  html,
  nothing,
  property,
  state,
  repeat,
  litStyles,
  type PropertyValues,
} from '@morphis/core';
import style from './select.css?inline';

export interface SelectOption {
  value: string;
  label: string;
}

function parseOptions(value: string | null): SelectOption[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as SelectOption[]) : [];
  } catch {
    return [];
  }
}

/**
 * Dropdown pilihan framework-agnostic (select-only combobox, panel dikustom).
 *
 * Opsi diberikan lewat property `options` (array `{ value, label }`) atau
 * atribut `options` berisi JSON. Nilai terpilih lewat atribut/property `value`.
 *
 * @element ui-select
 *
 * @fires ui-change - Saat pilihan berubah. `detail: { value, label }`.
 *
 * @csspart field - Wrapper keseluruhan.
 * @csspart label - Elemen label.
 * @csspart trigger - Tombol pemicu.
 * @csspart value - Teks nilai terpilih.
 * @csspart chevron - Ikon panah.
 * @csspart listbox - Panel daftar opsi.
 * @csspart option - Tiap opsi.
 *
 * @cssprop [--ui-color-surface=#ffffff] - Warna latar kontrol.
 * @cssprop [--ui-color-on-surface=#111827] - Warna teks.
 * @cssprop [--ui-color-border=#e5e7eb] - Warna border.
 * @cssprop [--ui-color-primary=#2563eb] - Warna aksen opsi aktif/terpilih.
 */
export class UiSelect extends MorphisElement {
  static override styles = litStyles(style);

  /** Daftar opsi `{ value, label }`. Bisa di-set sebagai JSON pada atribut. */
  @property({ converter: { fromAttribute: parseOptions } })
  options: SelectOption[] = [];

  /** Nilai opsi terpilih. */
  @property({ reflect: true }) value = '';

  /** Menonaktifkan kontrol. */
  @property({ type: Boolean, reflect: true }) disabled = false;

  /** Label di atas trigger. */
  @property() label = '';

  /** Teks saat belum ada nilai. */
  @property() placeholder = 'Pilih…';

  @state() private _open = false;
  @state() private _activeIndex = -1;

  #typeahead = '';
  #typeaheadTimer?: ReturnType<typeof setTimeout>;
  #uid = `ui-select-${Math.random().toString(36).slice(2, 8)}`;

  override connectedCallback(): void {
    super.connectedCallback();
    document.addEventListener('pointerdown', this.#onDocumentPointerDown, true);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown, true);
  }

  override willUpdate(changed: PropertyValues): void {
    if (changed.has('options')) this._activeIndex = -1;
  }

  override updated(): void {
    if (this._open && this._activeIndex >= 0) {
      const active = this.renderRoot.querySelector<HTMLElement>('.ui-select__option.is-active');
      active?.scrollIntoView?.({ block: 'nearest' });
    }
  }

  override render() {
    const options = this.#options();
    const selected = options.find((option) => option.value === this.value);
    const hasLabel = this.label !== '';
    const ariaLabel = this.getAttribute('aria-label');
    const activeDescendant =
      this._open && this._activeIndex >= 0 ? `${this.#uid}-opt-${this._activeIndex}` : nothing;

    return html`
      <div
        class="ui-select"
        part="field"
        @click=${this.#onRootClick}
        @mouseover=${this.#onRootMouseover}
        @keydown=${this.#onRootKeydown}
      >
        <span
          class="ui-select__label"
          part="label"
          id=${`${this.#uid}-label`}
          ?hidden=${!hasLabel}
          >${this.label}</span
        >
        <button
          class="ui-select__trigger ${this._open ? 'is-open' : ''}"
          part="trigger"
          type="button"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded=${String(this._open)}
          aria-controls=${`${this.#uid}-listbox`}
          aria-labelledby=${hasLabel ? `${this.#uid}-label` : nothing}
          aria-label=${!hasLabel && ariaLabel ? ariaLabel : nothing}
          aria-activedescendant=${activeDescendant}
          ?disabled=${this.disabled}
        >
          <span
            class="ui-select__value ${selected ? '' : 'is-placeholder'}"
            part="value"
            >${selected?.label ?? this.placeholder}</span
          >
          <span class="ui-select__chevron" part="chevron" aria-hidden="true"></span>
        </button>
        <ul
          class="ui-select__listbox"
          part="listbox"
          id=${`${this.#uid}-listbox`}
          role="listbox"
          ?hidden=${!this._open}
        >
          ${repeat(
            options,
            (option) => option.value,
            (option, index) => html`
              <li
                class="ui-select__option ${index === this._activeIndex
                  ? 'is-active'
                  : ''} ${option.value === this.value ? 'is-selected' : ''}"
                part="option"
                role="option"
                id=${`${this.#uid}-opt-${index}`}
                data-index=${String(index)}
                aria-selected=${String(option.value === this.value)}
              >${option.label}</li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  #options(): SelectOption[] {
    if (!Array.isArray(this.options)) return [];
    return this.options
      .filter((option) => option && typeof option.value === 'string')
      .map((option) => ({ value: option.value, label: String(option.label ?? option.value) }));
  }

  #trigger(): HTMLButtonElement | null {
    return this.renderRoot.querySelector<HTMLButtonElement>('.ui-select__trigger');
  }

  #setActive(index: number): void {
    const count = this.#options().length;
    if (count === 0) return;
    this._activeIndex = ((index % count) + count) % count;
  }

  #moveActive(delta: number): void {
    if (this.#options().length === 0) return;
    if (!this._open) {
      this.#openList();
      return;
    }
    const base = this._activeIndex < 0 ? (delta > 0 ? -1 : 0) : this._activeIndex;
    this.#setActive(base + delta);
  }

  #openList(): void {
    if (this.disabled || this._open || this.#options().length === 0) return;
    const selectedIndex = this.#options().findIndex((option) => option.value === this.value);
    this._activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this._open = true;
  }

  #closeList(focusTrigger = true): void {
    if (!this._open) return;
    this._open = false;
    this._activeIndex = -1;
    if (focusTrigger && !this.disabled) this.#trigger()?.focus();
  }

  #selectActive(): void {
    const option = this.#options()[this._activeIndex];
    if (option) this.#commit(option);
  }

  #commit(option: SelectOption): void {
    const changed = option.value !== this.value;
    if (changed) this.value = option.value;
    this.#closeList();
    if (changed) this.emit('ui-change', { value: option.value, label: option.label });
  }

  #typeaheadSearch(char: string): void {
    this.#typeahead += char.toLowerCase();
    clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = setTimeout(() => {
      this.#typeahead = '';
    }, 500);
    if (!this._open) this.#openList();
    const match = this.#options().findIndex((option) =>
      option.label.toLowerCase().startsWith(this.#typeahead),
    );
    if (match >= 0) this.#setActive(match);
  }

  #onRootClick = (event: Event): void => {
    if (this.disabled) return;
    const target = event.target as HTMLElement;
    if (target.closest('.ui-select__trigger')) {
      if (this._open) this.#closeList();
      else this.#openList();
      return;
    }
    const item = target.closest<HTMLElement>('.ui-select__option');
    if (item) {
      this._activeIndex = Number(item.dataset.index);
      this.#selectActive();
    }
  };

  #onRootMouseover = (event: Event): void => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('.ui-select__option');
    if (!item) return;
    const index = Number(item.dataset.index);
    if (index !== this._activeIndex) this._activeIndex = index;
  };

  #onRootKeydown = (event: Event): void => {
    if (this.disabled) return;
    const { key } = event as KeyboardEvent;
    if (key === 'ArrowDown') {
      event.preventDefault();
      this.#moveActive(1);
    } else if (key === 'ArrowUp') {
      event.preventDefault();
      this.#moveActive(-1);
    } else if (key === 'Home') {
      if (this._open) {
        event.preventDefault();
        this.#setActive(0);
      }
    } else if (key === 'End') {
      if (this._open) {
        event.preventDefault();
        this.#setActive(this.#options().length - 1);
      }
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (this._open) this.#selectActive();
      else this.#openList();
    } else if (key === 'Escape') {
      if (this._open) {
        event.preventDefault();
        this.#closeList();
      }
    } else if (key === 'Tab') {
      this.#closeList(false);
    } else if (key.length === 1 && /\S/.test(key)) {
      this.#typeaheadSearch(key);
    }
  };

  #onDocumentPointerDown = (event: Event): void => {
    if (!this._open) return;
    if (event.composedPath().includes(this)) return;
    this.#closeList(false);
  };
}

define('ui-select', UiSelect);
