import { useI18n } from '../i18n-provider';
import { socialAccounts, type SocialAccount } from '../../data/social';
import type { LocalizedText } from '../../data/stories';

type Lang = 'ru' | 'kz' | 'en';

const pick = (value: LocalizedText, lang: Lang): string => value[lang] ?? value.ru;

// Platform-authentic gradients so the cards read instantly as IG / TikTok.
const PLATFORM_GRADIENT: Record<SocialAccount['platform'], string> = {
  instagram: 'linear-gradient(45deg, #F58529 0%, #DD2A7B 45%, #8134AF 75%, #515BD4 100%)',
  tiktok: 'linear-gradient(135deg, #25F4EE 0%, #010101 45%, #FE2C55 100%)',
};

// ─── Inline brand marks (crisp at any size, no external assets) ───
function InstagramMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" stroke="#fff" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.5" stroke="#fff" strokeWidth="2" />
      <circle cx="17.5" cy="6.5" r="1.4" fill="#fff" />
    </svg>
  );
}

function TikTokMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
      <path d="M16.5 3c.3 1.9 1.4 3.4 3.3 3.9v2.6c-1.2.1-2.3-.2-3.3-.8v5.9c0 3-2.3 5.4-5.3 5.4S6 17.6 6 14.7c0-2.7 2-4.9 4.6-5.2v2.7c-1.1.2-1.9 1.2-1.9 2.4 0 1.4 1 2.5 2.4 2.5s2.4-1.1 2.4-2.6V3h3z" />
    </svg>
  );
}

function PlatformMark({ platform, size }: { platform: SocialAccount['platform']; size?: number }) {
  return platform === 'instagram' ? <InstagramMark size={size} /> : <TikTokMark size={size} />;
}

// ─── Single account card ───
function SocialCard({ account, lang }: { account: SocialAccount; lang: Lang }) {
  const { t } = useI18n();

  return (
    <div
      className="rounded-2xl p-5 sm:p-6 flex flex-col gap-5"
      style={{
        background: 'var(--eco-surface-raised)',
        border: '1px solid var(--eco-border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <span
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: PLATFORM_GRADIENT[account.platform] }}
        >
          <PlatformMark platform={account.platform} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className="text-[15px] truncate"
            style={{ color: 'var(--eco-text)', fontWeight: 600 }}
          >
            {account.name}
          </div>
          <div className="text-[13px] truncate" style={{ color: 'var(--eco-text-secondary)' }}>
            {account.handle}
          </div>
        </div>
      </div>

      <p className="text-[13px] m-0" style={{ color: 'var(--eco-text-secondary)' }}>
        {pick(account.tagline, lang)}
      </p>

      {/* CTA */}
      <a
        href={account.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center justify-center gap-2 rounded-full py-2.5 text-[14px] cursor-pointer"
        style={{ background: PLATFORM_GRADIENT[account.platform], color: '#fff', fontWeight: 600 }}
      >
        <PlatformMark platform={account.platform} size={16} />
        {t('socialSubscribe')}
      </a>
    </div>
  );
}

// ─── Section ───
export function SocialCards({ className = '' }: { className?: string }) {
  const { t, language } = useI18n();
  const lang = language as Lang;

  if (socialAccounts.length === 0) return null;

  return (
    <section className={className} aria-label={t('socialSectionTitle')}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="mb-6">
          <h2
            className="text-[22px] sm:text-[24px] m-0"
            style={{ color: 'var(--eco-text)', fontWeight: 700 }}
          >
            {t('socialSectionTitle')}
          </h2>
          <p className="text-[13px] mt-1 m-0" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('socialSectionSubtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-start">
          {socialAccounts.map((account) => (
            <SocialCard key={account.platform} account={account} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
