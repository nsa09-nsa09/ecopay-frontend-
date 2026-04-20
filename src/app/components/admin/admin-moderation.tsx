import { useState } from "react";
import { Card, Button, Badge, Modal } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { AlertTriangle, Clock, Shield, CheckCircle2, XCircle, HelpCircle, Eye, EyeOff } from "lucide-react";

type QueueItem = {
  id: string; type: "room" | "member"; entity: string; operator: string;
  riskFlags: string[]; riskScore: number; submittedAt: string; details: string;
  identifierMasked: string; identifierFull: string;
};

const queue: QueueItem[] = [
  { id: "MQ-301", type: "room", entity: "Beeline Family 4 (R-2048)", operator: "Beeline", riskFlags: ["New owner", "High price delta"], riskScore: 72, submittedAt: "2026-04-03 09:15", details: "Owner registered 2 days ago. Listed price ₸24,999 is 25% above market average.", identifierMasked: "+7 7** *** ** 45", identifierFull: "+7 (707) 234-56-45" },
  { id: "MQ-300", type: "member", entity: "User Timur B. → Altel Family 6 (R-2046)", operator: "Altel", riskFlags: ["Multiple applications"], riskScore: 58, submittedAt: "2026-04-03 08:30", details: "User applied to 4 rooms in 24h. Possible scouting behavior.", identifierMasked: "+7 7** *** ** 89", identifierFull: "+7 (771) 987-65-89" },
  { id: "MQ-299", type: "room", entity: "Tele2 Duo (R-2044)", operator: "Tele2", riskFlags: ["Plan mismatch"], riskScore: 45, submittedAt: "2026-04-02 22:00", details: "Listed plan doesn't match known Tele2 catalog. Verification required.", identifierMasked: "+7 7** *** ** 12", identifierFull: "+7 (702) 555-12-12" },
];

export function AdminModerationPage() {
  const [actionModal, setActionModal] = useState<{ item: QueueItem; action: "CONFIRM" | "REJECT" | "REQUEST_INFO" } | null>(null);
  const [comment, setComment] = useState("");
  const [processed, setProcessed] = useState<string[]>([]);
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [revealTarget, setRevealTarget] = useState<string | null>(null);

  const handleAction = () => {
    if (!comment.trim() || !actionModal) return;
    setProcessed([...processed, actionModal.item.id]);
    setActionModal(null);
    setComment("");
  };

  const handleReveal = (id: string) => {
    if (revealedId === id) { setRevealedId(null); return; }
    setRevealTarget(id);
  };

  const confirmReveal = () => {
    if (revealTarget && revealReason.trim()) {
      setRevealedId(revealTarget);
      setRevealTarget(null);
      setRevealReason("");
    }
  };

  const activeQueue = queue.filter((q) => !processed.includes(q.id));

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>Moderation Queue</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>{activeQueue.length} items pending review</p>
          </div>
        </div>

        {activeQueue.length === 0 ? (
          <Card className="text-center py-12">
            <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: "var(--eco-positive)" }} />
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Queue is clear</div>
            <div className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>No items pending moderation.</div>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <div className="col-span-1">ID</div>
              <div className="col-span-3">Entity</div>
              <div className="col-span-2">Risk Flags</div>
              <div className="col-span-1">Score</div>
              <div className="col-span-2">Identifier</div>
              <div className="col-span-1">Submitted</div>
              <div className="col-span-2">Actions</div>
            </div>

            {activeQueue.map((item) => (
              <Card key={item.id} className="flex flex-col gap-3">
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{item.id}</div>
                  <div className="col-span-3">
                    <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{item.entity}</div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{item.type === "room" ? "Room verification" : "Member verification"}</div>
                  </div>
                  <div className="col-span-2 flex flex-wrap gap-1">
                    {item.riskFlags.map((f) => (
                      <Badge key={f} variant="warning">{f}</Badge>
                    ))}
                  </div>
                  <div className="col-span-1">
                    <span
                      className="text-[14px]"
                      style={{ color: item.riskScore >= 70 ? "var(--eco-negative)" : item.riskScore >= 50 ? "var(--eco-warning)" : "var(--eco-positive)" }}
                    >
                      {item.riskScore}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                      {revealedId === item.id ? item.identifierFull : item.identifierMasked}
                    </span>
                    <button
                      className="cursor-pointer p-0.5"
                      onClick={() => handleReveal(item.id)}
                      style={{ background: "transparent", border: "none" }}
                    >
                      {revealedId === item.id ? <EyeOff size={12} style={{ color: "var(--eco-text-tertiary)" }} /> : <Eye size={12} style={{ color: "var(--eco-primary)" }} />}
                    </button>
                  </div>
                  <div className="col-span-1 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{item.submittedAt.split(" ")[1]}</div>
                  <div className="col-span-2 flex gap-1.5">
                    <Button variant="primary" size="sm" onClick={() => setActionModal({ item, action: "CONFIRM" })}>
                      <CheckCircle2 size={12} />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setActionModal({ item, action: "REJECT" })}>
                      <XCircle size={12} />
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setActionModal({ item, action: "REQUEST_INFO" })}>
                      <HelpCircle size={12} />
                    </Button>
                  </div>
                </div>
                {/* Expanded details */}
                <div className="text-[12px] px-1" style={{ color: "var(--eco-text-secondary)" }}>
                  {item.details}
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Action modal with mandatory comment */}
        <Modal
          open={!!actionModal}
          onClose={() => { setActionModal(null); setComment(""); }}
          title={actionModal ? `${actionModal.action.replace("_", " ")} — ${actionModal.item.id}` : ""}
        >
          {actionModal && (
            <div className="flex flex-col gap-4">
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {actionModal.action === "CONFIRM" && "Confirm this item passes moderation review."}
                {actionModal.action === "REJECT" && "Reject this item. The entity will be notified."}
                {actionModal.action === "REQUEST_INFO" && "Request additional information from the owner/member."}
              </div>
              <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>
                <div style={{ color: "var(--eco-text-tertiary)" }}>Entity</div>
                <div style={{ color: "var(--eco-text)" }}>{actionModal.item.entity}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>
                  Comment <span style={{ color: "var(--eco-negative)" }}>*</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Mandatory reason for this action (logged for audit)..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                />
              </div>
              <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                <Shield size={11} /> This action will be recorded in admin audit logs.
              </div>
              <Button
                variant={actionModal.action === "REJECT" ? "destructive" : "primary"}
                disabled={!comment.trim()}
                onClick={handleAction}
              >
                {actionModal.action === "CONFIRM" && "Confirm"}
                {actionModal.action === "REJECT" && "Reject"}
                {actionModal.action === "REQUEST_INFO" && "Send Request"}
              </Button>
            </div>
          )}
        </Modal>

        {/* Reveal reason modal */}
        <Modal open={!!revealTarget && revealedId !== revealTarget} onClose={() => setRevealTarget(null)} title="Reveal Identifier">
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              Provide a reason for viewing the full identifier. This is logged for audit compliance.
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>Reason</label>
              <input
                className="px-3 py-2 rounded-lg outline-none text-[13px]"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                placeholder="e.g., Verifying identity for moderation"
                value={revealReason}
                onChange={(e) => setRevealReason(e.target.value)}
              />
            </div>
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={11} /> Reveal action logged: {new Date().toISOString().slice(0, 19)}
            </div>
            <Button variant="primary" disabled={!revealReason.trim()} onClick={confirmReveal}>Reveal</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
