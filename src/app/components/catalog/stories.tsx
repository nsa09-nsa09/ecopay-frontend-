import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useI18n } from '../i18n-provider';
import { type LocalizedText, type Story } from '../../data/stories';
import { getStories, type StoryDto } from '../../lib/api';
import { readWithLegacyMigration } from '../../lib/legacy-storage';

type Lang = 'ru' | 'kz' | 'en';

const SLIDE_DURATION_MS = 5000;
const SEEN_STORAGE_KEY = 'ecopay.storiesSeen';
const LEGACY_SEEN_STORAGE_KEYS = ['ecosplit-stories-seen'] as const;
const STORIES_LIMIT = 12;
const DEFAULT_GRADIENT = 'linear-gradient(160deg, #FF8C42 0%, #F0741F 55%, #C55A12 100%)';

const pick = (value: LocalizedText, lang: Lang): string => value[lang] ?? value.ru;

const defaultCtaLabel: LocalizedText = {
  ru: 'Подробнее',
  kz: 'Толығырақ',
  en: 'Learn more',
};

function firstNonBlank(...values: Array<string | null | undefined>): string {
  return values.find((value) => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function localizedText(
  item: StoryDto,
  ruKey: keyof StoryDto,
  kzKey: keyof StoryDto,
  enKey: keyof StoryDto,
  fallback = '',
): LocalizedText {
  const ru = firstNonBlank(item[ruKey] as string | null | undefined, fallback);
  const kz = firstNonBlank(item[kzKey] as string | null | undefined, ru, fallback);
  const en = firstNonBlank(item[enKey] as string | null | undefined, ru, fallback);
  return { ru, kz, en };
}

function toUiStory(item: StoryDto): Story {
  const title = localizedText(item, 'titleRu', 'titleKz', 'titleEn', `#${item.id}`);
  const heading = localizedText(item, 'headingRu', 'headingKz', 'headingEn', title.ru);
  const text = localizedText(item, 'bodyRu', 'bodyKz', 'bodyEn', '');
  const gradient = item.gradient || DEFAULT_GRADIENT;
  const ctaLabel = localizedText(item, 'ctaLabelRu', 'ctaLabelKz', 'ctaLabelEn', defaultCtaLabel.ru);

  return {
    id: `story-${item.id}`,
    title,
    cover: item.imageUrl ?? undefined,
    emoji: item.emoji ?? undefined,
    gradient,
    seen: false,
    slides: [
      {
        id: `story-${item.id}-slide`,
        image: item.imageUrl ?? undefined,
        gradient,
        heading,
        text,
        cta: item.ctaUrl ? { label: ctaLabel, url: item.ctaUrl } : undefined,
      },
    ],
  };
}

// ─── Seen-state persistence (survives reloads) ───
function loadSeen(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = readWithLegacyMigration(
      window.localStorage,
      SEEN_STORAGE_KEY,
      LEGACY_SEEN_STORAGE_KEYS,
    );
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr)
      ? new Set(arr.filter((x): x is string => typeof x === 'string'))
      : new Set();
  } catch {
    return new Set();
  }
}

function persistSeen(seen: Set<string>) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify([...seen]));
  } catch {
    /* storage unavailable — seen-state is best-effort */
  }
}

// ─── Round preview bubble ───
function StoryBubble({
  story,
  seen,
  lang,
  onOpen,
}: {
  story: Story;
  seen: boolean;
  lang: Lang;
  onOpen: (rect: DOMRect) => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  const { t } = useI18n();

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => ref.current && onOpen(ref.current.getBoundingClientRect())}
      className="flex flex-col items-center gap-2 shrink-0 cursor-pointer select-none"
      style={{ background: 'transparent', border: 'none', width: 84 }}
      aria-label={t('storiesOpenAria', { title: pick(story.title, lang) })}
    >
      <span
        className="rounded-full flex items-center justify-center"
        style={{
          width: 72,
          height: 72,
          padding: 3,
          // Unseen: vivid brand gradient ring. Seen: muted grey ring.
          background: seen
            ? 'var(--eco-border-strong)'
            : 'linear-gradient(135deg, #FF8C42 0%, #F0741F 55%, #C55A12 100%)',
          transition: 'transform 0.18s ease',
        }}
      >
        <span
          className="rounded-full flex items-center justify-center overflow-hidden"
          style={{
            width: '100%',
            height: '100%',
            border: '2px solid var(--eco-surface-raised)',
            background: story.cover ? undefined : story.gradient,
            fontSize: 26,
          }}
        >
          {story.cover ? (
            <img
              src={story.cover}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
            />
          ) : (
            <span aria-hidden="true">{story.emoji ?? '✨'}</span>
          )}
        </span>
      </span>
      <span
        className="text-[12px] leading-tight text-center truncate w-full"
        style={{ color: 'var(--eco-text-secondary)' }}
        title={pick(story.title, lang)}
      >
        {pick(story.title, lang)}
      </span>
    </button>
  );
}

