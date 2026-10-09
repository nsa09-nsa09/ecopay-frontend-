// Data for the "Follow us" social section on the News page.
//
// Shape is close to what a future `GET /api/v1/social` would return: each
// platform carries a display name, handle and profile URL. We intentionally do
// NOT ship follower counts, engagement metrics or mocked post previews — those
// were fabricated placeholders. The card links out to the real profile instead.
//
// NOTE: the handles/URLs come from brand config; the section hides itself when
// a URL is not configured.

import { appBrand } from '../config/brand';
import type { LocalizedText } from './stories';

export type SocialPlatform = 'instagram' | 'tiktok';

export interface SocialAccount {
  platform: SocialPlatform;
  /** Display name shown on the card. */
  name: string;
  handle: string;
  url: string;
  tagline: LocalizedText;
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
    tagline: {
      ru: 'Гайды, акции и лайфхаки по подпискам',
      kz: 'Жазылымдар туралы гайдтар, акциялар және лайфхактар',
      en: 'Guides, deals and subscription tips',
    },
  },
  {
    platform: 'tiktok',
    name: appBrand.name,
    handle: socialHandle(appBrand.tiktokUrl, 'tiktok'),
    url: appBrand.tiktokUrl,
    tagline: {
      ru: 'Короткие видео: как экономить на подписках',
      kz: 'Қысқа видеолар: жазылымдарда қалай үнемдеу',
      en: 'Short videos on saving with subscriptions',
    },
  },
];

export const socialAccounts: SocialAccount[] = configuredSocialAccounts.filter(
  (account) => account.url,
);
