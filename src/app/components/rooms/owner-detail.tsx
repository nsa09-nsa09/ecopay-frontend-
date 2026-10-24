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
  Input,
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
  Pencil,
  XCircle,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiError,
  cancelRoomRequest,
  completeRoomRequest,
  confirmOwnerAccessRequest,
  getRoom,
  getRoomInviteLink,
  getRoomMembers,
  revealIdentifierRequest,
  submitDisputeStatementRequest,
  updateRoomRequest,
  type RoomMemberDto,
  type RoomResponseDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import {
  formatDate as formatAlmatyDate,
  formatDateTime as formatAlmatyDateTime,
  formatMoney,
} from '../../lib/datetime';
import { LeaveReviewModal } from '../reputation/leave-review-modal';
import { ReputationLevelBadge } from '../reputation/level-badge';
import { RoomChat } from './room-chat';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;
const numberOrNull = (value: number | string | null | undefined) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};
const formatDate = (v: string | null | undefined, l: Language) => {
  if (!v) return tx(l, '—', '—', 'TBD');
  return formatAlmatyDate(v, l);
};
const formatDateTime = (v: string | null | undefined, l: Language) =>
  v ? formatAlmatyDateTime(v, l) : null;

// A member occupies a slot / is post-payment once PENDING or ACTIVE.
const POST_PAYMENT = new Set(['PENDING', 'ACTIVE']);
const DEFAULT_REVEAL_TTL_SECONDS = 30;
const OWNER_REVEAL_REASON_OPTIONS = [
  { value: 'PROVIDE_SERVICE_ACCESS' },
  { value: 'RETRY_SERVICE_INVITE' },
  { value: 'RESOLVE_ACCESS_CONFIGURATION' },
];

type RevealedIdentifierState = {
  memberId: string;
  identifierType: string;
  value: string;
  expiresAt: number;
};

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

function identifierTypeLabel(type: string, language: Language): string {
  switch (type) {
    case 'EMAIL':
      return tx(language, 'email', 'email', 'email');
    case 'PHONE':
      return tx(language, 'номер телефона', 'телефон нөмірі', 'phone number');
    default:
      return tx(language, 'контакт', 'байланыс', 'contact');
  }
}

function revealReasonLabel(value: string, language: Language): string {
  switch (value) {
    case 'PROVIDE_SERVICE_ACCESS':
      return tx(language, 'Выдать доступ', 'Қатынас беру', 'Provide access');
    case 'RETRY_SERVICE_INVITE':
      return tx(language, 'Повторить приглашение', 'Шақыруды қайталау', 'Retry invite');
    case 'RESOLVE_ACCESS_CONFIGURATION':
      return tx(
        language,
        'Настроить доступ',
        'Қатынасты баптау',
        'Resolve access setup',
      );
    default:
      return tx(language, 'Другая причина', 'Басқа себеп', 'Other reason');
  }
}

