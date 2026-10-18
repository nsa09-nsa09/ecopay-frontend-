import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ClipboardList, Scale, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Card, Input, Modal, Select } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { formatDateTime } from '../../lib/datetime';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import {
  AdminTabs,
  type AdminTabItem,
} from './admin-ui';
import {
  ApiError,
  getAdminRefundRequestsRequest,
  approveRefundClaimRequest,
  rejectRefundClaimRequest,
  getAdminDisputesRequest,
  getRefundsByDisputeRequest,
  markRefundFailRequest,
  type RefundRequestResponse,
  type RefundRequestStatus,
  type RefundReasonCode,
  type DisputeResponse,
  type RefundTransactionResponse,
} from '../../lib/api';

type RefundsTab = 'claims' | 'disputes';
const PAGE_SIZE = 20;

const REASON_CODE_I18N: Record<RefundReasonCode, string> = {
  ACCESS_NOT_PROVIDED: 'refundReasonAccessNotProvided',
  ACCESS_NOT_WORKING: 'refundReasonAccessNotWorking',
  ACCESS_REVOKED: 'refundReasonAccessRevoked',
  MATERIAL_MISMATCH: 'refundReasonMaterialMismatch',
  DUPLICATE_CHARGE: 'refundReasonDuplicateCharge',
  WRONG_AMOUNT: 'refundReasonWrongAmount',
  UNAUTHORIZED_PAYMENT: 'refundReasonUnauthorizedPayment',
  OTHER: 'refundReasonOther',
};

const STATUS_I18N: Record<RefundRequestStatus, string> = {
  REQUESTED: 'refundClaimStatusRequested',
  UNDER_REVIEW: 'refundClaimStatusUnderReview',
  APPROVED: 'refundClaimStatusApproved',
  REJECTED: 'refundClaimStatusRejected',
};

const STATUS_VARIANT: Record<RefundRequestStatus, 'warning' | 'default' | 'success' | 'danger'> = {
  REQUESTED: 'warning',
  UNDER_REVIEW: 'default',
  APPROVED: 'success',
  REJECTED: 'danger',
};

function formatMoney(amount: number | string | null | undefined): string {
  if (amount == null) return '-';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (!Number.isFinite(num)) return String(amount);
  return `₸${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(num)}`;
}

export function AdminRefundsPage() {
  const { t, language } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = (searchParams.get('tab') === 'disputes' ? 'disputes' : 'claims') as RefundsTab;

  const setTab = (next: RefundsTab) => {
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    params.delete('status');
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const tabs: AdminTabItem<RefundsTab>[] = useMemo(
    () => [
      { id: 'claims', label: t('adminRefundClaimsTab'), icon: ClipboardList },
      { id: 'disputes', label: t('adminRefundDisputeTab'), icon: Scale },
    ],
    [t],
  );

  return (
    <AdminLayout>
      <div className="max-w-[1280px]">
        <div
          className="pb-5 mb-6 border-b flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'var(--eco-border)' }}
        >
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)', fontWeight: 500 }}>
            {t('adminRefundRequests')}
          </h1>
        </div>

        <AdminTabs tabs={tabs} active={tab} onChange={setTab} />

        <div className="mt-4">
          {tab === 'claims' ? <ClaimsTab language={language} /> : <DisputeRefundsTab language={language} />}
        </div>
      </div>
    </AdminLayout>
  );
}

// ─── Tab 1: Refund claims ────────────────────────────────────────────────────

