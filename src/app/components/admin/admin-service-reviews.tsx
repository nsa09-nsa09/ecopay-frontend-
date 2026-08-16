import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Card, Modal, Select } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { StarRating } from '../reputation/public-profile';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  adminDeleteServiceReview,
  adminGetServiceReviews,
  adminSetServiceReviewFeatured,
  type AdminServiceReviewDto,
} from '../../lib/api';

const PAGE_SIZE = 20;

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

type FeaturedFilter = 'all' | 'featured' | 'not_featured';
const HOMEPAGE_SLOTS = [1, 2, 3, 4, 5, 6];

export function AdminServiceReviewsPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [items, setItems] = useState<AdminServiceReviewDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FeaturedFilter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<AdminServiceReviewDto | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [homepageReviews, setHomepageReviews] = useState<AdminServiceReviewDto[]>([]);
  const { flash, show } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const featuredParam = filter === 'all' ? undefined : filter === 'featured';
      const [data, featuredData] = await authorizedRequest((token) =>
        Promise.all([
          adminGetServiceReviews(token, { page, size: PAGE_SIZE, featured: featuredParam }),
          adminGetServiceReviews(token, { page: 0, size: 6, featured: true }),
        ]),
      );
      setItems(data.items);
      setHomepageReviews(featuredData.items);
      setTotalPages(Math.max(1, data.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, filter, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const setHomepageSlot = async (review: AdminServiceReviewDto, slotValue: string) => {
    const homepagePosition = slotValue ? Number(slotValue) : null;
    const featured = homepagePosition != null;
    if (featured && review.verifiedExperience === false) {
      show(
        'error',
        tx(
          language,
          'Only reviews with a verified EcoPay experience can be featured on the homepage.',
          'Only reviews with a verified EcoPay experience can be featured on the homepage.',
          'Only reviews with a verified EcoPay experience can be featured on the homepage.',
        ),
      );
      return;
    }
    setPendingId(review.id);
    try {
      await authorizedRequest((token) =>
        adminSetServiceReviewFeatured(review.id, featured, homepagePosition, token),
      );
      show('success', t('actionCompletedAndLogged'));
      void load();
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    } finally {
      setPendingId(null);
    }
  };

  const removeFromHomepage = (review: AdminServiceReviewDto) => setHomepageSlot(review, '');

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await authorizedRequest((token) => adminDeleteServiceReview(deleting.id, token));
      setDeleting(null);
      show('success', t('actionCompletedAndLogged'));
      void load();
    } catch (err) {
      show('error', formatAdminApiError(err, t));
    }
  };

  const sortedHomepageReviews = useMemo(
    () =>
      [...homepageReviews].sort(
        (a, b) =>
          (a.homepagePosition ?? Number.MAX_SAFE_INTEGER) -
            (b.homepagePosition ?? Number.MAX_SAFE_INTEGER) ||
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [homepageReviews],
  );

  const homepagePosition = useCallback(
    (review: AdminServiceReviewDto) => {
      if (!review.featured) return null;
      return review.homepagePosition ?? null;
    },
    [],
  );

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminServiceReviews')}
          </h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-full sm:w-52">
              <Select
                value={filter}
                onChange={(e) => {
                  setPage(0);
                  setFilter(e.target.value as FeaturedFilter);
                }}
                options={[
                  { value: 'all', label: t('adminServiceReviewsAll') },
                  { value: 'featured', label: t('adminServiceReviewsFeatured') },
                  { value: 'not_featured', label: t('adminServiceReviewsNotFeatured') },
                ]}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> {t('retry')}
            </Button>
          </div>
        </div>

        <FlashBanner flash={flash} />

        {!loading && (
          <Card className="mb-4 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-[16px] m-0" style={{ color: 'var(--eco-text)' }}>
                  Homepage reviews - {Math.min(sortedHomepageReviews.length, 6)}/6
                </h2>
                <p className="text-[12px] mt-1 m-0" style={{ color: 'var(--eco-text-tertiary)' }}>
                  Featured user reviews appear on the public homepage in backend order.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
                <RefreshCw size={13} /> {t('retry')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, index) => {
                const review =
                  sortedHomepageReviews.find(
                    (homepageReview) => homepageReview.homepagePosition === index + 1,
                  ) ?? null;
                return (
                  <div
                    key={`homepage-slot-${index}`}
                    className="min-h-[132px] rounded-lg p-3 flex flex-col gap-2"
                    style={{
                      background: 'var(--eco-surface)',
                      border: '1px solid var(--eco-border)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={review ? 'success' : 'default'}>Slot {index + 1}</Badge>
                      {review?.verifiedExperience === true && (
                        <Badge variant="success">Verified</Badge>
                      )}
                    </div>
                    {review ? (
                      <>
                        <div className="min-w-0">
                          <Link
                            to={`/u/${review.authorPublicId}`}
                            className="text-[13px] block truncate"
                            style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                          >
                            {review.authorDisplayName}
                          </Link>
                          <StarRating rating={review.rating} size={13} />
                        </div>
                        <p
                          className="text-[12px] line-clamp-3 m-0 flex-1"
                          style={{ color: 'var(--eco-text-secondary)' }}
                        >
                          {review.text}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => void removeFromHomepage(review)}
                          disabled={pendingId === review.id}
                        >
                          Remove from homepage
                        </Button>
                      </>
                    ) : (
                      <span
                        className="text-[12px] flex-1 flex items-center"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        Empty
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {error && !loading && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {error}
            </span>
          </Card>
        )}

        {loading ? (
          <Card>
            <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('loading')}
            </span>
          </Card>
        ) : items.length === 0 ? (
          <Card
            className="text-center py-10 text-[13px]"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            {tx(language, 'Отзывов пока нет', 'Әзірге пікірлер жоқ', 'No reviews yet')}
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((review) => (
              <Card key={review.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/u/${review.authorPublicId}`}
                        className="text-[14px] inline-flex items-center gap-1"
                        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                        title={t('adminServiceReviewOpenAuthor')}
                      >
                        {review.authorDisplayName} <ExternalLink size={12} />
                      </Link>
                      <span
                        className="text-[11px] break-all"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        U-{review.authorId} · {review.authorEmail}
                      </span>
                      {review.featured && (
                        <Badge variant="success">{t('serviceReviewFeaturedBadge')}</Badge>
                      )}
                      <Badge variant={review.verifiedExperience === false ? 'default' : 'success'}>
                        {review.verifiedExperience === false ? 'Unverified' : 'Verified'}
                      </Badge>
                      {homepagePosition(review) != null && (
                        <Badge variant="info">Homepage #{homepagePosition(review)}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {formatDateTime(review.createdAt, language)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="w-44">
                      <Select
                        aria-label={t('adminServiceReviewFeatureToggle')}
                        value={review.featured ? String(review.homepagePosition ?? '') : ''}
                        disabled={
                          pendingId === review.id ||
                          (!review.featured && review.verifiedExperience === false)
                        }
                        onChange={(event) => void setHomepageSlot(review, event.target.value)}
                        options={[
                          { value: '', label: 'Not on homepage' },
                          ...HOMEPAGE_SLOTS.map((slot) => ({
                            value: String(slot),
                            label: `Slot ${slot}`,
                          })),
                        ]}
                      />
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(review)}>
                      <Trash2 size={12} /> {t('catalogDelete')}
                    </Button>
                  </div>
                </div>
                <p className="text-[13px] whitespace-pre-wrap" style={{ color: 'var(--eco-text)' }}>
                  {review.text}
                </p>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-[12px]">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={12} /> {t('prevPage')}
            </Button>
            <span style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('pageOf', { page: page + 1, total: totalPages })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t('nextPage')} <ChevronRight size={12} />
            </Button>
          </div>
        )}

        <Modal
          open={!!deleting}
          onClose={() => setDeleting(null)}
          title={t('adminServiceReviewDeleteConfirm')}
        >
          <div className="flex flex-col gap-4">
            {deleting && (
              <div
                className="p-3 rounded-lg text-[12px]"
                style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
              >
                {deleting.authorDisplayName} · {deleting.rating}/5
              </div>
            )}
            <Button variant="destructive" onClick={() => void handleDelete()}>
              {t('catalogDelete')}
            </Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
