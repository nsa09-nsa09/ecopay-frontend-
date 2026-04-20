import { useState } from "react";
import { Link, useParams } from "react-router";
import { Card, Button, Badge, MemberStatusBadge, RoomStatusBadge, Modal } from "../ds-primitives";
import { ArrowLeft, Eye, EyeOff, Shield, CheckCircle2, Lock, Users, Calendar, Clock, AlertTriangle } from "lucide-react";

const roomsData: Record<string, {
  name: string; operator: string; plan: string; status: string; startDate: string;
  seats: number; filled: number; priceTotal: number; perMember: number;
  accessMethod: string; verificationMode: string;
}> = {
  r3: {
    name: "Beeline Family 4", operator: "Beeline", plan: "Family 4 — ₸19,999/mo", status: "OPEN",
    startDate: "2026-04-15", seats: 4, filled: 3, priceTotal: 19999, perMember: 5000,
    accessMethod: "eSIM activation", verificationMode: "Risk-based (default)",
  },
  r6: {
    name: "Altel Family 6", operator: "Altel", plan: "Family 6 — ₸16,800/mo", status: "IN_VERIFICATION",
    startDate: "2026-04-20", seats: 6, filled: 1, priceTotal: 16800, perMember: 2800,
    accessMethod: "Operator account invite", verificationMode: "Risk-based (default)",
  },
  r7: {
    name: "Activ Duo", operator: "Activ", plan: "Duo Bundle — ₸12,000/mo", status: "ACTIVE",
    startDate: "2026-03-10", seats: 2, filled: 2, priceTotal: 12000, perMember: 6000,
    accessMethod: "Physical SIM card", verificationMode: "Risk-based (default)",
  },
};

type Participant = {
  id: string; name: string; status: string; identifier: string | null;
  fullId: string | null; paymentDone: boolean; appliedAt: string;
  accessGranted: string | null; accessMethodUsed: string | null;
};

const participantsData: Record<string, Participant[]> = {
  r3: [
    { id: "p1", name: "Dana M.", status: "PENDING", identifier: "+7 *** ***-**-45", fullId: "+7 (707) 234-56-45", paymentDone: true, appliedAt: "2026-04-01", accessGranted: null, accessMethodUsed: null },
    { id: "p2", name: "Timur B.", status: "APPLIED", identifier: null, fullId: null, paymentDone: false, appliedAt: "2026-04-02", accessGranted: null, accessMethodUsed: null },
    { id: "p3", name: "Asel N.", status: "ACTIVE", identifier: "+7 *** ***-**-89", fullId: "+7 (771) 987-65-89", paymentDone: true, appliedAt: "2026-03-20", accessGranted: "2026-03-21 10:15", accessMethodUsed: "eSIM activation" },
  ],
  r6: [
    { id: "p4", name: "Marat K.", status: "APPLIED", identifier: null, fullId: null, paymentDone: false, appliedAt: "2026-04-18", accessGranted: null, accessMethodUsed: null },
    { id: "p5", name: "Dinara S.", status: "APPLIED", identifier: null, fullId: null, paymentDone: false, appliedAt: "2026-04-19", accessGranted: null, accessMethodUsed: null },
    { id: "p6", name: "Arman T.", status: "PENDING", identifier: "+7 *** ***-**-12", fullId: "+7 (702) 555-12-12", paymentDone: true, appliedAt: "2026-04-17", accessGranted: null, accessMethodUsed: null },
  ],
  r7: [
    { id: "p7", name: "Kairat R.", status: "ACTIVE", identifier: "+7 *** ***-**-67", fullId: "+7 (777) 111-22-67", paymentDone: true, appliedAt: "2026-03-08", accessGranted: "2026-03-10 14:00", accessMethodUsed: "Physical SIM card" },
  ],
};

