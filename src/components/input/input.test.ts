import { describe, it, expect } from 'vitest';
import { fixture, html, elementUpdated } from '@open-wc/testing';
import { UiInput } from './input';

describe('ui-input', () => {
  it('registers the custom element', () => {
    expect(customElements.get('ui-input')).toBe(UiInput);
  });

  it('renders an internal input with type and placeholder', async () => {
    const el = await fixture<UiInput>(
      html`<ui-input type="email" placeholder="a@b.c"></ui-input>`,
    );
    const input = el.shadowRoot?.querySelector('input');
    expect(input?.getAttribute('type')).toBe('email');
    expect(input?.getAttribute('placeholder')).toBe('a@b.c');
  });

  it('reflects the value getter/setter to the internal input', async () => {
    const el = await fixture<UiInput>(html`<ui-input></ui-input>`);
    el.value = 'halo';
    await elementUpdated(el);
    expect(el.shadowRoot?.querySelector('input')?.value).toBe('halo');
    expect(el.value).toBe('halo');
  });

  it('emits ui-input while typing', async () => {
    const el = await fixture<UiInput>(html`<ui-input></ui-input>`);
    const input = el.shadowRoot?.querySelector('input') as HTMLInputElement;
    let detail: unknown;
    el.addEventListener('ui-input', (event) => {
      detail = (event as CustomEvent).detail;
    });
    input.value = 'abc';
    input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    expect(detail).toEqual({ value: 'abc' });
  });

  it('hides the label when none is provided', async () => {
    const el = await fixture<UiInput>(html`<ui-input></ui-input>`);
    expect(
      el.shadowRoot?.querySelector('.ui-field__label')?.hasAttribute('hidden'),
    ).toBe(true);
  });

  it('shows the label when the label attribute is set', async () => {
    const el = await fixture<UiInput>(html`<ui-input label="Email"></ui-input>`);
    expect(
      el.shadowRoot?.querySelector('.ui-field__label')?.hasAttribute('hidden'),
    ).toBe(false);
  });
});
