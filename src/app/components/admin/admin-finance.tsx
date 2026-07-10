import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { Link, useSearchParams } from 'react-router';
import { AdminLayout } from './admin-layout';
import { Badge, Button, Card, Input, Select } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { formatDateTime } from '../../lib/datetime';
import { formatAdminApiError } from './admin-action-ui';
import {
  getAdminFinanceRefundsRequest,
  getAdminFinanceTransactionsRequest,
  type FinanceRefundDto,
  type FinanceTransactionDto,
} from '../../lib/api';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

type FinanceTab = 'revenue' | 'refunds' | 'subscriptions';
const TABS: FinanceTab[] = ['revenue', 'refunds', 'subscriptions'];
const PAGE_SIZE = 20;

const TX_STATUS_OPTIONS = ['PENDING', 'SUCCESS', 'FAILED', 'REFUNDED_PARTIAL', 'REFUNDED_FULL'];
const REFUND_STATUS_OPTIONS = ['PENDING', 'SUCCESS', 'FAILED'];

function parseTab(value: string | null): FinanceTab {
  if (value && (TABS as string[]).includes(value)) return value as FinanceTab;
  return 'revenue';
}

function formatMoney(amount: number | string | null | undefined, currency: string | null): string {
  if (amount == null) return '—';
  const num = typeof amount === 'string' ? Number(amount) : amount;
  if (Number.isNaN(num)) return String(amount);
  const cur = currency || 'KZT';
  const formatted = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 2 }).format(num);
  if (cur === 'KZT') return `₸${formatted}`;
  return `${formatted} ${cur}`;
}

// Colour a transaction/refund status badge according to the intent it conveys.
// Kept in sync with the enum values on the backend (see PaymentTransactionStatus,
// RefundStatus). Unknown values fall through to a neutral default.
function statusVariant(
  status: string | null,
): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (!status) return 'default';
  switch (status) {
    case 'SUCCESS':
      return 'success';
    case 'FAILED':
      return 'danger';
    case 'PENDING':
      return 'warning';
    case 'REFUNDED_PARTIAL':
      return 'warning';
    case 'REFUNDED_FULL':
      return 'info';
    default:
      return 'default';
  }
}

// Renders a user reference as a link into /admin/users?selected=<id> so the
// operator can jump straight to the profile panel — mirrors the pattern
// used in admin-users detail deep-links.
function UserRef({ id, name }: { id: number | null; name: string | null }) {
  if (id == null) return <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>;
  const label = name ?? `U-${id}`;
  return (
    <Link
      to={`/admin/users?selected=${id}`}
      style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
    >
      {label}
    </Link>
  );
}

function RoomRef({ id, title }: { id: number | null; title: string | null }) {
  if (id == null) return <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>;
  const label = title ? `R-${id} · ${title}` : `R-${id}`;
  return (
    <Link
      to={`/admin/rooms?selected=${id}`}
      style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
    >
      {label}
    </Link>
  );
}

// Serialize a date filter as ISO-8601 with the day boundary that makes sense on
// each side (00:00 for `from`, 23:59:59 for `to`) so a single-day range still
// matches rows recorded later that same day. Times are treated as local wall
// clock and sent to the backend, which stores in Asia/Almaty.
function dateToIsoStart(value: string | null): string | undefined {
  if (!value) return undefined;
  return `${value}T00:00:00`;
}
function dateToIsoEnd(value: string | null): string | undefined {
  if (!value) return undefined;
  return `${value}T23:59:59`;
}

