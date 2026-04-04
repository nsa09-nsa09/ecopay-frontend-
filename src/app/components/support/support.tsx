import { useState, useRef } from "react";
import { Link } from "react-router";
import { Card, Button, Input, Select, Badge, Tabs, EmptyState, Skeleton, SkeletonCard } from "../ds-primitives";
import {
  ArrowLeft, Upload, Send, Paperclip, AlertCircle, Clock, CheckCircle2,
  Shield, Plus, Filter, ChevronDown, ChevronUp, Image, FileText,
  AlertTriangle, X, Loader2, MessageSquare, LifeBuoy
} from "lucide-react";

// ─── Types ───
type TicketStatus = "OPEN" | "IN_PROGRESS" | "CLOSED";
type TopicKey = "access" | "payment" | "wrong_plan" | "refund" | "abuse" | "other";

const TOPIC_LABELS: Record<TopicKey, string> = {
  access: "Access not granted",
  payment: "Payment issue",
  wrong_plan: "Wrong plan",
  refund: "Refund request",
  abuse: "Abuse report",
  other: "Other",
};

const TOPIC_BADGE_VARIANT: Record<TopicKey, "default" | "success" | "warning" | "danger" | "info"> = {
  access: "warning",
  payment: "danger",
  wrong_plan: "info",
  refund: "warning",
  abuse: "danger",
  other: "default",
};

const STATUS_BADGE_VARIANT: Record<TicketStatus, "default" | "success" | "warning" | "danger" | "info"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  CLOSED: "success",
};

// ─── Mock Data ───
type Ticket = {
  id: string;
  topic: TopicKey;
  title: string;
  room: string | null;
  status: TicketStatus;
  updated: string;
  createdAt: string;
  escalated?: boolean;
};

const mockTickets: Ticket[] = [
  { id: "T-1024", topic: "access", title: "Owner hasn't granted access after 48h", room: "Beeline Family 4", status: "OPEN", updated: "2h ago", createdAt: "2026-04-01 14:30" },
  { id: "T-1020", topic: "payment", title: "Double charge on March payment", room: "Activ Family 5", status: "IN_PROGRESS", updated: "1d ago", createdAt: "2026-03-28 09:15" },
  { id: "T-1018", topic: "refund", title: "Refund for blocked room", room: "Kcell Group 3", status: "OPEN", updated: "3d ago", createdAt: "2026-03-25 16:00", escalated: true },
  { id: "T-1012", topic: "wrong_plan", title: "Listed plan doesn't match actual operator plan", room: "Tele2 Duo", status: "CLOSED", updated: "1w ago", createdAt: "2026-03-18 11:30" },
  { id: "T-1005", topic: "abuse", title: "Suspicious room owner activity", room: null, status: "CLOSED", updated: "2w ago", createdAt: "2026-03-10 08:45" },
];

type Message = {
  id: string;
  from: "user" | "support" | "admin";
  name: string;
  text: string;
  time: string;
  attachments?: { name: string; type: "image" | "pdf"; url?: string }[];
};

