import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { QRCodeSVG } from 'qrcode.react';
import { animate, motion, useReducedMotion } from 'motion/react';
import { Button, Card, WaveDivider } from '../ds-primitives';
import {
  Clock,
  Coins,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  Signal,
  Star,
  Users,
  Zap,
} from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import {
  getFeaturedServiceReviews,
  getSiteAboutRequest,
  type PublicServiceReviewDto,
  type SiteAboutContent,
} from '../../lib/api';
import { formatDate } from '../../lib/datetime';
import { appBrand } from '../../config/brand';

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

// ─── Motion helpers ─────────────────────────────────────────────────────────
// Only transform + opacity are animated, offsets are vertical, and every
// element keeps its layout box while hidden, so nothing shifts or overflows.

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];
const REVEAL_VIEWPORT = { once: true, margin: '-10% 0px' } as const;

/** False when motion should collapse to a static, final-state render. */
function useCanAnimate(): boolean {
  const reduce = useReducedMotion();
  return !reduce && typeof window !== 'undefined' && 'IntersectionObserver' in window;
}

/**
 * Scroll reveal: `whileInView` (once) drives the animation. Because content
 * starts at opacity 0, a fallback guarantees the end state when
 * IntersectionObserver never fires (some headless / older WebKit contexts):
 * a scroll/resize check plus a short poll force the element visible as soon
 * as it is actually on screen, and printing forces everything visible.
 */
function Reveal({
  children,
  className,
  delay = 0,
  y = 12,
  scale = 1,
  duration = 0.4,
  onShown,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  scale?: number;
  duration?: number;
  onShown?: () => void;
}) {
  const canAnimate = useCanAnimate();
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [forced, setForced] = useState(false);
  const onShownRef = useRef(onShown);
  onShownRef.current = onShown;

  const markShown = useCallback(() => {
    setShown((prev) => {
      if (!prev) onShownRef.current?.();
      return true;
    });
  }, []);

  useEffect(() => {
    if (!canAnimate || shown) return;
    const el = ref.current;
    if (!el) return;
    const check = () => {
      const rect = el.getBoundingClientRect();
      const h = window.innerHeight || document.documentElement.clientHeight;
      if (rect.top < h * 0.9 && rect.bottom > h * 0.1) {
        setForced(true);
        markShown();
      }
    };
    const force = () => {
      setForced(true);
      markShown();
    };
    const poll = window.setInterval(check, 500);
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    window.addEventListener('beforeprint', force);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
      window.removeEventListener('beforeprint', force);
    };
  }, [canAnimate, shown, markShown]);

  useEffect(() => {
    // Static render: nothing to wait for, run the callback right away.
    if (!canAnimate) onShownRef.current?.();
  }, [canAnimate]);

  // Variant labels propagate to motion children (e.g. the trust bullets), so
  // nested sequences follow the same in-view / forced trigger.
  const variants = {
    hidden: { opacity: 0, y, scale },
    shown: { opacity: 1, y: 0, scale: 1, transition: { duration, delay, ease: EASE_OUT } },
  };
  return (
    <motion.div
      ref={ref}
      className={`eco-about-motion ${className ?? ''}`}
      variants={variants}
      initial={canAnimate ? 'hidden' : false}
      whileInView="shown"
      animate={forced ? 'shown' : undefined}
      viewport={REVEAL_VIEWPORT}
      onViewportEnter={markShown}
    >
      {children}
    </motion.div>
  );
}

