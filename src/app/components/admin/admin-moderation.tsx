import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Badge } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDate } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import {
  ApiError,
  assignModerationItemRequest,
  blockRoomRequest,
  confirmModerationItemRequest,
  getModerationQueueRequest,
  rejectModerationItemRequest,
  type ModerationQueueItemDto,
} from '../../lib/api';
import { CheckCircle2, XCircle, ShieldX, UserPlus } from 'lucide-react';
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import { AdminUserReports } from './admin-user-reports';
import {
  AdminCard,
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminId,
  AdminPage,
  AdminPageHeader,
  AdminRefreshButton,
  AdminStatusBadge,
  AdminTabs,
  type AdminColumn,
} from './admin-ui';

type ActionKind = 'CONFIRM' | 'REJECT' | 'BLOCK';

type ActionState = {
  kind: ActionKind;
  item: ModerationQueueItemDto;
};

const localized = (language: Language, labels: { ru: string; kz: string; en: string }) =>
  labels[language];

function moderationStatusLabel(status: string | null | undefined, language: Language) {
  if (!status) return localized(language, { ru: 'Не указан', kz: 'Көрсетілмеген', en: 'Not set' });
  const labels: Record<string, { ru: string; kz: string; en: string }> = {
    OPEN: { ru: 'Открыта', kz: 'Ашық', en: 'Open' },
    IN_REVIEW: { ru: 'На проверке', kz: 'Тексеруде', en: 'In review' },
    RESOLVED: { ru: 'Решена', kz: 'Шешілді', en: 'Resolved' },
    REJECTED: { ru: 'Отклонена', kz: 'Қабылданбады', en: 'Rejected' },
  };
  return labels[status]?.[language] ?? status.replace(/_/g, ' ');
}

function reasonCodeLabel(code: string | null | undefined, language: Language) {
  if (!code) return localized(language, { ru: 'Не указана', kz: 'Көрсетілмеген', en: 'Not set' });
  const labels: Record<string, { ru: string; kz: string; en: string }> = {
    ADMIN_REQUIRED: {
      ru: 'Нужна проверка администратора',
      kz: 'Әкімші тексеруі қажет',
      en: 'Admin review required',
    },
    INVALID_IDENTIFIER: {
      ru: 'Некорректные данные подключения',
      kz: 'Қосылу деректері дұрыс емес',
      en: 'Invalid connection details',
    },
    OPEN_DISPUTE: { ru: 'Есть открытый спор', kz: 'Ашық дау бар', en: 'Open dispute' },
    SUPPORT_TICKET: {
      ru: 'Есть обращение в поддержку',
      kz: 'Қолдау өтініші бар',
      en: 'Support ticket',
    },
    RISK_REVIEW: { ru: 'Риск-проверка', kz: 'Тәуекелді тексеру', en: 'Risk review' },
    PENDING_TIMEOUT: {
      ru: 'Таймаут ожидания',
      kz: 'Күту уақыты аяқталды',
      en: 'Pending timeout',
    },
    ACCESS_ISSUE: {
      ru: 'Проблема с доступом',
      kz: 'Қолжетімділік мәселесі',
      en: 'Access issue',
    },
  };
  return labels[code]?.[language] ?? code.replace(/_/g, ' ').toLowerCase();
}

function riskNumeric(value: number | string | null | undefined): number | null {
  if (value == null) return null;
  const n = typeof value === 'string' ? Number(value) : value;
  return Number.isNaN(n) ? null : n;
}

function riskColor(score: number | null) {
  if (score == null) return 'var(--eco-text-tertiary)';
  if (score >= 70) return 'var(--eco-negative)';
  if (score >= 40) return 'var(--eco-warning)';
  return 'var(--eco-positive)';
}

function entityLabelKey(type: string): string {
  const t = type.toUpperCase();
  if (t.includes('ROOM_MEMBER') || t === 'MEMBER') return 'moderationItemMember';
  if (t.includes('ROOM')) return 'moderationItemRoom';
  return 'moderationItemUnknown';
}

