import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, Button, Select, Badge, EmptyState, Skeleton, SkeletonCard } from '../ds-primitives';
import {
  ArrowLeft,
  Send,
  AlertCircle,
  CheckCircle2,
  Shield,
  Plus,
  AlertTriangle,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  ApiError,
  buildSupportWebSocketUrl,
  createSupportTicketRequest,
  getJoinedRooms,
  getMyRooms,
  getMySupportTicketRequest,
  getMySupportTicketsRequest,
  postSupportTicketMessageRequest,
  type JoinedRoomDto,
  type RoomSummaryDto,
  type SupportTicketResponse,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDate, formatDateTime } from '../../lib/datetime';
import { Client } from '@stomp/stompjs';
import { userStatusLabel } from '../../lib/user-facing-enums';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const TOPIC_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  access: 'default',
  payment: 'default',
  wrong_plan: 'default',
  refund: 'default',
  abuse: 'default',
  other: 'default',
};

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_USER: 'warning',
  ESCALATED: 'danger',
  CLOSED: 'default',
};

function useTopicOptions() {
  const { language } = useI18n();
  return useMemo(
    () => [
      {
        value: 'access',
        label: tx(language, 'Доступ не предоставлен', 'Қатынас берілмеген', 'Access not granted'),
      },
      {
        value: 'payment',
        label: tx(language, 'Проблема с оплатой', 'Төлем мәселесі', 'Payment issue'),
      },
      { value: 'wrong_plan', label: tx(language, 'Не тот тариф', 'Қате тариф', 'Wrong plan') },
      {
        value: 'refund',
        label: tx(language, 'Запрос возврата', 'Қайтару сұрауы', 'Refund request'),
      },
      { value: 'abuse', label: tx(language, 'Жалоба', 'Шағым', 'Abuse report') },
      { value: 'other', label: tx(language, 'Другое', 'Басқа', 'Other') },
    ],
    [language],
  );
}

function localizeStatus(l: Language, status: string): string {
  return userStatusLabel(status, l);
}

function relativeTime(iso: string | null | undefined, l: Language): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return tx(l, 'Только что', 'Жаңа ғана', 'Just now');
  if (m < 60) return tx(l, `${m} мин назад`, `${m} мин бұрын`, `${m}m ago`);
  const h = Math.floor(m / 60);
  if (h < 24) return tx(l, `${h} ч назад`, `${h} сағ бұрын`, `${h}h ago`);
  const d = Math.floor(h / 24);
  if (d < 7) return tx(l, `${d} д назад`, `${d} к бұрын`, `${d}d ago`);
  const w = Math.floor(d / 7);
  if (w < 5) return tx(l, `${w} нед назад`, `${w} апта бұрын`, `${w}w ago`);
  return formatDate(date, l);
}

