import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Card, Button, Select, Badge, EmptyState, Skeleton, SkeletonCard } from "../ds-primitives";
import {
  ArrowLeft, Send, AlertCircle, CheckCircle2,
  Shield, Plus, Filter, ChevronDown, ChevronUp,
  AlertTriangle, Loader2, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import {
  ApiError,
  createSupportTicketRequest,
  getMySupportTicketRequest,
  getMySupportTicketsRequest,
  postSupportTicketMessageRequest,
  type SupportTicketResponse,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";

const TOPIC_OPTIONS = [
  { value: "access", label: "Access not granted" },
  { value: "payment", label: "Payment issue" },
  { value: "wrong_plan", label: "Wrong plan" },
  { value: "refund", label: "Refund request" },
  { value: "abuse", label: "Abuse report" },
  { value: "other", label: "Other" },
];

const TOPIC_LABELS: Record<string, string> = Object.fromEntries(
  TOPIC_OPTIONS.map((o) => [o.value, o.label]),
);

const TOPIC_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  access: "warning",
  payment: "danger",
  wrong_plan: "info",
  refund: "warning",
  abuse: "danger",
  other: "default",
};

const STATUS_VARIANT: Record<string, "default" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  CLOSED: "success",
};

function relativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const m = Math.floor(diffMs / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return date.toLocaleDateString();
}

