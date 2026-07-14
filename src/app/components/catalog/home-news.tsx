import { memo, useEffect, useMemo, useState } from 'react';
import { Newspaper } from 'lucide-react';
import { Card, Skeleton } from '../ds-primitives';
import { getNews, type NewsDto } from '../../lib/api';
import { formatDate } from '../../lib/datetime';
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

function pickLocalized(item: NewsDto, language: L) {
  const titleKey = language === 'kz' ? 'titleKz' : language === 'en' ? 'titleEn' : 'titleRu';
  const bodyKey = language === 'kz' ? 'bodyKz' : language === 'en' ? 'bodyEn' : 'bodyRu';
  const title =
    ((item as Record<string, unknown>)[titleKey] as string | null | undefined) ||
    item.titleRu ||
    item.titleEn ||
    item.titleKz ||
    '';
  const body =
    ((item as Record<string, unknown>)[bodyKey] as string | null | undefined) ||
    item.bodyRu ||
    item.bodyEn ||
    item.bodyKz ||
    '';
  return { title, body };
}

function snippet(text: string, maxChars = 160): string {
  const clean = (text ?? '').trim().replace(/\s+/g, ' ');
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, maxChars).trimEnd()}…`;
}

const NewsCard = memo(function NewsCard({ item, language }: { item: NewsDto; language: L }) {
  const { title, body } = pickLocalized(item, language);
  return (
    <Card className="flex flex-col gap-3 h-full overflow-hidden">
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt=""
          width={480}
          height={260}
          loading="lazy"
          decoding="async"
          className="w-full h-[180px] object-cover rounded-lg"
          style={{ background: 'var(--eco-surface)' }}
        />
      ) : (
        <div
          className="w-full h-[180px] rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-surface)' }}
        >
          <Newspaper size={24} style={{ color: 'var(--eco-text-tertiary)' }} />
        </div>
      )}
      <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {formatDate(item.publishedAt, language)}
      </div>
      <div className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
        {title || '—'}
      </div>
      <div className="text-[13px] mt-auto" style={{ color: 'var(--eco-text-secondary)' }}>
        {snippet(body)}
      </div>
    </Card>
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
            {visible.map((item) => (
              <NewsCard key={item.id} item={item} language={language} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
