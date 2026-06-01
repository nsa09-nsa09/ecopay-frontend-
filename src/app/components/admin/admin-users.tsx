import { useState } from "react";
import { Card, Button, Badge, Modal } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { Ban, ShieldCheck, Eye, EyeOff, Shield, Star, Home, MessageSquare, AlertTriangle } from "lucide-react";

type AdminUser = {
  id: string; name: string; email: string; joined: string; banned: boolean;
  riskScore: number; rating: number; roomsOwned: number; roomsJoined: number;
  tickets: number; disputes: number; identifierMasked: string; identifierFull: string;
};

const users: AdminUser[] = [
  { id: "U-1001", name: "Aidar K.", email: "a***@mail.kz", joined: "Jan 2026", banned: false, riskScore: 15, rating: 4.8, roomsOwned: 5, roomsJoined: 2, tickets: 1, disputes: 0, identifierMasked: "+7 7** *** ** 45", identifierFull: "+7 (707) 234-56-45" },
  { id: "U-1002", name: "Dana M.", email: "d***@gmail.com", joined: "Feb 2026", banned: false, riskScore: 22, rating: 4.5, roomsOwned: 0, roomsJoined: 4, tickets: 2, disputes: 0, identifierMasked: "+7 7** *** ** 89", identifierFull: "+7 (771) 987-65-89" },
  { id: "U-1003", name: "Timur B.", email: "t***@inbox.kz", joined: "Mar 2026", banned: false, riskScore: 58, rating: 3.2, roomsOwned: 1, roomsJoined: 6, tickets: 4, disputes: 1, identifierMasked: "+7 7** *** ** 12", identifierFull: "+7 (702) 555-12-12" },
  { id: "U-1004", name: "Saule R.", email: "s***@mail.ru", joined: "Jan 2026", banned: true, riskScore: 89, rating: 1.5, roomsOwned: 2, roomsJoined: 0, tickets: 8, disputes: 3, identifierMasked: "+7 7** *** ** 67", identifierFull: "+7 (777) 111-22-67" },
];

