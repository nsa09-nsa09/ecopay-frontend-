import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Card, Input, Modal, Select } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { formatDateTime } from '../../lib/datetime';
import { userStatusLabel, userStatusVariant } from '../../lib/user-facing-enums';
import { newIdempotencyKey } from '../../lib/payment-context';
import { FlashBanner, formatAdminApiError, useFlash } from './admin-action-ui';
import {
  ApiError,
  createManualRefundRequest,
  getAdminFinanceRefundsRequest,
  getAdminFinancePayoutsRequest,
  getAdminFinanceTransactionsRequest,
  getAdminFinanceWebhooksRequest,
  type FinancePayoutDto,
  type FinanceRefundDto,
  type FinanceTransactionDto,
  type FinanceWebhookDto,
} from '../../lib/api';

type FinanceTab = 'payment-review' | 'refunds' | 'payouts' | 'webhooks';
type TFn = (key: string, params?: Record<string, string | number>) => string;
const TABS: FinanceTab[] = ['payment-review', 'refunds', 'payouts', 'webhooks'];
const PAGE_SIZE = 20;

const PAYMENT_REVIEW_STATUSES = [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED_PARTIAL',
  'REFUNDED_FULL',
];
const REFUND_STATUSES = ['PENDING', 'PENDING_PROVIDER', 'REQUIRES_REVIEW', 'SUCCESS', 'FAILED'];
const PAYOUT_STATUSES = [
  'PENDING',
  'PENDING_METHOD',
  'PENDING_PROVIDER',
  'PROCESSING',
  'REQUIRES_REVIEW',
  'FROZEN',
  'SUCCESS',
  'FAILED',
  'REVERSED',
  'CANCELED',
];
const WEBHOOK_STATUSES = ['PENDING', 'PROCESSING', 'FAILED', 'PROCESSED', 'DEAD_LETTER'];
const TAB_I18N: Record<FinanceTab, string> = {
  'payment-review': 'financeTabPaymentReview',
  refunds: 'financeTabRefunds',
  payouts: 'financeTabPayouts',
  webhooks: 'financeTabWebhooks',
};

function parseTab(value: string | null): FinanceTab {
  return value && (TABS as string[]).includes(value) ? (value as FinanceTab) : 'payment-review';
}

function formatMoney(amount: number | string | null | undefined, currency: string | null): string {
  if (amount == null) return '-';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  const formatted = Number.isFinite(num)
    ? new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(num)
    : String(amount);
  return (currency ?? 'KZT') === 'KZT' ? `₸${formatted}` : `${formatted} ${currency}`;
}

// Intent statuses that, together with an unspent balance, make a payment
// transaction a manual-refund candidate.
const REFUND_REVIEW_STATUSES = new Set(['REQUIRES_REVIEW', 'REFUND_REQUIRES_REVIEW']);

/**
 * Remaining refundable balance the backend reports on a transaction row, or
 * null when the field is absent. Older backends omit it entirely — that absence
 * is our feature flag: no field → the manual-refund endpoint isn't live, so we
 * render no action and the page behaves exactly as before.
 */
function refundableAmount(item: FinanceTransactionDto): number | null {
  const raw = item as unknown as Record<string, unknown>;
  for (const key of ['refundableAmount', 'remainingRefundable', 'refundableBalance']) {
    const value = raw[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
      return Number(value);
    }
  }
  return null;
}

/**
 * Whether the operator can issue a manual refund for this row. Gated on the
 * backend sending a refundable balance (feature flag) plus the stuck-payment
 * conditions: a capture anomaly, or an unspent balance on a payment intent that
 * is parked in review.
 */
function canManualRefund(item: FinanceTransactionDto): boolean {
  const balance = refundableAmount(item);
  if (balance === null) return false;
  const status = (item.status ?? '').toUpperCase();
  if (status === 'CAPTURE_ANOMALY') return true;
  const type = (item.type ?? '').toUpperCase();
  const isPayment = type === '' || type === 'PAYMENT';
  return isPayment && balance > 0 && REFUND_REVIEW_STATUSES.has(status);
}

