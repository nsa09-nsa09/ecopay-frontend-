import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, MemberStatusBadge, RoomStatusBadge, SkeletonCard, EmptyState } from "../ds-primitives";
import { ArrowLeft, CheckCircle2, Clock, Shield, AlertTriangle, LifeBuoy, CreditCard } from "lucide-react";
import { roomsApi, roomMembersApi } from "../../../lib/api/rooms";

function computeSlaTimeLeft(joinedAt?: string): string | null {
  if (!joinedAt) return null;
  const slaEndMs = new Date(joinedAt).getTime() + 48 * 60 * 60 * 1000;
  const remain = slaEndMs - Date.now();
  if (remain <= 0) return null;
  const h = Math.floor(remain / 3_600_000);
  const m = Math.floor((remain % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const roomQ = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => roomsApi.get(id!),
    enabled: !!id,
  });

  const memberQ = useQuery({
    queryKey: ["rooms", id, "membership", "me"],
    queryFn: () => roomMembersApi.myMembership(id!),
    enabled: !!id,
    retry: false,
  });

  const confirmAccess = useMutation({
    mutationFn: () => roomMembersApi.confirmAccessAsMember(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", id] });
      qc.invalidateQueries({ queryKey: ["rooms", id, "membership", "me"] });
    },
  });

  if (!id) return null;

  if (roomQ.isLoading || memberQ.isLoading) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-8 flex flex-col gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (roomQ.isError) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <EmptyState
          title="Room unavailable"
          description="We couldn't load this room. It may have been removed or you don't have access."
        />
        <div className="text-center mt-4">
          <Button variant="secondary" size="md" onClick={() => roomQ.refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const room = roomQ.data;
  const member = memberQ.data;

  if (!room) return null;

  if (memberQ.isError || !member) {
    return (
      <div className="max-w-[800px] mx-auto px-6 py-8">
        <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> My Rooms
        </Link>
        <EmptyState
          title="Not a member"
          description="You don't appear to be a member of this room. Open the room page to join it."
        />
        <div className="text-center mt-4">
          <Link to={`/room/${id}`} style={{ textDecoration: "none" }}>
            <Button variant="primary" size="md">View room</Button>
          </Link>
        </div>
      </div>
    );
  }

  const slaTimeLeft = member.status === "PAID" ? computeSlaTimeLeft(member.joinedAt) : null;
  const myStatus = member.status;
  const accessGranted = myStatus === "CONFIRMED";
  const needsPayment = myStatus === "PENDING";
  const waitingForAccess = myStatus === "PAID";
  const isBlocked = room.status === "BLOCKED" || myStatus === "REMOVED";

  const timelineSteps = [
    { label: "Application submitted", time: member.joinedAt, done: true, active: false },
    { label: "Payment confirmed", time: undefined, done: myStatus === "PAID" || accessGranted, active: needsPayment },
    {
      label: "Waiting for owner to grant access",
      time: undefined,
      done: accessGranted,
      active: waitingForAccess,
    },
    {
      label: "Access confirmed",
      time: undefined,
      done: accessGranted,
      active: false,
    },
  ];

  const goPay = () => {
    navigate("/payment/room", { state: { roomMemberId: member.id, roomId: room.id } });
  };

  return (
    <div className="max-w-[800px] mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>{room.name}</h1>
          <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            {room.operator || room.serviceName}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MemberStatusBadge status={myStatus} />
          <RoomStatusBadge status={room.status} />
        </div>
      </div>

      <div className="flex flex-col gap-6">
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
                    <div className="text-[12px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{new Date(step.time).toLocaleString()}</div>
                  )}
                  {step.active && slaTimeLeft && (
                    <div className="flex items-center gap-1.5 mt-1.5 text-[13px]" style={{ color: "var(--eco-warning)" }}>
                      <Clock size={13} /> SLA: {slaTimeLeft} remaining
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {needsPayment && (
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <CreditCard size={16} style={{ color: "var(--eco-primary)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Payment Required</h3>
            </div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              Complete payment to secure your seat in this room.
            </div>
            <Button variant="primary" size="md" onClick={goPay}>
              Pay ₸{room.pricePerMember.toLocaleString()}
            </Button>
          </Card>
        )}

        {waitingForAccess && (
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
                The room owner has 48 hours to provide access. If the SLA expires, you can create a support ticket for resolution.
              </div>
              {slaTimeLeft && (
                <div className="mt-3 text-[20px]" style={{ color: "var(--eco-warning)" }}>
                  {slaTimeLeft}
                  <span className="text-[13px] ml-1" style={{ color: "var(--eco-text-tertiary)" }}>remaining</span>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="primary"
                size="md"
                className="flex-1"
                loading={confirmAccess.isPending}
                disabled={confirmAccess.isPending}
                onClick={() => confirmAccess.mutate()}
              >
                Confirm Access Received
              </Button>
              <Link
                to="/support/new"
                state={{ subject: `Issue with room ${room.name}` }}
                style={{ textDecoration: "none" }}
              >
                <Button variant="secondary" size="md" className="w-full sm:w-auto">
                  <LifeBuoy size={14} /> Create Support Ticket
                </Button>
              </Link>
            </div>
            {confirmAccess.isError && (
              <div className="text-[12px]" style={{ color: "var(--eco-negative)" }}>
                Failed to confirm. Please try again.
              </div>
            )}
          </Card>
        )}

        {isBlocked && (
          <Card className="flex items-start gap-3">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--eco-negative)" }} />
            <div>
              <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Room Blocked</div>
              <div className="text-[13px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>
                This room has been blocked by an administrator. Active members will receive refund instructions via email. Contact support for more information.
              </div>
              <Link to="/support/new" state={{ subject: `Blocked room ${room.name}` }} className="inline-flex items-center gap-1 text-[13px] mt-2" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
                <LifeBuoy size={13} /> Contact Support
              </Link>
            </div>
          </Card>
        )}

        <Card className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Shield size={16} style={{ color: "var(--eco-primary)" }} />
            <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Privacy & Identifier</h3>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
              Your telecom identifier is encrypted and only visible to the room owner after a successful payment.
            </div>
          </div>
        </Card>

        <Card className="flex flex-col gap-3">
          <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Plan Details</h3>
          {[
            { label: "Monthly share", value: `${room.currency || "₸"}${room.pricePerMember.toLocaleString()}/mo` },
            { label: "Start date", value: room.startDate ? new Date(room.startDate).toLocaleDateString() : "—" },
            { label: "Seats", value: `${room.filled}/${room.seats}` },
          ].map((row) => (
            <div key={row.label} className="flex justify-between text-[14px]">
              <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
              <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
            </div>
          ))}
        </Card>
      </div>

      {needsPayment && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 border-t" style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}>
          <Button variant="primary" size="lg" className="w-full" onClick={goPay}>
            Pay ₸{room.pricePerMember.toLocaleString()}
          </Button>
        </div>
      )}
    </div>
  );
}