// ─── Ticket List ───
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
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = useMemo(() => tickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (topicFilter !== "ALL" && t.topic !== topicFilter) return false;
    return true;
  }), [tickets, statusFilter, topicFilter]);

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>Support Center</h1>
          <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            Manage your support tickets and track resolutions
          </p>
        </div>
        <Button variant="primary" size="md" onClick={onCreate}>
          <Plus size={15} /> Create Ticket
        </Button>
      </div>

      {!loading && !error && tickets.length > 0 && (
        <div className="mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
            style={{ color: "var(--eco-text-secondary)", background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
          >
            <Filter size={14} />
            Filters
            {(statusFilter !== "ALL" || topicFilter !== "ALL") && (
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--eco-primary)" }} />
            )}
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      )}

      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Status"
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "OPEN", label: "Open" },
                { value: "IN_PROGRESS", label: "In Progress" },
                { value: "CLOSED", label: "Closed" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            />
            <Select
              label="Topic"
              options={[{ value: "ALL", label: "All topics" }, ...TOPIC_OPTIONS]}
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            />
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={() => { setStatusFilter("ALL"); setTopicFilter("ALL"); }}>
                Clear filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <TicketListSkeleton />
      ) : error ? (
        <Card className="flex flex-col gap-3 items-start">
          <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--eco-negative)" }}>
            <AlertCircle size={15} /> {error}
          </div>
          <Button variant="secondary" size="sm" onClick={onRetry}>Try again</Button>
        </Card>
      ) : tickets.length === 0 ? (
        <NoTicketsEmpty onCreate={onCreate} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No Tickets Found" description="No tickets match your current filters. Adjust filters or create a new ticket." />
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Subject</div>
            <div className="col-span-2">Topic</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Room</div>
            <div className="col-span-1">Updated</div>
          </div>

          {filtered.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:shadow-sm transition-shadow">
              <button
                className="w-full text-left cursor-pointer"
                style={{ background: "transparent", border: "none", padding: 0 }}
                onClick={() => onSelect(t.id)}
              >
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                  <div className="col-span-1 text-[13px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>T-{t.id}</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t.subject}</span>
                    {t.escalatedToDispute && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                        Escalated
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Badge variant={TOPIC_VARIANT[t.topic] ?? "default"}>{TOPIC_LABELS[t.topic] ?? t.topic}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={STATUS_VARIANT[t.status] ?? "default"}>{t.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="col-span-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {t.roomId ? `Room #${t.roomId}` : "—"}
                  </div>
                  <div className="col-span-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {relativeTime(t.updatedAt)}
                  </div>
                </div>

                <div className="sm:hidden flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>T-{t.id}</span>
                      <Badge variant={STATUS_VARIANT[t.status] ?? "default"}>{t.status.replace("_", " ")}</Badge>
                      {t.escalatedToDispute && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                          Escalated
                        </span>
                      )}
                    </div>
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{relativeTime(t.updatedAt)}</span>
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t.subject}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={TOPIC_VARIANT[t.topic] ?? "default"}>{TOPIC_LABELS[t.topic] ?? t.topic}</Badge>
                    {t.roomId && <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Room #{t.roomId}</span>}
                  </div>
                </div>
              </button>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ─── Create Ticket ───
function CreateTicketView({ onBack, onCreated }: { onBack: () => void; onCreated: (ticketId: number) => void }) {
  const { authorizedRequest, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("access");
  const [roomId, setRoomId] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/support/new");
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const parsedRoomId = roomId.trim() ? Number(roomId.trim()) : undefined;
      const ticket = await authorizedRequest((token) =>
        createSupportTicketRequest({
          subject: subject.trim(),
          topic,
          message: message.trim(),
          roomId: parsedRoomId && !Number.isNaN(parsedRoomId) ? parsedRoomId : undefined,
        }, token),
      );
      toast.success(`Ticket T-${ticket.id} created`);
      onCreated(ticket.id);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Unable to create ticket right now.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button onClick={onBack} className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start" style={{ color: "var(--eco-primary)", background: "transparent", border: "none" }}>
        <ArrowLeft size={14} /> Back to Tickets
      </button>

      <h2 className="text-[22px]" style={{ color: "var(--eco-text)" }}>Create Support Ticket</h2>

      <Card className="flex flex-col gap-5">
        <div className="flex flex-col gap-1.5">
          <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Subject</label>
          <input
            placeholder="Short summary"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 200))}
            maxLength={200}
            className="px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
          />
        </div>

        <Select
          label="Topic"
          options={TOPIC_OPTIONS}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <div className="flex flex-col gap-1.5">
          <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Related Room ID (optional)</label>
          <input
            placeholder="e.g. 42"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            className="px-3 py-2.5 rounded-lg outline-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Message</label>
          <textarea
            rows={5}
            placeholder="Describe your issue in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 5000))}
            maxLength={5000}
            className="px-3 py-2.5 rounded-lg outline-none resize-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
          />
          <span className="text-[11px] self-end" style={{ color: "var(--eco-text-tertiary)" }}>{message.length}/5000</span>
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
          <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Please avoid repeated messages — our support team will respond within 24 hours.
          </div>
        </div>

        {error && (
          <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{error}</p>
        )}

        <Button
          variant="primary"
          className="w-full"
          loading={submitting}
          disabled={!subject.trim() || !message.trim()}
          onClick={handleSubmit}
        >
          Submit Ticket
        </Button>
      </Card>
    </div>
  );
}