function TicketListView({
  tickets,
  loading,
  error,
  onSelect,
  onCreate,
  onRetry,
}: {
  tickets: SupportTicketResponse[];
  loading: boolean;
  error: string | null;
  onSelect: (id: number) => void;
  onCreate: () => void;
  onRetry: () => void;
}) {
  const { language } = useI18n();
  const TOPIC_OPTIONS = useTopicOptions();
  const TOPIC_LABELS: Record<string, string> = useMemo(
    () => Object.fromEntries(TOPIC_OPTIONS.map((o) => [o.value, o.label])),
    [TOPIC_OPTIONS],
  );
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [topicFilter, setTopicFilter] = useState('ALL');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      tickets.filter((t) => {
        if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
        if (topicFilter !== 'ALL' && t.topic !== topicFilter) return false;
        const searchText = `${t.subject} T-${t.id} ${t.roomTitle ?? ''}`.toLocaleLowerCase();
        if (query.trim() && !searchText.includes(query.trim().toLocaleLowerCase())) return false;
        return true;
      }),
    [tickets, statusFilter, topicFilter, query],
  );

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[22px] sm:text-[26px] mb-1" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Центр поддержки', 'Қолдау орталығы', 'Support Center')}
          </h1>
          <p className="text-[14px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Управляйте обращениями и отслеживайте их статус',
              'Өтінімдерді басқарыңыз және мәртебесін бақылаңыз',
              'Manage your support tickets and track resolutions',
            )}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Link to="/feedback" style={{ textDecoration: 'none' }} className="w-full sm:w-auto">
            <Button variant="secondary" size="md" className="w-full sm:w-auto">
              <MessageSquare size={15} />{' '}
              {tx(language, 'Обратная связь', 'Кері байланыс', 'Feedback')}
            </Button>
          </Link>
          <Button variant="primary" size="md" onClick={onCreate} className="w-full sm:w-auto">
            <Plus size={15} /> {tx(language, 'Создать заявку', 'Өтінім жасау', 'Create Ticket')}
          </Button>
        </div>
      </div>

      {!loading && !error && tickets.length > 0 && (
        <div className="mb-5 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_190px_220px] gap-3 items-end">
          <label
            className="flex flex-col gap-1 text-[13px]"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {tx(language, 'Поиск', 'Іздеу', 'Search')}
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tx(
                language,
                'Поиск по заявкам...',
                'Өтінімдерді іздеу...',
                'Search tickets...',
              )}
              className="w-full min-w-0 rounded-lg px-3 py-2.5 text-[14px] outline-none"
              style={{
                background: 'var(--eco-surface-raised)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
              }}
            />
          </label>
          <Select
            label={tx(language, 'Статус', 'Мәртебе', 'Status')}
            options={[
              {
                value: 'ALL',
                label: tx(language, 'Все статусы', 'Барлық мәртебелер', 'All statuses'),
              },
              { value: 'OPEN', label: tx(language, 'Открыта', 'Ашық', 'Open') },
              { value: 'IN_PROGRESS', label: tx(language, 'В работе', 'Жұмыста', 'In Progress') },
              { value: 'WAITING_USER', label: localizeStatus(language, 'WAITING_USER') },
              { value: 'ESCALATED', label: localizeStatus(language, 'ESCALATED') },
              { value: 'CLOSED', label: tx(language, 'Закрыта', 'Жабық', 'Closed') },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
          <Select
            label={tx(language, 'Категория', 'Санат', 'Category')}
            options={[
              {
                value: 'ALL',
                label: tx(language, 'Все темы', 'Барлық тақырыптар', 'All topics'),
              },
              ...TOPIC_OPTIONS,
            ]}
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
          />
        </div>
      )}

      {loading ? (
        <TicketListSkeleton />
      ) : error ? (
        <Card className="flex flex-col gap-3 items-start">
          <div
            className="flex items-center gap-2 text-[14px]"
            style={{ color: 'var(--eco-negative)' }}
          >
            <AlertCircle size={15} /> {error}
          </div>
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {tx(language, 'Попробовать снова', 'Қайта көру', 'Try again')}
          </Button>
        </Card>
      ) : tickets.length === 0 ? (
        <NoTicketsEmpty onCreate={onCreate} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={tx(language, 'Заявки не найдены', 'Өтінімдер табылмады', 'No Tickets Found')}
          description={tx(
            language,
            'Под выбранные фильтры нет заявок. Измените фильтры или создайте новую заявку.',
            'Таңдалған сүзгілерге өтінімдер сәйкес келмейді. Сүзгілерді өзгертіңіз немесе жаңа өтінім жасаңыз.',
            'No tickets match your current filters. Adjust filters or create a new ticket.',
          )}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((ticket) => (
            <Card key={ticket.id} className="hover:shadow-sm transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 min-w-0">
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onSelect(ticket.id)}
                    className="block text-left text-[16px] sm:text-[17px] font-semibold break-words cursor-pointer"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {ticket.subject}
                  </button>
                  <div
                    className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px]"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    <span>T-{ticket.id}</span>
                    <span aria-hidden="true">·</span>
                    <span>
                      {TOPIC_LABELS[ticket.topic] ??
                        tx(language, 'Другая тема', 'Басқа тақырып', 'Other topic')}
                    </span>
                    {ticket.roomId && (
                      <>
                        <span aria-hidden="true">·</span>
                        <Link
                          to={`/room/${ticket.roomId}`}
                          className="break-words underline"
                          style={{ color: 'var(--eco-text-secondary)' }}
                        >
                          {ticket.roomTitle ||
                            `${tx(language, 'Комната', 'Бөлме', 'Room')} #${ticket.roomId}`}
                        </Link>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex sm:flex-col sm:items-end items-center justify-between gap-2 shrink-0">
                  <Badge variant={STATUS_VARIANT[ticket.status] ?? 'default'}>
                    {localizeStatus(language, ticket.status)}
                  </Badge>
                  <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {relativeTime(ticket.updatedAt ?? ticket.createdAt, language)}
                  </span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

function CreateTicketView({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (ticketId: number) => void;
}) {
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();
  const { language } = useI18n();
  const TOPIC_OPTIONS = useTopicOptions();
  const navigate = useNavigate();

  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('access');
  const [roomId, setRoomId] = useState('');
  const [rooms, setRooms] = useState<Array<JoinedRoomDto | RoomSummaryDto>>([]);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login?redirect=/support/new');
    }
  }, [isAuthenticated, isReady, navigate]);

  // Limit choices to rooms the current user can actually reference. This
  // avoids asking them to copy a numeric ID while retaining the optional
  // association supported by the existing ticket API.
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;

    Promise.all([
      authorizedRequest((token) => getJoinedRooms(token)),
      authorizedRequest((token) => getMyRooms(token, { size: 100 })),
    ])
      .then(([joined, owned]) => {
        if (cancelled) return;
        const byId = new Map<string, JoinedRoomDto | RoomSummaryDto>();
        joined.forEach((room) => byId.set(String(room.roomId), room));
        owned.items.forEach((room) => byId.set(String(room.id), room));
        setRooms([...byId.values()]);
      })
      .catch(() => {
        // The ticket remains usable without a linked room if this optional
        // lookup is unavailable.
        if (!cancelled) setRooms([]);
      });

    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, isAuthenticated, isReady]);

  const roomOptions = useMemo(
    () => [
      { value: '', label: tx(language, 'Не выбрано', 'Таңдалмаған', 'No room selected') },
      ...rooms.map((room) => {
        const id = 'roomId' in room ? room.roomId : room.id;
        return {
          value: String(id),
          label: `${room.title} · ${room.serviceName}`,
        };
      }),
    ],
    [language, rooms],
  );

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const numericRoomId = roomId ? Number(roomId) : undefined;
      const selectedRoomId =
        numericRoomId !== undefined && Number.isSafeInteger(numericRoomId)
          ? numericRoomId
          : roomId || undefined;
      const ticket = await authorizedRequest((token) =>
        createSupportTicketRequest(
          {
            subject: subject.trim(),
            topic,
            message: message.trim(),
            roomId: selectedRoomId,
          },
          token,
        ),
      );
      toast.success(
        tx(
          language,
          `Заявка T-${ticket.id} создана`,
          `T-${ticket.id} өтінімі құрылды`,
          `Ticket T-${ticket.id} created`,
        ),
      );
      onCreated(ticket.id);
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось создать заявку.',
              'Өтінім жасау мүмкін болмады.',
              'Unable to create ticket right now.',
            );
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start"
        style={{ color: 'var(--eco-primary)', background: 'transparent', border: 'none' }}
      >
        <ArrowLeft size={14} />{' '}
        {tx(language, 'К списку заявок', 'Өтінімдерге оралу', 'Back to Tickets')}
      </button>

      <h2 className="text-[20px] sm:text-[22px]" style={{ color: 'var(--eco-text)' }}>
        {tx(
          language,
          'Создать заявку в поддержку',
          'Қолдау өтінімін жасау',
          'Create Support Ticket',
        )}
      </h2>

      <Card className="flex flex-col gap-5 w-full max-w-[760px]">
        <div className="flex flex-col gap-1.5">
          <label style={{ color: 'var(--eco-text)', fontSize: 14 }}>
            {tx(language, 'Тема', 'Тақырыбы', 'Subject')}
          </label>
          <input
            placeholder={tx(language, 'Краткое описание', 'Қысқаша сипаттама', 'Short summary')}
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 200))}
            maxLength={200}
            className="px-3 py-2.5 rounded-lg outline-none"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
              fontSize: 14,
            }}
          />
        </div>

        <Select
          label={tx(language, 'Категория', 'Санат', 'Topic')}
          options={TOPIC_OPTIONS}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <Select
          label={tx(
            language,
            'Связанная комната (опционально)',
            'Байланысты бөлме (міндетті емес)',
            'Related room (optional)',
          )}
          options={roomOptions}
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label style={{ color: 'var(--eco-text)', fontSize: 14 }}>
            {tx(language, 'Сообщение', 'Хабарлама', 'Message')}
          </label>
          <textarea
            rows={5}
            placeholder={tx(
              language,
              'Опишите проблему подробно...',
              'Мәселені толық сипаттаңыз...',
              'Describe your issue in detail...',
            )}
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
            maxLength={5000}
            className="px-3 py-2.5 rounded-lg outline-none resize-none"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
              fontSize: 14,
            }}
          />
          <span className="text-[11px] self-end" style={{ color: 'var(--eco-text-tertiary)' }}>
            {message.length}/5000
          </span>
        </div>

        <div
          className="flex items-start gap-2 p-3 rounded-lg"
          style={{ background: 'var(--eco-surface)' }}
        >
          <AlertCircle
            size={14}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--eco-text-tertiary)' }}
          />
          <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(
              language,
              'Пожалуйста, не отправляйте дубли: поддержка ответит в течение 24 часов.',
              'Қайталанған хабарларды жібермеңіз: қолдау 24 сағат ішінде жауап береді.',
              'Please avoid repeated messages: our support team will respond within 24 hours.',
            )}
          </div>
        </div>

        {error && (
          <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </p>
        )}

        <Button
          variant="primary"
          className="w-full"
          loading={submitting}
          disabled={!subject.trim() || !message.trim()}
          onClick={handleSubmit}
        >
          {tx(language, 'Отправить заявку', 'Өтінімді жіберу', 'Submit Ticket')}
        </Button>
      </Card>
    </div>
  );
}

