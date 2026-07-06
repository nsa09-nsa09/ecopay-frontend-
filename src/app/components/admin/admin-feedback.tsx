import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import { Badge, Button, Card, Input, Select } from '../ds-primitives';
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
import { ChevronLeft, ChevronRight, Inbox, RefreshCw, Save, Search, X } from 'lucide-react';

const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  NEW: 'info',
  IN_REVIEW: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'default',
};

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

  const [selectedId, setSelectedId] = useState<number | null>(null);
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
    async (id: number) => {
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
      <div className="max-w-[1200px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="flex items-center gap-2 text-[24px]" style={{ color: 'var(--eco-text)' }}>
            <Inbox size={20} /> {t('adminFeedbackTitle')}
          </h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t('retry')}
          </Button>
        </div>

        <FlashBanner flash={flash} />

        <Card className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Select
              label={t('adminFeedbackFilterType')}
              options={typeOptions}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            />
            <Select
              label={t('adminFeedbackFilterStatus')}
              options={statusOptions}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <form onSubmit={onSearchSubmit} className="lg:col-span-2 flex items-end gap-2">
              <div className="flex-1 min-w-0">
                <Input
                  label={t('adminFeedbackSearchPlaceholder')}
                  value={queryDraft}
                  onChange={(e) => setQueryDraft(e.target.value)}
                  placeholder={t('adminFeedbackSearchPlaceholder')}
                />
              </div>
              <Button type="submit" variant="primary" size="sm">
                <Search size={13} />
              </Button>
            </form>
          </div>
        </Card>

        {error && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {error}
            </span>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 flex flex-col gap-2">
            {loading && items.length === 0 && (
              <Card
                className="text-center text-[13px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('loading')}
              </Card>
            )}
            {!loading && items.length === 0 && (
              <Card
                className="text-center text-[13px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('adminFeedbackEmpty')}
              </Card>
            )}
            {items.map((item) => {
              const isActive = selectedId === item.id;
              const author = item.userDisplayName || item.userEmail || t('adminFeedbackAuthorAnon');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="text-left w-full rounded-xl p-3 transition-colors cursor-pointer"
                  style={{
                    background: isActive ? 'var(--eco-brand-50)' : 'var(--eco-bg)',
                    border: `1px solid ${isActive ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                  }}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info">{t(typeKey(item.type))}</Badge>
                    <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>
                      {t(statusKey(item.status))}
                    </Badge>
                  </div>
                  <div
                    className="mt-2 text-[13px] break-words"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {item.subject || item.message.slice(0, 80)}
                  </div>
                  <div className="mt-1 text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {author} · {formatDateTime(item.createdAt, language)}
                  </div>
                </button>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 text-[12px]">
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
          </div>

          <div className="lg:col-span-2">
            {!selectedId ? (
              <Card
                className="flex items-center justify-center py-16 text-[14px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('adminFeedbackSelect')}
              </Card>
            ) : detailLoading && !detail ? (
              <Card
                className="text-center text-[13px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('loading')}
              </Card>
            ) : detailError ? (
              <Card className="flex flex-col gap-2">
                <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
                  {detailError}
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => selectedId && void loadDetail(selectedId)}
                >
                  <RefreshCw size={13} /> {t('retry')}
                </Button>
              </Card>
            ) : detail ? (
              <Card className="flex flex-col gap-4">
                <div className="flex items-start gap-2 justify-between flex-wrap">
                  <div className="min-w-0">
                    <div className="text-[18px] break-words" style={{ color: 'var(--eco-text)' }}>
                      {detail.subject || t(typeKey(detail.type))}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      F-{detail.id} ·{' '}
                      {detail.userDisplayName || detail.userEmail || t('adminFeedbackAuthorAnon')} ·{' '}
                      {formatDateTime(detail.createdAt, language)}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info">{t(typeKey(detail.type))}</Badge>
                    <Badge variant={STATUS_VARIANT[detail.status] ?? 'default'}>
                      {t(statusKey(detail.status))}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="w-7 h-7 rounded-md flex items-center justify-center cursor-pointer"
                      style={{
                        background: 'var(--eco-surface)',
                        color: 'var(--eco-text-secondary)',
                      }}
                      aria-label="Close"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <div className="text-[12px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {t('adminFeedbackMessage')}
                  </div>
                  {/*
                    Render as plain text (not HTML) — React escapes by default.
                    `whitespace-pre-wrap` preserves user line breaks safely.
                  */}
                  <p
                    className="text-[14px] whitespace-pre-wrap break-words p-3 rounded-lg"
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

                <div>
                  <label className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {t('adminFeedbackAdminNote')}
                  </label>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg text-[14px] mt-1"
                    style={{
                      background: 'var(--eco-bg)',
                      color: 'var(--eco-text)',
                      border: '1px solid var(--eco-border)',
                      resize: 'vertical',
                    }}
                    placeholder={t('adminFeedbackNotePlaceholder')}
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
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
              </Card>
            ) : null}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
