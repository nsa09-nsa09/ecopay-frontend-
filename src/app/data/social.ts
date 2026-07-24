// Mock data for the "Follow us" social section on the News page.
//
// Shape is close to what a future `GET /api/v1/social` (or a social-embed
// aggregator) would return: each platform carries a handle, profile URL,
// follower count and a few recent post previews. Post thumbnails are mocked
// with gradients + emoji here (no external embeds вЂ” the site CSP blocks
// third-party frames), so swapping to a live feed means replacing the
// `thumbnail`/`gradient` fields with real cover image URLs.
//
// NOTE: the handles/URLs below are placeholders вЂ” replace them with the real
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
      ru: 'Р“Р°Р№РґС‹, Р°РєС†РёРё Рё Р»Р°Р№С„С…Р°РєРё РїРѕ РїРѕРґРїРёСЃРєР°Рј',
      kz: 'Р–Р°Р·С‹Р»С‹РјРґР°СЂ С‚СѓСЂР°Р»С‹ РіР°Р№РґС‚Р°СЂ, Р°РєС†РёСЏР»Р°СЂ Р¶У™РЅРµ Р»Р°Р№С„С…Р°РєС‚Р°СЂ',
      en: 'Guides, deals and subscription tips',
    },
    posts: [
      {
        id: 'ig-1',
        gradient: 'linear-gradient(150deg, #FF8C42 0%, #F0741F 100%)',
        emoji: 'рџЋ¬',
        caption: { ru: 'Netflix Р·Р° 1250 в‚ё', kz: 'Netflix 1250 в‚ё', en: 'Netflix for 1250 в‚ё' },
        metric: '3.1K',
      },
      {
        id: 'ig-2',
        gradient: 'linear-gradient(150deg, #FFAE75 0%, #C55A12 100%)',
        emoji: 'рџЋ§',
        caption: { ru: 'РљР°Рє РґРµР»РёС‚СЊ Spotify', kz: 'Spotify Т›Р°Р»Р°Р№ Р±У©Р»С–СЃСѓ', en: 'Splitting Spotify' },
        metric: '2.4K',
      },
      {
        id: 'ig-3',
        gradient: 'linear-gradient(150deg, #FFD27A 0%, #FF9A55 100%)',
        emoji: 'рџ›ЎпёЏ',
        caption: {
          ru: 'РџРѕС‡РµРјСѓ СЌС‚Рѕ Р±РµР·РѕРїР°СЃРЅРѕ',
          kz: 'РќРµРіРµ Р±Т±Р» Т›Р°СѓС–РїСЃС–Р·',
          en: 'Why it is safe',
        },
        metric: '5.7K',
      },
      {
        id: 'ig-4',
        gradient: 'linear-gradient(150deg, #FF9A55 0%, #96430E 100%)',
        emoji: 'в­ђ',
        caption: { ru: 'РћС‚Р·С‹РІС‹ СѓС‡Р°СЃС‚РЅРёРєРѕРІ', kz: 'ТљР°С‚С‹СЃСѓС€С‹ РїС–РєС–СЂР»РµСЂС–', en: 'Member reviews' },
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
      ru: 'РљРѕСЂРѕС‚РєРёРµ РІРёРґРµРѕ: РєР°Рє СЌРєРѕРЅРѕРјРёС‚СЊ РЅР° РїРѕРґРїРёСЃРєР°С…',
      kz: 'ТљС‹СЃТ›Р° РІРёРґРµРѕР»Р°СЂ: Р¶Р°Р·С‹Р»С‹РјРґР°СЂРґР° Т›Р°Р»Р°Р№ ТЇРЅРµРјРґРµСѓ',
      en: 'Short videos on saving with subscriptions',
    },
    posts: [
      {
        id: 'tt-1',
        gradient: 'linear-gradient(165deg, #25253B 0%, #131326 100%)',
        emoji: 'рџ”Ґ',
        caption: {
          ru: '5 РїРѕРґРїРёСЃРѕРє РґРµС€РµРІР»Рµ РІ 4 СЂР°Р·Р°',
          kz: '5 Р¶Р°Р·С‹Р»С‹Рј 4 РµСЃРµ Р°СЂР·Р°РЅ',
          en: '5 subs, 4Г— cheaper',
        },
        metric: '128K',
      },
      {
        id: 'tt-2',
        gradient: 'linear-gradient(165deg, #3A3A52 0%, #25253B 100%)',
        emoji: 'рџ’ё',
        caption: {
          ru: 'РЎРєРѕР»СЊРєРѕ СЏ СЃСЌРєРѕРЅРѕРјРёР» Р·Р° РіРѕРґ',
          kz: 'Р‘С–СЂ Р¶С‹Р»РґР° Т›Р°РЅС€Р° ТЇРЅРµРјРґРµРґС–Рј',
          en: 'My savings in a year',
        },
        metric: '92K',
      },
      {
        id: 'tt-3',
        gradient: 'linear-gradient(165deg, #96430E 0%, #131326 120%)',
        emoji: 'вљЎ',
        caption: {
          ru: 'РљРѕРјРЅР°С‚Р° Р·Р° 30 СЃРµРєСѓРЅРґ',
          kz: '30 СЃРµРєСѓРЅРґС‚Р° Р±У©Р»РјРµ',
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

