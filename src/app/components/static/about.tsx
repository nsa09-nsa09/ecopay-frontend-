import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { motion, useReducedMotion } from 'motion/react';
import { Button } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import {
  getFeaturedServiceReviews,
  getSiteAboutRequest,
  type PublicServiceReviewDto,
  type SiteAboutContent,
} from '../../lib/api';
import { appBrand } from '../../config/brand';
import { ReviewsCarousel } from '../reputation/reviews-carousel';
import { SupportCta } from '../support/support-cta';

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

/**
 * Single calm section reveal: opacity 0→1 with an 8px rise, 300ms, once. Under
 * reduced-motion (or without IntersectionObserver) it renders in its final
 * state immediately. Playwright treats opacity:0 as visible, so content is
 * always present for the e2e/a11y assertions.
 */
function Reveal({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  const canAnimate = !reduce && typeof window !== 'undefined' && 'IntersectionObserver' in window;
  if (!canAnimate) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div
      className="text-[12px] uppercase"
      style={{ color: 'var(--eco-text-tertiary)', letterSpacing: '0.12em' }}
    >
      {children}
    </div>
  );
}

/** Top border that separates editorial sections (no shadowed cards). */
const sectionClass = 'py-12 border-t';
const sectionStyle = { borderColor: 'var(--eco-border)' } as const;

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
  const contactEmail = content?.contactEmail?.trim() || appBrand.supportEmail;
  const contactPhone = content?.contactPhone?.trim() || '';

  // QR points at the current origin so a phone scan lands on the same host
  // the visitor is browsing. Strip the Vite dev port (:5173) so a QR scanned
  // from a laptop dev session still opens on the phone. There is no canonical
  // site URL in the brand config, so without a browser origin the QR block is
  // not rendered at all rather than pointing at a guessed domain.
  const qrUrl = (() => {
    if (typeof window === 'undefined' || !window.location?.origin) return null;
    const origin = window.location.origin;
    if (!/^https?:\/\//.test(origin)) return null;
    return origin.replace(/:5173(?=\/|$)/, '');
  })();

  const steps = [
    { title: t('howItWorksStep1Title'), desc: t('howItWorksStep1Desc') },
    { title: t('howItWorksStep2Title'), desc: t('howItWorksStep2Desc') },
    { title: t('howItWorksStep3Title'), desc: t('howItWorksStep3Desc') },
  ];

  return (
    <div className="max-w-[880px] mx-auto px-4 sm:px-6">
      {/* Hero */}
      <section className="pt-14 pb-12 sm:pt-20">
        <Reveal>
          <Eyebrow>{t('aboutEyebrow')}</Eyebrow>
          <h1
            className="mt-3 text-[32px] sm:text-[48px] leading-[1.1] tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
          >
            {heroTitle}
          </h1>
          <p
            className="mt-4 text-[17px] sm:text-[19px] leading-relaxed max-w-[640px]"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {t('aboutSubtitle')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
            <Link to="/">
              <Button variant="primary" size="lg" className="w-full justify-center sm:w-auto">
                {t('aboutCtaCatalog')}
              </Button>
            </Link>
            <Link to="/rooms/create">
              <Button variant="secondary" size="lg" className="w-full justify-center sm:w-auto">
                {t('aboutCtaCreateRoom')}
              </Button>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* Mission */}
      <section className={sectionClass} style={sectionStyle}>
        <Reveal>
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,240px)_1fr] gap-6 md:gap-10">
            <div>
              <Eyebrow>{t('missionEyebrow')}</Eyebrow>
              <h2
                className="mt-2 text-[22px] sm:text-[26px] leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
              >
                {t('ourMission')}
              </h2>
            </div>
            <p
              className="text-[16px] leading-relaxed whitespace-pre-line"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {missionText}
            </p>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className={sectionClass} style={sectionStyle}>
        <Reveal>
          <h2
            className="text-[22px] sm:text-[26px] leading-tight mb-8"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
          >
            {t('aboutHowItWorksTitle')}
          </h2>
          <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
            {steps.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span
                  className="text-[28px] tabular-nums leading-none"
                  style={{ color: 'var(--eco-primary)', fontFamily: 'var(--font-display)' }}
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-[17px] leading-snug" style={{ color: 'var(--eco-text)' }}>
                  {step.title}
                </h3>
                <p className="text-[14px] leading-relaxed" style={{ color: 'var(--eco-text-secondary)' }}>
                  {step.desc}
                </p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* Trust & privacy */}
      <section className={sectionClass} style={sectionStyle}>
        <Reveal>
          <h2
            className="text-[22px] sm:text-[26px] leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
          >
            {t('trustPrivacyTitle')}
          </h2>
          <p
            className="text-[16px] leading-relaxed max-w-[640px]"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {t('trustPrivacyText')}
          </p>
          <ul className="mt-6">
            {[t('bulletVerifiedPayments'), t('bulletNoPersonalContact'), t('bulletSupportOnly')].map(
              (bullet, i) => (
                <li
                  key={bullet}
                  className="py-3 text-[15px]"
                  style={{
                    color: 'var(--eco-text)',
                    borderTop: i === 0 ? 'none' : '1px solid var(--eco-border)',
                  }}
                >
                  {bullet}
                </li>
              ),
            )}
          </ul>
        </Reveal>
      </section>

      {/* How we help — CMS description */}
      <section className={sectionClass} style={sectionStyle}>
        <Reveal>
          <h2
            className="text-[22px] sm:text-[26px] leading-tight mb-4"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
          >
            {t('howWeHelpTitle')}
          </h2>
          <p
            className="text-[16px] leading-relaxed whitespace-pre-line max-w-[680px]"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {descriptionText}
          </p>
        </Reveal>
      </section>

      {/* QR — only when a real browser origin is known. QRCodeSVG params unchanged. */}
      {qrUrl && (
        <section className={sectionClass} style={sectionStyle}>
          <Reveal>
            <div className="flex flex-col items-center text-center gap-4">
              <h2
                className="text-[22px] sm:text-[26px] leading-tight"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
              >
                {t('aboutQrTitle')}
              </h2>
              <div
                className="eco-about-qr p-4 rounded-2xl"
                style={{ background: '#ffffff', border: '1px solid var(--eco-border)' }}
                aria-hidden="true"
              >
                <QRCodeSVG
                  value={qrUrl}
                  size={220}
                  level="H"
                  marginSize={4}
                  bgColor="#ffffff"
                  fgColor="#111111"
                  imageSettings={{
                    src: '/ecopay-logo-transparent.png',
                    height: 40,
                    width: 40,
                    excavate: true,
                  }}
                />
              </div>
              <p className="text-[14px] max-w-[420px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('aboutQrCaption')}
              </p>
              <a
                href={qrUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--eco-primary)', fontSize: 13, wordBreak: 'break-all' }}
              >
                {qrUrl}
              </a>
            </div>
          </Reveal>
        </section>
      )}

      {/* Member reviews — hides itself when there are none */}
      {reviews.length > 0 && (
        <section className={sectionClass} style={sectionStyle}>
          <Reveal>
            <h2
              className="text-[22px] sm:text-[26px] leading-tight mb-6"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
            >
              {t('memberReviewsTitle')}
            </h2>
            <ReviewsCarousel reviews={reviews} language={language} />
          </Reveal>
        </section>
      )}

      {/* Contact */}
      <section className={`${sectionClass} mb-16`} style={sectionStyle}>
        <Reveal>
          <h2
            className="text-[22px] sm:text-[26px] leading-tight mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--eco-text)' }}
          >
            {t('contactGetInTouch')}
          </h2>
          <SupportCta />
          <div className="mt-6 flex flex-col gap-2 text-[15px]">
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} style={{ color: 'var(--eco-primary)' }}>
                {contactEmail}
              </a>
            )}
            {contactPhone && (
              <a href={`tel:${contactPhone.replace(/\s+/g, '')}`} style={{ color: 'var(--eco-primary)' }}>
                {contactPhone}
              </a>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
