import { useEffect, useMemo, useRef, useState } from 'react';
import { Client } from '@stomp/stompjs';
import { Send } from 'lucide-react';
import { Card, Button, Input } from '../ds-primitives';
import {
  ApiError,
  buildSupportWebSocketUrl,
  getRoomChatMessagesRequest,
  roomChatTopic,
  sendRoomChatMessageRequest,
  type RoomChatMessageDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime as formatAlmatyDateTime } from '../../lib/datetime';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const PAGE_SIZE = 50;
const MAX_LENGTH = 4000;

function initials(name: string): string {
  return name.trim().slice(0, 2).toUpperCase() || '—';
}

/** Merge a message into the list, keeping chronological order and de-duping by id. */
function mergeMessage(prev: RoomChatMessageDto[], next: RoomChatMessageDto): RoomChatMessageDto[] {
  if (prev.some((m) => m.id === next.id)) return prev;
  return [...prev, next];
}

/**
 * Post-payment room chat. Reads history + sends over REST; receives live via the
 * STOMP topic /topic/rooms/{id}/chat (same /ws socket as the notifications bell).
 * Mount only for paid participants — the backend rejects non-participants on both
 * the REST call and the WebSocket subscribe, but there's no reason to show it.
 */
export function RoomChat({ roomId }: { roomId: string }) {
  const { language } = useI18n();
  const { user, isAuthenticated, authorizedRequest } = useAuth();

  const [messages, setMessages] = useState<RoomChatMessageDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  // authorizedRequest is recreated on every AuthProvider render (not memoized).
  // Keep it behind a ref so the WS effect below doesn't tear down/reconnect on
  // every parent render — same guard the notifications provider uses.
  const authRef = useRef(authorizedRequest);
  authRef.current = authorizedRequest;

  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Initial history load (newest-first from the server; reverse to chronological).
  useEffect(() => {
    if (!roomId || !isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setLoadError(null);

    authRef
      .current((token) => getRoomChatMessagesRequest(roomId, token, { size: PAGE_SIZE }))
      .then((page) => {
        if (cancelled) return;
        setMessages([...page.items].reverse());
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiError
            ? err.message
            : tx(
                language,
                'Не удалось загрузить чат.',
                'Чатты жүктеу мүмкін болмады.',
                'Unable to load the chat right now.',
              ),
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, isAuthenticated, language]);

  // Live subscription on the room's chat topic.
  useEffect(() => {
    if (!roomId || !isAuthenticated) return;

    let cancelled = false;
    let client: Client | null = null;

    void authRef
      .current(async (token) => {
        if (cancelled) return null;
        client = new Client({
          webSocketFactory: () => new WebSocket(buildSupportWebSocketUrl(token)),
          reconnectDelay: 5000,
          onConnect: () => {
            client?.subscribe(roomChatTopic(roomId), (message) => {
              try {
                const dto = JSON.parse(message.body) as RoomChatMessageDto;
                setMessages((prev) => mergeMessage(prev, dto));
              } catch {
                /* malformed push — ignore */
              }
            });
          },
          onStompError: () => {
            /* best-effort — history already seeded the panel */
          },
          onWebSocketError: () => {
            /* best-effort */
          },
        });
        client.activate();
        return null;
      })
      .catch(() => {
        /* could not open WS — REST send still works, refresh shows new messages */
      });

    return () => {
      cancelled = true;
      if (client) {
        try {
          void client.deactivate();
        } catch {
          /* ignore */
        }
      }
    };
  }, [roomId, isAuthenticated]);

  // Keep the transcript pinned to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const canSend = draft.trim().length > 0 && !sending;

  const handleSend = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const saved = await authRef.current((token) =>
        sendRoomChatMessageRequest(roomId, body, token),
      );
      // Append immediately (deduped) so the sender sees it even if the WS echo
      // is delayed or the socket is down.
      setMessages((prev) => mergeMessage(prev, saved));
      setDraft('');
    } catch (err) {
      setSendError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось отправить сообщение.',
              'Хабарламаны жіберу мүмкін болмады.',
              'Unable to send the message right now.',
            ),
      );
    } finally {
      setSending(false);
    }
  };

  const emptyHint = useMemo(
    () =>
      tx(
        language,
        'Пока нет сообщений. Напишите первое — чат виден всем оплатившим участникам и владельцу.',
        'Әзірге хабарлама жоқ. Алғашқысын жазыңыз — чатты барлық төлеген қатысушылар мен иесі көреді.',
        'No messages yet. Say hello — the chat is visible to the owner and all paid members.',
      ),
    [language],
  );

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
          {tx(language, 'Чат комнаты', 'Бөлме чаты', 'Room Chat')}
        </h3>
        <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(
            language,
            'Виден участникам после оплаты',
            'Төлемнен кейін қатысушыларға көрінеді',
            'Visible to paid members',
          )}
        </span>
      </div>

      <div
        ref={scrollRef}
        className="flex flex-col gap-3 overflow-y-auto"
        style={{ maxHeight: 380, minHeight: 120 }}
      >
        {loading ? (
          <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {tx(language, 'Загрузка чата...', 'Чат жүктелуде...', 'Loading chat...')}
          </div>
        ) : loadError ? (
          <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
            {loadError}
          </div>
        ) : messages.length === 0 ? (
          <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {emptyHint}
          </div>
        ) : (
          messages.map((m) => {
            const mine = user != null && m.senderId != null && m.senderId === user.id;
            return (
              <div
                key={m.id}
                className={`flex items-start gap-2 ${mine ? 'flex-row-reverse' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--eco-surface)' }}
                >
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-secondary)' }}>
                    {initials(m.senderName)}
                  </span>
                </div>
                <div className={`flex flex-col gap-0.5 max-w-[75%] ${mine ? 'items-end' : ''}`}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {mine ? tx(language, 'Вы', 'Сіз', 'You') : m.senderName}
                    </span>
                    {m.owner && (
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--eco-brand-100)', color: 'var(--eco-primary)' }}
                      >
                        {tx(language, 'Владелец', 'Иесі', 'Owner')}
                      </span>
                    )}
                    <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {formatAlmatyDateTime(m.createdAt, language)}
                    </span>
                  </div>
                  <div
                    className="text-[14px] px-3 py-2 rounded-lg break-words whitespace-pre-wrap"
                    style={{
                      background: mine ? 'var(--eco-brand-100)' : 'var(--eco-surface)',
                      color: 'var(--eco-text)',
                    }}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {sendError && (
        <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
          {sendError}
        </p>
      )}

      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Input
            value={draft}
            maxLength={MAX_LENGTH}
            placeholder={tx(
              language,
              'Напишите сообщение...',
              'Хабарлама жазыңыз...',
              'Write a message...',
            )}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void handleSend();
              }
            }}
          />
        </div>
        <Button
          variant="primary"
          size="md"
          disabled={!canSend}
          loading={sending}
          onClick={() => void handleSend()}
        >
          <Send size={14} /> {tx(language, 'Отправить', 'Жіберу', 'Send')}
        </Button>
      </div>
    </Card>
  );
}
