import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router';
import { Button, Select, Skeleton } from '../ds-primitives';
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
  MessageSquare,
  MousePointerClick,
  Shield,
  UserPlus,
  Send,
} from 'lucide-react';
import {
  AdminCard,
  AdminConfirm,
  AdminEmptyState,
  AdminErrorState,
  AdminId,
  AdminListSkeleton,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
  AdminStatusBadge,
} from './admin-ui';

const PAGE_SIZE = 20;

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
    { value: 'WAITING_USER', label: t('ticketStatus.WAITING_USER') },
    { value: 'ESCALATED', label: t('ticketStatus.ESCALATED') },
    { value: 'CLOSED', label: t('statusClosed') },
  ];

  const assignedAdminLabel =
    detail?.assignedAdminId == null
      ? null
      : detail.assignedAdminDisplayName?.trim() || `#${detail.assignedAdminId}`;

  return (
    <AdminLayout>
      <AdminPage>
        <AdminPageHeader
          title={t('ticketsSupportView')}
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />
        {error && !loading && items.length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-1 flex flex-col gap-2 min-w-0">
            {loading && items.length === 0 && <AdminListSkeleton rows={4} height={84} />}
            {!loading && error && items.length === 0 && (
              <AdminCard>
                <AdminErrorState message={error} onRetry={() => void load()} />
              </AdminCard>
            )}
            {!loading && !error && items.length === 0 && (
              <AdminCard>
                <AdminEmptyState
                  icon={MessageSquare}
                  title={t('emptyTickets')}
                  description={t('adminTicketsEmptyHint')}
                  compact
                />
              </AdminCard>
            )}
            {items.map((tk) => {
              const active = selectedId === tk.id;
              return (
                <button
                  key={tk.id}
                  type="button"
                  onClick={() => setSelectedId(tk.id)}
                  aria-pressed={active}
                  className={`eco-admin-record is-clickable text-left px-4 py-3 rounded-xl ${active ? 'is-active' : ''}`}
                  style={{ minHeight: 84 }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <AdminId>T-{tk.id}</AdminId>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <AdminStatusBadge status={tk.status}>
                        {t(`ticketStatus.${tk.status}`)}
                      </AdminStatusBadge>
                      {tk.escalatedToDispute && (
                        <AdminStatusBadge tone="danger">{t('escalatedBadge')}</AdminStatusBadge>
                      )}
                    </div>
                  </div>
                  <div
                    className="text-[13px] font-semibold break-words"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {tk.subject}
                  </div>
                  <div className="text-[12px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>
                    #{tk.userId} ·{' '}
                    <span className="tabular-nums">{formatDateTime(tk.updatedAt, language)}</span>
                  </div>
                </button>
              );
            })}

            <AdminPagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
              disabled={loading}
            />
          </div>

          <div className="lg:col-span-2 min-w-0">
            {selectedId == null ? (
              <AdminCard>
                <AdminEmptyState icon={MousePointerClick} title={t('selectTicket')} />
              </AdminCard>
            ) : detailLoading && !detail ? (
              <AdminCard>
                <div className="flex flex-col gap-3" aria-busy="true" aria-label={t('loading')}>
                  <Skeleton width="60%" height={18} />
                  <Skeleton width="35%" height={12} />
                  <Skeleton width="70%" height={36} rounded={8} />
                  <Skeleton height={160} rounded={8} />
                </div>
              </AdminCard>
            ) : detailError ? (
              <AdminCard>
                <AdminErrorState
                  message={detailError}
                  onRetry={() => selectedId && void loadDetail(selectedId)}
                />
              </AdminCard>
            ) : detail ? (
              <div className="flex flex-col gap-4">
                <AdminCard
                  title={<span className="break-words">{detail.subject}</span>}
                  description={
                    <>
                      {assignedAdminLabel && (
                        <span className="block" style={{ color: 'var(--eco-text-secondary)' }}>
                          {t('assignedTo')}: {assignedAdminLabel}
                        </span>
                      )}
                      <span className="block">
                        T-{detail.id} · #{detail.userId}
                        {detail.topic ? ` · ${detail.topic}` : ''}
                      </span>
                      {detail.roomId && (
                        <span className="block mt-0.5">
                          {t('rooms')}:{' '}
                          <Link
                            to={`/admin/rooms?selected=${detail.roomId}`}
                            style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
                          >
                            {detail.roomTitle ? `${detail.roomTitle} · ` : ''}R-{detail.roomId}
                          </Link>
                        </span>
                      )}
                    </>
                  }
                  actions={
                    <AdminStatusBadge status={detail.status}>
                      {t(`ticketStatus.${detail.status}`)}
                    </AdminStatusBadge>
                  }
                >
                  <div className="flex flex-col gap-3">
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

                      <div className="flex-[1_1_180px] min-w-0 max-w-[260px]">
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
                  </div>
                </AdminCard>

                <AdminCard title={t('recentActivity')}>
                  <div className="flex flex-col gap-3">
                    {!detail.messages || detail.messages.length === 0 ? (
                      <AdminEmptyState
                        icon={MessageSquare}
                        title={t('adminNoMessagesYet')}
                        compact
                      />
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
                                className="text-[12px] flex items-center gap-1.5"
                                style={{ color: 'var(--eco-text-tertiary)' }}
                              >
                                {isStaff && (
                                  <Shield
                                    size={11}
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
                                <span className="tabular-nums">
                                  {formatDateTime(m.createdAt, language)}
                                </span>
                              </div>
                              <div
                                className="px-3 py-2 rounded-lg text-[13px] max-w-[80%] break-words"
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
                        className="flex flex-col sm:flex-row sm:items-end gap-2 pt-3 border-t"
                        style={{ borderColor: 'var(--eco-border)' }}
                      >
                        <textarea
                          placeholder={t('adminReplyAsStaff')}
                          aria-label={t('adminReplyAsStaff')}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value.slice(0, 5000))}
                          rows={2}
                          maxLength={5000}
                          className="eco-input flex-1 min-w-0 px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          loading={replySending}
                          disabled={!replyText.trim()}
                          onClick={() => void handleSendReply()}
                        >
                          <Send size={13} /> {t('feedbackSubmit')}
                        </Button>
                      </div>
                    )}
                  </div>
                </AdminCard>
              </div>
            ) : null}
            {/* unused placeholder reads to keep TS happy if we later reference summary */}
            {summaryById.size === -1 && <span />}
          </div>
        </div>

        <AdminConfirm
          open={escalateModalOpen}
          onClose={() => setEscalateModalOpen(false)}
          title={t('escalateToDispute')}
          description={t('escalateDisputeConfirm')}
          confirmLabel={t('escalate')}
          loading={escalateSubmitting}
          onConfirm={handleEscalate}
        >
          <div
            className="text-[12px] flex items-center gap-1"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            <Shield size={12} /> {t('auditLoggedShort')}
          </div>
        </AdminConfirm>
      </AdminPage>
    </AdminLayout>
  );
}
