import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, CalendarDays, Newspaper } from 'lucide-react';
import { useI18n } from '../i18n-provider';
import { Button, Card, Skeleton } from '../ds-primitives';
import { NewsSection, pickLocalizedNews } from '../catalog/home-news';
import { StoriesRow } from '../catalog/stories';
import { SocialCards } from '../catalog/social-cards';
import { getNews, getNewsById, type NewsDto } from '../../lib/api';
import { formatDate } from '../../lib/datetime';

const detailLabels = {
  back: { ru: 'К новостям', kz: 'Жаңалықтарға', en: 'Back to news' },
  published: { ru: 'Опубликовано', kz: 'Жарияланды', en: 'Published' },
  notFoundTitle: { ru: 'Новость не найдена', kz: 'Жаңалық табылмады', en: 'Story not found' },
  notFoundDesc: {
    ru: 'Возможно, запись снята с публикации или ссылка устарела.',
    kz: 'Жазба жарияланымнан алынған немесе сілтеме ескірген болуы мүмкін.',
    en: 'The post may have been unpublished or the link is outdated.',
  },
  emptyBody: {
    ru: 'Текст новости пока не заполнен.',
    kz: 'Жаңалық мәтіні әзірге толтырылмаған.',
    en: 'This story does not have body text yet.',
  },
  otherNews: { ru: 'Другие новости', kz: 'Басқа жаңалықтар', en: 'More news' },
};

type DetailLabel = keyof typeof detailLabels;

function label(key: DetailLabel, language: 'ru' | 'kz' | 'en') {
  return detailLabels[key][language] ?? detailLabels[key].ru;
}

function splitArticleBody(body: string) {
  return body
    .trim()
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function NewsPage() {
  const { language, t } = useI18n();
  return (
    <div className="py-10 sm:py-14">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <header className="mb-8">
          <h1
            className="text-[28px] sm:text-[34px] leading-tight tracking-tight"
            style={{ color: 'var(--eco-text)', fontWeight: 700 }}
          >
            {t('news')}
          </h1>
          <p className="text-[14px] mt-2 max-w-2xl" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('newsSectionSubtitle')}
          </p>
        </header>
      </div>

      {/* ─── Stories strip ─── */}
      <StoriesRow className="mb-10 sm:mb-12" />

      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        <NewsSection language={language} t={t} mode="page" limit={24} />
      </div>

      {/* ─── Follow us: Instagram + TikTok ─── */}
      <SocialCards className="mt-12 sm:mt-16" />
    </div>
  );
}

export function NewsDetailPage() {
  const { id } = useParams();
  const { language } = useI18n();
  const [item, setItem] = useState<NewsDto | null>(null);
  const [related, setRelated] = useState<NewsDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const newsId = useMemo(() => {
    const value = id?.trim();
    return value && /^\d+$/.test(value) ? value : null;
  }, [id]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [newsId]);

  useEffect(() => {
    let cancelled = false;
    if (newsId == null) {
      setItem(null);
      setFailed(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setFailed(false);
    getNewsById(newsId)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) {
          setItem(null);
          setFailed(true);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [newsId]);

  useEffect(() => {
    let cancelled = false;
    if (newsId == null) return;
    getNews(0, 4)
      .then((data) => {
        if (!cancelled) {
          setRelated(data.filter((news) => String(news.id) !== newsId).slice(0, 3));
        }
      })
      .catch(() => {
        if (!cancelled) setRelated([]);
      });
    return () => {
      cancelled = true;
    };
  }, [newsId]);

  const { title, body } = item ? pickLocalizedNews(item, language) : { title: '', body: '' };
  const paragraphs = splitArticleBody(body);

  useEffect(() => {
    if (!title) return;
    document.title = `${title} | EcoSplit`;
  }, [title]);

  if (loading) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Skeleton width={150} height={38} rounded={8} />
        <div className="mt-8">
          <Skeleton width="70%" height={46} rounded={10} />
          <div className="mt-5">
            <Skeleton height={420} rounded={12} />
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Skeleton height={16} />
            <Skeleton height={16} />
            <Skeleton width="78%" height={16} />
          </div>
        </div>
      </div>
    );
  }

  if (failed || !item) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
        <Link to="/news" className="inline-flex mb-8 no-underline">
          <Button variant="secondary" size="md">
            <ArrowLeft size={16} />
            {label('back', language)}
          </Button>
        </Link>
        <Card className="text-center py-14">
          <Newspaper size={28} className="mx-auto mb-4" style={{ color: 'var(--eco-primary)' }} />
          <h1 className="text-[24px] sm:text-[28px]" style={{ color: 'var(--eco-text)' }}>
            {label('notFoundTitle', language)}
          </h1>
          <p className="text-[14px] mt-3" style={{ color: 'var(--eco-text-secondary)' }}>
            {label('notFoundDesc', language)}
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12">
      <article className="max-w-[960px] mx-auto px-4 sm:px-6">
        <Link to="/news" className="inline-flex mb-7 no-underline">
          <Button variant="secondary" size="md">
            <ArrowLeft size={16} />
            {label('back', language)}
          </Button>
        </Link>

        <header className="mb-6 sm:mb-8">
          <div
            className="inline-flex items-center gap-2 text-[13px] mb-4"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            <CalendarDays size={15} />
            <span>{label('published', language)}</span>
            <span>{formatDate(item.publishedAt, language)}</span>
          </div>
          <h1
            className="text-[30px] sm:text-[44px] leading-tight tracking-tight max-w-[860px]"
            style={{ color: 'var(--eco-text)', fontWeight: 700 }}
          >
            {title || label('notFoundTitle', language)}
          </h1>
        </header>

        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt=""
            width={960}
            height={520}
            className="w-full max-h-[560px] object-cover rounded-xl mb-8 sm:mb-10"
            style={{ background: 'var(--eco-surface)' }}
          />
        ) : (
          <div
            className="w-full min-h-[260px] sm:min-h-[380px] rounded-xl flex items-center justify-center mb-8 sm:mb-10"
            style={{ background: 'var(--eco-surface)' }}
            aria-hidden="true"
          >
            <Newspaper size={38} style={{ color: 'var(--eco-text-tertiary)' }} />
          </div>
        )}

        <div className="max-w-[760px]">
          {paragraphs.length > 0 ? (
            <div className="flex flex-col gap-5">
              {paragraphs.map((paragraph, index) => (
                <p
                  key={index}
                  className="text-[16px] sm:text-[17px] leading-8 whitespace-pre-line"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          ) : (
            <p
              className="text-[16px] sm:text-[17px] leading-8"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {label('emptyBody', language)}
            </p>
          )}
        </div>
      </article>

      {related.length > 0 && (
        <section className="max-w-[960px] mx-auto px-4 sm:px-6 mt-14 sm:mt-[72px]">
          <h2 className="text-[22px] sm:text-[26px] mb-5" style={{ color: 'var(--eco-text)' }}>
            {label('otherNews', language)}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {related.map((news) => {
              const localized = pickLocalizedNews(news, language);
              return (
                <Link key={news.id} to={`/news/${news.id}`} className="no-underline">
                  <Card className="h-full eco-lift">
                    <div className="text-[12px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {formatDate(news.publishedAt, language)}
                    </div>
                    <div className="text-[15px] leading-snug" style={{ color: 'var(--eco-text)' }}>
                      {localized.title || label('notFoundTitle', language)}
                    </div>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
