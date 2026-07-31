import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Select, Skeleton } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime, formatNumber } from '../../lib/datetime';
import {
  ApiError,
  getPaymentHistoryRequest,
  type PaymentHistoryItemDto,
  type PagedResponse,
} from '../../lib/api';

type L = Language;

const tx = (l: L, ru: string, kz: string, en: string) => (l === 'ru' ? ru : l === 'kz' ? kz : en);

const PAGE_SIZE = 12;

function money(amount: number | string, currency: string): string {
  const value = Number(amount);
  const formatted = Number.isFinite(value) ? formatNumber(value) : String(amount);
  return currency === 'KZT' ? `₸${formatted}` : `${currency} ${formatted}`;
}

function statusVariant(status: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
  const s = status.toUpperCase();
  if (['SUCCESS', 'SUCCEEDED', 'COMPLETED', 'ACTIVE', 'SENT', 'PROCESSED', 'PAID'].includes(s)) {
    return 'success';
  }
  if (['FAILED', 'REJECTED', 'CANCELLED', 'EXPIRED', 'ERROR'].includes(s)) return 'danger';
  if (['PENDING', 'QUEUED', 'HOLD'].includes(s)) return 'warning';
  if (['PROCESSING', 'APPROVED', 'REQUESTED', 'IN_REVIEW'].includes(s)) return 'info';
  return 'default';
}

function kindLabel(kind: string, l: L): string {
  const k = kind.toUpperCase();
  if (k === 'PAYMENT') return tx(l, 'Платёж', 'Төлем', 'Payment');
  if (k === 'REFUND') return tx(l, 'Возврат', 'Қайтару', 'Refund');
  if (k === 'PAYOUT') return tx(l, 'Выплата', 'Аударым', 'Payout');
  return kind;
}

function directionLabel(direction: string, l: L): string {
  const d = direction.toUpperCase();
  if (d === 'INCOMING') return tx(l, 'Входящий', 'Кіріс', 'Incoming');
  if (d === 'OUTGOING') return tx(l, 'Исходящий', 'Шығыс', 'Outgoing');
  return direction;
}

function statusLabel(status: string, l: L): string {
  const s = status.toUpperCase();
  const labels: Record<string, [string, string, string]> = {
    SUCCESS: ['Успешно', 'Сәтті', 'Success'],
    SUCCEEDED: ['Успешно', 'Сәтті', 'Succeeded'],
    COMPLETED: ['Завершён', 'Аяқталды', 'Completed'],
    PAID: ['Оплачен', 'Төленді', 'Paid'],
    SENT: ['Отправлен', 'Жіберілді', 'Sent'],
    PROCESSED: ['Обработан', 'Өңделді', 'Processed'],
    PENDING: ['Ожидает', 'Күтуде', 'Pending'],
    QUEUED: ['В очереди', 'Кезекте', 'Queued'],
    HOLD: ['Удержание', 'Ұсталым', 'Hold'],
    PROCESSING: ['Обрабатывается', 'Өңделуде', 'Processing'],
    APPROVED: ['Одобрен', 'Мақұлданды', 'Approved'],
    REQUESTED: ['Запрошен', 'Сұралды', 'Requested'],
    IN_REVIEW: ['На проверке', 'Тексеруде', 'In review'],
    FAILED: ['Ошибка', 'Сәтсіз', 'Failed'],
    REJECTED: ['Отклонён', 'Қабылданбады', 'Rejected'],
    CANCELLED: ['Отменён', 'Бас тартылды', 'Cancelled'],
    EXPIRED: ['Истёк', 'Мерзімі өтті', 'Expired'],
  };
  const entry = labels[s];
  return entry ? tx(l, ...entry) : status.replace(/_/g, ' ');
}

function historyDate(item: PaymentHistoryItemDto): string | null {
  return (
    item.completedAt ??
    item.processedAt ??
    item.paidAt ??
    item.date ??
    item.updatedAt ??
    item.createdAt ??
    null
  );
}

function operationIds(item: PaymentHistoryItemDto): string[] {
  return [
    item.operationId ? `OP-${item.operationId}` : null,
    item.paymentTransactionId ? `TX-${item.paymentTransactionId}` : null,
    item.paymentIntentId ? `PI-${item.paymentIntentId}` : null,
    item.refundId ? `RF-${item.refundId}` : null,
    item.payoutId ? `PO-${item.payoutId}` : null,
    item.id ? `${item.kind.toUpperCase()}-${item.id}` : null,
  ].filter(Boolean) as string[];
}

function cardMask(item: PaymentHistoryItemDto): string | null {
  return item.cardMask ?? item.panMask ?? item.paymentMethodMask ?? null;
}

function signedAmount(item: PaymentHistoryItemDto): string {
  const direction = item.direction.toUpperCase();
  const kind = item.kind.toUpperCase();
  const sign = direction === 'INCOMING' || kind === 'REFUND' ? '+' : '−';
  return `${sign}${money(item.amount, item.currency)}`;
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <Card className="py-4">
      <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {label}
      </div>
      <div className="text-[20px] mt-1" style={{ color: 'var(--eco-text)', fontWeight: 650 }}>
        {value}
      </div>
    </Card>
  );
}

function HistorySkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i} className="flex flex-col gap-3">
          <Skeleton width="35%" height={14} />
          <Skeleton width="65%" height={16} />
        </Card>
      ))}
    </div>
  );
}

function PaymentHistoryTable({ items, language }: { items: PaymentHistoryItemDto[]; language: L }) {
  return (
    <>
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--eco-border)' }}>
              {[
                tx(language, 'Операция', 'Операция', 'Operation'),
                tx(language, 'Комната', 'Бөлме', 'Room'),
                tx(language, 'Дата', 'Күні', 'Date'),
                tx(language, 'Статус', 'Мәртебе', 'Status'),
                tx(language, 'Сумма', 'Сома', 'Amount'),
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-[12px] whitespace-nowrap"
                  style={{ color: 'var(--eco-text-tertiary)', fontWeight: 500 }}
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const ids = operationIds(item);
              const date = historyDate(item);
              const mask = cardMask(item);
              return (
                <tr
                  key={ids[0] ?? `${item.kind}-${idx}`}
                  style={{ borderBottom: '1px solid var(--eco-border)' }}
                >
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1 min-w-[170px]">
                      <div className="flex items-center gap-2">
                        <Badge variant="info">{kindLabel(item.kind, language)}</Badge>
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          {directionLabel(item.direction, language)}
                        </span>
                      </div>
                      <div
                        className="text-[12px] truncate"
                        title={ids.join(' · ')}
                        style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
                      >
                        {ids.join(' · ') || '—'}
                      </div>
                      {mask && (
                        <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {mask}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="max-w-[260px]">
                      <div
                        className="text-[13px] line-clamp-2"
                        title={item.roomTitle ?? undefined}
                        style={{ color: 'var(--eco-text)' }}
                      >
                        {item.roomTitle ?? '—'}
                      </div>
                      {item.roomId != null && (
                        <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          #{item.roomId}
                        </div>
                      )}
                    </div>
                  </td>
                  <td
                    className="px-4 py-4 align-top text-[13px] whitespace-nowrap"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    {date ? formatDateTime(date, language) : '—'}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant={statusVariant(item.status)}>{statusLabel(item.status, language)}</Badge>
                  </td>
                  <td
                    className="px-4 py-4 align-top text-[14px] text-right whitespace-nowrap"
                    style={{ color: 'var(--eco-text)', fontWeight: 650 }}
                  >
                    {signedAmount(item)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {items.map((item, idx) => {
          const ids = operationIds(item);
          const date = historyDate(item);
          const mask = cardMask(item);
          return (
            <Card key={ids[0] ?? `${item.kind}-${idx}`} className="flex flex-col gap-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="info">{kindLabel(item.kind, language)}</Badge>
                    <Badge variant={statusVariant(item.status)}>
                      {statusLabel(item.status, language)}
                    </Badge>
                  </div>
                  <div className="text-[13px] mt-2" style={{ color: 'var(--eco-text)' }}>
                    {item.roomTitle ?? '—'}
                  </div>
                </div>
                <div
                  className="text-[15px] whitespace-nowrap"
                  style={{ color: 'var(--eco-text)', fontWeight: 650 }}
                >
                  {signedAmount(item)}
                </div>
              </div>
              <div className="grid grid-cols-1 gap-1 text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                <div className="truncate" title={ids.join(' · ')}>
                  {ids.join(' · ') || '—'}
                </div>
                <div>{date ? formatDateTime(date, language) : '—'}</div>
                {mask && <div>{mask}</div>}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}

export function PaymentHistoryPage() {
  const { language } = useI18n();
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();
  const [page, setPage] = useState(0);
  const [kind, setKind] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [period, setPeriod] = useState('ALL');
  const [data, setData] = useState<PagedResponse<PaymentHistoryItemDto> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const periodBounds = useMemo(() => {
    if (period === 'ALL') return {};
    const now = new Date();
    const from = new Date(now);
    if (period === '7D') from.setDate(now.getDate() - 7);
    if (period === '30D') from.setDate(now.getDate() - 30);
    if (period === '90D') from.setDate(now.getDate() - 90);
    return { from: from.toISOString().slice(0, 10), to: now.toISOString().slice(0, 10) };
  }, [period]);

  useEffect(() => {
    setPage(0);
  }, [kind, status, period]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    authorizedRequest((token) =>
      getPaymentHistoryRequest(token, {
        page,
        size: PAGE_SIZE,
        kind: kind === 'ALL' ? undefined : kind,
        status: status === 'ALL' ? undefined : status,
        ...periodBounds,
      }),
    )
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : tx(
                language,
                'Не удалось загрузить историю платежей.',
                'Төлем тарихын жүктеу мүмкін болмады.',
                'Unable to load payment history.',
              ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [
    authorizedRequest,
    isAuthenticated,
    isReady,
    kind,
    language,
    page,
    periodBounds,
    reloadKey,
    status,
  ]);

  const items = data?.items ?? [];
  const currentPageIncoming = items
    .filter((item) => item.direction.toUpperCase() === 'INCOMING')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const currentPageOutgoing = items
    .filter((item) => item.direction.toUpperCase() === 'OUTGOING')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div className="max-w-[1120px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(language, 'Профиль', 'Профиль', 'Profile')}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[24px] sm:text-[28px] mb-2" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'История платежей', 'Төлем тарихы', 'Payment history')}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Платежи, возвраты и выплаты по вашим комнатам.',
              'Бөлмелеріңіз бойынша төлемдер, қайтарулар және аударымдар.',
              'Payments, refunds and payouts for your rooms.',
            )}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={loading}
          onClick={() => {
            setData(null);
            setPage(0);
            setReloadKey((key) => key + 1);
          }}
        >
          <RefreshCw size={14} /> {tx(language, 'Обновить', 'Жаңарту', 'Refresh')}
        </Button>
      </div>

      {!isAuthenticated && isReady ? (
        <Card>
          <Link
            to="/login?redirect=/payments/history"
            className="text-[14px]"
            style={{ color: 'var(--eco-primary)' }}
          >
            {tx(
              language,
              'Войдите, чтобы увидеть историю платежей',
              'Төлем тарихын көру үшін кіріңіз',
              'Sign in to view payment history',
            )}
          </Link>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <SummaryBlock
              label={tx(language, 'Всего операций', 'Барлық операциялар', 'Total operations')}
              value={data ? formatNumber(data.totalItems) : '—'}
            />
            <SummaryBlock
              label={tx(language, 'Входящие на странице', 'Беттегі кіріс', 'Incoming on page')}
              value={money(currentPageIncoming, 'KZT')}
            />
            <SummaryBlock
              label={tx(language, 'Исходящие на странице', 'Беттегі шығыс', 'Outgoing on page')}
              value={money(currentPageOutgoing, 'KZT')}
            />
          </div>

          <Card className="mb-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label={tx(language, 'Тип', 'Түрі', 'Type')}
                value={kind}
                onChange={(event) => setKind(event.target.value)}
                options={[
                  { value: 'ALL', label: tx(language, 'Все типы', 'Барлық түрлер', 'All types') },
                  { value: 'PAYMENT', label: kindLabel('PAYMENT', language) },
                  { value: 'REFUND', label: kindLabel('REFUND', language) },
                  { value: 'PAYOUT', label: kindLabel('PAYOUT', language) },
                ]}
              />
              <Select
                label={tx(language, 'Статус', 'Мәртебе', 'Status')}
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                options={[
                  {
                    value: 'ALL',
                    label: tx(language, 'Все статусы', 'Барлық мәртебелер', 'All statuses'),
                  },
                  { value: 'SUCCESS', label: statusLabel('SUCCESS', language) },
                  { value: 'PENDING', label: statusLabel('PENDING', language) },
                  { value: 'PROCESSING', label: statusLabel('PROCESSING', language) },
                  { value: 'FAILED', label: statusLabel('FAILED', language) },
                ]}
              />
              <Select
                label={tx(language, 'Период', 'Кезең', 'Period')}
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
                options={[
                  { value: 'ALL', label: tx(language, 'За всё время', 'Барлық уақыт', 'All time') },
                  { value: '7D', label: tx(language, '7 дней', '7 күн', '7 days') },
                  { value: '30D', label: tx(language, '30 дней', '30 күн', '30 days') },
                  { value: '90D', label: tx(language, '90 дней', '90 күн', '90 days') },
                ]}
              />
            </div>
          </Card>

          {loading ? (
            <HistorySkeleton />
          ) : error ? (
            <Card className="flex flex-col gap-3 items-start">
              <div
                className="flex items-center gap-2 text-[14px]"
                style={{ color: 'var(--eco-negative)' }}
              >
                <AlertCircle size={15} /> {error}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setReloadKey((key) => key + 1)}
              >
                {tx(language, 'Попробовать снова', 'Қайта көру', 'Try again')}
              </Button>
            </Card>
          ) : items.length === 0 ? (
            <EmptyState
              title={tx(language, 'Операций пока нет', 'Әзірге операциялар жоқ', 'No operations yet')}
              description={tx(
                language,
                'Когда появятся платежи, возвраты или выплаты, они будут здесь.',
                'Төлемдер, қайтарулар немесе аударымдар пайда болса, олар осында көрсетіледі.',
                'Payments, refunds or payouts will appear here once they exist.',
              )}
            />
          ) : (
            <Card className="p-0 overflow-hidden">
              <PaymentHistoryTable items={items} language={language} />
              <div
                className="flex items-center justify-between gap-3 px-4 py-3 border-t"
                style={{ borderColor: 'var(--eco-border)' }}
              >
                <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {tx(language, 'Страница', 'Бет', 'Page')} {(data?.page ?? page) + 1}
                  {data?.totalPages ? ` / ${data.totalPages}` : ''}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!data?.hasPrevious}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!data?.hasNext}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
