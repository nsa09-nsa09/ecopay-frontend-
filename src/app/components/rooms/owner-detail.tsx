import { useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, Button, Badge, MemberStatusBadge, RoomStatusBadge, Modal, SkeletonCard, EmptyState } from "../ds-primitives";
import { ArrowLeft, Eye, Shield, CheckCircle2, Lock, Users, Calendar, Clock } from "lucide-react";
import { roomsApi, roomMembersApi } from "../../../lib/api/rooms";
import type { RoomMemberDto } from "../../../lib/api/types";

export function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();

  const [revealTarget, setRevealTarget] = useState<RoomMemberDto | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [revealedIds, setRevealedIds] = useState<Record<string, string>>({});

  const [grantTarget, setGrantTarget] = useState<RoomMemberDto | null>(null);
  const [grantIdentifier, setGrantIdentifier] = useState("");
  const [grantNote, setGrantNote] = useState("");
  const [grantChecklist, setGrantChecklist] = useState<Record<string, boolean>>({});

  const roomQ = useQuery({
    queryKey: ["rooms", id],
    queryFn: () => roomsApi.get(id!),
    enabled: !!id,
  });

  const membersQ = useQuery({
    queryKey: ["rooms", id, "members"],
    queryFn: () => roomMembersApi.list(id!),
    enabled: !!id,
  });

  const revealMutation = useMutation({
    mutationFn: (memberId: string) =>
      roomMembersApi.revealIdentifier(id!, memberId, { reason: revealReason }),
    onSuccess: (data, memberId) => {
      setRevealedIds((prev) => ({ ...prev, [memberId]: data.identifier }));
      setRevealTarget(null);
      setRevealReason("");
    },
  });

  const grantMutation = useMutation({
    mutationFn: (memberId: string) =>
      roomMembersApi.ownerAccess(id!, memberId, {
        identifier: grantIdentifier,
        note: grantNote || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["rooms", id, "members"] });
      qc.invalidateQueries({ queryKey: ["rooms", id] });
      setGrantTarget(null);
      setGrantIdentifier("");
      setGrantNote("");
      setGrantChecklist({});
    },
  });

  if (!id) return null;

  if (roomQ.isLoading || membersQ.isLoading) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-8 flex flex-col gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (roomQ.isError || !roomQ.data) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <EmptyState title="Room unavailable" description="We couldn't load this room." />
        <div className="text-center mt-4">
          <Button variant="secondary" size="md" onClick={() => roomQ.refetch()}>Retry</Button>
        </div>
      </div>
    );
  }

  const room = roomQ.data;
  const members = membersQ.data ?? [];
  const isLocked = !!room.startDate && new Date(room.startDate) <= new Date();

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>{room.name}</h1>
          <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            {room.operator || room.serviceName} · Owner view
          </div>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Participants</h3>
              <Badge variant="info">{members.length} / {room.seats} members</Badge>
            </div>

            {members.length === 0 ? (
              <EmptyState title="No members yet" description="When users apply to your room, they'll appear here." />
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((p) => {
                  const isPaid = p.paymentStatus === "PAID" || p.paymentStatus === "REFUNDED";
                  const isGranted = p.status === "CONFIRMED";
                  const revealedFull = revealedIds[p.id];
                  return (
                    <div key={p.id} className="p-4 rounded-lg flex flex-col gap-3" style={{ background: "var(--eco-surface)" }}>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
                            {(p.displayName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{p.displayName || `Member ${p.id.slice(0, 6)}`}</span>
                          <MemberStatusBadge status={p.status} />
                        </div>
                        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                          {p.joinedAt ? `Applied ${new Date(p.joinedAt).toLocaleDateString()}` : ""}
                        </span>
                      </div>

                      {isPaid ? (
                        <div className="flex items-center gap-2 text-[13px]">
                          <Shield size={13} style={{ color: "var(--eco-primary)" }} />
                          <span style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                            ID: {revealedFull || "Hidden — click reveal"}
                          </span>
                          {!revealedFull && (
                            <button
                              className="cursor-pointer p-1 rounded hover:bg-black/5"
                              onClick={() => setRevealTarget(p)}
                              title="Reveal full identifier"
                              style={{ background: "transparent", border: "none" }}
                            >
                              <Eye size={14} style={{ color: "var(--eco-primary)" }} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-[13px] flex items-center gap-1.5" style={{ color: "var(--eco-text-tertiary)" }}>
                          <Shield size={13} /> Hidden until payment success
                        </div>
                      )}

                      <div className="text-[12px]" style={{ color: isPaid ? "var(--eco-positive)" : "var(--eco-text-tertiary)" }}>
                        Payment: {p.paymentStatus || "NONE"}
                      </div>

                      {isPaid && !isGranted && (
                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="primary" size="sm" onClick={() => {
                            setGrantTarget(p);
                            setGrantIdentifier(revealedFull || "");
                          }}>
                            Mark Access Granted
                          </Button>
                        </div>
                      )}

                      {isGranted && (
                        <div className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--eco-positive)" }}>
                          <CheckCircle2 size={13} />
                          Access granted
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock size={15} style={{ color: isLocked ? "var(--eco-warning)" : "var(--eco-text-tertiary)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Room Rules</h3>
            </div>
            {isLocked && (
              <div className="p-3 rounded-lg text-[12px] flex items-start gap-2" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
                <Lock size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
                Fields locked since start_date has passed.
              </div>
            )}
            {[
              { label: "Operator", value: room.operator || "—" },
              { label: "Plan", value: room.serviceName || "—" },
              { label: "Seats", value: `${room.seats}` },
              { label: "Price / member", value: `${room.currency || "₸"}${room.pricePerMember.toLocaleString()}/mo` },
              { label: "Start date", value: room.startDate ? new Date(room.startDate).toLocaleDateString() : "—" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Filled", value: `${room.filled}/${room.seats}`, icon: Users },
                { label: "Start", value: room.startDate ? new Date(room.startDate).toLocaleDateString() : "—", icon: Calendar },
                { label: "Revenue", value: `${room.currency || "₸"}${(room.pricePerMember * room.filled).toLocaleString()}`, icon: CheckCircle2 },
                { label: "Pending", value: `${members.filter((p) => p.status === "PENDING").length}`, icon: Clock },
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

      <Modal
        open={!!revealTarget}
        onClose={() => { setRevealTarget(null); setRevealReason(""); }}
        title="View Full Identifier"
      >
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
          {revealMutation.isError && (
            <div className="text-[12px]" style={{ color: "var(--eco-negative)" }}>Failed to reveal. Try again.</div>
          )}
          <Button
            variant="primary"
            disabled={!revealReason.trim() || revealMutation.isPending}
            loading={revealMutation.isPending}
            onClick={() => revealTarget && revealMutation.mutate(revealTarget.id)}
          >
            Reveal Identifier
          </Button>
        </div>
      </Modal>

      <Modal
        open={!!grantTarget}
        onClose={() => {
          setGrantTarget(null);
          setGrantChecklist({});
          setGrantIdentifier("");
          setGrantNote("");
        }}
        title="Grant Access"
      >
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Confirm that you have provided access to this member. This action is logged.
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>Member identifier</label>
            <input
              className="px-3 py-2 rounded-lg outline-none text-[14px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              placeholder="e.g., +7 (707) 234-56-45"
              value={grantIdentifier}
              onChange={(e) => setGrantIdentifier(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>Note (optional)</label>
            <input
              className="px-3 py-2 rounded-lg outline-none text-[14px]"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              placeholder="e.g., eSIM activation completed"
              value={grantNote}
              onChange={(e) => setGrantNote(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            {[
              { key: "method", label: "Access provided via the agreed method" },
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

          {grantMutation.isError && (
            <div className="text-[12px]" style={{ color: "var(--eco-negative)" }}>Failed to mark access granted. Try again.</div>
          )}

          <Button
            variant="primary"
            disabled={
              !grantIdentifier.trim() ||
              !grantChecklist.method ||
              !grantChecklist.activated ||
              !grantChecklist.confirmed ||
              grantMutation.isPending
            }
            loading={grantMutation.isPending}
            onClick={() => grantTarget && grantMutation.mutate(grantTarget.id)}
          >
            Confirm Access Granted
          </Button>
        </div>
      </Modal>
    </div>
  );
}
