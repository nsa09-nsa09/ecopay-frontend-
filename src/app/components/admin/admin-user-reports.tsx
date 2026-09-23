import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Badge, Button, Card, Select } from '../ds-primitives';
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

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

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
  return labels[category]?.[index] ?? tx(l, 'Другое', 'Басқа', 'Other');
}
function statusLabel(status: UserReportStatus, l: Language) {
  const labels = {
    OPEN: ['Открыта', 'Ашық', 'Open'],
    IN_REVIEW: ['На проверке', 'Тексеруде', 'In review'],
    REJECTED: ['Отклонена', 'Қабылданбады', 'Rejected'],
    RESOLVED: ['Рассмотрена', 'Қаралды', 'Resolved'],
  } as const;
  const index = l === 'ru' ? 0 : l === 'kz' ? 1 : 2;
  return labels[status]?.[index] ?? tx(l, 'Неизвестно', 'Белгісіз', 'Unknown');
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
    setDetailLoading(true);
    setDetailError(null);
    Promise.all([authorizedRequest((token) => getAdminUserReportRequest(selectedId, token))])
      .then(async ([report]) => {
        if (cancelled) return;
        setDetail(report);
        setInvestigation(null);
        try {
          const data = await authorizedRequest((token) =>
            getUserInvestigationRequest(report.target.id, token),
          );
          if (!cancelled) setInvestigation(data);
        } catch (err) {
          if (!cancelled) setDetailError(formatAdminApiError(err, t));
        }
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
    <div className="w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5 max-w-[520px]">
        <Select
          label={tx(language, 'Статус', 'Мәртебе', 'Status')}
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          options={[
            {
              value: 'ALL',
              label: tx(language, 'Все статусы', 'Барлық мәртебелер', 'All statuses'),
            },
            ...statuses.map((status) => ({ value: status, label: statusLabel(status, language) })),
          ]}
        />
        <Select
          label={tx(language, 'Категория', 'Санат', 'Category')}
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setPage(0);
          }}
          options={[
            {
              value: 'ALL',
              label: tx(language, 'Все категории', 'Барлық санаттар', 'All categories'),
            },
            ...categories.map((category) => ({
              value: category,
              label: categoryLabel(category, language),
            })),
          ]}
        />
      </div>
      <FlashBanner flash={flash} />
      {error && (
        <Card className="mb-4 text-[13px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </Card>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(300px,0.9fr)_minmax(0,1.4fr)] gap-5 items-start">
        <div className="flex flex-col gap-2 min-w-0">
          {loading && (
            <p className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('loading')}
            </p>
          )}
          {!loading && items.length === 0 && (
            <Card className="text-[13px]">
              {tx(language, 'Жалоб пока нет.', 'Әзірге шағым жоқ.', 'No user reports yet.')}
            </Card>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedId(item.id)}
              className="text-left rounded-xl p-4 min-w-0 cursor-pointer"
              style={{
                background:
                  selectedId === item.id ? 'var(--eco-brand-50)' : 'var(--eco-surface-raised)',
                border: `1px solid ${selectedId === item.id ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <strong className="text-[15px] break-words" style={{ color: 'var(--eco-text)' }}>
                  {displayPerson(item.target)}
                </strong>
                <Badge variant="default">{statusLabel(item.status, language)}</Badge>
              </div>
              <div
                className="mt-2 text-[12px] break-words"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {categoryLabel(item.category, language)} · {tx(language, 'От', 'Кімнен', 'By')}{' '}
                {displayPerson(item.reporter)}
              </div>
              <div className="mt-1 text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {formatDateTime(item.createdAt, language)}
              </div>
            </button>
          ))}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 text-[12px]">
              <Button
                variant="ghost"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
              >
                {tx(language, 'Назад', 'Артқа', 'Previous')}
              </Button>
              {page + 1}/{totalPages}
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
              >
                {tx(language, 'Далее', 'Келесі', 'Next')}
              </Button>
            </div>
          )}
        </div>
        <div className="flex flex-col gap-4 min-w-0">
          {selectedId == null ? (
            <Card
              className="py-14 text-center text-[13px]"
              style={{ color: 'var(--eco-text-tertiary)' }}
            >
              {tx(
                language,
                'Выберите жалобу для просмотра.',
                'Қарау үшін шағымды таңдаңыз.',
                'Select a report to review.',
              )}
            </Card>
          ) : detailLoading && !detail ? (
            <Card>{t('loading')}</Card>
          ) : detail ? (
            <>
              <Card className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                  <div>
                    <h2
                      className="text-[19px] font-semibold break-words"
                      style={{ color: 'var(--eco-text)' }}
                    >
                      {tx(language, 'Жалоба на', 'Шағым:', 'Report about')}{' '}
                      {detail.target.slug ? `@${detail.target.slug}` : detail.target.displayName}
                    </h2>
                    <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      #{detail.id}
                    </span>
                  </div>
                  <Badge variant="default">{statusLabel(detail.status, language)}</Badge>
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[13px]">
                  <div>
                    <dt style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(language, 'Категория', 'Санат', 'Category')}
                    </dt>
                    <dd>{categoryLabel(detail.category, language)}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(language, 'Заявитель', 'Шағымданушы', 'Reporter')}
                    </dt>
                    <dd>{displayPerson(detail.reporter)}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(language, 'Дата', 'Күні', 'Date')}
                    </dt>
                    <dd>{formatDateTime(detail.createdAt, language)}</dd>
                  </div>
                  <div>
                    <dt style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(language, 'Проверяет', 'Тексеруші', 'Assigned to')}
                    </dt>
                    <dd>
                      {detail.assignedAdmin
                        ? displayPerson(detail.assignedAdmin)
                        : tx(language, 'Не назначен', 'Тағайындалмаған', 'Unassigned')}
                    </dd>
                  </div>
                </dl>
                <Link
                  to={`/admin/users?selected=${detail.target.id}`}
                  className="text-[13px] self-start"
                  style={{ color: 'var(--eco-primary)' }}
                >
                  {tx(
                    language,
                    'Открыть пользователя в админке',
                    'Пайдаланушыны әкімші панелінде ашу',
                    'Open user in admin',
                  )}
                </Link>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={submitting}
                    onClick={() => void assign()}
                  >
                    {tx(language, 'Взять на проверку', 'Тексеруге алу', 'Assign to me')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActionStatus('REJECTED')}>
                    {tx(language, 'Отклонить жалобу', 'Шағымды қабылдамау', 'Reject report')}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setActionStatus('RESOLVED')}>
                    {tx(language, 'Завершить рассмотрение', 'Қарауды аяқтау', 'Resolve report')}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRestrictionUserId(detail.target.id)}
                  >
                    {tx(
                      language,
                      'Заблокировать пользователя',
                      'Пайдаланушыны бұғаттау',
                      'Block user',
                    )}
                  </Button>
                </div>
              </Card>
              <Card>
                <h3 className="text-[15px] font-semibold mb-2">
                  {tx(language, 'Описание жалобы', 'Шағым сипаттамасы', 'Report description')}
                </h3>
                <p
                  className="text-[13px] whitespace-pre-wrap break-words"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  {detail.description}
                </p>
              </Card>
              <Card className="flex flex-col gap-4">
                <h3 className="text-[15px] font-semibold">
                  {tx(language, 'История пользователя', 'Пайдаланушы тарихы', 'User history')}
                </h3>
                {detailError && (
                  <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                    {detailError}
                  </p>
                )}
                {!investigation && !detailError && <p className="text-[12px]">{t('loading')}</p>}
                {investigation && (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-[12px]">
                      {[
                        [
                          tx(language, 'Созданные комнаты', 'Құрылған бөлмелер', 'Owned rooms'),
                          investigation.ownedRooms.length,
                        ],
                        [
                          tx(language, 'Участие в комнатах', 'Бөлмелерге қатысу', 'Memberships'),
                          investigation.memberships.length,
                        ],
                        [tx(language, 'Споры', 'Даулар', 'Disputes'), investigation.disputesCount],
                        [
                          tx(
                            language,
                            'Заявки в поддержку',
                            'Қолдау өтінімдері',
                            'Support tickets',
                          ),
                          investigation.supportTicketsCount,
                        ],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className="rounded-lg p-3"
                          style={{ background: 'var(--eco-surface)' }}
                        >
                          <div style={{ color: 'var(--eco-text-tertiary)' }}>{label}</div>
                          <strong className="text-[17px]" style={{ color: 'var(--eco-text)' }}>
                            {value}
                          </strong>
                        </div>
                      ))}
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {tx(
                        language,
                        'Жалобы на пользователя',
                        'Пайдаланушыға шағымдар',
                        'Reports against user',
                      )}
                      : {investigation.reportsAgainst} ·{' '}
                      {tx(
                        language,
                        'Жалобы пользователя',
                        'Пайдаланушы шағымдары',
                        'Reports by user',
                      )}
                      : {investigation.reportsBy}
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
                    <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {tx(language, 'Недавние события', 'Соңғы оқиғалар', 'Recent events')}
                    </div>
                    {investigation.recentRoomEvents.map((event) => (
                      <div
                        key={event.id}
                        className="text-[12px] flex justify-between gap-3"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        <span>
                          {tx(language, 'Событие комнаты', 'Бөлме оқиғасы', 'Room event')}
                        </span>
                        {event.roomId && (
                          <Link to={`/admin/rooms?selected=${event.roomId}`}>R-{event.roomId}</Link>
                        )}
                        <span>{formatDateTime(event.createdAt, language)}</span>
                      </div>
                    ))}
                    {investigation.recentAdminActions.map((action) => (
                      <div
                        key={action.id}
                        className="text-[12px] flex justify-between gap-3"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        <span>
                          {tx(
                            language,
                            'Действие администратора',
                            'Әкімші әрекеті',
                            'Admin action',
                          )}
                        </span>
                        <span>{formatDateTime(action.createdAt, language)}</span>
                      </div>
                    ))}
                  </>
                )}
              </Card>
            </>
          ) : (
            <Card>{detailError || t('loadFailedTitle')}</Card>
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
            ? tx(language, 'Отклонить жалобу?', 'Шағымды қабылдамау керек пе?', 'Reject report?')
            : tx(language, 'Завершить рассмотрение?', 'Қарауды аяқтау керек пе?', 'Resolve report?')
        }
        subjectLabel={detail ? displayPerson(detail.target) : null}
        destructive={actionStatus === 'REJECTED'}
        submitLabel={tx(language, 'Подтвердить', 'Растау', 'Confirm')}
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