export function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { language, t } = useI18n();
  // Keep the id as a string: room ids are 64-bit and Number() would corrupt them.
  const roomId = id ?? '';
  const { isAuthenticated, isReady, authorizedRequest } = useAuth();

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
  const [revealReasonCode, setRevealReasonCode] = useState(OWNER_REVEAL_REASON_OPTIONS[0].value);
  const [revealReasonDetails, setRevealReasonDetails] = useState('');
  const [revealedIdentifier, setRevealedIdentifier] = useState<RevealedIdentifierState | null>(
    null,
  );
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  const [grantTarget, setGrantTarget] = useState<RoomMemberDto | null>(null);
  const [grantMethod, setGrantMethod] = useState('esim');
  const [grantChecklist, setGrantChecklist] = useState<Record<string, boolean>>({});
  const [grantError, setGrantError] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const [reviewTarget, setReviewTarget] = useState<RoomMemberDto | null>(null);
  const [disputeStatements, setDisputeStatements] = useState<Record<number, string>>({});
  const [disputeSubmitting, setDisputeSubmitting] = useState<number | null>(null);
  const [disputeErrors, setDisputeErrors] = useState<Record<number, string>>({});
  const [disputeSent, setDisputeSent] = useState<Set<number>>(new Set());

  const handleOwnerDisputeStatement = async (disputeId: number) => {
    const text = (disputeStatements[disputeId] ?? '').trim();
    if (text.length < 10 || disputeSubmitting != null) return;
    setDisputeSubmitting(disputeId);
    setDisputeErrors((prev) => ({ ...prev, [disputeId]: '' }));
    try {
      await authorizedRequest((token) =>
        submitDisputeStatementRequest(disputeId, { text }, token),
      );
      setDisputeSent((prev) => new Set(prev).add(disputeId));
      setDisputeStatements((prev) => ({ ...prev, [disputeId]: '' }));
    } catch (err) {
      setDisputeErrors((prev) => ({
        ...prev,
        [disputeId]: err instanceof ApiError ? err.message : tx(language, 'Не удалось отправить.', 'Жіберу мүмкін болмады.', 'Unable to submit.'),
      }));
    } finally {
      setDisputeSubmitting(null);
    }
  };

  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const openEdit = () => {
    if (!room) return;
    setEditTitle(room.title);
    setEditDesc(room.description ?? '');
    setEditError(null);
    setEditOpen(true);
  };
  const submitEdit = async () => {
    if (!room || editSubmitting) return;
    setEditSubmitting(true);
    setEditError(null);
    try {
      const updated = await authorizedRequest((token) =>
        updateRoomRequest(room.id, { title: editTitle.trim(), description: editDesc.trim() }, token),
      );
      setRoom(updated);
      setEditOpen(false);
    } catch (err) {
      setEditError(err instanceof ApiError ? err.message : tx(language, 'Не удалось сохранить.', 'Сақтау мүмкін болмады.', 'Unable to save.'));
    } finally {
      setEditSubmitting(false);
    }
  };

  const openCancel = () => {
    setCancelReason('');
    setCancelConfirm(false);
    setCancelError(null);
    setCancelOpen(true);
  };
  const submitCancel = async () => {
    if (!room || cancelSubmitting || !cancelConfirm || cancelReason.trim().length < 5) return;
    setCancelSubmitting(true);
    setCancelError(null);
    try {
      const updated = await authorizedRequest((token) =>
        cancelRoomRequest(room.id, token, cancelReason.trim()),
      );
      setRoom(updated);
      setCancelOpen(false);
    } catch (err) {
      setCancelError(err instanceof ApiError ? err.message : tx(language, 'Не удалось отменить.', 'Бас тарту мүмкін болмады.', 'Unable to cancel.'));
    } finally {
      setCancelSubmitting(false);
    }
  };

  const submitComplete = async () => {
    if (!room || completeSubmitting) return;
    setCompleteSubmitting(true);
    setCompleteError(null);
    try {
      const updated = await authorizedRequest((token) => completeRoomRequest(room.id, token));
      setRoom(updated);
      setCompleteOpen(false);
    } catch (err) {
      setCompleteError(err instanceof ApiError ? err.message : tx(language, 'Не удалось завершить.', 'Аяқтау мүмкін болмады.', 'Unable to complete.'));
    } finally {
      setCompleteSubmitting(false);
    }
  };

  const loadMembers = useCallback(async () => {
    const result = await authorizedRequest((token) => getRoomMembers(roomId, token, { size: 100 }));
    setMembers(result.items);
  }, [authorizedRequest, roomId]);

  const clearReveal = useCallback(() => {
    setRevealedIdentifier(null);
    setRevealError(null);
    setRevealReasonDetails('');
    setRevealReasonCode(OWNER_REVEAL_REASON_OPTIONS[0].value);
  }, []);

  useEffect(() => clearReveal, [clearReveal]);

  useEffect(() => {
    if (!revealedIdentifier) return undefined;
    const timeout = window.setTimeout(
      () => setRevealedIdentifier(null),
      Math.max(0, revealedIdentifier.expiresAt - Date.now()),
    );
    return () => window.clearTimeout(timeout);
  }, [revealedIdentifier]);

  useEffect(() => {
    if (!isReady) return;
    if (!isAuthenticated) {
      setError(
        tx(
          language,
          'Войдите, чтобы управлять комнатой.',
          'Бөлмені басқару үшін кіріңіз.',
          'Sign in to manage this room.',
        ),
      );
      setLoading(false);
      return;
    }
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
        } else if (err instanceof ApiError && err.status === 404) {
          setError(tx(language, 'Комната не найдена.', 'Бөлме табылмады.', 'Room not found.'));
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
  }, [roomId, authorizedRequest, language, isReady, isAuthenticated]);

  const confirmReveal = async () => {
    if (!revealTarget) return;
    setRevealing(true);
    setRevealError(null);
    setRevealedIdentifier(null);
    try {
      const result = await authorizedRequest((token) =>
        revealIdentifierRequest(
          roomId,
          revealTarget.id,
          {
            reasonCode: revealReasonCode,
            reasonDetails: revealReasonDetails.trim() || undefined,
          },
          token,
        ),
      );
      const ttlSeconds = result.revealTtlSeconds || DEFAULT_REVEAL_TTL_SECONDS;
      setRevealedIdentifier({
        memberId: revealTarget.id,
        identifierType: result.identifierType,
        value: result.identifierValue,
        expiresAt: Date.now() + ttlSeconds * 1000,
      });
    } catch (err) {
      setRevealError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось показать данные для подключения.',
              'Қосылу деректерін көрсету мүмкін болмады.',
              'Unable to reveal the connection details.',
            ),
      );
    } finally {
      setRevealing(false);
    }
  };

  const closeRevealModal = () => {
    setRevealTarget(null);
    clearReveal();
  };

  const copyRevealedIdentifier = async () => {
    if (!revealedIdentifier) return;
    try {
      await navigator.clipboard.writeText(revealedIdentifier.value);
      toast.success(tx(language, 'Данные скопированы', 'Деректер көшірілді', 'Details copied'));
    } catch {
      toast.error(
        tx(
          language,
          'Не удалось скопировать данные',
          'Деректерді көшіру мүмкін болмады',
          'Could not copy details',
        ),
      );
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
  const occupied = numberOrNull(room.filledSeats) ?? 0;
  const freeSeats = numberOrNull(room.freeSeats) ?? 0;
  const existingMembersCount = numberOrNull(room.existingMembersCount) ?? 0;
  const ecoPayMembersCount = Math.max(0, occupied - existingMembersCount);
  const pendingCount = members.filter((m) => m.status === 'PENDING').length;

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
            className="user-text text-[22px] sm:text-[26px] mb-1"
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

      {(room.canEdit || room.canCancel || room.canComplete) && (
        <div className="flex flex-wrap gap-2 mb-6">
          {room.canEdit && (
            <Button variant="secondary" onClick={openEdit}>
              <Pencil size={14} /> {tx(language, 'Редактировать', 'Өңдеу', 'Edit')}
            </Button>
          )}
          {room.canComplete && (
            <Button variant="secondary" onClick={() => { setCompleteError(null); setCompleteOpen(true); }}>
              <CheckCircle size={14} /> {tx(language, 'Завершить', 'Аяқтау', 'Complete')}
            </Button>
          )}
          {room.canCancel && (
            <Button variant="secondary" onClick={openCancel}>
              <XCircle size={14} /> {tx(language, 'Отменить', 'Бас тарту', 'Cancel')}
            </Button>
          )}
        </div>
      )}

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
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-2 rounded-lg p-3"
              style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
            >
              {[
                {
                  label: tx(language, 'Уже были в подписке', 'Жазылымда бұрыннан бар', 'Already in subscription'),
                  value: existingMembersCount,
                },
                {
                  label: tx(language, 'Через EcoPay', 'EcoPay арқылы', 'Through EcoPay'),
                  value: ecoPayMembersCount,
                },
                {
                  label: tx(language, 'Осталось найти', 'Табу қалды', 'Remaining to find'),
                  value: freeSeats,
                },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-1">
                  <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {item.label}
                  </span>
                  <span className="text-[16px]" style={{ color: 'var(--eco-text)', fontWeight: 600 }}>
                    {item.value}
                  </span>
                </div>
              ))}
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
                  const memberProfilePath = p.userPublicId
                    ? `/u/${p.userPublicId}`
                    : `/user/${p.userId}`;
                  const revealed =
                    revealedIdentifier?.memberId === p.id &&
                    revealedIdentifier.expiresAt > Date.now()
                      ? revealedIdentifier
                      : null;
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-lg flex flex-col gap-3"
                      style={{ background: 'var(--eco-surface)' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2 min-w-0">
                          <Link
                            to={memberProfilePath}
                            className="inline-flex items-center gap-2 min-w-0"
                            style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                          >
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] shrink-0"
                              style={{
                                background: 'var(--eco-neutral-100)',
                                color: 'var(--eco-text-secondary)',
                              }}
                            >
                              {(p.userDisplayName || '?').charAt(0).toUpperCase()}
                            </div>
                            <span className="user-text text-[14px]">{p.userDisplayName}</span>
                          </Link>
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
                                {tx(language, 'Контакт', 'Байланыс', 'Contact')}: {revealed.value}
                              </span>
                            ) : (
                              <button
                                className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5"
                                onClick={() => {
                                  setRevealTarget(p);
                                  clearReveal();
                                }}
                                title={tx(
                                  language,
                                  'Показать данные для подключения (логируется)',
                                  'Қосылу деректерін көрсету (журналға жазылады)',
                                  'Reveal connection details (logged)',
                                )}
                              >
                                <Eye size={14} style={{ color: 'var(--eco-primary)' }} />
                                <span style={{ color: 'var(--eco-primary)' }}>
                                  {tx(
                                    language,
                                    'Показать данные для подключения',
                                    'Қосылу деректерін көрсету',
                                    'Reveal connection details',
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

                      {p.dispute && (
                        <div className="mt-2 p-3 rounded-lg flex flex-col gap-2" style={{ border: '1px solid var(--eco-warning)', background: 'var(--eco-warning-100)' }}>
                          <div className="flex items-center gap-2 text-[13px]">
                            <AlertTriangle size={14} style={{ color: 'var(--eco-warning)' }} />
                            <span style={{ color: 'var(--eco-text)' }}>
                              {tx(language, `Спор #${p.dispute.id}`, `#${p.dispute.id} дау`, `Dispute #${p.dispute.id}`)}
                            </span>
                            <Badge variant="warning">{p.dispute.status}</Badge>
                          </div>
                          {p.dispute.status === 'OPEN' && !disputeSent.has(p.dispute.id) && (
                            <div className="flex flex-col gap-1.5">
                              <textarea
                                rows={3}
                                maxLength={2000}
                                value={disputeStatements[p.dispute.id] ?? ''}
                                onChange={(e) => setDisputeStatements((prev) => ({ ...prev, [p.dispute!.id]: e.target.value.slice(0, 2000) }))}
                                placeholder={tx(language, 'Ваше объяснение (мин. 10 символов)', 'Түсіндірмеңіз (кемінде 10 таңба)', 'Your explanation (min. 10 chars)')}
                                className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
                                style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)', color: 'var(--eco-text)' }}
                              />
                              <div className="flex justify-between text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                                <span />
                                <span>{(disputeStatements[p.dispute.id] ?? '').length}/2000</span>
                              </div>
                              {disputeErrors[p.dispute.id] && (
                                <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>{disputeErrors[p.dispute.id]}</p>
                              )}
                              <Button
                                variant="primary"
                                size="sm"
                                loading={disputeSubmitting === p.dispute.id}
                                disabled={(disputeStatements[p.dispute.id] ?? '').trim().length < 10}
                                onClick={() => void handleOwnerDisputeStatement(p.dispute!.id)}
                              >
                                {tx(language, 'Отправить', 'Жіберу', 'Submit')}
                              </Button>
                            </div>
                          )}
                          {disputeSent.has(p.dispute.id) && (
                            <p className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
                              {tx(language, 'Объяснение отправлено.', 'Түсіндірме жіберілді.', 'Statement submitted.')}
                            </p>
                          )}
                          {p.dispute.decision && (
                            <div className="p-2 rounded" style={{ background: 'var(--eco-surface)' }}>
                              <div className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                                {tx(language, 'Решение', 'Шешім', 'Decision')}: <strong>{p.dispute.decision}</strong>
                              </div>
                              {p.dispute.decisionComment && (
                                <p className="user-text text-[12px] mt-1" style={{ color: 'var(--eco-text-secondary)', overflowWrap: 'anywhere', minWidth: 0 }}>
                                  {p.dispute.decisionComment}
                                </p>
                              )}
                            </div>
                          )}
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
              <Lock size={15} style={{ color: 'var(--eco-text-tertiary)' }} />
              <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Правила комнаты', 'Бөлме ережелері', 'Room Rules')}
              </h3>
            </div>
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
                  label: tx(language, 'Свободно', 'Бос', 'Available'),
                  value: `${freeSeats}`,
                  icon: Users,
                },
                {
                  label: tx(language, 'Старт', 'Басталуы', 'Start'),
                  value: formatDate(room.startDate, language),
                  icon: Calendar,
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

      {/* Chat opens once at least one guest has paid (owner + PENDING/ACTIVE member). */}
      {ecoPayMembersCount > 0 && (
        <div className="mt-6">
          <RoomChat roomId={roomId} />
        </div>
      )}

      <Modal
        open={!!revealTarget}
        onClose={closeRevealModal}
        title={tx(
          language,
          'Показать данные для подключения',
          'Қосылу деректерін көрсету',
          'Reveal Connection Details',
        )}
      >
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              `Укажите причину просмотра данных для подключения пользователя ${revealTarget?.userDisplayName ?? ''}. Действие фиксируется в логе безопасности.`,
              `${revealTarget?.userDisplayName ?? ''} пайдаланушысының қосылу деректерін көру себебін көрсетіңіз. Әрекет қауіпсіздік журналында жазылады.`,
              `Provide a reason for viewing ${revealTarget?.userDisplayName ?? ''}'s connection details. This action is logged for security.`,
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
                'например, Добавить участника по его номеру',
                'мысалы, қатысушыны нөмірі бойынша қосу',
                'e.g., Add the member by phone number',
              )}
              value={revealReasonDetails}
              maxLength={180}
              disabled={!!revealedIdentifier}
              onChange={(e) => setRevealReasonDetails(e.target.value)}
            />
          </div>
          <Select
            label={tx(language, 'Тип причины', 'Себеп түрі', 'Reason type')}
            options={OWNER_REVEAL_REASON_OPTIONS.map((option) => ({
              value: option.value,
              label: revealReasonLabel(option.value, language),
            }))}
            value={revealReasonCode}
            disabled={!!revealedIdentifier}
            onChange={(e) => setRevealReasonCode(e.target.value)}
          />
          {revealedIdentifier && (
            <div
              className="rounded-lg p-3 flex flex-col gap-2"
              style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
            >
              <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {identifierTypeLabel(revealedIdentifier.identifierType, language)} ·{' '}
                {tx(
                  language,
                  'показано ненадолго',
                  'қысқа уақытқа көрсетіледі',
                  'shown briefly',
                )}
              </div>
              <div
                className="text-[15px] break-all"
                style={{ color: 'var(--eco-text)', fontFamily: 'monospace' }}
              >
                {revealedIdentifier.value}
              </div>
              <Button variant="secondary" size="sm" onClick={copyRevealedIdentifier}>
                <Copy size={13} />
                {tx(language, 'Скопировать', 'Көшіру', 'Copy')}
              </Button>
            </div>
          )}
          {revealError && (
            <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
              {revealError}
            </p>
          )}
          <Button
            variant="primary"
            disabled={!!revealedIdentifier}
            loading={revealing}
            onClick={confirmReveal}
          >
            {tx(
              language,
              'Показать данные для подключения',
              'Қосылу деректерін көрсету',
              'Reveal connection details',
            )}
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

      {/* Edit modal */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title={tx(language, 'Редактировать комнату', 'Бөлмені өңдеу', 'Edit Room')}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(language, 'Название', 'Атауы', 'Title')}
            </label>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value.slice(0, 150))}
              maxLength={150}
            />
            <span className="text-[11px] text-right" style={{ color: 'var(--eco-text-tertiary)' }}>
              {editTitle.length}/150
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(language, 'Описание', 'Сипаттамасы', 'Description')}
            </label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-[13px] resize-y min-h-[80px]"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
              }}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value.slice(0, 2000))}
              maxLength={2000}
            />
            <span className="text-[11px] text-right" style={{ color: 'var(--eco-text-tertiary)' }}>
              {editDesc.length}/2000
            </span>
          </div>
          {editError && (
            <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>{editError}</p>
          )}
          <Button variant="primary" loading={editSubmitting} onClick={submitEdit} disabled={!editTitle.trim()}>
            {tx(language, 'Сохранить', 'Сақтау', 'Save')}
          </Button>
        </div>
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} title={tx(language, 'Отменить комнату', 'Бөлмені тоқтату', 'Cancel Room')}>
        <div className="flex flex-col gap-4">
          <div className="rounded-lg p-3 text-[13px]" style={{ background: 'var(--eco-warning-50)', color: 'var(--eco-warning-700)', border: '1px solid var(--eco-warning-200)' }}>
            {tx(
              language,
              'Оплатившим участникам вернутся деньги. Отменить это действие нельзя.',
              'Төлем жасаған қатысушыларға ақша қайтарылады. Бұл әрекетті кері қайтару мүмкін емес.',
              'Paid members will be refunded. This action cannot be undone.',
            )}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(language, 'Причина отмены', 'Бас тарту себебі', 'Cancellation reason')}
            </label>
            <textarea
              className="w-full rounded-lg px-3 py-2 text-[13px] resize-y min-h-[60px]"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
              }}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value.slice(0, 500))}
              maxLength={500}
            />
            <span className="text-[11px] text-right" style={{ color: 'var(--eco-text-tertiary)' }}>
              {cancelReason.trim().length}/500 {cancelReason.trim().length < 5 && tx(language, '(мин. 5)', '(мин. 5)', '(min. 5)')}
            </span>
          </div>
          <label className="flex items-center gap-2 text-[13px] cursor-pointer" style={{ color: 'var(--eco-text)' }}>
            <input type="checkbox" checked={cancelConfirm} onChange={(e) => setCancelConfirm(e.target.checked)} />
            {tx(
              language,
              'Подтверждаю отмену комнаты',
              'Бөлменің тоқтатылуын растаймын',
              'I confirm room cancellation',
            )}
          </label>
          {cancelError && (
            <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>{cancelError}</p>
          )}
          <Button
            variant="destructive"
            loading={cancelSubmitting}
            onClick={submitCancel}
            disabled={!cancelConfirm || cancelReason.trim().length < 5}
          >
            {tx(language, 'Отменить комнату', 'Бөлмені тоқтату', 'Cancel Room')}
          </Button>
        </div>
      </Modal>

      {/* Complete modal */}
      <Modal open={completeOpen} onClose={() => setCompleteOpen(false)} title={tx(language, 'Завершить комнату', 'Бөлмені аяқтау', 'Complete Room')}>
        <div className="flex flex-col gap-4">
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'После завершения участники смогут оставить отзыв.',
              'Аяқтағаннан кейін қатысушылар пікір қалдыра алады.',
              'After completion, members will be able to leave reviews.',
            )}
          </p>
          {completeError && (
            <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>{completeError}</p>
          )}
          <Button variant="primary" loading={completeSubmitting} onClick={submitComplete}>
            {tx(language, 'Завершить', 'Аяқтау', 'Complete')}
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
  roomId: string | number;
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
