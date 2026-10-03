import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Select, Skeleton } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { StarRating } from '../reputation/public-profile';
import { ExternalLink, Star, Trash2 } from 'lucide-react';
import {
  AdminCard,
  AdminConfirm,
  AdminEmptyState,
  AdminErrorState,
  AdminListSkeleton,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
  AdminSegmented,
  AdminToolbar,
} from './admin-ui';
import {
  adminDeleteServiceReview,
  adminGetServiceReviews,
  adminSetServiceReviewFeatured,
  type AdminServiceReviewDto,
} from '../../lib/api';

const PAGE_SIZE = 20;


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
      show('error', t('adminHomepageVerifiedOnly'));
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
      <AdminPage>
        <AdminPageHeader
          title={t('adminServiceReviews')}
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />

        <FlashBanner flash={flash} />

        <AdminCard
          title={t('adminHomepageReviewsTitle', {
            count: Math.min(sortedHomepageReviews.length, 6),
          })}
          description={t('adminHomepageReviewsHint')}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {Array.from({ length: 6 }).map((_, index) => {
              const review =
                sortedHomepageReviews.find(
                  (homepageReview) => homepageReview.homepagePosition === index + 1,
                ) ?? null;
              return (
                <div
                  key={`homepage-slot-${index}`}
                  className="min-h-[132px] rounded-lg p-3 flex flex-col gap-2 min-w-0"
                  style={{
                    background: 'var(--eco-surface)',
                    border: review
                      ? '1px solid var(--eco-border)'
                      : '1px dashed var(--eco-border-strong)',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={review ? 'success' : 'default'}>
                      {t('adminHomepageSlot', { n: index + 1 })}
                    </Badge>
                    {review?.verifiedExperience === true && (
                      <Badge variant="success">{t('verified')}</Badge>
                    )}
                  </div>
                  {loading && homepageReviews.length === 0 ? (
                    <div className="flex flex-col gap-2 flex-1" aria-hidden>
                      <Skeleton width="50%" height={12} />
                      <Skeleton height={12} />
                      <Skeleton width="80%" height={12} />
                    </div>
                  ) : review ? (
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
                        className="text-[12px] line-clamp-3 m-0 flex-1 break-words"
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
                        {t('adminHomepageRemove')}
                      </Button>
                    </>
                  ) : (
                    <span
                      className="text-[12px] flex-1 flex items-center"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {t('adminHomepageSlotEmpty')}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </AdminCard>

        <AdminToolbar>
          <AdminSegmented<FeaturedFilter>
            value={filter}
            onChange={(value) => {
              setPage(0);
              setFilter(value);
            }}
            options={[
              { value: 'all', label: t('adminServiceReviewsAll') },
              { value: 'featured', label: t('adminServiceReviewsFeatured') },
              { value: 'not_featured', label: t('adminServiceReviewsNotFeatured') },
            ]}
          />
        </AdminToolbar>

        {error && !loading && items.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        {loading && items.length === 0 ? (
          <AdminListSkeleton rows={4} height={120} />
        ) : error && items.length === 0 ? (
          <AdminCard>
            <AdminErrorState message={error} onRetry={() => void load()} />
          </AdminCard>
        ) : items.length === 0 ? (
          <AdminCard>
            <AdminEmptyState
              icon={Star}
              title={t('adminNoReviewsYet')}
              description={t('adminFilteredEmptyHint')}
            />
          </AdminCard>
        ) : (
          <div className="flex flex-col gap-3" style={{ opacity: loading ? 0.6 : 1 }}>
            {items.map((review) => (
              <AdminCard key={review.id}>
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex flex-col gap-1 min-w-0 flex-[1_1_240px]">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <Link
                          to={`/u/${review.authorPublicId}`}
                          className="text-[13px] font-semibold inline-flex items-center gap-1"
                          style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                          title={t('adminServiceReviewOpenAuthor')}
                        >
                          {review.authorDisplayName} <ExternalLink size={12} />
                        </Link>
                        <span
                          className="text-[12px] break-all"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          U-{review.authorId} · {review.authorEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {review.featured && (
                          <Badge variant="success">{t('serviceReviewFeaturedBadge')}</Badge>
                        )}
                        <Badge variant={review.verifiedExperience === false ? 'default' : 'success'}>
                          {review.verifiedExperience === false ? t('notVerified') : t('verified')}
                        </Badge>
                        {homepagePosition(review) != null && (
                          <Badge variant="info">
                            {t('adminHomepageBadge', { n: homepagePosition(review) ?? '' })}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StarRating rating={review.rating} size={14} />
                        <span
                          className="text-[12px] tabular-nums"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          {formatDateTime(review.createdAt, language)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                      <div className="w-44 max-w-full">
                        <Select
                          aria-label={t('adminServiceReviewFeatureToggle')}
                          value={review.featured ? String(review.homepagePosition ?? '') : ''}
                          disabled={
                            pendingId === review.id ||
                            (!review.featured && review.verifiedExperience === false)
                          }
                          onChange={(event) => void setHomepageSlot(review, event.target.value)}
                          options={[
                            { value: '', label: t('adminHomepageNone') },
                            ...HOMEPAGE_SLOTS.map((slot) => ({
                              value: String(slot),
                              label: t('adminHomepageSlot', { n: slot }),
                            })),
                          ]}
                        />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setDeleting(review)}>
                        <Trash2 size={13} /> {t('catalogDelete')}
                      </Button>
                    </div>
                  </div>
                  <p
                    className="text-[13px] whitespace-pre-wrap break-words"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {review.text}
                  </p>
                </div>
              </AdminCard>
            ))}
          </div>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />

        <AdminConfirm
          open={!!deleting}
          onClose={() => setDeleting(null)}
          title={t('adminServiceReviewDeleteConfirm')}
          confirmLabel={t('catalogDelete')}
          onConfirm={handleDelete}
        >
          {deleting && (
            <div
              className="p-3 rounded-lg text-[12px]"
              style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
            >
              {deleting.authorDisplayName} · {deleting.rating}/5
            </div>
          )}
        </AdminConfirm>
      </AdminPage>
    </AdminLayout>
  );
}
