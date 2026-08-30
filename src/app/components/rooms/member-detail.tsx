import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, Button, MemberStatusBadge, RoomStatusBadge, Modal, Select } from '../ds-primitives';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  LifeBuoy,
  CreditCard,
  Flag,
} from 'lucide-react';
import {
  ApiError,
  confirmMemberAccessRequest,
  createRoomComplaintRequest,
  createPaymentIntentRequest,
  getCurrentPaymentIntentForMemberRequest,
  getRoom,
  getMyMembership,
  type MyRoomMembershipDto,
  type RoomResponseDto,
  type PaymentIntentResponseDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import {
  formatDate as formatAlmatyDate,
  formatDateTime as formatAlmatyDateTime,
} from '../../lib/datetime';
import { RoomChat } from './room-chat';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const moneyFormatter = new Intl.NumberFormat('ru-RU');
const formatMoney = (v: number | null | undefined) => `₸${moneyFormatter.format(Number(v ?? 0))}`;
const formatCurrency = (v: number | string | null | undefined, currency = 'KZT') => {
  const formatted = moneyFormatter.format(Number(v ?? 0));
  const normalizedCurrency = currency ?? 'KZT';
  return normalizedCurrency === 'KZT' ? `₸${formatted}` : `${normalizedCurrency} ${formatted}`;
};
const toFiniteNumber = (v: number | string | null | undefined) => {
  const parsed = Number(v);
  return Number.isFinite(parsed) ? parsed : null;
};
const formatDateTime = (v: string | null | undefined, l: Language) =>
  v ? formatAlmatyDateTime(v, l) : null;
const unavailableText = (l: Language) => tx(l, 'Недоступно', 'Қолжетімсіз', 'Unavailable');
const identifierTypeLabel = (type: string | null | undefined, l: Language) => {
  switch (type) {
    case 'EMAIL':
      return tx(l, 'email', 'email', 'email');
    case 'PHONE':
      return tx(l, 'номер телефона', 'телефон нөмірі', 'phone number');
    default:
      return tx(l, 'контакт', 'байланыс', 'contact');
  }
};

const POST_PAYMENT = new Set(['PENDING', 'ACTIVE']);
const COMPENSATION_PAYMENT = new Set([
  'REFUND_REQUIRED',
  'REFUND_PENDING',
  'REFUNDED',
  'REQUIRES_REVIEW',
]);

const paymentAttemptKey = (memberId: string) => `ecopay.pendingPayment.${memberId}`;

function readPaymentAttempt(memberId: string): { idempotencyKey: string; intentId?: string } | null {
  try {
    const raw = window.localStorage.getItem(paymentAttemptKey(memberId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { idempotencyKey?: string; intentId?: string };
    if (typeof parsed.idempotencyKey === 'string') {
      return { idempotencyKey: parsed.idempotencyKey, intentId: parsed.intentId };
    }
  } catch {
    // ignore malformed local attempt
  }
  return null;
}

function writePaymentAttempt(memberId: string, value: { idempotencyKey: string; intentId?: string }) {
  window.localStorage.setItem(paymentAttemptKey(memberId), JSON.stringify(value));
}

function clearPaymentAttempt(memberId: string) {
  window.localStorage.removeItem(paymentAttemptKey(memberId));
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useI18n();
  // Keep the id as a string: room ids are 64-bit and Number() would corrupt them.
  const roomId = id ?? '';
  const { authorizedRequest, user, isReady, isAuthenticated } = useAuth();

  const [room, setRoom] = useState<RoomResponseDto | null>(null);
  const [membership, setMembership] = useState<MyRoomMembershipDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const [complaintOpen, setComplaintOpen] = useState(false);
  const [complaintReason, setComplaintReason] = useState('ACCESS_NOT_PROVIDED');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [complaintSubmitting, setComplaintSubmitting] = useState(false);
  const [complaintError, setComplaintError] = useState<string | null>(null);
  const [complaintCreated, setComplaintCreated] = useState<number | null>(null);

  useEffect(() => {
    if (!isReady) return;
    if (!roomId) {
      setError(tx(language, 'Комната не найдена.', 'Бөлме табылмады.', 'Room not found.'));
      setLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setError(
        tx(
          language,
          'Войдите, чтобы посмотреть участие.',
          'Қатысуды көру үшін кіріңіз.',
          'Sign in to view this membership.',
        ),
      );
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([getRoom(roomId), authorizedRequest((token) => getMyMembership(roomId, token))])
      .then(([roomResponse, membershipResponse]) => {
        if (cancelled) return;
        setRoom(roomResponse);
        setMembership(membershipResponse);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError(
            tx(
              language,
              'Вы не участник этой комнаты.',
              'Сіз бұл бөлменің қатысушысы емессіз.',
              'You are not a member of this room.',
            ),
          );
        } else {
          setError(
            tx(
              language,
              'Не удалось загрузить участие.',
              'Қатысуды жүктеу мүмкін болмады.',
              'Unable to load this membership right now.',
            ),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, authorizedRequest, language, isReady, isAuthenticated]);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const updated = await authorizedRequest((token) => confirmMemberAccessRequest(roomId, token));
      setMembership(updated);
    } catch (err) {
      setConfirmError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось подтвердить доступ.',
              'Қатынасты растау мүмкін болмады.',
              'Unable to confirm access right now.',
            ),
      );
    } finally {
      setConfirming(false);
    }
  };

  const handlePay = async () => {
    if (!membership) return;
    if (!room?.settlementCurrency || room.shareKzt == null || room.payableTotalKzt == null) {
      setPayError(
        tx(
          language,
          'Сумма оплаты пока недоступна. Обновите страницу или напишите в поддержку.',
          'Төлем сомасы әзірге қолжетімсіз. Бетті жаңартыңыз немесе қолдауға жазыңыз.',
          'Payment amount is not available yet. Refresh the page or contact support.',
        ),
      );
      return;
    }
    if (room && ['CANCELLED', 'BLOCKED', 'COMPLETED'].includes(room.status)) {
      setPayError(
        tx(
          language,
          'Оплата по этой комнате недоступна. Проверьте текущий статус участия.',
          'Бұл бөлме бойынша төлем қолжетімсіз. Қатысу мәртебесін тексеріңіз.',
          'Payment is not available for this room. Check the current membership status.',
        ),
      );
      return;
    }
    setPaying(true);
    setPayError(null);
    try {
      const memberId = String(membership.id);
      const existingAttempt = readPaymentAttempt(memberId);
      let intent: PaymentIntentResponseDto | null = null;
      if (existingAttempt?.intentId) {
        try {
          intent = await authorizedRequest((token) =>
            getCurrentPaymentIntentForMemberRequest(memberId, token),
          );
        } catch {
          intent = null;
        }
      }
      const idempotencyKey = existingAttempt?.idempotencyKey ?? crypto.randomUUID();
      writePaymentAttempt(memberId, { idempotencyKey, intentId: existingAttempt?.intentId });
      intent ??= await authorizedRequest((token) =>
        createPaymentIntentRequest(memberId, { idempotencyKey }, token),
      );
      writePaymentAttempt(memberId, { idempotencyKey, intentId: intent.id });

      if (intent.status === 'SUCCESS') {
        clearPaymentAttempt(memberId);
        const updated = await authorizedRequest((token) => getMyMembership(roomId, token));
        setMembership(updated);
      } else if (intent.requiresRedirect && intent.paymentUrl) {
        const pendingContext = { intentId: intent.id, roomId, roomMemberId: memberId };
        window.localStorage.setItem(
          `ecopay.pendingPayment.${intent.id}`,
          JSON.stringify(pendingContext),
        );
        window.localStorage.setItem('ecopay.pendingPayment', JSON.stringify(pendingContext));
        window.location.href = intent.paymentUrl;
      } else if (COMPENSATION_PAYMENT.has(intent.status)) {
        clearPaymentAttempt(memberId);
        setPayError(
          tx(
            language,
            'Платёж получен, но место уже недоступно. Мы запустили возврат и покажем его статус в истории платежей.',
            'Төлем қабылданды, бірақ орын енді қолжетімсіз. Қайтарым басталды, мәртебесі төлем тарихында көрінеді.',
            'Payment was captured, but the seat is no longer available. A refund has been started and its status is visible in payment history.',
          ),
        );
      } else if (intent.status === 'FAILED' || intent.status === 'EXPIRED' || intent.status === 'CANCELLED') {
        clearPaymentAttempt(memberId);
        setPayError(
          tx(
            language,
            'Платёж не прошёл. Можно безопасно попробовать ещё раз.',
            'Төлем өтпеді. Қауіпсіз түрде қайта көруге болады.',
            'Payment failed. You can safely retry.',
          ),
        );
      } else {
        setPayError(
          tx(
            language,
            'Платёж ещё обрабатывается. Обновите страницу чуть позже.',
            'Төлем әлі өңделуде. Сәл кейін бетті жаңартыңыз.',
            'Payment is still processing. Refresh in a moment to see the latest status.',
          ),
        );
      }
    } catch (err) {
      setPayError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось начать оплату.',
              'Төлемді бастау мүмкін болмады.',
              'Unable to start payment right now.',
            ),
      );
    } finally {
      setPaying(false);
    }
  };

  const handleComplaint = async () => {
    if (complaintDescription.trim().length < 10) return;
    setComplaintSubmitting(true);
    setComplaintError(null);
    try {
      const dispute = await authorizedRequest((token) =>
        createRoomComplaintRequest(
          roomId,
          {
            reasonCode: complaintReason as
              | 'ACCESS_NOT_PROVIDED'
              | 'ACCESS_NOT_AS_DESCRIBED'
              | 'OWNER_STOPPED_FULFILLING'
              | 'OTHER',
            description: complaintDescription.trim(),
          },
          token,
        ),
      );
      setComplaintCreated(dispute.id);
      setComplaintOpen(false);
      setComplaintDescription('');
    } catch (err) {
      setComplaintError(
        err instanceof ApiError
          ? err.message
          : tx(language, 'Не удалось отправить жалобу.', 'Шағымды жіберу мүмкін болмады.', 'Unable to submit the complaint.'),
      );
    } finally {
      setComplaintSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <Card>
          {tx(language, 'Загрузка участия...', 'Қатысу жүктелуде...', 'Loading membership...')}
        </Card>
      </div>
    );
  }

  if (error || !room || !membership) {
    return (
      <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1 text-[13px] mb-6"
          style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> {tx(language, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
        </Link>
        <Card>
          <span style={{ color: 'var(--eco-negative)' }}>
            {error ??
              tx(language, 'Участие не найдено.', 'Қатысу табылмады.', 'Membership not found.')}
          </span>
        </Card>
      </div>
    );
  }

  const isTelecom = room.roomType === 'TELECOM';
  const paid = POST_PAYMENT.has(membership.status);
  const ownerGranted = !!membership.ownerAccessConfirmedAt;
  const memberConfirmed = !!membership.memberConfirmedAt;
  const isActive = membership.status === 'ACTIVE';
  const canConfirm = membership.status === 'PENDING' && ownerGranted && !memberConfirmed;
  const roomPaymentClosed = ['CANCELLED', 'BLOCKED', 'COMPLETED'].includes(room.status);

  const settlementCurrency = room.settlementCurrency ?? null;
  const payShare = room.shareKzt ?? null;
  const payTotal = room.payableTotalKzt ?? null;
  const payCommission = room.commissionKzt ?? null;
  const canStartPayment = settlementCurrency != null && payShare != null && payTotal != null;
  const originalTariff =
    room.originalTariffPrice != null && room.originalTariffCurrency
      ? formatCurrency(room.originalTariffPrice, room.originalTariffCurrency)
      : null;

  const timelineSteps = [
    {
      label: tx(language, 'Заявка отправлена', 'Өтінім жіберілді', 'Application submitted'),
      time: null as string | null,
      done: true,
    },
    {
      label: tx(language, 'Оплата подтверждена', 'Төлем расталды', 'Payment confirmed'),
      time: null,
      done: paid,
      active: !paid,
    },
    {
      label: tx(language, 'Владелец выдал доступ', 'Иесі қатынас берді', 'Owner granted access'),
      time: formatDateTime(membership.ownerAccessConfirmedAt, language),
      done: ownerGranted,
      active: paid && !ownerGranted,
    },
    {
      label: tx(
        language,
        'Вы подтвердили доступ',
        'Сіз қатынасты растадыңыз',
        'You confirmed access',
      ),
      time: formatDateTime(membership.memberConfirmedAt, language),
      done: memberConfirmed,
      active: canConfirm,
    },
    {
      label: tx(language, 'Участие активно', 'Қатысу белсенді', 'Membership active'),
      time: formatDateTime(membership.activatedAt, language),
      done: isActive,
    },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(language, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div className="min-w-0">
          <h1
            className="text-[22px] sm:text-[26px] mb-1 break-words"
            style={{ color: 'var(--eco-text)' }}
          >
            {room.title}
          </h1>
          <div className="text-[14px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {room.providerName}
            {room.connectionType ? ` · ${room.connectionType}` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MemberStatusBadge status={membership.status} />
          <RoomStatusBadge status={room.status} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Хронология', 'Хронология', 'Status Timeline')}
          </h3>
          <div className="flex flex-col gap-0">
            {timelineSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: step.done
                        ? 'var(--eco-success-100)'
                        : step.active
                          ? 'var(--eco-warning-100)'
                          : 'var(--eco-neutral-100)',
                    }}
                  >
                    {step.done ? (
                      <CheckCircle2 size={13} style={{ color: 'var(--eco-positive)' }} />
                    ) : step.active ? (
                      <Clock size={13} style={{ color: 'var(--eco-warning)' }} />
                    ) : (
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--eco-neutral-300)' }}
                      />
                    )}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div
                      className="w-px h-6"
                      style={{
                        background: step.done ? 'var(--eco-positive)' : 'var(--eco-neutral-200)',
                      }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <div
                    className="text-[14px]"
                    style={{
                      color:
                        step.done || step.active ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
                    }}
                  >
                    {step.label}
                  </div>
                  {step.time && (
                    <div
                      className="text-[12px] mt-0.5"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {step.time}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {membership.status === 'APPLIED' && !roomPaymentClosed && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CreditCard size={16} style={{ color: 'var(--eco-primary)' }} />
              <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Завершите оплату', 'Төлемді аяқтаңыз', 'Complete Payment')}
              </h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
              <div className="flex justify-between text-[14px] mb-1">
                <span style={{ color: 'var(--eco-text-secondary)' }}>
                  {tx(language, 'Тариф', 'Тариф', 'Tariff')}
                </span>
                <span style={{ color: 'var(--eco-text)' }}>
                  {originalTariff ?? formatCurrency(room.pricePerMember, room.currency)}
                </span>
              </div>
              {room.fxRateSnapshot != null && (
                <div className="flex justify-between text-[14px] mb-1">
                  <span style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx(language, 'Курс зафиксирован при создании комнаты', 'Курс бөлме жасалғанда бекітілді', 'FX rate fixed when the room was created')}
                  </span>
                  <span style={{ color: 'var(--eco-text)' }}>{String(room.fxRateSnapshot)}</span>
                </div>
              )}
              <div className="flex justify-between text-[14px] mb-1">
                <span style={{ color: 'var(--eco-text-secondary)' }}>
                  {tx(language, 'Стоимость вашего места', 'Орныңыздың құны', 'Cost of your spot')}
                </span>
                <span style={{ color: 'var(--eco-text)' }}>
                  {canStartPayment
                    ? formatCurrency(payShare, settlementCurrency)
                    : unavailableText(language)}
                </span>
              </div>
              {toFiniteNumber(payCommission) != null && Number(payCommission) > 0 && (
                <div className="flex justify-between text-[14px] mb-1">
                  <span style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx(language, 'Комиссия EcoPay', 'EcoPay комиссиясы', 'EcoPay fee')}
                  </span>
                  <span style={{ color: 'var(--eco-text)' }}>
                    {formatCurrency(payCommission, settlementCurrency ?? 'KZT')}
                  </span>
                </div>
              )}
              <div
                className="flex justify-between text-[14px] mb-2 pt-1 border-t"
                style={{ borderColor: 'var(--eco-border)' }}
              >
                <span style={{ color: 'var(--eco-text)' }}>
                  {tx(language, 'Итого к оплате', 'Барлығы төлеуге', 'Total to pay')}
                </span>
                <span style={{ color: 'var(--eco-text)', fontWeight: 600 }}>
                  {canStartPayment
                    ? formatCurrency(payTotal, settlementCurrency)
                    : unavailableText(language)}
                </span>
              </div>
              <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {tx(
                  language,
                  'Оплатите место, чтобы закрепить его за собой. EcoPay временно удерживает деньги до выплаты владельцу.',
                  'Орынды өзіңізге бекіту үшін төлем жасаңыз. EcoPay ақшаны иесіне аударғанға дейін уақытша ұстайды.',
                  'Pay to reserve your seat. EcoPay temporarily holds the money until the owner payout.',
                )}
              </div>
            </div>
            {payError && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {payError}
              </p>
            )}
            <Button
              variant="primary"
              size="md"
              loading={paying}
              disabled={!canStartPayment}
              onClick={handlePay}
            >
              <CreditCard size={14} /> {tx(language, 'Оплатить', 'Төлеу', 'Pay')}{' '}
              {canStartPayment ? formatCurrency(payTotal, settlementCurrency) : ''}
            </Button>
          </Card>
        )}

        {membership.status === 'APPLIED' && roomPaymentClosed && (
          <Card className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
              style={{ color: 'var(--eco-warning)' }}
            />
            <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(
                language,
                'Оплата по этой комнате недоступна из-за текущего статуса комнаты.',
                'Бөлменің ағымдағы мәртебесіне байланысты төлем қолжетімсіз.',
                'Payment is unavailable because of the current room status.',
              )}
            </div>
          </Card>
        )}

        {membership.status === 'PENDING' && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: 'var(--eco-warning)' }} />
              <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {ownerGranted
                  ? tx(language, 'Подтвердите доступ', 'Қатынасты растаңыз', 'Confirm Access')
                  : tx(
                      language,
                      'Ожидаем выдачу доступа',
                      'Қатынас күтілуде',
                      'Waiting for Access',
                    )}
              </h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--eco-warning-100)' }}>
              <div className="text-[14px] mb-1" style={{ color: 'var(--eco-text)' }}>
                {ownerGranted
                  ? tx(
                      language,
                      'Владелец отметил, что доступ выдан',
                      'Иесі қатынас берілді деп белгіледі',
                      'The owner marked your access as granted',
                    )
                  : tx(
                      language,
                      'Ожидаем выдачи доступа от владельца',
                      'Иесінен қатынас күтілуде',
                      'Waiting for the owner to grant access',
                    )}
              </div>
              <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {ownerGranted
                  ? tx(
                      language,
                      'Проверьте, что тариф вам доступен, и подтвердите ниже, чтобы активировать участие.',
                      'Тарифке кіре алатыныңызды тексеріп, төменде растаңыз, сонда қатысуыңыз белсендіріледі.',
                      'Verify you can use the plan, then confirm below to activate your membership.',
                    )
                  : tx(
                      language,
                      `Владелец предоставит доступ${membership.accessMethod ? ` (${membership.accessMethod})` : ''}. Если задерживается, откройте заявку в поддержку.`,
                      `Иесі қатынас береді${membership.accessMethod ? ` (${membership.accessMethod})` : ''}. Кешігіп жатса, қолдауға өтінім ашыңыз.`,
                      `The room owner will provide access${membership.accessMethod ? ` via ${membership.accessMethod}` : ''}. If it takes too long, you can open a support ticket.`,
                    )}
              </div>
            </div>
            {confirmError && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {confirmError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!canConfirm}
                loading={confirming}
                onClick={handleConfirm}
              >
                {memberConfirmed
                  ? tx(language, 'Доступ подтверждён', 'Қатынас расталды', 'Access Confirmed')
                  : tx(
                      language,
                      'Подтвердить получение доступа',
                      'Қатынас алынды деп растау',
                      'Confirm Access Received',
                    )}
              </Button>
              <Link to="/support/new" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="md" className="w-full sm:w-auto">
                  <LifeBuoy size={14} />{' '}
                  {tx(
                    language,
                    'Создать заявку в поддержку',
                    'Қолдау өтінімін жасау',
                    'Create Support Ticket',
                  )}
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {(room.status === 'BLOCKED' || membership.status === 'BLOCKED_BY_ADMIN') && (
          <Card className="flex items-start gap-3">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0"
              style={{ color: 'var(--eco-negative)' }}
            />
            <div>
              <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Комната заблокирована', 'Бөлме бұғатталған', 'Room Blocked')}
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(
                  language,
                  'Комната заблокирована администратором. Активные участники получат инструкции по возврату на email. Для подробностей обратитесь в поддержку.',
                  'Бөлме әкімші тарапынан бұғатталған. Белсенді қатысушыларға қайтару нұсқаулары email-ге жіберіледі. Толығырақ ақпарат үшін қолдау қызметіне хабарласыңыз.',
                  'This room has been blocked by an administrator. Active members will receive refund instructions via email. Contact support for more information.',
                )}
              </div>
              <Link
                to="/support/new"
                className="inline-flex items-center gap-1 text-[13px] mt-2"
                style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
              >
                <LifeBuoy size={13} />{' '}
                {tx(language, 'Связаться с поддержкой', 'Қолдаумен байланысу', 'Contact Support')}
              </Link>
            </div>
          </Card>
        )}

        {isTelecom && membership.identifierMasked && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: 'var(--eco-primary)' }} />
              <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {tx(
                  language,
                  'Приватность контакта',
                  'Байланыс құпиялылығы',
                  'Contact privacy',
                )}
              </h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
              <div className="text-[14px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Ваш контакт для комнаты', 'Бөлмеге арналған байланысыңыз', 'Your room contact')}
                {membership.identifierType ? ` (${identifierTypeLabel(membership.identifierType, language)})` : ''}
              </div>
              <div
                className="text-[18px] tracking-wider mb-3"
                style={{ color: 'var(--eco-text)', fontFamily: 'monospace' }}
              >
                {membership.identifierMasked}
              </div>
              <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {tx(
                  language,
                  'Полный контакт виден владельцу только после успешной оплаты. Данные хранятся зашифрованными.',
                  'Толық байланыс тек сәтті төлемнен кейін иесіне көрінеді. Деректер шифрланып сақталады.',
                  'Visible to the room owner only after successful payment. Your full contact is encrypted and stored securely.',
                )}
              </div>
            </div>
          </Card>
        )}

        {paid && (
          <Card className="flex flex-col gap-3" style={{ border: '1px solid var(--eco-warning)' }}>
            <div className="flex items-start gap-3">
              <Flag size={17} className="mt-0.5 shrink-0" style={{ color: 'var(--eco-warning)' }} />
              <div>
                <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                  {tx(language, 'Проблема с обязательствами владельца?', 'Иесі міндеттемелерін орындамады ма?', 'Problem with the owner’s obligations?')}
                </h3>
                <p className="text-[13px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>
                  {tx(
                    language,
                    'Отправьте жалобу напрямую модераторам. Если нарушение подтвердится, комната будет заблокирована, а возврат по успешным оплатам участников будет запущен автоматически.',
                    'Шағымды тікелей модераторларға жіберіңіз. Бұзушылық расталса, бөлме бұғатталып, қатысушылардың сәтті төлемдері бойынша қайтару автоматты түрде басталады.',
                    'Send a report directly to moderators. If the breach is confirmed, the room is blocked and refunds for successful member payments are started automatically.',
                  )}
                </p>
              </div>
            </div>
            {complaintCreated && (
              <p className="text-[13px]" style={{ color: 'var(--eco-positive)' }}>
                {tx(language, `Жалоба D-${complaintCreated} отправлена на рассмотрение.`, `D-${complaintCreated} шағымы қарауға жіберілді.`, `Complaint D-${complaintCreated} was sent for review.`)}
              </p>
            )}
            <Button variant="secondary" size="md" onClick={() => setComplaintOpen(true)}>
              <Flag size={14} /> {tx(language, 'Пожаловаться', 'Шағымдану', 'Report a problem')}
            </Button>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Параметры тарифа', 'Тариф параметрлері', 'Plan Details')}
          </h3>
          {[
            {
              label: tx(
                language,
                'Ваша оплата за период',
                'Кезең үшін төлеміңіз',
                'Your payment for this period',
              ),
              value: `${formatMoney(room.pricePerMember)}/${(room.periodType ?? '').toLowerCase()}`,
            },
            { label: tx(language, 'Места', 'Орындар', 'Seats'), value: `${room.maxMembers}` },
            ...(isTelecom
              ? [
                  {
                    label: tx(language, 'Способ доступа', 'Қатынас әдісі', 'Access method'),
                    value: membership.accessMethod ?? room.connectionType ?? '—',
                  },
                ]
              : []),
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-[14px]">
              <span style={{ color: 'var(--eco-text-secondary)' }}>{row.label}</span>
              <span style={{ color: 'var(--eco-text)' }}>{row.value}</span>
            </div>
          ))}
        </Card>

        {paid && <RoomChat roomId={roomId} />}
      </div>

      <Modal
        open={complaintOpen}
        onClose={() => {
          if (!complaintSubmitting) setComplaintOpen(false);
        }}
        title={tx(language, 'Жалоба на владельца комнаты', 'Бөлме иесіне шағым', 'Report the room owner')}
      >
        <div className="flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Жалоба сразу попадёт в очередь модераторов. Укажите только факты — решение и возврат принимает администратор.',
              'Шағым модераторлар кезегіне бірден түседі. Тек фактілерді жазыңыз — шешім мен қайтаруды әкімші қабылдайды.',
              'Your report goes straight to the moderator queue. Please provide facts only; an administrator decides the case and refund.',
            )}
          </p>
          <Select
            label={tx(language, 'Причина', 'Себебі', 'Reason')}
            value={complaintReason}
            onChange={(event) => setComplaintReason(event.target.value)}
            options={[
              { value: 'ACCESS_NOT_PROVIDED', label: tx(language, 'Доступ не предоставлен', 'Қолжетімділік берілмеді', 'Access was not provided') },
              { value: 'ACCESS_NOT_AS_DESCRIBED', label: tx(language, 'Доступ не соответствует описанию', 'Қолжетімділік сипаттамаға сай емес', 'Access does not match the description') },
              { value: 'OWNER_STOPPED_FULFILLING', label: tx(language, 'Владелец перестал выполнять обязательства', 'Иесі міндеттемелерін орындауды тоқтатты', 'Owner stopped fulfilling obligations') },
              { value: 'OTHER', label: tx(language, 'Другая проблема', 'Басқа мәселе', 'Other issue') },
            ]}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Что произошло?', 'Не болды?', 'What happened?')}
            </label>
            <textarea
              rows={5}
              maxLength={5000}
              value={complaintDescription}
              onChange={(event) => setComplaintDescription(event.target.value)}
              placeholder={tx(language, 'Опишите проблему и важные даты.', 'Мәселені және маңызды күндерді сипаттаңыз.', 'Describe the issue and relevant dates.')}
              className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
              style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)', color: 'var(--eco-text)' }}
            />
            <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(language, 'Минимум 10 символов', 'Кемінде 10 таңба', 'At least 10 characters')}
            </span>
          </div>
          {complaintError && <p className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>{complaintError}</p>}
          <Button
            variant="destructive"
            loading={complaintSubmitting}
            disabled={complaintDescription.trim().length < 10}
            onClick={() => void handleComplaint()}
          >
            <Flag size={14} /> {tx(language, 'Отправить жалобу', 'Шағымды жіберу', 'Submit report')}
          </Button>
        </div>
      </Modal>

      {canConfirm && (
        <div
          className="sm:hidden fixed bottom-0 left-0 right-0 p-4 border-t"
          style={{ background: 'var(--eco-bg)', borderColor: 'var(--eco-border)' }}
        >
          <Button
            variant="primary"
            size="lg"
            className="w-full"
            loading={confirming}
            onClick={handleConfirm}
          >
            {tx(
              language,
              'Подтвердить получение доступа',
              'Қатынас алынды деп растау',
              'Confirm Access Received',
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
