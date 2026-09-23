import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { AlertCircle, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Select, Skeleton } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime, formatNumber, formatShortDmyDate } from '../../lib/datetime';
import {
  ApiError,
  getPaymentHistoryRequest,
  type PaymentHistoryItemDto,
  type PagedResponse,
} from '../../lib/api';
import { userStatusLabel } from '../../lib/user-facing-enums';

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
  return tx(l, 'Операция', 'Операция', 'Operation');
}

function directionLabel(direction: string, l: L): string {
  const d = normalizeDirection(direction);
  if (d === 'INCOMING') return tx(l, 'Входящий', 'Кіріс', 'Incoming');
  if (d === 'OUTGOING') return tx(l, 'Исходящий', 'Шығыс', 'Outgoing');
  return tx(l, 'Операция', 'Операция', 'Operation');
}

export function normalizeDirection(direction: string | null | undefined): 'INCOMING' | 'OUTGOING' | null {
  const value = direction?.toUpperCase();
  if (value === 'CREDIT' || value === 'INCOMING') return 'INCOMING';
  if (value === 'DEBIT' || value === 'OUTGOING') return 'OUTGOING';
  return null;
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
    PENDING_METHOD: ['Ожидает способ выплаты', 'Төлем әдісін күтуде', 'Awaiting payout method'],
    FROZEN: ['Удерживается EcoPay', 'EcoPay ұстап тұр', 'Held by EcoPay'],
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
  return entry ? tx(l, ...entry) : userStatusLabel(status, l);
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
  return item.cardMask ?? item.panMask ?? item.cardPanMask ?? item.paymentMethodMask ?? null;
}

function signedAmount(item: PaymentHistoryItemDto): string {
  const direction = normalizeDirection(item.direction);
  const kind = item.kind.toUpperCase();
  const sign = direction === 'INCOMING' || (!direction && kind === 'REFUND') ? '+' : '−';
  return `${sign}${money(item.amountKzt ?? item.amount, item.settlementCurrency ?? item.currency)}`;
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

function operationCopy(item: PaymentHistoryItemDto, language: L) {
  const room = item.roomTitle || tx(language, 'эта комната', 'осы бөлме', 'this room');
  const kind = item.kind.toUpperCase();
  if (kind === 'REFUND') return { title: tx(language, 'Возврат', 'Қайтару', 'Refund'), detail: tx(language, `Возврат по комнате ${room}`, `${room} бөлмесі бойынша қайтарым`, `Refund for ${room}`), secondary: tx(language, 'Возвращено вам', 'Сізге қайтарылды', 'Returned to you') };
  if (kind === 'PAYOUT') return { title: tx(language, 'Выплата', 'Аударым', 'Payout'), detail: tx(language, `Выплата вам за комнату ${room}`, `${room} бөлмесі үшін сізге аударым`, `Payout to you for ${room}`), secondary: null };
  return { title: tx(language, 'Оплата участия', 'Қатысу төлемі', 'Participation payment'), detail: tx(language, `Комната: ${room}`, `Бөлме: ${room}`, `Room: ${room}`), secondary: null };
}

function PaymentHistoryTable({ items, language }: { items: PaymentHistoryItemDto[]; language: L }) {
  return (
    <div className="flex flex-col divide-y" style={{ borderColor: 'var(--eco-border)' }}>
      {items.map((item, idx) => {
        const ids = operationIds(item); const date = historyDate(item); const mask = cardMask(item); const copy = operationCopy(item, language);
        const held = item.kind.toUpperCase() === 'PAYOUT' && ['FROZEN', 'PENDING', 'PENDING_METHOD'].includes(item.status.toUpperCase()) && item.releaseAt && Date.parse(item.releaseAt) > Date.now();
        return <div key={ids[0] ?? `${item.kind}-${idx}`} className="p-4 sm:px-5 flex flex-col gap-2"><div className="flex flex-col sm:flex-row sm:items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2 flex-wrap"><span className="text-[15px]" style={{ color: 'var(--eco-text)', fontWeight: 600 }}>{copy.title}</span><Badge variant={statusVariant(item.status)}>{statusLabel(item.status, language)}</Badge></div><div className="text-[13px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>{item.roomId != null ? <Link to={`/rooms/${item.roomId}`} style={{ color: 'var(--eco-primary)' }}>{copy.detail}</Link> : copy.detail}</div><div className="text-[12px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>{copy.secondary ?? (mask ? tx(language, `Списано с карты ${mask}`, `${mask} картасынан алынды`, `Charged to card ${mask}`) : item.providerName || directionLabel(item.direction, language))}</div>{held && <div className="text-[12px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>{tx(language, `EcoPay удерживает до ${formatShortDmyDate(item.releaseAt)}`, `EcoPay ${formatShortDmyDate(item.releaseAt)} дейін ұстайды`, `EcoPay holds it until ${formatShortDmyDate(item.releaseAt)}`)}</div>}</div><div className="sm:text-right shrink-0"><div className="text-[16px]" style={{ color: 'var(--eco-text)', fontWeight: 650 }}>{signedAmount(item)}</div><div className="text-[12px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>{date ? formatDateTime(date, language) : '—'}</div></div></div><details className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}><summary className="cursor-pointer">{tx(language, 'Детали операции', 'Операция мәліметтері', 'Operation details')}</summary><div className="mt-2 break-all">{ids.join(' · ') || '—'}{item.providerName ? ` · ${item.providerName}` : ''}{mask ? ` · ${mask}` : ''}{item.failureCode ? ` · ${item.failureCode}` : ''}</div></details></div>;
      })}
    </div>
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
    .filter((item) => normalizeDirection(item.direction) === 'INCOMING')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const currentPageOutgoing = items
    .filter((item) => normalizeDirection(item.direction) === 'OUTGOING')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const currencies = new Set(items.map((item) => item.settlementCurrency ?? item.currency).filter(Boolean));
  const summaryCurrency = currencies.size === 1 ? [...currencies][0] : null;

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8">
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
              label={tx(language, 'Получено на этой странице', 'Осы бетте алынғаны', 'Received on this page')}
              value={summaryCurrency ? money(currentPageIncoming, summaryCurrency) : '—'}
            />
            <SummaryBlock
              label={tx(language, 'Потрачено на этой странице', 'Осы бетте жұмсалғаны', 'Spent on this page')}
              value={summaryCurrency ? money(currentPageOutgoing, summaryCurrency) : '—'}
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
