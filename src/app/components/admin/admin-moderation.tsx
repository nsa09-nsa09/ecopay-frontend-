import { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge } from '../ds-primitives';
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
import { Shield, CheckCircle2, XCircle, ShieldX, UserPlus, RefreshCw } from 'lucide-react';
import { ConfirmActionModal, FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';

type ActionKind = 'CONFIRM' | 'REJECT' | 'BLOCK';

type ActionState = {
  kind: ActionKind;
  item: ModerationQueueItemDto;
};

const localized = (
  language: Language,
  labels: { ru: string; kz: string; en: string },
) => labels[language];

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

  return (
    <AdminLayout>
      <div className="w-full max-w-none">
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
              {t('moderationQueue')}
            </h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('itemsPendingReview', { count: activeQueue.length })}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t('retry')}
          </Button>
        </div>

        <FlashBanner flash={flash} />

        {error && !loading && (
          <Card className="flex flex-col gap-2 mb-4">
            <div className="text-[14px]" style={{ color: 'var(--eco-negative)' }}>
              {t('loadFailedTitle')}
            </div>
            <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {error}
            </div>
            <Button variant="primary" size="sm" onClick={() => void load()}>
              <RefreshCw size={13} /> {t('retry')}
            </Button>
          </Card>
        )}

        {loading && items.length === 0 ? (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-xl"
                style={{
                  background: 'var(--eco-surface-raised)',
                  border: '1px solid var(--eco-border)',
                  minHeight: 80,
                }}
              />
            ))}
          </div>
        ) : activeQueue.length === 0 && !error ? (
          <Card className="text-center py-12">
            <CheckCircle2
              size={28}
              className="mx-auto mb-3"
              style={{ color: 'var(--eco-positive)' }}
            />
            <div className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
              {t('queueClear')}
            </div>
            <div className="text-[13px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('noItemsPendingModeration')}
            </div>
          </Card>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[1180px] flex flex-col gap-3">
              <div
                className="grid grid-cols-[minmax(150px,0.8fr)_minmax(300px,2fr)_minmax(190px,1.1fr)_minmax(90px,0.5fr)_minmax(160px,1fr)_minmax(130px,0.8fr)_minmax(190px,1fr)] gap-4 px-5 py-2 text-[12px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <div>{t('colId')}</div>
                <div>{t('colEntity')}</div>
                <div>{t('reasonCode')}</div>
                <div>{t('colScore')}</div>
                <div>{t('assignedTo')}</div>
                <div>{t('colSubmitted')}</div>
                <div>{t('colActions')}</div>
              </div>

              {activeQueue.map((item) => {
                const score = riskNumeric(item.riskScore);
                const isMine =
                  item.assignedAdminId != null &&
                  user?.id != null &&
                  item.assignedAdminId === user.id;
                const canBlock = item.roomId != null;
                return (
                  <Card key={item.id} className="flex flex-col gap-3">
                    <div className="grid grid-cols-[minmax(150px,0.8fr)_minmax(300px,2fr)_minmax(190px,1.1fr)_minmax(90px,0.5fr)_minmax(160px,1fr)_minmax(130px,0.8fr)_minmax(190px,1fr)] gap-4 items-center">
                      <div
                        className="text-[12px] break-all"
                        style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
                      >
                        MQ-{item.id}
                      </div>
                      <div className="min-w-0">
                        <div
                          className="text-[13px] break-words"
                          style={{ color: 'var(--eco-text)' }}
                        >
                          {t(entityLabelKey(item.entityType))} #{item.entityId}
                        </div>
                        <div
                          className="text-[11px] break-all"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          {item.roomId ? `R-${item.roomId}` : ''}
                          {item.roomMemberId ? ` · M-${item.roomMemberId}` : ''}
                        </div>
                      </div>
                      <div>
                        {item.reasonCode ? (
                          <Badge variant="warning">{reasonCodeLabel(item.reasonCode, language)}</Badge>
                        ) : (
                          <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[14px]" style={{ color: riskColor(score) }}>
                          {score ?? '—'}
                        </span>
                      </div>
                      <div
                        className="text-[12px]"
                        style={{ color: 'var(--eco-text-secondary)' }}
                      >
                        {item.assignedAdminId
                          ? isMine
                            ? t('meLabel')
                            : `#${item.assignedAdminId}`
                          : t('unassigned')}
                      </div>
                      <div
                        className="text-[11px]"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        {formatDate(item.createdAt, language)}
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {!isMine && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={busyAssignId === item.id}
                            onClick={() => void handleAssign(item)}
                            title={t('assignToMe')}
                          >
                            <UserPlus size={12} />
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => openAction('CONFIRM', item)}
                          title={t('confirmLabel')}
                        >
                          <CheckCircle2 size={12} />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openAction('REJECT', item)}
                          title={t('rejectLabel')}
                        >
                          <XCircle size={12} />
                        </Button>
                        {canBlock && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openAction('BLOCK', item)}
                            title={t('blockRoomShort')}
                          >
                            <ShieldX size={12} />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div
                      className="flex items-center gap-2 text-[11px]"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      <Shield size={11} />
                      {t('colStatus')}: {moderationStatusLabel(item.status, language)}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

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
      </div>
    </AdminLayout>
  );
}