export function AdminFinancePage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = parseTab(searchParams.get('tab'));

  const setTab = (next: FinanceTab) => {
    if (next === tab) return;
    const params = new URLSearchParams(searchParams);
    params.set('tab', next);
    // Reset filters when the operator switches segments — status / type enums
    // are segment-specific and would otherwise 400 on the next fetch.
    params.delete('status');
    params.delete('type');
    params.delete('dateFrom');
    params.delete('dateTo');
    params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [page, setPage] = useState(0);

  // When the tab flips, blank the local filters so the previous segment's
  // enum values don't leak through — the URL wipe above triggers this effect.
  useEffect(() => {
    setStatus('');
    setType('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  }, [tab]);

  const [txItems, setTxItems] = useState<FinanceTransactionDto[]>([]);
  const [refundItems, setRefundItems] = useState<FinanceRefundDto[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (tab === 'subscriptions') {
      // v1 does not have a subscriptions listing endpoint yet — render the
      // empty placeholder and skip the network call.
      setTxItems([]);
      setRefundItems([]);
      setTotalPages(1);
      setTotalItems(0);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      if (tab === 'revenue') {
        const result = await authorizedRequest((token) =>
          getAdminFinanceTransactionsRequest(token, {
            type: type || undefined,
            status: status || undefined,
            dateFrom: dateToIsoStart(dateFrom || null),
            dateTo: dateToIsoEnd(dateTo || null),
            page,
            size: PAGE_SIZE,
          }),
        );
        setTxItems(result.items);
        setTotalPages(Math.max(1, result.totalPages));
        setTotalItems(result.totalItems);
      } else {
        const result = await authorizedRequest((token) =>
          getAdminFinanceRefundsRequest(token, {
            status: status || undefined,
            dateFrom: dateToIsoStart(dateFrom || null),
            dateTo: dateToIsoEnd(dateTo || null),
            page,
            size: PAGE_SIZE,
          }),
        );
        setRefundItems(result.items);
        setTotalPages(Math.max(1, result.totalPages));
        setTotalItems(result.totalItems);
      }
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [tab, type, status, dateFrom, dateTo, page, authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const resetFilters = () => {
    setStatus('');
    setType('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const statusOptions = useMemo(() => {
    const values = tab === 'revenue' ? TX_STATUS_OPTIONS : REFUND_STATUS_OPTIONS;
    return [
      { value: '', label: t('financeFilterAll') },
      ...values.map((v) => ({ value: v, label: v })),
    ];
  }, [tab, t]);

  const typeOptions = useMemo(
    () => [
      { value: '', label: t('financeFilterAll') },
      { value: 'CHARGE', label: 'CHARGE' },
      { value: 'REFUND', label: 'REFUND' },
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
          <div>
            <h1
              className="text-[24px]"
              style={{ color: 'var(--eco-text)', letterSpacing: '-0.02em', fontWeight: 500 }}
            >
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
          {TABS.map((k) => {
            const active = tab === k;
            const label =
              k === 'revenue'
                ? t('financeTabRevenue')
                : k === 'refunds'
                  ? t('financeTabRefunds')
                  : t('financeTabSubscriptions');
            return (
              <button
                key={k}
                type="button"
                onClick={() => setTab(k)}
                className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer"
                style={{
                  background: active ? 'var(--eco-brand-50)' : 'var(--eco-surface-raised)',
                  border: `1px solid ${active ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                  color: active ? 'var(--eco-primary)' : 'var(--eco-text-secondary)',
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        {tab !== 'subscriptions' && (
          <Card className="flex flex-col gap-3 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {tab === 'revenue' && (
                <Select
                  label={t('financeFilterType')}
                  value={type}
                  onChange={(e) => {
                    setType(e.target.value);
                    setPage(0);
                  }}
                  options={typeOptions}
                />
              )}
              <Select
                label={t('financeFilterStatus')}
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
                options={statusOptions}
              />
              <Input
                label={t('financeFilterDateFrom')}
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setPage(0);
                }}
              />
              <Input
                label={t('financeFilterDateTo')}
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setPage(0);
                }}
              />
              <div className="flex items-end">
                <Button variant="ghost" size="sm" onClick={resetFilters}>
                  {t('financeFilterReset')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {error && (
          <Card className="flex flex-col gap-2 mb-4">
            <div className="text-[14px]" style={{ color: 'var(--eco-negative)' }}>
              {t('loadFailedTitle')}
            </div>
            <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {error}
            </div>
            <div>
              <Button variant="primary" size="sm" onClick={() => void load()}>
                <RefreshCw size={13} /> {t('retry')}
              </Button>
            </div>
          </Card>
        )}

        {tab === 'subscriptions' ? (
          <Card
            className="flex items-center justify-center py-16 text-[14px] text-center"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            {t('financeSubscriptionsPending')}
          </Card>
        ) : tab === 'revenue' ? (
          <TransactionsTable items={txItems} language={language} loading={loading} />
        ) : (
          <RefundsTable items={refundItems} language={language} loading={loading} />
        )}

        {tab !== 'subscriptions' && totalItems > 0 && (
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
  const { t } = useI18n();
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl"
            style={{
              background: 'var(--eco-surface-raised)',
              border: '1px solid var(--eco-border)',
              minHeight: 60,
            }}
          />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <Card className="text-center text-[13px] py-10">
        <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('financeEmptyList')}</span>
      </Card>
    );
  }
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--eco-surface-raised)',
        border: '1px solid var(--eco-border)',
      }}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-[13px]"
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <thead>
            <tr style={{ background: 'var(--eco-surface)' }}>
              <Th>{t('financeColDate')}</Th>
              <Th>{t('financeColType')}</Th>
              <Th>{t('financeColStatus')}</Th>
              <Th className="text-right">{t('financeColAmount')}</Th>
              <Th>{t('financeColRoom')}</Th>
              <Th>{t('financeColOwner')}</Th>
              <Th>{t('financeColPayer')}</Th>
              <Th>{t('financeColProvider')}</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((tx) => (
              <tr key={tx.id} style={{ borderTop: '1px solid var(--eco-border)' }}>
                <Td>
                  <span
                    style={{
                      color: 'var(--eco-text-tertiary)',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  >
                    T-{tx.id}
                  </span>
                  <div>{formatDateTime(tx.createdAt, language)}</div>
                </Td>
                <Td>
                  <Badge variant={tx.type === 'REFUND' ? 'warning' : 'default'}>
                    {tx.type ?? '—'}
                  </Badge>
                </Td>
                <Td>
                  <Badge variant={statusVariant(tx.status)}>{tx.status ?? '—'}</Badge>
                </Td>
                <Td className="text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(tx.amount, tx.currency)}
                </Td>
                <Td>
                  <RoomRef id={tx.roomId} title={tx.roomTitle} />
                </Td>
                <Td>
                  <UserRef id={tx.ownerUserId} name={tx.ownerDisplayName} />
                </Td>
                <Td>
                  <UserRef id={tx.payerUserId} name={tx.payerDisplayName} />
                </Td>
                <Td>
                  <span style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx.providerName ?? '—'}
                  </span>
                  {tx.cardPanMask && (
                    <div
                      style={{
                        color: 'var(--eco-text-tertiary)',
                        fontFamily: 'monospace',
                        fontSize: 11,
                      }}
                    >
                      {tx.cardPanMask}
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
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
  const { t } = useI18n();
  if (loading && items.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-xl"
            style={{
              background: 'var(--eco-surface-raised)',
              border: '1px solid var(--eco-border)',
              minHeight: 60,
            }}
          />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <Card className="text-center text-[13px] py-10">
        <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('financeEmptyList')}</span>
      </Card>
    );
  }
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--eco-surface-raised)',
        border: '1px solid var(--eco-border)',
      }}
    >
      <div className="overflow-x-auto">
        <table
          className="w-full text-[13px]"
          style={{ borderCollapse: 'separate', borderSpacing: 0 }}
        >
          <thead>
            <tr style={{ background: 'var(--eco-surface)' }}>
              <Th>{t('financeColDate')}</Th>
              <Th>{t('financeColStatus')}</Th>
              <Th className="text-right">{t('financeColAmount')}</Th>
              <Th>{t('financeColRoom')}</Th>
              <Th>{t('financeColMember')}</Th>
              <Th>{t('financeColRefundedBy')}</Th>
              <Th>{t('financeColReason')}</Th>
              <Th>{t('financeColDispute')}</Th>
            </tr>
          </thead>
          <tbody>
            {items.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid var(--eco-border)' }}>
                <Td>
                  <span
                    style={{
                      color: 'var(--eco-text-tertiary)',
                      fontFamily: 'monospace',
                      fontSize: 11,
                    }}
                  >
                    RF-{r.id}
                  </span>
                  <div>{formatDateTime(r.createdAt, language)}</div>
                </Td>
                <Td>
                  <Badge variant={statusVariant(r.status)}>{r.status ?? '—'}</Badge>
                </Td>
                <Td className="text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {formatMoney(r.amount, r.currency)}
                </Td>
                <Td>
                  <RoomRef id={r.roomId} title={r.roomTitle} />
                </Td>
                <Td>
                  <UserRef id={r.memberUserId} name={r.memberDisplayName} />
                </Td>
                <Td>
                  <UserRef id={r.adminUserId} name={r.adminDisplayName} />
                </Td>
                <Td>
                  <span
                    style={{
                      color: 'var(--eco-text-secondary)',
                      display: 'block',
                      maxWidth: 240,
                      whiteSpace: 'normal',
                    }}
                  >
                    {r.reason ?? '—'}
                  </span>
                </Td>
                <Td>
                  {r.disputeId != null ? (
                    <span style={{ color: 'var(--eco-text-secondary)', fontFamily: 'monospace' }}>
                      D-{r.disputeId}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <th
      className={`px-3 py-2 text-left text-[11px] uppercase ${className ?? ''}`}
      style={{
        color: 'var(--eco-text-tertiary)',
        letterSpacing: '0.08em',
        fontWeight: 600,
      }}
    >
      {children}
    </th>
  );
}

function Td({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <td
      className={`px-3 py-2 align-top ${className ?? ''}`}
      style={{ color: 'var(--eco-text)', ...style }}
    >
      {children}
    </td>
  );
}
