import { describe, it, expect, vi } from 'vitest';
import { fixture, html, elementUpdated } from '@open-wc/testing-helpers';
import { UiSelect, type SelectOption } from './select';

const OPTIONS: SelectOption[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

async function make(): Promise<UiSelect> {
  const el = await fixture<UiSelect>(html`<ui-select></ui-select>`);
  el.options = OPTIONS;
  await elementUpdated(el);
  return el;
}

function trigger(el: UiSelect): HTMLButtonElement {
  return el.shadowRoot!.querySelector('.ui-select__trigger') as HTMLButtonElement;
}

function options(el: UiSelect): HTMLElement[] {
  return Array.from(el.shadowRoot!.querySelectorAll<HTMLElement>('.ui-select__option'));
}

describe('ui-select', () => {
  it('registers the custom element', () => {
    expect(customElements.get('ui-select')).toBe(UiSelect);
  });

  it('renders one option per entry', async () => {
    const el = await make();
    expect(options(el)).toHaveLength(3);
    expect(options(el)[1].textContent).toBe('Beta');
  });

  it('shows the placeholder when there is no value', async () => {
    const el = await make();
    const value = el.shadowRoot!.querySelector('.ui-select__value') as HTMLElement;
    expect(value.classList.contains('is-placeholder')).toBe(true);
    expect(value.textContent).toBe('Pilih…');
  });

  it('opens the listbox on trigger click', async () => {
    const el = await make();
    trigger(el).click();
    await elementUpdated(el);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    expect((el.shadowRoot!.querySelector('.ui-select__listbox') as HTMLElement).hidden).toBe(false);
  });

  it('selects an option, emits ui-change and closes', async () => {
    const el = await make();
    const onChange = vi.fn();
    el.addEventListener('ui-change', onChange);
    trigger(el).click();
    await elementUpdated(el);
    options(el)[1].click();
    await elementUpdated(el);
    expect(el.value).toBe('b');
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0][0] as CustomEvent).detail).toEqual({ value: 'b', label: 'Beta' });
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('supports keyboard navigation and selection', async () => {
    const el = await make();
    const t = trigger(el);
    t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    await elementUpdated(el);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('true');
    expect(trigger(el).getAttribute('aria-activedescendant')).toBe(`${options(el)[0].id}`);
    t.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    t.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    await elementUpdated(el);
    expect(el.value).toBe('b');
  });

  it('closes on Escape', async () => {
    const el = await make();
    trigger(el).click();
    await elementUpdated(el);
    trigger(el).dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await elementUpdated(el);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('does not open when disabled', async () => {
    const el = await fixture<UiSelect>(html`<ui-select disabled></ui-select>`);
    el.options = OPTIONS;
    await elementUpdated(el);
    trigger(el).click();
    await elementUpdated(el);
    expect(trigger(el).getAttribute('aria-expanded')).toBe('false');
  });

  it('reads options from the options attribute (JSON)', async () => {
    const el = await fixture<UiSelect>(
      html`<ui-select options='[{"value":"x","label":"Xray"}]'></ui-select>`,
    );
    await elementUpdated(el);
    expect(options(el)).toHaveLength(1);
    expect(options(el)[0].textContent).toBe('Xray');
  });

  it('shows the label attribute when set', async () => {
    const el = await fixture<UiSelect>(html`<ui-select label="Framework"></ui-select>`);
    el.options = OPTIONS;
    await elementUpdated(el);
    const label = el.shadowRoot!.querySelector('.ui-select__label') as HTMLElement;
    expect(label.hidden).toBe(false);
    expect(label.textContent).toBe('Framework');
  });
});
