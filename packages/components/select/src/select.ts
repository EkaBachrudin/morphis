import { MorphisElement, define, interpolate } from '@morphis/core';
import style from './select.css?inline';
import template from './select.template.html?raw';

export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Dropdown pilihan framework-agnostic (select-only combobox, panel dikustom).
 *
 * Opsi diberikan lewat property `options` (array `{ value, label }`) atau
 * atribut `options` berisi JSON. Nilai terpilih lewat atribut/property `value`.
 *
 * @element ui-select
 *
 * @attr {string} [value] - Nilai opsi terpilih.
 * @attr {boolean} [disabled=false] - Menonaktifkan kontrol.
 * @attr {string} [label] - Label di atas trigger.
 * @attr {string} [placeholder=Pilih…] - Teks saat belum ada nilai.
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
  static override styles = [style];
  static override template = template;

  #trigger?: HTMLButtonElement;
  #valueEl?: HTMLElement;
  #labelEl?: HTMLElement;
  #listbox?: HTMLElement;
  #options: SelectOption[] = [];
  #activeIndex = -1;
  #open = false;
  #built = false;
  #typeahead = '';
  #typeaheadTimer?: ReturnType<typeof setTimeout>;
  #uid = `ui-select-${Math.random().toString(36).slice(2, 8)}`;

  static get observedAttributes(): string[] {
    return ['value', 'disabled', 'label', 'placeholder', 'options'];
  }

  get options(): SelectOption[] {
    return this.#options;
  }

  set options(next: SelectOption[]) {
    this.#setOptions(Array.isArray(next) ? next : []);
  }

  get value(): string {
    return this.getAttribute('value') ?? '';
  }

  set value(next: string) {
    this.setAttribute('value', next);
  }

  get disabled(): boolean {
    return this.hasAttribute('disabled');
  }

  set disabled(next: boolean) {
    this.toggleAttribute('disabled', next);
  }

  attributeChangedCallback(name: string): void {
    if (name === 'options') {
      this.#applyOptionsAttribute();
      return;
    }
    if (this.isConnected) this.render();
  }

  protected override render(): void {
    super.render();
    if (!this.#built) {
      this.#built = true;
      this.#trigger = this.root.querySelector<HTMLButtonElement>('.ui-select__trigger') ?? undefined;
      this.#valueEl = this.root.querySelector<HTMLElement>('.ui-select__value') ?? undefined;
      this.#labelEl = this.root.querySelector<HTMLElement>('.ui-select__label') ?? undefined;
      this.#listbox = this.root.querySelector<HTMLElement>('.ui-select__listbox') ?? undefined;
      if (this.#labelEl) this.#labelEl.id = `${this.#uid}-label`;
      if (this.#listbox) this.#listbox.id = `${this.#uid}-listbox`;
      this.#trigger?.setAttribute('aria-controls', `${this.#uid}-listbox`);
      this.#renderOptions();
    }
    this.#sync();
  }

  protected override renderTemplate(): void {
    if (this.#built) return;
    this.root.innerHTML = interpolate(UiSelect.template, {
      label: this.getAttribute('label') ?? '',
    });
  }

  protected attachEventListeners(): void {
    this.root.addEventListener('click', this.#onRootClick);
    this.root.addEventListener('mouseover', this.#onRootMouseover);
    this.root.addEventListener('keydown', this.#onRootKeydown);
  }

  protected onConnected(): void {
    document.addEventListener('pointerdown', this.#onDocumentPointerDown, true);
  }

  protected onDisconnected(): void {
    document.removeEventListener('pointerdown', this.#onDocumentPointerDown, true);
  }

  #setOptions(next: SelectOption[]): void {
    this.#options = next
      .filter((option) => option && typeof option.value === 'string')
      .map((option) => ({ value: option.value, label: String(option.label ?? option.value) }));
    if (this.#built) {
      this.#activeIndex = -1;
      this.#renderOptions();
      this.#sync();
    }
  }

  #applyOptionsAttribute(): void {
    const raw = this.getAttribute('options');
    if (!raw) return;
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        this.#setOptions(parsed as SelectOption[]);
      }
    } catch {
      /* abaikan JSON tidak valid */
    }
  }

  #renderOptions(): void {
    const listbox = this.#listbox;
    if (!listbox) return;
    listbox.innerHTML = '';
    this.#options.forEach((option, index) => {
      const item = document.createElement('li');
      item.className = 'ui-select__option';
      item.setAttribute('part', 'option');
      item.setAttribute('role', 'option');
      item.id = `${this.#uid}-opt-${index}`;
      item.dataset.index = String(index);
      item.textContent = option.label;
      listbox.append(item);
    });
  }

  #sync(): void {
    const selected = this.#options.find((option) => option.value === this.value);
    if (this.#valueEl) {
      this.#valueEl.textContent =
        selected?.label ?? this.getAttribute('placeholder') ?? 'Pilih…';
      this.#valueEl.classList.toggle('is-placeholder', !selected);
    }
    if (this.#labelEl) {
      const label = this.getAttribute('label') ?? '';
      this.#labelEl.textContent = label;
      this.#labelEl.hidden = label === '';
    }
    if (this.#trigger) {
      this.#trigger.disabled = this.disabled;
      const label = this.getAttribute('label') ?? '';
      const ariaLabel = this.getAttribute('aria-label');
      if (label) {
        this.#trigger.setAttribute('aria-labelledby', `${this.#uid}-label`);
        this.#trigger.removeAttribute('aria-label');
      } else if (ariaLabel) {
        this.#trigger.setAttribute('aria-label', ariaLabel);
        this.#trigger.removeAttribute('aria-labelledby');
      } else {
        this.#trigger.removeAttribute('aria-labelledby');
        this.#trigger.removeAttribute('aria-label');
      }
    }
    this.#renderOptionStates();
    this.#reflectOpen();
  }

  #renderOptionStates(): void {
    const listbox = this.#listbox;
    const trigger = this.#trigger;
    if (!listbox || !trigger) return;
    Array.from(listbox.children).forEach((child, index) => {
      const item = child as HTMLElement;
      const option = this.#options[index];
      const isSelected = option?.value === this.value;
      item.classList.toggle('is-selected', isSelected);
      item.setAttribute('aria-selected', String(isSelected));
      item.classList.toggle('is-active', index === this.#activeIndex);
    });
    if (this.#open && this.#activeIndex >= 0) {
      trigger.setAttribute('aria-activedescendant', `${this.#uid}-opt-${this.#activeIndex}`);
    } else {
      trigger.removeAttribute('aria-activedescendant');
    }
  }

  #reflectOpen(): void {
    this.#trigger?.setAttribute('aria-expanded', String(this.#open));
    this.#trigger?.classList.toggle('is-open', this.#open);
    if (this.#listbox) this.#listbox.hidden = !this.#open;
    if (this.#open) {
      const active = this.#listbox?.querySelector<HTMLElement>('.is-active');
      if (active && typeof active.scrollIntoView === 'function') {
        active.scrollIntoView({ block: 'nearest' });
      }
    }
  }

  #setActive(index: number): void {
    if (this.#options.length === 0) return;
    const count = this.#options.length;
    this.#activeIndex = ((index % count) + count) % count;
    this.#renderOptionStates();
  }

  #moveActive(delta: number): void {
    if (this.#options.length === 0) return;
    if (!this.#open) {
      this.#openList();
      return;
    }
    const base = this.#activeIndex < 0 ? (delta > 0 ? -1 : 0) : this.#activeIndex;
    this.#setActive(base + delta);
  }

  #openList(): void {
    if (this.disabled || this.#open || this.#options.length === 0) return;
    this.#open = true;
    const selectedIndex = this.#options.findIndex((option) => option.value === this.value);
    this.#activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
    this.#reflectOpen();
    this.#renderOptionStates();
  }

  #closeList(focusTrigger = true): void {
    if (!this.#open) return;
    this.#open = false;
    this.#activeIndex = -1;
    this.#reflectOpen();
    this.#renderOptionStates();
    if (focusTrigger && this.disabled === false) this.#trigger?.focus();
  }

  #selectActive(): void {
    const option = this.#options[this.#activeIndex];
    if (option) this.#commit(option);
  }

  #commit(option: SelectOption): void {
    const changed = option.value !== this.value;
    if (changed) this.setAttribute('value', option.value);
    this.#closeList();
    if (changed) this.emit('ui-change', { value: option.value, label: option.label });
  }

  #typeaheadSearch(char: string): void {
    this.#typeahead += char.toLowerCase();
    clearTimeout(this.#typeaheadTimer);
    this.#typeaheadTimer = setTimeout(() => {
      this.#typeahead = '';
    }, 500);
    if (!this.#open) this.#openList();
    const match = this.#options.findIndex((option) =>
      option.label.toLowerCase().startsWith(this.#typeahead),
    );
    if (match >= 0) this.#setActive(match);
  }

  #onRootClick = (event: Event): void => {
    if (this.disabled) return;
    const target = event.target as HTMLElement;
    if (target.closest('.ui-select__trigger')) {
      if (this.#open) this.#closeList();
      else this.#openList();
      return;
    }
    const item = target.closest<HTMLElement>('.ui-select__option');
    if (item) {
      this.#activeIndex = Number(item.dataset.index);
      this.#selectActive();
    }
  };

  #onRootMouseover = (event: Event): void => {
    const item = (event.target as HTMLElement).closest<HTMLElement>('.ui-select__option');
    if (!item) return;
    const index = Number(item.dataset.index);
    if (index !== this.#activeIndex) {
      this.#activeIndex = index;
      this.#renderOptionStates();
    }
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
      if (this.#open) {
        event.preventDefault();
        this.#setActive(0);
      }
    } else if (key === 'End') {
      if (this.#open) {
        event.preventDefault();
        this.#setActive(this.#options.length - 1);
      }
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      if (this.#open) this.#selectActive();
      else this.#openList();
    } else if (key === 'Escape') {
      if (this.#open) {
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
    if (!this.#open) return;
    if (event.composedPath().includes(this)) return;
    this.#closeList(false);
  };
}

define('ui-select', UiSelect);