const mockMessages: Record<string, { messages: Message[]; escalated: boolean }> = {
  "T-1024": {
    escalated: false,
    messages: [
      { id: "m1", from: "user", name: "You", text: "The room owner hasn't granted me access. It's been over 48 hours and the SLA has expired.", time: "Apr 1, 14:30", attachments: [{ name: "sla_screenshot.png", type: "image" }] },
      { id: "m2", from: "support", name: "Support", text: "Thank you for reporting this. We've contacted the room owner and given them a 24-hour notice. If no response, we'll process a full refund.", time: "Apr 1, 15:45" },
      { id: "m3", from: "user", name: "You", text: "Thank you. Please keep me updated on the status.", time: "Apr 1, 16:00" },
      { id: "m4", from: "support", name: "Support", text: "Update: The owner has been notified again. We're monitoring the situation. You'll receive an automatic notification when access is granted or a refund is initiated.", time: "Apr 2, 10:30" },
    ],
  },
  "T-1020": {
    escalated: false,
    messages: [
      { id: "m1", from: "user", name: "You", text: "I was charged twice for my March payment in the Activ Family 5 room. Transaction IDs attached.", time: "Mar 28, 09:15", attachments: [{ name: "receipt_march.pdf", type: "pdf" }, { name: "bank_statement.png", type: "image" }] },
      { id: "m2", from: "support", name: "Support", text: "We can see the duplicate transaction. A refund for ₸3,200 has been initiated and should appear within 3-5 business days.", time: "Mar 28, 11:00" },
    ],
  },
  "T-1018": {
    escalated: true,
    messages: [
      { id: "m1", from: "user", name: "You", text: "My room was blocked without explanation. I need a refund for the remaining period.", time: "Mar 25, 16:00" },
      { id: "m2", from: "support", name: "Support", text: "The room was blocked following a compliance review. We're escalating this to our dispute resolution team.", time: "Mar 25, 17:30" },
      { id: "m3", from: "admin", name: "Admin", text: "This ticket has been escalated to dispute review. A senior representative will handle your case within 48 hours. Refund eligibility will be determined during the review.", time: "Mar 26, 09:00" },
    ],
  },
  "T-1012": {
    escalated: false,
    messages: [
      { id: "m1", from: "user", name: "You", text: "The plan listed as 'Tele2 Duo' doesn't match the actual operator plan. The price and features are different.", time: "Mar 18, 11:30" },
      { id: "m2", from: "support", name: "Support", text: "Thank you for flagging this. We've verified the discrepancy and the room owner has been notified to update the listing. Your membership has been adjusted.", time: "Mar 18, 14:00" },
      { id: "m3", from: "support", name: "Support", text: "This ticket is now resolved. The room listing has been corrected. Please reopen if you notice any further issues.", time: "Mar 19, 10:00" },
    ],
  },
  "T-1005": {
    escalated: false,
    messages: [
      { id: "m1", from: "user", name: "You", text: "I believe the owner of a room I saw is creating fake listings to collect payments.", time: "Mar 10, 08:45" },
      { id: "m2", from: "admin", name: "Admin", text: "Thank you for the report. Our trust & safety team has investigated and taken action. The account has been flagged.", time: "Mar 11, 14:00" },
    ],
  },
};

