import { useState } from "react";
import { Card, Button, Badge, Modal } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { Shield, Send, Paperclip, ArrowUpRight, CheckCircle2, Clock, AlertTriangle, FileText, Image } from "lucide-react";

type Ticket = {
  id: string; title: string; topic: string; user: string; room: string | null;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED"; created: string; updated: string;
  escalated: boolean;
};

type Msg = { id: string; from: "user" | "support" | "admin"; name: string; text: string; time: string; attachments?: { name: string; type: "image" | "pdf" }[] };

const tickets: Ticket[] = [
  { id: "T-1024", title: "Owner hasn't granted access after 48h", topic: "Access", user: "Aidar K.", room: "Beeline Family 4", status: "OPEN", created: "Apr 1", updated: "2h ago", escalated: false },
  { id: "T-1020", title: "Double charge on March payment", topic: "Payment", user: "Dana M.", room: "Activ Family 5", status: "IN_PROGRESS", created: "Mar 28", updated: "1d ago", escalated: false },
  { id: "T-1018", title: "Refund for blocked room", topic: "Refund", user: "Marat S.", room: "Kcell Group 3", status: "OPEN", created: "Mar 25", updated: "3d ago", escalated: true },
  { id: "T-1012", title: "Plan mismatch with operator catalog", topic: "Wrong plan", user: "Timur B.", room: "Tele2 Duo", status: "CLOSED", created: "Mar 18", updated: "1w ago", escalated: false },
];

const threadData: Record<string, Msg[]> = {
  "T-1024": [
    { id: "1", from: "user", name: "Aidar K.", text: "The room owner hasn't granted me access. SLA expired.", time: "Apr 1, 14:30", attachments: [{ name: "sla_screenshot.png", type: "image" }] },
    { id: "2", from: "support", name: "Support", text: "We've contacted the owner. 24h notice given.", time: "Apr 1, 15:45" },
    { id: "3", from: "user", name: "Aidar K.", text: "Please keep me updated.", time: "Apr 1, 16:00" },
  ],
  "T-1020": [
    { id: "1", from: "user", name: "Dana M.", text: "Charged twice for March. IDs attached.", time: "Mar 28, 09:15", attachments: [{ name: "receipt.pdf", type: "pdf" }] },
    { id: "2", from: "support", name: "Support", text: "Duplicate confirmed. Refund of ₸3,200 initiated.", time: "Mar 28, 11:00" },
  ],
  "T-1018": [
    { id: "1", from: "user", name: "Marat S.", text: "Room blocked without explanation. Need refund.", time: "Mar 25, 16:00" },
    { id: "2", from: "support", name: "Support", text: "Escalating to dispute resolution.", time: "Mar 25, 17:30" },
    { id: "3", from: "admin", name: "Admin", text: "Escalated to dispute review. Senior rep will handle.", time: "Mar 26, 09:00" },
  ],
  "T-1012": [
    { id: "1", from: "user", name: "Timur B.", text: "Listed plan doesn't match Tele2 catalog.", time: "Mar 18, 11:30" },
    { id: "2", from: "support", name: "Support", text: "Verified. Owner notified. Resolved.", time: "Mar 19, 10:00" },
  ],
};

const statusVariant: Record<string, "warning" | "info" | "success"> = { OPEN: "warning", IN_PROGRESS: "info", CLOSED: "success" };

