import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Card, Badge, Button, Skeleton, EmptyState } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime, formatNumber } from '../../lib/datetime';
import {
  Clock,
  Shield,
  CreditCard,
  MessageSquare,
  ArrowLeft,
  Mail,
  Timer,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  ApiError,
  deletePayoutMethodRequest,
  getMyPayoutsRequest,
  getMyRefundsRequest,
  getMyRefundClaimsRequest,
  getPayoutBalanceRequest,
  getPayoutMethodsRequest,
  type PayoutBalanceDto,
  type PayoutDto,
  type PayoutMethodDto,
  type RefundTransactionResponse,
  type RefundRequestResponse as RefundClaimResponse,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { appBrand } from '../../config/brand';
import {
  isUsablePayoutMethod,
  payoutMethodNeedsRebind,
  readPendingBinding,
  startPayoutCardBinding,
} from '../../lib/payout-binding';

// ─── Localized text helper ───
type L = Language;
const tx = (l: L, ru: string, kz: string, en: string) => (l === 'ru' ? ru : l === 'kz' ? kz : en);

// ─── Payment footer (shared by refund & payout pages) ───
function PaymentFooter({ lang }: { lang: L }) {
  const links = [
    { label: tx(lang, 'Публичная оферта', 'Жария оферта', 'Public Offer'), href: '/terms' },
    { label: tx(lang, 'Реквизиты', 'Деректемелер', 'Company Details'), href: '/about' },
    {
      label: tx(lang, 'Политика конфиденциальности', 'Құпиялылық саясаты', 'Privacy Policy'),
      href: '/privacy',
    },
    { label: tx(lang, 'Порядок оплаты', 'Төлем тәртібі', 'Payment Procedure'), href: '/terms' },
  ];
  return (
    <div className="mt-12 pt-6 border-t" style={{ borderColor: 'var(--eco-border)' }}>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mb-4">
        {links.map((l) => (
          <Link
            key={l.label}
            to={l.href}
            className="text-[12px]"
            style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
          >
            {l.label}
          </Link>
        ))}
      </div>
      <div
        className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-[12px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        {appBrand.supportEmail && (
          <span className="flex items-center gap-1.5">
            <Mail size={11} /> {appBrand.supportEmail}
          </span>
        )}
      </div>
      <div className="text-[11px] mt-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(lang, '© 2026 EcoPay', '© 2026 EcoPay', '© 2026 EcoPay')}
      </div>
    </div>
  );
}

// ─── 5) Refund Status (history) ───
function refundStatusVariant(s: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
  const u = s.toUpperCase();
  if (u === 'SUCCESS' || u === 'COMPLETED' || u === 'SENT' || u === 'SUCCESS_MANUAL') return 'success';
  if (u === 'FAILED' || u === 'REJECTED' || u === 'CANCELLED') return 'danger';
  if (u === 'PENDING' || u === 'REQUESTED' || u === 'PENDING_MANUAL') return 'warning';
  if (u === 'IN_REVIEW' || u === 'APPROVED' || u === 'PROCESSING') return 'info';
  return 'default';
}

const refundStatusLabel = (s: string, l: L): string => {
  const map: Record<string, [string, string, string]> = {
    SUCCESS: ['Выполнен', 'Орындалды', 'Success'],
    COMPLETED: ['Завершён', 'Аяқталды', 'Completed'],
    SENT: ['Отправлен', 'Жіберілді', 'Sent'],
    FAILED: ['Ошибка', 'Сәтсіз', 'Failed'],
    REJECTED: ['Отклонён', 'Қабылданбады', 'Rejected'],
    CANCELLED: ['Отменён', 'Бас тартылды', 'Cancelled'],
    PENDING: ['Ожидает', 'Күтуде', 'Pending'],
    REQUESTED: ['Запрошен', 'Сұратылды', 'Requested'],
    IN_REVIEW: ['На проверке', 'Тексеруде', 'In review'],
    APPROVED: ['Одобрен', 'Мақұлданды', 'Approved'],
    PROCESSING: ['Обрабатывается', 'Өңделуде', 'Processing'],
    PENDING_MANUAL: ['Возврат оформлен', 'Қайтарым рәсімделді', 'Refund registered'],
    SUCCESS_MANUAL: ['Возвращено', 'Қайтарылды', 'Refunded'],
  };
  const entry = map[s.toUpperCase()];
  return entry ? tx(l, ...entry) : tx(l, 'Обрабатывается', 'Өңделуде', 'Processing');
};

export function RefundStatusPage() {
  const { language, t } = useI18n();
  const l = language as L;
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();

  const [refunds, setRefunds] = useState<RefundTransactionResponse[]>([]);
  const [claims, setClaims] = useState<RefundClaimResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      authorizedRequest((token) => getMyRefundsRequest(token)),
      authorizedRequest((token) => getMyRefundClaimsRequest(token)).catch(() => [] as RefundClaimResponse[]),
    ])
      .then(([refundData, claimData]) => {
        if (!cancelled) {
          setRefunds(refundData);
          setClaims(claimData);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : tx(
                l,
                'Не удалось загрузить возвраты.',
                'Қайтаруларды жүктеу мүмкін болмады.',
                'Unable to load refunds right now.',
              ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, isAuthenticated, isReady]);

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'История возвратов', 'Қайтарулар тарихы', 'Refund History')}
      </h1>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'Все возвраты по вашим платежам.',
          'Төлемдеріңіз бойынша барлық қайтарулар.',
          'All refunds initiated on your payments.',
        )}
      </p>

      {!isAuthenticated && isReady ? (
        <Card>
          <Link
            to="/login?redirect=/payment/refund"
            className="text-[14px]"
            style={{ color: 'var(--eco-primary)' }}
          >
            {tx(
              l,
              'Войдите, чтобы увидеть возвраты',
              'Қайтаруларды көру үшін кіріңіз',
              'Sign in to view refunds',
            )}
          </Link>
        </Card>
      ) : loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col gap-2">
              <Skeleton width="40%" height={14} />
              <Skeleton width="60%" height={14} />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <div
            className="flex items-center gap-2 text-[14px]"
            style={{ color: 'var(--eco-negative)' }}
          >
            <AlertCircle size={15} /> {error}
          </div>
        </Card>
      ) : refunds.length === 0 ? (
        <EmptyState
          title={tx(l, 'Возвратов нет', 'Қайтарулар жоқ', 'No refunds')}
          description={tx(
            l,
            'Когда по вашему платежу начнётся возврат, он появится здесь.',
            'Төлеміңіз бойынша қайтару басталғанда, ол осында пайда болады.',
            'Refunds initiated for you will appear here.',
          )}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {refunds.map((r) => (
            <Card key={r.id} className="flex flex-col gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    className="text-[13px]"
                    style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
                  >
                    RF-{r.id}
                  </span>
                  <Badge variant={refundStatusVariant(r.status)}>
                    {refundStatusLabel(r.status, l)}
                  </Badge>
                </div>
                <div className="text-[18px]" style={{ color: 'var(--eco-primary)' }}>
                  {r.currency === 'KZT' ? '₸' : `${r.currency} `}
                  {formatNumber(Number(r.amount))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(l, 'Транзакция', 'Транзакция', 'Transaction')}
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    #{r.paymentTransactionId}
                  </div>
                </div>
                <div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(l, 'Создан', 'Жасалған', 'Created')}
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {formatDateTime(r.createdAt, l)}
                  </div>
                </div>
                {r.providerRefundId && (
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(l, 'Провайдер', 'Провайдер', 'Provider Ref')}
                    </div>
                    <div className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
                      {r.providerRefundId}
                    </div>
                  </div>
                )}
              </div>
              {r.reason && (
                <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {tx(l, 'Причина:', 'Себебі:', 'Reason:')} {r.reason}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {claims.length > 0 && (
        <>
          <h2 className="text-[18px] mt-8 mb-3" style={{ color: 'var(--eco-text)' }}>
            {t('myRefundClaims')}
          </h2>
          <div className="flex flex-col gap-3">
            {claims.map((c) => {
              const statusKey = {
                REQUESTED: 'refundClaimStatusRequested',
                UNDER_REVIEW: 'refundClaimStatusUnderReview',
                APPROVED: 'refundClaimStatusApproved',
                REJECTED: 'refundClaimStatusRejected',
              }[c.status] ?? 'refundClaimStatusRequested';
              const variant = c.status === 'APPROVED' ? 'success' : c.status === 'REJECTED' ? 'danger' : 'warning';
              return (
                <Card key={c.id} className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={variant}>{t(statusKey as 'refundClaimStatusRequested')}</Badge>
                    <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {formatDateTime(c.createdAt, l)}
                    </span>
                  </div>
                  {c.roomTitle && (
                    <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {c.roomTitle}
                    </div>
                  )}
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {c.description}
                  </div>
                  {c.decisionNote && (
                    <div className="text-[12px] p-2 rounded" style={{ background: 'var(--eco-surface)', color: 'var(--eco-text-secondary)' }}>
                      {c.decisionNote}
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </>
      )}

      <div
        className="flex items-start gap-2 p-4 rounded-lg my-6"
        style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
      >
        <Shield
          size={13}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--eco-text-tertiary)' }}
        />
        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(
            l,
            'Возврат будет зачислен на исходный способ оплаты в течение 3-10 рабочих дней после одобрения.',
            'Қайтару мақұлданғаннан кейін 3-10 жұмыс күні ішінде бастапқы төлем тәсіліне аударылады.',
            'Refund will be credited to the original payment method within 3-10 business days after approval.',
          )}
        </span>
      </div>

      <Link to="/support/new" style={{ textDecoration: 'none' }}>
        <Button variant="secondary" size="md" className="w-full">
          <MessageSquare size={14} />{' '}
          {tx(l, 'Связаться с поддержкой', 'Қолдауға хабарласу', 'Contact Support')}
        </Button>
      </Link>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 6) Owner Payouts (history + methods) ───
function payoutStatusVariant(s: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
  const u = s.toUpperCase();
  if (u === 'SUCCESS' || u === 'SENT' || u === 'PROCESSED') return 'success';
  if (u === 'FAILED' || u === 'REJECTED' || u === 'REVERSED' || u === 'REQUIRES_REBIND')
    return 'danger';
  if (
    u === 'PENDING' ||
    u === 'QUEUED' ||
    u === 'PENDING_METHOD' ||
    u === 'REQUIRES_REVIEW' ||
    u === 'FROZEN' ||
    u === 'ON_HOLD'
  )
    return 'warning';
  if (u === 'PROCESSING' || u === 'PENDING_PROVIDER') return 'info';
  return 'default';
}

function payoutStatusLabel(s: string, l: L): string {
  const map: Record<string, [string, string, string]> = {
    ACTIVE: ['Активен', 'Белсенді', 'Active'],
    INACTIVE: ['Неактивен', 'Белсенді емес', 'Inactive'],
    SUCCESS: ['Успешно', 'Сәтті', 'Success'],
    SENT: ['Отправлена', 'Жіберілді', 'Sent'],
    PROCESSED: ['Обработана', 'Өңделді', 'Processed'],
    FAILED: ['Ошибка', 'Сәтсіз', 'Failed'],
    REJECTED: ['Отклонена', 'Қабылданбады', 'Rejected'],
    PENDING: ['Ожидает', 'Күтуде', 'Pending'],
    QUEUED: ['В очереди', 'Кезекте', 'Queued'],
    PROCESSING: ['Обрабатывается', 'Өңделуде', 'Processing'],
    PENDING_PROVIDER: ['Отправлена в банк', 'Банкке жіберілді', 'Sent to the bank'],
    PENDING_METHOD: ['Нужна карта для выплат', 'Төлем картасы қажет', 'Payout card needed'],
    REQUIRES_REVIEW: ['На проверке', 'Тексеруде', 'Under review'],
    FROZEN: ['Приостановлена', 'Тоқтатылды', 'On hold'],
    REVERSED: ['Отменена', 'Кері қайтарылды', 'Reversed'],
    CANCELED: ['Отменена', 'Бас тартылды', 'Cancelled'],
    CANCELLED: ['Отменена', 'Бас тартылды', 'Cancelled'],
    REVOKED: ['Отключена', 'Өшірілген', 'Disconnected'],
    REQUIRES_REBIND: ['Нужно подключить заново', 'Қайта қосу қажет', 'Reconnect required'],
    DISABLED: ['Отключён', 'Өшірілген', 'Disabled'],
    DELETED: ['Удалён', 'Жойылған', 'Deleted'],
    ON_HOLD: ['В очереди на выплату', 'Аударым кезегінде', 'Queued for payout'],
  };
  const entry = map[s.toUpperCase()];
  return entry ? tx(l, ...entry) : tx(l, 'Обрабатывается', 'Өңделуде', 'Processing');
}

function PayoutMethodsCard({
  methods,
  loading,
  error,
  onConnect,
  connecting,
  connectError,
  onDelete,
  l,
}: {
  methods: PayoutMethodDto[];
  loading: boolean;
  error: string | null;
  onConnect: () => void;
  connecting: boolean;
  connectError: string | null;
  onDelete: (id: number) => Promise<void>;
  l: L;
}) {
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const remove = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const needsRebind = methods.some(payoutMethodNeedsRebind);
  const hasActive = methods.some(
    (m) => (m.status ?? '').toUpperCase() === 'ACTIVE' && !payoutMethodNeedsRebind(m),
  );

  return (
    <Card className="flex flex-col gap-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
          {tx(l, 'Карта для выплат', 'Төлем картасы', 'Payout card')}
        </h2>
        {!loading && !error && (
          <Button
            variant={hasActive && !needsRebind ? 'ghost' : 'primary'}
            size="sm"
            loading={connecting}
            onClick={onConnect}
          >
            {!connecting && <CreditCard size={13} aria-hidden="true" />}
            {needsRebind
              ? tx(l, 'Подключить заново', 'Қайта қосу', 'Reconnect card')
              : hasActive
                ? tx(l, 'Сменить карту', 'Картаны ауыстыру', 'Change card')
                : tx(l, 'Подключить карту для выплат', 'Төлем картасын қосу', 'Connect payout card')}
          </Button>
        )}
      </div>

      {connectError && (
        <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
          {connectError}
        </div>
      )}

      {loading ? (
        <Skeleton width="100%" height={48} />
      ) : error ? (
        <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </div>
      ) : methods.length === 0 ? (
        <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(
            l,
            'Карта для выплат пока не подключена. Подключите её, чтобы получать деньги участников.',
            'Төлем картасы әлі қосылмаған. Қатысушылардың ақшасын алу үшін оны қосыңыз.',
            'No payout card connected yet. Connect one to receive member payments.',
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {methods.map((m) => {
            const rebind = payoutMethodNeedsRebind(m);
            return (
              <div
                key={m.id}
                className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg"
                style={{
                  background: 'var(--eco-surface)',
                  border: rebind ? '1px solid var(--eco-warning)' : undefined,
                }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <CreditCard
                    size={16}
                    aria-hidden="true"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  />
                  <div className="min-w-0">
                    <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                      {tx(l, 'Карта', 'Карта', 'Card')} {m.panMask || '•••• ••••'}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {payoutStatusLabel(rebind ? 'REQUIRES_REBIND' : m.status, l)}
                      {m.isDefault ? ` · ${tx(l, 'по умолчанию', 'әдепкі', 'default')}` : ''}
                    </div>
                  </div>
                </div>
                {confirmDeleteId === m.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {tx(l, 'Отключить карту?', 'Картаны өшіру керек пе?', 'Disconnect this card?')}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={deletingId === m.id}
                      onClick={() => setConfirmDeleteId(null)}
                    >
                      {tx(l, 'Отмена', 'Болдырмау', 'Cancel')}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      loading={deletingId === m.id}
                      onClick={() => void remove(m.id)}
                    >
                      {tx(l, 'Отключить', 'Өшіру', 'Disconnect')}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDeleteId(m.id)}
                    aria-label={tx(
                      l,
                      'Отключить карту для выплат',
                      'Төлем картасын өшіру',
                      'Disconnect payout card',
                    )}
                  >
                    <Trash2 size={14} aria-hidden="true" style={{ color: 'var(--eco-negative)' }} />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}

function HeldBalanceCard({
  balance,
  loading,
  error,
  l,
}: {
  balance: PayoutBalanceDto | null;
  loading: boolean;
  error: string | null;
  l: L;
}) {
  if (loading) {
    return (
      <Card className="mb-6 flex flex-col gap-3">
        <Skeleton width="35%" height={14} />
        <Skeleton width="55%" height={30} />
        <Skeleton width="70%" height={12} />
      </Card>
    );
  }

  if (error || !balance) {
    return (
      <Card className="mb-6">
        <div
          className="flex items-center gap-2 text-[13px]"
          style={{ color: 'var(--eco-negative)' }}
        >
          <AlertCircle size={15} />
          {error ??
            tx(
              l,
              'Не удалось загрузить удерживаемый баланс.',
              'Ұсталған теңгерімді жүктеу мүмкін болмады.',
              'Unable to load the held balance.',
            )}
        </div>
      </Card>
    );
  }

  const amount = Number(balance.heldAmount).toLocaleString(
    l === 'ru' ? 'ru-RU' : l === 'kz' ? 'kk-KZ' : 'en-US',
    { minimumFractionDigits: 2, maximumFractionDigits: 2 },
  );
  const currencyPrefix = balance.currency === 'KZT' ? '₸' : `${balance.currency} `;

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} style={{ color: 'var(--eco-primary)' }} />
            <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(l, 'Сейчас удерживается', 'Қазір ұсталымда', 'Currently held')}
            </span>
          </div>
          <div className="text-[30px] leading-tight" style={{ color: 'var(--eco-primary)' }}>
            {currencyPrefix}
            {amount}
          </div>
        </div>
        <Badge variant={balance.heldPayoutCount > 0 ? 'info' : 'default'}>
          {balance.heldPayoutCount}{' '}
          {tx(l, 'выплат временно удерживается', 'аударым уақытша ұсталып тұр', 'payouts temporarily held')}
        </Badge>
      </div>

      <p className="text-[12px] mt-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'Сумма успешных платежей участников, предназначенная вам и пока удерживаемая до даты выплаты. Возвраты и отменённые выплаты не учитываются.',
          'Сізге арналған және аударым күніне дейін ұсталып тұрған қатысушылардың сәтті төлемдері. Қайтарулар мен тоқтатылған аударымдар есептелмейді.',
          'Successful member payments owed to you that EcoPay is temporarily holding until payout. Refunded and reversed payouts are excluded.',
        )}
      </p>

      {balance.nextReleaseAt && (
        <div
          className="flex items-center gap-2 mt-3 pt-3 text-[12px] border-t"
          style={{ color: 'var(--eco-text-secondary)', borderColor: 'var(--eco-border)' }}
        >
          <Timer size={14} />
          {tx(l, 'Ближайшая выплата:', 'Ең жақын аударым:', 'Next release:')}{' '}
          {formatDateTime(balance.nextReleaseAt, l)}
        </div>
      )}
    </Card>
  );
}

export function OwnerPayoutPage() {
  const { language } = useI18n();
  const l = language as L;
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();

  const [payouts, setPayouts] = useState<PayoutDto[]>([]);
  const [methods, setMethods] = useState<PayoutMethodDto[]>([]);
  const [balance, setBalance] = useState<PayoutBalanceDto | null>(null);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [loadingMethods, setLoadingMethods] = useState(true);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [payoutsError, setPayoutsError] = useState<string | null>(null);
  const [methodsError, setMethodsError] = useState<string | null>(null);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setLoadingPayouts(false);
      setLoadingMethods(false);
      setLoadingBalance(false);
      return;
    }
    let cancelled = false;

    authorizedRequest((token) => getMyPayoutsRequest(token))
      .then((data) => {
        if (!cancelled) setPayouts(data);
      })
      .catch((err) => {
        if (!cancelled)
          setPayoutsError(
            err instanceof ApiError
              ? err.message
              : tx(
                  l,
                  'Не удалось загрузить выплаты.',
                  'Аударымдарды жүктеу мүмкін болмады.',
                  'Unable to load payouts.',
                ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingPayouts(false);
      });

    authorizedRequest((token) => getPayoutMethodsRequest(token))
      .then((data) => {
        if (!cancelled) setMethods(data);
      })
      .catch((err) => {
        if (!cancelled)
          setMethodsError(
            err instanceof ApiError
              ? err.message
              : tx(
                  l,
                  'Не удалось загрузить способы выплат.',
                  'Аударым тәсілдерін жүктеу мүмкін болмады.',
                  'Unable to load payout methods.',
                ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingMethods(false);
      });

    authorizedRequest((token) => getPayoutBalanceRequest(token))
      .then((data) => {
        if (!cancelled) setBalance(data);
      })
      .catch((err) => {
        if (!cancelled)
          setBalanceError(
            err instanceof ApiError
              ? err.message
              : tx(
                  l,
                  'Не удалось загрузить удерживаемый баланс.',
                  'Ұсталған теңгерімді жүктеу мүмкін болмады.',
                  'Unable to load held balance.',
                ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoadingBalance(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, isAuthenticated, isReady]);

  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Card details are entered only on the provider's hosted page; EcoPay never
  // sees or asks for card numbers or provider tokens.
  const handleConnectCard = async () => {
    if (connecting) return;
    setConnecting(true);
    setConnectError(null);
    try {
      const url = await startPayoutCardBinding(authorizedRequest);
      window.location.assign(url);
    } catch (err) {
      setConnecting(false);
      setConnectError(
        err instanceof ApiError && err.status !== 0 && err.status < 500
          ? err.message
          : tx(
              l,
              'Не удалось начать подключение карты. Попробуйте ещё раз чуть позже.',
              'Картаны қосуды бастау мүмкін болмады. Сәл кейін қайталаңыз.',
              "Couldn't start the card connection. Please try again shortly.",
            ),
      );
    }
  };

  const handleDeleteMethod = async (id: number) => {
    try {
      await authorizedRequest((token) => deletePayoutMethodRequest(id, token));
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success(
        tx(l, 'Способ выплат удалён', 'Аударым тәсілі жойылды', 'Payout method removed'),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(
              l,
              'Не удалось удалить способ выплат',
              'Аударым тәсілін жою мүмкін болмады',
              'Failed to remove payout method',
            ),
      );
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'Выплаты владельцу', 'Иеге аударымдар', 'Owner Payouts')}
      </h1>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'История выплат и настройка способов получения денег.',
          'Аударымдар тарихы және ақша алу тәсілдерін баптау.',
          'Payout history and method management.',
        )}
      </p>

      {!isAuthenticated && isReady ? (
        <Card>
          <Link
            to="/login?redirect=/payment/payout"
            className="text-[14px]"
            style={{ color: 'var(--eco-primary)' }}
          >
            {tx(
              l,
              'Войдите, чтобы увидеть выплаты',
              'Аударымдарды көру үшін кіріңіз',
              'Sign in to view payouts',
            )}
          </Link>
        </Card>
      ) : (
        <>
          <HeldBalanceCard balance={balance} loading={loadingBalance} error={balanceError} l={l} />

          {!loadingMethods &&
            !methods.some(isUsablePayoutMethod) &&
            (() => {
              const pendingBinding = readPendingBinding();
              if (!pendingBinding) return null;
              return (
                <Card className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[13px]" role="status">
                    <Clock size={15} aria-hidden="true" style={{ color: 'var(--eco-warning)' }} />
                    <span style={{ color: 'var(--eco-text-secondary)' }}>
                      {tx(
                        l,
                        'Подключение карты ещё подтверждается платёжным провайдером.',
                        'Картаны қосуды төлем провайдері әлі растап жатыр.',
                        'The payment provider is still confirming your card connection.',
                      )}
                    </span>
                  </div>
                  <Link
                    to={`/payment/card-connected?binding=${encodeURIComponent(pendingBinding)}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <Button variant="secondary" size="sm">
                      {tx(l, 'Проверить статус', 'Мәртебені тексеру', 'Check status')}
                    </Button>
                  </Link>
                </Card>
              );
            })()}
          <PayoutMethodsCard
            methods={methods}
            loading={loadingMethods}
            error={methodsError}
            onConnect={() => void handleConnectCard()}
            connecting={connecting}
            connectError={connectError}
            onDelete={handleDeleteMethod}
            l={l}
          />

          <h3 className="text-[16px] mb-3" style={{ color: 'var(--eco-text)' }}>
            {tx(l, 'История выплат', 'Аударымдар тарихы', 'Payout History')}
          </h3>

          {loadingPayouts ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="flex flex-col gap-2">
                  <Skeleton width="40%" height={14} />
                  <Skeleton width="60%" height={14} />
                </Card>
              ))}
            </div>
          ) : payoutsError ? (
            <Card>
              <div
                className="flex items-center gap-2 text-[14px]"
                style={{ color: 'var(--eco-negative)' }}
              >
                <AlertCircle size={15} /> {payoutsError}
              </div>
            </Card>
          ) : payouts.length === 0 ? (
            <EmptyState
              title={tx(l, 'Выплат пока нет', 'Әзірге аударымдар жоқ', 'No payouts yet')}
              description={tx(
                l,
                'Когда участники оплатят места и пройдёт окно споров, выплата появится здесь.',
                'Қатысушылар орындарды төлеп, дау мерзімі өткеннен кейін аударым осында пайда болады.',
                'Once members pay and the dispute window closes, payouts will appear here.',
              )}
            />
          ) : (
            <div className="flex flex-col gap-3">
              {payouts.map((p) => (
                <Card key={p.id} className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <span
                        className="text-[13px]"
                        style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
                      >
                        PO-{p.id}
                      </span>
                      <Badge variant={payoutStatusVariant(p.status)}>
                        {payoutStatusLabel(p.status, l)}
                      </Badge>
                    </div>
                    <div className="text-[18px]" style={{ color: 'var(--eco-primary)' }}>
                      {p.currency === 'KZT' ? '₸' : `${p.currency} `}
                      {formatNumber(Number(p.amount))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {p.roomId != null && (
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {tx(l, 'Комната', 'Бөлме', 'Room')}
                        </div>
                        <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          #{p.roomId}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {tx(l, 'Создана', 'Жасалған', 'Created')}
                      </div>
                      <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                        {formatDateTime(p.createdAt, l)}
                      </div>
                    </div>
                    {p.releaseAt && !p.processedAt && (
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {tx(l, 'Плановая дата', 'Жоспарлы күні', 'Scheduled for')}
                        </div>
                        <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          {formatDateTime(p.releaseAt, l)}
                        </div>
                      </div>
                    )}
                    {p.processedAt && (
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {tx(l, 'Обработана', 'Өңделген', 'Processed')}
                        </div>
                        <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          {formatDateTime(p.processedAt, l)}
                        </div>
                      </div>
                    )}
                  </div>
                  {(p.failureReason || ['FAILED', 'REVERSED'].includes(p.status.toUpperCase())) && (
                    <div className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                      {tx(
                        l,
                        'Выплата не прошла. Мы разберёмся и свяжемся с вами; при вопросах напишите в поддержку.',
                        'Аударым өтпеді. Біз тексеріп, сізбен байланысамыз; сұрақ болса, қолдауға жазыңыз.',
                        'The payout did not go through. We will look into it and contact you; reach out to support with questions.',
                      )}
                    </div>
                  )}
                  {p.status.toUpperCase() === 'PENDING_METHOD' && (
                    <div className="text-[12px]" style={{ color: 'var(--eco-warning)' }}>
                      {tx(
                        l,
                        'Подключите карту для выплат, чтобы получить эти деньги.',
                        'Бұл ақшаны алу үшін төлем картасын қосыңыз.',
                        'Connect a payout card to receive this money.',
                      )}
                    </div>
                  )}
                  {p.status.toUpperCase() === 'ON_HOLD' && p.deferredReason && (
                    <div className="text-[12px]" style={{ color: 'var(--eco-warning)' }}>
                      {p.deferredReason}
                    </div>
                  )}
                  {p.providerFeeKzt != null && Number(p.providerFeeKzt) !== 0 && (
                    <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {tx(l, 'Комиссия провайдера:', 'Провайдер комиссиясы:', 'Provider fee:')}{' '}
                      {formatNumber(Number(p.providerFeeKzt))} ₸
                    </div>
                  )}
                  {p.providerPayoutId && (
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(l, 'Номер операции:', 'Операция нөмірі:', 'Reference:')} {p.providerPayoutId}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      <div
        className="flex items-start gap-2 p-4 rounded-lg my-6"
        style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
      >
        <Shield
          size={13}
          className="mt-0.5 shrink-0"
          style={{ color: 'var(--eco-text-tertiary)' }}
        />
        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(
            l,
            'Выплата доступна после проверки и окна споров. Это защищает обе стороны.',
            'Аударым тексеруден және дау мерзімінен кейін қолжетімді. Бұл екі тарапты қорғайды.',
            'Payout available after verification and dispute window. This protects both parties.',
          )}
        </span>
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

