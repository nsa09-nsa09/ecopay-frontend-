import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { Card, Badge, Button, Skeleton, EmptyState } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime, formatNumber } from '../../lib/datetime';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ArrowRight,
  CreditCard,
  Lock,
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  ArrowLeft,
  FileText,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Timer,
  Send,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import {
  ApiError,
  deletePayoutMethodRequest,
  getMyPayoutsRequest,
  getMyRefundsRequest,
  getPayoutBalanceRequest,
  getPayoutMethodsRequest,
  registerPayoutMethodRequest,
  type PayoutBalanceDto,
  type PayoutDto,
  type PayoutMethodDto,
  type RefundTransactionResponse,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { appBrand } from '../../config/brand';

// ─── Localized text helper ───
type L = Language;
const tx = (l: L, ru: string, kz: string, en: string) => (l === 'ru' ? ru : l === 'kz' ? kz : en);

// ─── Payment footer (used on payment screens only) ───
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
        <span className="flex items-center gap-1.5">
          <Phone size={11} /> +7 (727) 000-00-00
        </span>
        {appBrand.supportEmail && (
          <span className="flex items-center gap-1.5">
            <Mail size={11} /> {appBrand.supportEmail}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <MapPin size={11} />{' '}
          {tx(lang, 'Алматы, Казахстан', 'Алматы, Қазақстан', 'Almaty, Kazakhstan')}
        </span>
      </div>
      <div className="text-[11px] mt-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          lang,
          '© 2026 EcoPay · ТОО «Apex Digital»',
          '© 2026 EcoPay · «Apex Digital» ЖШС',
          '© 2026 EcoPay · Apex Digital LLP',
        )}
      </div>
    </div>
  );
}

// ─── Payment status chip ───
type PaymentStatus = 'PENDING' | 'HOLD' | 'ACTIVE' | 'REFUNDED' | 'PAYOUT_SENT';
const paymentStatusVariant: Record<
  PaymentStatus,
  'warning' | 'info' | 'success' | 'danger' | 'default'
> = {
  PENDING: 'warning',
  HOLD: 'info',
  ACTIVE: 'success',
  REFUNDED: 'danger',
  PAYOUT_SENT: 'success',
};
const paymentStatusLabel = (s: PaymentStatus, l: L): string => {
  const map: Record<PaymentStatus, [string, string, string]> = {
    PENDING: ['Ожидает оплаты', 'Төлем күтілуде', 'Pending Payment'],
    HOLD: ['Средства удержаны', 'Қаражат ұсталды', 'Funds on Hold'],
    ACTIVE: ['Активно', 'Белсенді', 'Active'],
    REFUNDED: ['Возврат', 'Қайтарым', 'Refunded'],
    PAYOUT_SENT: ['Выплата отправлена', 'Төлем жіберілді', 'Payout Sent'],
  };
  return tx(l, ...map[s]);
};

