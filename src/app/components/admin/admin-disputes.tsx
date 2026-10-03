import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Modal, Select, Skeleton } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import {
  applyOwnerViolationSanctionRequest,
  assignDisputeToMeRequest,
  decideDisputeRequest,
  getAdminDisputesRequest,
  getRefundsByDisputeRequest,
  markRefundFailRequest,
  markRefundSuccessRequest,
  type DisputeResponse,
  type RefundTransactionResponse,
} from '../../lib/api';
import {
  RefreshCw,
  MousePointerClick,
  Shield,
  UserPlus,
  Scale,
  AlertTriangle,
  Banknote,
  Check,
  X,
} from 'lucide-react';
import { FlashBanner, formatAdminApiError, useFlash, REASON_MIN_LENGTH } from './admin-action-ui';
import {
  AdminCard,
  AdminEmptyState,
  AdminErrorState,
  AdminField,
  AdminId,
  AdminListSkeleton,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
  AdminStatusBadge,
} from './admin-ui';

const PAGE_SIZE = 20;

export function AdminDisputesPage() {
  const { t, language } = useI18n();
  const { authorizedRequest, user } = useAuth();

  const [items, setItems] = useState<DisputeResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<string>('FAVOR_MEMBER');
  const [decisionComment, setDecisionComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const { flash, show: showFlash } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getAdminDisputesRequest(token, { page, size: PAGE_SIZE }),
      );
      setItems(result.items);
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

  const selected = useMemo(
    () => items.find((d) => d.id === selectedId) ?? null,
    [items, selectedId],
  );

  const applyUpdate = (updated: DisputeResponse) => {
    setItems((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
  };

  const handleAssignToMe = async () => {
    if (!selected) return;
    setAssignSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        assignDisputeToMeRequest(selected.id, token),
      );
      applyUpdate(updated);
      showFlash('success', t('actionCompletedAndLogged'));
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleDecide = async () => {
    if (!selected || decisionComment.trim().length < REASON_MIN_LENGTH) return;
    setSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        decideDisputeRequest(
          selected.id,
          {
            status: decisionType === 'FAVOR_MEMBER' ? 'RESOLVED' : 'REJECTED',
            decision: decisionType,
            comment: decisionComment.trim(),
          },
          token,
        ),
      );
      applyUpdate(updated);
      showFlash('success', t('actionCompletedAndLogged'));
      setDecisionModalOpen(false);
      setDecisionComment('');
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  const decisionOptions = [
    { value: 'FAVOR_MEMBER', label: t('decisionFavorMember') },
    { value: 'FAVOR_OWNER', label: t('decisionFavorOwner') },
    { value: 'REJECTED', label: t('decisionRejected') },
  ];

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          title={t('disputesPageTitle')}
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />

        <FlashBanner flash={flash} />

        {error && !loading && items.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 flex flex-col gap-2 min-w-0">
            {loading && items.length === 0 && <AdminListSkeleton rows={4} height={76} />}
            {!loading && error && items.length === 0 && (
              <AdminCard>
                <AdminErrorState message={error} onRetry={() => void load()} />
              </AdminCard>
            )}
            {!loading && !error && items.length === 0 && (
              <AdminCard>
                <AdminEmptyState
                  icon={Scale}
                  title={t('emptyDisputes')}
                  description={t('adminDisputesEmptyHint')}
                  compact
                />
              </AdminCard>
            )}
            {items.map((d) => {
              const active = selectedId === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setSelectedId(d.id)}
                  aria-pressed={active}
                  className={`eco-admin-record is-clickable text-left px-4 py-3 rounded-xl ${active ? 'is-active' : ''}`}
                  style={{ minHeight: 76 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <AdminId>D-{d.id}</AdminId>
                    <AdminStatusBadge status={d.status}>{d.status}</AdminStatusBadge>
                  </div>
                  <div
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {d.roomId ? `${t('rooms')} #${d.roomId}` : '—'}
                  </div>
                  <div
                    className="text-[12px] tabular-nums"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    {formatDateTime(d.createdAt, language)}
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
            {!selected ? (
              <AdminCard>
                <AdminEmptyState icon={MousePointerClick} title={t('selectDispute')} />
              </AdminCard>
            ) : (
              <div className="flex flex-col gap-4">
                <AdminCard
                  title={
                    <span className="break-words">
                      D-{selected.id}
                      {selected.roomId ? ` · ${t('rooms')} #${selected.roomId}` : ''}
                    </span>
                  }
                  description={
                    <>
                      {selected.ticketId
                        ? `${t('fromTicket', { ticket: selected.ticketId })} · `
                        : ''}
                      {t('createdLabel')}{' '}
                      <span className="tabular-nums">
                        {formatDateTime(selected.createdAt, language)}
                      </span>
                    </>
                  }
                  actions={
                    <AdminStatusBadge status={selected.status}>{selected.status}</AdminStatusBadge>
                  }
                  footer={
                    selected.status !== 'RESOLVED' && selected.status !== 'REJECTED' ? (
                      <>
                        {(!selected.assignedAdminId || selected.assignedAdminId !== user?.id) && (
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={assignSubmitting}
                            onClick={() => void handleAssignToMe()}
                          >
                            <UserPlus size={13} /> {t('assignToMe')}
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setDecisionModalOpen(true)}
                        >
                          <Scale size={13} /> {t('decision')}
                        </Button>
                        <OwnerViolationButton
                          dispute={selected}
                          onApplied={(updated) => {
                            applyUpdate(updated);
                            showFlash('success', t('actionCompletedAndLogged'));
                          }}
                        />
                      </>
                    ) : undefined
                  }
                >
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('claimant')}>
                          #{selected.openedByUserId ?? '—'}
                        </AdminField>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('assignToMe')}>
                          {selected.assignedAdminId ? `#${selected.assignedAdminId}` : '—'}
                        </AdminField>
                      </div>
                    </div>

                    {selected.description && (
                      <AdminField label={t('summaryLabel')}>
                        <span style={{ color: 'var(--eco-text-secondary)' }}>
                          {selected.description}
                        </span>
                      </AdminField>
                    )}

                    {selected.reasonCode && (
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('adminComplaintReason')}>
                          {selected.reasonCode.replace(/_/g, ' ')}
                        </AdminField>
                      </div>
                    )}

                    {selected.decision && (
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('decision')}>{selected.decision}</AdminField>
                        {selected.decisionComment && (
                          <div
                            className="text-[12px] mt-1"
                            style={{ color: 'var(--eco-text-secondary)' }}
                          >
                            {selected.decisionComment}
                          </div>
                        )}
                      </div>
                    )}

                    {actionError && (
                      <div
                        className="text-[13px]"
                        role="alert"
                        style={{ color: 'var(--eco-negative)' }}
                      >
                        {actionError}
                      </div>
                    )}
                  </div>
                </AdminCard>

                <DisputeRefundsPanel disputeId={selected.id} />
              </div>
            )}
          </div>
        </div>

        <Modal
          open={decisionModalOpen}
          onClose={() => setDecisionModalOpen(false)}
          title={t('decision')}
        >
          <div className="flex flex-col gap-4">
            <Select
              label={t('decision')}
              options={decisionOptions}
              value={decisionType}
              onChange={(e) => setDecisionType(e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="admin-dispute-decision-comment"
                className="text-[13px]"
                style={{ color: 'var(--eco-text)' }}
              >
                {t('comment')} <span style={{ color: 'var(--eco-negative)' }}>*</span>
              </label>
              <textarea
                id="admin-dispute-decision-comment"
                rows={3}
                value={decisionComment}
                onChange={(e) => setDecisionComment(e.target.value)}
                placeholder={t('decisionCommentPlaceholder')}
                className="eco-input px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
              />
              <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('reasonMinLength', { n: REASON_MIN_LENGTH })}
              </span>
            </div>
            {actionError && (
              <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
                {actionError}
              </div>
            )}
            <div
              className="text-[12px] flex items-center gap-1"
              style={{ color: 'var(--eco-text-tertiary)' }}
            >
              <Shield size={12} /> {t('auditLoggedShort')}
            </div>
            <Button
              variant="primary"
              disabled={decisionComment.trim().length < REASON_MIN_LENGTH}
              loading={submitting}
              onClick={() => void handleDecide()}
            >
              {t('submit')}
            </Button>
          </div>
        </Modal>
      </AdminPage>
    </AdminLayout>
  );
}

function OwnerViolationButton({
  dispute,
  onApplied,
}: {
  dispute: DisputeResponse;
  onApplied: (updated: DisputeResponse) => void;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();

  const [open, setOpen] = useState(false);
  // Kept only to preserve the old form markup while it remains hidden below. Refund selection,
  // transaction lookup, and amount calculation now happen safely on the server.
  const [createRefund, setCreateRefund] = useState(true);
  const [paymentTxId, setPaymentTxId] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setReason('');
      setError(null);
      setPaymentTxId('');
      setRefundAmount('');
      setCreateRefund(true);
    }
  }, [open]);

  const tooShort = reason.trim().length < REASON_MIN_LENGTH;

  const submit = async () => {
    if (tooShort) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await authorizedRequest((token) =>
        applyOwnerViolationSanctionRequest(
          dispute.id,
          {
            reason: reason.trim(),
          },
          token,
        ),
      );
      onApplied(updated);
      setOpen(false);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
        <AlertTriangle size={13} /> {t('adminOwnerViolation')}
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('adminSanctionOwnerViolation')}
      >
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <div className="hidden" aria-hidden="true">
            {t('adminRecordAnOwnerViolationOnThis')}
          </div>

          <div className="p-3 rounded-lg text-[13px]" style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-text)' }}>
            {t('adminConfirmationAutomaticallyCreatesRefundsForEvery')}
          </div>

          <div className="hidden" aria-hidden="true">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              className="mt-0.5"
              checked={createRefund}
              onChange={(e) => setCreateRefund(e.target.checked)}
            />
            <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
              {t('adminCreateARefund')}
            </span>
          </label>

          {createRefund && (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                  {t('adminTxIdOptional')}
                </label>
                <input
                  value={paymentTxId}
                  onChange={(e) => setPaymentTxId(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  className="px-2 py-1.5 rounded-lg outline-none text-[13px]"
                  style={{
                    background: 'var(--eco-surface)',
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text)',
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                  {t('adminAmountOptional')}
                </label>
                <input
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  inputMode="decimal"
                  className="px-2 py-1.5 rounded-lg outline-none text-[13px]"
                  style={{
                    background: 'var(--eco-surface)',
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text)',
                  }}
                />
              </div>
            </div>
          )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
              {t('reason')} <span style={{ color: 'var(--eco-negative)' }}>*</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('mandatoryAuditLogged')}
              aria-label={t('reason')}
              className="eco-input px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            />
            <span
              className="text-[12px]"
              style={{ color: tooShort ? 'var(--eco-text-tertiary)' : 'var(--eco-positive)' }}
            >
              {t('reasonMinLength', { n: REASON_MIN_LENGTH })}
            </span>
          </div>

          {error && (
            <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
              {error}
            </div>
          )}

          <Button
            variant="destructive"
            disabled={tooShort}
            loading={submitting}
            onClick={() => void submit()}
          >
            {t('adminApplySanction')}
          </Button>
        </div>
      </Modal>
    </>
  );
}

function DisputeRefundsPanel({ disputeId }: { disputeId: number }) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();

  const [refunds, setRefunds] = useState<RefundTransactionResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

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

  const apply = (updated: RefundTransactionResponse) => {
    setRefunds((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleSuccess = async (id: number) => {
    const providerRefundId =
      window.prompt(
        t('adminProviderRefundIdOptional'),
      ) ?? undefined;
    setBusyId(id);
    try {
      const updated = await authorizedRequest((token) =>
        markRefundSuccessRequest(id, { providerRefundId: providerRefundId || undefined }, token),
      );
      apply(updated);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setBusyId(null);
    }
  };

  const handleFail = async (id: number) => {
    const providerRefundId =
      window.prompt(
        t('adminProviderRefundIdOptional'),
      ) ?? undefined;
    setBusyId(id);
    try {
      const updated = await authorizedRequest((token) =>
        markRefundFailRequest(id, { providerRefundId: providerRefundId || undefined }, token),
      );
      apply(updated);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AdminCard
      title={
        <span className="flex items-center gap-2">
          <Banknote size={15} aria-hidden />
          {t('adminRefundsForDispute')}
        </span>
      }
      actions={
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={12} className={loading ? 'animate-spin' : undefined} />{' '}
          {t('adminRefresh')}
        </Button>
      }
    >
      <div className="flex flex-col gap-3">
        {error && refunds.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}
        {error && refunds.length === 0 && !loading && (
          <AdminErrorState message={error} onRetry={() => void load()} />
        )}

        {loading && refunds.length === 0 && (
          <div className="flex flex-col gap-2" aria-busy="true" aria-label={t('loading')}>
            <Skeleton height={64} rounded={8} />
            <Skeleton height={64} rounded={8} />
          </div>
        )}

        {!loading && refunds.length === 0 && !error && (
          <AdminEmptyState
            icon={Banknote}
            title={t('adminNoRefundsYet')}
            compact
          />
        )}

        {refunds.map((r) => (
          <div
            key={r.id}
            className="p-3 rounded-lg flex flex-col gap-2"
            style={{ background: 'var(--eco-surface)' }}
          >
            <div className="flex items-center justify-between gap-2">
              <AdminId>R-{r.id}</AdminId>
              <AdminStatusBadge status={r.status}>{r.status}</AdminStatusBadge>
            </div>
            <div className="text-[13px] tabular-nums" style={{ color: 'var(--eco-text)' }}>
              <span className="whitespace-nowrap font-semibold">
                {r.amount} {r.currency ?? ''}
              </span>{' '}
              {r.paymentTransactionId ? (
                <span style={{ color: 'var(--eco-text-tertiary)' }}>
                  · tx #{r.paymentTransactionId}
                </span>
              ) : null}
            </div>
            {r.reason && (
              <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {r.reason}
              </div>
            )}
            {r.status === 'PENDING' && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  loading={busyId === r.id}
                  onClick={() => void handleSuccess(r.id)}
                >
                  <Check size={13} /> {t('adminMarkSuccess')}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  loading={busyId === r.id}
                  onClick={() => void handleFail(r.id)}
                >
                  <X size={13} /> {t('adminMarkFailed')}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminCard>
  );
}