// ─── Ticket Detail ───
function TicketDetailView({ ticketId, onBack }: { ticketId: number; onBack: () => void }) {
  const { authorizedRequest, user } = useAuth();
  const [ticket, setTicket] = useState<SupportTicketResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    authorizedRequest((token) => getMySupportTicketRequest(ticketId, token))
      .then((data) => { if (!cancelled) setTicket(data); })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Unable to load this ticket right now.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [ticketId, authorizedRequest]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !ticket) return;
    setSending(true);
    try {
      const updated = await authorizedRequest((token) =>
        postSupportTicketMessageRequest(ticket.id, newMessage.trim(), token),
      );
      setTicket(updated);
      setNewMessage("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  if (loading) return <TicketDetailSkeleton />;

  if (error || !ticket) {
    return (
      <div className="flex flex-col gap-4">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start" style={{ color: "var(--eco-primary)", background: "transparent", border: "none" }}>
          <ArrowLeft size={14} /> Back to Tickets
        </button>
        <Card>
          <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--eco-negative)" }}>
            <AlertCircle size={15} /> {error ?? "Ticket not found."}
          </div>
        </Card>
      </div>
    );
  }

  const isClosed = ticket.status === "CLOSED";
  const isEscalated = !!ticket.escalatedToDispute;

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 200px)" }}>
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start mb-4"
        style={{ color: "var(--eco-primary)", background: "transparent", border: "none" }}
      >
        <ArrowLeft size={14} /> Back to Tickets
      </button>

      <Card className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>T-{ticket.id}</span>
            <h2 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{ticket.subject}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={TOPIC_VARIANT[ticket.topic] ?? "default"}>{TOPIC_LABELS[ticket.topic] ?? ticket.topic}</Badge>
          <Badge variant={STATUS_VARIANT[ticket.status] ?? "default"}>{ticket.status.replace("_", " ")}</Badge>
          {ticket.roomId && (
            <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>Room #{ticket.roomId}</span>
          )}
          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Created {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center gap-0 mt-1">
          {(["OPEN", "IN_PROGRESS", "CLOSED"] as const).map((s, i, arr) => {
            const order: Record<string, number> = { OPEN: 0, IN_PROGRESS: 1, CLOSED: 2 };
            const isActive = order[s] <= order[ticket.status];
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ background: isActive ? "var(--eco-primary)" : "var(--eco-neutral-200)" }}
                  >
                    {isActive && <CheckCircle2 size={11} style={{ color: "var(--eco-text-on-primary)" }} />}
                  </div>
                  <span className="text-[11px]" style={{ color: isActive ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>
                    {s.replace("_", " ")}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="w-8 h-px mx-1.5" style={{ background: order[s] < order[ticket.status] ? "var(--eco-primary)" : "var(--eco-neutral-200)" }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {isEscalated && (
        <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "var(--eco-danger-100)", border: "1px solid var(--eco-danger-500)" }}>
          <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-danger-500)" }} />
          <div>
            <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Escalated to Dispute Review</div>
            <div className="text-[13px] mt-0.5" style={{ color: "var(--eco-text-secondary)" }}>
              This ticket has been escalated to a dispute review. A senior representative will handle your case.
            </div>
          </div>
        </div>
      )}

      <Card className="flex flex-col flex-1">
        <div className="flex flex-col gap-5 mb-4 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
          {ticket.messages.length === 0 && (
            <div className="text-[13px] text-center py-8" style={{ color: "var(--eco-text-tertiary)" }}>
              No messages yet.
            </div>
          )}
          {ticket.messages.map((m) => {
            const isMine = user?.id != null && m.senderUserId === user.id;
            const isStaff = m.senderRole === "SUPPORT" || m.senderRole === "ADMIN";
            return (
              <div key={m.id} className={`flex flex-col gap-1 ${isMine ? "items-end" : "items-start"}`}>
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  {isStaff ? (
                    <div className="flex items-center gap-1">
                      <Shield size={11} style={{ color: m.senderRole === "ADMIN" ? "var(--eco-negative)" : "var(--eco-primary)" }} />
                      <span style={{ color: m.senderRole === "ADMIN" ? "var(--eco-negative)" : "var(--eco-primary)" }}>
                        {m.senderRole === "ADMIN" ? "Admin" : "Support"}
                      </span>
                    </div>
                  ) : (
                    <span>{isMine ? "You" : "User"}</span>
                  )}
                  <span>·</span>
                  <span>{new Date(m.createdAt).toLocaleString()}</span>
                </div>
                <div
                  className="max-w-sm sm:max-w-md px-4 py-3 rounded-xl text-[14px]"
                  style={{
                    background: isMine
                      ? "var(--eco-brand-50)"
                      : m.senderRole === "ADMIN"
                        ? "var(--eco-danger-100)"
                        : "var(--eco-surface)",
                    color: "var(--eco-text)",
                    borderBottomRightRadius: isMine ? 4 : undefined,
                    borderBottomLeftRadius: !isMine ? 4 : undefined,
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {m.message}
                </div>
              </div>
            );
          })}
        </div>

        {!isClosed ? (
          <div className="flex items-end gap-2 pt-4 border-t" style={{ borderColor: "var(--eco-border)" }}>
            <textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value.slice(0, 5000))}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={5000}
              className="flex-1 px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", minHeight: 40, maxHeight: 120 }}
            />
            <button
              className="cursor-pointer p-2.5 rounded-lg shrink-0 disabled:opacity-40"
              style={{ background: "var(--eco-primary)", border: "none" }}
              onClick={() => void sendMessage()}
              disabled={!newMessage.trim() || sending}
              aria-label="Send message"
            >
              {sending ? <Loader2 size={15} className="animate-spin" style={{ color: "var(--eco-text-on-primary)" }} /> : <Send size={15} style={{ color: "var(--eco-text-on-primary)" }} />}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-4 border-t text-[13px]" style={{ borderColor: "var(--eco-border)", color: "var(--eco-text-tertiary)" }}>
            <CheckCircle2 size={14} />
            This ticket is closed. Create a new ticket if you need further assistance.
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
          <div key={i} className={`flex flex-col gap-1 ${i % 2 === 1 ? "items-end" : "items-start"}`}>
            <Skeleton width={80} height={12} />
            <Skeleton width={240} height={48} rounded={12} />
          </div>
        ))}
      </Card>
    </div>
  );
}

