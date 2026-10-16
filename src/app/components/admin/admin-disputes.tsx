import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
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

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState<number | null>(() => {
    const sel = searchParams.get('selected');
    return sel ? Number(sel) : null;
  });
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState<string>('FAVOR_MEMBER');
  const [decisionComment, setDecisionComment] = useState('');
  const [refundAmountStr, setRefundAmountStr] = useState('');
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

  const selectDispute = useCallback((id: number | null) => {
    setSelectedId(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id != null) next.set('selected', String(id));
      else next.delete('selected');
      return next;
    }, { replace: true });
  }, [setSearchParams]);

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
      const parsedRefund = decisionType === 'FAVOR_MEMBER' && refundAmountStr.trim()
        ? Number(refundAmountStr.trim())
        : undefined;
      const updated = await authorizedRequest((token) =>
        decideDisputeRequest(
          selected.id,
          {
            status: decisionType === 'FAVOR_MEMBER' ? 'RESOLVED' : 'REJECTED',
            decision: decisionType,
            comment: decisionComment.trim(),
            refundAmount: parsedRefund && parsedRefund > 0 ? parsedRefund : undefined,
          },
          token,
        ),
      );
      applyUpdate(updated);
      showFlash('success', t('actionCompletedAndLogged'));
      setDecisionModalOpen(false);
      setDecisionComment('');
      setRefundAmountStr('');
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
                  onClick={() => selectDispute(d.id)}
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
                    <span className="user-text">
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
                        <AdminField label={t('rooms')}>
                          {selected.roomId ? (
                            <Link to={`/admin/rooms?selected=${selected.roomId}`} className="text-[13px]" style={{ color: 'var(--eco-primary)' }}>
                              {selected.roomTitle ?? `#${selected.roomId}`}
                            </Link>
                          ) : '—'}
                        </AdminField>
                        {selected.serviceName && (
                          <div className="text-[12px] mt-0.5" style={{ color: 'var(--eco-text-tertiary)' }}>
                            {selected.serviceName}
                          </div>
                        )}
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('claimant')}>
                          {selected.openedBy ? (
                            <Link to={`/admin/users?selected=${selected.openedBy.id}`} className="text-[13px]" style={{ color: 'var(--eco-primary)' }}>
                              {selected.openedBy.displayName}
                            </Link>
                          ) : selected.openedByUserId ? `#${selected.openedByUserId}` : '—'}
                        </AdminField>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('adminOwner')}>
                          {selected.owner ? (
                            <Link to={`/admin/users?selected=${selected.owner.id}`} className="text-[13px]" style={{ color: 'var(--eco-primary)' }}>
                              {selected.owner.displayName}
                            </Link>
                          ) : '—'}
                        </AdminField>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                        <AdminField label={t('adminMember')}>
                          {selected.member ? (
                            <Link to={`/admin/users?selected=${selected.member.userId}`} className="text-[13px]" style={{ color: 'var(--eco-primary)' }}>
                              {selected.member.displayName}
                            </Link>
                          ) : '—'}
                        </AdminField>
                      </div>
                    </div>

                    {(selected.paidAmountKzt != null || selected.refundedAmountKzt != null || selected.refundableAmountKzt != null) && (
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                          <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>{t('disputePaid')}</div>
                          <div className="text-[14px] font-semibold tabular-nums" style={{ color: 'var(--eco-text)' }}>₸{selected.paidAmountKzt ?? 0}</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                          <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>{t('disputeRefunded')}</div>
                          <div className="text-[14px] font-semibold tabular-nums" style={{ color: 'var(--eco-text)' }}>₸{selected.refundedAmountKzt ?? 0}</div>
                        </div>
                        <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                          <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>{t('disputeRefundable')}</div>
                          <div className="text-[14px] font-semibold tabular-nums" style={{ color: 'var(--eco-text)' }}>₸{selected.refundableAmountKzt ?? 0}</div>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 text-[12px]">
                      {selected.ticketId && (
                        <Link to={`/admin/tickets?selected=${selected.ticketId}`} style={{ color: 'var(--eco-primary)' }}>
                          {t('fromTicket', { ticket: selected.ticketId })}
                        </Link>
                      )}
                      {selected.roomId && (
                        <Link to={`/admin/logs?tab=room-events&roomId=${selected.roomId}`} style={{ color: 'var(--eco-primary)' }}>
                          {t('adminRoomEvents')}
                        </Link>
                      )}
                    </div>

                    <div className="p-3 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
                      <AdminField label={t('adminAssignedTo')}>
                        {selected.assignedAdminId ? `#${selected.assignedAdminId}` : '—'}
                      </AdminField>
                    </div>

                    {selected.description && (
                      <AdminField label={t('summaryLabel')}>
                        <span className="user-text" style={{ color: 'var(--eco-text-secondary)' }}>
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
                            className="user-text text-[12px] mt-1"
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
            {decisionType === 'FAVOR_MEMBER' && (
              <>
                <div className="p-3 rounded-lg text-[12px]" style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-text)' }}>
                  {t('disputeHintFavorMember')}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="admin-dispute-refund-amount"
                    className="text-[13px]"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {t('disputeRefundAmount')}
                  </label>
                  <input
                    id="admin-dispute-refund-amount"
                    type="text"
                    inputMode="decimal"
                    value={refundAmountStr}
                    onChange={(e) => setRefundAmountStr(e.target.value.replace(/[^\d.]/g, ''))}
                    placeholder={t('disputeRefundAmountPlaceholder', { max: selected?.refundableAmountKzt ?? 0 })}
                    className="eco-input px-3 py-2 rounded-lg outline-none text-[13px]"
                  />
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {t('disputeRefundAmountHint', { max: selected?.refundableAmountKzt ?? 0 })}
                  </span>
                </div>
              </>
            )}
            {decisionType === 'FAVOR_OWNER' && (
              <div className="p-3 rounded-lg text-[12px]" style={{ background: 'var(--eco-surface)', color: 'var(--eco-text-secondary)' }}>
                {t('disputeHintFavorOwner')}
              </div>
            )}
            {decisionType === 'REJECTED' && (
              <div className="p-3 rounded-lg text-[12px]" style={{ background: 'var(--eco-surface)', color: 'var(--eco-text-secondary)' }}>
                {t('disputeHintRejected')}
              </div>
            )}
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
  const { t, language } = useI18n();
  const tx = (ru: string, kz: string, en: string) =>
    language === 'ru' ? ru : language === 'kz' ? kz : en;
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

  // Manual resolution records a provider outcome in the ledger, so it gets an
  // explicit confirmation step: the operator must confirm they verified the
  // outcome with the provider. Cancelling never submits.
  const [resolution, setResolution] = useState<{
    refund: RefundTransactionResponse;
    outcome: 'FAILED';
  } | null>(null);
  const [providerRefundId, setProviderRefundId] = useState('');
  const [verified, setVerified] = useState(false);
  const [resolutionError, setResolutionError] = useState<string | null>(null);

  const openResolution = (refund: RefundTransactionResponse) => {
    setResolution({ refund, outcome: 'FAILED' });
    setProviderRefundId('');
    setVerified(false);
    setResolutionError(null);
  };

  const submitResolution = async () => {
    if (!resolution || !verified || busyId != null) return;
    const { refund } = resolution;
    setBusyId(refund.id);
    setResolutionError(null);
    try {
      const payload = { providerRefundId: providerRefundId.trim() || undefined };
      const updated = await authorizedRequest((token) =>
        markRefundFailRequest(refund.id, payload, token),
      );
      apply(updated);
      setResolution(null);
    } catch (err) {
      setResolutionError(formatAdminApiError(err, t));
      void load();
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
                  variant="destructive"
                  size="sm"
                  disabled={busyId != null}
                  onClick={() => openResolution(r)}
                >
                  <X size={13} /> {t('adminMarkFailed')}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal
        open={resolution != null}
        onClose={() => {
          if (busyId == null) setResolution(null);
        }}
        title={tx('Подтвердить неудачный возврат', 'Сәтсіз қайтаруды растау', 'Confirm refund failed')}
      >
        {resolution && (
          <div className="flex flex-col gap-4">
            <div
              className="p-3 rounded-lg text-[13px]"
              style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
            >
              R-{resolution.refund.id} · {resolution.refund.amount}{' '}
              {resolution.refund.currency ?? ''}
              {resolution.refund.paymentTransactionId
                ? ` · tx #${resolution.refund.paymentTransactionId}`
                : ''}
            </div>
            <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(
                'Возврат будет записан как неудачный. Участнику потребуется другой способ возврата.',
                'Қайтару сәтсіз деп жазылады. Қатысушыға басқа қайтару тәсілі қажет болады.',
                'The refund will be recorded as failed. The member will need another refund path.',
              )}
            </div>
            <label
              className="flex flex-col gap-1.5 text-[13px]"
              style={{ color: 'var(--eco-text)' }}
            >
              {tx(
                'ID возврата у провайдера (необязательно)',
                'Провайдердегі қайтару ID (міндетті емес)',
                'Provider refund ID (optional)',
              )}
              <input
                value={providerRefundId}
                onChange={(e) => setProviderRefundId(e.target.value)}
                maxLength={128}
                autoComplete="off"
                className="px-3 py-2 rounded-lg outline-none text-[13px]"
                style={{
                  background: 'var(--eco-surface)',
                  border: '1px solid var(--eco-border)',
                  color: 'var(--eco-text)',
                }}
              />
            </label>
            <label
              className="flex items-start gap-2 text-[13px]"
              style={{ color: 'var(--eco-text)' }}
            >
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
                className="mt-0.5 w-4 h-4"
              />
              <span>
                {tx(
                  'Я проверил(а) результат у платёжного провайдера. Действие будет записано в журнал.',
                  'Нәтижені төлем провайдерінен тексердім. Әрекет журналға жазылады.',
                  'I verified this outcome with the payment provider. This action is audit-logged.',
                )}
              </span>
            </label>
            {resolutionError && (
              <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
                {resolutionError}
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-end">
              <Button
                variant="ghost"
                size="sm"
                disabled={busyId != null}
                onClick={() => setResolution(null)}
              >
                {tx('Отмена', 'Болдырмау', 'Cancel')}
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={!verified}
                loading={busyId === resolution.refund.id}
                onClick={() => void submitResolution()}
              >
                {tx('Записать как неудачный', 'Сәтсіз деп жазу', 'Record as failed')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AdminCard>
  );
}
