import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Card, Button, Badge, MemberStatusBadge, RoomStatusBadge, Modal, Select } from "../ds-primitives";
import { ArrowLeft, Eye, Shield, CheckCircle2, Lock, Users, Calendar, Clock } from "lucide-react";
import {
  ApiError,
  confirmOwnerAccessRequest,
  getRoom,
  getRoomMembers,
  revealIdentifierRequest,
  type RoomMemberDto,
  type RoomResponseDto,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";

const moneyFormatter = new Intl.NumberFormat("ru-RU");
const formatMoney = (v: number | null | undefined) => `₸${moneyFormatter.format(Number(v ?? 0))}`;
const formatDate = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString() : "TBD");
const formatDateTime = (v: string | null | undefined) => (v ? new Date(v).toLocaleString() : null);

const ACCESS_METHOD_OPTIONS = [
  { value: "esim", label: "eSIM activation" },
  { value: "sim", label: "Physical SIM card" },
  { value: "family_plan_add", label: "Added to family plan" },
  { value: "invite_link", label: "Invite link" },
  { value: "email_invite", label: "Email invite" },
];

// A member occupies a slot / is post-payment once PENDING or ACTIVE.
const POST_PAYMENT = new Set(["PENDING", "ACTIVE"]);

export function OwnerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const roomId = Number(id);
  const { authorizedRequest } = useAuth();

  const [room, setRoom] = useState<RoomResponseDto | null>(null);
  const [members, setMembers] = useState<RoomMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reveal identifier flow
  const [revealTarget, setRevealTarget] = useState<RoomMemberDto | null>(null);
  const [revealReason, setRevealReason] = useState("");
  const [revealedValues, setRevealedValues] = useState<Record<number, string>>({});
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealing, setRevealing] = useState(false);

  // Grant access flow
  const [grantTarget, setGrantTarget] = useState<RoomMemberDto | null>(null);
  const [grantMethod, setGrantMethod] = useState("esim");
  const [grantChecklist, setGrantChecklist] = useState<Record<string, boolean>>({});
  const [grantError, setGrantError] = useState<string | null>(null);
  const [granting, setGranting] = useState(false);

  const loadMembers = useCallback(async () => {
    const result = await authorizedRequest((token) => getRoomMembers(roomId, token, { size: 100 }));
    setMembers(result.items);
  }, [authorizedRequest, roomId]);

  useEffect(() => {
    if (!roomId) {
      setError("Room not found.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);

    Promise.all([getRoom(roomId), authorizedRequest((token) => getRoomMembers(roomId, token, { size: 100 }))])
      .then(([roomResponse, membersResponse]) => {
        if (cancelled) return;
        setRoom(roomResponse);
        setMembers(membersResponse.items);
      })
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 403) {
          setError("You are not the owner of this room.");
        } else {
          setError("Unable to load this room right now.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [roomId, authorizedRequest]);

  const confirmReveal = async () => {
    if (!revealTarget || !revealReason.trim()) return;
    setRevealing(true);
    setRevealError(null);
    try {
      const result = await authorizedRequest((token) =>
        revealIdentifierRequest(roomId, revealTarget.id, { reason: revealReason.trim() }, token),
      );
      setRevealedValues((prev) => ({ ...prev, [revealTarget.id]: result.identifierValue }));
      setRevealTarget(null);
      setRevealReason("");
    } catch (err) {
      setRevealError(err instanceof ApiError ? err.message : "Unable to reveal the identifier.");
    } finally {
      setRevealing(false);
    }
  };

  const confirmGrant = async () => {
    if (!grantTarget) return;
    setGranting(true);
    setGrantError(null);
    try {
      await authorizedRequest((token) =>
        confirmOwnerAccessRequest(roomId, grantTarget.id, grantMethod, token),
      );
      await loadMembers();
      setGrantTarget(null);
      setGrantChecklist({});
    } catch (err) {
      setGrantError(err instanceof ApiError ? err.message : "Unable to confirm access.");
    } finally {
      setGranting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-8"><Card>Loading room...</Card></div>
    );
  }

  if (error || !room) {
    return (
      <div className="max-w-[1000px] mx-auto px-6 py-8">
        <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> My Rooms
        </Link>
        <Card><span style={{ color: "var(--eco-negative)" }}>{error ?? "Room not found."}</span></Card>
      </div>
    );
  }

  const isTelecom = room.roomType === "TELECOM";
  const isLocked = room.startDate ? new Date(room.startDate) <= new Date() : false;
  const occupied = members.filter((m) => POST_PAYMENT.has(m.status)).length;
  const pendingCount = members.filter((m) => m.status === "PENDING").length;
  const revenue = occupied * Number(room.pricePerMember ?? 0);

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> My Rooms
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-[26px] mb-1" style={{ color: "var(--eco-text)" }}>{room.title}</h1>
          <div className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>
            {room.providerName} · Owner view
          </div>
        </div>
        <RoomStatusBadge status={room.status} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: participants */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Participants</h3>
              <Badge variant="info">{occupied} / {room.maxMembers} members</Badge>
            </div>

            {members.length === 0 ? (
              <div className="text-[13px] py-4 text-center" style={{ color: "var(--eco-text-tertiary)" }}>
                No applications yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {members.map((p) => {
                  const postPayment = POST_PAYMENT.has(p.status);
                  const granted = !!p.ownerAccessConfirmedAt;
                  const revealed = revealedValues[p.id];
                  return (
                    <div key={p.id} className="p-4 rounded-lg flex flex-col gap-3" style={{ background: "var(--eco-surface)" }}>
                      {/* Row 1: name + status */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px]" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
                            {(p.userDisplayName || "?").charAt(0).toUpperCase()}
                          </div>
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{p.userDisplayName}</span>
                          <MemberStatusBadge status={p.status} />
                          {p.requiresAdminReview && <Badge variant="warning">Review</Badge>}
                        </div>
                        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>Applied {formatDate(p.createdAt)}</span>
                      </div>

                      {/* Row 2: Identifier (telecom only, post-payment) */}
                      {isTelecom && (
                        postPayment ? (
                          <div className="flex items-center gap-2 text-[13px]">
                            <Shield size={13} style={{ color: "var(--eco-primary)" }} />
                            {revealed ? (
                              <span style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>ID: {revealed}</span>
                            ) : (
                              <button
                                className="cursor-pointer inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-black/5"
                                onClick={() => { setRevealTarget(p); setRevealReason(""); setRevealError(null); }}
                                title="Reveal full identifier (logged)"
                              >
                                <Eye size={14} style={{ color: "var(--eco-primary)" }} />
                                <span style={{ color: "var(--eco-primary)" }}>Reveal identifier</span>
                                <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Reason required</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="text-[13px] flex items-center gap-1.5" style={{ color: "var(--eco-text-tertiary)" }}>
                            <Shield size={13} /> Hidden until payment success
                          </div>
                        )
                      )}

                      {/* Row 3: Payment state */}
                      <div className="text-[12px]" style={{ color: postPayment ? "var(--eco-positive)" : "var(--eco-text-tertiary)" }}>
                        {postPayment ? "Payment confirmed" : "Awaiting payment"}
                      </div>

                      {/* Row 4: Grant action */}
                      {p.status === "PENDING" && !granted && (
                        <div className="flex items-center gap-2 pt-1">
                          <Button variant="primary" size="sm" onClick={() => { setGrantTarget(p); setGrantChecklist({}); setGrantError(null); }}>
                            Mark Access Granted
                          </Button>
                        </div>
                      )}

                      {/* Access granted info */}
                      {granted && (
                        <div className="text-[12px] flex items-center gap-1.5" style={{ color: "var(--eco-positive)" }}>
                          <CheckCircle2 size={13} />
                          Access granted {formatDateTime(p.ownerAccessConfirmedAt)}
                          {p.accessMethod ? ` via ${p.accessMethod}` : ""}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock size={15} style={{ color: isLocked ? "var(--eco-warning)" : "var(--eco-text-tertiary)" }} />
              <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Room Rules</h3>
            </div>
            {isLocked && (
              <div className="p-3 rounded-lg text-[12px] flex items-start gap-2" style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}>
                <Lock size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
                Fields locked since start date ({formatDate(room.startDate)}) has passed.
              </div>
            )}
            {[
              { label: "Operator", value: room.providerName ?? "—" },
              { label: "Plan", value: room.tariffNameSnapshot ?? "Custom" },
              { label: "Seats", value: `${room.maxMembers}` },
              { label: "Price / member", value: `${formatMoney(room.pricePerMember)}/${(room.periodType ?? "").toLowerCase()}` },
              { label: "Start date", value: formatDate(room.startDate) },
              ...(isTelecom ? [{ label: "Access method", value: room.connectionType ?? "—" }] : []),
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
              Verification mode is determined automatically by the backend and cannot be changed.
            </div>
          </Card>

          <Card className="flex flex-col gap-3">
            <h3 className="text-[15px]" style={{ color: "var(--eco-text)" }}>Quick Stats</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Filled", value: `${occupied}/${room.maxMembers}`, icon: Users },
                { label: "Start", value: formatDate(room.startDate), icon: Calendar },
                { label: "Revenue", value: formatMoney(revenue), icon: CheckCircle2 },
                { label: "Pending", value: `${pendingCount}`, icon: Clock },
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
      <Modal open={!!revealTarget} onClose={() => setRevealTarget(null)} title="Reveal Full Identifier">
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Provide a reason for viewing {revealTarget?.userDisplayName}'s full telecom identifier. This action is logged for security.
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
          {revealError && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{revealError}</p>}
          <Button variant="primary" disabled={!revealReason.trim()} loading={revealing} onClick={confirmReveal}>
            Reveal Identifier
          </Button>
        </div>
      </Modal>

      {/* Grant access modal */}
      <Modal open={!!grantTarget} onClose={() => { setGrantTarget(null); setGrantChecklist({}); }} title="Grant Access">
        <div className="flex flex-col gap-4">
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Confirm that you have provided access to {grantTarget?.userDisplayName}. Complete the checklist below.
          </div>

          <Select
            label="Access method used"
            options={ACCESS_METHOD_OPTIONS}
            value={grantMethod}
            onChange={(e) => setGrantMethod(e.target.value)}
          />

          <div className="flex flex-col gap-2">
            {[
              { key: "method", label: "Access has been provided via the selected method" },
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

          {grantError && <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{grantError}</p>}

          <Button
            variant="primary"
            disabled={!grantChecklist.method || !grantChecklist.activated || !grantChecklist.confirmed}
            loading={granting}
            onClick={confirmGrant}
          >
            Confirm Access Granted
          </Button>
        </div>
      </Modal>
    </div>
  );
}