function TicketDetailView({ ticketId, onBack }: { ticketId: number; onBack: () => void }) {
  const { authorizedRequest, user } = useAuth();
  const { language } = useI18n();
  const TOPIC_OPTIONS = useTopicOptions();
  const TOPIC_LABELS: Record<string, string> = useMemo(
    () => Object.fromEntries(TOPIC_OPTIONS.map((o) => [o.value, o.label])),
    [TOPIC_OPTIONS],
  );
  const [ticket, setTicket] = useState<SupportTicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const stompClientRef = useRef<Client | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authorizedRequest((token) => getMySupportTicketRequest(ticketId, token))
      .then((data) => {
        if (!cancelled) setTicket(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : tx(
                language,
                'Не удалось загрузить заявку.',
                'Өтінімді жүктеу мүмкін болмады.',
                'Unable to load this ticket right now.',
              ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticketId, authorizedRequest, language]);

  // Auto-scroll chat when messages change
  useEffect(() => {
    if (chatEndRef.current && chatEndRef.current.parentElement) {
      chatEndRef.current.parentElement.scrollTop = chatEndRef.current.parentElement.scrollHeight;
    }
  }, [ticket?.messages]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let cancelled = false;
    let client: Client | null = null;

    void authorizedRequest(async (token) => {
      if (cancelled) return null;

      client = new Client({
        webSocketFactory: () => new WebSocket(buildSupportWebSocketUrl()),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        onConnect: () => {
          client?.subscribe(`/topic/support-tickets/${ticketId}`, (message) => {
            setTicket(JSON.parse(message.body) as SupportTicketResponse);
          });
        },
        onStompError: (frame) => {
          console.error('User support WebSocket error:', frame);
        },
        onWebSocketError: (event) => {
          console.error('User support WebSocket connection error:', event);
        },
      });

      client.activate();
      stompClientRef.current = client;
      return null;
    }).catch((err) => {
      console.error('Unable to start user support WebSocket:', err);
    });

    return () => {
      cancelled = true;
      void client?.deactivate();
    };
  }, [authorizedRequest, ticketId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    setSending(true);
    try {
      const updated = await authorizedRequest((token) =>
        postSupportTicketMessageRequest(ticket.id, newMessage.trim(), token),
      );
      setTicket(updated);
      setNewMessage('');
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось отправить сообщение',
              'Хабарламаны жіберу мүмкін болмады',
              'Failed to send message',
            ),
      );
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  if (loading) return <TicketDetailSkeleton />;

  if (error || !ticket) {
    return (
      <div className="flex flex-col gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start"
          style={{ color: 'var(--eco-primary)', background: 'transparent', border: 'none' }}
        >
          <ArrowLeft size={14} />{' '}
          {tx(language, 'К списку заявок', 'Өтінімдерге оралу', 'Back to Tickets')}
        </button>
        <Card>
          <div
            className="flex items-center gap-2 text-[14px]"
            style={{ color: 'var(--eco-negative)' }}
          >
            <AlertCircle size={15} />{' '}
            {error ?? tx(language, 'Заявка не найдена.', 'Өтінім табылмады.', 'Ticket not found.')}
          </div>
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === 'CLOSED';
  const isEscalated = !!ticket.escalatedToDispute;

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 200px)' }}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start mb-4"
        style={{ color: 'var(--eco-primary)', background: 'transparent', border: 'none' }}
      >
        <ArrowLeft size={14} />{' '}
        {tx(language, 'К списку заявок', 'Өтінімдерге оралу', 'Back to Tickets')}
      </button>

      <Card className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className="text-[13px]"
              style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
            >
              T-{ticket.id}
            </span>
            <h2 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
              {ticket.subject}
            </h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={TOPIC_VARIANT[ticket.topic] ?? 'default'}>
            {TOPIC_LABELS[ticket.topic] ??
              tx(language, 'Другая тема', 'Басқа тақырып', 'Other topic')}
          </Badge>
          <Badge variant={STATUS_VARIANT[ticket.status] ?? 'default'}>
            {localizeStatus(language, ticket.status)}
          </Badge>
          {ticket.roomId && (
            <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(language, 'Комната', 'Бөлме', 'Room')} #{ticket.roomId}
            </span>
          )}
          <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(language, 'Создана', 'Құрылды', 'Created')}{' '}
            {formatDateTime(ticket.createdAt, language)}
          </span>
        </div>

        <div className="flex items-center gap-0 mt-1 overflow-x-auto pb-1">
          {(['OPEN', 'IN_PROGRESS', 'CLOSED'] as const).map((s, i, arr) => {
            const order: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, CLOSED: 2 };
            const isActive = order[s] <= order[ticket.status];
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: isActive ? 'var(--eco-primary)' : 'var(--eco-neutral-200)',
                    }}
                  >
                    {isActive && (
                      <CheckCircle2 size={11} style={{ color: 'var(--eco-text-on-primary)' }} />
                    )}
                  </div>
                  <span
                    className="text-[11px]"
                    style={{ color: isActive ? 'var(--eco-text)' : 'var(--eco-text-tertiary)' }}
                  >
                    {localizeStatus(language, s)}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div
                    className="w-8 h-px mx-1.5"
                    style={{
                      background:
                        order[s] < order[ticket.status]
                          ? 'var(--eco-primary)'
                          : 'var(--eco-neutral-200)',
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {isEscalated && (
        <div
          className="flex items-start gap-3 p-4 rounded-xl mb-4"
          style={{ background: 'var(--eco-danger-100)', border: '1px solid var(--eco-danger-500)' }}
        >
          <AlertTriangle
            size={16}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--eco-danger-500)' }}
          />
          <div>
            <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
              {tx(
                language,
                'Передано в рассмотрение спора',
                'Дау қарауына берілді',
                'Escalated to Dispute Review',
              )}
            </div>
            <div className="text-[13px] mt-0.5" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(
                language,
                'Заявка передана на рассмотрение спора. Старший представитель возьмёт ваш случай в работу.',
                'Өтінім дау қарауына берілді. Аға өкіл сіздің ісіңізді қарайды.',
                'This ticket has been escalated to a dispute review. A senior representative will handle your case.',
              )}
            </div>
          </div>
        </div>
      )}

      <Card className="flex flex-col flex-1">
        <div className="flex flex-col gap-5 mb-4 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
          {ticket.messages.length === 0 && (
            <div
              className="text-[13px] text-center py-8"
              style={{ color: 'var(--eco-text-tertiary)' }}
            >
              {tx(language, 'Сообщений пока нет.', 'Әзірге хабарламалар жоқ.', 'No messages yet.')}
            </div>
          )}
          {ticket.messages.map((m) => {
            const isMine = user?.id != null && m.senderUserId === user.id;
            const isStaff = m.senderRole === 'SUPPORT' || m.senderRole === 'ADMIN';
            return (
              <div
                key={m.id}
                className={`flex flex-col gap-1 ${isMine ? 'items-end' : 'items-start'}`}
              >
                <div
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  {isStaff ? (
                    <div className="flex items-center gap-1">
                      <Shield
                        size={11}
                        style={{
                          color:
                            m.senderRole === 'ADMIN' ? 'var(--eco-negative)' : 'var(--eco-primary)',
                        }}
                      />
                      <span
                        style={{
                          color:
                            m.senderRole === 'ADMIN' ? 'var(--eco-negative)' : 'var(--eco-primary)',
                        }}
                      >
                        {m.senderRole === 'ADMIN'
                          ? tx(language, 'Админ', 'Әкімші', 'Admin')
                          : tx(language, 'Поддержка', 'Қолдау', 'Support')}
                      </span>
                    </div>
                  ) : (
                    <span>
                      {isMine
                        ? tx(language, 'Вы', 'Сіз', 'You')
                        : tx(language, 'Пользователь', 'Пайдаланушы', 'User')}
                    </span>
                  )}
                  <span>·</span>
                  <span>{formatDateTime(m.createdAt, language)}</span>
                </div>
                <div
                  className="max-w-sm sm:max-w-md px-4 py-3 rounded-xl text-[14px]"
                  style={{
                    background: isMine
                      ? 'var(--eco-brand-50)'
                      : m.senderRole === 'ADMIN'
                        ? 'var(--eco-danger-100)'
                        : 'var(--eco-surface)',
                    color: 'var(--eco-text)',
                    borderBottomRightRadius: isMine ? 4 : undefined,
                    borderBottomLeftRadius: !isMine ? 4 : undefined,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.message}
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {!isClosed ? (
          <div
            className="flex items-end gap-2 pt-4 border-t"
            style={{ borderColor: 'var(--eco-border)' }}
          >
            <textarea
              placeholder={tx(
                language,
                'Напишите сообщение...',
                'Хабарлама жазыңыз...',
                'Type your message...',
              )}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value.slice(0, 5000))}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={5000}
              className="flex-1 px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
                minHeight: 40,
                maxHeight: 120,
              }}
            />
            <button
              className="cursor-pointer p-2.5 rounded-lg shrink-0 disabled:opacity-40"
              style={{ background: 'var(--eco-primary)', border: 'none' }}
              onClick={() => void sendMessage()}
              disabled={!newMessage.trim() || sending}
              aria-label={tx(language, 'Отправить сообщение', 'Хабарламаны жіберу', 'Send message')}
            >
              {sending ? (
                <Loader2
                  size={15}
                  className="animate-spin"
                  style={{ color: 'var(--eco-text-on-primary)' }}
                />
              ) : (
                <Send size={15} style={{ color: 'var(--eco-text-on-primary)' }} />
              )}
            </button>
          </div>
        ) : (
          <div
            className="flex items-center gap-2 pt-4 border-t text-[13px]"
            style={{ borderColor: 'var(--eco-border)', color: 'var(--eco-text-tertiary)' }}
          >
            <CheckCircle2 size={14} />
            {tx(
              language,
              'Эта заявка закрыта. Если нужна помощь, создайте новую заявку.',
              'Бұл өтінім жабылды. Көмек қажет болса, жаңа өтінім жасаңыз.',
              'This ticket is closed. Create a new ticket if you need further assistance.',
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function TicketListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton width={60} height={14} />
              <Skeleton width={70} height={20} rounded={4} />
            </div>
            <Skeleton width={40} height={12} />
          </div>
          <Skeleton width="80%" height={14} />
          <div className="flex items-center gap-2">
            <Skeleton width={90} height={18} rounded={4} />
            <Skeleton width={100} height={12} />
          </div>
        </Card>
      ))}
    </div>
  );
}

function TicketDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton width={100} height={14} />
      <SkeletonCard />
      <Card className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`flex flex-col gap-1 ${i % 2 === 1 ? 'items-end' : 'items-start'}`}
          >
            <Skeleton width={80} height={12} />
            <Skeleton width={240} height={48} rounded={12} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function NoTicketsEmpty({ onCreate }: { onCreate: () => void }) {
  const { language } = useI18n();
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
        style={{ background: 'var(--eco-surface)' }}
      >
        <MessageSquare size={28} style={{ color: 'var(--eco-text-tertiary)' }} />
      </div>
      <div className="text-[18px] mb-2" style={{ color: 'var(--eco-text)' }}>
        {tx(language, 'Заявок в поддержку нет', 'Қолдау өтінімдері жоқ', 'No Support Tickets')}
      </div>
      <div className="text-[14px] max-w-sm mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        {tx(
          language,
          'Вы пока не создавали обращений. Если есть проблема с комнатой, оплатой или доступом, поддержка поможет.',
          'Әзірге өтінім жасамадыңыз. Бөлмемен, төлеммен немесе қатынаспен мәселе болса, қолдау көмектеседі.',
          "You haven't created any support tickets yet. If you're experiencing an issue with a room, payment, or access, our team is here to help.",
        )}
      </div>
      <Button variant="primary" onClick={onCreate}>
        <Plus size={15} />{' '}
        {tx(language, 'Создать первую заявку', 'Алғашқы өтінім жасау', 'Create Your First Ticket')}
      </Button>
    </div>
  );
}