export function OwnerDetailPage() {
  const { id } = useParams();
  const [revealed, setRevealed] = useState<string | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [revealTarget, setRevealTarget] = useState<string | null>(null);
  const [grantModal, setGrantModal] = useState<string | null>(null);
  const [grantMethod, setGrantMethod] = useState("esim");
  const [grantChecklist, setGrantChecklist] = useState<Record<string, boolean>>({});
  const [grantedIds, setGrantedIds] = useState<string[]>([]);

  const room = roomsData[id || "r3"] || roomsData.r3;
  const participants = participantsData[id || "r3"] || participantsData.r3;

  const isLocked = new Date(room.startDate) <= new Date();

  const handleReveal = (pId: string) => {
    if (revealed === pId) {
      setRevealed(null);
      setRevealTarget(null);
      return;
    }
    setRevealTarget(pId);
  };

  const confirmReveal = () => {
    if (revealTarget && revealReason.trim()) {
      setRevealed(revealTarget);
      setRevealTarget(null);
      setRevealReason("");
    }
  };

  const handleGrant = (pId: string) => {
    setGrantedIds([...grantedIds, pId]);
    setGrantModal(null);
    setGrantChecklist({});
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>{room.name}</h1>
          <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            {room.operator} · Owner view
          </div>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: participants */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Participants List */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Participants</h3>
              <Badge variant="info">{participants.length} / {room.seats} members</Badge>
            </div>

            <div className="flex flex-col gap-3">
              {participants.map((p) => {
                const isGranted = grantedIds.includes(p.id) || p.status === "ACTIVE";
                return (
                  <div key={p.id} className="p-4 rounded-lg flex flex-col gap-3" style={{ background: "var(--eco-surface)" }}>
                    {/* Row 1: name + status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
                          {p.name.charAt(0)}
                        </div>
                        <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{p.name}</span>
                        <MemberStatusBadge status={isGranted && p.status !== "ACTIVE" ? "ACTIVE" : p.status} />
                      </div>
                      <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Applied {p.appliedAt}</span>
                    </div>

                    {/* Row 2: Identifier */}
                    {p.paymentDone ? (
                      <div className="flex items-center gap-2 text-[13px]">
                        <Shield size={13} style={{ color: "var(--eco-primary)" }} />
                        <span style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                          ID: {revealed === p.id ? p.fullId : p.identifier}
                        </span>
                        <button
                          className="cursor-pointer p-1 rounded hover:bg-black/5"
                          onClick={() => handleReveal(p.id)}
                          title="View full identifier"
                        >
                          {revealed === p.id ? (
                            <EyeOff size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                          ) : (
                            <Eye size={14} style={{ color: "var(--eco-primary)" }} />
                          )}
                        </button>
                        {revealed !== p.id && (
                          <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Reason required</span>
                        )}
                      </div>
                    ) : (
                      <div className="text-[13px] flex items-center gap-1.5" style={{ color: "var(--eco-text-tertiary)" }}>
                        <Shield size={13} /> Hidden until payment success
                      </div>
                    )}

                    {/* Row 3: Payment state */}
                    <div className="text-[12px]" style={{ color: p.paymentDone ? "var(--eco-positive)" : "var(--eco-text-tertiary)" }}>
                      {p.paymentDone ? "Payment confirmed" : "Awaiting payment"}
                    </div>

                    {/* Row 4: Actions */}
                    {p.status === "PENDING" && p.paymentDone && !isGranted && (
                      <div className="flex items-center gap-2 pt-1">
                        <Button variant="primary" size="sm" onClick={() => setGrantModal(p.id)}>
                          Mark Access Granted
                        </Button>
                      </div>
                    )}

                    {/* Access granted info */}
                    {(isGranted || p.accessGranted) && (
                      <div className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--eco-positive)" }}>
                        <CheckCircle2 size={13} />
                        Access granted {p.accessGranted || "just now"} via {p.accessMethodUsed || room.accessMethod}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Sidebar: Room rules summary */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock size={15} style={{ color: isLocked ? "var(--eco-warning)" : "var(--eco-text-tertiary)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Room Rules</h3>
            </div>
            {isLocked && (
              <div className="p-3 rounded-lg text-[12px] flex items-start gap-2" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
                <Lock size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
                Fields locked since start_date ({room.startDate}) has passed.
              </div>
            )}
            {[
              { label: "Operator", value: room.operator },
              { label: "Plan", value: room.plan },
              { label: "Seats", value: `${room.seats}` },
              { label: "Price / member", value: `₸${room.perMember.toLocaleString()}/mo` },
              { label: "Start date", value: room.startDate },
              { label: "Access method", value: room.accessMethod },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Verification</h3>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px]"
              style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)", border: "1px solid var(--eco-border)" }}
            >
              <Shield size={13} />
              {room.verificationMode}
            </div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              Verification mode is determined automatically based on room risk score and cannot be changed.
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Filled", value: `${room.filled}/${room.seats}`, icon: Users },
                { label: "Start", value: room.startDate, icon: Calendar },
                { label: "Revenue", value: `₸${(room.perMember * room.filled).toLocaleString()}`, icon: CheckCircle2 },
                { label: "Pending", value: `${participants.filter((p) => p.status === "PENDING").length}`, icon: Clock },
              ].map((s) => (
                <div key={s.label} className="flex flex-col gap-1">
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{s.value}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Reveal reason modal */}
      <Modal open={!!revealTarget && revealed !== revealTarget} onClose={() => setRevealTarget(null)} title="View Full Identifier">
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Please provide a reason for viewing the full telecom identifier. This action is logged for security.
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>Reason</label>
            <input
              className="px-3 py-2 rounded-lg outline-none text-[14px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              placeholder="e.g., Activating eSIM for member"
              value={revealReason}
              onChange={(e) => setRevealReason(e.target.value)}
            />
          </div>
          <Button variant="primary" disabled={!revealReason.trim()} onClick={confirmReveal}>
            Reveal Identifier
          </Button>
        </div>
      </Modal>

      {/* Grant access modal */}
      <Modal open={!!grantModal} onClose={() => { setGrantModal(null); setGrantChecklist({}); }} title="Grant Access">
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Confirm that you have provided access to this member. Complete the checklist below.
          </div>

          <div className="flex flex-col gap-2">
            {[
              { key: "method", label: `Access provided via ${room.accessMethod}` },
              { key: "activated", label: "Member's line/account has been activated" },
              { key: "confirmed", label: "I confirm this action and understand it is logged" },
            ].map((item) => (
              <label key={item.key} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={!!grantChecklist[item.key]}
                  onChange={(e) => setGrantChecklist({ ...grantChecklist, [item.key]: e.target.checked })}
                />
                <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{item.label}</span>
              </label>
            ))}
          </div>

          <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            Timestamp: {new Date().toISOString().replace("T", " ").slice(0, 19)}
          </div>

          <Button
            variant="primary"
            disabled={!grantChecklist.method || !grantChecklist.activated || !grantChecklist.confirmed}
            onClick={() => grantModal && handleGrant(grantModal)}
          >
            Confirm Access Granted
          </Button>
        </div>
      </Modal>
    </div>
  );
}
