import { memo, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, Newspaper } from 'lucide-react';
import { Card, Skeleton } from '../ds-primitives';
import { getNews, type NewsDto } from '../../lib/api';
import { formatShortDmyDate } from '../../lib/datetime';
import type { Language } from '../i18n-provider';

type L = Language;

interface NewsSectionProps {
  language: L;
  t: (key: string) => string;
  limit?: number;
  /**
   * "home" hides the section when there are no news (default).
   * "page" keeps it visible and renders an empty state — used by the
   * dedicated /news page where disappearing isn't OK.
   */
  mode?: 'home' | 'page';
}

const readMoreLabel: Record<L, string> = {
  ru: 'Читать новость',
  kz: 'Жаңалықты оқу',
  en: 'Read story',
};

export function pickLocalizedNews(item: NewsDto, language: L) {
  const titleKey = language === 'kz' ? 'titleKz' : language === 'en' ? 'titleEn' : 'titleRu';
  const bodyKey = language === 'kz' ? 'bodyKz' : language === 'en' ? 'bodyEn' : 'bodyRu';
  const localizedTitle = item[titleKey as keyof NewsDto];
  const localizedBody = item[bodyKey as keyof NewsDto];
  const title =
    (typeof localizedTitle === 'string' ? localizedTitle : null) ||
    item.titleRu ||
    item.titleEn ||
    item.titleKz ||
    '';
  const body =
    (typeof localizedBody === 'string' ? localizedBody : null) ||
    item.bodyRu ||
    item.bodyEn ||
    item.bodyKz ||
    '';
  const imageKey = language === 'kz' ? 'imageUrlKz' : language === 'en' ? 'imageUrlEn' : 'imageUrlRu';
  const image =
    (item[imageKey as keyof NewsDto] as string | null | undefined) ||
    item.imageUrl || item.imageUrlRu || item.imageUrlKz || item.imageUrlEn || null;
  const thumbKey =
    language === 'kz' ? 'imageThumbUrlKz' : language === 'en' ? 'imageThumbUrlEn' : 'imageThumbUrlRu';
  const thumb =
    (item[thumbKey as keyof NewsDto] as string | null | undefined) || item.imageThumbUrl || null;
  return { title, body, image, thumb };
}

