import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import { UiCard } from './card';

describe('ui-card', () => {
  it('registers the custom element', () => {
    expect(customElements.get('ui-card')).toBe(UiCard);
  });

  it('defaults to the elevated variant', async () => {
    const el = await fixture<UiCard>(html`<ui-card>Body</ui-card>`);
    expect(el.variant).toBe('elevated');
    expect(el.shadowRoot?.querySelector('.ui-card--elevated')).not.toBeNull();
  });

  it('renders the outlined variant when set', async () => {
    const el = await fixture<UiCard>(
      html`<ui-card variant="outlined">Body</ui-card>`,
    );
    expect(el.variant).toBe('outlined');
    expect(el.shadowRoot?.querySelector('.ui-card--outlined')).not.toBeNull();
  });

  it('exposes header, body and footer parts', async () => {
    const el = await fixture<UiCard>(html`<ui-card>Body</ui-card>`);
    expect(el.shadowRoot?.querySelector('[part="card"]')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('[part="header"]')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('[part="body"]')).not.toBeNull();
    expect(el.shadowRoot?.querySelector('[part="footer"]')).not.toBeNull();
  });
});
