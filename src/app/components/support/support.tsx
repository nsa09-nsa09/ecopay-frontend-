import { useState } from "react";
import { Link, useLocation, useNavigate, type Location } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Select, Badge, EmptyState, Skeleton } from "../ds-primitives";
import {
  ArrowLeft, Send, AlertCircle, CheckCircle2, Shield, Plus,
  Filter, ChevronDown, ChevronUp, AlertTriangle, MessageSquare, Loader2,
} from "lucide-react";
import { supportApi } from "../../../lib/api/support";
import type { SupportTicketResponse } from "../../../lib/api/types";

type ApiStatus = SupportTicketResponse["status"];

const STATUS_BADGE_VARIANT: Record<ApiStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  WAITING_USER: "info",
  ESCALATED: "danger",
  CLOSED: "default",
};

const STATUS_LABEL: Record<ApiStatus, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In Progress",
  WAITING_USER: "Waiting for you",
  ESCALATED: "Escalated",
  CLOSED: "Closed",
};

function ticketTimestamp(t: SupportTicketResponse): string {
  const ts = t.updatedAt || t.createdAt;
  if (!ts) return "";
  return new Date(ts).toLocaleString();
}

// ─── Ticket List ───
function TicketListView({
  onSelect,
  onCreate,
}: {
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | ApiStatus>("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const ticketsQ = useQuery({
    queryKey: ["support", "tickets"],
    queryFn: supportApi.list,
  });

  const filtered = (ticketsQ.data ?? []).filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    return true;
  });

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

      <div className="mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
          style={{ color: "var(--eco-text-secondary)", background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
        >
          <Filter size={14} />
          Filters
          {statusFilter !== "ALL" && (
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--eco-primary)" }} />
          )}
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {showFilters && (
        <Card className="mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Status"
              options={[
                { value: "ALL", label: "All statuses" },
                { value: "OPEN", label: "Open" },
                { value: "PENDING", label: "In Progress" },
                { value: "RESOLVED", label: "Resolved" },
                { value: "CLOSED", label: "Closed" },
              ]}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as "ALL" | ApiStatus)}
            />
            <div className="flex items-end">
              <Button variant="ghost" size="sm" onClick={() => setStatusFilter("ALL")}>
                Clear filters
              </Button>
            </div>
          </div>
        </Card>
      )}

      {ticketsQ.isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="flex flex-col gap-2">
              <Skeleton width="40%" height={14} />
              <Skeleton width="80%" height={14} />
              <Skeleton width={120} height={20} rounded={4} />
            </Card>
          ))}
        </div>
      ) : ticketsQ.isError ? (
        <Card className="text-center py-10 flex flex-col items-center gap-3">
          <AlertCircle size={24} style={{ color: "var(--eco-negative)" }} />
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Couldn't load tickets</div>
          <Button variant="secondary" size="md" onClick={() => ticketsQ.refetch()}>Retry</Button>
        </Card>
      ) : filtered.length === 0 ? (
        (ticketsQ.data?.length ?? 0) === 0 ? (
          <NoTicketsEmpty onCreate={onCreate} />
        ) : (
          <EmptyState
            title="No Tickets Found"
            description="No tickets match your current filters."
          />
        )
      ) : (
        <div className="flex flex-col gap-2">
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <div className="col-span-2">ID</div>
            <div className="col-span-6">Subject</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Updated</div>
          </div>

          {filtered.map((t) => (
            <Card key={t.id} className="cursor-pointer hover:shadow-sm transition-shadow">
              <button
                className="w-full text-left cursor-pointer"
                style={{ background: "transparent", border: "none", padding: 0 }}
                onClick={() => onSelect(t.id)}
              >
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 text-[13px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                    {t.id.slice(0, 8)}
                  </div>
                  <div className="col-span-6 text-[14px]" style={{ color: "var(--eco-text)" }}>{t.subject}</div>
                  <div className="col-span-2">
                    <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                  </div>
                  <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{ticketTimestamp(t)}</div>
                </div>

                <div className="sm:hidden flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{t.id.slice(0, 8)}</span>
                      <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{STATUS_LABEL[t.status]}</Badge>
                    </div>
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{ticketTimestamp(t)}</span>
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t.subject}</div>
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
function CreateTicketView({ onBack, onCreated }: { onBack: () => void; onCreated?: () => void }) {
  const location = useLocation() as Location<{ subject?: string; roomId?: number; roomMemberId?: number } | null>;
  const qc = useQueryClient();

  const [subject, setSubject] = useState(location.state?.subject ?? "");
  const [topic, setTopic] = useState("access");
  const [priority, setPriority] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL");
  const [message, setMessage] = useState("");

  const createMutation = useMutation({
    mutationFn: () => {
      const finalSubject = subject.trim() || `[${topic}] Support request`;
      return supportApi.create({
        subject: finalSubject,
        topic,
        message: message.trim(),
        roomId: location.state?.roomId,
        roomMemberId: location.state?.roomMemberId,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
      if (onCreated) onCreated();
      else onBack();
    },
  });

  if (createMutation.isSuccess) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--eco-success-100)" }}>
          <CheckCircle2 size={24} style={{ color: "var(--eco-positive)" }} />
        </div>
        <div className="text-[18px] mb-2" style={{ color: "var(--eco-text)" }}>Ticket Created</div>
        <div className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
          Your ticket has been submitted. Our team will respond shortly.
        </div>
        <Button variant="secondary" onClick={onBack}>Back to Tickets</Button>
      </div>
    );
  }

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
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Briefly summarize the issue"
            className="px-3 py-2 rounded-lg outline-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
          />
        </div>

        <Select
          label="Topic"
          options={[
            { value: "access", label: "Access not granted" },
            { value: "payment", label: "Payment issue" },
            { value: "wrong_plan", label: "Wrong plan" },
            { value: "refund", label: "Refund request" },
            { value: "abuse", label: "Abuse report" },
            { value: "other", label: "Other" },
          ]}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <Select
          label="Priority"
          options={[
            { value: "LOW", label: "Low" },
            { value: "NORMAL", label: "Normal" },
            { value: "HIGH", label: "High" },
            { value: "URGENT", label: "Urgent" },
          ]}
          value={priority}
          onChange={(e) => setPriority(e.target.value as typeof priority)}
        />

        <div className="flex flex-col gap-1.5">
          <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Message</label>
          <textarea
            rows={5}
            placeholder="Describe your issue in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="px-3 py-2.5 rounded-lg outline-none resize-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", fontSize: 14 }}
          />
        </div>

        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
          <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Please avoid repeated messages — our support team will respond within 24 hours.
          </div>
        </div>

        {createMutation.isError && (
          <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>
            Couldn't create ticket. Please try again.
          </div>
        )}

        <Button
          variant="primary"
          className="w-full"
          loading={createMutation.isPending}
          disabled={!message.trim() || createMutation.isPending}
          onClick={() => createMutation.mutate()}
        >
          Submit Ticket
        </Button>
      </Card>
    </div>
  );
}

// ─── Ticket Detail ───
function TicketDetailView({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const qc = useQueryClient();
  const [newMessage, setNewMessage] = useState("");

  const ticketQ = useQuery({
    queryKey: ["support", "tickets", ticketId],
    queryFn: () => supportApi.get(ticketId),
  });

  const replyMutation = useMutation({
    mutationFn: (message: string) => supportApi.postMessage(ticketId, { message }),
    onSuccess: () => {
      setNewMessage("");
      qc.invalidateQueries({ queryKey: ["support", "tickets", ticketId] });
      qc.invalidateQueries({ queryKey: ["support", "tickets"] });
    },
  });

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    replyMutation.mutate(newMessage.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (ticketQ.isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton width={120} height={14} />
        <Card className="flex flex-col gap-3">
          <Skeleton width="60%" height={20} />
          <Skeleton width={200} height={20} rounded={4} />
        </Card>
        <Card className="flex flex-col gap-4">
          <Skeleton width={240} height={48} rounded={12} />
          <Skeleton width={240} height={48} rounded={12} />
        </Card>
      </div>
    );
  }

  if (ticketQ.isError || !ticketQ.data) {
    return (
      <Card className="flex flex-col items-center gap-3 py-12">
        <AlertCircle size={24} style={{ color: "var(--eco-negative)" }} />
        <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Couldn't load ticket</div>
        <Button variant="secondary" size="md" onClick={onBack}>Back to Tickets</Button>
      </Card>
    );
  }

  const ticket = ticketQ.data;
  const allMessages = ticket.messages ?? [];
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

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
            <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{ticket.id.slice(0, 8)}</span>
            <h2 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{ticket.subject}</h2>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>{STATUS_LABEL[ticket.status]}</Badge>
          {ticket.priority && (
            <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Priority: {ticket.priority}</span>
          )}
          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Created {new Date(ticket.createdAt).toLocaleString()}
          </span>
        </div>
      </Card>

      <Card className="flex flex-col flex-1">
        {allMessages.length === 0 ? (
          <div className="text-center py-10 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            No messages yet.
          </div>
        ) : (
          <div className="flex flex-col gap-5 mb-4 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
            {allMessages.map((m) => {
              const role = (m.senderRole || "").toUpperCase();
              const fromSupport = role === "SUPPORT" || role === "ADMIN";
              return (
                <div key={m.id} className={`flex flex-col gap-1 ${fromSupport ? "items-start" : "items-end"}`}>
                  <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {fromSupport ? (
                      <div className="flex items-center gap-1">
                        <Shield size={11} style={{ color: "var(--eco-primary)" }} />
                        <span style={{ color: "var(--eco-primary)" }}>{m.senderRole || "Support"}</span>
                      </div>
                    ) : (
                      <span>{m.senderRole || "You"}</span>
                    )}
                    <span>·</span>
                    <span>{new Date(m.createdAt).toLocaleString()}</span>
                  </div>
                  <div
                    className="max-w-sm sm:max-w-md px-4 py-3 rounded-xl text-[14px] whitespace-pre-wrap"
                    style={{
                      background: fromSupport ? "var(--eco-surface)" : "var(--eco-brand-50)",
                      color: "var(--eco-text)",
                      borderBottomRightRadius: !fromSupport ? 4 : undefined,
                      borderBottomLeftRadius: fromSupport ? 4 : undefined,
                    }}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!isClosed ? (
          <div className="flex items-end gap-2 pt-4 border-t" style={{ borderColor: "var(--eco-border)" }}>
            <textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={replyMutation.isPending}
              className="flex-1 px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", minHeight: 40, maxHeight: 120 }}
            />
            <button
              className="cursor-pointer p-2.5 rounded-lg shrink-0 disabled:opacity-40"
              style={{ background: "var(--eco-primary)", border: "none" }}
              onClick={sendMessage}
              disabled={!newMessage.trim() || replyMutation.isPending}
            >
              {replyMutation.isPending ? (
                <Loader2 size={15} className="animate-spin" style={{ color: "var(--eco-text-on-primary)" }} />
              ) : (
                <Send size={15} style={{ color: "var(--eco-text-on-primary)" }} />
              )}
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-4 border-t text-[13px]" style={{ borderColor: "var(--eco-border)", color: "var(--eco-text-tertiary)" }}>
            <CheckCircle2 size={14} />
            This ticket is closed. Create a new ticket if you need further assistance.
          </div>
        )}

        {replyMutation.isError && (
          <div className="text-[12px] mt-2" style={{ color: "var(--eco-negative)" }}>
            Couldn't send message. Try again.
          </div>
        )}
      </Card>
    </div>
  );
}

// ─── Empty State ───
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

// ─── Main Support Page ───
export function SupportPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"list" | "detail">("list");
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {view === "list" && (
        <TicketListView
          onSelect={(id) => { setSelectedTicket(id); setView("detail"); }}
          onCreate={() => navigate("/support/new")}
        />
      )}

      {view === "detail" && selectedTicket && (
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
        onCreated={() => navigate("/support")}
      />
    </div>
  );
}

// ─── Banner displayed inline (kept for layout parity if escalated tickets ship later) ───
export function EscalatedBanner() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl mb-4" style={{ background: "var(--eco-danger-100)", border: "1px solid var(--eco-danger-500)" }}>
      <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-danger-500)" }} />
      <div>
        <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Escalated to Dispute Review</div>
        <div className="text-[13px] mt-0.5" style={{ color: "var(--eco-text-secondary)" }}>
          A senior representative will handle your case.
        </div>
      </div>
    </div>
  );
}
