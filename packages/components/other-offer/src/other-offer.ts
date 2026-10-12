import {
  MorphisElement,
  define,
  property,
  litStyles,
  type TemplateResult,
} from '@morphis/core';
import style from './other-offer.css?inline';
import otherOfferTemplate from './other-offer.template.html?html';

/** Ikon bawaan untuk badge kartu. */
export type OtherOfferBadgeIcon = 'plane' | 'media' | 'telp';

/** Satu kartu penawaran. */
export interface OtherOfferCard {
  /** Identitas kartu (`data-offer-id`). Default: `offer`. */
  id?: string;
  /** Nilai yang dipancarkan saat kartu diklik. */
  offer: string;
  /** Label kartu, dipakai untuk aria-label dan `detail.label`. */
  label: string;
  /** Teks badge. */
  badge: string;
  /** Ikon badge. Default: `plane`. */
  badgeIcon?: OtherOfferBadgeIcon;
  /** Judul kartu. */
  title: string;
  /** Teks CTA. Default: `Lihat Add-On`. */
  cta?: string;
  /** URL gambar art (mobile + fallback desktop). */
  art?: string;
  /** URL gambar art khusus desktop (min-width: 768px). */
  artDesktop?: string;
}

/** Data yang dioper ke template `other-offer.template.html`. */
interface OtherOfferTemplateContext {
  title: string;
  subtitle: string;
  footerLabel: string;
  cards: OtherOfferCard[];
  isLess: boolean;
  showFooter: boolean;
  iconPath: (icon: string) => string;
  chevronPath: string;
  onRootClick: (event: Event) => void;
}

const renderOtherOffer = otherOfferTemplate as (ctx: OtherOfferTemplateContext) => TemplateResult;

const BADGE_ICONS: Record<string, string> = {
  plane: 'M2.5 19l19-7-19-7v5.5l13 1.5-13 1.5z',
  media: 'M8 5v14l11-7z',
  telp: 'M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1C10.61 21 3 13.39 3 4c0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.24.2 2.45.57 3.57.11.35.03.74-.25 1.02z',
};

const CHEVRON_PATH =
  'M9.29 6.71a1 1 0 0 0 0 1.41L13.17 12l-3.88 3.88a1 1 0 1 0 1.42 1.41l4.58-4.58a1 1 0 0 0 0-1.42L10.71 6.7a1 1 0 0 0-1.42 0z';

function parseCards(value: string | null): OtherOfferCard[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as OtherOfferCard[]) : [];
  } catch {
    return [];
  }
}

/**
 * Section daftar penawaran lain.
 *
 * Kartu diberikan lewat property `cards` (array {@link OtherOfferCard}) atau
 * atribut `cards` berisi JSON. Bila jumlah kartu kurang dari empat, grid
 * beralih ke mode ringkas dan tombol footer disembunyikan.
 *
 * @element ui-other-offer
 *
 * @slot - Tidak ada; seluruh konten berasal dari property.
 *
 * @csspart root - Elemen `<section>` pembungkus.
 * @csspart title - Judul section.
 * @csspart subtitle - Subjudul section.
 * @csspart grid - Grid kartu.
 * @csspart card - Tiap kartu penawaran.
 * @csspart badge - Badge pada kartu.
 * @csspart card-title - Judul pada kartu.
 * @csspart cta - Tautan CTA pada kartu.
 * @csspart footer - Wrapper tombol footer.
 * @csspart button - Tombol "Lihat Selengkapnya".
 *
 * @fires ui-offer-click - Saat kartu diklik. `detail: { offer, label }`.
 * @fires ui-view-all - Saat tombol footer diklik. `detail: { label }`.
 *
 * @cssprop [--ui-color-border=#e5e7eb] - Warna border tombol.
 */
export class UiOtherOffer extends MorphisElement {
  static override styles = litStyles(style);

  /** Judul section. */
  @property() title = 'Penawaran Paket Lainnya';

  /** Subjudul section. */
  @property() subtitle = 'Berbagai pilihan untuk kebutuhanmu';

  /** Daftar kartu penawaran. Bisa di-set sebagai JSON pada atribut. */
  @property({ converter: { fromAttribute: parseCards } })
  cards: OtherOfferCard[] = [];

  /** Teks tombol footer. */
  @property() footerLabel = 'Lihat Selengkapnya';

  override render(): TemplateResult {
    const cards = this.#cards();
    const isLess = cards.length < 4;

    return renderOtherOffer({
      title: this.title,
      subtitle: this.subtitle,
      footerLabel: this.footerLabel,
      cards,
      isLess,
      showFooter: !isLess,
      iconPath: (icon: string) => BADGE_ICONS[icon] ?? BADGE_ICONS.plane,
      chevronPath: CHEVRON_PATH,
      onRootClick: this.#onRootClick,
    });
  }

  #cards(): OtherOfferCard[] {
    if (!Array.isArray(this.cards)) return [];
    return this.cards
      .filter((card) => card && typeof card.offer === 'string')
      .map((card) => ({
        ...card,
        id: card.id ?? card.offer,
        label: card.label ?? '',
        badge: card.badge ?? '',
        badgeIcon: card.badgeIcon ?? 'plane',
        title: card.title ?? '',
        cta: card.cta ?? 'Lihat Add-On',
      }));
  }

  #onRootClick = (event: Event): void => {
    const target = event.target as HTMLElement | null;
    const trigger = target?.closest<HTMLElement>('[data-action]');
    if (!trigger) return;

    const action = trigger.dataset.action;
    if (action === 'view-offer') {
      this.emit('ui-offer-click', {
        offer: trigger.dataset.offer ?? '',
        label: trigger.dataset.label ?? '',
      });
    } else if (action === 'view-all-offers') {
      this.emit('ui-view-all', {
        label: trigger.dataset.label ?? this.footerLabel,
      });
    }
  };
}

define('ui-other-offer', UiOtherOffer);