function NoTicketsEmpty({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5" style={{ background: "var(--eco-surface)" }}>
        <MessageSquare size={28} style={{ color: "var(--eco-text-tertiary)" }} />
      </div>
      <div className="text-[18px] mb-2" style={{ color: "var(--eco-text)" }}>No Support Tickets</div>
      <div className="text-[14px] max-w-sm mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        You haven't created any support tickets yet. If you're experiencing an issue with a room, payment, or access, our team is here to help.
      </div>
      <Button variant="primary" onClick={onCreate}>
        <Plus size={15} /> Create Your First Ticket
      </Button>
    </div>
  );
}

export function SupportPage() {
  const { authorizedRequest, isAuthenticated, isReady } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "create" | "detail">("list");
  const [selectedTicket, setSelectedTicket] = useState<number | null>(null);
  const [tickets, setTickets] = useState<SupportTicketResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reloadCounter = useRef(0);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate("/login?redirect=/support");
    }
  }, [isReady, isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    authorizedRequest((token) => getMySupportTicketsRequest(token))
      .then((data) => { if (!cancelled) setTickets(data); })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Unable to load tickets right now.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [authorizedRequest, isAuthenticated, view, reloadCounter.current]);

  const retry = () => {
    reloadCounter.current += 1;
    setError(null);
    setLoading(true);
    authorizedRequest((token) => getMySupportTicketsRequest(token))
      .then((data) => setTickets(data))
      .catch((err) => setError(err instanceof ApiError ? err.message : "Unable to load tickets right now."))
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {view === "list" && (
        <TicketListView
          tickets={tickets}
          loading={loading}
          error={error}
          onSelect={(id) => { setSelectedTicket(id); setView("detail"); }}
          onCreate={() => setView("create")}
          onRetry={retry}
        />
      )}
      {view === "create" && (
        <CreateTicketView
          onBack={() => setView("list")}
          onCreated={(id) => { setSelectedTicket(id); setView("detail"); }}
        />
      )}
      {view === "detail" && selectedTicket != null && (
        <TicketDetailView ticketId={selectedTicket} onBack={() => setView("list")} />
      )}
    </div>
  );
}

export function NewTicketPage() {
  const navigate = useNavigate();
  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <CreateTicketView
        onBack={() => navigate("/support")}
        onCreated={(id) => navigate(`/support?ticket=${id}`)}
      />
    </div>
  );
}
