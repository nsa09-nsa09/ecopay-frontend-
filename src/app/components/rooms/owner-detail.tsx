import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router';
import {
  Card,
  Button,
  Badge,
  MemberStatusBadge,
  RoomStatusBadge,
  Modal,
  Select,
} from '../ds-primitives';
import {
  ArrowLeft,
  Eye,
  Shield,
  CheckCircle2,
  Copy,
  Lock,
  Users,
  Calendar,
  Clock,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiError,
  confirmOwnerAccessRequest,
  getRoom,
  getRoomInviteLink,
  getRoomMembers,
  revealIdentifierRequest,
  type RoomMemberDto,
  type RoomResponseDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import {
  formatDate as formatAlmatyDate,
  formatDateTime as formatAlmatyDateTime,
} from '../../lib/datetime';
import { LeaveReviewModal } from '../reputation/leave-review-modal';
import { ReputationLevelBadge } from '../reputation/level-badge';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const moneyFormatter = new Intl.NumberFormat('ru-RU');
const formatMoney = (v: number | null | undefined) => `₸${moneyFormatter.format(Number(v ?? 0))}`;
const formatDate = (v: string | null | undefined, l: Language) => {
  if (!v) return tx(l, '—', '—', 'TBD');
  return formatAlmatyDate(v, l);
};
const formatDateTime = (v: string | null | undefined, l: Language) =>
  v ? formatAlmatyDateTime(v, l) : null;

// A member occupies a slot / is post-payment once PENDING or ACTIVE.
const POST_PAYMENT = new Set(['PENDING', 'ACTIVE']);

/** Rebase an invite URL to the current browser origin so that
 *  a misconfigured backend default (localhost:5173) never leaks
 *  into copy-pasteable links on production. */
function rebaseInviteUrl(raw: string): string {
  try {
    const parsed = new URL(raw);
    parsed.protocol = window.location.protocol;
    parsed.host = window.location.host;
    return parsed.toString();
  } catch {
    return raw; // fallback: return as-is if URL is malformed
  }
}

const verificationModeI18nKey: Record<string, string> = {
  RISK_BASED: 'verificationModeRiskBased',
  AUTO: 'verificationModeAuto',
  ADMIN_REQUIRED: 'verificationModeAdminRequired',
};

function localizeVerificationMode(
  mode: string | null | undefined,
  t: (k: string) => string,
): string {
  if (!mode) return '—';
  const key = verificationModeI18nKey[mode];
  return key ? t(key) : mode;
}

export function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useI18n();
  const roomId = Number(id);
  const { authorizedRequest } = useAuth();

  const ACCESS_METHOD_OPTIONS = [
    { value: 'esim', label: tx(language, 'Активация eSIM', 'eSIM белсендіру', 'eSIM activation') },
    {
      value: 'sim',
      label: tx(language, 'Физическая SIM-карта', 'Физикалық SIM-карта', 'Physical SIM card'),
    },
    {
      value: 'family_plan_add',
      label: tx(
        language,
        'Добавлен в семейный тариф',
        'Отбасылық тарифке қосылды',
        'Added to family plan',
      ),
    },
    {
      value: 'invite_link',
      label: tx(language, 'Пригласительная ссылка', 'Шақыру сілтемесі', 'Invite link'),
    },
    {
      value: 'email_invite',
      label: tx(language, 'Приглашение по email', 'Email шақыру', 'Email invite'),
    },
  ];

  const [room, setRoom] = useState<RoomResponseDto | null>(null);
  const [members, setMembers] = useState<RoomMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revealTarget, setRevealTarget] = useState<RoomMemberDto | null>(null);
  const [revealReason, setRevealReason] = useState('');
  const [revealedValues, setRevealedValues] = useState<Record<number, string>>({});
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const [grantTarget, setGrantTarget] = useState<RoomMemberDto | null>(null);
  const [grantMethod, setGrantMethod] = useState('esim');
  const [grantChecklist, setGrantChecklist] = useState<Record<string, boolean>>({});
  const [grantError, setGrantError] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<RoomMemberDto | null>(null);

  const loadMembers = useCallback(async () => {
    const result = await authorizedRequest((token) => getRoomMembers(roomId, token, { size: 100 }));
    setMembers(result.items);
  }, [authorizedRequest, roomId]);

  useEffect(() => {
    if (!roomId) {
      setError(tx(language, 'Комната не найдена.', 'Бөлме табылмады.', 'Room not found.'));
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([
      getRoom(roomId),
      authorizedRequest((token) => getRoomMembers(roomId, token, { size: 100 })),
    ])
      .then(([roomResponse, membersResponse]) => {
        if (cancelled) return;
        setRoom(roomResponse);
        setMembers(membersResponse.items);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setError(
            tx(
              language,
              'Вы не владелец этой комнаты.',
              'Сіз бұл бөлменің иесі емессіз.',
              'You are not the owner of this room.',
            ),
          );
        } else {
          setError(
            tx(
              language,
              'Не удалось загрузить комнату.',
              'Бөлмені жүктеу мүмкін болмады.',
              'Unable to load this room right now.',
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

  const confirmReveal = async () => {
    if (!revealTarget || !revealReason.trim()) return;
    setRevealing(true);
    setRevealError(null);
    try {
      const result = await authorizedRequest((token) =>
        revealIdentifierRequest(roomId, revealTarget.id, { reason: revealReason.trim() }, token),
      );
      setRevealedValues((prev) => ({ ...prev, [revealTarget.id]: result.identifierValue }));
      setRevealTarget(null);
      setRevealReason('');
    } catch (err) {
      setRevealError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось показать идентификатор.',
              'Идентификаторды көрсету мүмкін болмады.',
              'Unable to reveal the identifier.',
            ),
      );
    } finally {
      setRevealing(false);
    }
  };

  const confirmGrant = async () => {
    if (!grantTarget) return;
    setGranting(true);
    setGrantError(null);
    try {
      await authorizedRequest((token) =>
        confirmOwnerAccessRequest(roomId, grantTarget.id, grantMethod, token),
      );
      await loadMembers();
      setGrantTarget(null);
      setGrantChecklist({});
    } catch (err) {
      setGrantError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось подтвердить доступ.',
              'Қатынасты растау мүмкін болмады.',
              'Unable to confirm access.',
            ),
      );
    } finally {
      setGranting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
        <Card>{tx(language, 'Загрузка комнаты...', 'Бөлме жүктелуде...', 'Loading room...')}</Card>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
        <Link
          to="/rooms"
          className="inline-flex items-center gap-1 text-[13px] mb-6"
          style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
        >
          <ArrowLeft size={14} /> {tx(language, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
        </Link>
        <Card>
          <span style={{ color: 'var(--eco-negative)' }}>
            {error ?? tx(language, 'Комната не найдена.', 'Бөлме табылмады.', 'Room not found.')}
          </span>
        </Card>
      </div>
    );
  }

  const isTelecom = room.roomType === 'TELECOM';
  const isLocked = room.startDate ? new Date(room.startDate) <= new Date() : false;
  const occupied = Math.min(
    room.maxMembers,
    1 + members.filter((m) => POST_PAYMENT.has(m.status)).length,
  );
  const pendingCount = members.filter((m) => m.status === 'PENDING').length;
  const revenue = occupied * Number(room.pricePerMember ?? 0);

  return (
    <div className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8">
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
            {room.providerName} · {tx(language, 'Вид владельца', 'Иесі көрінісі', 'Owner view')}
          </div>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Участники', 'Қатысушылар', 'Participants')}
              </h3>
              <Badge variant="info">
                {occupied} / {room.maxMembers} {tx(language, 'участников', 'қатысушы', 'members')}
              </Badge>
            </div>

            {members.length === 0 ? (
              <div
                className="text-[13px] py-4 text-center"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {tx(language, 'Заявок пока нет.', 'Әзірге өтінімдер жоқ.', 'No applications yet.')}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((p) => {
                  const postPayment = POST_PAYMENT.has(p.status);
                  const granted = !!p.ownerAccessConfirmedAt;
                  const revealed = revealedValues[p.id];
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-lg flex flex-col gap-3"
                      style={{ background: 'var(--eco-surface)' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] shrink-0"
                            style={{
                              background: 'var(--eco-neutral-100)',
                              color: 'var(--eco-text-secondary)',
                            }}
                          >
                            {(p.userDisplayName || '?').charAt(0).toUpperCase()}
                          </div>
                          <span
                            className="text-[14px] break-words"
                            style={{ color: 'var(--eco-text)' }}
                          >
                            {p.userDisplayName}
                          </span>
                          <ReputationLevelBadge
                            level={p.userReputationLevel}
                            score={p.userReputation}
                            size="sm"
                          />
                          <MemberStatusBadge status={p.status} />
                          {p.requiresAdminReview && (
                            <Badge variant="warning">
                              {tx(language, 'Проверка', 'Тексеру', 'Review')}
                            </Badge>
                          )}
                        </div>
                        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {tx(language, 'Заявка от', 'Өтінім берілді', 'Applied')}{' '}
                          {formatDate(p.createdAt, language)}
                        </span>
                      </div>

                      {isTelecom &&
                        (postPayment ? (
                          <div className="flex items-center gap-2 text-[13px]">
                            <Shield size={13} style={{ color: 'var(--eco-primary)' }} />
                            {revealed ? (
                              <span
                                style={{
                                  color: 'var(--eco-text-secondary)',
                                  fontFamily: 'monospace',
                                }}
                              >
                                ID: {revealed}
                              </span>
                            ) : (
                              <button
                                className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5"
                                onClick={() => {
                                  setRevealTarget(p);
                                  setRevealReason('');
                                  setRevealError(null);
                                }}
                                title={tx(
                                  language,
                                  'Показать идентификатор (логируется)',
                                  'Идентификаторды көрсету (журналға жазылады)',
                                  'Reveal full identifier (logged)',
                                )}
                              >
                                <Eye size={14} style={{ color: 'var(--eco-primary)' }} />
                                <span style={{ color: 'var(--eco-primary)' }}>
                                  {tx(
                                    language,
                                    'Показать идентификатор',
                                    'Идентификаторды көрсету',
                                    'Reveal identifier',
                                  )}
                                </span>
                                <span
                                  className="text-[11px]"
                                  style={{ color: 'var(--eco-text-tertiary)' }}
                                >
                                  {tx(language, 'Нужна причина', 'Себеп қажет', 'Reason required')}
                                </span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div
                            className="text-[13px] flex items-center gap-1.5"
                            style={{ color: 'var(--eco-text-tertiary)' }}
                          >
                            <Shield size={13} />{' '}
                            {tx(
                              language,
                              'Скрыт до успешной оплаты',
                              'Төлем сәтті болғанға дейін жасырын',
                              'Hidden until payment success',
                            )}
                          </div>
                        ))}

                      <div
                        className="text-[12px]"
                        style={{
                          color: postPayment ? 'var(--eco-positive)' : 'var(--eco-text-tertiary)',
                        }}
                      >
                        {postPayment
                          ? tx(
                              language,
                              'Оплата подтверждена',
                              'Төлем расталды',
                              'Payment confirmed',
                            )
                          : tx(language, 'Ожидаем оплату', 'Төлем күтілуде', 'Awaiting payment')}
                      </div>

                      {p.status === 'PENDING' && !granted && (
                        <div className="flex items-center gap-2 pt-1">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => {
                              setGrantTarget(p);
                              setGrantChecklist({});
                              setGrantError(null);
                            }}
                          >
                            {tx(
                              language,
                              'Отметить доступ выданным',
                              'Қатынас берілді деп белгілеу',
                              'Mark Access Granted',
                            )}
                          </Button>
                        </div>
                      )}

                      {granted && (
                        <div
                          className="text-[12px] flex items-center gap-1.5"
                          style={{ color: 'var(--eco-positive)' }}
                        >
                          <CheckCircle2 size={13} />
                          {tx(language, 'Доступ выдан', 'Қатынас берілді', 'Access granted')}{' '}
                          {formatDateTime(p.ownerAccessConfirmedAt, language)}
                          {p.accessMethod ? ` · ${p.accessMethod}` : ''}
                        </div>
                      )}

                      {room.status === 'COMPLETED' && postPayment && (
                        <div className="pt-1">
                          <Button variant="secondary" size="sm" onClick={() => setReviewTarget(p)}>
                            <Star size={13} />{' '}
                            {tx(language, 'Оставить отзыв', 'Пікір қалдыру', 'Leave a review')}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock
                size={15}
                style={{ color: isLocked ? 'var(--eco-warning)' : 'var(--eco-text-tertiary)' }}
              />
              <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Правила комнаты', 'Бөлме ережелері', 'Room Rules')}
              </h3>
            </div>
            {isLocked && (
              <div
                className="p-3 rounded-lg text-[12px] flex items-start gap-2"
                style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-text-secondary)' }}
              >
                <Lock
                  size={13}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--eco-warning)' }}
                />
                {tx(
                  language,
                  `Поля заблокированы — дата старта (${formatDate(room.startDate, language)}) прошла.`,
                  `Өрістер құлыпталған — басталу күні (${formatDate(room.startDate, language)}) өтті.`,
                  `Fields locked since start date (${formatDate(room.startDate, language)}) has passed.`,
                )}
              </div>
            )}
            {[
              {
                label: tx(language, 'Оператор', 'Оператор', 'Operator'),
                value: room.providerName ?? '—',
              },
              {
                label: tx(language, 'Тариф', 'Тариф', 'Plan'),
                value: room.tariffNameSnapshot ?? tx(language, 'Свой', 'Өзіндік', 'Custom'),
              },
              { label: tx(language, 'Места', 'Орындар', 'Seats'), value: `${room.maxMembers}` },
              {
                label: tx(language, 'Цена / участник', 'Бағасы / қатысушы', 'Price / member'),
                value: `${formatMoney(room.pricePerMember)}/${(room.periodType ?? '').toLowerCase()}`,
              },
              {
                label: tx(language, 'Дата старта', 'Басталу күні', 'Start date'),
                value: formatDate(room.startDate, language),
              },
              ...(isTelecom
                ? [
                    {
                      label: tx(language, 'Способ доступа', 'Қатынас әдісі', 'Access method'),
                      value: room.connectionType ?? '—',
                    },
                  ]
                : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: 'var(--eco-text-secondary)' }}>{row.label}</span>
                <span style={{ color: 'var(--eco-text)' }}>{row.value}</span>
              </div>
            ))}
          </Card>

          <InviteLinkCard roomId={roomId} language={language} t={t} />

          <Card className="flex flex-col gap-3">
            <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Верификация', 'Растау', 'Verification')}
            </h3>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]"
              style={{
                background: 'var(--eco-surface)',
                color: 'var(--eco-text-secondary)',
                border: '1px solid var(--eco-border)',
              }}
            >
              <Shield size={13} />
              {localizeVerificationMode(room.verificationMode, t)}
            </div>
            <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {tx(
                language,
                'Режим верификации задаётся бэкендом и не меняется здесь.',
                'Растау режимі бэкендте автоматты түрде анықталады, өзгертілмейді.',
                'Verification mode is determined automatically by the backend and cannot be changed.',
              )}
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Быстрая статистика', 'Жылдам статистика', 'Quick Stats')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: tx(language, 'Заполнено', 'Толтырылды', 'Filled'),
                  value: `${occupied}/${room.maxMembers}`,
                  icon: Users,
                },
                {
                  label: tx(language, 'Старт', 'Басталуы', 'Start'),
                  value: formatDate(room.startDate, language),
                  icon: Calendar,
                },
                {
                  label: tx(language, 'Выручка', 'Кіріс', 'Revenue'),
                  value: formatMoney(revenue),
                  icon: CheckCircle2,
                },
                {
                  label: tx(language, 'Ожидают', 'Күтеді', 'Pending'),
                  value: `${pendingCount}`,
                  icon: Clock,
                },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {s.label}
                  </div>
                  <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={!!revealTarget}
        onClose={() => setRevealTarget(null)}
        title={tx(
          language,
          'Показать идентификатор',
          'Идентификаторды көрсету',
          'Reveal Full Identifier',
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              `Укажите причину просмотра идентификатора пользователя ${revealTarget?.userDisplayName ?? ''}. Действие фиксируется в логе безопасности.`,
              `${revealTarget?.userDisplayName ?? ''} идентификаторын көрудің себебін көрсетіңіз. Әрекет қауіпсіздік журналында жазылады.`,
              `Provide a reason for viewing ${revealTarget?.userDisplayName ?? ''}'s full telecom identifier. This action is logged for security.`,
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Причина', 'Себебі', 'Reason')}
            </label>
            <input
              className="px-3 py-2 rounded-lg outline-none text-[14px]"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
              }}
              placeholder={tx(
                language,
                'напр., Активация eSIM для участника',
                'мысалы, қатысушыға eSIM белсендіру',
                'e.g., Activating eSIM for member',
              )}
              value={revealReason}
              onChange={(e) => setRevealReason(e.target.value)}
            />
          </div>
          {revealError && (
            <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
              {revealError}
            </p>
          )}
          <Button
            variant="primary"
            disabled={!revealReason.trim()}
            loading={revealing}
            onClick={confirmReveal}
          >
            {tx(language, 'Показать идентификатор', 'Идентификаторды көрсету', 'Reveal Identifier')}
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!grantTarget}
        onClose={() => {
          setGrantTarget(null);
          setGrantChecklist({});
        }}
        title={tx(language, 'Выдать доступ', 'Қатынас беру', 'Grant Access')}
      >
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              `Подтвердите, что вы предоставили доступ участнику ${grantTarget?.userDisplayName ?? ''}. Заполните чек-лист ниже.`,
              `${grantTarget?.userDisplayName ?? ''} қатысушыға қатынас бергеніңізді растаңыз. Төмендегі тізімді толтырыңыз.`,
              `Confirm that you have provided access to ${grantTarget?.userDisplayName ?? ''}. Complete the checklist below.`,
            )}
          </div>

          <Select
            label={tx(
              language,
              'Способ выдачи доступа',
              'Қатынас беру тәсілі',
              'Access method used',
            )}
            options={ACCESS_METHOD_OPTIONS}
            value={grantMethod}
            onChange={(e) => setGrantMethod(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            {[
              {
                key: 'method',
                label: tx(
                  language,
                  'Доступ выдан выбранным способом',
                  'Қатынас таңдалған тәсілмен берілді',
                  'Access has been provided via the selected method',
                ),
              },
              {
                key: 'activated',
                label: tx(
                  language,
                  'Линия / аккаунт участника активирован',
                  'Қатысушының желісі / тіркелгісі белсендірілді',
                  "Member's line/account has been activated",
                ),
              },
              {
                key: 'confirmed',
                label: tx(
                  language,
                  'Подтверждаю действие и понимаю, что оно логируется',
                  'Әрекетті растаймын және ол журналға жазылатынын түсінемін',
                  'I confirm this action and understand it is logged',
                ),
              },
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!grantChecklist[item.key]}
                  onChange={(e) =>
                    setGrantChecklist({ ...grantChecklist, [item.key]: e.target.checked })
                  }
                />
                <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>

          {grantError && (
            <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
              {grantError}
            </p>
          )}

          <Button
            variant="primary"
            disabled={
              !grantChecklist.method || !grantChecklist.activated || !grantChecklist.confirmed
            }
            loading={granting}
            onClick={confirmGrant}
          >
            {tx(
              language,
              'Подтвердить выдачу доступа',
              'Қатынас беруді растау',
              'Confirm Access Granted',
            )}
          </Button>
        </div>
      </Modal>

      <LeaveReviewModal
        open={!!reviewTarget}
        onClose={() => setReviewTarget(null)}
        recipientId={reviewTarget?.userId ?? 0}
        roomId={roomId}
        recipientName={reviewTarget?.userDisplayName}
      />
    </div>
  );
}

function InviteLinkCard({
  roomId,
  language,
  t,
}: {
  roomId: number;
  language: Language;
  t: (k: string) => string;
}) {
  const { authorizedRequest } = useAuth();
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const writeToClipboard = async (value: string): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
        return true;
      }
    } catch {
      /* fall through to legacy path */
    }
    // Legacy fallback: select the read-only input and use the old API. Some
    // older Safari builds and any non-https origin land here.
    try {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.select();
        const ok = typeof document !== 'undefined' && document.execCommand?.('copy');
        input.blur();
        return Boolean(ok);
      }
    } catch {
      /* user can still copy manually from the visible input */
    }
    return false;
  };

  const ensureLink = async (): Promise<string | null> => {
    if (url) return url;
    setLoading(true);
    try {
      const res = await authorizedRequest((token) => getRoomInviteLink(roomId, token));
      setUrl(res.url);
      return res.url;
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось получить ссылку.',
              'Сілтемені алу мүмкін болмады.',
              'Could not get the invite link.',
            );
      toast.error(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const link = await ensureLink();
    if (!link) return;
    const ok = await writeToClipboard(rebaseInviteUrl(link));
    if (ok) {
      setCopied(true);
      toast.success(t('inviteLinkCopiedToast'));
      window.setTimeout(() => setCopied(false), 1800);
    } else {
      // Surface the read-only input so the owner can copy manually.
      inputRef.current?.focus();
      inputRef.current?.select();
      toast.error(t('inviteLinkCopyFailed'));
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
        {t('inviteOffPlatformTitle')}
      </h3>
      <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {t('inviteOffPlatformDesc')}
      </p>
      {url && (
        <input
          ref={inputRef}
          readOnly
          value={rebaseInviteUrl(url)}
          onClick={(e) => e.currentTarget.select()}
          className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text-secondary)',
          }}
          aria-label={t('inviteOffPlatformTitle')}
        />
      )}
      <Button variant="secondary" size="sm" loading={loading} onClick={() => void handleCopy()}>
        <Copy size={13} />
        {copied ? t('inviteLinkCopiedToast') : t('inviteLinkCopy')}
      </Button>
    </Card>
  );
}
