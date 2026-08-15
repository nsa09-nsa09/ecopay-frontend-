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

// в”Ђв”Ђв”Ђ Localized text helper в”Ђв”Ђв”Ђ
type L = Language;
const tx = (l: L, ru: string, kz: string, en: string) => (l === 'ru' ? ru : l === 'kz' ? kz : en);

// в”Ђв”Ђв”Ђ Payment footer (used on payment screens only) в”Ђв”Ђв”Ђ
function PaymentFooter({ lang }: { lang: L }) {
  const links = [
    { label: tx(lang, 'РџСѓР±Р»РёС‡РЅР°СЏ РѕС„РµСЂС‚Р°', 'Р–Р°СЂРёСЏ РѕС„РµСЂС‚Р°', 'Public Offer'), href: '/terms' },
    { label: tx(lang, 'Р РµРєРІРёР·РёС‚С‹', 'Р”РµСЂРµРєС‚РµРјРµР»РµСЂ', 'Company Details'), href: '/about' },
    {
      label: tx(lang, 'РџРѕР»РёС‚РёРєР° РєРѕРЅС„РёРґРµРЅС†РёР°Р»СЊРЅРѕСЃС‚Рё', 'ТљТ±РїРёСЏР»С‹Р»С‹Т› СЃР°СЏСЃР°С‚С‹', 'Privacy Policy'),
      href: '/privacy',
    },
    { label: tx(lang, 'РџРѕСЂСЏРґРѕРє РѕРїР»Р°С‚С‹', 'РўУ©Р»РµРј С‚У™СЂС‚С–Р±С–', 'Payment Procedure'), href: '/terms' },
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
        {tx(
          lang,
          'В© 2026 EcoPay',
          'В© 2026 EcoPay',
          'В© 2026 EcoPay',
        )}
      </div>
    </div>
  );
}

// в”Ђв”Ђв”Ђ Payment status chip в”Ђв”Ђв”Ђ
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
    PENDING: ['РћР¶РёРґР°РµС‚ РѕРїР»Р°С‚С‹', 'РўУ©Р»РµРј РєТЇС‚С–Р»СѓРґРµ', 'Pending Payment'],
    HOLD: ['РЎСЂРµРґСЃС‚РІР° СѓРґРµСЂР¶Р°РЅС‹', 'ТљР°СЂР°Р¶Р°С‚ Т±СЃС‚Р°Р»РґС‹', 'Funds on Hold'],
    ACTIVE: ['РђРєС‚РёРІРЅРѕ', 'Р‘РµР»СЃРµРЅРґС–', 'Active'],
    REFUNDED: ['Р’РѕР·РІСЂР°С‚', 'ТљР°Р№С‚Р°СЂС‹Рј', 'Refunded'],
    PAYOUT_SENT: ['Р’С‹РїР»Р°С‚Р° РѕС‚РїСЂР°РІР»РµРЅР°', 'РўУ©Р»РµРј Р¶С–Р±РµСЂС–Р»РґС–', 'Payout Sent'],
  };
  return tx(l, ...map[s]);
};

// в”Ђв”Ђв”Ђ Stepper в”Ђв”Ђв”Ђ
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

// в”Ђв”Ђв”Ђ Trust block в”Ђв”Ђв”Ђ
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
          'Р‘РµР·РѕРїР°СЃРЅР°СЏ РѕР±СЂР°Р±РѕС‚РєР° РїР»Р°С‚РµР¶РµР№. РџРѕРІС‚РѕСЂРЅС‹Рµ РїР»Р°С‚РµР¶Рё Р·Р°С‰РёС‰РµРЅС‹ РѕС‚ РґРІРѕР№РЅРѕРіРѕ СЃРїРёСЃР°РЅРёСЏ.',
          'ТљР°СѓС–РїСЃС–Р· С‚У©Р»РµРј У©ТЈРґРµСѓ. ТљР°Р№С‚Р° С‚У©Р»РµРјРґРµСЂ Т›РѕСЃ РµСЃРµРїС‚РµРЅ С€С‹Т“Р°СЂСѓРґР°РЅ Т›РѕСЂТ“Р°Р»Т“Р°РЅ.',
          'Secure payment processing. Retry-safe payments (no double charge).',
        )}
      </div>
    </div>
  );
}