// ─── Stepper ───
function Stepper({
  steps,
  current,
  lang,
}: {
  steps: [string, string, string][];
  current: number;
  lang: L;
}) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((step, i) => {
        const label = tx(lang, step[0], step[1], step[2]);
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className="flex items-center flex-1">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[12px]"
                style={{
                  background: done
                    ? 'var(--eco-positive)'
                    : active
                      ? 'var(--eco-primary)'
                      : 'var(--eco-neutral-100)',
                  color: done || active ? 'white' : 'var(--eco-text-tertiary)',
                }}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              <span
                className="text-[12px] hidden sm:inline"
                style={{ color: active ? 'var(--eco-text)' : 'var(--eco-text-tertiary)' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="flex-1 h-px mx-3"
                style={{ background: done ? 'var(--eco-positive)' : 'var(--eco-border)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Trust block ───
function TrustBlock({ lang }: { lang: L }) {
  return (
    <div className="flex flex-col gap-3 mt-4">
      {/* Card logos */}
      <div className="flex items-center gap-4">
        <div
          className="px-3 py-1.5 rounded"
          style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            VISA
          </span>
        </div>
        <div
          className="px-3 py-1.5 rounded"
          style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
        >
          <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            Mastercard
          </span>
        </div>
        <div
          className="px-3 py-1.5 rounded"
          style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            Freedom Pay
          </span>
        </div>
      </div>
      <div
        className="flex items-start gap-1.5 text-[11px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Lock size={11} className="mt-0.5 shrink-0" />
        {tx(
          lang,
          'Безопасная обработка платежей. Повторные платежи защищены от двойного списания.',
          'Қауіпсіз төлем өңдеу. Қайта төлемдер қос есептен шығарудан қорғалған.',
          'Secure payment processing. Retry-safe payments (no double charge).',
        )}
      </div>
    </div>
  );
}

// ─── 1) Room Details with Pricing Box ───
export function PaymentRoomDetailsPage() {
  const { language } = useI18n();
  const l = language as L;

  const room = {
    name: 'Beeline Family 4',
    operator: 'Beeline',
    plan: 'Комфорт 5000',
    totalPrice: 19999,
    seats: 4,
    filled: 3,
  };
  const share = Math.round(room.totalPrice / room.seats);
  const fee = Math.round(share * 0.08);
  const total = share + fee;

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'Назад к комнатам', 'Бөлмелерге оралу', 'Back to rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {room.name}
      </h1>
      <div className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {room.operator} · {room.plan} · {room.filled}/{room.seats} {tx(l, 'мест', 'орын', 'seats')}
      </div>

      {/* Status chips showcase */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['PENDING', 'HOLD', 'ACTIVE', 'REFUNDED', 'PAYOUT_SENT'] as PaymentStatus[]).map((s) => (
          <Badge key={s} variant={paymentStatusVariant[s]}>
            {paymentStatusLabel(s, l)}
          </Badge>
        ))}
      </div>

      {/* Pricing breakdown */}
      <Card className="flex flex-col gap-4 mb-6">
        <h3 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
          {tx(l, 'Стоимость участия', 'Қатысу құны', 'Participation Cost')}
        </h3>

        <div className="flex flex-col gap-2">
          {[
            {
              label: tx(l, 'Доля участника', 'Қатысушы үлесі', 'Participant share'),
              value: `₸${formatNumber(share)}`,
            },
            {
              label: tx(
                l,
                'Комиссия платформы (8%)',
                'Платформа комиссиясы (8%)',
                'Platform fee (8%)',
              ),
              value: `₸${formatNumber(fee)}`,
            },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between text-[14px]">
              <span style={{ color: 'var(--eco-text-secondary)' }}>{row.label}</span>
              <span style={{ color: 'var(--eco-text)' }}>{row.value}</span>
            </div>
          ))}
          <div
            className="border-t pt-2 mt-1 flex items-center justify-between"
            style={{ borderColor: 'var(--eco-border)' }}
          >
            <span className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
              {tx(l, 'Итого к оплате', 'Төлем жиыны', 'Total to pay now')}
            </span>
            <span className="text-[18px]" style={{ color: 'var(--eco-primary)' }}>
              ₸{formatNumber(total)}
            </span>
          </div>
        </div>

        {/* Escrow note */}
        <div
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ background: 'var(--eco-surface)' }}
        >
          <Shield
            size={13}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--eco-text-tertiary)' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(
              l,
              'Средства могут быть удержаны до подтверждения доступа владельцем.',
              'Қаражат иесі қолжетімділікті растағанша ұсталуы мүмкін.',
              'Funds may be held until access is confirmed by the room owner.',
            )}
          </span>
        </div>
      </Card>

      <Link to="/payment/checkout" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="lg" className="w-full">
          {tx(l, 'Перейти к оплате', 'Төлемге өту', 'Proceed to Payment')} <ArrowRight size={15} />
        </Button>
      </Link>

      {/* Security note */}
      <div
        className="flex items-start gap-1.5 mt-4 text-[11px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(
          l,
          'Действия ограничены по частоте. Проверки на мошенничество могут потребовать дополнительной верификации.',
          'Әрекеттер жиілікпен шектелген. Алаяқтық тексерулері қосымша верификация талап етуі мүмкін.',
          'Rate-limited actions. Fraud checks may require additional review.',
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 2) Join / Checkout ───
export function PaymentCheckoutPage() {
  const { language } = useI18n();
  const l = language as L;
  const [selectedMethod, setSelectedMethod] = useState('freedom');

  const total = 5400;

  const methods = [
    {
      id: 'freedom',
      label: 'Freedom Pay',
      desc: tx(l, 'Банковская карта', 'Банк картасы', 'Bank card'),
      icon: CreditCard,
    },
    {
      id: 'visa',
      label: 'Visa ****4821',
      desc: tx(l, 'Сохранённая карта', 'Сақталған карта', 'Saved card'),
      icon: CreditCard,
    },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/payment/room"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'Назад', 'Артқа', 'Back')}
      </Link>

      <h1 className="text-[24px] mb-6" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'Оплата', 'Төлем', 'Checkout')}
      </h1>

      <Stepper
        steps={[
          ['Детали', 'Мәліметтер', 'Details'],
          ['Оплата', 'Төлем', 'Payment'],
          ['Подтверждение', 'Растау', 'Confirmation'],
        ]}
        current={1}
        lang={l}
      />

      {/* Order summary */}
      <Card className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            Beeline Family 4
          </span>
          <span className="text-[15px]" style={{ color: 'var(--eco-primary)' }}>
            ₸{formatNumber(total)}
          </span>
        </div>
        <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(l, 'Ваша доля + комиссия', 'Сіздің үлесіңіз + комиссия', 'Your share + platform fee')}
        </div>
      </Card>

      {/* Payment methods */}
      <h3 className="text-[15px] mb-3" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'Способ оплаты', 'Төлем тәсілі', 'Payment Method')}
      </h3>
      <div className="flex flex-col gap-2 mb-6">
        {methods.map((m) => {
          const Icon = m.icon;
          const active = selectedMethod === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelectedMethod(m.id)}
              className="flex items-center gap-3 p-4 rounded-xl cursor-pointer text-left transition-all"
              style={{
                background: active ? 'var(--eco-brand-50)' : 'var(--eco-surface-raised)',
                border: `2px solid ${active ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--eco-surface)' }}
              >
                <Icon
                  size={18}
                  style={{ color: active ? 'var(--eco-primary)' : 'var(--eco-text-tertiary)' }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                  {m.label}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {m.desc}
                </div>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                style={{ borderColor: active ? 'var(--eco-primary)' : 'var(--eco-border)' }}
              >
                {active && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ background: 'var(--eco-primary)' }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Freedom Pay placeholder */}
      {selectedMethod === 'freedom' && (
        <Card className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              Freedom Pay
            </span>
            <Badge variant="info">
              {tx(l, 'Платёжный шлюз', 'Төлем шлюзі', 'Payment Gateway')}
            </Badge>
          </div>
          <div
            className="p-6 rounded-lg text-center"
            style={{ background: 'var(--eco-surface)', border: '1px dashed var(--eco-border)' }}
          >
            <CreditCard
              size={24}
              className="mx-auto mb-2"
              style={{ color: 'var(--eco-text-tertiary)' }}
            />
            <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(
                l,
                'Форма Freedom Pay откроется при нажатии «Оплатить»',
                'Freedom Pay формасы «Төлеу» басқанда ашылады',
                "Freedom Pay form will open on 'Pay securely' click",
              )}
            </div>
          </div>
        </Card>
      )}

      <Button variant="primary" size="lg" className="w-full">
        <Lock size={15} /> {tx(l, 'Оплатить безопасно', 'Қауіпсіз төлеу', 'Pay securely')} · ₸
        {formatNumber(total)}
      </Button>

      <TrustBlock lang={l} />

      {/* Security note */}
      <div
        className="flex items-start gap-1.5 mt-4 text-[11px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(
          l,
          'Действия ограничены по частоте. Проверки на мошенничество могут потребовать верификации.',
          'Әрекеттер жиілікпен шектелген. Алаяқтық тексерулері верификация талап етуі мүмкін.',
          'Rate-limited actions. Fraud checks may require review.',
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 3) Payment Confirmation Modal ───
export function PaymentConfirmationPage() {
  const { language } = useI18n();
  const l = language as L;
  const [state, setState] = useState<'success' | 'failed'>('success');

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Stepper
        steps={[
          ['Детали', 'Мәліметтер', 'Details'],
          ['Оплата', 'Төлем', 'Payment'],
          ['Подтверждение', 'Растау', 'Confirmation'],
        ]}
        current={2}
        lang={l}
      />

      {/* Toggle for demo */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setState('success')}
          className="px-3 py-1 rounded-lg cursor-pointer text-[12px]"
          style={{
            background: state === 'success' ? 'var(--eco-success-100)' : 'var(--eco-surface)',
            color: state === 'success' ? 'var(--eco-success-500)' : 'var(--eco-text-tertiary)',
            border: '1px solid var(--eco-border)',
          }}
        >
          {tx(l, 'Успех', 'Сәттілік', 'Success')}
        </button>
        <button
          onClick={() => setState('failed')}
          className="px-3 py-1 rounded-lg cursor-pointer text-[12px]"
          style={{
            background: state === 'failed' ? 'var(--eco-danger-100)' : 'var(--eco-surface)',
            color: state === 'failed' ? 'var(--eco-danger-500)' : 'var(--eco-text-tertiary)',
            border: '1px solid var(--eco-border)',
          }}
        >
          {tx(l, 'Ошибка', 'Қате', 'Failed')}
        </button>
      </div>

      {/* Modal card */}
      <Card className="flex flex-col items-center text-center gap-5 py-10">
        {state === 'success' ? (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--eco-success-100)' }}
            >
              <CheckCircle2 size={32} style={{ color: 'var(--eco-positive)' }} />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
                {tx(l, 'Оплата прошла успешно', 'Төлем сәтті өтті', 'Payment Successful')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  l,
                  'Ваш платёж в размере ₸5,400 принят. Средства будут удержаны до подтверждения доступа.',
                  '₸5,400 төлеміңіз қабылданды. Қолжетімділік расталғанша қаражат ұсталады.',
                  'Your payment of ₸5,400 has been received. Funds will be held until access is confirmed.',
                )}
              </p>
            </div>
            <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(l, 'Ref:', 'Ref:', 'Ref:')} PAY-2026-04-03-001
            </div>
            <Link to="/payment/pending" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                {tx(l, 'Перейти к статусу', 'Мәртебеге өту', 'Go to Room Status')}{' '}
                <ArrowRight size={14} />
              </Button>
            </Link>
          </>
        ) : (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--eco-danger-100)' }}
            >
              <XCircle size={32} style={{ color: 'var(--eco-negative)' }} />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
                {tx(l, 'Оплата не прошла', 'Төлем өтпеді', 'Payment Failed')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  l,
                  'Произошла ошибка при обработке платежа. Вы можете безопасно повторить попытку: двойного списания не будет.',
                  'Төлемді өңдеу кезінде қате орын алды. Қайта әрекет жасау қауіпсіз: қос есептен шығару болмайды.',
                  'An error occurred processing your payment. You can safely retry: idempotent processing ensures no double charge.',
                )}
              </p>
            </div>
            <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(l, 'Код ошибки:', 'Қате коды:', 'Error code:')} ERR_GW_TIMEOUT
            </div>
            <div className="flex gap-3">
              <Link to="/payment/checkout" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg">
                  <RefreshCw size={14} />{' '}
                  {tx(l, 'Повторить оплату', 'Төлемді қайталау', 'Retry Payment')}
                </Button>
              </Link>
              <Link to="/support/new" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg">
                  {tx(l, 'Поддержка', 'Қолдау', 'Support')}
                </Button>
              </Link>
            </div>
          </>
        )}
      </Card>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 4) Payment Pending / Hold Status ───
export function PaymentPendingPage() {
  const { language } = useI18n();
  const l = language as L;

  const timeline = [
    {
      label: tx(l, 'Оплата принята', 'Төлем қабылданды', 'Payment Successful'),
      done: true,
      time: '03 Apr 09:15',
    },
    {
      label: tx(
        l,
        'Ожидание предоставления доступа',
        'Қолжетімділік күтілуде',
        'Waiting for owner access grant',
      ),
      done: false,
      active: true,
      time: tx(l, 'SLA: 48ч', 'SLA: 48с', 'SLA: 48h'),
    },
    {
      label: tx(
        l,
        'Подтверждение получения доступа',
        'Қолжетімділікті растау',
        'Confirm access received',
      ),
      done: false,
      time: '',
    },
    { label: tx(l, 'Активация', 'Белсендіру', 'Activation'), done: false, time: '' },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        Beeline Family 4
      </h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="info">{paymentStatusLabel('HOLD', l)}</Badge>
        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          PAY-2026-04-03-001
        </span>
      </div>

      {/* SLA Timer */}
      <Card className="flex items-center gap-4 mb-6">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--eco-warning-100)' }}
        >
          <Timer size={20} style={{ color: 'var(--eco-warning-500)' }} />
        </div>
        <div className="flex-1">
          <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
            {tx(l, 'Время ожидания доступа', 'Қолжетімділік күту уақыты', 'Access Grant SLA Timer')}
          </div>
          <div
            className="text-[22px] mt-0.5"
            style={{ color: 'var(--eco-warning-500)', fontFamily: 'monospace' }}
          >
            38:45:12
          </div>
          <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(l, 'Осталось из 48 часов', '48 сағаттан қалды', 'Remaining of 48 hours')}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: 'var(--eco-text)' }}>
          {tx(l, 'Статус процесса', 'Процесс мәртебесі', 'Process Status')}
        </h3>
        {timeline.map((step, i) => (
          <div key={i} className="flex gap-3">
            {/* Vertical line + dot */}
            <div className="flex flex-col items-center">
              <div
                className="w-3 h-3 rounded-full shrink-0 mt-1"
                style={{
                  background: step.done
                    ? 'var(--eco-positive)'
                    : step.active
                      ? 'var(--eco-primary)'
                      : 'var(--eco-neutral-100)',
                  border: step.active ? '2px solid var(--eco-primary)' : 'none',
                }}
              />
              {i < timeline.length - 1 && (
                <div
                  className="w-px flex-1 my-1"
                  style={{
                    background: step.done ? 'var(--eco-positive)' : 'var(--eco-border)',
                    minHeight: 32,
                  }}
                />
              )}
            </div>
            <div className="pb-4">
              <div
                className="text-[13px]"
                style={{
                  color: step.done || step.active ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
                }}
              >
                {step.label}
              </div>
              {step.time && (
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {step.time}
                </div>
              )}
              {step.active && (
                <div className="flex items-center gap-1 mt-1">
                  <div
                    className="w-1.5 h-1.5 rounded-full animate-pulse"
                    style={{ background: 'var(--eco-primary)' }}
                  />
                  <span className="text-[11px]" style={{ color: 'var(--eco-primary)' }}>
                    {tx(l, 'В процессе', 'Орындалуда', 'In progress')}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </Card>

      <Link to="/support/new" style={{ textDecoration: 'none' }}>
        <Button variant="secondary" size="md" className="w-full">
          <MessageSquare size={14} />{' '}
          {tx(l, 'Создать обращение в поддержку', 'Қолдау сұрауын жасау', 'Create Support Ticket')}
        </Button>
      </Link>

      <div
        className="flex items-start gap-1.5 mt-4 text-[11px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(
          l,
          'Если доступ не предоставлен в течение SLA, вы можете запросить возврат.',
          'SLA ішінде қолжетімділік берілмесе, қайтаруды сұрай аласыз.',
          'If access is not granted within SLA, you may request a refund.',
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// ─── 5) Refund Status (history) ───
function refundStatusVariant(s: string): 'warning' | 'info' | 'success' | 'danger' | 'default' {
  const u = s.toUpperCase();
  if (u === 'SUCCESS' || u === 'COMPLETED' || u === 'SENT') return 'success';
  if (u === 'FAILED' || u === 'REJECTED' || u === 'CANCELLED') return 'danger';
  if (u === 'PENDING' || u === 'REQUESTED') return 'warning';
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
  };
  const entry = map[s.toUpperCase()];
  return entry ? tx(l, ...entry) : s;
};

export function RefundStatusPage() {
  const { language } = useI18n();
  const l = language as L;
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();

  const [refunds, setRefunds] = useState<RefundTransactionResponse[]>([]);
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
    authorizedRequest((token) => getMyRefundsRequest(token))
      .then((data) => {
        if (!cancelled) setRefunds(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Unable to load refunds right now.');
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
          'Все возвраты, инициированные по вашим платежам.',
          'Сіздің төлемдеріңіз бойынша барлық қайтарулар.',
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
            'Когда вам будет инициирован возврат, он появится здесь.',
            'Сізге қайтару бастамаланғанда, ол осы жерде пайда болады.',
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
            'Возврат будет зачислен на исходный способ оплаты в течение 3–10 рабочих дней после одобрения.',
            'Қайтару мақұлданғаннан кейін 3-10 жұмыс күнінде бастапқы төлем тәсіліне аударылады.',
            'Refund will be credited to the original payment method within 3–10 business days after approval.',
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
  if (u === 'FAILED' || u === 'REJECTED') return 'danger';
  if (u === 'PENDING' || u === 'QUEUED') return 'warning';
  if (u === 'PROCESSING') return 'info';
  return 'default';
}

function PayoutMethodsCard({
  methods,
  loading,
  error,
  onAdd,
  onDelete,
  l,
}: {
  methods: PayoutMethodDto[];
  loading: boolean;
  error: string | null;
  onAdd: (payload: { providerCardToken: string; panMask?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  l: L;
}) {
  const [adding, setAdding] = useState(false);
  const [token, setToken] = useState('');
  const [panMask, setPanMask] = useState('');
  const [busy, setBusy] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const submit = async () => {
    if (!token.trim()) return;
    setBusy(true);
    try {
      await onAdd({ providerCardToken: token.trim(), panMask: panMask.trim() || undefined });
      setToken('');
      setPanMask('');
      setAdding(false);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: number) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <Card className="flex flex-col gap-4 mb-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
          {tx(l, 'Способы выплаты', 'Төлем тәсілдері', 'Payout Methods')}
        </h3>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> {tx(l, 'Добавить', 'Қосу', 'Add')}
          </Button>
        )}
      </div>

      {loading ? (
        <Skeleton width="100%" height={48} />
      ) : error ? (
        <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </div>
      ) : methods.length === 0 && !adding ? (
        <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(l, 'Метод выплаты не задан.', 'Төлем тәсілі белгіленбеген.', 'No payout method yet.')}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 rounded-lg"
              style={{ background: 'var(--eco-surface)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <CreditCard size={16} style={{ color: 'var(--eco-text-tertiary)' }} />
                <div className="min-w-0">
                  <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                    {m.providerName} · {m.panMask || '—'}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {m.status}
                    {m.isDefault ? ` · ${tx(l, 'по умолчанию', 'әдепкі', 'default')}` : ''}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                loading={deletingId === m.id}
                onClick={() => void remove(m.id)}
                aria-label={tx(
                  l,
                  'Удалить способ выплаты',
                  'Төлем тәсілін жою',
                  'Delete payout method',
                )}
              >
                <Trash2 size={14} style={{ color: 'var(--eco-negative)' }} />
              </Button>
            </div>
          ))}
        </div>
      )}

      {adding && (
        <div
          className="flex flex-col gap-3 p-3 rounded-lg"
          style={{ background: 'var(--eco-surface)' }}
        >
          <input
            placeholder={tx(
              l,
              'Провайдерский токен карты',
              'Провайдер карта токені',
              'Provider card token',
            )}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="px-3 py-2 rounded-lg outline-none"
            style={{
              background: 'var(--eco-bg)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
              fontSize: 14,
            }}
          />
          <input
            placeholder={tx(
              l,
              'Маска карты (необязательно), напр. **** 4821',
              'Карта маскасы (міндетті емес)',
              'PAN mask (optional), e.g. **** 4821',
            )}
            value={panMask}
            onChange={(e) => setPanMask(e.target.value)}
            className="px-3 py-2 rounded-lg outline-none"
            style={{
              background: 'var(--eco-bg)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
              fontSize: 14,
            }}
          />
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setAdding(false);
                setToken('');
                setPanMask('');
              }}
              disabled={busy}
            >
              {tx(l, 'Отмена', 'Бас тарту', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              disabled={!token.trim()}
              onClick={() => void submit()}
            >
              {tx(l, 'Сохранить', 'Сақтау', 'Save')}
            </Button>
          </div>
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
          {balance.heldPayoutCount} {tx(l, 'выплат в hold', 'төлем ұсталымда', 'payouts on hold')}
        </Badge>
      </div>

      <p className="text-[12px] mt-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'Сумма успешных платежей участников, предназначенная вам и всё ещё находящаяся в периоде hold. Возвраты и отменённые выплаты не учитываются.',
          'Сізге арналған және hold кезеңіндегі қатысушылардың сәтті төлемдерінің сомасы. Қайтарымдар мен жойылған төлемдер есептелмейді.',
          'Successful member payments owed to you that are still inside the hold period. Refunded and reversed payouts are excluded.',
        )}
      </p>

      {balance.nextReleaseAt && (
        <div
          className="flex items-center gap-2 mt-3 pt-3 text-[12px] border-t"
          style={{ color: 'var(--eco-text-secondary)', borderColor: 'var(--eco-border)' }}
        >
          <Timer size={14} />
          {tx(l, 'Ближайшее освобождение:', 'Ең жақын босату:', 'Next release:')}{' '}
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
          setPayoutsError(err instanceof ApiError ? err.message : 'Unable to load payouts.');
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
          setMethodsError(err instanceof ApiError ? err.message : 'Unable to load payout methods.');
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
          setBalanceError(err instanceof ApiError ? err.message : 'Unable to load held balance.');
      })
      .finally(() => {
        if (!cancelled) setLoadingBalance(false);
      });

    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, isAuthenticated, isReady]);

  const handleAddMethod = async (payload: { providerCardToken: string; panMask?: string }) => {
    try {
      const m = await authorizedRequest((token) => registerPayoutMethodRequest(payload, token));
      setMethods((prev) => [m, ...prev]);
      toast.success(
        tx(l, 'Способ выплаты добавлен', 'Төлем тәсілі қосылды', 'Payout method added'),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(
              l,
              'Не удалось добавить способ выплаты',
              'Төлем тәсілін қосу мүмкін болмады',
              'Failed to add payout method',
            ),
      );
    }
  };

  const handleDeleteMethod = async (id: number) => {
    try {
      await authorizedRequest((token) => deletePayoutMethodRequest(id, token));
      setMethods((prev) => prev.filter((m) => m.id !== id));
      toast.success(
        tx(l, 'Способ выплаты удалён', 'Төлем тәсілі жойылды', 'Payout method removed'),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(
              l,
              'Не удалось удалить способ выплаты',
              'Төлем тәсілін жою мүмкін болмады',
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
        {tx(l, 'Выплаты владельцу', 'Иеге төлемдер', 'Owner Payouts')}
      </h1>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'История выплат и настройка способов выплаты.',
          'Төлемдер тарихы мен төлем тәсілдерін баптау.',
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
              'Төлемдерді көру үшін кіріңіз',
              'Sign in to view payouts',
            )}
          </Link>
        </Card>
      ) : (
        <>
          <HeldBalanceCard balance={balance} loading={loadingBalance} error={balanceError} l={l} />

          <PayoutMethodsCard
            methods={methods}
            loading={loadingMethods}
            error={methodsError}
            onAdd={handleAddMethod}
            onDelete={handleDeleteMethod}
            l={l}
          />

          <h3 className="text-[16px] mb-3" style={{ color: 'var(--eco-text)' }}>
            {tx(l, 'История выплат', 'Төлемдер тарихы', 'Payout History')}
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
              title={tx(l, 'Выплат пока нет', 'Әзірге төлемдер жоқ', 'No payouts yet')}
              description={tx(
                l,
                'Когда участники оплатят и пройдёт окно споров, выплата появится здесь.',
                'Қатысушылар төлеп, дау терезесі өткеннен кейін, төлем осы жерде пайда болады.',
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
                      <Badge variant={payoutStatusVariant(p.status)}>{p.status}</Badge>
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
                  {p.failureReason && (
                    <div className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                      {tx(l, 'Ошибка:', 'Қате:', 'Failure:')} {p.failureReason}
                    </div>
                  )}
                  {p.providerPayoutId && (
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(l, 'Провайдер:', 'Провайдер:', 'Provider:')} {p.providerPayoutId}
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
            'Выплата доступна после прохождения верификации и окна для споров. Это защищает обе стороны.',
            'Төлем верификация мен дау терезесінен кейін қолжетімді. Бұл екі тарапты қорғайды.',
            'Payout available after verification and dispute window. This protects both parties.',
          )}
        </span>
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}
