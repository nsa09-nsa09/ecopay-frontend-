import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Card, Button, Badge, Modal, Select } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import { Client } from '@stomp/stompjs';
import {
  assignStaffTicketToMeRequest,
  buildSupportWebSocketUrl,
  escalateStaffTicketRequest,
  getStaffSupportQueueRequest,
  getStaffSupportTicketRequest,
  postStaffSupportTicketMessageRequest,
  updateStaffTicketStatusRequest,
  type SupportTicketResponse,
} from '../../lib/api';
import { formatAdminApiError } from './admin-action-ui';
import {
  ArrowUpRight,
  AlertTriangle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  UserPlus,
  Send,
} from 'lucide-react';

const PAGE_SIZE = 20;

const statusVariant: Record<string, 'warning' | 'info' | 'success'> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  CLOSED: 'success',
};

export function AdminTicketsPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [items, setItems] = useState<SupportTicketResponse[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [detail, setDetail] = useState<SupportTicketResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [statusValue, setStatusValue] = useState<string>('OPEN');
  const [actionError, setActionError] = useState<string | null>(null);
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [escalateSubmitting, setEscalateSubmitting] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replySending, setReplySending] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stompClientRef = useRef<Client | null>(null);

  const tx = (ru: string, kz: string, en: string) =>
    language === 'ru' ? ru : language === 'kz' ? kz : en;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await authorizedRequest((token) =>
        getStaffSupportQueueRequest(token, { page, size: PAGE_SIZE }),
      );
      setItems(result.items);
      setTotalPages(Math.max(1, result.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const loadDetail = useCallback(
    async (ticketId: number) => {
      setDetailLoading(true);
      setDetailError(null);
      try {
        const data = await authorizedRequest((token) =>
          getStaffSupportTicketRequest(ticketId, token),
        );
        setDetail(data);
        setStatusValue(data.status);
      } catch (err) {
        setDetailError(formatAdminApiError(err, t));
      } finally {
        setDetailLoading(false);
      }
    },
    [authorizedRequest, t],
  );

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    void loadDetail(selectedId);
  }, [selectedId, loadDetail]);

  // Auto-scroll chat when messages change
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [detail?.messages]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    let cancelled = false;
    let client: Client | null = null;
    const applyRealtimeUpdate = (updatedTicket: SupportTicketResponse) => {
      setItems((prev) => {
        if (updatedTicket.status === 'CLOSED') {
          return prev.filter((it) => it.id !== updatedTicket.id);
        }

        if (prev.some((it) => it.id === updatedTicket.id)) {
          return prev.map((it) =>
            it.id === updatedTicket.id ? { ...it, ...updatedTicket, messages: it.messages } : it,
          );
        }
        return [updatedTicket, ...prev].slice(0, PAGE_SIZE);
      });

      if (selectedId === updatedTicket.id) {
        setDetail(updatedTicket);
        setStatusValue(updatedTicket.status);
      }
    };

    void authorizedRequest(async (token) => {
      if (cancelled) return null;

      client = new Client({
        webSocketFactory: () => new WebSocket(buildSupportWebSocketUrl()),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        reconnectDelay: 5000,
        onConnect: () => {
          client?.subscribe('/topic/staff/support-queue', (message) => {
            applyRealtimeUpdate(JSON.parse(message.body) as SupportTicketResponse);
          });

          if (selectedId != null) {
            client?.subscribe(`/topic/support-tickets/${selectedId}`, (message) => {
              applyRealtimeUpdate(JSON.parse(message.body) as SupportTicketResponse);
            });
          }
        },
        onStompError: (frame) => {
          console.error('Admin support WebSocket error:', frame);
        },
        onWebSocketError: (event) => {
          console.error('Admin support WebSocket connection error:', event);
        },
      });

      client.activate();
      stompClientRef.current = client;
      return null;
    }).catch((err) => {
      console.error('Unable to start admin support WebSocket:', err);
    });

    return () => {
      cancelled = true;
      void client?.deactivate();
    };
  }, [authorizedRequest, selectedId]);

  const summaryById = useMemo(() => new Map(items.map((t) => [t.id, t] as const)), [items]);

  const applyTicketUpdate = (updated: SupportTicketResponse) => {
    setDetail(updated);
    setStatusValue(updated.status);
    setItems((prev) =>
      prev.map((it) => (it.id === updated.id ? { ...it, ...updated, messages: it.messages } : it)),
    );
  };

  const handleAssignToMe = async () => {
    if (!detail) return;
    setAssignSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        assignStaffTicketToMeRequest(detail.id, token),
      );
      applyTicketUpdate(updated);
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setAssignSubmitting(false);
    }
  };

  const handleStatusChange = async () => {
    if (!detail || statusValue === detail.status) return;
    setStatusSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        updateStaffTicketStatusRequest(detail.id, statusValue, token),
      );
      applyTicketUpdate(updated);
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setStatusSubmitting(false);
    }
  };

  const handleEscalate = async () => {
    if (!detail) return;
    setEscalateSubmitting(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        escalateStaffTicketRequest(detail.id, token),
      );
      applyTicketUpdate(updated);
      setEscalateModalOpen(false);
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setEscalateSubmitting(false);
    }
  };

  const handleSendReply = async () => {
    if (!detail || !replyText.trim()) return;
    setReplySending(true);
    setActionError(null);
    try {
      const updated = await authorizedRequest((token) =>
        postStaffSupportTicketMessageRequest(detail.id, replyText.trim(), token),
      );
      applyTicketUpdate(updated);
      setReplyText('');
    } catch (err) {
      setActionError(formatAdminApiError(err, t));
    } finally {
      setReplySending(false);
    }
  };

  const statusOptions = [
    { value: 'OPEN', label: t('statusOpen') },
    { value: 'IN_PROGRESS', label: t('statusInProgress') },
    { value: 'CLOSED', label: t('statusClosed') },
  ];

  const assignedAdminLabel =
    detail?.assignedAdminId == null
      ? null
      : detail.assignedAdminDisplayName?.trim() || `#${detail.assignedAdminId}`;

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('ticketsSupportView')}
          </h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t('retry')}
          </Button>
        </div>
        {error && !loading && (
          <Card className="flex flex-col gap-2 mb-4">
            <div className="text-[14px]" style={{ color: 'var(--eco-negative)' }}>
              {t('loadFailedTitle')}
            </div>
            <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {error}
            </div>
            <Button variant="primary" size="sm" onClick={() => void load()}>
              <RefreshCw size={13} /> {t('retry')}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 flex flex-col gap-2">
            {loading && items.length === 0 && (
              <>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl"
                    style={{
                      background: 'var(--eco-surface-raised)',
                      border: '1px solid var(--eco-border)',
                      minHeight: 80,
                    }}
                  />
                ))}
              </>
            )}
            {!loading && items.length === 0 && (
              <Card
                className="text-center text-[13px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('emptyTickets')}
              </Card>
            )}
            {items.map((tk) => {
              const active = selectedId === tk.id;
              return (
                <button
                  key={tk.id}
                  onClick={() => setSelectedId(tk.id)}
                  className="text-left p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: active ? 'var(--eco-brand-50)' : 'var(--eco-surface-raised)',
                    border: `1px solid ${active ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
                    >
                      T-{tk.id}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant={statusVariant[tk.status] ?? 'default'}>
                        {t(`ticketStatus.${tk.status}`)}
                      </Badge>
                      {tk.escalatedToDispute && (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{
                            background: 'var(--eco-danger-100)',
                            color: 'var(--eco-danger-500)',
                          }}
                        >
                          {t('escalatedBadge')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {tk.subject}
                  </div>
                  <div className="text-[11px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                    #{tk.userId} · {formatDateTime(tk.updatedAt, language)}
                  </div>
                </button>
              );
            })}

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-2 text-[12px]">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page <= 0 || loading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <ChevronLeft size={12} /> {t('prevPage')}
                </Button>
                <span style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('pageOf', { page: page + 1, total: totalPages })}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page >= totalPages - 1 || loading}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t('nextPage')} <ChevronRight size={12} />
                </Button>
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            {selectedId == null ? (
              <Card
                className="flex items-center justify-center py-16 text-[14px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('selectTicket')}
              </Card>
            ) : detailLoading && !detail ? (
              <Card
                className="flex items-center justify-center py-16 text-[13px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {t('loading')}
              </Card>
            ) : detailError ? (
              <Card className="flex flex-col gap-2">
                <div className="text-[14px]" style={{ color: 'var(--eco-negative)' }}>
                  {t('loadFailedTitle')}
                </div>
                <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {detailError}
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => selectedId && void loadDetail(selectedId)}
                >
                  <RefreshCw size={13} /> {t('retry')}
                </Button>
              </Card>
            ) : detail ? (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="text-[16px] break-words" style={{ color: 'var(--eco-text)' }}>
                        {detail.subject}
                      </div>
                      {assignedAdminLabel && (
                        <div
                          className="text-[12px] mt-1"
                          style={{ color: 'var(--eco-text-secondary)' }}
                        >
                          {t('assignedTo')}: {assignedAdminLabel}
                        </div>
                      )}
                      <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        T-{detail.id} · #{detail.userId}
                        {detail.topic ? ` · ${detail.topic}` : ''}
                        {detail.roomId ? ` · ${t('rooms')} #${detail.roomId}` : ''}
                      </div>
                    </div>
                    <Badge variant={statusVariant[detail.status] ?? 'default'}>
                      {t(`ticketStatus.${detail.status}`)}
                    </Badge>
                  </div>

                  {actionError && (
                    <div
                      className="text-[13px]"
                      role="alert"
                      style={{ color: 'var(--eco-negative)' }}
                    >
                      {actionError}
                    </div>
                  )}

                  <div className="flex flex-wrap items-end gap-3">
                    {detail.assignedAdminId == null && detail.status !== 'CLOSED' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        loading={assignSubmitting}
                        onClick={() => void handleAssignToMe()}
                      >
                        <UserPlus size={13} /> {t('takeTicket')}
                      </Button>
                    )}

                    <div style={{ minWidth: 180 }}>
                      <Select
                        label={t('setStatus')}
                        options={statusOptions}
                        value={statusValue}
                        onChange={(e) => setStatusValue(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      loading={statusSubmitting}
                      disabled={statusValue === detail.status}
                      onClick={() => void handleStatusChange()}
                    >
                      {t('submit')}
                    </Button>

                    {!detail.escalatedToDispute && detail.status !== 'CLOSED' && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setEscalateModalOpen(true)}
                      >
                        <ArrowUpRight size={13} /> {t('escalateToDispute')}
                      </Button>
                    )}
                  </div>

                  {detail.escalatedToDispute && (
                    <div
                      className="flex items-center gap-2 p-3 rounded-lg text-[13px]"
                      style={{
                        background: 'var(--eco-danger-100)',
                        color: 'var(--eco-danger-500)',
                      }}
                    >
                      <AlertTriangle size={14} /> {t('escalatedToDisputeReview')}
                    </div>
                  )}
                </Card>

                <Card className="flex flex-col gap-3">
                  <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                    {t('recentActivity')}
                  </div>
                  {!detail.messages || detail.messages.length === 0 ? (
                    <div
                      className="text-[13px] text-center py-4"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {tx('Сообщений пока нет.', 'Әзірге хабарламалар жоқ.', 'No messages yet.')}
                    </div>
                  ) : (
                    <div
                      ref={chatScrollRef}
                      className="flex flex-col gap-3 max-h-[400px] overflow-y-auto"
                    >
                      {detail.messages.map((m) => {
                        const isStaff = m.senderRole === 'SUPPORT' || m.senderRole === 'ADMIN';
                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col gap-1 ${isStaff ? 'items-end' : 'items-start'}`}
                          >
                            <div
                              className="text-[11px] flex items-center gap-1.5"
                              style={{ color: 'var(--eco-text-tertiary)' }}
                            >
                              {isStaff && (
                                <Shield
                                  size={10}
                                  style={{
                                    color:
                                      m.senderRole === 'ADMIN'
                                        ? 'var(--eco-negative)'
                                        : 'var(--eco-primary)',
                                  }}
                                />
                              )}
                              <span
                                style={{
                                  color: isStaff
                                    ? m.senderRole === 'ADMIN'
                                      ? 'var(--eco-negative)'
                                      : 'var(--eco-primary)'
                                    : undefined,
                                }}
                              >
                                {m.senderRole}
                              </span>
                              <span>·</span>
                              <span>{formatDateTime(m.createdAt, language)}</span>
                            </div>
                            <div
                              className="px-3 py-2 rounded-lg text-[13px] max-w-[80%]"
                              style={{
                                background: isStaff ? 'var(--eco-brand-50)' : 'var(--eco-surface)',
                                color: 'var(--eco-text)',
                                whiteSpace: 'pre-wrap',
                              }}
                            >
                              {m.message}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {detail.status !== 'CLOSED' && (
                    <div
                      className="flex items-end gap-2 pt-3 border-t"
                      style={{ borderColor: 'var(--eco-border)' }}
                    >
                      <textarea
                        placeholder={tx(
                          'Ответ от поддержки/админа...',
                          'Қолдау/әкімші жауабы...',
                          'Reply as staff...',
                        )}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value.slice(0, 5000))}
                        rows={2}
                        maxLength={5000}
                        className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
                        style={{
                          background: 'var(--eco-surface)',
                          border: '1px solid var(--eco-border)',
                          color: 'var(--eco-text)',
                        }}
                      />
                      <Button
                        variant="primary"
                        size="sm"
                        loading={replySending}
                        disabled={!replyText.trim()}
                        onClick={() => void handleSendReply()}
                      >
                        <Send size={13} /> {tx('Отправить', 'Жіберу', 'Send')}
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            ) : null}
            {/* unused placeholder reads to keep TS happy if we later reference summary */}
            {summaryById.size === -1 && <span />}
          </div>
        </div>

        <Modal
          open={escalateModalOpen}
          onClose={() => setEscalateModalOpen(false)}
          title={t('escalateToDispute')}
        >
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {t('escalateDisputeConfirm')}
            </div>
            <div
              className="text-[11px] flex items-center gap-1"
              style={{ color: 'var(--eco-text-tertiary)' }}
            >
              <Shield size={11} /> {t('auditLoggedShort')}
            </div>
            <Button
              variant="destructive"
              loading={escalateSubmitting}
              onClick={() => void handleEscalate()}
            >
              {t('escalate')}
            </Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
