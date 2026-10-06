import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge, Button, Input, Select, Skeleton } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import {
  adminGetFeedbackItemRequest,
  adminGetFeedbackRequest,
  adminUpdateFeedbackRequest,
  type FeedbackDto,
  type FeedbackStatus,
  type FeedbackType,
} from '../../lib/api';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { Inbox, MousePointerClick, Save, Search, X } from 'lucide-react';
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminListSkeleton,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
  AdminStatusBadge,
  AdminToolbar,
} from './admin-ui';

const PAGE_SIZE = 20;

function typeKey(type: FeedbackType): string {
  switch (type) {
    case 'COMPLAINT':
      return 'feedbackTypeComplaint';
    case 'IDEA':
      return 'feedbackTypeIdea';
    case 'REQUEST':
      return 'feedbackTypeRequest';
    default:
      return 'feedbackTypeRequest';
  }
}

function statusKey(status: FeedbackStatus): string {
  switch (status) {
    case 'NEW':
      return 'feedbackStatusNew';
    case 'IN_REVIEW':
      return 'feedbackStatusInReview';
    case 'RESOLVED':
      return 'feedbackStatusResolved';
    case 'DISMISSED':
      return 'feedbackStatusDismissed';
    default:
      return 'feedbackStatusNew';
  }
}