// в”Ђв”Ђв”Ђ 1) Room Details with Pricing Box в”Ђв”Ђв”Ђ
export function PaymentRoomDetailsPage() {
  const { language } = useI18n();
  const l = language as L;

  const room = {
    name: 'Room plan',
    operator: 'Beeline',
    plan: 'РљРѕРјС„РѕСЂС‚ 5000',
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
        <ArrowLeft size={14} /> {tx(l, 'РќР°Р·Р°Рґ Рє РєРѕРјРЅР°С‚Р°Рј', 'Р‘У©Р»РјРµР»РµСЂРіРµ РѕСЂР°Р»Сѓ', 'Back to rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {room.name}
      </h1>
      <div className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {room.operator} В· {room.plan} В· {room.filled}/{room.seats} {tx(l, 'РјРµСЃС‚', 'РѕСЂС‹РЅ', 'seats')}
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
          {tx(l, 'РЎС‚РѕРёРјРѕСЃС‚СЊ СѓС‡Р°СЃС‚РёСЏ', 'ТљР°С‚С‹СЃСѓ Т›Т±РЅС‹', 'Participation Cost')}
        </h3>

        <div className="flex flex-col gap-2">
          {[
            {
              label: tx(l, 'Р”РѕР»СЏ СѓС‡Р°СЃС‚РЅРёРєР°', 'ТљР°С‚С‹СЃСѓС€С‹ ТЇР»РµСЃС–', 'Participant share'),
              value: `в‚ё${formatNumber(share)}`,
            },
            {
              label: tx(
                l,
                'РљРѕРјРёСЃСЃРёСЏ РїР»Р°С‚С„РѕСЂРјС‹ (8%)',
                'РџР»Р°С‚С„РѕСЂРјР° РєРѕРјРёСЃСЃРёСЏСЃС‹ (8%)',
                'Platform fee (8%)',
              ),
              value: `в‚ё${formatNumber(fee)}`,
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
              {tx(l, 'РС‚РѕРіРѕ Рє РѕРїР»Р°С‚Рµ', 'РўУ©Р»РµРј Р¶РёС‹РЅС‹', 'Total to pay now')}
            </span>
            <span className="text-[18px]" style={{ color: 'var(--eco-primary)' }}>
              в‚ё{formatNumber(total)}
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
              'Р’С‹РїР»Р°С‚Р° РІР»Р°РґРµР»СЊС†Сѓ РјРѕР¶РµС‚ Р±С‹С‚СЊ СѓРґРµСЂР¶Р°РЅР° РґРѕ СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕР№ РґР°С‚С‹ hold.',
              'РРµСЃС–РЅРµ С‚У©Р»РµРј Р±РµР»РіС–Р»РµРЅРіРµРЅ hold РєТЇРЅС–РЅРµ РґРµР№С–РЅ Т±СЃС‚Р°Р»Р° Р°Р»Р°РґС‹.',
              'The owner payout may be held until the scheduled hold release date.',
            )}
          </span>
        </div>
      </Card>

      <Link to="/rooms" style={{ textDecoration: 'none' }}>
        <Button variant="primary" size="lg" className="w-full">
          {tx(l, 'РџРµСЂРµР№С‚Рё Рє РѕРїР»Р°С‚Рµ', 'РўУ©Р»РµРјРіРµ У©С‚Сѓ', 'Proceed to Payment')} <ArrowRight size={15} />
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
          'Р”РµР№СЃС‚РІРёСЏ РѕРіСЂР°РЅРёС‡РµРЅС‹ РїРѕ С‡Р°СЃС‚РѕС‚Рµ. РџСЂРѕРІРµСЂРєРё РЅР° РјРѕС€РµРЅРЅРёС‡РµСЃС‚РІРѕ РјРѕРіСѓС‚ РїРѕС‚СЂРµР±РѕРІР°С‚СЊ РґРѕРїРѕР»РЅРёС‚РµР»СЊРЅРѕР№ РІРµСЂРёС„РёРєР°С†РёРё.',
          'УСЂРµРєРµС‚С‚РµСЂ Р¶РёС–Р»С–РєРїРµРЅ С€РµРєС‚РµР»РіРµРЅ. РђР»Р°СЏТ›С‚С‹Т› С‚РµРєСЃРµСЂСѓР»РµСЂС– Т›РѕСЃС‹РјС€Р° РІРµСЂРёС„РёРєР°С†РёСЏ С‚Р°Р»Р°Рї РµС‚СѓС– РјТЇРјРєС–РЅ.',
          'Rate-limited actions. Fraud checks may require additional review.',
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// в”Ђв”Ђв”Ђ 2) Join / Checkout в”Ђв”Ђв”Ђ
export function PaymentCheckoutPage() {
  const { language } = useI18n();
  const l = language as L;
  const [selectedMethod, setSelectedMethod] = useState('freedom');

  const total = 5400;

  const methods = [
    {
      id: 'freedom',
      label: 'Freedom Pay',
      desc: tx(l, 'Р‘Р°РЅРєРѕРІСЃРєР°СЏ РєР°СЂС‚Р°', 'Р‘Р°РЅРє РєР°СЂС‚Р°СЃС‹', 'Bank card'),
      icon: CreditCard,
    },
    {
      id: 'visa',
      label: 'Visa ****4821',
      desc: tx(l, 'РЎРѕС…СЂР°РЅС‘РЅРЅР°СЏ РєР°СЂС‚Р°', 'РЎР°Т›С‚Р°Р»Т“Р°РЅ РєР°СЂС‚Р°', 'Saved card'),
      icon: CreditCard,
    },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'РќР°Р·Р°Рґ', 'РђСЂС‚Т›Р°', 'Back')}
      </Link>

      <h1 className="text-[24px] mb-6" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'РћРїР»Р°С‚Р°', 'РўУ©Р»РµРј', 'Checkout')}
      </h1>

      <Stepper
        steps={[
          ['Р”РµС‚Р°Р»Рё', 'РњУ™Р»С–РјРµС‚С‚РµСЂ', 'Details'],
          ['РћРїР»Р°С‚Р°', 'РўУ©Р»РµРј', 'Payment'],
          ['РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ', 'Р Р°СЃС‚Р°Сѓ', 'Confirmation'],
        ]}
        current={1}
        lang={l}
      />

      {/* Order summary */}
      <Card className="flex flex-col gap-3 mb-6">
        <div className="flex items-center justify-between">
          <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            Room plan
          </span>
          <span className="text-[15px]" style={{ color: 'var(--eco-primary)' }}>
            в‚ё{formatNumber(total)}
          </span>
        </div>
        <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(l, 'Р’Р°С€Р° РґРѕР»СЏ + РєРѕРјРёСЃСЃРёСЏ', 'РЎС–Р·РґС–ТЈ ТЇР»РµСЃС–ТЈС–Р· + РєРѕРјРёСЃСЃРёСЏ', 'Your share + platform fee')}
        </div>
      </Card>

      {/* Payment methods */}
      <h3 className="text-[15px] mb-3" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'РЎРїРѕСЃРѕР± РѕРїР»Р°С‚С‹', 'РўУ©Р»РµРј С‚У™СЃС–Р»С–', 'Payment Method')}
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
              {tx(l, 'РџР»Р°С‚С‘Р¶РЅС‹Р№ С€Р»СЋР·', 'РўУ©Р»РµРј С€Р»СЋР·С–', 'Payment Gateway')}
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
                'Р¤РѕСЂРјР° Freedom Pay РѕС‚РєСЂРѕРµС‚СЃСЏ РїСЂРё РЅР°Р¶Р°С‚РёРё В«РћРїР»Р°С‚РёС‚СЊВ»',
                'Freedom Pay С„РѕСЂРјР°СЃС‹ В«РўУ©Р»РµСѓВ» Р±Р°СЃТ›Р°РЅРґР° Р°С€С‹Р»Р°РґС‹',
                "Freedom Pay form will open on 'Pay securely' click",
              )}
            </div>
          </div>
        </Card>
      )}

      <Button variant="primary" size="lg" className="w-full">
        <Lock size={15} /> {tx(l, 'РћРїР»Р°С‚РёС‚СЊ Р±РµР·РѕРїР°СЃРЅРѕ', 'ТљР°СѓС–РїСЃС–Р· С‚У©Р»РµСѓ', 'Pay securely')} В· в‚ё
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
          'Р”РµР№СЃС‚РІРёСЏ РѕРіСЂР°РЅРёС‡РµРЅС‹ РїРѕ С‡Р°СЃС‚РѕС‚Рµ. РџСЂРѕРІРµСЂРєРё РЅР° РјРѕС€РµРЅРЅРёС‡РµСЃС‚РІРѕ РјРѕРіСѓС‚ РїРѕС‚СЂРµР±РѕРІР°С‚СЊ РІРµСЂРёС„РёРєР°С†РёРё.',
          'УСЂРµРєРµС‚С‚РµСЂ Р¶РёС–Р»С–РєРїРµРЅ С€РµРєС‚РµР»РіРµРЅ. РђР»Р°СЏТ›С‚С‹Т› С‚РµРєСЃРµСЂСѓР»РµСЂС– РІРµСЂРёС„РёРєР°С†РёСЏ С‚Р°Р»Р°Рї РµС‚СѓС– РјТЇРјРєС–РЅ.',
          'Rate-limited actions. Fraud checks may require review.',
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// в”Ђв”Ђв”Ђ 3) Payment Confirmation Modal в”Ђв”Ђв”Ђ
export function PaymentConfirmationPage() {
  const { language } = useI18n();
  const l = language as L;
  const [state, setState] = useState<'success' | 'failed'>('success');

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Stepper
        steps={[
          ['Р”РµС‚Р°Р»Рё', 'РњУ™Р»С–РјРµС‚С‚РµСЂ', 'Details'],
          ['РћРїР»Р°С‚Р°', 'РўУ©Р»РµРј', 'Payment'],
          ['РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ', 'Р Р°СЃС‚Р°Сѓ', 'Confirmation'],
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
          {tx(l, 'РЈСЃРїРµС…', 'РЎУ™С‚С‚С–Р»С–Рє', 'Success')}
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
          {tx(l, 'РћС€РёР±РєР°', 'ТљР°С‚Рµ', 'Failed')}
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
                {tx(l, 'РћРїР»Р°С‚Р° РїСЂРѕС€Р»Р° СѓСЃРїРµС€РЅРѕ', 'РўУ©Р»РµРј СЃУ™С‚С‚С– У©С‚С‚С–', 'Payment Successful')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  l,
                  'Р’Р°С€ РїР»Р°С‚С‘Р¶ РІ СЂР°Р·РјРµСЂРµ в‚ё5,400 РїСЂРёРЅСЏС‚. Р’С‹РїР»Р°С‚Р° РІР»Р°РґРµР»СЊС†Сѓ Р±СѓРґРµС‚ СѓРґРµСЂР¶Р°РЅР° РґРѕ СѓСЃС‚Р°РЅРѕРІР»РµРЅРЅРѕР№ РґР°С‚С‹ hold.',
                  'в‚ё5,400 РєУ©Р»РµРјС–РЅРґРµРіС– С‚У©Р»РµРјС–ТЈС–Р· Т›Р°Р±С‹Р»РґР°РЅРґС‹. РРµСЃС–РЅРµ С‚У©Р»РµРј Р±РµР»РіС–Р»РµРЅРіРµРЅ hold РєТЇРЅС–РЅРµ РґРµР№С–РЅ Т±СЃС‚Р°Р»Р°РґС‹.',
                  'Your payment of в‚ё5,400 has been received. The owner payout will be held until the scheduled hold release date.',
                )}
              </p>
            </div>
            <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(l, 'Ref:', 'Ref:', 'Ref:')} -
            </div>
            <Link to="/payments/history" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="lg">
                {tx(l, 'РџРµСЂРµР№С‚Рё Рє СЃС‚Р°С‚СѓСЃСѓ', 'РњУ™СЂС‚РµР±РµРіРµ У©С‚Сѓ', 'Go to Room Status')}{' '}
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
                {tx(l, 'РћРїР»Р°С‚Р° РЅРµ РїСЂРѕС€Р»Р°', 'РўУ©Р»РµРј У©С‚РїРµРґС–', 'Payment Failed')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  l,
                  'РџСЂРѕРёР·РѕС€Р»Р° РѕС€РёР±РєР° РїСЂРё РѕР±СЂР°Р±РѕС‚РєРµ РїР»Р°С‚РµР¶Р°. Р’С‹ РјРѕР¶РµС‚Рµ Р±РµР·РѕРїР°СЃРЅРѕ РїРѕРІС‚РѕСЂРёС‚СЊ РїРѕРїС‹С‚РєСѓ: РґРІРѕР№РЅРѕРіРѕ СЃРїРёСЃР°РЅРёСЏ РЅРµ Р±СѓРґРµС‚.',
                  'РўУ©Р»РµРјРґС– У©ТЈРґРµСѓ РєРµР·С–РЅРґРµ Т›Р°С‚Рµ РѕСЂС‹РЅ Р°Р»РґС‹. ТљР°Р№С‚Р° У™СЂРµРєРµС‚ Р¶Р°СЃР°Сѓ Т›Р°СѓС–РїСЃС–Р·: Т›РѕСЃ РµСЃРµРїС‚РµРЅ С€С‹Т“Р°СЂСѓ Р±РѕР»РјР°Р№РґС‹.',
                  'An error occurred processing your payment. You can safely retry: idempotent processing ensures no double charge.',
                )}
              </p>
            </div>
            <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(l, 'РљРѕРґ РѕС€РёР±РєРё:', 'ТљР°С‚Рµ РєРѕРґС‹:', 'Error code:')} ERR_GW_TIMEOUT
            </div>
            <div className="flex gap-3">
              <Link to="/rooms" style={{ textDecoration: 'none' }}>
                <Button variant="primary" size="lg">
                  <RefreshCw size={14} />{' '}
                  {tx(l, 'РџРѕРІС‚РѕСЂРёС‚СЊ РѕРїР»Р°С‚Сѓ', 'РўУ©Р»РµРјРґС– Т›Р°Р№С‚Р°Р»Р°Сѓ', 'Retry Payment')}
                </Button>
              </Link>
              <Link to="/support/new" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg">
                  {tx(l, 'РџРѕРґРґРµСЂР¶РєР°', 'ТљРѕР»РґР°Сѓ', 'Support')}
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

