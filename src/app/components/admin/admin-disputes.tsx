import { useState } from "react";
import { Card, Button, Badge, Modal } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { Scale, FileText, Image, Shield, CheckCircle2, XCircle, Undo2, AlertTriangle, Upload } from "lucide-react";

type Dispute = {
  id: string; ticketId: string; room: string; claimant: string; respondent: string;
  status: "OPEN" | "UNDER_REVIEW" | "RESOLVED"; created: string;
  summary: string; evidence: { name: string; type: "image" | "pdf"; from: string }[];
};

const disputes: Dispute[] = [
  {
    id: "D-104", ticketId: "T-1018", room: "Kcell Group 3", claimant: "Marat S.", respondent: "Unknown (owner)",
    status: "OPEN", created: "2026-03-26",
    summary: "Member claims room was blocked without cause and requests full refund for remaining subscription period.",
    evidence: [
      { name: "payment_receipt.pdf", type: "pdf", from: "Claimant" },
      { name: "room_screenshot.png", type: "image", from: "Claimant" },
    ],
  },
  {
    id: "D-103", ticketId: "T-1015", room: "Beeline Family 4", claimant: "Dana M.", respondent: "Aidar K.",
    status: "UNDER_REVIEW", created: "2026-03-20",
    summary: "Member alleges owner shared incorrect access credentials, rendering the subscription unusable for 7 days.",
    evidence: [
      { name: "chat_log.pdf", type: "pdf", from: "Claimant" },
      { name: "esim_error.png", type: "image", from: "Claimant" },
      { name: "activation_proof.png", type: "image", from: "Respondent" },
    ],
  },
];

type Refund = {
  id: string; disputeId: string | null; user: string; amount: number; room: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED"; created: string;
  intentId: string;
};

const refunds: Refund[] = [
  { id: "RF-201", disputeId: "D-104", user: "Marat S.", amount: 3800, room: "Kcell Group 3", status: "PENDING", created: "2026-03-28", intentId: "ri_3M...xK7d" },
  { id: "RF-200", disputeId: null, user: "Dana M.", amount: 3200, room: "Activ Family 5", status: "PROCESSING", created: "2026-03-28", intentId: "ri_3M...yL8e" },
  { id: "RF-198", disputeId: "D-103", user: "Dana M.", amount: 1167, room: "Beeline Family 4", status: "COMPLETED", created: "2026-03-22", intentId: "ri_3M...zM9f" },
  { id: "RF-195", disputeId: null, user: "Timur B.", amount: 4500, room: "Tele2 Duo", status: "FAILED", created: "2026-03-15", intentId: "ri_3M...aP0g" },
];

const statusVar: Record<string, "warning" | "info" | "success"> = { OPEN: "warning", UNDER_REVIEW: "info", RESOLVED: "success" };
const refStatusVar: Record<string, "warning" | "info" | "success" | "danger"> = { PENDING: "warning", PROCESSING: "info", COMPLETED: "success", FAILED: "danger" };