/** Statuses an operator must act on now. */
const CRITICAL_STATUSES = new Set([
  'REQUIRES_REVIEW',
  'CAPTURE_ANOMALY',
  'DEAD_LETTER',
  'UNKNOWN',
  'CLAWBACK_REQUIRED',
  'FROZEN',
]);
/** Statuses waiting on the provider or a reconciliation job. */
const WAITING_STATUSES = new Set(['PENDING_PROVIDER', 'RECONCILING', 'PENDING_METHOD']);

type Attention = { level: 'critical' | 'waiting'; label: string };

type Tx = (ru: string, kz: string, en: string) => string;

function statusAttention(status: string | null, tx: Tx): Attention | null {
  if (!status) return null;
  if (CRITICAL_STATUSES.has(status)) {
    return { level: 'critical', label: tx('Нужно решение', 'Шешім қажет', 'Needs action') };
  }
  if (WAITING_STATUSES.has(status)) {
    return {
      level: 'waiting',
      label: tx('Ждёт провайдера', 'Провайдерді күтуде', 'Waiting on provider'),
    };
  }
  return null;
}

/** Payout-specific flags: overdue (hold ended but not sent) and blocked. */
function payoutAttention(item: FinancePayoutDto, tx: Tx, now: number): Attention[] {
  const flags: Attention[] = [];
  const status = (item.status ?? '').toUpperCase();
  if (status === 'PENDING_METHOD') {
    flags.push({
      level: 'critical',
      label: tx('Заблокирована: нет карты', 'Бұғатталған: карта жоқ', 'Blocked: no payout card'),
    });
  } else if (status === 'FROZEN') {
    flags.push({ level: 'critical', label: tx('Заблокирована', 'Бұғатталған', 'Blocked') });
  } else {
    const base = statusAttention(status, tx);
    if (base) flags.push(base);
  }
  const releaseAt = item.releaseAt ? Date.parse(item.releaseAt) : NaN;
  if (
    ['PENDING', 'PENDING_METHOD', 'PROCESSING'].includes(status) &&
    Number.isFinite(releaseAt) &&
    releaseAt < now
  ) {
    flags.push({ level: 'critical', label: tx('Просрочена', 'Мерзімі өтті', 'Overdue') });
  }
  return flags;
}

function AttentionChips({ flags }: { flags: Attention[] }) {
  if (flags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.map((flag) => (
        <span
          key={flag.label}
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]"
          style={{
            background:
              flag.level === 'critical' ? 'var(--eco-danger-100)' : 'var(--eco-warning-100)',
            color: flag.level === 'critical' ? 'var(--eco-negative)' : 'var(--eco-warning)',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={11} aria-hidden="true" />
          {flag.label}
        </span>
      ))}
    </div>
  );
}

/** Left accent on rows that need attention (in addition to the text chip). */
function rowStyle(flags: Attention[]) {
  if (flags.length === 0) return undefined;
  const critical = flags.some((flag) => flag.level === 'critical');
  return {
    boxShadow: `inset 3px 0 0 ${critical ? 'var(--eco-negative)' : 'var(--eco-warning)'}`,
  };
}

const txFor =
  (language: 'ru' | 'kz' | 'en'): Tx =>
  (ru, kz, en) =>
    language === 'ru' ? ru : language === 'kz' ? kz : en;

function formatOptionalDateTime(value: string | null | undefined, language: 'ru' | 'kz' | 'en') {
  return value ? formatDateTime(value, language) : '-';
}

function StatusBadge({
  status,
  language,
}: {
  status: string | null | undefined;
  language: 'ru' | 'kz' | 'en';
}) {
  return <Badge variant={userStatusVariant(status)}>{userStatusLabel(status, language)}</Badge>;
}

function PublicId({ label }: { label: ReactNode }) {
  return (
    <span style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace', fontSize: 11 }}>
      {label}
    </span>
  );
}

function RoomRef({ id, title }: { id: number | null; title: string | null }) {
  if (id == null) return <span style={{ color: 'var(--eco-text-tertiary)' }}>-</span>;
  return (
    <Link
      to={`/admin/rooms?selected=${id}`}
      style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
    >
      {title ? `R-${id} · ${title}` : `R-${id}`}
    </Link>
  );
}

