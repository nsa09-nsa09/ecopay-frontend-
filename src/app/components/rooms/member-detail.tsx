import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { Card, Button, MemberStatusBadge, RoomStatusBadge } from '../ds-primitives';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Shield,
  AlertTriangle,
  LifeBuoy,
  CreditCard,
} from 'lucide-react';
import {
  ApiError,
  confirmMemberAccessRequest,
  createPaymentIntentRequest,
  getRoom,
  getMyMembership,
  type MyRoomMembershipDto,
  type RoomResponseDto,
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
const formatDateTime = (v: string | null | undefined, l: Language) =>
  v ? formatAlmatyDateTime(v, l) : null;

const POST_PAYMENT = new Set(['PENDING', 'ACTIVE']);

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language } = useI18n();
  // Keep the id as a string: room ids are 64-bit and Number() would corrupt them.
  const roomId = id ?? '';
  const { authorizedRequest, user } = useAuth();

  const [room, setRoom] = useState<RoomResponseDto | null>(null);
  const [membership, setMembership] = useState<MyRoomMembershipDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError(tx(language, 'Комната не найдена.', 'Бөлме табылмады.', 'Room not found.'));
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
  }, [roomId, authorizedRequest, language]);

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
    setPaying(true);
    setPayError(null);
    try {
      const intent = await authorizedRequest((token) =>
        createPaymentIntentRequest(membership.id, { idempotencyKey: crypto.randomUUID() }, token),
      );

      if (intent.status === 'SUCCESS') {
        const updated = await authorizedRequest((token) => getMyMembership(roomId, token));
        setMembership(updated);
      } else if (intent.requiresRedirect && intent.paymentUrl) {
        window.localStorage.setItem(
          'ecopay.pendingPayment',
          JSON.stringify({ intentId: intent.id, roomId }),
        );
        window.location.href = intent.paymentUrl;
      } else if (intent.status === 'FAILED') {
        setPayError(intent.failureMessage ?? 'Payment failed. You can safely retry.');
      } else {
        setPayError('Payment is still processing. Refresh in a moment to see the latest status.');
      }
    } catch (err) {
      setPayError(err instanceof ApiError ? err.message : 'Unable to start payment right now.');
    } finally {
      setPaying(false);
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

  // ECOpay commission the member pays on top of their tariff share (owner pays none).
  // Backend-computed; fall back to the bare share if the breakdown isn't available.
  const payShare = Number(room.pricePerMember ?? 0);
  const payTotal = Number(room.pricePerMemberTotal ?? payShare);
  const payCommission = Number(room.pricePerMemberCommission ?? Math.max(0, payTotal - payShare));

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

        {membership.status === 'APPLIED' && (
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
                  {tx(language, 'Ваша доля', 'Сіздің үлесіңіз', 'Your share')}
                </span>
                <span style={{ color: 'var(--eco-text)' }}>{formatMoney(room.pricePerMember)}</span>
              </div>
              {payCommission > 0 && (
                <div className="flex justify-between text-[14px] mb-1">
                  <span style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx(language, 'Комиссия ECOpay', 'ECOpay комиссиясы', 'ECOpay fee')}
                  </span>
                  <span style={{ color: 'var(--eco-text)' }}>{formatMoney(payCommission)}</span>
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
                  {formatMoney(payTotal)}
                </span>
              </div>
              <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {tx(
                  language,
                  'Оплатите долю, чтобы закрепить место. Средства удерживаются до выдачи и подтверждения доступа.',
                  'Орынды сақтау үшін үлесіңізді төлеңіз. Қаражат қатынас берілгенше ұсталады.',
                  'Pay to reserve your seat. Funds are held until the owner grants access and you confirm it.',
                )}
              </div>
            </div>
            {payError && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {payError}
              </p>
            )}
            <Button variant="primary" size="md" loading={paying} onClick={handlePay}>
              <CreditCard size={14} /> {tx(language, 'Оплатить', 'Төлеу', 'Pay')}{' '}
              {formatMoney(payTotal)}
            </Button>
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
                  'Приватность и идентификатор',
                  'Құпиялылық және идентификатор',
                  'Privacy & Identifier',
                )}
              </h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: 'var(--eco-surface)' }}>
              <div className="text-[14px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Ваш идентификатор', 'Сіздің идентификаторыңыз', 'Your identifier')}
                {membership.identifierType ? ` (${membership.identifierType.toLowerCase()})` : ''}
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
                  'Полный идентификатор виден владельцу только после успешной оплаты. Данные хранятся зашифрованными.',
                  'Толық идентификатор тек сәтті төлемнен кейін иесіне көрінеді. Деректер шифрланып сақталады.',
                  'Visible to the room owner only after successful payment. Your full identifier is encrypted and stored securely.',
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Параметры тарифа', 'Тариф параметрлері', 'Plan Details')}
          </h3>
          {[
            {
              label: tx(language, 'Ваша доля', 'Сіздің үлесіңіз', 'Your share'),
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
