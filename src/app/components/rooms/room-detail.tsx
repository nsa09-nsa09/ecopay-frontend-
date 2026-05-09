import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, Badge, Button, RoomStatusBadge, Modal, Input, Stepper } from "../ds-primitives";
import { ArrowLeft, Users, Calendar, Shield, AlertTriangle, Check, Eye } from "lucide-react";
import { roomsApi, roomMembersApi } from "../../../lib/api/rooms";
import { ApiError } from "../../../lib/api/client";
import { useAuth } from "../../../lib/auth/AuthContext";

const SERVICE_FEE = 199;

export function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user } = useAuth();
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinStep, setJoinStep] = useState(0);
  const [consent, setConsent] = useState(false);
  const [identifier, setIdentifier] = useState("");

  const roomQuery = useQuery({
    queryKey: ["rooms", "detail", id],
    queryFn: () => roomsApi.get(id!),
    enabled: Boolean(id),
  });
  const r = roomQuery.data;

  const myMembershipQuery = useQuery({
    queryKey: ["rooms", id, "membership", "me"],
    queryFn: () => roomMembersApi.myMembership(id!),
    enabled: Boolean(id) && Boolean(user),
    retry: false,
  });

  const membersQuery = useQuery({
    queryKey: ["rooms", id, "members"],
    queryFn: () => roomMembersApi.list(id!),
    enabled: Boolean(id) && Boolean(user) && r?.ownerUserId === user?.id,
  });

  const joinMutation = useMutation({
    mutationFn: () => roomMembersApi.join(id!, { message: identifier }),
    onSuccess: (mem) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["rooms", id, "membership", "me"] });
      toast.success("Application submitted");
      setJoinOpen(false);
      navigate("/payment/room", {
        state: {
          roomMemberId: String(mem.id),
          roomId: String(r?.id),
          amount: Number(r?.pricePerMember) + SERVICE_FEE,
          currency: "KZT",
        },
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to join";
      toast.error(msg);
    },
  });

  const confirmAccessMutation = useMutation({
    mutationFn: () => roomMembersApi.confirmAccessAsMember(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", id, "membership", "me"] });
      toast.success("Access confirmed — your membership is now active");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to confirm";
      toast.error(msg);
    },
  });

  if (roomQuery.isLoading) {
    return <div className="max-w-[1200px] mx-auto px-6 py-8 text-[13px]">Loading...</div>;
  }
  if (!r) {
    return <div className="max-w-[1200px] mx-auto px-6 py-8 text-[13px]">Room not found.</div>;
  }

  const isOwner = user?.id === r.ownerUserId;
  const myMember = myMembershipQuery.data;
  const filled = r.filled ?? 0;
  const priceTotal = Number(r.priceTotal ?? Number(r.pricePerMember) * r.maxMembers);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> Catalog
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{r.title}</h1>
              <RoomStatusBadge status={r.status} />
            </div>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {r.serviceName ?? "—"} · {r.roomType}
            </p>
          </div>

          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Plan Summary</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: "Total cost", value: `₸${priceTotal.toLocaleString()}/mo` },
                { label: "Seats", value: `${filled}/${r.maxMembers}`, icon: Users },
                { label: "Your share", value: `₸${Number(r.pricePerMember).toLocaleString()}/mo`, highlight: true },
                { label: "Start date", value: r.startDate?.slice(0, 10) ?? "—", icon: Calendar },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{item.label}</div>
                  <div className="text-[15px]" style={{ color: item.highlight ? "var(--eco-primary)" : "var(--eco-text)" }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            <div className="h-2 rounded-full flex-1" style={{ background: "var(--eco-neutral-200)" }}>
              <div className="h-2 rounded-full" style={{ width: `${(filled / r.maxMembers) * 100}%`, background: "var(--eco-primary)" }} />
            </div>
          </Card>

          {r.description && (
            <Card>
              <h3 className="text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>Description</h3>
              <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{r.description}</p>
            </Card>
          )}

          {/* Owner-only: members table with grant-access actions */}
          {isOwner && (
            <Card className="flex flex-col gap-3">
              <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Members</h3>
              {membersQuery.isLoading && <div className="text-[12px]">Loading members...</div>}
              {!membersQuery.isLoading && (membersQuery.data?.length ?? 0) === 0 && (
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  No members yet.
                </div>
              )}
              {(membersQuery.data ?? []).map((m) => (
                <OwnerMemberRow key={m.id} roomId={id!} member={m} />
              ))}
            </Card>
          )}

          {/* Member-only: confirm access received */}
          {!isOwner && myMember?.status === "PENDING" && myMember.ownerAccessConfirmedAt && (
            <Card className="flex flex-col gap-3" style={{ borderColor: "var(--eco-positive)" }}>
              <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>
                Owner has granted access
              </h3>
              <p className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                Confirm that you received the access (login, invite, etc.) so the membership becomes active.
              </p>
              <Button
                variant="primary"
                size="lg"
                disabled={confirmAccessMutation.isPending}
                onClick={() => confirmAccessMutation.mutate()}
              >
                {confirmAccessMutation.isPending ? "..." : "Confirm — I received access"}
              </Button>
            </Card>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Room Owner</h3>
            <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>
              {isOwner ? "You" : (r.ownerDisplayName ?? "—")}
            </div>
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-positive)" }}>
              <Shield size={13} /> Verified owner
            </div>
          </Card>

          {!isOwner && !myMember && r.status === "OPEN" && (
            <Card className="flex flex-col gap-3">
              <div className="text-[20px]" style={{ color: "var(--eco-primary)" }}>
                ₸{(Number(r.pricePerMember) + SERVICE_FEE).toLocaleString()}
                <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>/mo</span>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => { setJoinOpen(true); setJoinStep(0); }}
              >
                Join Room
              </Button>
            </Card>
          )}

          {!isOwner && myMember && (
            <Card className="flex flex-col gap-2">
              <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Your membership</div>
              <Badge variant={badgeVariant(myMember.status)}>{myMember.status}</Badge>
              {myMember.status === "APPLIED" && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate("/payment/room", {
                    state: {
                      roomMemberId: String(myMember.id),
                      roomId: String(r.id),
                      amount: Number(r.pricePerMember) + SERVICE_FEE,
                      currency: "KZT",
                    },
                  })}
                >
                  Continue to payment
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>

      {/* Join Modal */}
      <Modal open={joinOpen} onClose={() => setJoinOpen(false)} title="Join Room">
        <div className="flex flex-col gap-5">
          <Stepper steps={["Identifier", "Apply"]} current={joinStep} />

          {joinStep === 0 && (
            <div className="flex flex-col gap-4">
              <Input
                label="Identifier (phone or account)"
                placeholder="+7 (707) 123-45-67 or email"
                value={identifier}
                onChange={(e: any) => setIdentifier(e.target.value)}
              />
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                  I consent to sharing my identifier with the room owner after successful payment.
                </span>
              </label>
              <Button variant="primary" disabled={!consent || !identifier} onClick={() => setJoinStep(1)}>
                Continue
              </Button>
            </div>
          )}

          {joinStep === 1 && (
            <div className="flex flex-col gap-4">
              <Card className="flex flex-col gap-2">
                <div className="flex justify-between text-[13px]">
                  <span>Monthly share</span>
                  <span>₸{Number(r.pricePerMember).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[13px]">
                  <span>Service fee</span>
                  <span>₸{SERVICE_FEE}</span>
                </div>
                <div className="border-t pt-2 flex justify-between text-[14px]">
                  <span>Due now</span>
                  <span style={{ color: "var(--eco-primary)" }}>
                    ₸{(Number(r.pricePerMember) + SERVICE_FEE).toLocaleString()}
                  </span>
                </div>
              </Card>
              <Button
                variant="primary"
                disabled={joinMutation.isPending}
                onClick={() => joinMutation.mutate()}
              >
                {joinMutation.isPending ? "Submitting..." : "Submit & continue to payment"}
              </Button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

function OwnerMemberRow({ roomId, member }: { roomId: string; member: any }) {
  const qc = useQueryClient();
  const [revealed, setRevealed] = useState<string | null>(null);

  const revealMutation = useMutation({
    mutationFn: () => roomMembersApi.revealIdentifier(roomId, member.id, { reason: "Setup" }),
    onSuccess: (data: any) => {
      setRevealed(data?.identifier ?? data?.value ?? "");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to reveal";
      toast.error(msg);
    },
  });

  const grantMutation = useMutation({
    mutationFn: () => roomMembersApi.ownerAccess(roomId, member.id, {
      accessMethod: "MANUAL",
      grant: true,
    } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", roomId, "members"] });
      toast.success("Access marked as granted");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to grant";
      toast.error(msg);
    },
  });

  const canReveal = member.status === "PENDING" || member.status === "ACTIVE";
  const canGrant = member.status === "PENDING" && !member.ownerAccessConfirmedAt;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>
            {member.displayName ?? `Member #${member.id}`}
          </span>
          <Badge variant={badgeVariant(member.status)}>{member.status}</Badge>
        </div>
      </div>

      {revealed && (
        <div className="text-[12px] p-2 rounded" style={{ background: "var(--eco-neutral-100)" }}>
          <strong>Identifier:</strong> {revealed}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {canReveal && (
          <Button
            variant="secondary"
            size="sm"
            disabled={revealMutation.isPending}
            onClick={() => revealMutation.mutate()}
          >
            <Eye size={12} /> Reveal identifier
          </Button>
        )}
        {canGrant && (
          <Button
            variant="primary"
            size="sm"
            disabled={grantMutation.isPending}
            onClick={() => grantMutation.mutate()}
          >
            <Check size={12} /> Mark access granted
          </Button>
        )}
        {member.ownerAccessConfirmedAt && !member.memberConfirmedAt && (
          <span className="text-[11px] inline-flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
            <AlertTriangle size={11} /> Waiting for member to confirm
          </span>
        )}
      </div>
    </div>
  );
}

function badgeVariant(status: string): "info" | "warning" | "success" | "default" {
  switch (status) {
    case "ACTIVE": return "success";
    case "PENDING": return "warning";
    case "APPLIED": return "info";
    default: return "default";
  }
}