function snippet(text: string, maxChars = 160): string {
  const clean = (text ?? '').trim().replace(/\s+/g, ' ');
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}…`;
}

const NEWS_CARD_SIZES = '(min-width:1024px) 380px, (min-width:640px) 50vw, 100vw';

/** Placeholder shown when there is no image or the image failed to load. */
function NewsImagePlaceholder() {
  return (
    <div
      className="w-full rounded-lg flex items-center justify-center"
      style={{ aspectRatio: '16 / 9', background: 'var(--eco-surface)' }}
    >
      <Newspaper size={24} style={{ color: 'var(--eco-text-tertiary)' }} />
    </div>
  );
}

/**
 * Fixed 16/9 frame with a skeleton background; the image fades in on load so
 * there is no layout shift and no flash of a half-decoded picture. A preview
 * (thumb) is used as the default source with the full image offered via
 * srcSet, so a small card never downloads the 1600px original.
 */
function NewsImage({
  thumb,
  image,
  loading,
  fetchPriority,
}: {
  thumb: string | null;
  image: string | null;
  loading: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const src = thumb ?? image;
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  // Reset the fade/error state when the source changes (e.g. language switch).
  useEffect(() => {
    setLoaded(false);
    setErrored(false);
  }, [src]);
  if (!src) return <NewsImagePlaceholder />;
  const srcSet = thumb && image ? `${thumb} 640w, ${image} 1600w` : undefined;
  return (
    <div
      className="relative w-full rounded-lg overflow-hidden"
      style={{ aspectRatio: '16 / 9', background: 'var(--eco-surface)' }}
    >
      {/* The <img> stays mounted even on error so the element (and its src) is
          always present; a broken image just fades out and the placeholder
          shows over it. */}
      <img
        src={src}
        srcSet={srcSet}
        sizes={srcSet ? NEWS_CARD_SIZES : undefined}
        alt=""
        loading={loading}
        fetchPriority={fetchPriority}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-200"
        style={{ opacity: loaded && !errored ? 1 : 0 }}
      />
      {errored && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Newspaper size={24} style={{ color: 'var(--eco-text-tertiary)' }} />
        </div>
      )}
    </div>
  );
}

const NewsCard = memo(function NewsCard({
  item,
  language,
  loading = 'lazy',
  fetchPriority,
}: {
  item: NewsDto;
  language: L;
  loading?: 'eager' | 'lazy';
  fetchPriority?: 'high' | 'low' | 'auto';
}) {
  const { title, body, image, thumb } = pickLocalizedNews(item, language);
  return (
    <Link
      to={`/news/${item.id}`}
      className="block h-full no-underline rounded-xl group"
      aria-label={title || readMoreLabel[language]}
    >
      <Card className="flex flex-col gap-3 h-full overflow-hidden eco-lift">
        <NewsImage thumb={thumb} image={image} loading={loading} fetchPriority={fetchPriority} />
        <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {formatShortDmyDate(item.publishedAt)}
        </div>
        <div className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
          {title || '—'}
        </div>
        <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {snippet(body)}
        </div>
        <div
          className="mt-auto inline-flex items-center gap-1 text-[13px] transition-colors"
          style={{ color: 'var(--eco-primary)' }}
        >
          {readMoreLabel[language]}
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </div>
      </Card>
    </Link>
  );
});

function NewsSkeleton() {
  return (
    <Card className="flex flex-col gap-3 h-full">
      <Skeleton height={180} rounded={10} />
      <Skeleton width="40%" height={12} />
      <Skeleton width="80%" height={16} />
      <Skeleton width="100%" height={12} />
      <Skeleton width="90%" height={12} />
    </Card>
  );
}

export function NewsSection({ language, t, limit = 6, mode = 'home' }: NewsSectionProps) {
  const [items, setItems] = useState<NewsDto[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    getNews(0, limit)
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const visible = useMemo(() => (items ?? []).slice(0, limit), [items, limit]);

  // On the home page, vanish entirely when there's nothing to show.
  if (mode === 'home' && !loading && !failed && visible.length === 0) return null;

  const isPage = mode === 'page';

  return (
    <section
      className={isPage ? 'px-4 sm:px-6 py-2' : 'px-4 sm:px-6 py-10 sm:py-12'}
      style={isPage ? undefined : { borderTop: '1px solid var(--eco-border)' }}
    >
      <div className="max-w-[1200px] mx-auto">
        {!isPage && (
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
            <div>
              <h2 className="text-[22px] sm:text-[24px]" style={{ color: 'var(--eco-text)' }}>
                {t('newsSectionTitle')}
              </h2>
              <p className="text-[13px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('newsSectionSubtitle')}
              </p>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <NewsSkeleton key={i} />
            ))}
          </div>
        ) : failed && visible.length === 0 ? (
          <Card
            className="text-center py-10 text-[13px]"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            {t('newsLoadFailed')}
          </Card>
        ) : visible.length === 0 ? (
          <Card className="text-center py-12">
            <div className="text-[15px] mb-1" style={{ color: 'var(--eco-text)' }}>
              {t('newsEmptyTitle')}
            </div>
            <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('newsEmptyDesc')}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {visible.map((item, index) => {
              // On the dedicated /news page the first row is above the fold:
              // eager-load the first three and give the very first high fetch
              // priority so it becomes the LCP candidate. Everything else (and
              // the whole home-page section, which sits far below the fold)
              // loads lazily.
              const eager = isPage && index < 3;
              return (
                <NewsCard
                  key={item.id}
                  item={item}
                  language={language}
                  loading={eager ? 'eager' : 'lazy'}
                  fetchPriority={isPage && index === 0 ? 'high' : undefined}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
