import { describe, it, expect } from 'vitest';
import { fixture, html, elementUpdated } from '@open-wc/testing';
import { UiButton } from './button';

describe('ui-button', () => {
  it('registers the custom element', () => {
    expect(customElements.get('ui-button')).toBe(UiButton);
  });

  it('renders an internal button with the variant class', async () => {
    const el = await fixture<UiButton>(
      html`<ui-button variant="secondary">Hi</ui-button>`,
    );
    const button = el.shadowRoot?.querySelector('.ui-button');
    expect(button?.classList.contains('ui-button--secondary')).toBe(true);
    expect(el.variant).toBe('secondary');
  });

  it('defaults to the primary variant', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Hi</ui-button>`);
    expect(el.variant).toBe('primary');
    expect(
      el.shadowRoot?.querySelector('.ui-button--primary'),
    ).not.toBeNull();
  });

  it('emits ui-click with the variant detail on click', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Hi</ui-button>`);
    let detail: unknown;
    el.addEventListener('ui-click', (event) => {
      detail = (event as CustomEvent).detail;
    });
    el.shadowRoot?.querySelector('button')?.click();
    await elementUpdated(el);
    expect(detail).toEqual({ variant: 'primary' });
  });

  it('does not emit ui-click when disabled', async () => {
    const el = await fixture<UiButton>(html`<ui-button disabled>Hi</ui-button>`);
    let fired = false;
    el.addEventListener('ui-click', () => {
      fired = true;
    });
    el.shadowRoot?.querySelector('button')?.click();
    await elementUpdated(el);
    expect(fired).toBe(false);
  });

  it('reflects the disabled attribute to the internal button', async () => {
    const el = await fixture<UiButton>(html`<ui-button>Hi</ui-button>`);
    el.disabled = true;
    await elementUpdated(el);
    expect(
      el.shadowRoot?.querySelector('button')?.hasAttribute('disabled'),
    ).toBe(true);
  });
});
