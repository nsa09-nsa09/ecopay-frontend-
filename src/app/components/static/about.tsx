import { useEffect, useState } from 'react';
import { Card, WaveDivider } from '../ds-primitives';
import { Mail, Phone, MapPin, Shield, Star, Users, Zap } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import {
  getFeaturedServiceReviews,
  getSiteAboutRequest,
  type PublicServiceReviewDto,
  type SiteAboutContent,
} from '../../lib/api';
import { formatDate } from '../../lib/datetime';

type LocalizedField = 'title' | 'mission' | 'description';

// Resolve a localized about-page field for the active language. Falls back
// to Russian (the canonical source of truth in the editor), then to the
// legacy single-field column kept for backward compatibility with older
// backend responses.
function pickLocalized(
  content: SiteAboutContent | null,
  field: LocalizedField,
  language: Language,
): string | null {
  if (!content) return null;
  const langKey = `${field}_${language}` as keyof SiteAboutContent;
  const fallbackKey = `${field}_ru` as keyof SiteAboutContent;
  const localized = (content[langKey] as string | null | undefined) ?? null;
  if (localized && typeof localized === 'string' && localized.trim()) return localized;
  const ruFallback = (content[fallbackKey] as string | null | undefined) ?? null;
  if (ruFallback && typeof ruFallback === 'string' && ruFallback.trim()) return ruFallback;
  const legacy = content[field];
  if (typeof legacy === 'string' && legacy.trim()) return legacy;
  return null;
}

