import { Link } from "react-router";
import { Card, Button } from "../ds-primitives";
import { Users, AlertTriangle, ShieldX, ArrowLeft, RefreshCw, LifeBuoy } from "lucide-react";

export function RoomFullPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-warning-100)" }}>
        <Users size={24} style={{ color: "var(--eco-warning)" }} />
      </div>
      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Room is Full</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        All seats in this room have been filled. You can browse similar plans or create your own room.
      </p>
      <Card className="text-left mb-6">
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>Room details</div>
        {[
          { label: "Plan", value: "Beeline Family 4" },
          { label: "Seats", value: "4/4 (full)" },
          { label: "Operator", value: "Beeline" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-[14px] mb-1.5">
            <span style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</span>
            <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/" style={{ textDecoration: "none" }}>
          <Button variant="primary">Browse Catalog</Button>
        </Link>
        <Link to="/rooms/create" style={{ textDecoration: "none" }}>
          <Button variant="secondary">Create Your Own Room</Button>
        </Link>
      </div>
    </div>
  );
}

export function PaymentFailedPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-danger-100)" }}>
        <AlertTriangle size={24} style={{ color: "var(--eco-negative)" }} />
      </div>
      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Payment Failed</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        Your payment could not be processed. Your application is still active — you can retry using the same payment intent.
      </p>
      <Card className="text-left mb-6">
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>Payment details</div>
        {[
          { label: "Amount", value: "₸5,199" },
          { label: "Room", value: "Beeline Family 4" },
          { label: "Error", value: "Insufficient funds" },
          { label: "Intent ID", value: "pi_3M...xK7d" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-[14px] mb-1.5">
            <span style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</span>
            <span style={{ color: row.label === "Error" ? "var(--eco-negative)" : "var(--eco-text)" }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button variant="primary">
          <RefreshCw size={14} /> Retry Payment
        </Button>
        <Link to="/support/new" style={{ textDecoration: "none" }}>
          <Button variant="secondary">
            <LifeBuoy size={14} /> Contact Support
          </Button>
        </Link>
      </div>
      <p className="text-[12px] mt-4" style={{ color: "var(--eco-text-tertiary)" }}>
        Your payment intent remains valid for 24 hours. No duplicate charges will occur.
      </p>
    </div>
  );
}

export function RoomBlockedPage() {
  return (
    <div className="max-w-lg mx-auto px-6 py-16 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-danger-100)" }}>
        <ShieldX size={24} style={{ color: "var(--eco-negative)" }} />
      </div>
      <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>Room Blocked</h1>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        This room has been blocked by an administrator following a review. All active members will receive refund instructions.
      </p>
      <Card className="text-left mb-6">
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>Details</div>
        {[
          { label: "Room", value: "Kcell Group 3" },
          { label: "Status", value: "BLOCKED" },
          { label: "Reason", value: "Admin decision — pending review" },
          { label: "Blocked on", value: "2026-04-01" },
        ].map((row) => (
          <div key={row.label} className="flex justify-between text-[14px] mb-1.5">
            <span style={{ color: "var(--eco-text-tertiary)" }}>{row.label}</span>
            <span style={{ color: row.label === "Status" ? "var(--eco-negative)" : "var(--eco-text)" }}>{row.value}</span>
          </div>
        ))}
      </Card>
      <div className="flex flex-col gap-3 items-center">
        <div className="p-4 rounded-lg text-[13px] w-full" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
          If you believe this is an error, please contact our support team. Refunds for active members are processed within 5–7 business days.
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/support/new" style={{ textDecoration: "none" }}>
            <Button variant="primary">
              <LifeBuoy size={14} /> Contact Support
            </Button>
          </Link>
          <Link to="/rooms" style={{ textDecoration: "none" }}>
            <Button variant="ghost">
              <ArrowLeft size={14} /> Back to My Rooms
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
