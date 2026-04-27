import { useState } from "react";
import { Card, Button, Badge, Modal, RoomStatusBadge } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { ShieldX, ShieldCheck, Eye, EyeOff, Shield, Clock, CheckCircle2, AlertTriangle, Users, Calendar, Lock } from "lucide-react";

type RoomEvent = { time: string; action: string; actor: string };

type AdminRoom = {
  id: string; name: string; operator: string; status: string; owner: string;
  ownerMasked: string; ownerFull: string; seats: number; filled: number;
  startDate: string; priceTotal: number; riskScore: number;
  events: RoomEvent[];
};

const rooms: AdminRoom[] = [
  {
    id: "R-2048", name: "Beeline Family 4", operator: "Beeline", status: "OPEN", owner: "Aidar K.",
    ownerMasked: "+7 7** *** ** 45", ownerFull: "+7 (707) 234-56-45",
    seats: 4, filled: 3, startDate: "2026-04-15", priceTotal: 19999, riskScore: 72,
    events: [
      { time: "2026-04-03 09:15", action: "Flagged for moderation — risk score 72", actor: "System" },
      { time: "2026-04-02 18:00", action: "Member Dana M. applied", actor: "System" },
      { time: "2026-04-01 10:00", action: "Room created", actor: "Aidar K." },
    ],
  },
  {
    id: "R-2045", name: "Kcell Group 3", operator: "Kcell", status: "BLOCKED", owner: "Unknown",
    ownerMasked: "+7 7** *** ** 67", ownerFull: "+7 (777) 111-22-67",
    seats: 3, filled: 2, startDate: "2026-02-01", priceTotal: 11400, riskScore: 91,
    events: [
      { time: "2026-04-01 14:00", action: "Room BLOCKED — compliance review", actor: "admin@ecopay.kz" },
      { time: "2026-03-28 09:00", action: "Dispute D-103 created by member", actor: "System" },
      { time: "2026-02-01 08:00", action: "Room activated", actor: "System" },
      { time: "2026-01-30 12:00", action: "Room created", actor: "Unknown" },
    ],
  },
  {
    id: "R-2040", name: "Activ Family 5", operator: "Activ", status: "ACTIVE", owner: "Marat S.",
    ownerMasked: "+7 7** *** ** 89", ownerFull: "+7 (771) 987-65-89",
    seats: 5, filled: 5, startDate: "2026-03-01", priceTotal: 16000, riskScore: 12,
    events: [
      { time: "2026-03-01 08:00", action: "Room activated — all seats filled", actor: "System" },
      { time: "2026-02-28 10:00", action: "Room created", actor: "Marat S." },
    ],
  },
];