// ─── Horizontal preview strip ───
export function StoriesRow({ className = '' }: { className?: string }) {
  const { t, language } = useI18n();
  const lang = language as Lang;
  const scrollerRef = useRef<HTMLDivElement>(null);

  const [seen, setSeen] = useState<Set<string>>(loadSeen);
  const [items, setItems] = useState<StoryDto[]>([]);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    getStories(0, STORIES_LIMIT)
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stories = useMemo(() => items.map(toUiStory), [items]);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      persistSeen(next);
      return next;
    });
  }, []);

  const openAt = (index: number, rect: DOMRect) => {
    setOrigin({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
    setViewerIndex(index);
    markSeen(stories[index].id);
  };

  const scrollBy = (dir: -1 | 1) => {
    scrollerRef.current?.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  if (stories.length === 0) return null;

  return (
    <section className={className} aria-label={t('storiesSectionTitle')}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-[18px] sm:text-[20px] m-0"
            style={{ color: 'var(--eco-text)', fontWeight: 700 }}
          >
            {t('storiesSectionTitle')}
          </h2>
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollBy(-1)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'var(--eco-surface-raised)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text-secondary)',
              }}
              aria-label={t('storiesPrev')}
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => scrollBy(1)}
              className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
              style={{
                background: 'var(--eco-surface-raised)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text-secondary)',
              }}
              aria-label={t('storiesNext')}
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="flex gap-4 overflow-x-auto pb-2 eco-stories-scroller"
          style={{ scrollbarWidth: 'none' }}
        >
          {stories.map((story, index) => (
            <StoryBubble
              key={story.id}
              story={story}
              seen={seen.has(story.id)}
              lang={lang}
              onOpen={(rect) => openAt(index, rect)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {viewerIndex !== null && (
          <StoryViewer
            stories={stories}
            startIndex={viewerIndex}
            origin={origin}
            lang={lang}
            onSeen={markSeen}
            onClose={() => setViewerIndex(null)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Fullscreen viewer ───
function StoryViewer({
  stories,
  startIndex,
  origin,
  lang,
  onSeen,
  onClose,
}: {
  stories: Story[];
  startIndex: number;
  origin: { x: number; y: number } | null;
  lang: Lang;
  onSeen: (id: string) => void;
  onClose: () => void;
}) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [storyIndex, setStoryIndex] = useState(startIndex);
  const [slideIndex, setSlideIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);

  const story = stories[storyIndex];
  const slide = story.slides[slideIndex];

  const goNext = useCallback(() => {
    setProgress(0);
    setSlideIndex((si) => {
      if (si < stories[storyIndex].slides.length - 1) return si + 1;
      // advance to next story
      if (storyIndex < stories.length - 1) {
        const nextStory = storyIndex + 1;
        setStoryIndex(nextStory);
        onSeen(stories[nextStory].id);
        return 0;
      }
      onClose();
      return si;
    });
  }, [storyIndex, stories, onClose, onSeen]);

  const goPrev = useCallback(() => {
    setProgress(0);
    setSlideIndex((si) => {
      if (si > 0) return si - 1;
      if (storyIndex > 0) {
        setStoryIndex(storyIndex - 1);
        return 0;
      }
      return 0;
    });
  }, [storyIndex]);

  // Auto-advance timer (rAF-based, pause-aware, smooth for 60fps bars).
  useEffect(() => {
    if (paused) return;
    let raf = 0;
    let start = performance.now();
    let base = progress;

    const tick = (now: number) => {
      const pct = base + ((now - start) / SLIDE_DURATION_MS) * 100;
      if (pct >= 100) {
        setProgress(100);
        goNext();
        return;
      }
      setProgress(pct);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // progress is intentionally excluded: we snapshot it into `base` on (re)start
    // so pause/resume continues from where it stopped instead of restarting.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, storyIndex, slideIndex, goNext]);

  // Keyboard: ←/→ navigate, Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') goNext();
      else if (e.key === 'ArrowLeft') goPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onClose]);

  // Lock body scroll while the viewer is open.
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const handleCta = (url: string) => {
    onClose();
    if (url.startsWith('/')) navigate(url);
    else window.open(url, '_blank', 'noopener,noreferrer');
  };

  const transformOrigin = origin ? `${origin.x}px ${origin.y}px` : 'center center';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(2px)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t('storiesViewerAria')}
    >
      <motion.div
        className="relative overflow-hidden"
        style={{
          width: 'min(440px, 100vw)',
          height: 'min(90vh, 860px)',
          maxHeight: '100vh',
          borderRadius: 'clamp(0px, 4vw, 20px)',
          transformOrigin,
          background: slide.gradient ?? story.gradient,
          touchAction: 'pan-y',
        }}
        initial={{ scale: 0.85, opacity: 0.4 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
        drag="y"
        dragDirectionLock
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={{ top: 0, bottom: 0.6 }}
        onDragStart={() => setPaused(true)}
        onDragEnd={(_, info) => {
          if (info.offset.y > 120 || info.velocity.y > 600) onClose();
          else setPaused(false);
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Optional cover image over the gradient */}
        {slide.image && (
          <img
            src={slide.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        )}
        {/* Legibility scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.15) 60%, rgba(0,0,0,0.6) 100%)',
          }}
        />

        {/* Progress bars */}
        <div className="absolute top-0 left-0 right-0 flex gap-1 p-3 z-20">
          {story.slides.map((s, i) => (
            <div
              key={s.id}
              className="flex-1 h-[3px] rounded-full overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.35)' }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${i < slideIndex ? 100 : i === slideIndex ? progress : 0}%`,
                  background: '#fff',
                  borderRadius: 999,
                }}
              />
            </div>
          ))}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-3 z-30 w-9 h-9 rounded-full flex items-center justify-center cursor-pointer"
          style={{ background: 'rgba(0,0,0,0.3)', border: 'none', color: '#fff' }}
          aria-label={t('storiesClose')}
        >
          <X size={20} />
        </button>

        {/* Header: story title */}
        <div className="absolute top-6 left-4 z-20 flex items-center gap-2 pr-12">
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.2)', fontSize: 16 }}
            aria-hidden="true"
          >
            {story.emoji ?? '✨'}
          </span>
          <span className="text-[13px] truncate" style={{ color: '#fff', fontWeight: 600 }}>
            {pick(story.title, lang)}
          </span>
        </div>

        {/* Tap zones: left = prev, right = next. Hold = pause. */}
        <button
          type="button"
          className="absolute inset-y-0 left-0 z-10 cursor-pointer"
          style={{ width: '33%', background: 'transparent', border: 'none' }}
          onClick={goPrev}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-label={t('storiesPrev')}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 z-10 cursor-pointer"
          style={{ width: '33%', background: 'transparent', border: 'none' }}
          onClick={goNext}
          onPointerDown={() => setPaused(true)}
          onPointerUp={() => setPaused(false)}
          onPointerLeave={() => setPaused(false)}
          aria-label={t('storiesNext')}
        />

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${storyIndex}-${slideIndex}`}
            className="absolute inset-x-0 bottom-0 z-20 p-6 pb-8 flex flex-col gap-3"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
          >
            <h3
              className="text-[24px] leading-tight m-0"
              style={{ color: '#fff', fontWeight: 700 }}
            >
              {pick(slide.heading, lang)}
            </h3>
            <p className="text-[15px] leading-snug m-0" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {pick(slide.text, lang)}
            </p>
            {slide.cta && (
              <button
                type="button"
                onClick={() => handleCta(slide.cta!.url)}
                className="mt-2 self-start px-5 py-2.5 rounded-full text-[14px] cursor-pointer"
                style={{
                  background: '#fff',
                  color: 'var(--eco-primary)',
                  border: 'none',
                  fontWeight: 600,
                }}
              >
                {pick(slide.cta.label, lang)}
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