// в”Ђв”Ђв”Ђ 4) Payment Pending / Hold Status в”Ђв”Ђв”Ђ
export function PaymentPendingPage() {
  const { language } = useI18n();
  const l = language as L;

  const timeline = [
    {
      label: tx(l, 'РћРїР»Р°С‚Р° РїСЂРёРЅСЏС‚Р°', 'РўУ©Р»РµРј Т›Р°Р±С‹Р»РґР°РЅРґС‹', 'Payment Successful'),
      done: true,
      time: '03 Apr 09:15',
    },
    {
      label: tx(
        l,
        'РћР¶РёРґР°РЅРёРµ РїСЂРµРґРѕСЃС‚Р°РІР»РµРЅРёСЏ РґРѕСЃС‚СѓРїР°',
        'ТљРѕР»Р¶РµС‚С–РјРґС–Р»С–Рє РєТЇС‚С–Р»СѓРґРµ',
        'Waiting for owner access grant',
      ),
      done: false,
      active: true,
      time: tx(l, 'SLA: 48С‡', 'SLA: 48СЃ', 'SLA: 48h'),
    },
    {
      label: tx(
        l,
        'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РїРѕР»СѓС‡РµРЅРёСЏ РґРѕСЃС‚СѓРїР°',
        'ТљРѕР»Р¶РµС‚С–РјРґС–Р»С–РєС‚С– СЂР°СЃС‚Р°Сѓ',
        'Confirm access received',
      ),
      done: false,
      time: '',
    },
    { label: tx(l, 'РђРєС‚РёРІР°С†РёСЏ', 'Р‘РµР»СЃРµРЅРґС–СЂСѓ', 'Activation'), done: false, time: '' },
  ];

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(l, 'РњРѕРё РєРѕРјРЅР°С‚С‹', 'РњРµРЅС–ТЈ Р±У©Р»РјРµР»РµСЂС–Рј', 'My Rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        Room plan
      </h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant="info">{paymentStatusLabel('HOLD', l)}</Badge>
        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          -
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
            {tx(l, 'Р’СЂРµРјСЏ РѕР¶РёРґР°РЅРёСЏ РґРѕСЃС‚СѓРїР°', 'ТљРѕР»Р¶РµС‚С–РјРґС–Р»С–Рє РєТЇС‚Сѓ СѓР°Т›С‹С‚С‹', 'Access Grant SLA Timer')}
          </div>
          <div
            className="text-[22px] mt-0.5"
            style={{ color: 'var(--eco-warning-500)', fontFamily: 'monospace' }}
          >
            38:45:12
          </div>
          <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(l, 'РћСЃС‚Р°Р»РѕСЃСЊ РёР· 48 С‡Р°СЃРѕРІ', '48 СЃР°Т“Р°С‚С‚Р°РЅ Т›Р°Р»РґС‹', 'Remaining of 48 hours')}
          </div>
        </div>
      </Card>

      {/* Timeline */}
      <Card className="flex flex-col gap-0 mb-6">
        <h3 className="text-[15px] mb-4" style={{ color: 'var(--eco-text)' }}>
          {tx(l, 'РЎС‚Р°С‚СѓСЃ РїСЂРѕС†РµСЃСЃР°', 'РџСЂРѕС†РµСЃСЃ РјУ™СЂС‚РµР±РµСЃС–', 'Process Status')}
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
                    {tx(l, 'Р’ РїСЂРѕС†РµСЃСЃРµ', 'РћСЂС‹РЅРґР°Р»СѓРґР°', 'In progress')}
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
          {tx(l, 'РЎРѕР·РґР°С‚СЊ РѕР±СЂР°С‰РµРЅРёРµ РІ РїРѕРґРґРµСЂР¶РєСѓ', 'ТљРѕР»РґР°Сѓ СЃТ±СЂР°СѓС‹РЅ Р¶Р°СЃР°Сѓ', 'Create Support Ticket')}
        </Button>
      </Link>

      <div
        className="flex items-start gap-1.5 mt-4 text-[11px]"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Shield size={11} className="mt-0.5 shrink-0" />
        {tx(
          l,
          'Р•СЃР»Рё РґРѕСЃС‚СѓРї РЅРµ РїСЂРµРґРѕСЃС‚Р°РІР»РµРЅ РІ С‚РµС‡РµРЅРёРµ SLA, РІС‹ РјРѕР¶РµС‚Рµ Р·Р°РїСЂРѕСЃРёС‚СЊ РІРѕР·РІСЂР°С‚.',
          'SLA С–С€С–РЅРґРµ Т›РѕР»Р¶РµС‚С–РјРґС–Р»С–Рє Р±РµСЂС–Р»РјРµСЃРµ, Т›Р°Р№С‚Р°СЂСѓРґС‹ СЃТ±СЂР°Р№ Р°Р»Р°СЃС‹Р·.',
          'If access is not granted within SLA, you may request a refund.',
        )}
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

// в”Ђв”Ђв”Ђ 5) Refund Status (history) в”Ђв”Ђв”Ђ
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
    SUCCESS: ['Р’С‹РїРѕР»РЅРµРЅ', 'РћСЂС‹РЅРґР°Р»РґС‹', 'Success'],
    COMPLETED: ['Р—Р°РІРµСЂС€С‘РЅ', 'РђСЏТ›С‚Р°Р»РґС‹', 'Completed'],
    SENT: ['РћС‚РїСЂР°РІР»РµРЅ', 'Р–С–Р±РµСЂС–Р»РґС–', 'Sent'],
    FAILED: ['РћС€РёР±РєР°', 'РЎУ™С‚СЃС–Р·', 'Failed'],
    REJECTED: ['РћС‚РєР»РѕРЅС‘РЅ', 'ТљР°Р±С‹Р»РґР°РЅР±Р°РґС‹', 'Rejected'],
    CANCELLED: ['РћС‚РјРµРЅС‘РЅ', 'Р‘Р°СЃ С‚Р°СЂС‚С‹Р»РґС‹', 'Cancelled'],
    PENDING: ['РћР¶РёРґР°РµС‚', 'РљТЇС‚СѓРґРµ', 'Pending'],
    REQUESTED: ['Р—Р°РїСЂРѕС€РµРЅ', 'РЎТ±СЂР°С‚С‹Р»РґС‹', 'Requested'],
    IN_REVIEW: ['РќР° РїСЂРѕРІРµСЂРєРµ', 'РўРµРєСЃРµСЂСѓРґРµ', 'In review'],
    APPROVED: ['РћРґРѕР±СЂРµРЅ', 'РњР°Т›Т±Р»РґР°РЅРґС‹', 'Approved'],
    PROCESSING: ['РћР±СЂР°Р±Р°С‚С‹РІР°РµС‚СЃСЏ', 'УЁТЈРґРµР»СѓРґРµ', 'Processing'],
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
        setError(
          err instanceof ApiError
            ? err.message
            : tx(
                l,
                'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РІРѕР·РІСЂР°С‚С‹.',
                'ТљР°Р№С‚Р°СЂСѓР»Р°СЂРґС‹ Р¶ТЇРєС‚РµСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹.',
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
        <ArrowLeft size={14} /> {tx(l, 'РњРѕРё РєРѕРјРЅР°С‚С‹', 'РњРµРЅС–ТЈ Р±У©Р»РјРµР»РµСЂС–Рј', 'My Rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'РСЃС‚РѕСЂРёСЏ РІРѕР·РІСЂР°С‚РѕРІ', 'ТљР°Р№С‚Р°СЂСѓР»Р°СЂ С‚Р°СЂРёС…С‹', 'Refund History')}
      </h1>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'Р’СЃРµ РІРѕР·РІСЂР°С‚С‹, РёРЅРёС†РёРёСЂРѕРІР°РЅРЅС‹Рµ РїРѕ РІР°С€РёРј РїР»Р°С‚РµР¶Р°Рј.',
          'РЎС–Р·РґС–ТЈ С‚У©Р»РµРјРґРµСЂС–ТЈС–Р· Р±РѕР№С‹РЅС€Р° Р±Р°СЂР»С‹Т› Т›Р°Р№С‚Р°СЂСѓР»Р°СЂ.',
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
              'Р’РѕР№РґРёС‚Рµ, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РІРѕР·РІСЂР°С‚С‹',
              'ТљР°Р№С‚Р°СЂСѓР»Р°СЂРґС‹ РєУ©СЂСѓ ТЇС€С–РЅ РєС–СЂС–ТЈС–Р·',
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
          title={tx(l, 'Р’РѕР·РІСЂР°С‚РѕРІ РЅРµС‚', 'ТљР°Р№С‚Р°СЂСѓР»Р°СЂ Р¶РѕТ›', 'No refunds')}
          description={tx(
            l,
            'РљРѕРіРґР° РІР°Рј Р±СѓРґРµС‚ РёРЅРёС†РёРёСЂРѕРІР°РЅ РІРѕР·РІСЂР°С‚, РѕРЅ РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ.',
            'РЎС–Р·РіРµ Т›Р°Р№С‚Р°СЂСѓ Р±Р°СЃС‚Р°РјР°Р»Р°РЅТ“Р°РЅРґР°, РѕР» РѕСЃС‹ Р¶РµСЂРґРµ РїР°Р№РґР° Р±РѕР»Р°РґС‹.',
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
                  {r.currency === 'KZT' ? 'в‚ё' : `${r.currency} `}
                  {formatNumber(Number(r.amount))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(l, 'РўСЂР°РЅР·Р°РєС†РёСЏ', 'РўСЂР°РЅР·Р°РєС†РёСЏ', 'Transaction')}
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    #{r.paymentTransactionId}
                  </div>
                </div>
                <div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(l, 'РЎРѕР·РґР°РЅ', 'Р–Р°СЃР°Р»Т“Р°РЅ', 'Created')}
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {formatDateTime(r.createdAt, l)}
                  </div>
                </div>
                {r.providerRefundId && (
                  <div>
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(l, 'РџСЂРѕРІР°Р№РґРµСЂ', 'РџСЂРѕРІР°Р№РґРµСЂ', 'Provider Ref')}
                    </div>
                    <div className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
                      {r.providerRefundId}
                    </div>
                  </div>
                )}
              </div>
              {r.reason && (
                <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {tx(l, 'РџСЂРёС‡РёРЅР°:', 'РЎРµР±РµР±С–:', 'Reason:')} {r.reason}
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
            'Р’РѕР·РІСЂР°С‚ Р±СѓРґРµС‚ Р·Р°С‡РёСЃР»РµРЅ РЅР° РёСЃС…РѕРґРЅС‹Р№ СЃРїРѕСЃРѕР± РѕРїР»Р°С‚С‹ РІ С‚РµС‡РµРЅРёРµ 3вЂ“10 СЂР°Р±РѕС‡РёС… РґРЅРµР№ РїРѕСЃР»Рµ РѕРґРѕР±СЂРµРЅРёСЏ.',
            'ТљР°Р№С‚Р°СЂСѓ РјР°Т›Т±Р»РґР°РЅТ“Р°РЅРЅР°РЅ РєРµР№С–РЅ 3-10 Р¶Т±РјС‹СЃ РєТЇРЅС–РЅРґРµ Р±Р°СЃС‚Р°РїТ›С‹ С‚У©Р»РµРј С‚У™СЃС–Р»С–РЅРµ Р°СѓРґР°СЂС‹Р»Р°РґС‹.',
            'Refund will be credited to the original payment method within 3вЂ“10 business days after approval.',
          )}
        </span>
      </div>

      <Link to="/support/new" style={{ textDecoration: 'none' }}>
        <Button variant="secondary" size="md" className="w-full">
          <MessageSquare size={14} />{' '}
          {tx(l, 'РЎРІСЏР·Р°С‚СЊСЃСЏ СЃ РїРѕРґРґРµСЂР¶РєРѕР№', 'ТљРѕР»РґР°СѓТ“Р° С…Р°Р±Р°СЂР»Р°СЃСѓ', 'Contact Support')}
        </Button>
      </Link>

      <PaymentFooter lang={l} />
    </div>
  );
}

// в”Ђв”Ђв”Ђ 6) Owner Payouts (history + methods) в”Ђв”Ђв”Ђ
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
          {tx(l, 'РЎРїРѕСЃРѕР±С‹ РІС‹РїР»Р°С‚С‹', 'РўУ©Р»РµРј С‚У™СЃС–Р»РґРµСЂС–', 'Payout Methods')}
        </h3>
        {!adding && (
          <Button variant="ghost" size="sm" onClick={() => setAdding(true)}>
            <Plus size={13} /> {tx(l, 'Р”РѕР±Р°РІРёС‚СЊ', 'ТљРѕСЃСѓ', 'Add')}
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
          {tx(l, 'РњРµС‚РѕРґ РІС‹РїР»Р°С‚С‹ РЅРµ Р·Р°РґР°РЅ.', 'РўУ©Р»РµРј С‚У™СЃС–Р»С– Р±РµР»РіС–Р»РµРЅР±РµРіРµРЅ.', 'No payout method yet.')}
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
                    {m.providerName} В· {m.panMask || 'вЂ”'}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {m.status}
                    {m.isDefault ? ` В· ${tx(l, 'РїРѕ СѓРјРѕР»С‡Р°РЅРёСЋ', 'У™РґРµРїРєС–', 'default')}` : ''}
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
                  'РЈРґР°Р»РёС‚СЊ СЃРїРѕСЃРѕР± РІС‹РїР»Р°С‚С‹',
                  'РўУ©Р»РµРј С‚У™СЃС–Р»С–РЅ Р¶РѕСЋ',
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
              'РџСЂРѕРІР°Р№РґРµСЂСЃРєРёР№ С‚РѕРєРµРЅ РєР°СЂС‚С‹',
              'РџСЂРѕРІР°Р№РґРµСЂ РєР°СЂС‚Р° С‚РѕРєРµРЅС–',
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
              'РњР°СЃРєР° РєР°СЂС‚С‹ (РЅРµРѕР±СЏР·Р°С‚РµР»СЊРЅРѕ), РЅР°РїСЂ. **** 4821',
              'РљР°СЂС‚Р° РјР°СЃРєР°СЃС‹ (РјС–РЅРґРµС‚С‚С– РµРјРµСЃ)',
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
              {tx(l, 'РћС‚РјРµРЅР°', 'Р‘Р°СЃ С‚Р°СЂС‚Сѓ', 'Cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={busy}
              disabled={!token.trim()}
              onClick={() => void submit()}
            >
              {tx(l, 'РЎРѕС…СЂР°РЅРёС‚СЊ', 'РЎР°Т›С‚Р°Сѓ', 'Save')}
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
              'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СѓРґРµСЂР¶РёРІР°РµРјС‹Р№ Р±Р°Р»Р°РЅСЃ.',
              'Т°СЃС‚Р°Р»Т“Р°РЅ С‚РµТЈРіРµСЂС–РјРґС– Р¶ТЇРєС‚РµСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹.',
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
  const currencyPrefix = balance.currency === 'KZT' ? 'в‚ё' : `${balance.currency} `;

  return (
    <Card className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={16} style={{ color: 'var(--eco-primary)' }} />
            <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(l, 'РЎРµР№С‡Р°СЃ СѓРґРµСЂР¶РёРІР°РµС‚СЃСЏ', 'ТљР°Р·С–СЂ Т±СЃС‚Р°Р»С‹РјРґР°', 'Currently held')}
            </span>
          </div>
          <div className="text-[30px] leading-tight" style={{ color: 'var(--eco-primary)' }}>
            {currencyPrefix}
            {amount}
          </div>
        </div>
        <Badge variant={balance.heldPayoutCount > 0 ? 'info' : 'default'}>
          {balance.heldPayoutCount} {tx(l, 'РІС‹РїР»Р°С‚ РІ hold', 'С‚У©Р»РµРј Т±СЃС‚Р°Р»С‹РјРґР°', 'payouts on hold')}
        </Badge>
      </div>

      <p className="text-[12px] mt-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'РЎСѓРјРјР° СѓСЃРїРµС€РЅС‹С… РїР»Р°С‚РµР¶РµР№ СѓС‡Р°СЃС‚РЅРёРєРѕРІ, РїСЂРµРґРЅР°Р·РЅР°С‡РµРЅРЅР°СЏ РІР°Рј Рё РІСЃС‘ РµС‰С‘ РЅР°С…РѕРґСЏС‰Р°СЏСЃСЏ РІ РїРµСЂРёРѕРґРµ hold. Р’РѕР·РІСЂР°С‚С‹ Рё РѕС‚РјРµРЅС‘РЅРЅС‹Рµ РІС‹РїР»Р°С‚С‹ РЅРµ СѓС‡РёС‚С‹РІР°СЋС‚СЃСЏ.',
          'РЎС–Р·РіРµ Р°СЂРЅР°Р»Т“Р°РЅ Р¶У™РЅРµ hold РєРµР·РµТЈС–РЅРґРµРіС– Т›Р°С‚С‹СЃСѓС€С‹Р»Р°СЂРґС‹ТЈ СЃУ™С‚С‚С– С‚У©Р»РµРјРґРµСЂС–РЅС–ТЈ СЃРѕРјР°СЃС‹. ТљР°Р№С‚Р°СЂС‹РјРґР°СЂ РјРµРЅ Р¶РѕР№С‹Р»Т“Р°РЅ С‚У©Р»РµРјРґРµСЂ РµСЃРµРїС‚РµР»РјРµР№РґС–.',
          'Successful member payments owed to you that are still inside the hold period. Refunded and reversed payouts are excluded.',
        )}
      </p>

      {balance.nextReleaseAt && (
        <div
          className="flex items-center gap-2 mt-3 pt-3 text-[12px] border-t"
          style={{ color: 'var(--eco-text-secondary)', borderColor: 'var(--eco-border)' }}
        >
          <Timer size={14} />
          {tx(l, 'Р‘Р»РёР¶Р°Р№С€РµРµ РѕСЃРІРѕР±РѕР¶РґРµРЅРёРµ:', 'Р•ТЈ Р¶Р°Т›С‹РЅ Р±РѕСЃР°С‚Сѓ:', 'Next release:')}{' '}
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
              : tx(l, 'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РІС‹РїР»Р°С‚С‹.', 'РўУ©Р»РµРјРґРµСЂРґС– Р¶ТЇРєС‚РµСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹.', 'Unable to load payouts.'),
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
                  'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СЃРїРѕСЃРѕР±С‹ РІС‹РїР»Р°С‚С‹.',
                  'РўУ©Р»РµРј С‚У™СЃС–Р»РґРµСЂС–РЅ Р¶ТЇРєС‚РµСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹.',
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
                  'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ СѓРґРµСЂР¶РёРІР°РµРјС‹Р№ Р±Р°Р»Р°РЅСЃ.',
                  'Т°СЃС‚Р°Р»С‹РјРґР°Т“С‹ Р±Р°Р»Р°РЅСЃС‚С‹ Р¶ТЇРєС‚РµСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹.',
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

  const handleAddMethod = async (payload: { providerCardToken: string; panMask?: string }) => {
    try {
      const m = await authorizedRequest((token) => registerPayoutMethodRequest(payload, token));
      setMethods((prev) => [m, ...prev]);
      toast.success(
        tx(l, 'РЎРїРѕСЃРѕР± РІС‹РїР»Р°С‚С‹ РґРѕР±Р°РІР»РµРЅ', 'РўУ©Р»РµРј С‚У™СЃС–Р»С– Т›РѕСЃС‹Р»РґС‹', 'Payout method added'),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(
              l,
              'РќРµ СѓРґР°Р»РѕСЃСЊ РґРѕР±Р°РІРёС‚СЊ СЃРїРѕСЃРѕР± РІС‹РїР»Р°С‚С‹',
              'РўУ©Р»РµРј С‚У™СЃС–Р»С–РЅ Т›РѕСЃСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹',
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
        tx(l, 'РЎРїРѕСЃРѕР± РІС‹РїР»Р°С‚С‹ СѓРґР°Р»С‘РЅ', 'РўУ©Р»РµРј С‚У™СЃС–Р»С– Р¶РѕР№С‹Р»РґС‹', 'Payout method removed'),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(
              l,
              'РќРµ СѓРґР°Р»РѕСЃСЊ СѓРґР°Р»РёС‚СЊ СЃРїРѕСЃРѕР± РІС‹РїР»Р°С‚С‹',
              'РўУ©Р»РµРј С‚У™СЃС–Р»С–РЅ Р¶РѕСЋ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹',
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
        <ArrowLeft size={14} /> {tx(l, 'РњРѕРё РєРѕРјРЅР°С‚С‹', 'РњРµРЅС–ТЈ Р±У©Р»РјРµР»РµСЂС–Рј', 'My Rooms')}
      </Link>

      <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {tx(l, 'Р’С‹РїР»Р°С‚С‹ РІР»Р°РґРµР»СЊС†Сѓ', 'РРµРіРµ С‚У©Р»РµРјРґРµСЂ', 'Owner Payouts')}
      </h1>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
        {tx(
          l,
          'РСЃС‚РѕСЂРёСЏ РІС‹РїР»Р°С‚ Рё РЅР°СЃС‚СЂРѕР№РєР° СЃРїРѕСЃРѕР±РѕРІ РІС‹РїР»Р°С‚С‹.',
          'РўУ©Р»РµРјРґРµСЂ С‚Р°СЂРёС…С‹ РјРµРЅ С‚У©Р»РµРј С‚У™СЃС–Р»РґРµСЂС–РЅ Р±Р°РїС‚Р°Сѓ.',
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
              'Р’РѕР№РґРёС‚Рµ, С‡С‚РѕР±С‹ СѓРІРёРґРµС‚СЊ РІС‹РїР»Р°С‚С‹',
              'РўУ©Р»РµРјРґРµСЂРґС– РєУ©СЂСѓ ТЇС€С–РЅ РєС–СЂС–ТЈС–Р·',
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
            {tx(l, 'РСЃС‚РѕСЂРёСЏ РІС‹РїР»Р°С‚', 'РўУ©Р»РµРјРґРµСЂ С‚Р°СЂРёС…С‹', 'Payout History')}
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
              title={tx(l, 'Р’С‹РїР»Р°С‚ РїРѕРєР° РЅРµС‚', 'УР·С–СЂРіРµ С‚У©Р»РµРјРґРµСЂ Р¶РѕТ›', 'No payouts yet')}
              description={tx(
                l,
                'РљРѕРіРґР° СѓС‡Р°СЃС‚РЅРёРєРё РѕРїР»Р°С‚СЏС‚ Рё РїСЂРѕР№РґС‘С‚ РѕРєРЅРѕ СЃРїРѕСЂРѕРІ, РІС‹РїР»Р°С‚Р° РїРѕСЏРІРёС‚СЃСЏ Р·РґРµСЃСЊ.',
                'ТљР°С‚С‹СЃСѓС€С‹Р»Р°СЂ С‚У©Р»РµРї, РґР°Сѓ С‚РµСЂРµР·РµСЃС– У©С‚РєРµРЅРЅРµРЅ РєРµР№С–РЅ, С‚У©Р»РµРј РѕСЃС‹ Р¶РµСЂРґРµ РїР°Р№РґР° Р±РѕР»Р°РґС‹.',
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
                      {p.currency === 'KZT' ? 'в‚ё' : `${p.currency} `}
                      {formatNumber(Number(p.amount))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {p.roomId != null && (
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {tx(l, 'РљРѕРјРЅР°С‚Р°', 'Р‘У©Р»РјРµ', 'Room')}
                        </div>
                        <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          #{p.roomId}
                        </div>
                      </div>
                    )}
                    <div>
                      <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {tx(l, 'РЎРѕР·РґР°РЅР°', 'Р–Р°СЃР°Р»Т“Р°РЅ', 'Created')}
                      </div>
                      <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                        {formatDateTime(p.createdAt, l)}
                      </div>
                    </div>
                    {p.processedAt && (
                      <div>
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {tx(l, 'РћР±СЂР°Р±РѕС‚Р°РЅР°', 'УЁТЈРґРµР»РіРµРЅ', 'Processed')}
                        </div>
                        <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          {formatDateTime(p.processedAt, l)}
                        </div>
                      </div>
                    )}
                  </div>
                  {p.failureReason && (
                    <div className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                      {tx(l, 'РћС€РёР±РєР°:', 'ТљР°С‚Рµ:', 'Failure:')} {p.failureReason}
                    </div>
                  )}
                  {p.providerPayoutId && (
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {tx(l, 'РџСЂРѕРІР°Р№РґРµСЂ:', 'РџСЂРѕРІР°Р№РґРµСЂ:', 'Provider:')} {p.providerPayoutId}
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
            'Р’С‹РїР»Р°С‚Р° РґРѕСЃС‚СѓРїРЅР° РїРѕСЃР»Рµ РїСЂРѕС…РѕР¶РґРµРЅРёСЏ РІРµСЂРёС„РёРєР°С†РёРё Рё РѕРєРЅР° РґР»СЏ СЃРїРѕСЂРѕРІ. Р­С‚Рѕ Р·Р°С‰РёС‰Р°РµС‚ РѕР±Рµ СЃС‚РѕСЂРѕРЅС‹.',
            'РўУ©Р»РµРј РІРµСЂРёС„РёРєР°С†РёСЏ РјРµРЅ РґР°Сѓ С‚РµСЂРµР·РµСЃС–РЅРµРЅ РєРµР№С–РЅ Т›РѕР»Р¶РµС‚С–РјРґС–. Р‘Т±Р» РµРєС– С‚Р°СЂР°РїС‚С‹ Т›РѕСЂТ“Р°Р№РґС‹.',
            'Payout available after verification and dispute window. This protects both parties.',
          )}
        </span>
      </div>

      <PaymentFooter lang={l} />
    </div>
  );
}