export function AdminDisputesPage() {
  const [tab, setTab] = useState<"disputes" | "refunds">("disputes");
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [decisionModal, setDecisionModal] = useState(false);
  const [decision, setDecision] = useState("");
  const [decisionType, setDecisionType] = useState<"favor_claimant" | "favor_respondent" | "">("");
  const [refundModal, setRefundModal] = useState<Refund | null>(null);

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Disputes & Refunds</h1>

        {/* Tabs */}
        <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--eco-border)" }}>
          {(["disputes", "refunds"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2.5 text-[14px] cursor-pointer"
              style={{
                color: tab === t ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                borderBottom: tab === t ? "2px solid var(--eco-primary)" : "2px solid transparent",
                marginBottom: -1, background: "transparent", border: "none",
                borderBottomStyle: "solid", borderBottomWidth: 2,
                borderBottomColor: tab === t ? "var(--eco-primary)" : "transparent",
              }}
            >
              {t === "disputes" ? "Disputes" : "Refunds"}
              {t === "disputes" && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>{disputes.filter(d => d.status !== "RESOLVED").length}</span>}
              {t === "refunds" && <span className="ml-1.5 text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--eco-warning-100)", color: "var(--eco-warning-500)" }}>{refunds.filter(r => r.status === "PENDING").length}</span>}
            </button>
          ))}
        </div>

        {tab === "disputes" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 flex flex-col gap-2">
              {disputes.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className="text-left p-4 rounded-xl cursor-pointer"
                  style={{
                    background: selectedDispute?.id === d.id ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${selectedDispute?.id === d.id ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{d.id}</span>
                    <Badge variant={statusVar[d.status]}>{d.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{d.room}</div>
                  <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{d.claimant} vs {d.respondent}</div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-2">
              {!selectedDispute ? (
                <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>Select a dispute</Card>
              ) : (
                <div className="flex flex-col gap-4">
                  <Card className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{selectedDispute.id} — {selectedDispute.room}</div>
                        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>From ticket {selectedDispute.ticketId} · Created {selectedDispute.created}</div>
                      </div>
                      <Badge variant={statusVar[selectedDispute.status]}>{selectedDispute.status.replace("_", " ")}</Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                        <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Claimant</div>
                        <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{selectedDispute.claimant}</div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                        <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Respondent</div>
                        <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{selectedDispute.respondent}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>Summary</div>
                      <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{selectedDispute.summary}</div>
                    </div>
                  </Card>

                  {/* Evidence */}
                  <Card className="flex flex-col gap-3">
                    <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Evidence Attachments</h3>
                    <div className="flex flex-col gap-2">
                      {selectedDispute.evidence.map((e, i) => (
                        <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
                          <div className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                            {e.type === "pdf" ? <FileText size={14} /> : <Image size={14} />}
                            {e.name}
                          </div>
                          <Badge variant="default">{e.from}</Badge>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Decision panel */}
                  {selectedDispute.status !== "RESOLVED" && (
                    <Card className="flex flex-col gap-3">
                      <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Decision Panel</h3>
                      <div className="flex gap-2">
                        <Button variant="primary" size="sm" onClick={() => { setDecisionType("favor_claimant"); setDecisionModal(true); }}>
                          <CheckCircle2 size={13} /> Favor Claimant
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => { setDecisionType("favor_respondent"); setDecisionModal(true); }}>
                          <XCircle size={13} /> Favor Respondent
                        </Button>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "refunds" && (
          <div className="flex flex-col gap-3">
            {/* Header */}
            <div className="grid grid-cols-7 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <div>ID</div><div>User</div><div>Room</div><div>Amount</div><div>Status</div><div>Dispute</div><div>Actions</div>
            </div>
            {refunds.map((r) => (
              <Card key={r.id}>
                <div className="grid grid-cols-7 gap-3 items-center">
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{r.id}</div>
                  <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{r.user}</div>
                  <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{r.room}</div>
                  <div className="text-[14px]" style={{ color: "var(--eco-primary)" }}>₸{r.amount.toLocaleString()}</div>
                  <div><Badge variant={refStatusVar[r.status] as any}>{r.status}</Badge></div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.disputeId || "—"}</div>
                  <div>
                    {r.status === "PENDING" && (
                      <Button variant="primary" size="sm" onClick={() => setRefundModal(r)}>
                        <Undo2 size={12} /> Process
                      </Button>
                    )}
                    {r.status === "FAILED" && (
                      <Button variant="secondary" size="sm" onClick={() => setRefundModal(r)}>Retry</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}

            {/* Idempotency note */}
            <div className="flex items-start gap-2 p-4 rounded-lg mt-2" style={{ background: "var(--eco-surface)" }}>
              <Shield size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <strong>Idempotency:</strong> Each refund is tied to a unique intent ID. Retrying a failed refund reuses the same intent to prevent duplicate processing. All refund actions are audit-logged.
              </div>
            </div>
          </div>
        )}

        {/* Decision modal */}
        <Modal open={decisionModal} onClose={() => { setDecisionModal(false); setDecision(""); setDecisionType(""); }} title="Issue Decision">
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {decisionType === "favor_claimant" ? "Ruling in favor of the claimant. A refund may be initiated." : "Ruling in favor of the respondent. No refund will be issued."}
            </div>
            <textarea rows={3} value={decision} onChange={(e) => setDecision(e.target.value)} placeholder="Decision rationale (mandatory, audit logged)..." className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }} />
            <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}><Shield size={11} /> Decision permanently recorded.</div>
            <Button variant={decisionType === "favor_claimant" ? "primary" : "secondary"} disabled={!decision.trim()} onClick={() => { setDecisionModal(false); setDecision(""); }}>Confirm Decision</Button>
          </div>
        </Modal>

        {/* Refund modal */}
        <Modal open={!!refundModal} onClose={() => setRefundModal(null)} title="Process Refund">
          {refundModal && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3 text-[13px]">
                {[
                  { label: "Refund ID", value: refundModal.id },
                  { label: "Amount", value: `₸${refundModal.amount.toLocaleString()}` },
                  { label: "User", value: refundModal.user },
                  { label: "Intent ID", value: refundModal.intentId },
                ].map((r) => (
                  <div key={r.label}>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.label}</div>
                    <div style={{ color: "var(--eco-text)", fontFamily: r.label === "Intent ID" ? "monospace" : undefined }}>{r.value}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-start gap-2 p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
                <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
                This is a stub. In production, this triggers the payment processor API with the intent ID above.
              </div>
              <Button variant="primary" onClick={() => setRefundModal(null)}>
                <Undo2 size={13} /> Initiate Refund
              </Button>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
