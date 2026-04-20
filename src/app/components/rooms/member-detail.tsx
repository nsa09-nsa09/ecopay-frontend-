import { useState } from "react";
import { Link, useParams } from "react-router";
import { Card, Button, Badge, MemberStatusBadge, RoomStatusBadge } from "../ds-primitives";
import { ArrowLeft, CheckCircle2, Clock, Shield, AlertTriangle, LifeBuoy } from "lucide-react";

const membershipData: Record<string, {
  room: string; operator: string; roomStatus: string; myStatus: string;
  appliedAt: string; paidAt: string | null; accessGrantedAt: string | null;
  slaTimeLeft: string | null; accessMethod: string; identifier: string;
  perMember: number; nextBilling: string | null; startDate: string;
  seats: number; filled: number;
}> = {
  r1: {
    room: "Beeline Family 4", operator: "Beeline", roomStatus: "OPEN", myStatus: "PENDING",
    appliedAt: "2026-04-01 14:30", paidAt: "2026-04-01 14:32", accessGrantedAt: null,
    slaTimeLeft: "23h 45m", accessMethod: "eSIM activation", identifier: "+7 7** *** ** 85",
    perMember: 5000, nextBilling: null, startDate: "2026-04-15", seats: 4, filled: 3,
  },
  r2: {
    room: "Activ Family 5", operator: "Activ", roomStatus: "ACTIVE", myStatus: "ACTIVE",
    appliedAt: "2026-02-28 10:00", paidAt: "2026-02-28 10:02", accessGrantedAt: "2026-03-01 09:15",
    slaTimeLeft: null, accessMethod: "Operator account invite", identifier: "+7 7** *** ** 85",
    perMember: 3200, nextBilling: "2026-05-01", startDate: "2026-03-01", seats: 5, filled: 5,
  },
  r4: {
    room: "Tele2 Duo", operator: "Tele2", roomStatus: "COMPLETED", myStatus: "ACTIVE",
    appliedAt: "2025-11-28 16:00", paidAt: "2025-11-28 16:03", accessGrantedAt: "2025-11-29 11:00",
    slaTimeLeft: null, accessMethod: "Physical SIM", identifier: "+7 7** *** ** 85",
    perMember: 4500, nextBilling: null, startDate: "2025-12-01", seats: 2, filled: 2,
  },
  r5: {
    room: "Kcell Group 3", operator: "Kcell", roomStatus: "BLOCKED", myStatus: "BLOCKED",
    appliedAt: "2026-01-30 12:00", paidAt: "2026-01-30 12:05", accessGrantedAt: "2026-02-01 08:00",
    slaTimeLeft: null, accessMethod: "eSIM activation", identifier: "+7 7** *** ** 85",
    perMember: 3800, nextBilling: null, startDate: "2026-02-01", seats: 3, filled: 2,
  },
};

