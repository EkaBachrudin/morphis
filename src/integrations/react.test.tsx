import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { Button, Input, Card, Select, OtherOffer } from '@eka-morphis/react';
import type { UiOtherOffer } from '@eka-morphis/other-offer';
import type { UiSelect } from '@eka-morphis/select';

const OFFER_CARDS = [
  { offer: 'a', label: 'A', badge: 'A', badgeIcon: 'plane' as const, title: 'A' },
  { offer: 'b', label: 'B', badge: 'B', badgeIcon: 'media' as const, title: 'B' },
  { offer: 'c', label: 'C', badge: 'C', badgeIcon: 'telp' as const, title: 'C' },
  { offer: 'd', label: 'D', badge: 'D', badgeIcon: 'plane' as const, title: 'D' },
];

/** Menunggu siklus update Lit (render async) sebelum assertion DOM. */
async function settle(el: Element): Promise<void> {
  const updatable = el as unknown as { updateComplete?: Promise<unknown> };
  if (updatable.updateComplete) await updatable.updateComplete;
}

describe('React wrapper', () => {
  it('renders ui-button and applies props as attributes', async () => {
    const { container } = render(<Button variant="secondary">Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    await settle(el);
    expect(el.getAttribute('variant')).toBe('secondary');
    expect(el.shadowRoot?.querySelector('.ui-button--secondary')).not.toBeNull();
  });

  it('binds the custom ui-click event', async () => {
    const onClick = vi.fn();
    const { container } = render(<Button onUiClick={onClick}>Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    await settle(el);
    el.shadowRoot?.querySelector('button')?.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('removes attributes when boolean props become false', async () => {
    const { container, rerender } = render(<Button disabled>Hi</Button>);
    const el = container.querySelector('ui-button') as HTMLElement;
    await settle(el);
    expect(el.hasAttribute('disabled')).toBe(true);
    rerender(<Button disabled={false}>Hi</Button>);
    await settle(el);
    expect(el.hasAttribute('disabled')).toBe(false);
  });

  it('sets the value property on ui-input', async () => {
    const { container } = render(<Input value="halo" label="Nama" />);
    const el = container.querySelector('ui-input') as HTMLElement;
    await settle(el);
    expect(el.shadowRoot?.querySelector('input')?.value).toBe('halo');
    expect(el.shadowRoot?.querySelector('.ui-field__label')?.textContent?.trim()).toBe('Nama');
  });

  it('renders ui-card with slotted content', async () => {
    const { container } = render(
      <Card variant="outlined">
        <span slot="header">Judul</span>
        Isi
      </Card>,
    );
    const el = container.querySelector('ui-card') as HTMLElement;
    await settle(el);
    expect(el.getAttribute('variant')).toBe('outlined');
    expect(el.querySelector('[slot="header"]')?.textContent).toBe('Judul');
  });

  it('renders ui-select with the options property', async () => {
    const { container } = render(
      <Select
        label="Pilih"
        options={[
          { value: '1', label: 'Satu' },
          { value: '2', label: 'Dua' },
        ]}
      />,
    );
    const el = container.querySelector('ui-select') as UiSelect;
    await settle(el);
    expect(Array.isArray(el.options)).toBe(true);
    expect(el.options).toHaveLength(2);
    expect(el.shadowRoot?.querySelector('[part="label"]')?.textContent?.trim()).toBe('Pilih');
  });

  it('renders ui-other-offer and binds cards + footer label', async () => {
    const { container } = render(
      <OtherOffer title="T" subtitle="S" footerLabel="Lainnya" cards={OFFER_CARDS} />,
    );
    const el = container.querySelector('ui-other-offer') as UiOtherOffer;
    await settle(el);
    expect(el.cards).toHaveLength(4);
    expect(el.footerLabel).toBe('Lainnya');
    expect(el.shadowRoot?.querySelector('[part="title"]')?.textContent).toBe('T');
    expect(el.shadowRoot?.querySelectorAll('[part="card"]')).toHaveLength(4);
  });

  it('binds the custom ui-offer-click event on OtherOffer', async () => {
    const onOffer = vi.fn();
    const { container } = render(<OtherOffer cards={OFFER_CARDS} onUiOfferClick={onOffer} />);
    const el = container.querySelector('ui-other-offer') as UiOtherOffer;
    await settle(el);
    el.shadowRoot?.querySelector<HTMLAnchorElement>('[part="cta"]')?.click();
    expect(onOffer).toHaveBeenCalledTimes(1);
  });
});
