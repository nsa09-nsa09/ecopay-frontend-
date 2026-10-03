import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Button, Select, Skeleton } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import {
  assignAdminUserReportRequest,
  getAdminUserReportRequest,
  getAdminUserReportsRequest,
  getUserInvestigationRequest,
  updateAdminUserReportStatusRequest,
  type AdminUserReportDto,
  type UserInvestigationDto,
  type UserReportCategory,
  type UserReportStatus,
} from '../../lib/api';
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { RestrictionModal } from './restriction-modal';
import { Flag, MousePointerClick } from 'lucide-react';
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminListSkeleton,
  AdminPagination,
  AdminStatCard,
  AdminStatusBadge,
  AdminToolbar,
} from './admin-ui';


const categories: UserReportCategory[] = ['FRAUD', 'ABUSE', 'HARASSMENT', 'SPAM', 'OTHER'];
const statuses: UserReportStatus[] = ['OPEN', 'IN_REVIEW', 'REJECTED', 'RESOLVED'];
function categoryLabel(category: UserReportCategory, l: Language) {
  const labels = {
    FRAUD: ['Мошенничество', 'Алаяқтық', 'Fraud'],
    ABUSE: ['Нарушение правил', 'Ережелерді бұзу', 'Rule violation'],
    HARASSMENT: ['Оскорбления / преследование', 'Қорлау / қудалау', 'Harassment'],
    SPAM: ['Спам', 'Спам', 'Spam'],
    OTHER: ['Другое', 'Басқа', 'Other'],
  } as const;
  const index = l === 'ru' ? 0 : l === 'kz' ? 1 : 2;
  return labels[category]?.[index] ?? (['Другое', 'Басқа', 'Other'] as const)[index];
}
function statusLabel(status: UserReportStatus, l: Language) {
  const labels = {
    OPEN: ['Открыта', 'Ашық', 'Open'],
    IN_REVIEW: ['На проверке', 'Тексеруде', 'In review'],
    REJECTED: ['Отклонена', 'Қабылданбады', 'Rejected'],
    RESOLVED: ['Рассмотрена', 'Қаралды', 'Resolved'],
  } as const;
  const index = l === 'ru' ? 0 : l === 'kz' ? 1 : 2;
  return labels[status]?.[index] ?? (['Неизвестно', 'Белгісіз', 'Unknown'] as const)[index];
}
const displayPerson = (person: { displayName: string; slug: string | null }) =>
  `${person.displayName}${person.slug ? ` · @${person.slug}` : ''}`;