export function MemberDetailPage() {
  const { id } = useParams();
  const [confirmed, setConfirmed] = useState(false);
  const m = membershipData[id || "r1"] || membershipData.r1;

  const timelineSteps = [
    { label: "Application submitted", time: m.appliedAt, done: true },
    { label: "Payment confirmed", time: m.paidAt, done: !!m.paidAt },
    {
      label: "Waiting for owner to grant access",
      time: m.accessGrantedAt ? null : undefined,
      done: !!m.accessGrantedAt,
      active: !m.accessGrantedAt && m.myStatus === "PENDING",
    },
    {
      label: "Access confirmed",
      time: m.accessGrantedAt,
      done: !!m.accessGrantedAt,
    },
  ];

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>{m.room}</h1>
          <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            {m.operator} · {m.accessMethod}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MemberStatusBadge status={m.myStatus} />
          <RoomStatusBadge status={m.roomStatus} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* Status Timeline */}
        <Card className="flex flex-col gap-4">
          <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Status Timeline</h3>
          <div className="flex flex-col gap-0">
            {timelineSteps.map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      background: step.done ? "var(--eco-success-100)" : step.active ? "var(--eco-warning-100)" : "var(--eco-neutral-100)",
                    }}
                  >
                    {step.done ? (
                      <CheckCircle2 size={13} style={{ color: "var(--eco-positive)" }} />
                    ) : step.active ? (
                      <Clock size={13} style={{ color: "var(--eco-warning)" }} />
                    ) : (
                      <div className="w-2 h-2 rounded-full" style={{ background: "var(--eco-neutral-300)" }} />
                    )}
                  </div>
                  {i < timelineSteps.length - 1 && (
                    <div className="w-px h-6" style={{ background: step.done ? "var(--eco-positive)" : "var(--eco-neutral-200)" }} />
                  )}
                </div>
                <div className="pb-4">
                  <div className="text-[14px]" style={{ color: step.done || step.active ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}>
                    {step.label}
                  </div>
                  {step.time && (
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{step.time}</div>
                  )}
                  {step.active && m.slaTimeLeft && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[13px]" style={{ color: "var(--eco-warning)" }}>
                      <Clock size={13} /> SLA: {m.slaTimeLeft} remaining
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* SLA Timer Panel (only when PENDING) */}
        {m.myStatus === "PENDING" && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: "var(--eco-warning)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Waiting for Access</h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--eco-warning-100)" }}>
              <div className="text-[14px] mb-1" style={{ color: "var(--eco-text)" }}>
                Waiting for owner to grant access
              </div>
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                The room owner has 48 hours to provide access via {m.accessMethod}. If the SLA expires, you can create a support ticket for resolution.
              </div>
              {m.slaTimeLeft && (
                <div className="mt-3 text-[20px]" style={{ color: "var(--eco-warning)" }}>
                  {m.slaTimeLeft}
                  <span className="text-[13px] ml-1" style={{ color: "var(--eco-text-tertiary)" }}>remaining</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={confirmed}
                onClick={() => setConfirmed(true)}
              >
                {confirmed ? "Access Confirmed" : "Confirm Access Received"}
              </Button>
              <Link to="/support/new" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="md" className="w-full sm:w-auto">
                  <LifeBuoy size={14} /> Create Support Ticket
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {/* Blocked notice */}
        {m.roomStatus === "BLOCKED" && (
          <Card className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-negative)" }} />
            <div>
              <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Room Blocked</div>
              <div className="text-[13px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>
                This room has been blocked by an administrator. Active members will receive refund instructions via email. Contact support for more information.
              </div>
              <Link to="/support/new" className="inline-flex items-center gap-1 text-[13px] mt-2" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
                <LifeBuoy size={13} /> Contact Support
              </Link>
            </div>
          </Card>
        )}

        {/* Privacy Panel */}
        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--eco-primary)" }} />
            <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Privacy & Identifier</h3>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
            <div className="text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>
              Your telecom identifier
            </div>
            <div className="text-[18px] tracking-wider mb-3" style={{ color: "var(--eco-text)", fontFamily: "monospace" }}>
              {m.identifier}
            </div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
              Visible to room owner only after successful payment. Your full number is encrypted and stored securely.
            </div>
          </div>
        </Card>

        {/* Plan info summary */}
        <Card className="flex flex-col gap-3">
          <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Plan Details</h3>
          {[
            { label: "Monthly share", value: `₸${m.perMember.toLocaleString()}/mo` },
            { label: "Start date", value: m.startDate },
            { label: "Seats", value: `${m.filled}/${m.seats}` },
            { label: "Access method", value: m.accessMethod },
            ...(m.nextBilling ? [{ label: "Next billing", value: m.nextBilling }] : []),
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-[14px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
              <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Mobile sticky CTA */}
      {m.myStatus === "PENDING" && !confirmed && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 border-t" style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}>
          <Button variant="primary" size="lg" className="w-full" onClick={() => setConfirmed(true)}>
            Confirm Access Received
          </Button>
        </div>
      )}
    </div>
  );
}
