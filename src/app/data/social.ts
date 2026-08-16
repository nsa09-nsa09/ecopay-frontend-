// Mock data for the "Follow us" social section on the News page.
//
// Shape is close to what a future `GET /api/v1/social` (or a social-embed
// aggregator) would return: each platform carries a handle, profile URL,
// follower count and a few recent post previews. Post thumbnails are mocked
// with gradients + emoji here (no external embeds — the site CSP blocks
// third-party frames), so swapping to a live feed means replacing the
// `thumbnail`/`gradient` fields with real cover image URLs.
//
// NOTE: the handles/URLs below are placeholders — replace them with the real
// configured accounts before shipping.

import { appBrand } from '../config/brand';
import type { LocalizedText } from './stories';

export type SocialPlatform = 'instagram' | 'tiktok';

export interface SocialPost {
  id: string;
  /** Optional real cover image. When absent, `gradient` + `emoji` are shown. */
  thumbnail?: string;
  gradient: string;
  emoji: string;
  caption: LocalizedText;
  /** Formatted engagement metric, e.g. "12.4K" views/likes. */
  metric: string;
}

export interface SocialAccount {
  platform: SocialPlatform;
  /** Display name shown on the card. */
  name: string;
  handle: string;
  url: string;
  /** Pre-formatted follower count, e.g. "8.2K". */
  followers: string;
  tagline: LocalizedText;
  posts: SocialPost[];
}

function socialHandle(url: string, platform: SocialPlatform): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    const handle = parsed.pathname.replace(/^\/@?/, '').replace(/\/$/, '');
    return handle ? `@${handle}` : platform;
  } catch {
    return platform;
  }
}

const configuredSocialAccounts: SocialAccount[] = [
  {
    platform: 'instagram',
    name: appBrand.name,
    handle: socialHandle(appBrand.instagramUrl, 'instagram'),
    url: appBrand.instagramUrl,
    followers: '8.2K',
    tagline: {
      ru: 'Гайды, акции и лайфхаки по подпискам',
      kz: 'Жазылымдар туралы гайдтар, акциялар және лайфхактар',
      en: 'Guides, deals and subscription tips',
    },
    posts: [
      {
        id: 'ig-1',
        gradient: 'linear-gradient(150deg, #FF8C42 0%, #F0741F 100%)',
        emoji: 'рџЋ¬',
        caption: { ru: 'Netflix за 1250 ₸', kz: 'Netflix 1250 ₸', en: 'Netflix for 1250 ₸' },
        metric: '3.1K',
      },
      {
        id: 'ig-2',
        gradient: 'linear-gradient(150deg, #FFAE75 0%, #C55A12 100%)',
        emoji: 'рџЋ§',
        caption: { ru: 'Как делить Spotify', kz: 'Spotify қалай бөлісу', en: 'Splitting Spotify' },
        metric: '2.4K',
      },
      {
        id: 'ig-3',
        gradient: 'linear-gradient(150deg, #FFD27A 0%, #FF9A55 100%)',
        emoji: 'рџ›ЎпёЏ',
        caption: {
          ru: 'Почему это безопасно',
          kz: 'Неге бұл қауіпсіз',
          en: 'Why it is safe',
        },
        metric: '5.7K',
      },
      {
        id: 'ig-4',
        gradient: 'linear-gradient(150deg, #FF9A55 0%, #96430E 100%)',
        emoji: '⭐',
        caption: { ru: 'Отзывы участников', kz: 'Қатысушы пікірлері', en: 'Member reviews' },
        metric: '1.9K',
      },
    ],
  },
  {
    platform: 'tiktok',
    name: appBrand.name,
    handle: socialHandle(appBrand.tiktokUrl, 'tiktok'),
    url: appBrand.tiktokUrl,
    followers: '14.6K',
    tagline: {
      ru: 'Короткие видео: как экономить на подписках',
      kz: 'Қысқа видеолар: жазылымдарда қалай үнемдеу',
      en: 'Short videos on saving with subscriptions',
    },
    posts: [
      {
        id: 'tt-1',
        gradient: 'linear-gradient(165deg, #25253B 0%, #131326 100%)',
        emoji: 'рџ”Ґ',
        caption: {
          ru: '5 подписок дешевле в 4 раза',
          kz: '5 жазылым 4 есе арзан',
          en: '5 subs, 4Г— cheaper',
        },
        metric: '128K',
      },
      {
        id: 'tt-2',
        gradient: 'linear-gradient(165deg, #3A3A52 0%, #25253B 100%)',
        emoji: 'рџ’ё',
        caption: {
          ru: 'Сколько я сэкономил за год',
          kz: 'Бір жылда қанша үнемдедім',
          en: 'My savings in a year',
        },
        metric: '92K',
      },
      {
        id: 'tt-3',
        gradient: 'linear-gradient(165deg, #96430E 0%, #131326 120%)',
        emoji: '⚡',
        caption: {
          ru: 'Комната за 30 секунд',
          kz: '30 секундта бөлме',
          en: 'A room in 30 seconds',
        },
        metric: '61K',
      },
    ],
  },
];

export const socialAccounts: SocialAccount[] = configuredSocialAccounts.filter(
  (account) => account.url,
);