export function AdminUserReports() {
  const { language, t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [items, setItems] = useState<AdminUserReportDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<AdminUserReportDto | null>(null);
  const [investigation, setInvestigation] = useState<UserInvestigationDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionStatus, setActionStatus] = useState<UserReportStatus | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [restrictionUserId, setRestrictionUserId] = useState<number | null>(null);
  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminUserReportsRequest(token, {
          page,
          size: 20,
          status: statusFilter === 'ALL' ? undefined : (statusFilter as UserReportStatus),
          category: categoryFilter === 'ALL' ? undefined : (categoryFilter as UserReportCategory),
        }),
      );
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, statusFilter, categoryFilter, t]);
  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      setInvestigation(null);
      return;
    }
    let cancelled = false;
    setDetail(null);
    setInvestigation(null);
    setDetailLoading(true);
    setDetailError(null);
    const targetId = items.find((item) => item.id === selectedId)?.target.id;
    const reportRequest = authorizedRequest((token) => getAdminUserReportRequest(selectedId, token));
    const investigationRequest = targetId == null
      ? reportRequest.then((report) => authorizedRequest((token) => getUserInvestigationRequest(report.target.id, token)))
      : authorizedRequest((token) => getUserInvestigationRequest(targetId, token));
    Promise.allSettled([reportRequest, investigationRequest])
      .then(([reportResult, investigationResult]) => {
        if (cancelled) return;
        if (reportResult.status === 'fulfilled') setDetail(reportResult.value);
        else setDetailError(formatAdminApiError(reportResult.reason, t));
        if (investigationResult.status === 'fulfilled') setInvestigation(investigationResult.value);
        else if (reportResult.status === 'fulfilled') setDetailError(formatAdminApiError(investigationResult.reason, t));
      })
      .catch((err) => {
        if (!cancelled) setDetailError(formatAdminApiError(err, t));
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, selectedId, t]);

  const updateReport = (report: AdminUserReportDto) => {
    setDetail(report);
    setItems((old) => old.map((item) => (item.id === report.id ? report : item)));
  };
  const assign = async () => {
    if (!detail || submitting) return;
    setSubmitting(true);
    try {
      updateReport(
        await authorizedRequest((token) => assignAdminUserReportRequest(detail.id, token)),
      );
      showFlash('success', t('actionCompletedAndLogged'));
    } catch (err) {
      showFlash('error', formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };
  const changeStatus = async (reason: string) => {
    if (!detail || !actionStatus || submitting) return;
    setSubmitting(true);
    setActionError(null);
    try {
      updateReport(
        await authorizedRequest((token) =>
          updateAdminUserReportStatusRequest(detail.id, { status: actionStatus, reason }, token),
        ),
      );
      setActionStatus(null);
      showFlash('success', t('actionCompletedAndLogged'));
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 flex flex-col gap-5">
      <AdminToolbar>
        <div className="flex-[1_1_180px] min-w-0 max-w-[260px]">
          <Select
            label={t('financeColStatus')}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(0);
            }}
            options={[
              {
                value: 'ALL',
                label: t('adminFeedbackAllStatuses'),
              },
              ...statuses.map((status) => ({ value: status, label: statusLabel(status, language) })),
            ]}
          />
        </div>
        <div className="flex-[1_1_180px] min-w-0 max-w-[260px]">
          <Select
            label={t('category')}
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(0);
            }}
            options={[
              {
                value: 'ALL',
                label: t('adminAllCategories'),
              },
              ...categories.map((category) => ({
                value: category,
                label: categoryLabel(category, language),
              })),
            ]}
          />
        </div>
      </AdminToolbar>
      <FlashBanner flash={flash} />
      {error && !loading && items.length > 0 && (
        <AdminErrorState inline message={error} onRetry={() => void load()} />
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.4fr)] gap-5 items-start">
        <div className="flex flex-col gap-2 min-w-0">
          {loading && items.length === 0 && <AdminListSkeleton rows={5} height={88} />}
          {!loading && error && items.length === 0 && (
            <AdminCard>
              <AdminErrorState message={error} onRetry={() => void load()} />
            </AdminCard>
          )}
          {!loading && !error && items.length === 0 && (
            <AdminCard>
              <AdminEmptyState
                icon={Flag}
                title={t('adminNoUserReportsYet')}
                description={t('adminFilteredEmptyHint')}
                compact
              />
            </AdminCard>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              aria-pressed={selectedId === item.id}
              className={`eco-admin-record is-clickable text-left rounded-xl px-4 py-3 min-w-0 ${selectedId === item.id ? 'is-active' : ''}`}
              style={{ minHeight: 88, opacity: loading ? 0.6 : 1 }}
            >
              <div className="flex items-start justify-between gap-3">
                <strong
                  className="text-[13px] font-semibold break-words min-w-0"
                  style={{ color: 'var(--eco-text)' }}
                >
                  {displayPerson(item.target)}
                </strong>
                <AdminStatusBadge status={item.status}>
                  {statusLabel(item.status, language)}
                </AdminStatusBadge>
              </div>
              <div
                className="mt-1.5 text-[12px] break-words"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {categoryLabel(item.category, language)} · {t('adminBy')}{' '}
                {displayPerson(item.reporter)}
              </div>
              <div
                className="mt-1 text-[12px] tabular-nums"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {formatDateTime(item.createdAt, language)}
              </div>
            </button>
          ))}
          <AdminPagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          {selectedId == null ? (
            <AdminCard>
              <AdminEmptyState
                icon={MousePointerClick}
                title={t('adminSelectAReportToReview')}
              />
            </AdminCard>
          ) : detailLoading && !detail ? (
            <AdminCard>
              <div className="flex flex-col gap-3" aria-busy="true" aria-label={t('loading')}>
                <Skeleton width="55%" height={18} />
                <Skeleton width="20%" height={12} />
                <div className="grid grid-cols-2 gap-3">
                  <Skeleton height={36} rounded={8} />
                  <Skeleton height={36} rounded={8} />
                  <Skeleton height={36} rounded={8} />
                  <Skeleton height={36} rounded={8} />
                </div>
                <Skeleton width="70%" height={32} rounded={8} />
              </div>
            </AdminCard>
          ) : detail ? (
            <>
              <AdminCard
                title={
                  <span className="break-words">
                    {t('adminReportAbout')}{' '}
                    {detail.target.slug ? `@${detail.target.slug}` : detail.target.displayName}
                  </span>
                }
                description={<span className="tabular-nums">#{detail.id}</span>}
                actions={
                  <AdminStatusBadge status={detail.status}>
                    {statusLabel(detail.status, language)}
                  </AdminStatusBadge>
                }
                footer={
                  <>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={submitting}
                      onClick={() => void assign()}
                    >
                      {t('adminAssignToMe')}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={submitting} onClick={() => setActionStatus('REJECTED')}>
                      {t('adminRejectReport')}
                    </Button>
                    <Button variant="secondary" size="sm" disabled={submitting} onClick={() => setActionStatus('RESOLVED')}>
                      {t('adminResolveReport')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={submitting}
                      onClick={() => setRestrictionUserId(detail.target.id)}
                    >
                      {t('adminBlockUser')}
                    </Button>
                  </>
                }
              >
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <AdminField label={t('category')}>
                      {categoryLabel(detail.category, language)}
                    </AdminField>
                    <AdminField label={t('adminReporter')}>
                      {displayPerson(detail.reporter)}
                    </AdminField>
                    <AdminField label={t('financeColDate')} numeric>
                      {formatDateTime(detail.createdAt, language)}
                    </AdminField>
                    <AdminField label={t('adminAssignedTo')}>
                      {detail.assignedAdmin
                        ? displayPerson(detail.assignedAdmin)
                        : t('unassigned')}
                    </AdminField>
                  </div>
                  <Link
                    to={`/admin/users?selected=${detail.target.id}`}
                    className="text-[13px] self-start"
                    style={{ color: 'var(--eco-primary)' }}
                  >
                    {t('adminOpenUserInAdmin')}
                  </Link>
                </div>
              </AdminCard>
              <AdminCard
                title={t('adminReportDescription')}
              >
                <p
                  className="text-[13px] whitespace-pre-wrap break-words"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  {detail.description}
                </p>
              </AdminCard>
              <AdminCard
                title={t('adminUserHistory')}
              >
                <div className="flex flex-col gap-4">
                  {detailError && (
                    <p className="text-[12px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
                      {detailError}
                    </p>
                  )}
                  {!investigation && !detailError && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-busy="true">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} height={62} rounded={8} />
                      ))}
                    </div>
                  )}
                  {investigation && (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(
                          [
                            [
                              t('adminOwnedRooms'),
                              investigation.ownedRooms.length,
                            ],
                            [
                              t('adminMemberships'),
                              investigation.memberships.length,
                            ],
                            [t('memberStatDisputes'), investigation.disputesCount],
                            [
                              t('adminSupportTickets'),
                              investigation.supportTicketsCount,
                            ],
                          ] as const
                        ).map(([label, value]) => (
                          <AdminStatCard key={label} label={label} value={value} />
                        ))}
                      </div>
                      <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                        {t('adminReportsAgainstUser')}
                        : <span className="tabular-nums">{investigation.reportsAgainst}</span> ·{' '}
                        {t('adminReportsByUser')}
                        : <span className="tabular-nums">{investigation.reportsBy}</span>
                      </div>
                      {[...investigation.ownedRooms, ...investigation.memberships].map((room) => (
                        <Link
                          key={room.id}
                          to={`/admin/rooms?selected=${room.id}`}
                          className="text-[13px] break-words"
                          style={{ color: 'var(--eco-primary)' }}
                        >
                          {room.title} · R-{room.id}
                        </Link>
                      ))}
                      <div className="text-[12px] font-medium" style={{ color: 'var(--eco-text-secondary)' }}>
                        {t('adminRecentEvents')}
                      </div>
                      {investigation.recentRoomEvents.map((event) => (
                        <div
                          key={event.id}
                          className="text-[12px] flex flex-wrap justify-between gap-x-3 gap-y-1"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          <span>
                            {t('adminRoomEvent')}
                          </span>
                          {event.roomId && (
                            <Link to={`/admin/rooms?selected=${event.roomId}`}>R-{event.roomId}</Link>
                          )}
                          <span className="tabular-nums">{formatDateTime(event.createdAt, language)}</span>
                        </div>
                      ))}
                      {investigation.recentAdminActions.map((action) => (
                        <div
                          key={action.id}
                          className="text-[12px] flex flex-wrap justify-between gap-x-3 gap-y-1"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          <span>
                            {t('adminAdminAction')}
                          </span>
                          <span className="tabular-nums">{formatDateTime(action.createdAt, language)}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </AdminCard>
            </>
          ) : (
            <AdminCard>
              <AdminErrorState message={detailError || t('loadFailedTitle')} />
            </AdminCard>
          )}
        </div>
      </div>
      <ConfirmActionModal
        open={actionStatus != null}
        onClose={() => {
          if (!submitting) {
            setActionStatus(null);
            setActionError(null);
          }
        }}
        title={
          actionStatus === 'REJECTED'
            ? t('adminRejectReport2')
            : t('adminResolveReport2')
        }
        subjectLabel={detail ? displayPerson(detail.target) : null}
        destructive={actionStatus === 'REJECTED'}
        submitLabel={t('confirmLabel')}
        submitting={submitting}
        errorMessage={actionError}
        onConfirm={changeStatus}
      />
      <RestrictionModal
        userId={restrictionUserId}
        onClose={() => setRestrictionUserId(null)}
        onSaved={() => showFlash('success', t('actionCompletedAndLogged'))}
      />
    </div>
  );
}
