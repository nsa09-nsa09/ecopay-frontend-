import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Card, Select } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { formatDateTime } from '../../lib/datetime';
import { formatAdminApiError } from './admin-action-ui';
import {
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
const TABS: FinanceTab[] = ['payment-review', 'refunds', 'payouts', 'webhooks'];
const PAGE_SIZE = 20;

const PAYMENT_REVIEW_STATUSES = [
  'PENDING',
  'SUCCESS',
  'FAILED',
  'REFUNDED_PARTIAL',
  'REFUNDED_FULL',
];
const REFUND_STATUSES = ['PENDING', 'SUCCESS', 'FAILED', 'REQUIRES_REVIEW'];
const PAYOUT_STATUSES = [
  'PENDING',
  'PENDING_METHOD',
  'PROCESSING',
  'SUCCESS',
  'FAILED',
  'REVERSED',
];
const WEBHOOK_STATUSES = ['PENDING', 'PROCESSING', 'FAILED', 'PROCESSED', 'DEAD_LETTER'];
const TAB_LABELS: Record<FinanceTab, string> = {
  'payment-review': 'PAYMENTS',
  refunds: 'REFUNDS',
  payouts: 'PAYOUTS',
  webhooks: 'WEBHOOKS',
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

function statusVariant(
  status: string | null,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (!status) return 'default';
  if (['SUCCESS', 'COMPLETED', 'REFUNDED', 'APPROVED', 'PROCESSED'].includes(status))
    return 'success';
  if (
    ['FAILED', 'REJECTED', 'CAPTURE_ANOMALY', 'CLAWBACK_REQUIRED', 'DEAD_LETTER'].includes(status)
  )
    return 'danger';
  if (
    [
      'UNKNOWN',
      'RECONCILING',
      'REQUESTED',
      'UNDER_REVIEW',
      'REQUIRES_REVIEW',
      'PENDING',
      'PENDING_METHOD',
    ].includes(status)
  )
    return 'warning';
  return 'info';
}

function formatOptionalDateTime(value: string | null | undefined, language: 'ru' | 'kz' | 'en') {
  return value ? formatDateTime(value, language) : '-';
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
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [txItems, setTxItems] = useState<FinanceTransactionDto[]>([]);
  const [refundItems, setRefundItems] = useState<FinanceRefundDto[]>([]);
  const [payoutItems, setPayoutItems] = useState<FinancePayoutDto[]>([]);
  const [webhookItems, setWebhookItems] = useState<FinanceWebhookDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setTab = (next: FinanceTab) => {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    setSearchParams(params, { replace: true });
    setStatus('');
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
    return [
      { value: '', label: t('financeFilterAll') },
      ...values.map((value) => ({ value, label: value })),
    ];
  }, [tab, t]);

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
              Payments, refunds, owner holds, payouts and FreedomPay webhook processing.
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
              {TAB_LABELS[key]}
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
          <TransactionsTable items={txItems} language={language} loading={loading} />
        ) : tab === 'refunds' ? (
          <RefundsTable items={refundItems} language={language} loading={loading} />
        ) : tab === 'payouts' ? (
          <PayoutsTable items={payoutItems} language={language} loading={loading} />
        ) : (
          <WebhooksTable items={webhookItems} language={language} loading={loading} />
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
    </AdminLayout>
  );
}

function TransactionsTable({
  items,
  language,
  loading,
}: {
  items: FinanceTransactionDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
}) {
  if (loading && items.length === 0) return <SkeletonRows />;
  if (items.length === 0) return <EmptyOps />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Date / IDs</Th>
          <Th>Status</Th>
          <Th className="text-right">Amount</Th>
          <Th>Room / member</Th>
          <Th>Provider</Th>
          <Th>Safe reason</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <Td>
              <PublicId label={item.publicId ?? `T-${item.id}`} />
              <div>{formatDateTime(item.createdAt, language)}</div>
            </Td>
            <Td>
              <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
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
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

function RefundsTable({
  items,
  language,
  loading,
}: {
  items: FinanceRefundDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
}) {
  if (loading && items.length === 0) return <SkeletonRows />;
  if (items.length === 0) return <EmptyOps />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Date / IDs</Th>
          <Th>Status</Th>
          <Th className="text-right">Amount</Th>
          <Th>Room / member</Th>
          <Th>Provider ref</Th>
          <Th>Safe reason</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <Td>
              <PublicId label={item.publicId ?? `RF-${item.id}`} />
              <div>{formatDateTime(item.createdAt, language)}</div>
            </Td>
            <Td>
              <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
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
        ))}
      </tbody>
    </Table>
  );
}

function PayoutsTable({
  items,
  language,
  loading,
}: {
  items: FinancePayoutDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
}) {
  if (loading && items.length === 0) return <SkeletonRows />;
  if (items.length === 0) return <EmptyOps />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Date / IDs</Th>
          <Th>Status</Th>
          <Th className="text-right">Owner amount</Th>
          <Th>Room / owner</Th>
          <Th>Hold / sent</Th>
          <Th>Provider</Th>
          <Th>Reason</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <Td>
              <PublicId label={`P-${item.id}`} />
              <div>{formatDateTime(item.createdAt, language)}</div>
              {item.triggeringPaymentIntentId != null && (
                <PublicId label={`intent ${item.triggeringPaymentIntentId}`} />
              )}
            </Td>
            <Td>
              <Badge variant={statusVariant(item.status)}>{item.status}</Badge>
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
        ))}
      </tbody>
    </Table>
  );
}

function WebhooksTable({
  items,
  language,
  loading,
}: {
  items: FinanceWebhookDto[];
  language: 'ru' | 'kz' | 'en';
  loading: boolean;
}) {
  if (loading && items.length === 0) return <SkeletonRows />;
  if (items.length === 0) return <EmptyOps />;
  return (
    <Table>
      <thead>
        <tr>
          <Th>Received / ID</Th>
          <Th>Status</Th>
          <Th>Script</Th>
          <Th>Attempts</Th>
          <Th>Processed</Th>
          <Th>Provider request</Th>
          <Th>Error</Th>
        </tr>
      </thead>
      <tbody>
        {items.map((item) => (
          <tr key={item.id}>
            <Td>
              <PublicId label={`W-${item.id}`} />
              <div>{formatDateTime(item.receivedAt, language)}</div>
            </Td>
            <Td>
              <Badge variant={statusVariant(item.processingStatus)}>{item.processingStatus}</Badge>
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
        ))}
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

function SkeletonRows() {
  return (
    <Card className="text-[13px] py-10" style={{ color: 'var(--eco-text-tertiary)' }}>
      Loading operations...
    </Card>
  );
}

function EmptyOps() {
  return (
    <Card className="text-center text-[13px] py-10">
      <span style={{ color: 'var(--eco-text-tertiary)' }}>No operations in this queue.</span>
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