function UserRef({ id, name }: { id: number | null; name: string | null }) {
  if (id == null) return <span style={{ color: 'var(--eco-text-tertiary)' }}>-</span>;
  return (
    <Link
      to={`/admin/users?selected=${id}`}
      style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
    >
      {name ?? `U-${id}`}
    </Link>
  );
}

export function AdminFinancePage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = parseTab(searchParams.get('tab'));
  const tx = txFor(language);
  // The status filter lives in the URL so dashboard links and reloads keep it.
  const [status, setStatusState] = useState(() => {
    const fromUrl = (searchParams.get('status') ?? '').toUpperCase();
    return /^[A-Z_]{1,40}$/.test(fromUrl) ? fromUrl : '';
  });
  const setStatus = (next: string) => {
    setStatusState(next);
    const params = new URLSearchParams(searchParams);
    if (next) params.set('status', next);
    else params.delete('status');
    setSearchParams(params, { replace: true });
  };
  const [page, setPage] = useState(0);
  const [txItems, setTxItems] = useState<FinanceTransactionDto[]>([]);
  const [refundItems, setRefundItems] = useState<FinanceRefundDto[]>([]);
  const [payoutItems, setPayoutItems] = useState<FinancePayoutDto[]>([]);
  const [webhookItems, setWebhookItems] = useState<FinanceWebhookDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Manual-refund modal: the transaction being refunded (null = closed).
  const [refundTarget, setRefundTarget] = useState<FinanceTransactionDto | null>(null);
  const { flash, show: showFlash } = useFlash();

  const setTab = (next: FinanceTab) => {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    params.delete('status');
    setSearchParams(params, { replace: true });
    setStatusState('');
    setPage(0);
  };

  const statusOptions = useMemo(() => {
    const values =
      tab === 'payment-review'
        ? PAYMENT_REVIEW_STATUSES
        : tab === 'refunds'
          ? REFUND_STATUSES
          : tab === 'payouts'
            ? PAYOUT_STATUSES
            : WEBHOOK_STATUSES;
    // Keep a URL-provided status selectable even if it is not in the list.
    const all = status && !values.includes(status) ? [...values, status] : values;
    return [
      { value: '', label: t('financeFilterAll') },
      ...all.map((value) => ({ value, label: userStatusLabel(value, language) })),
    ];
  }, [tab, t, language, status]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'payment-review') {
        const result = await authorizedRequest((token) =>
          getAdminFinanceTransactionsRequest(token, {
            status: status || undefined,
            page,
            size: PAGE_SIZE,
          }),
        );
        setTxItems(result.items);
        setRefundItems([]);
        setPayoutItems([]);
        setWebhookItems([]);
        setTotalPages(Math.max(1, result.totalPages));
        setTotalItems(result.totalItems);
      } else if (tab === 'refunds') {
        const result = await authorizedRequest((token) =>
          getAdminFinanceRefundsRequest(token, {
            status: status || undefined,
            page,
            size: PAGE_SIZE,
          }),
        );
        setRefundItems(result.items);
        setTxItems([]);
        setPayoutItems([]);
        setWebhookItems([]);
        setTotalPages(Math.max(1, result.totalPages));
        setTotalItems(result.totalItems);
      } else if (tab === 'payouts') {
        const result = await authorizedRequest((token) =>
          getAdminFinancePayoutsRequest(token, {
            status: status || undefined,
            page,
            size: PAGE_SIZE,
          }),
        );
        setTxItems([]);
        setRefundItems([]);
        setPayoutItems(result.items);
        setWebhookItems([]);
        setTotalPages(Math.max(1, result.totalPages));
        setTotalItems(result.totalItems);
      } else {
        const result = await authorizedRequest((token) =>
          getAdminFinanceWebhooksRequest(token, {
            status: status || undefined,
            page,
            size: PAGE_SIZE,
          }),
        );
        setTxItems([]);
        setRefundItems([]);
        setPayoutItems([]);
        setWebhookItems(result.items);
        setTotalPages(Math.max(1, result.totalPages));
        setTotalItems(result.totalItems);
      }
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, status, tab, t]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AdminLayout>
      <div className="max-w-[1280px]">
        <div
          className="pb-5 mb-6 border-b flex items-center justify-between gap-3 flex-wrap"
          style={{ borderColor: 'var(--eco-border)' }}
        >
          <div>
            <h1 className="text-[24px]" style={{ color: 'var(--eco-text)', fontWeight: 500 }}>
              {t('financePageTitle')}
            </h1>
            <p className="text-[12px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('financePageHint')}
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t('retry')}
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap mb-4">
          {TABS.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer"
              style={{
                background: tab === key ? 'var(--eco-brand-50)' : 'var(--eco-surface-raised)',
                border: `1px solid ${tab === key ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                color: tab === key ? 'var(--eco-primary)' : 'var(--eco-text-secondary)',
              }}
            >
              {t(TAB_I18N[key])}
            </button>
          ))}
        </div>

        <Card className="mb-4">
          <div className="max-w-[280px]">
            <Select
              label={t('financeFilterStatus')}
              value={status}
              onChange={(event) => {
                setStatus(event.target.value);
                setPage(0);
              }}
              options={statusOptions}
            />
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

        {tab === 'payment-review' ? (
          <TransactionsTable
            items={txItems}
            language={language}
            loading={loading}
            t={t}
            onRefund={setRefundTarget}
          />
        ) : tab === 'refunds' ? (
          <RefundsTable items={refundItems} language={language} loading={loading} t={t} />
        ) : tab === 'payouts' ? (
          <PayoutsTable items={payoutItems} language={language} loading={loading} t={t} />
        ) : (
          <WebhooksTable items={webhookItems} language={language} loading={loading} t={t} />
        )}
        {!loading && (
          <p className="text-[11px] mt-2" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(
              'Строки с цветной полосой слева требуют внимания: красная — нужно решение, жёлтая — ожидание провайдера.',
              'Сол жағында түсті жолағы бар жолдар назар аударуды қажет етеді: қызыл — шешім қажет, сары — провайдерді күту.',
              'Rows with a colored left bar need attention: red = needs action, amber = waiting on the provider.',
            )}
          </p>
        )}

        {totalItems > 0 && (
          <div className="flex items-center justify-between mt-4 text-[12px]">
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
      <ManualRefundModal
        target={refundTarget}
        language={language}
        t={t}
        onClose={() => setRefundTarget(null)}
        onConfirm={(payload) =>
          authorizedRequest((token) => createManualRefundRequest(token, payload))
        }
        onDone={() => {
          setRefundTarget(null);
          showFlash('success', t('financeRefundSuccess'));
          void load();
        }}
      />
    </AdminLayout>
  );
}

/**
 * Manual-refund dialog for a stuck transaction. Amount defaults to the backend
 * reported remaining balance (when present); the operator may override it or
 * leave it blank for a full refund. A reason is mandatory and a single
 * idempotency key is reused across retries within one open dialog.
 */
function ManualRefundModal({
  target,
  language,
  t,
  onClose,
  onConfirm,
  onDone,
}: {
  target: FinanceTransactionDto | null;
  language: 'ru' | 'kz' | 'en';
  t: TFn;
  onClose: () => void;
  onConfirm: (payload: {
    paymentTransactionId: number;
    amount?: number;
    reason: string;
    idempotencyKey: string;
  }) => Promise<unknown>;
  onDone: () => void;
}) {
  const open = target != null;
  const balance = target ? refundableAmount(target) : null;
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  // One key per opened dialog, so a retry after a transient error does not
  // create a second refund.
  const [idempotencyKey, setIdempotencyKey] = useState('');

  // Reset the form each time a new transaction is targeted.
  useEffect(() => {
    if (!target) return;
    const b = refundableAmount(target);
    setAmount(b != null && b > 0 ? String(b) : '');
    setReason('');
    setErrorMessage(null);
    setIdempotencyKey(newIdempotencyKey());
  }, [target]);

  if (!open || !target) return null;

  const reasonTrimmed = reason.trim();
  const amountTrimmed = amount.trim();
  const parsedAmount = amountTrimmed === '' ? undefined : Number(amountTrimmed);
  const amountInvalid =
    amountTrimmed !== '' && (!Number.isFinite(parsedAmount) || (parsedAmount ?? 0) <= 0);
  const canSubmit = reasonTrimmed.length > 0 && !amountInvalid && !submitting;

  const submit = async () => {
    if (reasonTrimmed.length === 0) {
      setErrorMessage(t('financeRefundReasonRequired'));
      return;
    }
    if (amountInvalid) {
      setErrorMessage(t('financeRefundAmountInvalid'));
      return;
    }
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await onConfirm({
        paymentTransactionId: target.id,
        amount: parsedAmount,
        reason: reasonTrimmed,
        idempotencyKey,
      });
      onDone();
    } catch (err) {
      setErrorMessage(refundErrorMessage(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('financeRefundTitle')}>
      <div className="flex flex-col gap-4">
        <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('financeRefundDescription')}
        </div>
        <div
          className="p-3 rounded-lg text-[12px] flex flex-col gap-1"
          style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
        >
          <div>
            <PublicId label={target.publicId ?? `T-${target.id}`} />{' '}
            <StatusBadge status={target.status} language={language} />
          </div>
          <div>{formatMoney(target.amount, target.currency)}</div>
          {balance != null && (
            <div style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('financeRefundAmountLabel')}: {formatMoney(balance, target.currency)}
            </div>
          )}
        </div>
        <Input
          label={t('financeRefundAmountLabel')}
          hint={t('financeRefundAmountHint')}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          error={amountInvalid ? t('financeRefundAmountInvalid') : undefined}
        />
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
            {t('reason')} <span style={{ color: 'var(--eco-negative)' }}>*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
            }}
          />
        </div>
        {errorMessage && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {errorMessage}
          </div>
        )}
        <Button variant="secondary" disabled={!canSubmit} loading={submitting} onClick={() => void submit()}>
          {t('financeRefundSubmit')}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Maps the manual-refund backend error codes to specific, translated copy so
 * the operator sees why it failed inside the dialog — not a generic toast.
 */
function refundErrorMessage(err: unknown, t: TFn): string {
  if (err instanceof ApiError) {
    switch (err.serverCode) {
      case 'REFUND_NOT_CAPTURED':
        return t('financeRefundErrNotCaptured');
      case 'REFUND_NO_BALANCE':
        return t('financeRefundErrNoBalance');
      case 'REFUND_AMOUNT_EXCEEDS_BALANCE':
        return t('financeRefundErrExceedsBalance');
      default:
        break;
    }
  }
  return formatAdminApiError(err, t);
}

function TransactionsTable({
  items,
  language,
  loading,
  t,
  onRefund,
}: {
  items: FinanceTransactionDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
  t: TFn;
  onRefund: (item: FinanceTransactionDto) => void;
}) {
  const tx = txFor(language);
  // Only surface the action column when the backend actually supports manual
  // refunds for at least one row on this page — old backends see no new column.
  const showAction = items.some(canManualRefund);
  if (loading && items.length === 0) return <SkeletonRows t={t} />;
  if (items.length === 0) return <EmptyOps t={t} />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('financeColDateIds')}</Th>
          <Th>{t('financeColStatus')}</Th>
          <Th className="text-right">{t('financeColAmount')}</Th>
          <Th>{t('financeColRoomMember')}</Th>
          <Th>{t('financeColProvider')}</Th>
          <Th>{t('financeColSafeReason')}</Th>
          {showAction && <Th>{t('financeColAction')}</Th>}
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const flags = [statusAttention(item.status, tx)].filter(Boolean) as Attention[];
          return (
            <tr key={item.id} style={rowStyle(flags)}>
              <Td>
                <PublicId label={item.publicId ?? `T-${item.id}`} />
                <div>{formatDateTime(item.createdAt, language)}</div>
              </Td>
              <Td>
                <StatusBadge status={item.status} language={language} />
                <AttentionChips flags={flags} />
              </Td>
              <Td className="text-right">{formatMoney(item.amount, item.currency)}</Td>
              <Td>
                <RoomRef id={item.roomId} title={item.roomTitle} />
                <div>
                  <UserRef id={item.payerUserId} name={item.payerDisplayName} />
                </div>
              </Td>
              <Td>
                <div>{item.providerName ?? '-'}</div>
                <PublicId label={item.providerReference ?? item.cardPanMask ?? '-'} />
              </Td>
              <Td>{item.safeErrorReason ?? item.failureMessage ?? item.reason ?? '-'}</Td>
              {showAction && (
                <Td>
                  {canManualRefund(item) ? (
                    <Button variant="secondary" size="sm" onClick={() => onRefund(item)}>
                      {t('financeRefundAction')}
                    </Button>
                  ) : (
                    <span style={{ color: 'var(--eco-text-tertiary)' }}>-</span>
                  )}
                </Td>
              )}
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function RefundsTable({
  items,
  language,
  loading,
  t,
}: {
  items: FinanceRefundDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
  t: TFn;
}) {
  const tx = txFor(language);
  if (loading && items.length === 0) return <SkeletonRows t={t} />;
  if (items.length === 0) return <EmptyOps t={t} />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('financeColDateIds')}</Th>
          <Th>{t('financeColStatus')}</Th>
          <Th className="text-right">{t('financeColAmount')}</Th>
          <Th>{t('financeColRoomMember')}</Th>
          <Th>{t('financeColProviderRef')}</Th>
          <Th>{t('financeColSafeReason')}</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const flags = [statusAttention(item.status, tx)].filter(Boolean) as Attention[];
          return (
            <tr key={item.id} style={rowStyle(flags)}>
              <Td>
                <PublicId label={item.publicId ?? `RF-${item.id}`} />
                <div>{formatDateTime(item.createdAt, language)}</div>
              </Td>
              <Td>
                <StatusBadge status={item.status} language={language} />
                <AttentionChips flags={flags} />
              </Td>
              <Td className="text-right">{formatMoney(item.amount, item.currency)}</Td>
              <Td>
                <RoomRef id={item.roomId} title={item.roomTitle} />
                <div>
                  <UserRef id={item.memberUserId} name={item.memberDisplayName} />
                </div>
              </Td>
              <Td>
                <PublicId label={item.providerReference ?? '-'} />
              </Td>
              <Td>{item.safeErrorReason ?? item.reason ?? '-'}</Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function PayoutsTable({
  items,
  language,
  loading,
  t,
}: {
  items: FinancePayoutDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
  t: TFn;
}) {
  const tx = txFor(language);
  const now = Date.now();
  if (loading && items.length === 0) return <SkeletonRows t={t} />;
  if (items.length === 0) return <EmptyOps t={t} />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('financeColDateIds')}</Th>
          <Th>{t('financeColStatus')}</Th>
          <Th className="text-right">{t('financeColOwnerAmount')}</Th>
          <Th>{t('financeColRoomOwner')}</Th>
          <Th>{t('financeColHoldSent')}</Th>
          <Th>{t('financeColProvider')}</Th>
          <Th>{t('financeColReason')}</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const flags = payoutAttention(item, tx, now);
          return (
            <tr key={item.id} style={rowStyle(flags)}>
              <Td>
                <PublicId label={`P-${item.id}`} />
                <div>{formatDateTime(item.createdAt, language)}</div>
                {item.triggeringPaymentIntentId != null && (
                  <PublicId label={`intent ${item.triggeringPaymentIntentId}`} />
                )}
              </Td>
              <Td>
                <StatusBadge status={item.status} language={language} />
                <AttentionChips flags={flags} />
              </Td>
              <Td className="text-right">{formatMoney(item.amount, item.currency)}</Td>
              <Td>
                <RoomRef id={item.roomId} title={item.roomTitle} />
                <div>
                  <UserRef id={item.ownerUserId} name={item.ownerDisplayName} />
                </div>
              </Td>
              <Td>
                <div>Release: {formatOptionalDateTime(item.releaseAt, language)}</div>
                <div>Sent: {formatOptionalDateTime(item.processedAt, language)}</div>
                {item.nextRetryAt && (
                  <PublicId label={`retry ${formatDateTime(item.nextRetryAt, language)}`} />
                )}
              </Td>
              <Td>
                <div>{item.providerName ?? '-'}</div>
                <ShortText value={item.providerPayoutId ?? item.payoutMethodPanMask ?? '-'} />
              </Td>
              <Td>
                <ShortText value={item.failureReason ?? '-'} />
                {item.retryCount != null && item.retryCount > 0 && (
                  <PublicId label={`attempts ${item.retryCount}`} />
                )}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function WebhooksTable({
  items,
  language,
  loading,
  t,
}: {
  items: FinanceWebhookDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
  t: TFn;
}) {
  const tx = txFor(language);
  if (loading && items.length === 0) return <SkeletonRows t={t} />;
  if (items.length === 0) return <EmptyOps t={t} />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>{t('financeColReceivedId')}</Th>
          <Th>{t('financeColStatus')}</Th>
          <Th>{t('financeColScript')}</Th>
          <Th>{t('financeColAttempts')}</Th>
          <Th>{t('financeColProcessed')}</Th>
          <Th>{t('financeColProviderRequest')}</Th>
          <Th>{t('financeColError')}</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => {
          const flags = [statusAttention(item.processingStatus, tx)].filter(Boolean) as Attention[];
          if (item.signatureValid === false) {
            flags.push({
              level: 'critical',
              label: tx('Неверная подпись', 'Қолтаңба қате', 'Bad signature'),
            });
          }
          return (
            <tr key={item.id} style={rowStyle(flags)}>
              <Td>
                <PublicId label={`W-${item.id}`} />
                <div>{formatDateTime(item.receivedAt, language)}</div>
              </Td>
              <Td>
                <StatusBadge status={item.processingStatus} language={language} />
                <AttentionChips flags={flags} />
                <div>
                  <PublicId
                    label={
                      item.signatureValid == null
                        ? 'signature unknown'
                        : item.signatureValid
                          ? 'signature ok'
                          : 'bad signature'
                    }
                  />
                </div>
              </Td>
              <Td>{item.callbackScript}</Td>
              <Td>
                <div>{item.attemptCount ?? 0}</div>
                {item.lastAttemptAt && (
                  <PublicId label={formatDateTime(item.lastAttemptAt, language)} />
                )}
              </Td>
              <Td>
                <div>{formatOptionalDateTime(item.processedAt, language)}</div>
                {item.nextRetryAt && (
                  <PublicId label={`retry ${formatDateTime(item.nextRetryAt, language)}`} />
                )}
                {item.deadLetteredAt && (
                  <PublicId label={`dead ${formatDateTime(item.deadLetteredAt, language)}`} />
                )}
              </Td>
              <Td>
                <ShortText value={item.providerRequestId} />
              </Td>
              <Td>
                <ShortText value={item.lastErrorCode ?? item.errorMessage ?? '-'} />
              </Td>
            </tr>
          );
        })}
      </tbody>
    </Table>
  );
}

function ShortText({ value }: { value: ReactNode }) {
  if (typeof value !== 'string') return <>{value}</>;
  return (
    <span title={value} style={{ display: 'block', maxWidth: 220, overflowWrap: 'anywhere' }}>
      {value}
    </span>
  );
}

function Table({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--eco-surface-raised)', border: '1px solid var(--eco-border)' }}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-[13px]"
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          {children}
        </table>
      </div>
    </div>
  );
}

function SkeletonRows({ t }: { t: TFn }) {
  return (
    <Card className="text-[13px] py-10" style={{ color: 'var(--eco-text-tertiary)' }}>
      {t('financeOpsLoading')}
    </Card>
  );
}

function EmptyOps({ t }: { t: TFn }) {
  return (
    <Card className="text-center text-[13px] py-10">
      <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('financeOpsEmpty')}</span>
    </Card>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-left text-[11px] uppercase ${className ?? ''}`}
      style={{ color: 'var(--eco-text-tertiary)', letterSpacing: '0.08em', fontWeight: 600 }}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td
      className={`px-3 py-2 align-top ${className ?? ''}`}
      style={{ color: 'var(--eco-text)', borderTop: '1px solid var(--eco-border)' }}
    >
      {children}
    </td>
  );
}