export function AdminRoomsPage() {
  const [selected, setSelected] = useState<AdminRoom | null>(null);
  const [blockModal, setBlockModal] = useState<{ room: AdminRoom; action: "BLOCK" | "UNBLOCK" } | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [revealedOwner, setRevealedOwner] = useState<string | null>(null);
  const [revealTarget, setRevealTarget] = useState<string | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [localStatuses, setLocalStatuses] = useState<Record<string, string>>({});

  const handleBlock = () => {
    if (!blockModal || !blockReason.trim()) return;
    setLocalStatuses({ ...localStatuses, [blockModal.room.id]: blockModal.action === "BLOCK" ? "BLOCKED" : "ACTIVE" });
    setBlockModal(null);
    setBlockReason("");
  };

  const handleRevealOwner = (id: string) => {
    if (revealedOwner === id) { setRevealedOwner(null); return; }
    setRevealTarget(id);
  };

  const confirmReveal = () => {
    if (revealTarget && revealReason.trim()) {
      setRevealedOwner(revealTarget);
      setRevealTarget(null);
      setRevealReason("");
    }
  };

  const getStatus = (r: AdminRoom) => localStatuses[r.id] || r.status;

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Rooms</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Room list */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {rooms.map((r) => {
              const status = getStatus(r);
              const active = selected?.id === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="text-left p-4 rounded-xl transition-all cursor-pointer"
                  style={{
                    background: active ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{r.id}</span>
                    <RoomStatusBadge status={status} />
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{r.name}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{r.operator} · {r.filled}/{r.seats} seats</div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {!selected ? (
              <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>
                Select a room to view details
              </Card>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Header */}
                <Card className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{selected.name}</div>
                      <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{selected.id} · {selected.operator}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <RoomStatusBadge status={getStatus(selected)} />
                      <span className="text-[13px] px-2 py-0.5 rounded" style={{
                        background: selected.riskScore >= 70 ? "var(--eco-danger-100)" : selected.riskScore >= 40 ? "var(--eco-warning-100)" : "var(--eco-success-100)",
                        color: selected.riskScore >= 70 ? "var(--eco-danger-500)" : selected.riskScore >= 40 ? "var(--eco-warning-500)" : "var(--eco-success-500)",
                      }}>
                        Risk: {selected.riskScore}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 text-[13px]">
                    {[
                      { label: "Seats", value: `${selected.filled}/${selected.seats}` },
                      { label: "Start", value: selected.startDate },
                      { label: "Total Price", value: `₸${selected.priceTotal.toLocaleString()}` },
                      { label: "Owner", value: selected.owner },
                    ].map((s) => (
                      <div key={s.label}>
                        <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
                        <div style={{ color: "var(--eco-text)" }}>{s.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Owner identifier */}
                  <div className="flex items-center gap-2 text-[12px] pt-2 border-t" style={{ borderColor: "var(--eco-border)" }}>
                    <Shield size={12} style={{ color: "var(--eco-text-tertiary)" }} />
                    <span style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                      Owner ID: {revealedOwner === selected.id ? selected.ownerFull : selected.ownerMasked}
                    </span>
                    <button className="cursor-pointer p-0.5" onClick={() => handleRevealOwner(selected.id)} style={{ background: "transparent", border: "none" }}>
                      {revealedOwner === selected.id ? <EyeOff size={12} style={{ color: "var(--eco-text-tertiary)" }} /> : <Eye size={12} style={{ color: "var(--eco-primary)" }} />}
                    </button>
                    {revealedOwner !== selected.id && <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>Reason required</span>}
                  </div>

                  {/* Block/Unblock */}
                  <div className="flex gap-2 pt-2">
                    {getStatus(selected) !== "BLOCKED" ? (
                      <Button variant="destructive" size="sm" onClick={() => setBlockModal({ room: selected, action: "BLOCK" })}>
                        <ShieldX size={13} /> Block Room
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => setBlockModal({ room: selected, action: "UNBLOCK" })}>
                        <ShieldCheck size={13} /> Unblock Room
                      </Button>
                    )}
                  </div>
                </Card>

                {/* Event Timeline */}
                <Card className="flex flex-col gap-0">
                  <h3 className="text-[14px] mb-3" style={{ color: "var(--eco-text)" }}>Room Event Log</h3>
                  {selected.events.map((ev, i) => (
                    <div key={i} className="flex items-start gap-3 py-2.5" style={{ borderTop: i > 0 ? "1px solid var(--eco-border)" : undefined }}>
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{
                          background: ev.action.includes("BLOCK") ? "var(--eco-negative)" : ev.action.includes("created") ? "var(--eco-positive)" : "var(--eco-primary)",
                        }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{ev.action}</div>
                        <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{ev.actor}</div>
                      </div>
                      <span className="text-[11px] shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>{ev.time}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Block/Unblock modal */}
        <Modal open={!!blockModal} onClose={() => { setBlockModal(null); setBlockReason(""); }} title={blockModal ? `${blockModal.action} Room` : ""}>
          {blockModal && (
            <div className="flex flex-col gap-4">
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {blockModal.action === "BLOCK"
                  ? "Blocking this room will prevent all activity. Active members will be notified."
                  : "Unblocking will restore the room to its previous active state."}
              </div>
              <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>
                {blockModal.room.id} — {blockModal.room.name}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>Reason <span style={{ color: "var(--eco-negative)" }}>*</span></label>
                <textarea
                  rows={3} value={blockReason} onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Mandatory reason (audit logged)..."
                  className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                />
              </div>
              <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                <Shield size={11} /> Action recorded in admin audit log.
              </div>
              <Button variant={blockModal.action === "BLOCK" ? "destructive" : "primary"} disabled={!blockReason.trim()} onClick={handleBlock}>
                {blockModal.action === "BLOCK" ? "Block Room" : "Unblock Room"}
              </Button>
            </div>
          )}
        </Modal>

        {/* Reveal modal */}
        <Modal open={!!revealTarget && revealedOwner !== revealTarget} onClose={() => setRevealTarget(null)} title="Reveal Identifier">
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>Provide a reason. This action is audit-logged.</div>
            <input className="px-3 py-2 rounded-lg outline-none text-[13px]" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }} placeholder="Reason..." value={revealReason} onChange={(e) => setRevealReason(e.target.value)} />
            <Button variant="primary" disabled={!revealReason.trim()} onClick={confirmReveal}>Reveal</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