export function SupportPage() {
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login?redirect=/support');
    }
  }, [isReady, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    authorizedRequest((token) => getMySupportTicketsRequest(token))
      .then((data) => {
        if (!cancelled) setTickets(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : tx(
                language,
                'Не удалось загрузить заявки.',
                'Өтінімдерді жүктеу мүмкін болмады.',
                'Unable to load tickets right now.',
              ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, isAuthenticated, reloadVersion]);

  const retry = () => {
    setReloadVersion((version) => version + 1);
  };

  return (
    <div
      className={`w-full ${view === 'detail' ? 'max-w-[1100px]' : 'max-w-[1280px]'} mx-auto px-4 sm:px-6 lg:px-8 py-8`}
    >
      {view === 'list' && (
        <TicketListView
          tickets={tickets}
          loading={loading}
          error={error}
          onSelect={(id) => {
            setSelectedTicket(id);
            setView('detail');
          }}
          onCreate={() => setView('create')}
          onRetry={retry}
        />
      )}
      {view === 'create' && (
        <CreateTicketView
          onBack={() => setView('list')}
          onCreated={(id) => {
            setSelectedTicket(id);
            setView('detail');
          }}
        />
      )}
      {view === 'detail' && selectedTicket != null && (
        <TicketDetailView ticketId={selectedTicket} onBack={() => setView('list')} />
      )}
    </div>
  );
}

export function NewTicketPage() {
  const navigate = useNavigate();
  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CreateTicketView
        onBack={() => navigate('/support')}
        onCreated={(id) => navigate(`/support?ticket=${id}`)}
      />
    </div>
  );
}
