import { useCallback, useMemo, useRef, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { useReducedMotion } from 'motion/react';
import { Card, Modal, Button } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import type { PublicServiceReviewDto } from '../../lib/api';
import { formatDate } from '../../lib/datetime';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/** Two uppercase initials from a display name (no avatar images on this surface). */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '•';
  const first = parts[0][0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1][0] ?? '') : '';
  return (first + second).toUpperCase();
}

function ReviewCard({
  review,
  language,
  onClick,
}: {
  review: PublicServiceReviewDto;
  language: Language;
  onClick?: () => void;
}) {
  const { t } = useI18n();
  const rating = Math.max(0, Math.min(5, Math.round(review.rating)));
  const textRef = useRef<HTMLParagraphElement>(null);
  const [truncated, setTruncated] = useState(false);

  const checkTruncation = useCallback((el: HTMLParagraphElement | null) => {
    textRef.current = el;
    if (el) setTruncated(el.scrollHeight > el.clientHeight + 1);
  }, []);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick?.(); }}
    >
    <Card className="flex flex-col gap-3 h-full cursor-pointer">
      <div
        className="flex items-center gap-1"
        role="img"
        aria-label={t('reviewRatingAria', { rating })}
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={15}
            aria-hidden="true"
            fill={i < rating ? 'var(--eco-warning-500)' : 'none'}
            style={{ color: i < rating ? 'var(--eco-warning-500)' : 'var(--eco-border)' }}
          />
        ))}
      </div>
      <p
        ref={checkTruncation}
        className="user-text text-[14px] flex-1 line-clamp-5"
        style={{ color: 'var(--eco-text-secondary)' }}
      >
        {review.text}
      </p>
      {truncated && (
        <span className="text-[12px]" style={{ color: 'var(--eco-primary)' }}>
          {tx(language, 'Читать полностью', 'Толық оқу', 'Read more')}
        </span>
      )}
      <div className="flex items-center gap-3 mt-1">
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] shrink-0"
          style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)', fontWeight: 600 }}
          aria-hidden="true"
        >
          {initials(review.authorDisplayName)}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
            {review.authorDisplayName}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {formatDate(review.createdAt, language)}
          </span>
        </div>
      </div>
    </Card>
    </div>
  );
}

const MIN_SLIDES_FOR_LOOP = 6;

export function ReviewsCarousel({
  reviews,
  language,
}: {
  reviews: PublicServiceReviewDto[];
  language: Language;
}) {
  const { t } = useI18n();
  const reduceMotion = useReducedMotion();
  const [modalReview, setModalReview] = useState<PublicServiceReviewDto | null>(null);

  const plugins = useMemo(
    () =>
      reduceMotion
        ? []
        : [
            AutoScroll({
              speed: 0.5,
              startDelay: 1000,
              stopOnInteraction: false,
              stopOnMouseEnter: true,
              stopOnFocusIn: true,
            }),
          ],
    [reduceMotion],
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, plugins);

  const autoScrollPlugin = emblaApi?.plugins()?.autoScroll as
    | { stop: () => void; play: () => void }
    | undefined;

  const openModal = useCallback((review: PublicServiceReviewDto) => {
    setModalReview(review);
    autoScrollPlugin?.stop();
  }, [autoScrollPlugin]);

  const closeModal = useCallback(() => {
    setModalReview(null);
    autoScrollPlugin?.play();
  }, [autoScrollPlugin]);

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  // Pad the list so the loop has enough slides to fill the widest layout
  // (3 per view) without a visible gap. Padded copies are flagged as duplicates.
  const slides = useMemo(() => {
    const out = reviews.map((review, index) => ({ review, index, duplicate: false }));
    let i = 0;
    while (out.length < MIN_SLIDES_FOR_LOOP && reviews.length > 0) {
      const review = reviews[i % reviews.length];
      out.push({ review, index: out.length, duplicate: true });
      i += 1;
    }
    return out;
  }, [reviews]);

  if (reviews.length === 0) return null;

  // One or two reviews never loop well; show them as a static centered grid.
  if (reviews.length <= 2) {
    return (
      <>
        <div className="flex flex-wrap justify-center gap-4">
          {reviews.map((review) => (
            <div key={review.id} className="w-full sm:w-[360px] max-w-full">
              <ReviewCard review={review} language={language} onClick={() => openModal(review)} />
            </div>
          ))}
        </div>
        <ReviewModal review={modalReview} language={language} onClose={closeModal} />
      </>
    );
  }

  return (
    <div role="region" aria-roledescription="carousel" aria-label={t('memberReviewsTitle')}>
      <div className="overflow-hidden" ref={emblaRef}>
        {/* 16px gutter via slide padding (not container gap): embla's loop clones
            miscalculate widths when the flex container uses `gap`. */}
        <div className="flex -ml-4">
          {slides.map((slide) => (
            <div
              key={`${slide.index}-${slide.review.id}`}
              className="shrink-0 min-w-0 basis-[88%] sm:basis-1/2 lg:basis-1/3 pl-4"
              aria-hidden={slide.duplicate ? 'true' : undefined}
            >
              <ReviewCard review={slide.review} language={language} onClick={() => openModal(slide.review)} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          type="button"
          aria-label={t('carouselPrevious')}
          onClick={scrollPrev}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          style={{
            background: 'transparent',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        >
          <ChevronLeft size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={t('carouselNext')}
          onClick={scrollNext}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
          style={{
            background: 'transparent',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        >
          <ChevronRight size={18} aria-hidden="true" />
        </button>
      </div>
      <ReviewModal review={modalReview} language={language} onClose={closeModal} />
    </div>
  );
}

function ReviewModal({
  review,
  language,
  onClose,
}: {
  review: PublicServiceReviewDto | null;
  language: Language;
  onClose: () => void;
}) {
  if (!review) return null;
  const rating = Math.max(0, Math.min(5, Math.round(review.rating)));
  return (
    <Modal
      open
      onClose={onClose}
      title={review.authorDisplayName}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              size={15}
              aria-hidden="true"
              fill={i < rating ? 'var(--eco-warning-500)' : 'none'}
              style={{ color: i < rating ? 'var(--eco-warning-500)' : 'var(--eco-border)' }}
            />
          ))}
        </div>
        <div
          className="user-text text-[14px]"
          style={{
            color: 'var(--eco-text-secondary)',
            maxHeight: '70vh',
            overflowY: 'auto',
            overflowWrap: 'anywhere',
            minWidth: 0,
          }}
        >
          {review.text}
        </div>
        <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {formatDate(review.createdAt, language)}
        </div>
        <Button variant="secondary" onClick={onClose}>
          {tx(language, 'Закрыть', 'Жабу', 'Close')}
        </Button>
      </div>
    </Modal>
  );
}
