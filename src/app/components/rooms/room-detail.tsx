import { useState } from "react";
import { Link } from "react-router";
import { Card, Badge, Button, RoomStatusBadge, Modal, Input, Stepper, WaveDivider } from "../ds-primitives";
import { ArrowLeft, Users, Star, Calendar, Shield, AlertTriangle, Check, Clock, Eye, EyeOff } from "lucide-react";

export function RoomDetailPage() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinStep, setJoinStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [joinDone, setJoinDone] = useState(false);

  const room = {
    plan: "Beeline Family 4",
    operator: "Beeline",
    status: "OPEN",
    seats: 4,
    filled: 3,
    priceTotal: 19999,
    perMember: 5000,
    serviceFee: 199,
    startDate: "2026-04-15",
    owner: { name: "Aidar K.", rating: 4.8, rooms: 5, joined: "Jan 2026" },
    cancellation: "Members can leave with 15-day notice before next billing cycle. Owner must maintain room for committed period.",
    accessMethod: "eSIM / Operator account invite",
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Link to="/operator/beeline" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> Beeline
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{room.plan}</h1>
              <RoomStatusBadge status={room.status} />
            </div>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {room.operator} · {room.accessMethod}
            </p>
          </div>

          {/* Plan Summary */}
          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Plan Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total plan cost", value: `₸${room.priceTotal.toLocaleString()}/mo` },
                { label: "Seats", value: `${room.filled}/${room.seats}`, icon: Users },
                { label: "Your share", value: `₸${room.perMember.toLocaleString()}/mo`, highlight: true },
                { label: "Start date", value: room.startDate, icon: Calendar },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{item.label}</div>
                  <div className="text-[15px]" style={{ color: item.highlight ? "var(--eco-primary)" : "var(--eco-text)" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {/* Seat fill bar */}
            <div className="flex items-center gap-3">
              <div className="h-2 rounded-full flex-1" style={{ background: "var(--eco-neutral-200)" }}>
                <div className="h-2 rounded-full" style={{ width: `${(room.filled / room.seats) * 100}%`, background: "var(--eco-primary)" }} />
              </div>
              <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>1 seat available</span>
            </div>
          </Card>

          {/* Price Breakdown */}
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Price Breakdown</h3>
            {[
              { label: "Plan cost", value: `₸${room.priceTotal.toLocaleString()}` },
              { label: `Split between ${room.seats} members`, value: `÷${room.seats}` },
              { label: "Your monthly share", value: `₸${room.perMember.toLocaleString()}`, bold: true },
              { label: "Service fee", value: `₸${room.serviceFee}` },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: row.bold ? "var(--eco-text)" : "var(--eco-text-secondary)" }}>{row.value}</span>
              </div>
            ))}
            <div className="border-t pt-3 flex justify-between text-[14px]" style={{ borderColor: "var(--eco-border)" }}>
              <span style={{ color: "var(--eco-text)" }}>Total / month</span>
              <span style={{ color: "var(--eco-primary)" }}>₸{(room.perMember + room.serviceFee).toLocaleString()}</span>
            </div>
          </Card>

          {/* Cancellation rules */}
          <Card className="flex items-start gap-3">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
            <div>
              <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>Cancellation Rules</div>
              <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>{room.cancellation}</div>
            </div>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          {/* Owner */}
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Room Owner</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-surface)" }}>
                <span className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>AK</span>
              </div>
              <div>
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{room.owner.name}</div>
                <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  <span className="flex items-center gap-0.5" style={{ color: "var(--eco-warning)" }}>
                    <Star size={12} fill="currentColor" /> {room.owner.rating}
                  </span>
                  · {room.owner.rooms} rooms · Since {room.owner.joined}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-positive)" }}>
              <Shield size={13} /> Verified owner
            </div>
          </Card>

          {/* CTA */}
          <Card className="flex flex-col gap-3">
            <div className="text-[20px]" style={{ color: "var(--eco-primary)" }}>₸{(room.perMember + room.serviceFee).toLocaleString()}<span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>/mo</span></div>
            <Button variant="primary" size="lg" className="w-full" onClick={() => { setJoinOpen(true); setJoinStep(0); setJoinDone(false); }}>
              Join Room
            </Button>
            <p className="text-[11px] text-center" style={{ color: "var(--eco-text-tertiary)" }}>
              Your identifier will be shared with owner only after payment
            </p>
          </Card>
        </div>
      </div>

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Room">
        {!joinDone ? (
          <div className="flex flex-col gap-5">
            <Stepper steps={["Identifier", "Payment"]} current={joinStep} />

            {joinStep === 0 && (
              <div className="flex flex-col gap-4">
                <Input label="Telecom Identifier" placeholder="Phone number or contract ID" hint="e.g. +7 (707) 123-45-67" />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                  <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                    I consent to sharing my identifier with the room owner after successful payment. My data will be masked and visible only to the owner.
                  </span>
                </label>
                <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield size={13} style={{ color: "var(--eco-primary)" }} />
                    Privacy Notice
                  </div>
                  Your identifier is stored encrypted. It will be shown to the room owner in masked format (e.g. +7 *** ***-**-67) only after your payment is confirmed.
                </div>
                <Button variant="primary" className="w-full" disabled={!consent} onClick={() => setJoinStep(1)}>
                  Continue to Payment
                </Button>
              </div>
            )}

            {joinStep === 1 && (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-2">
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: "var(--eco-text-secondary)" }}>Monthly share</span>
                    <span style={{ color: "var(--eco-text)" }}>₸5,000</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span style={{ color: "var(--eco-text-secondary)" }}>Service fee</span>
                    <span style={{ color: "var(--eco-text)" }}>₸199</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-[14px]" style={{ borderColor: "var(--eco-border)" }}>
                    <span style={{ color: "var(--eco-text)" }}>Due now</span>
                    <span style={{ color: "var(--eco-primary)" }}>₸5,199</span>
                  </div>
                </Card>
                <Button variant="primary" className="w-full" onClick={() => setJoinDone(true)}>
                  Proceed to Payment
                </Button>
                <p className="text-[11px] text-center" style={{ color: "var(--eco-text-tertiary)" }}>
                  Payment processing is handled by a secure third-party provider
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center text-center py-4 gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
              <Check size={20} style={{ color: "var(--eco-positive)" }} />
            </div>
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Application Submitted</div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              Your status is now <Badge variant="warning">PENDING</Badge>. The owner will grant access within 48h.
            </div>
            <Button variant="secondary" className="mt-2" onClick={() => setJoinOpen(false)}>View My Status</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