export function AboutPage() {
  const { t, language } = useI18n();
  const [content, setContent] = useState<SiteAboutContent | null>(null);
  const [reviews, setReviews] = useState<PublicServiceReviewDto[]>([]);

  // Pull editable copy from the admin-managed endpoint; if it fails for any
  // reason we silently fall back to the static i18n strings so the page never
  // looks broken.
  useEffect(() => {
    let cancelled = false;
    getSiteAboutRequest()
      .then((data) => {
        if (!cancelled) setContent(data);
      })
      .catch(() => {
        /* fall back to i18n defaults */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch member testimonials separately — if the endpoint fails we just hide
  // the carousel section rather than surfacing an error block.
  useEffect(() => {
    let cancelled = false;
    getFeaturedServiceReviews()
      .then((data) => {
        if (!cancelled) setReviews(data ?? []);
      })
      .catch(() => {
        /* section hides when empty */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroTitle = pickLocalized(content, 'title', language)?.trim() || t('aboutEcoPay');
  const missionText = pickLocalized(content, 'mission', language)?.trim() || t('missionText');
  const descriptionText =
    pickLocalized(content, 'description', language)?.trim() || t('howWeHelpText');
  const contactEmail = content?.contactEmail?.trim() || t('contactEmail');
  const contactPhone = content?.contactPhone?.trim() || t('contactPhoneNumber');

  return (
    <div>
      {/* Hero */}
      <div className="py-12 sm:py-16 px-4 sm:px-6" style={{ background: 'var(--eco-surface)' }}>
        <div className="max-w-[800px] mx-auto">
          <h1
            className="text-[26px] sm:text-[40px] tracking-tight mb-4"
            style={{ color: 'var(--eco-text)' }}
          >
            {heroTitle}
          </h1>
          <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('aboutSubtitle')}
          </p>
        </div>
      </div>
      <WaveDivider flip />

      {/* Content */}
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-12">
        {/* Mission */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--eco-brand-50)' }}
            >
              <Zap size={20} style={{ color: 'var(--eco-primary)' }} />
            </div>
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('ourMission')}
              </h2>
              <p
                className="text-[14px] leading-relaxed whitespace-pre-line"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {missionText}
              </p>
            </div>
          </div>
        </section>

        {/* Trust & Privacy */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--eco-brand-50)' }}
            >
              <Shield size={20} style={{ color: 'var(--eco-primary)' }} />
            </div>
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('trustPrivacyTitle')}
              </h2>
              <p
                className="text-[14px] leading-relaxed mb-3"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {t('trustPrivacyText')}
              </p>
              <ul className="space-y-2">
                <li
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  <span className="shrink-0">•</span>
                  <span>{t('bulletVerifiedPayments')}</span>
                </li>
                <li
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  <span className="shrink-0">•</span>
                  <span>{t('bulletNoPersonalContact')}</span>
                </li>
                <li
                  className="flex items-start gap-2 text-[13px]"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  <span className="shrink-0">•</span>
                  <span>{t('bulletSupportOnly')}</span>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* How We Help */}
        <section className="mb-12">
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--eco-brand-50)' }}
            >
              <Users size={20} style={{ color: 'var(--eco-primary)' }} />
            </div>
            <div>
              <h2 className="text-[20px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('howWeHelpTitle')}
              </h2>
              <p
                className="text-[14px] leading-relaxed whitespace-pre-line"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {descriptionText}
              </p>
            </div>
          </div>
        </section>

        {/* Member reviews — hides itself when there are none */}
        {reviews.length > 0 && (
          <section className="mb-12">
            <h2 className="text-[20px] mb-4" style={{ color: 'var(--eco-text)' }}>
              {t('memberReviewsTitle')}
            </h2>
            <ReviewsCarousel reviews={reviews} language={language} />
          </section>
        )}

        {/* Divider */}
        <div className="my-12 border-t" style={{ borderColor: 'var(--eco-border)' }} />

        {/* Contact Section */}
        <section>
          <h2 className="text-[20px] mb-6" style={{ color: 'var(--eco-text)' }}>
            {t('contactGetInTouch')}
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: 'var(--eco-primary)' }}
              />
              <div>
                <p className="text-[14px] mb-1" style={{ color: 'var(--eco-text)' }}>
                  {contactPhone}
                </p>
                <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('contactPhoneNote')}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail size={18} className="mt-0.5 shrink-0" style={{ color: 'var(--eco-primary)' }} />
              <div>
                <p className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                  {contactEmail}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin
                size={18}
                className="mt-0.5 shrink-0"
                style={{ color: 'var(--eco-primary)' }}
              />
              <div>
                <p className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                  {t('contactLocation')}
                </p>
              </div>
            </div>
          </div>

          {/* Developer Credit */}
          <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
            <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              <strong style={{ color: 'var(--eco-text)' }}>{t('developedBy')}</strong>
              <br />
              {t('buildingTrust')}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

const REVIEWS_CAROUSEL_CSS = `
@keyframes ecoReviewsMarquee {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}
.eco-reviews-marquee {
  display: flex;
  overflow: hidden;
  -webkit-mask-image: linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%);
          mask-image: linear-gradient(to right, transparent 0, #000 32px, #000 calc(100% - 32px), transparent 100%);
}
.eco-reviews-marquee:hover .eco-reviews-marquee-track {
  animation-play-state: paused;
}
.eco-reviews-marquee-track {
  display: flex;
  flex-shrink: 0;
  gap: 16px;
  width: max-content;
  will-change: transform;
}
@media (prefers-reduced-motion: no-preference) {
  .eco-reviews-marquee-track--animated {
    animation: ecoReviewsMarquee linear infinite;
  }
}
@media (prefers-reduced-motion: reduce) {
  .eco-reviews-marquee {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
}
`;

function ReviewCard({ review, language }: { review: PublicServiceReviewDto; language: Language }) {
  return (
    <Card className="flex flex-col gap-3 min-w-[300px] max-w-[360px]">
      <div className="flex items-center gap-1" aria-label={`${review.rating}/5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={15}
            fill={i < review.rating ? 'var(--eco-warning-500)' : 'none'}
            style={{ color: i < review.rating ? 'var(--eco-warning-500)' : 'var(--eco-border)' }}
          />
        ))}
      </div>
      <p className="text-[14px] whitespace-pre-wrap" style={{ color: 'var(--eco-text-secondary)' }}>
        {review.text}
      </p>
      <div className="flex items-center justify-between gap-3 mt-1">
        <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
          {review.authorDisplayName}
        </span>
        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {formatDate(review.createdAt, language)}
        </span>
      </div>
    </Card>
  );
}

function ReviewsCarousel({
  reviews,
  language,
}: {
  reviews: PublicServiceReviewDto[];
  language: Language;
}) {
  if (reviews.length === 0) return null;

  if (reviews.length === 1) {
    return (
      <div className="flex justify-center">
        <ReviewCard review={reviews[0]} language={language} />
      </div>
    );
  }

  // Match a calm reading pace: longer the track, longer the loop, so px/s stays
  // roughly constant regardless of how many reviews are loaded.
  const durationSec = Math.max(20, reviews.length * 8);

  return (
    <div className="eco-reviews-marquee">
      <style>{REVIEWS_CAROUSEL_CSS}</style>
      <div
        className="eco-reviews-marquee-track eco-reviews-marquee-track--animated"
        style={{ animationDuration: `${durationSec}s` }}
      >
        {reviews.map((r) => (
          <ReviewCard key={`a-${r.id}`} review={r} language={language} />
        ))}
        {reviews.map((r) => (
          <div key={`b-${r.id}`} aria-hidden="true">
            <ReviewCard review={r} language={language} />
          </div>
        ))}
      </div>
    </div>
  );
}
