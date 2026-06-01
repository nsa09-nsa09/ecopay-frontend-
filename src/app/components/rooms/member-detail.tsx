import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Card, Button, MemberStatusBadge, RoomStatusBadge } from "../ds-primitives";
import { ArrowLeft, CheckCircle2, Clock, Shield, AlertTriangle, LifeBuoy } from "lucide-react";
import {
  ApiError,
  confirmMemberAccessRequest,
  getRoom,
  getMyMembership,
  type MyRoomMembershipDto,
  type RoomResponseDto,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";

const moneyFormatter = new Intl.NumberFormat("ru-RU");
const formatMoney = (v: number | null | undefined) => `₸${moneyFormatter.format(Number(v ?? 0))}`;
const formatDate = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString() : "TBD");
const formatDateTime = (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : null);

const POST_PAYMENT = new Set(["PENDING", "ACTIVE"]);

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id);
  const { authorizedRequest } = useAuth();

  const [room, setRoom] = useState<RoomResponseDto | null>(null);
  const [membership, setMembership] = useState<MyRoomMembershipDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) {
      setError("Room not found.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([getRoom(roomId), authorizedRequest((token) => getMyMembership(roomId, token))])
      .then(([roomResponse, membershipResponse]) => {
        if (cancelled) return;
        setRoom(roomResponse);
        setMembership(membershipResponse);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError("You are not a member of this room.");
        } else {
          setError("Unable to load this membership right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, authorizedRequest]);

  const handleConfirm = async () => {
    setConfirming(true);
    setConfirmError(null);
    try {
      const updated = await authorizedRequest((token) => confirmMemberAccessRequest(roomId, token));
      setMembership(updated);
    } catch (err) {
      setConfirmError(err instanceof ApiError ? err.message : "Unable to confirm access right now.");
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return <div className="max-w-[800px] mx-auto px-6 py-8"><Card>Loading membership...</Card></div>;
  }

  if (error || !room || !membership) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> My Rooms
        </Link>
        <Card><span style={{ color: "var(--eco-negative)" }}>{error ?? "Membership not found."}</span></Card>
      </div>
    );
  }

  const isTelecom = room.roomType === "TELECOM";
  const paid = POST_PAYMENT.has(membership.status);
  const ownerGranted = !!membership.ownerAccessConfirmedAt;
  const memberConfirmed = !!membership.memberConfirmedAt;
  const isActive = membership.status === "ACTIVE";
  const canConfirm = membership.status === "PENDING" && ownerGranted && !memberConfirmed;

  const timelineSteps = [
    { label: "Application submitted", time: null as string | null, done: true },
    { label: "Payment confirmed", time: null, done: paid, active: !paid },
    {
      label: "Owner granted access",
      time: formatDateTime(membership.ownerAccessConfirmedAt),
      done: ownerGranted,
      active: paid && !ownerGranted,
    },
    {
      label: "You confirmed access",
      time: formatDateTime(membership.memberConfirmedAt),
      done: memberConfirmed,
      active: canConfirm,
    },
    {
      label: "Membership active",
      time: formatDateTime(membership.activatedAt),
      done: isActive,
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
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>{room.title}</h1>
          <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            {room.providerName}{room.connectionType ? ` · ${room.connectionType}` : ""}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MemberStatusBadge status={membership.status} />
          <RoomStatusBadge status={room.status} />
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
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Action panel when PENDING */}
        {membership.status === "PENDING" && (
          <Card className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Clock size={16} style={{ color: "var(--eco-warning)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>
                {ownerGranted ? "Confirm Access" : "Waiting for Access"}
              </h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--eco-warning-100)" }}>
              <div className="text-[14px] mb-1" style={{ color: "var(--eco-text)" }}>
                {ownerGranted
                  ? "The owner marked your access as granted"
                  : "Waiting for the owner to grant access"}
              </div>
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {ownerGranted
                  ? "Verify you can use the plan, then confirm below to activate your membership."
                  : `The room owner will provide access${membership.accessMethod ? ` via ${membership.accessMethod}` : ""}. If it takes too long, you can open a support ticket.`}
              </div>
            </div>
            {confirmError && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{confirmError}</p>}
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                disabled={!canConfirm}
                loading={confirming}
                onClick={handleConfirm}
              >
                {memberConfirmed ? "Access Confirmed" : "Confirm Access Received"}
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
        {(room.status === "BLOCKED" || membership.status === "BLOCKED_BY_ADMIN") && (
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

        {/* Privacy / identifier panel (telecom only) */}
        {isTelecom && membership.identifierMasked && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Shield size={16} style={{ color: "var(--eco-primary)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Privacy & Identifier</h3>
            </div>
            <div className="p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
              <div className="text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>
                Your {membership.identifierType?.toLowerCase() ?? "telecom"} identifier
              </div>
              <div className="text-[18px] tracking-wider mb-3" style={{ color: "var(--eco-text)", fontFamily: "monospace" }}>
                {membership.identifierMasked}
              </div>
              <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                Visible to the room owner only after successful payment. Your full identifier is encrypted and stored securely.
              </div>
            </div>
          </Card>
        )}

        {/* Plan info summary */}
        <Card className="flex flex-col gap-3">
          <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Plan Details</h3>
          {[
            { label: "Your share", value: `${formatMoney(room.pricePerMember)}/${(room.periodType ?? "").toLowerCase()}` },
            { label: "Start date", value: formatDate(room.startDate) },
            { label: "Seats", value: `${room.maxMembers}` },
            ...(isTelecom ? [{ label: "Access method", value: membership.accessMethod ?? room.connectionType ?? "—" }] : []),
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-[14px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
              <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Mobile sticky CTA */}
      {canConfirm && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 border-t" style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}>
          <Button variant="primary" size="lg" className="w-full" loading={confirming} onClick={handleConfirm}>
            Confirm Access Received
          </Button>
        </div>
      )}
    </div>
  );
}