// ─── Ticket List with Filters ───
function TicketListView({ onSelect, onCreate }: { onSelect: (id: string) => void; onCreate: () => void }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [topicFilter, setTopicFilter] = useState("ALL");
  const [showFilters, setShowFilters] = useState(false);

  const filtered = mockTickets.filter((t) => {
    if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
    if (topicFilter !== "ALL" && t.topic !== topicFilter) return false;
    return true;
  });

  return (
    <>
      {/* Header */}
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

      {/* Filter toggle */}
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
              options={[
                { value: "ALL", label: "All topics" },
                { value: "access", label: "Access not granted" },
                { value: "payment", label: "Payment issue" },
                { value: "wrong_plan", label: "Wrong plan" },
                { value: "refund", label: "Refund request" },
                { value: "abuse", label: "Abuse report" },
                { value: "other", label: "Other" },
              ]}
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

      {/* Ticket list */}
      {filtered.length === 0 ? (
        <EmptyState title="No Tickets Found" description="No tickets match your current filters. Adjust filters or create a new ticket." />
      ) : (
        <div className="flex flex-col gap-2">
          {/* Desktop header */}
          <div className="hidden sm:grid sm:grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <div className="col-span-1">ID</div>
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Topic</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Room</div>
            <div className="col-span-1">Updated</div>
          </div>

          {filtered.map((t) => (
            <Card
              key={t.id}
              className="cursor-pointer hover:shadow-sm transition-shadow"
            >
              <button
                className="w-full text-left cursor-pointer"
                style={{ background: "transparent", border: "none", padding: 0 }}
                onClick={() => onSelect(t.id)}
              >
                {/* Desktop row */}
                <div className="hidden sm:grid sm:grid-cols-12 gap-3 items-center">
                  <div className="col-span-1 text-[13px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{t.id}</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t.title}</span>
                    {t.escalated && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                        Escalated
                      </span>
                    )}
                  </div>
                  <div className="col-span-2">
                    <Badge variant={TOPIC_BADGE_VARIANT[t.topic]}>{TOPIC_LABELS[t.topic]}</Badge>
                  </div>
                  <div className="col-span-2">
                    <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="col-span-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {t.room || "—"}
                  </div>
                  <div className="col-span-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t.updated}</div>
                </div>

                {/* Mobile card */}
                <div className="sm:hidden flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{t.id}</span>
                      <Badge variant={STATUS_BADGE_VARIANT[t.status]}>{t.status.replace("_", " ")}</Badge>
                      {t.escalated && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                          Escalated
                        </span>
                      )}
                    </div>
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t.updated}</span>
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t.title}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={TOPIC_BADGE_VARIANT[t.topic]}>{TOPIC_LABELS[t.topic]}</Badge>
                    {t.room && <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t.room}</span>}
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
function CreateTicketView({ onBack }: { onBack: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [topic, setTopic] = useState("access");
  const [room, setRoom] = useState("");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 3 - files.length);
      setFiles([...files, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: "var(--eco-success-100)" }}>
          <CheckCircle2 size={24} style={{ color: "var(--eco-positive)" }} />
        </div>
        <div className="text-[18px] mb-2" style={{ color: "var(--eco-text)" }}>Ticket Created</div>
        <div className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
          Ticket #T-1025 has been submitted. Our team will respond within 24 hours.
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
        {/* Topic */}
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

        {/* Related room */}
        <Select
          label="Related Room (optional)"
          options={[
            { value: "", label: "Select a room..." },
            { value: "r1", label: "Beeline Family 4" },
            { value: "r2", label: "Activ Family 5" },
            { value: "r3", label: "Kcell Group 3" },
            { value: "r4", label: "Tele2 Duo" },
          ]}
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        {/* Message */}
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

        {/* Attachments */}
        <div className="flex flex-col gap-2">
          <label style={{ color: "var(--eco-text)", fontSize: 14 }}>Attachments (optional)</label>
          <div
            className="rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors hover:border-[var(--eco-primary)]"
            style={{ borderColor: "var(--eco-border)" }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={24} className="mx-auto mb-2" style={{ color: "var(--eco-text-tertiary)" }} />
            <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
              Click to upload or drag files here
            </div>
            <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
              PNG, JPG, or PDF · Max 5 MB per file · Up to 3 files
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              multiple
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={handleFileChange}
            />
          </div>

          {/* Uploaded files */}
          {files.length > 0 && (
            <div className="flex flex-col gap-1.5 mt-1">
              {files.map((f, i) => (
                <div
                  key={`file-${i}-${f.name}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {f.type.includes("pdf") ? (
                      <FileText size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                    ) : (
                      <Image size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                    )}
                    <span className="text-[13px] truncate" style={{ color: "var(--eco-text-secondary)" }}>{f.name}</span>
                    <span className="text-[11px] shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>
                      {(f.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button className="cursor-pointer p-0.5 shrink-0" onClick={() => removeFile(i)} style={{ background: "transparent", border: "none" }}>
                    <X size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anti-flood notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
          <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
          <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Please avoid repeated messages — our support team will respond within 24 hours. Max 5 tickets per 24-hour period.
          </div>
        </div>

        {/* Submit */}
        <Button
          variant="primary"
          className="w-full"
          disabled={!message.trim()}
          onClick={() => setSubmitted(true)}
        >
          Submit Ticket
        </Button>
      </Card>
    </div>
  );
}

// ─── Ticket Detail "Chat" Thread ───
function TicketDetailView({ ticketId, onBack }: { ticketId: string; onBack: () => void }) {
  const [newMessage, setNewMessage] = useState("");
  const [localMessages, setLocalMessages] = useState<Message[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ticket = mockTickets.find((t) => t.id === ticketId)!;
  const threadData = mockMessages[ticketId];
  const allMessages = [...(threadData?.messages || []), ...localMessages];
  const isEscalated = threadData?.escalated || false;
  const isClosed = ticket.status === "CLOSED";

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    setLocalMessages([
      ...localMessages,
      {
        id: `local-${Date.now()}`,
        from: "user",
        name: "You",
        text: newMessage,
        time: "Just now",
      },
    ]);
    setNewMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col" style={{ minHeight: "calc(100vh - 200px)" }}>
      {/* Back */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1 text-[13px] cursor-pointer self-start mb-4"
        style={{ color: "var(--eco-primary)", background: "transparent", border: "none" }}
      >
        <ArrowLeft size={14} /> Back to Tickets
      </button>

      {/* Ticket header card */}
      <Card className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{ticket.id}</span>
            <h2 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{ticket.title}</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* Online indicator */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ background: "var(--eco-positive)" }} />
              <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Support online</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Badge variant={TOPIC_BADGE_VARIANT[ticket.topic]}>{TOPIC_LABELS[ticket.topic]}</Badge>
          <Badge variant={STATUS_BADGE_VARIANT[ticket.status]}>{ticket.status.replace("_", " ")}</Badge>
          {ticket.room && (
            <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              Room: {ticket.room}
            </span>
          )}
          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Created {ticket.createdAt}
          </span>
        </div>

        {/* Status bar (read-only) */}
        <div className="flex items-center gap-0 mt-1">
          {(["OPEN", "IN_PROGRESS", "CLOSED"] as TicketStatus[]).map((s, i) => {
            const statusOrder: Record<TicketStatus, number> = { OPEN: 0, IN_PROGRESS: 1, CLOSED: 2 };
            const currentOrder = statusOrder[ticket.status];
            const thisOrder = statusOrder[s];
            const isActive = thisOrder <= currentOrder;
            return (
              <div key={s} className="flex items-center">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: isActive ? "var(--eco-primary)" : "var(--eco-neutral-200)",
                    }}
                  >
                    {isActive && <CheckCircle2 size={11} style={{ color: "var(--eco-text-on-primary)" }} />}
                  </div>
                  <span className="text-[11px]" style={{ color: isActive ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>
                    {s.replace("_", " ")}
                  </span>
                </div>
                {i < 2 && (
                  <div className="w-8 h-px mx-1.5" style={{ background: thisOrder < currentOrder ? "var(--eco-primary)" : "var(--eco-neutral-200)" }} />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Escalation banner */}
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

      {/* Message thread */}
      <Card className="flex flex-col flex-1">
        <div className="flex flex-col gap-5 mb-4 flex-1 overflow-y-auto" style={{ maxHeight: 480 }}>
          {allMessages.map((m) => (
            <div key={m.id} className={`flex flex-col gap-1 ${m.from === "user" ? "items-end" : "items-start"}`}>
              {/* Sender label */}
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                {m.from === "support" && (
                  <div className="flex items-center gap-1">
                    <Shield size={11} style={{ color: "var(--eco-primary)" }} />
                    <span style={{ color: "var(--eco-primary)" }}>Support</span>
                  </div>
                )}
                {m.from === "admin" && (
                  <div className="flex items-center gap-1">
                    <Shield size={11} style={{ color: "var(--eco-negative)" }} />
                    <span style={{ color: "var(--eco-negative)" }}>Admin</span>
                  </div>
                )}
                {m.from === "user" && <span>You</span>}
                <span>·</span>
                <span>{m.time}</span>
              </div>

              {/* Bubble */}
              <div
                className="max-w-sm sm:max-w-md px-4 py-3 rounded-xl text-[14px]"
                style={{
                  background:
                    m.from === "user"
                      ? "var(--eco-brand-50)"
                      : m.from === "admin"
                        ? "var(--eco-danger-100)"
                        : "var(--eco-surface)",
                  color: "var(--eco-text)",
                  borderBottomRightRadius: m.from === "user" ? 4 : undefined,
                  borderBottomLeftRadius: m.from !== "user" ? 4 : undefined,
                }}
              >
                {m.text}
              </div>

              {/* Attachments */}
              {m.attachments && m.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {m.attachments.map((a, ai) => (
                    <div
                      key={`att-${m.id}-${ai}`}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] cursor-pointer"
                      style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text-secondary)" }}
                    >
                      {a.type === "pdf" ? <FileText size={13} /> : <Image size={13} />}
                      {a.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Reply box */}
        {!isClosed ? (
          <div className="flex items-end gap-2 pt-4 border-t" style={{ borderColor: "var(--eco-border)" }}>
            <button
              className="cursor-pointer p-2 rounded-lg shrink-0"
              style={{ background: "var(--eco-surface)", border: "none" }}
              onClick={() => fileInputRef.current?.click()}
              title="Add attachment"
            >
              <Paperclip size={16} style={{ color: "var(--eco-text-tertiary)" }} />
            </button>
            <input ref={fileInputRef} type="file" className="hidden" accept=".png,.jpg,.jpeg,.pdf" />
            <textarea
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className="flex-1 px-3 py-2.5 rounded-lg text-[14px] outline-none resize-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", minHeight: 40, maxHeight: 120 }}
            />
            <button
              className="cursor-pointer p-2.5 rounded-lg shrink-0 disabled:opacity-40"
              style={{ background: "var(--eco-primary)", border: "none" }}
              onClick={sendMessage}
              disabled={!newMessage.trim()}
            >
              <Send size={15} style={{ color: "var(--eco-text-on-primary)" }} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 pt-4 border-t text-[13px]" style={{ borderColor: "var(--eco-border)", color: "var(--eco-text-tertiary)" }}>
            <CheckCircle2 size={14} />
            This ticket is closed. Create a new ticket if you need further assistance.
          </div>
        )}
      </Card>

      {/* Mobile sticky reply bar */}
      {!isClosed && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-3 border-t flex items-center gap-2" style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}>
          <button
            className="cursor-pointer p-2 rounded-lg shrink-0"
            style={{ background: "var(--eco-surface)", border: "none" }}
          >
            <Paperclip size={16} style={{ color: "var(--eco-text-tertiary)" }} />
          </button>
          <input
            placeholder="Message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1 px-3 py-2 rounded-lg text-[14px] outline-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
          <button
            className="cursor-pointer p-2.5 rounded-lg shrink-0"
            style={{ background: "var(--eco-primary)", border: "none" }}
            onClick={sendMessage}
          >
            <Send size={14} style={{ color: "var(--eco-text-on-primary)" }} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Loading Skeletons ───
function TicketListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-4">
        <Skeleton width="40%" height={28} />
        <Skeleton width={120} height={36} rounded={8} />
      </div>
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
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Skeleton width={60} height={14} />
          <Skeleton width="60%" height={20} />
        </div>
        <div className="flex gap-2">
          <Skeleton width={100} height={20} rounded={4} />
          <Skeleton width={80} height={20} rounded={4} />
        </div>
      </Card>
      <Card className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex flex-col gap-1 ${i % 2 === 1 ? "items-end" : "items-start"}`}>
            <Skeleton width={80} height={12} />
            <Skeleton width={240} height={48} rounded={12} />
          </div>
        ))}
        <div className="border-t pt-3" style={{ borderColor: "var(--eco-border)" }}>
          <Skeleton width="100%" height={40} rounded={8} />
        </div>
      </Card>
    </div>
  );
}

// ─── Empty States ───
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
  const [view, setView] = useState<"list" | "create" | "detail" | "skeleton-list" | "skeleton-detail" | "empty">("list");
  const [selectedTicket, setSelectedTicket] = useState("T-1024");

  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      {view === "list" && (
        <TicketListView
          onSelect={(id) => { setSelectedTicket(id); setView("detail"); }}
          onCreate={() => setView("create")}
        />
      )}

      {view === "create" && (
        <CreateTicketView onBack={() => setView("list")} />
      )}

      {view === "detail" && (
        <TicketDetailView ticketId={selectedTicket} onBack={() => setView("list")} />
      )}

      {view === "skeleton-list" && <TicketListSkeleton />}
      {view === "skeleton-detail" && <TicketDetailSkeleton />}
      {view === "empty" && <NoTicketsEmpty onCreate={() => setView("create")} />}

      {/* Dev: view switcher for demo */}
      {view === "list" && (
        <div className="mt-12 pt-6 border-t" style={{ borderColor: "var(--eco-border)" }}>
          <div className="text-[12px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>Demo: Preview states</div>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Loading (list)", value: "skeleton-list" as const },
              { label: "Loading (detail)", value: "skeleton-detail" as const },
              { label: "Empty state", value: "empty" as const },
            ].map((s) => (
              <button
                key={s.value}
                onClick={() => setView(s.value)}
                className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text-secondary)" }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Route-specific new ticket view ───
export function NewTicketPage() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-8">
      <CreateTicketView onBack={() => window.history.back()} />
    </div>
  );
}
