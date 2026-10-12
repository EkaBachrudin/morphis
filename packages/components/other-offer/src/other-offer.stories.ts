import type { Meta, StoryObj } from '@storybook/web-components-vite';
import { UiOtherOffer, type OtherOfferCard } from './other-offer';
import { renderSnippet } from '@morphis/component-meta/snippet-story';

const CARDS: OtherOfferCard[] = [
  {
    offer: 'roaming',
    label: 'Roaming',
    badge: 'Streaming',
    badgeIcon: 'plane',
    title: 'Tambah Langganan App Nonton Pilihan',
    art: 'https://assets.telkomsel.com/public/2026-05/Addon%20-%20Mobile%201_0.png?VersionId=UAFRKzOB28I7kX4YzG0Ix700wqMhktHh',
    artDesktop: 'https://assets.telkomsel.com/public/2026-05/Addon%20-%20Desktop%201_0.png?VersionId=PfZD3Qs08BvpyL.rVfuLCYGpT_kC7Y5O',
  },
  {
    offer: 'digital-lifestyle',
    label: 'Digital Lifestyle',
    badge: 'Internet',
    badgeIcon: 'media',
    title: 'Tingkatkan Performa Internet Anda',
    art: 'https://assets.telkomsel.com/public/2026-05/tv_m.webp?VersionId=ZgCNTJyTxrTGaFYpv4O3S_92T.st6F7q',
    artDesktop: 'https://assets.telkomsel.com/public/2026-05/internet_d.webp?VersionId=UcTk.GcPjDs_cN8l2gUpQHG.irVQ16Sy'
  },
  {
    offer: 'telp-sms',
    label: 'Telp & SMS',
    badge: 'Telp & SMS',
    badgeIcon: 'telp',
    title: 'Tambah Akses ke Channel TV Premium',
    art: 'https://assets.telkomsel.com/public/2026-05/internet_m.webp?VersionId=fcjLA6FzO0Ei6ad.UQxAUUFgN3sn1uZP',
    artDesktop: 'https://assets.telkomsel.com/public/2026-05/tv_d.webp?VersionId=lsla3B_GzZCJWVdHbsembZhkclDWxg3.'
  },
  {
    offer: 'device',
    label: 'Device',
    badge: 'Device',
    badgeIcon: 'media',
    title: 'Tambah Perangkat Pintar di Rumah, Lebih Praktis',
    art: 'https://assets.telkomsel.com/public/2026-05/Addon%20-%20Mobile%204.png?VersionId=cLlz3hBhuLWWW69FTQvScADUQxCKaSGa',
    artDesktop: 'https://assets.telkomsel.com/public/2026-05/Addon%20-%20Desktop%204.png?VersionId=JKZDvx4hbrprH.pfYHuEDma9zUNfyVhm'
  },
];

const meta: Meta = {
  title: 'Components/OtherOffer',
  component: 'ui-other-offer',
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    footerLabel: { control: 'text' },
  },
  args: {
    title: 'Penawaran Paket Lainnya',
    subtitle: 'Berbagai pilihan untuk kebutuhanmu',
    footerLabel: 'Lihat Selengkapnya',
  },
  render: ({ title, subtitle, footerLabel, cards }) => {
    const el = document.createElement('ui-other-offer') as UiOtherOffer;
    if (title) el.setAttribute('title', title);
    if (subtitle) el.setAttribute('subtitle', subtitle);
    if (footerLabel) el.setAttribute('footer-label', footerLabel);
    el.cards = (cards as OtherOfferCard[] | undefined) ?? CARDS;
    return el;
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {};

export const FewCards: Story = { args: { cards: CARDS.slice(0, 3) } };

export const Snippet: Story = {
  render: (_args, context) => renderSnippet('ui-other-offer', context.globals),
};