/** Mount animation for the hero (runs regardless of IntersectionObserver). */
function HeroItem({
  children,
  className,
  delay,
}: {
  children: ReactNode;
  className?: string;
  delay: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.34, delay, ease: EASE_OUT }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Splits a translated value like "до 70%" or "5 operators" into
 * prefix / number / suffix. Returns null for anything that is not a single
 * plain number ("24/7", "2–6×", text-only values) so it renders as-is.
 */
function parseCountable(
  value: string,
): { prefix: string; target: number; decimals: number; sep: string; suffix: string } | null {
  const match = /^(\D*?)(\d+(?:[.,]\d+)?)(\D*)$/.exec(value);
  if (!match) return null;
  const [, prefix, numeric, suffix] = match;
  if (/[/–—\-×:.,]$/.test(prefix) || /^[/–—\-×:.,]/.test(suffix)) return null;
  const sep = numeric.includes(',') ? ',' : '.';
  const target = Number(numeric.replace(',', '.'));
  if (!Number.isFinite(target)) return null;
  const decimals = numeric.includes(sep) ? numeric.split(sep)[1].length : 0;
  return { prefix, target, decimals, sep, suffix };
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

  return (
    <div>
      {/* Hero */}
      <div className="py-14 sm:py-20 px-4 sm:px-6" style={{ background: 'var(--eco-surface)' }}>
        <div className="max-w-[960px] mx-auto text-center sm:text-left">
          <HeroItem delay={0}>
            <h1
              className="text-[30px] sm:text-[46px] leading-tight tracking-tight mb-4"
              style={{ color: 'var(--eco-text)' }}
            >
              {heroTitle}
            </h1>
          </HeroItem>
          <HeroItem delay={0.08}>
            <p
              className="text-[16px] sm:text-[18px] max-w-[680px] mx-auto sm:mx-0"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {t('aboutSubtitle')}
            </p>
          </HeroItem>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-start justify-center">
            <HeroItem delay={0.16}>
              <Link to="/">
                <Button variant="primary" size="lg">
                  {t('aboutCtaCatalog')}
                </Button>
              </Link>
            </HeroItem>
            <HeroItem delay={0.22}>
              <Link to="/rooms/create">
                <Button variant="secondary" size="lg">
                  {t('aboutCtaCreateRoom')}
                </Button>
              </Link>
            </HeroItem>
          </div>
        </div>
      </div>
      <WaveDivider flip />

      {/* Content */}
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-12">
        {/* Facts strip */}
        <section className="mb-14">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <FactTile
              icon={<Coins size={20} style={{ color: 'var(--eco-primary)' }} />}
              value={t('aboutFactSavingsValue')}
              index={0}
              label={t('aboutFactSavingsLabel')}
            />
            <FactTile
              icon={<Signal size={20} style={{ color: 'var(--eco-primary)' }} />}
              value={t('aboutFactOperatorsValue')}
              index={1}
              label={t('aboutFactOperatorsLabel')}
            />
            <FactTile
              icon={<ShieldCheck size={20} style={{ color: 'var(--eco-primary)' }} />}
              value={t('aboutFactSecureValue')}
              index={2}
              label={t('aboutFactSecureLabel')}
            />
            <FactTile
              icon={<Clock size={20} style={{ color: 'var(--eco-primary)' }} />}
              value={t('aboutFactSupportValue')}
              index={3}
              label={t('aboutFactSupportLabel')}
            />
          </div>
        </section>

        {/* Mission / Trust / How We Help — 2-column landing grid */}
        <section className="mb-14 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          <FeatureCard
            icon={<Zap size={20} style={{ color: 'var(--eco-primary)' }} />}
            title={t('ourMission')}
            index={0}
          >
            <p
              className="text-[14px] leading-relaxed whitespace-pre-line"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {missionText}
            </p>
          </FeatureCard>

          <FeatureCard
            icon={<Shield size={20} style={{ color: 'var(--eco-primary)' }} />}
            title={t('trustPrivacyTitle')}
            index={1}
          >
            <p
              className="text-[14px] leading-relaxed mb-3"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {t('trustPrivacyText')}
            </p>
            <ul className="space-y-2">
              <TrustBullet text={t('bulletVerifiedPayments')} index={0} />
              <TrustBullet text={t('bulletNoPersonalContact')} index={1} />
              <TrustBullet text={t('bulletSupportOnly')} index={2} />
            </ul>
          </FeatureCard>

          <FeatureCard
            className="md:col-span-2"
            icon={<Users size={20} style={{ color: 'var(--eco-primary)' }} />}
            title={t('howWeHelpTitle')}
            index={2}
          >
            <p
              className="text-[14px] leading-relaxed whitespace-pre-line"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {descriptionText}
            </p>
          </FeatureCard>
        </section>

        {/* QR block — only when a real browser origin is known */}
        {qrUrl && (
          <section className="mb-14">
            <Reveal y={0} scale={0.97} duration={0.45}>
              <Card className="flex flex-col items-center text-center gap-4 py-8">
                <h2 className="text-[20px] sm:text-[24px]" style={{ color: 'var(--eco-text)' }}>
                  {t('aboutQrTitle')}
                </h2>
                <div
                  className="eco-about-qr p-4 rounded-2xl"
                  style={{ background: '#ffffff', border: '1px solid var(--eco-border)' }}
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
              </Card>
            </Reveal>
          </section>
        )}

        {/* Member reviews — hides itself when there are none */}
        {reviews.length > 0 && (
          <section className="mb-14">
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
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Reveal delay={0}>
              <Link to="/support" style={{ textDecoration: 'none' }}>
                <ContactTile
                  icon={<ShieldCheck size={18} style={{ color: 'var(--eco-primary)' }} />}
                  text={t('contactSupport')}
                />
              </Link>
            </Reveal>
            {contactEmail && (
              <Reveal delay={0.06}>
                <ContactTile
                  icon={<Mail size={18} style={{ color: 'var(--eco-primary)' }} />}
                  text={contactEmail}
                />
              </Reveal>
            )}
            {contactPhone && (
              <Reveal delay={0.12}>
                <ContactTile
                  icon={<Phone size={18} style={{ color: 'var(--eco-primary)' }} />}
                  text={contactPhone}
                />
              </Reveal>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function FactTile({
  icon,
  value,
  label,
  index,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  index: number;
}) {
  const canAnimate = useCanAnimate();
  const parsed = parseCountable(value);
  const format = useCallback(
    (n: number) =>
      parsed
        ? `${parsed.prefix}${n.toFixed(parsed.decimals).replace('.', parsed.sep)}${parsed.suffix}`
        : value,
    [parsed?.prefix, parsed?.decimals, parsed?.sep, parsed?.suffix, value],
  );
  // While the tile is hidden (opacity 0) the counter sits at zero; it never
  // shows a partial number without an animation driving it to the end.
  const [display, setDisplay] = useState(() =>
    parsed && canAnimate ? format(0) : value,
  );
  const startedRef = useRef(false);

  useEffect(() => {
    // Language switch or a non-animating context: show the final value.
    if (!parsed || !canAnimate || startedRef.current) setDisplay(value);
  }, [value, canAnimate]);

  const startCount = useCallback(() => {
    if (startedRef.current || !parsed || !canAnimate) {
      setDisplay(value);
      return;
    }
    startedRef.current = true;
    animate(0, parsed.target, {
      duration: 0.9,
      delay: 0.1 + index * 0.08,
      ease: EASE_OUT,
      onUpdate: (n) => setDisplay(format(parsed.decimals === 0 ? Math.round(n) : n)),
      onComplete: () => setDisplay(value),
    });
  }, [parsed?.target, canAnimate, format, index, value]);

  return (
    <Reveal delay={index * 0.07} onShown={startCount} className="h-full">
      <div
        className="p-4 rounded-xl flex flex-col gap-2 h-full"
        style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          {icon}
        </div>
        <div
          className="text-[16px] leading-tight tabular-nums"
          style={{ color: 'var(--eco-text)' }}
        >
          {/* Screen readers get the final value; the visual layer reserves the
              final width (ghost copy) so counting never reflows the tile. */}
          <span className="sr-only">{value}</span>
          <span aria-hidden="true" className="grid">
            <span className="invisible col-start-1 row-start-1">{value}</span>
            <span className="col-start-1 row-start-1">{display}</span>
          </span>
        </div>
        <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {label}
        </div>
      </div>
    </Reveal>
  );
}

function FeatureCard({
  icon,
  title,
  children,
  className = '',
  index = 0,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <Reveal className={className} delay={index * 0.08}>
      <Card className="flex flex-col gap-3 h-full">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--eco-brand-50)' }}
          >
            {icon}
          </div>
          <h2 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
            {title}
          </h2>
        </div>
        <div>{children}</div>
      </Card>
    </Reveal>
  );
}

function TrustBullet({ text, index }: { text: string; index: number }) {
  const canAnimate = useCanAnimate();
  const content = (
    <>
      <span className="shrink-0">•</span>
      <span>{text}</span>
    </>
  );
  if (!canAnimate) {
    return (
      <li className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
        {content}
      </li>
    );
  }
  // No trigger of its own: inherits hidden/shown from the parent Reveal, so it
  // can never be left hidden once the card itself is visible.
  return (
    <motion.li
      className="flex items-start gap-2 text-[13px]"
      style={{ color: 'var(--eco-text-secondary)' }}
      variants={{
        hidden: { opacity: 0, y: 6 },
        shown: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, delay: 0.25 + index * 0.1, ease: EASE_OUT },
        },
      }}
    >
      {content}
    </motion.li>
  );
}

function ContactTile({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="p-4 rounded-lg flex items-start gap-3"
      style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
    >
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-[14px] break-all" style={{ color: 'var(--eco-text)' }}>
        {text}
      </span>
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
