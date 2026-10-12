import { describe, it, expect } from 'vitest';
import { fixture, html } from '@open-wc/testing-helpers';
import { UiOtherOffer, type OtherOfferCard } from './other-offer';

const CARDS: OtherOfferCard[] = [
  { offer: 'roaming', label: 'Roaming', badge: 'Streaming', badgeIcon: 'plane', title: 'Streaming' },
  { offer: 'digital-lifestyle', label: 'Digital Lifestyle', badge: 'Internet', badgeIcon: 'media', title: 'Internet' },
  { offer: 'telp-sms', label: 'Telp & SMS', badge: 'Telp & SMS', badgeIcon: 'telp', title: 'TV Premium' },
  { offer: 'device', label: 'Device', badge: 'Device', badgeIcon: 'media', title: 'Device' },
];

async function renderWith(cards: OtherOfferCard[]): Promise<UiOtherOffer> {
  const el = await fixture<UiOtherOffer>(html`<ui-other-offer></ui-other-offer>`);
  el.cards = cards;
  await el.updateComplete;
  return el;
}

describe('ui-other-offer', () => {
  it('registers the custom element', () => {
    expect(customElements.get('ui-other-offer')).toBe(UiOtherOffer);
  });

  it('renders title and subtitle', async () => {
    const el = await fixture<UiOtherOffer>(
      html`<ui-other-offer title="Judul" subtitle="Sub"></ui-other-offer>`,
    );
    expect(el.shadowRoot?.querySelector('[part="title"]')?.textContent).toBe('Judul');
    expect(el.shadowRoot?.querySelector('[part="subtitle"]')?.textContent).toBe('Sub');
  });

  it('parses cards from the JSON attribute', async () => {
    const el = await fixture<UiOtherOffer>(
      html`<ui-other-offer cards=${JSON.stringify(CARDS)}></ui-other-offer>`,
    );
    expect(el.cards).toHaveLength(4);
    expect(el.shadowRoot?.querySelectorAll('[part="card"]')).toHaveLength(4);
  });

  it('reads footer label from the kebab-case attribute', async () => {
    const el = await fixture<UiOtherOffer>(
      html`<ui-other-offer footer-label="Lainnya"></ui-other-offer>`,
    );
    expect(el.footerLabel).toBe('Lainnya');
    expect(el.shadowRoot?.querySelector('[part="button"]')?.textContent?.trim()).toBe('Lainnya');
  });

  it('hides the footer when fewer than four cards', async () => {
    const el = await renderWith(CARDS.slice(0, 3));
    const footer = el.shadowRoot?.querySelector<HTMLElement>('[part="footer"]');
    expect(footer?.hasAttribute('hidden')).toBe(true);
    expect(el.shadowRoot?.querySelector('.ui-other-offer__grid-less')).not.toBeNull();
  });

  it('shows the footer with four or more cards', async () => {
    const el = await renderWith(CARDS);
    const footer = el.shadowRoot?.querySelector<HTMLElement>('[part="footer"]');
    expect(footer?.hasAttribute('hidden')).toBe(false);
    expect(el.shadowRoot?.querySelector('.ui-other-offer__grid')).not.toBeNull();
  });

  it('emits ui-offer-click with offer and label', async () => {
    const el = await renderWith(CARDS);
    let detail: { offer: string; label: string } | undefined;
    el.addEventListener('ui-offer-click', (event) => {
      detail = (event as CustomEvent<{ offer: string; label: string }>).detail;
    });
    el.shadowRoot?.querySelector<HTMLAnchorElement>('[part="cta"]')?.click();
    expect(detail).toEqual({ offer: 'roaming', label: 'Roaming' });
  });

  it('emits ui-view-all from the footer button', async () => {
    const el = await renderWith(CARDS);
    let detail: { label: string } | undefined;
    el.addEventListener('ui-view-all', (event) => {
      detail = (event as CustomEvent<{ label: string }>).detail;
    });
    el.shadowRoot?.querySelector<HTMLAnchorElement>('[part="button"]')?.click();
    expect(detail).toEqual({ label: 'Lihat Selengkapnya' });
  });
});