export function AdminTicketsPage() {
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [localMsgs, setLocalMsgs] = useState<Record<string, Msg[]>>({});
  const [escalateModal, setEscalateModal] = useState(false);
  const [escalateReason, setEscalateReason] = useState("");
  const [escalated, setEscalated] = useState<string[]>([]);

  const sendReply = () => {
    if (!reply.trim() || !selected) return;
    const msgs = localMsgs[selected.id] || [];
    setLocalMsgs({ ...localMsgs, [selected.id]: [...msgs, { id: `l-${Date.now()}`, from: "support", name: "Support", text: reply, time: "Just now" }] });
    setReply("");
  };

  const handleEscalate = () => {
    if (!selected || !escalateReason.trim()) return;
    setEscalated([...escalated, selected.id]);
    setEscalateModal(false);
    setEscalateReason("");
  };

  const getMessages = (id: string) => [...(threadData[id] || []), ...(localMsgs[id] || [])];

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Tickets (Support View)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Queue */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {tickets.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t)}
                className="text-left p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  background: selected?.id === t.id ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                  border: `1px solid ${selected?.id === t.id ? "var(--eco-primary)" : "var(--eco-border)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{t.id}</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={statusVariant[t.status]}>{t.status.replace("_", " ")}</Badge>
                    {(t.escalated || escalated.includes(t.id)) && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>Escalated</span>}
                  </div>
                </div>
                <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{t.title}</div>
                <div className="text-[11px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>{t.user} · {t.updated}</div>
              </button>
            ))}
          </div>

          {/* Thread */}
          <div className="lg:col-span-2">
            {!selected ? (
              <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>Select a ticket</Card>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Header */}
                <Card className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>{selected.title}</div>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{selected.id} · {selected.user} · {selected.topic} · {selected.room || "No room"}</div>
                    </div>
                    <Badge variant={statusVariant[selected.status]}>{selected.status.replace("_", " ")}</Badge>
                  </div>
                  {!(selected.escalated || escalated.includes(selected.id)) && selected.status !== "CLOSED" && (
                    <Button variant="destructive" size="sm" className="self-start" onClick={() => setEscalateModal(true)}>
                      <ArrowUpRight size={13} /> Escalate to Dispute
                    </Button>
                  )}
                  {(selected.escalated || escalated.includes(selected.id)) && (
                    <div className="flex items-center gap-2 p-3 rounded-lg text-[13px]" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                      <AlertTriangle size={14} /> Escalated to dispute review
                    </div>
                  )}
                </Card>

                {/* Messages */}
                <Card className="flex flex-col">
                  <div className="flex flex-col gap-4 mb-4" style={{ maxHeight: 400, overflowY: "auto" }}>
                    {getMessages(selected.id).map((m) => (
                      <div key={m.id} className={`flex flex-col gap-1 ${m.from === "user" ? "items-end" : "items-start"}`}>
                        <div className="flex items-center gap-1.5 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                          {m.from === "support" && <><Shield size={10} style={{ color: "var(--eco-primary)" }} /><span style={{ color: "var(--eco-primary)" }}>Support</span></>}
                          {m.from === "admin" && <><Shield size={10} style={{ color: "var(--eco-negative)" }} /><span style={{ color: "var(--eco-negative)" }}>Admin</span></>}
                          {m.from === "user" && <span>{m.name}</span>}
                          · {m.time}
                        </div>
                        <div className="max-w-sm px-3.5 py-2.5 rounded-xl text-[13px]" style={{
                          background: m.from === "user" ? "var(--eco-surface)" : m.from === "admin" ? "var(--eco-danger-100)" : "var(--eco-brand-50)",
                          color: "var(--eco-text)",
                          borderBottomRightRadius: m.from === "user" ? 4 : undefined,
                          borderBottomLeftRadius: m.from !== "user" ? 4 : undefined,
                        }}>{m.text}</div>
                        {m.attachments?.map((a, i) => (
                          <div key={i} className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px]" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text-tertiary)" }}>
                            {a.type === "pdf" ? <FileText size={11} /> : <Image size={11} />} {a.name}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>

                  {selected.status !== "CLOSED" && (
                    <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: "var(--eco-border)" }}>
                      <button className="p-2 rounded-lg cursor-pointer" style={{ background: "var(--eco-surface)", border: "none" }}><Paperclip size={15} style={{ color: "var(--eco-text-tertiary)" }} /></button>
                      <input value={reply} onChange={(e) => setReply(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendReply()} placeholder="Reply as Support..." className="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }} />
                      <button className="p-2 rounded-lg cursor-pointer" style={{ background: "var(--eco-primary)", border: "none" }} onClick={sendReply}><Send size={14} style={{ color: "var(--eco-text-on-primary)" }} /></button>
                    </div>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>

        <Modal open={escalateModal} onClose={() => { setEscalateModal(false); setEscalateReason(""); }} title="Escalate to Dispute">
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>This will create a dispute and notify the user and admin team.</div>
            <textarea rows={3} value={escalateReason} onChange={(e) => setEscalateReason(e.target.value)} placeholder="Escalation reason (audit logged)..." className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }} />
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}><Shield size={11} /> Audit logged.</div>
            <Button variant="destructive" disabled={!escalateReason.trim()} onClick={handleEscalate}>Escalate</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