function ClaimsTab({ language }: { language: 'ru' | 'kz' | 'en' }) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<RefundRequestResponse[]>([]);
  const [page, setPage] = useState(() => {
    const p = searchParams.get('page');
    return p ? Math.max(0, parseInt(p, 10) || 0) : 0;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatusState] = useState(() => {
    const s = (searchParams.get('status') ?? '').toUpperCase();
    return /^[A-Z_]{1,40}$/.test(s) ? s : '';
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { flash, show: showFlash } = useFlash();

  const [actionTarget, setActionTarget] = useState<RefundRequestResponse | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject'>('approve');

  const setStatus = (next: string) => {
    setStatusState(next);
    setPage(0);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('status', next);
    else params.delete('status');
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const statusOptions = useMemo(
    () => [
      { value: '', label: t('financeFilterAll') },
      ...(['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'] as const).map((s) => ({
        value: s,
        label: t(STATUS_I18N[s]),
      })),
    ],
    [t],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminRefundRequestsRequest(token, { status: status || undefined, page, size: PAGE_SIZE }),
      );
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, status, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const openAction = (item: RefundRequestResponse, type: 'approve' | 'reject') => {
    setActionTarget(item);
    setActionType(type);
  };

  const handleDone = (updated: RefundRequestResponse) => {
    setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    setActionTarget(null);
    showFlash('success', actionType === 'approve' ? t('adminRefundApprove') : t('adminRefundReject'));
  };

  return (
    <>
      <Card className="mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="max-w-[280px]">
            <Select
              label={t('financeFilterStatus')}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
            />
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t('retry')}
          </Button>
        </div>
      </Card>

      <FlashBanner flash={flash} />

      {error && (
        <Card className="flex flex-col gap-2 mb-4">
          <div className="text-[14px]" style={{ color: 'var(--eco-negative)' }}>
            {t('loadFailedTitle')}
          </div>
          <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {error}
          </div>
        </Card>
      )}

      {loading && items.length === 0 && (
        <Card className="text-[13px] py-10" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('financeOpsLoading')}
        </Card>
      )}

      {!loading && items.length === 0 && !error && (
        <Card className="text-center text-[13px] py-10">
          <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('financeOpsEmpty')}</span>
        </Card>
      )}

      {items.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{ background: 'var(--eco-surface-raised)', border: '1px solid var(--eco-border)' }}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <Th>ID</Th>
                  <Th>{t('adminRefundColRequester')}</Th>
                  <Th>{t('adminRefundColRoom')}</Th>
                  <Th>{t('adminRefundColReason')}</Th>
                  <Th className="text-right">{t('adminRefundColCharged')}</Th>
                  <Th className="text-right">{t('adminRefundColRefunded')}</Th>
                  <Th className="text-right">{t('adminRefundColAvailable')}</Th>
                  <Th>{t('financeColStatus')}</Th>
                  <Th>{t('financeColAction')}</Th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <Td>
                      <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--eco-text-tertiary)' }}>
                        #{item.id}
                      </span>
                      <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {formatDateTime(item.createdAt, language)}
                      </div>
                    </Td>
                    <Td>
                      {item.requester ? (
                        <Link
                          to={`/admin/users?selected=${item.requester.id}`}
                          style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                        >
                          {item.requester.displayName}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--eco-text-tertiary)' }}>-</span>
                      )}
                    </Td>
                    <Td>
                      {item.roomId != null ? (
                        <Link
                          to={`/admin/rooms?selected=${item.roomId}`}
                          style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                        >
                          {item.roomTitle ? `R-${item.roomId} · ${item.roomTitle}` : `R-${item.roomId}`}
                        </Link>
                      ) : (
                        <span style={{ color: 'var(--eco-text-tertiary)' }}>-</span>
                      )}
                    </Td>
                    <Td>
                      <div>{t(REASON_CODE_I18N[item.reasonCode])}</div>
                      {item.description && (
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: 'var(--eco-text-tertiary)', maxWidth: 220, overflowWrap: 'anywhere' }}
                        >
                          {item.description}
                        </div>
                      )}
                    </Td>
                    <Td className="text-right tabular-nums">{formatMoney(item.chargedAmountKzt)}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(item.refundedAmountKzt)}</Td>
                    <Td className="text-right tabular-nums">{formatMoney(item.refundableAmountKzt)}</Td>
                    <Td>
                      <Badge variant={STATUS_VARIANT[item.status]}>{t(STATUS_I18N[item.status])}</Badge>
                      {item.decisionNote && (
                        <div
                          className="text-[11px] mt-0.5"
                          style={{ color: 'var(--eco-text-tertiary)', maxWidth: 180, overflowWrap: 'anywhere' }}
                        >
                          {item.decisionNote}
                        </div>
                      )}
                    </Td>
                    <Td>
                      {(item.status === 'REQUESTED' || item.status === 'UNDER_REVIEW') ? (
                        <div className="flex gap-1">
                          <Button variant="primary" size="sm" onClick={() => openAction(item, 'approve')}>
                            {t('adminRefundApprove')}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => openAction(item, 'reject')}>
                            {t('adminRefundReject')}
                          </Button>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--eco-text-tertiary)' }}>-</span>
                      )}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {items.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-[12px]">
          <Button variant="ghost" size="sm" disabled={page <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft size={12} /> {t('prevPage')}
          </Button>
          <span style={{ color: 'var(--eco-text-tertiary)' }}>
            {t('pageOf', { page: page + 1, total: totalPages })}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1 || loading} onClick={() => setPage((p) => p + 1)}>
            {t('nextPage')} <ChevronRight size={12} />
          </Button>
        </div>
      )}

      <ClaimActionModal
        target={actionTarget}
        type={actionType}
        language={language}
        onClose={() => setActionTarget(null)}
        onDone={handleDone}
      />
    </>
  );
}