export function AdminModerationPage() {
  const { t, language } = useI18n();
  const { authorizedRequest, user } = useAuth();
  const [tab, setTab] = useState<'QUEUE' | 'REPORTS'>('QUEUE');

  const [items, setItems] = useState<ModerationQueueItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [action, setAction] = useState<ActionState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAssignId, setBusyAssignId] = useState<number | null>(null);

  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => getModerationQueueRequest(token));
      setItems(data);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyUpdate = (updated: ModerationQueueItemDto) => {
    setItems((prev) => prev.map((it) => (it.id === updated.id ? updated : it)));
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleAssign = async (item: ModerationQueueItemDto) => {
    setBusyAssignId(item.id);
    try {
      const updated = await authorizedRequest((token) =>
        assignModerationItemRequest(item.id, token),
      );
      applyUpdate(updated);
      showFlash('success', t('actionCompletedAndLogged'));
    } catch (err) {
      showFlash('error', formatAdminApiError(err, t));
    } finally {
      setBusyAssignId(null);
    }
  };

  const openAction = (kind: ActionKind, item: ModerationQueueItemDto) => {
    setAction({ kind, item });
    setActionError(null);
  };

  const closeAction = () => {
    setAction(null);
    setActionError(null);
  };

  const submitAction = async (reason: string) => {
    if (!action) return;
    setSubmitting(true);
    setActionError(null);
    try {
      if (action.kind === 'CONFIRM') {
        const updated = await authorizedRequest((token) =>
          confirmModerationItemRequest(action.item.id, reason, token),
        );
        applyUpdate(updated);
        // Resolved items leave the active queue.
        if (updated.status && updated.status !== 'OPEN' && updated.status !== 'IN_REVIEW') {
          removeItem(updated.id);
        }
      } else if (action.kind === 'REJECT') {
        const updated = await authorizedRequest((token) =>
          rejectModerationItemRequest(action.item.id, reason, token),
        );
        applyUpdate(updated);
        if (updated.status && updated.status !== 'OPEN' && updated.status !== 'IN_REVIEW') {
          removeItem(updated.id);
        }
      } else if (action.kind === 'BLOCK') {
        if (!action.item.roomId) {
          throw new ApiError(400, t('loadFailedTitle'));
        }
        await authorizedRequest((token) => blockRoomRequest(action.item.roomId!, reason, token));
        // Block doesn't return the item; reload list so derived status reflects reality.
        await load();
      }
      showFlash('success', t('actionCompletedAndLogged'));
      closeAction();
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const activeQueue = useMemo(
    () => items.filter((it) => !it.status || it.status === 'OPEN' || it.status === 'IN_REVIEW'),
    [items],
  );

  const actionTitle = useMemo(() => {
    if (!action) return '';
    if (action.kind === 'CONFIRM') return t('confirmModerationTitle');
    if (action.kind === 'REJECT') return t('rejectModerationTitle');
    return t('blockRoomTitle');
  }, [action, t]);

  const actionDescription = useMemo(() => {
    if (!action) return null;
    if (action.kind === 'CONFIRM') return t('confirmModerationItem');
    if (action.kind === 'REJECT') return t('rejectModerationItem');
    return t('blockRoomConfirm');
  }, [action, t]);

  const submitLabel = useMemo(() => {
    if (!action) return '';
    if (action.kind === 'CONFIRM') return t('confirmLabel');
    if (action.kind === 'REJECT') return t('rejectLabel');
    return t('blockRoomShort');
  }, [action, t]);

  const tabs = (
    <AdminTabs<'QUEUE' | 'REPORTS'>
      tabs={[
        { id: 'QUEUE', label: t('moderationQueue'), count: activeQueue.length },
        { id: 'REPORTS', label: t('adminUserReportsTitle') },
      ]}
      active={tab}
      onChange={setTab}
    />
  );

  if (tab === 'REPORTS')
    return (
      <AdminLayout>
        <AdminPage width="full">
          <AdminPageHeader title={t('adminUserReportsTitle')} />
          {tabs}
          <AdminUserReports />
        </AdminPage>
      </AdminLayout>
    );

  const columns: AdminColumn<ModerationQueueItemDto>[] = [
    {
      id: 'entity',
      header: t('colEntity'),
      priority: 'primary',
      minWidth: 220,
      cell: (item) => (
        <div className="min-w-0">
          <div className="text-[13px] break-words" style={{ color: 'var(--eco-text)' }}>
            {t(entityLabelKey(item.entityType))} #{item.entityId}
          </div>
          {(item.roomId || item.roomMemberId) && (
            <div className="text-[12px] break-all" style={{ color: 'var(--eco-text-tertiary)' }}>
              {item.roomId ? `R-${item.roomId}` : ''}
              {item.roomMemberId ? ` · M-${item.roomMemberId}` : ''}
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'score',
      header: t('colScore'),
      priority: 'primary',
      numeric: true,
      width: 90,
      cell: (item) => {
        const score = riskNumeric(item.riskScore);
        return (
          <span className="text-[13px] font-semibold" style={{ color: riskColor(score) }}>
            {score ?? '—'}
          </span>
        );
      },
    },
    {
      id: 'id',
      header: t('colId'),
      priority: 'secondary',
      nowrap: true,
      cell: (item) => <AdminId>MQ-{item.id}</AdminId>,
    },
    {
      id: 'reason',
      header: t('reasonCode'),
      minWidth: 170,
      cell: (item) =>
        item.reasonCode ? (
          <Badge variant="warning">{reasonCodeLabel(item.reasonCode, language)}</Badge>
        ) : (
          <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>
        ),
    },
    {
      id: 'status',
      header: t('colStatus'),
      nowrap: true,
      cell: (item) => (
        <AdminStatusBadge status={item.status}>
          {moderationStatusLabel(item.status, language)}
        </AdminStatusBadge>
      ),
    },
    {
      id: 'assigned',
      header: t('assignedTo'),
      nowrap: true,
      cell: (item) => {
        const isMine =
          item.assignedAdminId != null && user?.id != null && item.assignedAdminId === user.id;
        return (
          <span style={{ color: 'var(--eco-text-secondary)' }}>
            {item.assignedAdminId
              ? isMine
                ? t('meLabel')
                : `#${item.assignedAdminId}`
              : t('unassigned')}
          </span>
        );
      },
    },
    {
      id: 'submitted',
      header: t('colSubmitted'),
      nowrap: true,
      cell: (item) => (
        <span className="tabular-nums" style={{ color: 'var(--eco-text-secondary)' }}>
          {formatDate(item.createdAt, language)}
        </span>
      ),
    },
    {
      id: 'actions',
      header: t('colActions'),
      priority: 'actions',
      align: 'right',
      nowrap: true,
      cell: (item) => {
        const isMine =
          item.assignedAdminId != null && user?.id != null && item.assignedAdminId === user.id;
        const canBlock = item.roomId != null;
        return (
          <div className="inline-flex gap-1.5 flex-wrap justify-end">
            {!isMine && (
              <Button
                variant="secondary"
                size="sm"
                loading={busyAssignId === item.id || undefined}
                onClick={() => void handleAssign(item)}
                title={t('assignToMe')}
                aria-label={t('assignToMe')}
              >
                <UserPlus size={13} aria-hidden />
              </Button>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={() => openAction('CONFIRM', item)}
              title={t('confirmLabel')}
              aria-label={t('confirmLabel')}
            >
              <CheckCircle2 size={13} aria-hidden />
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => openAction('REJECT', item)}
              title={t('rejectLabel')}
              aria-label={t('rejectLabel')}
            >
              <XCircle size={13} aria-hidden />
            </Button>
            {canBlock && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => openAction('BLOCK', item)}
                title={t('blockRoomShort')}
                aria-label={t('blockRoomShort')}
              >
                <ShieldX size={13} aria-hidden />
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <AdminLayout>
      <AdminPage width="full">
        <AdminPageHeader
          title={t('moderationQueue')}
          subtitle={t('itemsPendingReview', { count: activeQueue.length })}
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />

        {tabs}

        <FlashBanner flash={flash} />

        {error && !loading && activeQueue.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        <AdminDataTable
          columns={columns}
          rows={activeQueue}
          rowKey={(item) => item.id}
          loading={loading}
          error={error}
          onRetry={() => void load()}
          minWidth={1100}
          skeletonRows={4}
          empty={
            <AdminCard>
              <AdminEmptyState
                icon={CheckCircle2}
                title={t('queueClear')}
                description={t('noItemsPendingModeration')}
              />
            </AdminCard>
          }
        />

        <ConfirmActionModal
          open={!!action}
          onClose={closeAction}
          title={actionTitle}
          description={actionDescription}
          subjectLabel={
            action ? (
              <>
                <div style={{ color: 'var(--eco-text-tertiary)' }}>{t('colEntity')}</div>
                <div style={{ color: 'var(--eco-text)' }}>
                  {t(entityLabelKey(action.item.entityType))} #{action.item.entityId}
                  {action.item.roomId ? ` · R-${action.item.roomId}` : ''}
                </div>
              </>
            ) : null
          }
          destructive={action?.kind !== 'CONFIRM'}
          submitLabel={submitLabel}
          submitting={submitting}
          errorMessage={actionError}
          onConfirm={submitAction}
        />
      </AdminPage>
    </AdminLayout>
  );
}
