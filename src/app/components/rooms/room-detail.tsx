import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, Badge, Button, RoomStatusBadge, Modal, Input, Stepper } from "../ds-primitives";
import { ArrowLeft, Users, Calendar, Shield, AlertTriangle, Check, Eye, Star } from "lucide-react";
import { roomsApi, roomMembersApi } from "../../../lib/api/rooms";
import { ApiError } from "../../../lib/api/client";
import { useAuth } from "../../../lib/auth/AuthContext";
import type { AccessType } from "../../../lib/api/types";

const ACCESS_TYPE_LABELS: Record<AccessType, string> = {
  FAMILY_PLAN: "Added to a family / group plan",
  SHARED_ACCOUNT: "Shared account login",
  INVITE_LINK: "Invite link",
  EMAIL_INVITE: "Invite to your email",
};

const PERIOD_SUFFIX: Record<string, string> = { MONTHLY: "/mo", YEARLY: "/yr", OTHER: "" };

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
    mutationFn: () =>
      roomMembersApi.join(id!, {
        consentAccepted: consent,
        // Identifier is only required for TELECOM rooms (operator phone/account).
        ...(r?.roomType === "TELECOM"
          ? {
              identifierType: identifier.trim().startsWith("+") ? "PHONE" : "ACCOUNT",
              identifierValue: identifier.trim(),
            }
          : {}),
      }),
    onSuccess: (mem) => {
      qc.invalidateQueries({ queryKey: ["rooms"] });
      qc.invalidateQueries({ queryKey: ["rooms", id, "membership", "me"] });
      toast.success("Application submitted");
      setJoinOpen(false);
      navigate("/payment/room", {
        state: {
          roomMemberId: String(mem.id),
          roomId: String(r?.id),
          // Backend charges exactly pricePerMember; platform commission is taken from the owner's payout.
          amount: Number(r?.pricePerMember),
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
  const members = membersQuery.data?.items ?? [];
  // Prefer backend-computed seat counts (visible to everyone); fall back to the
  // owner-scoped members list (PENDING + ACTIVE occupy a seat).
  const filled = r.filledSeats ?? members.filter((m) => m.status === "PENDING" || m.status === "ACTIVE").length;
  const free = r.freeSeats ?? Math.max(0, r.maxMembers - filled);
  const isFull = free <= 0;
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

          {/* What you're buying + what happens after payment */}
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>What you're buying</h3>
            <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              One seat in a shared <strong>{r.serviceName ?? "subscription"}</strong>
              {r.tariffNameSnapshot ? <> ({r.tariffNameSnapshot})</> : null}. You pay{" "}
              <strong style={{ color: "var(--eco-primary)" }}>₸{Number(r.pricePerMember).toLocaleString()}{PERIOD_SUFFIX[r.periodType ?? "MONTHLY"]}</strong>
              {r.startDate ? <>, first charge around <strong>{r.startDate.slice(0, 10)}</strong></> : null}.
            </p>
            <ol className="flex flex-col gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              <li className="flex gap-2"><span style={{ color: "var(--eco-primary)" }}>1.</span> You pay your share now — held until access is confirmed.</li>
              <li className="flex gap-2"><span style={{ color: "var(--eco-primary)" }}>2.</span> The owner grants access{r.accessType ? <> via <strong>{ACCESS_TYPE_LABELS[r.accessType].toLowerCase()}</strong></> : null}{r.accessGrantSlaHours != null ? <> within <strong>{r.accessGrantSlaHours}h</strong></> : null}.</li>
              <li className="flex gap-2"><span style={{ color: "var(--eco-primary)" }}>3.</span> You confirm you received access — your membership becomes <strong>ACTIVE</strong>.</li>
              <li className="flex gap-2"><span style={{ color: "var(--eco-primary)" }}>4.</span> If access isn't delivered, you can open a dispute for a refund.</li>
            </ol>
          </Card>

          {/* Access & provider rules */}
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Access & rules</h3>
            <div className="flex flex-col gap-2 text-[13px]">
              {r.accessType && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--eco-text-secondary)" }}>How you'll get access</span>
                  <span style={{ color: "var(--eco-text)" }}>{ACCESS_TYPE_LABELS[r.accessType]}</span>
                </div>
              )}
              {r.accessGrantSlaHours != null && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--eco-text-secondary)" }}>Owner grants access within</span>
                  <span style={{ color: "var(--eco-text)" }}>{r.accessGrantSlaHours}h after payment</span>
                </div>
              )}
              {r.regionRestriction && (
                <div className="flex justify-between">
                  <span style={{ color: "var(--eco-text-secondary)" }}>Region</span>
                  <span style={{ color: "var(--eco-text)" }}>Only {r.regionRestriction}</span>
                </div>
              )}
              {r.requiresEmailForInvite && (
                <div className="flex items-center gap-1.5" style={{ color: "var(--eco-text-secondary)" }}>
                  <Check size={13} style={{ color: "var(--eco-positive)" }} /> Your email is required for the invite
                </div>
              )}
              {r.emailChangeForbidden && (
                <div className="flex items-center gap-1.5" style={{ color: "var(--eco-text-secondary)" }}>
                  <AlertTriangle size={13} style={{ color: "var(--eco-warning)" }} /> Email cannot be changed after connecting
                </div>
              )}
            </div>
            {r.operatorRestrictions && (
              <div className="p-3 rounded-lg flex items-start gap-2 text-[12px]" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
                <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
                {r.operatorRestrictions}
              </div>
            )}
          </Card>

          {/* Refund & risks */}
          <Card className="flex flex-col gap-3">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>Refund & protection</h3>
            <div className="flex items-start gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              <Shield size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-positive)" }} />
              Your payment is protected: if the owner doesn't grant access in time, you can open a dispute and get refunded.
            </div>
            {r.cancellationPolicy && (
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                <span style={{ color: "var(--eco-text-tertiary)" }}>Cancellation policy: </span>{r.cancellationPolicy}
              </div>
            )}
            <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <AlertTriangle size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
              Risks: access depends on the owner keeping the plan active. Sharing some services may be limited by the provider's terms — review the rules above before joining.
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
              {!membersQuery.isLoading && members.length === 0 && (
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  No members yet.
                </div>
              )}
              {members.map((m) => (
                <OwnerMemberRow key={m.id} roomId={id!} roomType={r.roomType} member={m} />
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
            {r.ownerVerified ? (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-positive)" }}>
                <Shield size={13} /> Verified owner
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <Shield size={13} /> Not verified
              </div>
            )}
            {r.ownerRating != null ? (
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                <Star size={13} style={{ color: "var(--eco-warning)", fill: "var(--eco-warning)" }} />
                {r.ownerRating.toFixed(1)}
                {r.ownerReviewCount ? ` · ${r.ownerReviewCount} review${r.ownerReviewCount === 1 ? "" : "s"}` : ""}
              </div>
            ) : (
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>No reviews yet</div>
            )}
          </Card>

          {!isOwner && !myMember && (
            <Card className="flex flex-col gap-3">
              <div className="text-[20px]" style={{ color: "var(--eco-primary)" }}>
                ₸{Number(r.pricePerMember).toLocaleString()}
                <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{PERIOD_SUFFIX[r.periodType ?? "MONTHLY"]}</span>
              </div>
              {r.status === "OPEN" && !isFull && (
                <>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{free} of {r.maxMembers} seats free</div>
                  <Button variant="primary" size="lg" onClick={() => { setJoinOpen(true); setJoinStep(0); }}>
                    Join Room
                  </Button>
                </>
              )}
              {r.status === "OPEN" && isFull && (
                <>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>All seats are taken.</div>
                  <Button variant="secondary" size="lg" disabled>Room full</Button>
                </>
              )}
              {r.status !== "OPEN" && (
                <>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>This room is not accepting new members.</div>
                  <Button variant="secondary" size="lg" disabled>Not available</Button>
                </>
              )}
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
                      amount: Number(r.pricePerMember),
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
              {r.roomType === "TELECOM" && (
                <Input
                  label="Identifier (phone or account)"
                  placeholder="+7 (707) 123-45-67 or account"
                  value={identifier}
                  onChange={(e: any) => setIdentifier(e.target.value)}
                />
              )}
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                  {r.roomType === "TELECOM"
                    ? "I consent to sharing my identifier with the room owner after successful payment."
                    : "I accept the room terms and agree to pay my monthly share."}
                </span>
              </label>
              <Button
                variant="primary"
                disabled={!consent || (r.roomType === "TELECOM" && !identifier)}
                onClick={() => setJoinStep(1)}
              >
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
                <div className="border-t pt-2 flex justify-between text-[14px]">
                  <span>Due now</span>
                  <span style={{ color: "var(--eco-primary)" }}>
                    ₸{Number(r.pricePerMember).toLocaleString()}
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

function OwnerMemberRow({ roomId, roomType, member }: { roomId: string; roomType: string; member: any }) {
  const qc = useQueryClient();
  const [revealed, setRevealed] = useState<string | null>(null);

  const revealMutation = useMutation({
    mutationFn: () => roomMembersApi.revealIdentifier(roomId, member.id, { reason: "Owner setup" }),
    onSuccess: (data) => {
      setRevealed(data?.identifierValue ?? "");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to reveal";
      toast.error(msg);
    },
  });

  const grantMutation = useMutation({
    mutationFn: () => roomMembersApi.ownerAccess(roomId, member.id, {
      accessMethod: roomType === "TELECOM" ? "family_plan_add" : "invite_link",
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", roomId, "members"] });
      toast.success("Access marked as granted");
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiError ? err.message : "Failed to grant";
      toast.error(msg);
    },
  });

  // Identifier reveal is TELECOM-only on the backend.
  const canReveal = roomType === "TELECOM" && (member.status === "PENDING" || member.status === "ACTIVE");
  const canGrant = member.status === "PENDING" && !member.ownerAccessConfirmedAt;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>
            {member.userDisplayName ?? `Member #${member.id}`}
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