export function AdminFeedbackPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const { flash, show } = useFlash();
  const [searchParams] = useSearchParams();

  const [items, setItems] = useState<FeedbackDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [queryDraft, setQueryDraft] = useState('');
  const [query, setQuery] = useState('');

  const [selectedId, setSelectedId] = useState<string | number | null>(null);
  const [detail, setDetail] = useState<FeedbackDto | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [statusDraft, setStatusDraft] = useState<FeedbackStatus>('NEW');
  const [noteDraft, setNoteDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const typeOptions = useMemo(
    () => [
      { value: 'ALL', label: t('adminFeedbackAllTypes') },
      { value: 'COMPLAINT', label: t('feedbackTypeComplaint') },
      { value: 'IDEA', label: t('feedbackTypeIdea') },
      { value: 'REQUEST', label: t('feedbackTypeRequest') },
    ],
    [t],
  );

  const statusOptions = useMemo(
    () => [
      { value: 'ALL', label: t('adminFeedbackAllStatuses') },
      { value: 'NEW', label: t('feedbackStatusNew') },
      { value: 'IN_REVIEW', label: t('feedbackStatusInReview') },
      { value: 'RESOLVED', label: t('feedbackStatusResolved') },
      { value: 'DISMISSED', label: t('feedbackStatusDismissed') },
    ],
    [t],
  );

  const editableStatusOptions = useMemo(
    () => statusOptions.filter((o) => o.value !== 'ALL'),
    [statusOptions],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        adminGetFeedbackRequest(token, {
          page,
          size: PAGE_SIZE,
          type: typeFilter !== 'ALL' ? typeFilter : undefined,
          status: statusFilter !== 'ALL' ? statusFilter : undefined,
          q: query.trim() || undefined,
        }),
      );
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, typeFilter, statusFilter, query, t]);

  useEffect(() => {
    void load();
  }, [load]);

  // Reset to first page when filters change.
  useEffect(() => {
    setPage(0);
  }, [typeFilter, statusFilter, query]);

  const loadDetail = useCallback(
    async (id: string | number) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await authorizedRequest((token) => adminGetFeedbackItemRequest(id, token));
        setDetail(data);
        setStatusDraft(data.status as FeedbackStatus);
        setNoteDraft(data.adminNote ?? '');
      } catch (err) {
        setDetailError(formatAdminApiError(err, t));
      } finally {
        setDetailLoading(false);
      }
    },
    [authorizedRequest, t],
  );

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Honor `?selected=<id>` so the global admin search can deep-link straight
  // to a feedback item's detail panel.
  useEffect(() => {
    // Keep the id as a string: 64-bit ids would be corrupted by Number().
    const raw = searchParams.get('selected');
    if (!raw) return;
    setSelectedId(raw);
  }, [searchParams]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    try {
      const noteTrimmed = noteDraft.trim();
      const updated = await authorizedRequest((token) =>
        adminUpdateFeedbackRequest(
          detail.id,
          {
            status: statusDraft,
            adminNote: noteTrimmed.length > 0 ? noteTrimmed : null,
          },
          token,
        ),
      );
      setDetail(updated);
      setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
      show('success', t('actionCompletedAndLogged'));
    } catch (err) {
      show('error', formatAdminApiError(err, t) || t('adminFeedbackUpdateFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setQuery(queryDraft);
  };

  return (
    <AdminLayout>
      <AdminPage width="wide">
        <AdminPageHeader
          title={t('adminFeedbackTitle')}
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />

        <FlashBanner flash={flash} />

        <AdminToolbar>
          <div className="flex-[1_1_160px] min-w-0">
            <Select
              label={t('adminFeedbackFilterType')}
              options={typeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
          </div>
          <div className="flex-[1_1_160px] min-w-0">
            <Select
              label={t('adminFeedbackFilterStatus')}
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
          </div>
          <form onSubmit={onSearchSubmit} className="flex-[2_1_260px] min-w-0 flex items-end gap-2">
            <div className="flex-1 min-w-0">
              <Input
                label={t('adminFeedbackSearchPlaceholder')}
                value={queryDraft}
                onChange={(e) => setQueryDraft(e.target.value)}
                placeholder={t('adminFeedbackSearchPlaceholder')}
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              className="h-[38px]"
              aria-label={t('adminFeedbackSearchPlaceholder')}
            >
              <Search size={13} aria-hidden />
            </Button>
          </form>
        </AdminToolbar>

        {error && !loading && items.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 flex flex-col gap-2 min-w-0">
            {loading && items.length === 0 && <AdminListSkeleton rows={6} height={84} />}
            {!loading && error && items.length === 0 && (
              <AdminCard>
                <AdminErrorState message={error} onRetry={() => void load()} />
              </AdminCard>
            )}
            {!loading && !error && items.length === 0 && (
              <AdminCard>
                <AdminEmptyState
                  icon={Inbox}
                  title={t('adminFeedbackEmpty')}
                  description={t('adminFilteredEmptyHint')}
                  compact
                />
              </AdminCard>
            )}
            {items.map((item) => {
              const isActive = String(selectedId) === String(item.id);
              const author = item.userDisplayName || item.userEmail || t('adminFeedbackAuthorAnon');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={isActive}
                  className={`eco-admin-record is-clickable text-left w-full rounded-xl px-4 py-3 ${isActive ? 'is-active' : ''}`}
                  style={{ minHeight: 84 }}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Badge variant="info">{t(typeKey(item.type))}</Badge>
                    <AdminStatusBadge status={item.status}>
                      {t(statusKey(item.status))}
                    </AdminStatusBadge>
                  </div>
                  <div
                    className="mt-2 text-[13px] font-semibold break-words"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {item.subject || item.message.slice(0, 80)}
                  </div>
                  <div className="mt-1 text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                    {author} · <span className="tabular-nums">{formatDateTime(item.createdAt, language)}</span>
                  </div>
                </button>
              );
            })}

            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>

          <div className="lg:col-span-2 min-w-0">
            {!selectedId ? (
              <AdminCard>
                <AdminEmptyState icon={MousePointerClick} title={t('adminFeedbackSelect')} />
              </AdminCard>
            ) : detailLoading && !detail ? (
              <AdminCard>
                <div className="flex flex-col gap-3" aria-busy="true" aria-label={t('loading')}>
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="40%" height={12} />
                  <Skeleton height={96} rounded={8} />
                  <Skeleton width="50%" height={36} rounded={8} />
                  <Skeleton height={88} rounded={8} />
                </div>
              </AdminCard>
            ) : detailError ? (
              <AdminCard>
                <AdminErrorState
                  message={detailError}
                  onRetry={() => selectedId && void loadDetail(selectedId)}
                />
              </AdminCard>
            ) : detail ? (
              <AdminCard
                title={<span className="break-words">{detail.subject || t(typeKey(detail.type))}</span>}
                description={
                  <>
                    F-{detail.id} ·{' '}
                    {detail.userDisplayName || detail.userEmail || t('adminFeedbackAuthorAnon')} ·{' '}
                    <span className="tabular-nums">{formatDateTime(detail.createdAt, language)}</span>
                  </>
                }
                actions={
                  <>
                    <Badge variant="info">{t(typeKey(detail.type))}</Badge>
                    <AdminStatusBadge status={detail.status}>
                      {t(statusKey(detail.status))}
                    </AdminStatusBadge>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                      style={{
                        background: 'var(--eco-surface)',
                        color: 'var(--eco-text-secondary)',
                        border: 'none',
                      }}
                      aria-label={t('close')}
                    >
                      <X size={14} />
                    </button>
                  </>
                }
                footer={
                  <div className="ml-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => void handleSave()}
                      loading={saving}
                      disabled={saving}
                    >
                      <Save size={13} /> {t('adminFeedbackSaveChanges')}
                    </Button>
                  </div>
                }
              >
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="text-[12px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {t('adminFeedbackMessage')}
                    </div>
                    {/*
                      Render as plain text (not HTML) — React escapes by default.
                      `whitespace-pre-wrap` preserves user line breaks safely.
                    */}
                    <p
                      className="text-[13px] whitespace-pre-wrap break-words p-3 rounded-lg"
                      style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
                    >
                      {detail.message}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Select
                      label={t('adminFeedbackSetStatus')}
                      options={editableStatusOptions}
                      value={statusDraft}
                      onChange={(e) => setStatusDraft(e.target.value as FeedbackStatus)}
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="admin-feedback-note"
                      className="text-[12px]"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {t('adminFeedbackAdminNote')}
                    </label>
                    <textarea
                      id="admin-feedback-note"
                      value={noteDraft}
                      onChange={(e) => setNoteDraft(e.target.value)}
                      rows={4}
                      className="eco-input w-full px-3 py-2 rounded-lg text-[13px] outline-none"
                      style={{ resize: 'vertical' }}
                      placeholder={t('adminFeedbackNotePlaceholder')}
                    />
                  </div>
                </div>
              </AdminCard>
            ) : null}
          </div>
        </div>
      </AdminPage>
    </AdminLayout>
  );
}