export function AdminUsersPage() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [banModal, setBanModal] = useState<{ user: AdminUser; action: "BAN" | "UNBAN" } | null>(null);
  const [banReason, setBanReason] = useState("");
  const [localBans, setLocalBans] = useState<Record<string, boolean>>({});
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [revealTarget, setRevealTarget] = useState<string | null>(null);
  const [revealReason, setRevealReason] = useState("");

  const isBanned = (u: AdminUser) => localBans[u.id] ?? u.banned;

  const handleBan = () => {
    if (!banModal || !banReason.trim()) return;
    setLocalBans({ ...localBans, [banModal.user.id]: banModal.action === "BAN" });
    setBanModal(null);
    setBanReason("");
  };

  const handleReveal = (id: string) => {
    if (revealedId === id) { setRevealedId(null); return; }
    setRevealTarget(id);
  };
  const confirmReveal = () => {
    if (revealTarget && revealReason.trim()) { setRevealedId(revealTarget); setRevealTarget(null); setRevealReason(""); }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>{t("users")}</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* List */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {users.map((u) => {
              const banned = isBanned(u);
              return (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className="text-left p-4 rounded-xl cursor-pointer transition-all"
                  style={{
                    background: selected?.id === u.id ? "var(--eco-brand-50)" : "var(--eco-surface-raised)",
                    border: `1px solid ${selected?.id === u.id ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{u.id}</span>
                    {banned && <Badge variant="danger">{t("bannedBadge")}</Badge>}
                  </div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{u.name}</div>
                  <div className="flex items-center gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    <span className="flex items-center gap-0.5" style={{ color: "var(--eco-warning-500)" }}><Star size={10} fill="currentColor" /> {u.rating}</span>
                    · Risk: <span style={{ color: u.riskScore >= 70 ? "var(--eco-negative)" : u.riskScore >= 40 ? "var(--eco-warning)" : "var(--eco-positive)" }}>{u.riskScore}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detail */}
          <div className="lg:col-span-2">
            {!selected ? (
              <Card className="flex items-center justify-center py-16 text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("selectUserToView")}</Card>
            ) : (
              <div className="flex flex-col gap-4">
                <Card className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-[14px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
                        {selected.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{selected.name}</div>
                        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{selected.id} · {selected.email} · {t("sinceLabel")} {selected.joined}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isBanned(selected) && <Badge variant="danger">{t("bannedBadge")}</Badge>}
                      <span className="text-[13px] px-2 py-0.5 rounded" style={{
                        background: selected.riskScore >= 70 ? "var(--eco-danger-100)" : selected.riskScore >= 40 ? "var(--eco-warning-100)" : "var(--eco-success-100)",
                        color: selected.riskScore >= 70 ? "var(--eco-danger-500)" : selected.riskScore >= 40 ? "var(--eco-warning-500)" : "var(--eco-success-500)",
                      }}>Risk: {selected.riskScore}</span>
                    </div>
                  </div>

                  {/* Reputation summary */}
                  <div className="grid grid-cols-5 gap-3">
                    {[
                      { label: t("rating"), value: `${selected.rating}`, icon: Star },
                      { label: t("owned"), value: `${selected.roomsOwned}`, icon: Home },
                      { label: t("joinedCount"), value: `${selected.roomsJoined}`, icon: Home },
                      { label: t("tickets"), value: `${selected.tickets}`, icon: MessageSquare },
                      { label: t("disputes"), value: `${selected.disputes}`, icon: AlertTriangle },
                    ].map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="p-2.5 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                          <div className="flex items-center gap-1.5 text-[11px] mb-0.5" style={{ color: "var(--eco-text-tertiary)" }}><Icon size={11} /> {s.label}</div>
                          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{s.value}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Identifier */}
                  <div className="flex items-center gap-2 text-[12px] pt-3 border-t" style={{ borderColor: "var(--eco-border)" }}>
                    <Shield size={12} style={{ color: "var(--eco-text-tertiary)" }} />
                    <span style={{ color: "var(--eco-text-secondary)", fontFamily: "monospace" }}>
                      {revealedId === selected.id ? selected.identifierFull : selected.identifierMasked}
                    </span>
                    <button className="cursor-pointer p-0.5" onClick={() => handleReveal(selected.id)} style={{ background: "transparent", border: "none" }}>
                      {revealedId === selected.id ? <EyeOff size={12} style={{ color: "var(--eco-text-tertiary)" }} /> : <Eye size={12} style={{ color: "var(--eco-primary)" }} />}
                    </button>
                    {revealedId !== selected.id && <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("reasonRequiredAuditLogged")}</span>}
                  </div>

                  {/* Ban/Unban */}
                  <div className="flex gap-2">
                    {!isBanned(selected) ? (
                      <Button variant="destructive" size="sm" onClick={() => setBanModal({ user: selected, action: "BAN" })}>
                        <Ban size={13} /> {t("banUser")}
                      </Button>
                    ) : (
                      <Button variant="primary" size="sm" onClick={() => setBanModal({ user: selected, action: "UNBAN" })}>
                        <ShieldCheck size={13} /> {t("unbanUser")}
                      </Button>
                    )}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Ban modal */}
        <Modal open={!!banModal} onClose={() => { setBanModal(null); setBanReason(""); }} title={banModal ? (banModal.action === "BAN" ? t("banUser") : t("unbanUser")) : ""}>
          {banModal && (
            <div className="flex flex-col gap-4">
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {banModal.action === "BAN" ? t("banUserConfirm") : t("unbanUserConfirm")}
              </div>
              <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)" }}>{banModal.user.id} — {banModal.user.name}</div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>{t("reason")} <span style={{ color: "var(--eco-negative)" }}>*</span></label>
                <textarea rows={3} value={banReason} onChange={(e) => setBanReason(e.target.value)} placeholder={t("mandatoryAuditLogged")} className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }} />
              </div>
              <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}><Shield size={11} /> {t("auditLoggedShort")}</div>
              <Button variant={banModal.action === "BAN" ? "destructive" : "primary"} disabled={!banReason.trim()} onClick={handleBan}>{banModal.action === "BAN" ? t("banUser") : t("unbanUser")}</Button>
            </div>
          )}
        </Modal>

        <Modal open={!!revealTarget && revealedId !== revealTarget} onClose={() => setRevealTarget(null)} title={t("revealIdentifier")}>
          <div className="flex flex-col gap-4">
            <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{t("provideReasonAuditLoggedShort")}</div>
            <input className="px-3 py-2 rounded-lg outline-none text-[13px]" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }} placeholder={t("reasonPlaceholder")} value={revealReason} onChange={(e) => setRevealReason(e.target.value)} />
            <Button variant="primary" disabled={!revealReason.trim()} onClick={confirmReveal}>{t("reveal")}</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