// ─── Approve / Reject modal ──────────────────────────────────────────────────

function ClaimActionModal({
  target,
  type,
  language,
  onClose,
  onDone,
}: {
  target: RefundRequestResponse | null;
  type: 'approve' | 'reject';
  language: 'ru' | 'kz' | 'en';
  onClose: () => void;
  onDone: (updated: RefundRequestResponse) => void;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setNote('');
    setAmount('');
    setError(null);
  }, [target]);

  if (!target) return null;

  const noteTrimmed = note.trim();
  const canSubmit = noteTrimmed.length > 0 && !submitting;

  const submit = async () => {
    if (!noteTrimmed) {
      setError(t('adminRefundNoteRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let updated: RefundRequestResponse;
      if (type === 'approve') {
        const parsedAmount = amount.trim() ? Number(amount.trim()) : undefined;
        updated = await authorizedRequest((token) =>
          approveRefundClaimRequest(target.id, { amount: parsedAmount, decisionNote: noteTrimmed }, token),
        );
      } else {
        updated = await authorizedRequest((token) =>
          rejectRefundClaimRequest(target.id, { decisionNote: noteTrimmed }, token),
        );
      }
      onDone(updated);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={type === 'approve' ? t('adminRefundApprove') : t('adminRefundReject')}
    >
      <div className="flex flex-col gap-4">
        <div
          className="p-3 rounded-lg text-[12px] flex flex-col gap-1"
          style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
        >
          <div>
            <span style={{ fontFamily: 'monospace', color: 'var(--eco-text-tertiary)' }}>#{target.id}</span>
            {' · '}
            {target.requester?.displayName ?? '-'}
          </div>
          <div>{t(REASON_CODE_I18N[target.reasonCode])}</div>
          <div className="flex gap-4 mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
            <span>{t('adminRefundColCharged')}: {formatMoney(target.chargedAmountKzt)}</span>
            <span>{t('adminRefundColAvailable')}: {formatMoney(target.refundableAmountKzt)}</span>
          </div>
        </div>

        {type === 'approve' && (
          <Input
            label={t('adminRefundAmountLabel')}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
            {t('adminRefundNoteLabel')} <span style={{ color: 'var(--eco-negative)' }}>*</span>
          </label>
          <textarea
            rows={3}
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
            }}
          />
        </div>

        {error && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <Button variant="ghost" size="sm" disabled={submitting} onClick={onClose}>
            {t('cancel')}
          </Button>
          <Button
            variant={type === 'approve' ? 'primary' : 'destructive'}
            size="sm"
            disabled={!canSubmit}
            loading={submitting}
            onClick={() => void submit()}
          >
            {type === 'approve' ? t('adminRefundApprove') : t('adminRefundReject')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Tab 2: Dispute refunds (from disputes page) ────────────────────────────

function DisputeRefundsTab({ language }: { language: 'ru' | 'kz' | 'en' }) {
  const { t } = useI18n();
  const tx = (ru: string, kz: string, en: string) =>
    language === 'ru' ? ru : language === 'kz' ? kz : en;
  const { authorizedRequest } = useAuth();
  const { flash, show: showFlash } = useFlash();

  const [disputes, setDisputes] = useState<DisputeResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminDisputesRequest(token, { status: 'RESOLVED', page, size: PAGE_SIZE }),
      );
      setDisputes(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <FlashBanner flash={flash} />

      <div className="flex items-center justify-between mb-4">
        <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(
            'Решённые споры с возвратами',
            'Қайтарулары бар шешілген даулар',
            'Resolved disputes with refunds',
          )}
        </p>
        <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={13} /> {t('retry')}
        </Button>
      </div>

      {error && (
        <Card className="flex flex-col gap-2 mb-4">
          <div className="text-[14px]" style={{ color: 'var(--eco-negative)' }}>
            {t('loadFailedTitle')}
          </div>
          <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {error}
          </div>
        </Card>
      )}

      {loading && disputes.length === 0 && (
        <Card className="text-[13px] py-10" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('financeOpsLoading')}
        </Card>
      )}

      {!loading && disputes.length === 0 && !error && (
        <Card className="text-center text-[13px] py-10">
          <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('financeOpsEmpty')}</span>
        </Card>
      )}

      {disputes.length > 0 && (
        <div className="flex flex-col gap-3">
          {disputes.map((d) => (
            <Card key={d.id}>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--eco-text-tertiary)' }}>
                    D-{d.id}
                  </span>
                  <span className="ml-2 text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {d.roomTitle ?? `R-${d.roomId}`}
                  </span>
                </div>
                <Badge variant={d.refundTriggered ? 'success' : 'default'}>
                  {d.refundTriggered
                    ? tx('Возврат создан', 'Қайтару жасалды', 'Refund triggered')
                    : tx('Без возврата', 'Қайтарусыз', 'No refund')}
                </Badge>
              </div>
              {d.decisionComment && (
                <div className="text-[12px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>
                  {d.decisionComment}
                </div>
              )}
              <div className="text-[11px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                {formatDateTime(d.resolvedAt ?? d.createdAt, language)}
              </div>
              {d.refundTriggered && (
                <div className="mt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === d.id ? null : d.id)}
                  >
                    {expandedId === d.id
                      ? tx('Скрыть возвраты', 'Қайтаруларды жасыру', 'Hide refunds')
                      : tx('Показать возвраты', 'Қайтаруларды көрсету', 'Show refunds')}
                  </Button>
                  {expandedId === d.id && (
                    <DisputeRefundsList disputeId={d.id} language={language} />
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {disputes.length > 0 && (
        <div className="flex items-center justify-between mt-4 text-[12px]">
          <Button variant="ghost" size="sm" disabled={page <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
            <ChevronLeft size={12} /> {t('prevPage')}
          </Button>
          <span style={{ color: 'var(--eco-text-tertiary)' }}>
            {t('pageOf', { page: page + 1, total: totalPages })}
          </span>
          <Button variant="ghost" size="sm" disabled={page >= totalPages - 1 || loading} onClick={() => setPage((p) => p + 1)}>
            {t('nextPage')} <ChevronRight size={12} />
          </Button>
        </div>
      )}
    </>
  );
}

function DisputeRefundsList({ disputeId, language }: { disputeId: number; language: 'ru' | 'kz' | 'en' }) {
  const { t } = useI18n();
  const tx = (ru: string, kz: string, en: string) =>
    language === 'ru' ? ru : language === 'kz' ? kz : en;
  const { authorizedRequest } = useAuth();

  const [refunds, setRefunds] = useState<RefundTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await authorizedRequest((token) => getRefundsByDisputeRequest(disputeId, token));
      setRefunds(list);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, disputeId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="text-[12px] py-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        {t('financeOpsLoading')}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[12px] py-2" style={{ color: 'var(--eco-negative)' }}>
        {error}
      </div>
    );
  }

  if (refunds.length === 0) {
    return (
      <div className="text-[12px] py-2" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx('Нет возвратов', 'Қайтарулар жоқ', 'No refunds')}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 mt-2">
      {refunds.map((r) => (
        <div
          key={r.id}
          className="p-2 rounded-lg text-[12px] flex items-center justify-between gap-2"
          style={{ background: 'var(--eco-surface)' }}
        >
          <div>
            <span style={{ fontFamily: 'monospace', color: 'var(--eco-text-tertiary)' }}>R-{r.id}</span>
            <span className="ml-2 font-semibold tabular-nums">
              {r.amount} {r.currency ?? ''}
            </span>
            {r.paymentTransactionId && (
              <span className="ml-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                · tx #{r.paymentTransactionId}
              </span>
            )}
          </div>
          <Badge variant={r.status === 'SUCCESS' ? 'success' : r.status === 'FAILED' ? 'danger' : 'default'}>
            {r.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

// ─── Shared table primitives ─────────────────────────────────────────────────

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-left text-[11px] uppercase ${className ?? ''}`}
      style={{ color: 'var(--eco-text-tertiary)', letterSpacing: '0.08em', fontWeight: 600 }}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td
      className={`px-3 py-2 align-top ${className ?? ''}`}
      style={{ color: 'var(--eco-text)', borderTop: '1px solid var(--eco-border)' }}
    >
      {children}
    </td>
  );
}
