import { useState, useEffect } from "react";
import { useI18n } from "../i18n-provider";
import { Badge, Button } from "../ds-primitives";
import {
  Bell, BellOff, Check, CheckCheck, ChevronRight, Clock, CreditCard,
  DoorOpen, ExternalLink, Filter, Flag, Inbox, Loader2, Mail,
  MessageSquare, MoreHorizontal, RefreshCw, Scale, Shield, ShieldAlert,
  ShieldCheck, Smartphone, Unlock, User, UserMinus, UserPlus, XCircle,
  Zap, Activity, ArrowRight,
} from "lucide-react";

/* ─── Types ─── */
type NotifCategory = "rooms" | "payments" | "support" | "security";
interface Notif {
  id: string;
  titleKey: string;
  bodyKey: string;
  category: NotifCategory;
  time: string;
  read: boolean;
  ctaKey: string;
  ctaLink: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

/* ─── Shared ─── */
function SC({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl p-6 ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>;
}
function SL({ children }: { children: string }) {
  return <div className="text-[11px] mb-3 tracking-wide" style={{ color: "var(--eco-text-tertiary)" }}>{children}</div>;
}

/* ─── Mock data ─── */
function useNotifications(): Notif[] {
  return [
    { id: "n1", titleKey: "notifUserJoinedRoom", bodyKey: "notifUserJoinedRoomBody", category: "rooms", time: "2m", read: false, ctaKey: "viewRoom", ctaLink: "/room/rm-0412", icon: UserPlus, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)" },
    { id: "n2", titleKey: "notifPaymentReceived", bodyKey: "notifPaymentReceivedBody", category: "payments", time: "15m", read: false, ctaKey: "viewPayment", ctaLink: "/payment/confirmation", icon: CreditCard, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)" },
    { id: "n3", titleKey: "notifAccessGranted", bodyKey: "notifAccessGrantedBody", category: "rooms", time: "1h", read: false, ctaKey: "viewRoom", ctaLink: "/room/rm-0399", icon: Unlock, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)" },
    { id: "n4", titleKey: "notifDisputeCreated", bodyKey: "notifDisputeCreatedBody", category: "support", time: "3h", read: true, ctaKey: "viewDispute", ctaLink: "/disputes-flows", icon: Scale, iconColor: "var(--eco-warning-500)", iconBg: "var(--eco-warning-100)" },
    { id: "n5", titleKey: "notifRoomStatusChanged", bodyKey: "notifRoomStatusChangedBody", category: "rooms", time: "5h", read: true, ctaKey: "viewRoom", ctaLink: "/room/rm-0377", icon: Activity, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)" },
    { id: "n6", titleKey: "notifMemberBanned", bodyKey: "notifMemberBannedBody", category: "security", time: "yesterday", read: true, ctaKey: "viewRoom", ctaLink: "/room/rm-0399", icon: ShieldAlert, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)" },
    { id: "n7", titleKey: "notifDisputeClosed", bodyKey: "notifDisputeClosedBody", category: "support", time: "yesterday", read: true, ctaKey: "viewDispute", ctaLink: "/disputes-flows", icon: CheckCheck, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)" },
    { id: "n8", titleKey: "notifRefundSent", bodyKey: "notifRefundSentBody", category: "payments", time: "2d", read: true, ctaKey: "viewPayment", ctaLink: "/payment/refund", icon: RefreshCw, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)" },
    { id: "n9", titleKey: "notifAccessConfirmed", bodyKey: "notifAccessConfirmedBody", category: "rooms", time: "2d", read: true, ctaKey: "viewRoom", ctaLink: "/room/rm-0412", icon: ShieldCheck, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)" },
    { id: "n10", titleKey: "notifMemberUnbanned", bodyKey: "notifMemberUnbannedBody", category: "security", time: "3d", read: true, ctaKey: "viewRoom", ctaLink: "/room/rm-0399", icon: UserPlus, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)" },
  ];
}

function timeLabel(time: string, t: (k: string) => string): string {
  if (time === "2m") return `2 ${t("minutesAgo")}`;
  if (time === "15m") return `15 ${t("minutesAgo")}`;
  if (time === "1h") return `1 ${t("hoursAgo")}`;
  if (time === "3h") return `3 ${t("hoursAgo")}`;
  if (time === "5h") return `5 ${t("hoursAgo")}`;
  if (time === "yesterday") return t("yesterday");
  if (time === "2d") return `2d`;
  if (time === "3d") return `3d`;
  return time;
}

const catIcons: Record<NotifCategory, React.ElementType> = {
  rooms: DoorOpen,
  payments: CreditCard,
  support: MessageSquare,
  security: Shield,
};
const catColorMap: Record<NotifCategory, { color: string; bg: string }> = {
  rooms: { color: "var(--eco-success-500)", bg: "var(--eco-success-100)" },
  payments: { color: "var(--eco-brand-600)", bg: "var(--eco-brand-50)" },
  support: { color: "var(--eco-warning-500)", bg: "var(--eco-warning-100)" },
  security: { color: "var(--eco-danger-500)", bg: "var(--eco-danger-100)" },
};

/* ─── Notification card (shared) ─── */
function NotifCard({ n, compact = false }: { n: Notif; compact?: boolean }) {
  const { t } = useI18n();
  return (
    <div
      className={`flex gap-3 rounded-xl px-4 ${compact ? "py-3" : "py-4"} transition-colors`}
      style={{
        background: n.read ? "transparent" : "var(--eco-brand-50)",
        border: `1px solid ${n.read ? "var(--eco-border)" : "var(--eco-brand-200)"}`,
      }}
    >
      {/* Icon */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ background: n.iconBg }}
      >
        <n.icon size={16} style={{ color: n.iconColor }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <span className={`text-[13px] ${!n.read ? "" : ""}`} style={{ color: "var(--eco-text)" }}>
            {t(n.titleKey)}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {!n.read && (
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: "var(--eco-primary)" }} />
            )}
            <span className="text-[11px] whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)" }}>
              {timeLabel(n.time, t)}
            </span>
          </div>
        </div>
        {!compact && (
          <p className="text-[12px] mt-1 leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
            {t(n.bodyKey)}
          </p>
        )}
        {!compact && (
          <button className="flex items-center gap-1 mt-2 text-[12px] cursor-pointer" style={{ color: "var(--eco-primary)" }}>
            {t(n.ctaKey)} <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Frame A: Notifications Dropdown
   ═══════════════════════════════════════════════════ */
function DropdownFrame() {
  const { t } = useI18n();
  const allNotifs = useNotifications();
  const unread = allNotifs.filter((n) => !n.read).length;
  const [open, setOpen] = useState(true);

  // Group by category
  const grouped: Record<string, Notif[]> = {};
  for (const n of allNotifs.slice(0, 6)) {
    const cat = n.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(n);
  }

  const catLabels: Record<string, string> = {
    rooms: t("catRooms"), payments: t("catPayments"), support: t("catSupport"), security: t("catSecurity"),
  };

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>A) {t("notifDropdown")}</h2>
      <p className="text-[13px] mb-5" style={{ color: "var(--eco-text-secondary)" }}>
        Top-nav bell icon → dropdown with grouped notifications
      </p>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Bell trigger */}
        <SC className="flex-shrink-0 w-full md:w-auto">
          <SL>BELL ICON — TOP NAV</SL>
          <div className="flex items-center gap-6">
            {/* Default */}
            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors"
                  style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}
                >
                  <Bell size={18} style={{ color: "var(--eco-text-secondary)" }} />
                </button>
                {unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{ background: "var(--eco-danger-500)", color: "#fff" }}>
                    {unread}
                  </span>
                )}
              </div>
              <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>Unread: {unread}</span>
            </div>
            {/* Read state */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                <Bell size={18} style={{ color: "var(--eco-text-tertiary)" }} />
              </div>
              <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>All read</span>
            </div>
            {/* Muted */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-neutral-100)", border: "1px solid var(--eco-border)" }}>
                <BellOff size={18} style={{ color: "var(--eco-text-tertiary)" }} />
              </div>
              <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>Muted</span>
            </div>
          </div>
        </SC>

        {/* Dropdown panel */}
        {open && (
          <div className="w-full max-w-[400px]">
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t("notificationsTitle")}</span>
                  {unread > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{ background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" }}>
                      {unread}
                    </span>
                  )}
                </div>
                <button className="text-[12px] cursor-pointer" style={{ color: "var(--eco-primary)" }}>
                  {t("markAllRead")}
                </button>
              </div>

              {/* Grouped items */}
              <div className="max-h-[420px] overflow-y-auto">
                {Object.entries(grouped).map(([cat, items]) => {
                  const catC = catColorMap[cat as NotifCategory];
                  const CatIcon = catIcons[cat as NotifCategory];
                  return (
                    <div key={cat}>
                      <div className="flex items-center gap-2 px-4 py-2" style={{ background: "var(--eco-surface)" }}>
                        <CatIcon size={12} style={{ color: catC.color }} />
                        <span className="text-[11px] tracking-wide" style={{ color: catC.color }}>
                          {catLabels[cat]?.toUpperCase()}
                        </span>
                        <span className="text-[10px] ml-auto" style={{ color: "var(--eco-text-tertiary)" }}>{items.length}</span>
                      </div>
                      <div className="px-2 py-1 flex flex-col gap-1">
                        {items.map((n) => (
                          <NotifCard key={n.id} n={n} compact />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer */}
              <div className="px-4 py-3 text-center" style={{ borderTop: "1px solid var(--eco-border)" }}>
                <button className="flex items-center gap-1 mx-auto text-[13px] cursor-pointer" style={{ color: "var(--eco-primary)" }}>
                  {t("viewAll")} <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Frame B: Notification Center Page
   ═══════════════════════════════════════════════════ */
function CenterFrame() {
  const { t } = useI18n();
  const allNotifs = useNotifications();
  const [filter, setFilter] = useState<"all" | NotifCategory>("all");
  const [view, setView] = useState<"loaded" | "empty" | "skeleton">("loaded");
  const [readState, setReadState] = useState<Record<string, boolean>>(() => {
    const m: Record<string, boolean> = {};
    allNotifs.forEach((n) => { m[n.id] = n.read; });
    return m;
  });

  const filters: { id: "all" | NotifCategory; label: string }[] = [
    { id: "all", label: t("allNotifs") },
    { id: "rooms", label: t("catRooms") },
    { id: "payments", label: t("catPayments") },
    { id: "support", label: t("catSupport") },
    { id: "security", label: t("catSecurity") },
  ];

  const filtered = filter === "all" ? allNotifs : allNotifs.filter((n) => n.category === filter);
  const withRead = filtered.map((n) => ({ ...n, read: readState[n.id] ?? n.read }));
  const unreadCount = Object.values(readState).filter((v) => !v).length;

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>B) {t("notifCenter")}</h2>
      <p className="text-[13px] mb-5" style={{ color: "var(--eco-text-secondary)" }}>
        Full-page inbox with filters, empty state, and skeleton loading
      </p>

      {/* View switcher */}
      <SC className="mb-5">
        <SL>DEMO STATE</SL>
        <div className="flex gap-2">
          {(["loaded", "empty", "skeleton"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer capitalize"
              style={{
                background: view === v ? "var(--eco-primary)" : "var(--eco-bg)",
                color: view === v ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
                border: `1px solid ${view === v ? "var(--eco-primary)" : "var(--eco-border)"}`,
              }}
            >
              {v}
            </button>
          ))}
        </div>
      </SC>

      {/* Center page mock */}
      <SC>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Inbox size={20} style={{ color: "var(--eco-text)" }} />
            <span className="text-[18px]" style={{ color: "var(--eco-text)" }}>{t("notifCenter")}</span>
            {unreadCount > 0 && view === "loaded" && (
              <span className="px-2 py-0.5 rounded-full text-[11px]" style={{ background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" }}>
                {unreadCount}
              </span>
            )}
          </div>
          {view === "loaded" && (
            <button
              onClick={() => {
                const next: Record<string, boolean> = {};
                allNotifs.forEach((n) => { next[n.id] = true; });
                setReadState(next);
              }}
              className="flex items-center gap-1.5 text-[13px] cursor-pointer"
              style={{ color: "var(--eco-primary)" }}
            >
              <CheckCheck size={14} />
              {t("markAllRead")}
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 mb-5 p-1 rounded-lg overflow-x-auto" style={{ background: "var(--eco-bg)" }}>
          {filters.map((f) => {
            const active = filter === f.id;
            const CatIcon = f.id !== "all" ? catIcons[f.id] : null;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer whitespace-nowrap transition-colors"
                style={{
                  background: active ? "var(--eco-surface)" : "transparent",
                  color: active ? "var(--eco-text)" : "var(--eco-text-tertiary)",
                  boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
                }}
              >
                {CatIcon && <CatIcon size={13} />}
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {view === "loaded" && (
          <div className="flex flex-col gap-2">
            {withRead.map((n) => (
              <NotifCard key={n.id} n={n} />
            ))}
          </div>
        )}

        {view === "empty" && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "var(--eco-neutral-100)" }}>
              <BellOff size={28} style={{ color: "var(--eco-text-tertiary)" }} />
            </div>
            <div className="text-[16px] mb-1" style={{ color: "var(--eco-text)" }}>{t("noNotifications")}</div>
            <div className="text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("noNotificationsDesc")}</div>
          </div>
        )}

        {view === "skeleton" && (
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={`sk-${i}`} className="flex gap-3 rounded-xl px-4 py-4 animate-pulse" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                <div className="w-9 h-9 rounded-lg shrink-0" style={{ background: "var(--eco-neutral-200)" }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 rounded w-2/3" style={{ background: "var(--eco-neutral-200)" }} />
                  <div className="h-3 rounded w-full" style={{ background: "var(--eco-neutral-100)" }} />
                  <div className="h-3 rounded w-1/4" style={{ background: "var(--eco-neutral-100)" }} />
                </div>
                <div className="h-3 w-10 rounded" style={{ background: "var(--eco-neutral-100)" }} />
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 py-3">
              <Loader2 size={14} className="animate-spin" style={{ color: "var(--eco-text-tertiary)" }} />
              <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loadingNotifications")}</span>
            </div>
          </div>
        )}
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   Frame C: Notification Templates
   ═══════════════════════════════════════════════════ */
function TemplatesFrame() {
  const { t } = useI18n();

  const templates: {
    id: string;
    titleKey: string;
    bodyKey: string;
    eventLabel: string;
    icon: React.ElementType;
    iconColor: string;
    iconBg: string;
    category: NotifCategory;
    recipientLabel: string;
    channels: string[];
  }[] = [
    { id: "t1", titleKey: "notifUserJoinedRoom", bodyKey: "notifUserJoinedRoomBody", eventLabel: "member.joined", icon: UserPlus, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)", category: "rooms", recipientLabel: "Owner", channels: ["inApp", "push"] },
    { id: "t2", titleKey: "notifAccessGranted", bodyKey: "notifAccessGrantedBody", eventLabel: "access.granted", icon: Unlock, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)", category: "rooms", recipientLabel: "Member", channels: ["inApp", "push", "emailChannel"] },
    { id: "t3", titleKey: "notifAccessConfirmed", bodyKey: "notifAccessConfirmedBody", eventLabel: "access.confirmed", icon: ShieldCheck, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)", category: "rooms", recipientLabel: "Owner", channels: ["inApp"] },
    { id: "t4", titleKey: "notifPaymentReceived", bodyKey: "notifPaymentReceivedBody", eventLabel: "payment.success", icon: CreditCard, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)", category: "payments", recipientLabel: "Owner", channels: ["inApp", "push", "emailChannel"] },
    { id: "t5", titleKey: "notifDisputeCreated", bodyKey: "notifDisputeCreatedBody", eventLabel: "dispute.created", icon: Scale, iconColor: "var(--eco-warning-500)", iconBg: "var(--eco-warning-100)", category: "support", recipientLabel: "Claimant", channels: ["inApp", "push"] },
    { id: "t6", titleKey: "notifDisputeClosed", bodyKey: "notifDisputeClosedBody", eventLabel: "dispute.closed", icon: CheckCheck, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)", category: "support", recipientLabel: "Claimant", channels: ["inApp", "push", "emailChannel"] },
    { id: "t7", titleKey: "notifMemberBanned", bodyKey: "notifMemberBannedBody", eventLabel: "member.banned", icon: ShieldAlert, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)", category: "security", recipientLabel: "Member + Owner", channels: ["inApp", "push"] },
    { id: "t8", titleKey: "notifMemberUnbanned", bodyKey: "notifMemberUnbannedBody", eventLabel: "member.unbanned", icon: UserPlus, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)", category: "security", recipientLabel: "Member", channels: ["inApp"] },
    { id: "t9", titleKey: "notifRoomStatusChanged", bodyKey: "notifRoomStatusChangedBody", eventLabel: "room.status_changed", icon: Activity, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)", category: "rooms", recipientLabel: "All members", channels: ["inApp", "push"] },
    { id: "t10", titleKey: "notifRefundSent", bodyKey: "notifRefundSentBody", eventLabel: "refund.sent", icon: RefreshCw, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)", category: "payments", recipientLabel: "Claimant", channels: ["inApp", "push", "emailChannel"] },
  ];

  const catLabels: Record<string, string> = {
    rooms: t("catRooms"), payments: t("catPayments"), support: t("catSupport"), security: t("catSecurity"),
  };

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>C) {t("notifTemplates")}</h2>
      <p className="text-[13px] mb-5" style={{ color: "var(--eco-text-secondary)" }}>
        {t("templateLibraryDesc")}
      </p>

      <div className="flex flex-col gap-4">
        {templates.map((tmpl) => {
          const catC = catColorMap[tmpl.category];
          return (
            <SC key={tmpl.id} className="!p-0 overflow-hidden">
              {/* Top bar */}
              <div className="flex items-center gap-3 px-5 py-3" style={{ background: "var(--eco-bg)", borderBottom: "1px solid var(--eco-border)" }}>
                <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
                  {tmpl.eventLabel}
                </code>
                <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: catC.bg, color: catC.color }}>
                  {catLabels[tmpl.category]}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("recipient")}:</span>
                  <span className="text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>{tmpl.recipientLabel}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="flex gap-4 items-start">
                  {/* Preview card */}
                  <div className="flex-1">
                    <div className="flex gap-3 rounded-xl px-4 py-4" style={{ background: "var(--eco-brand-50)", border: "1px solid var(--eco-brand-200)" }}>
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: tmpl.iconBg }}>
                        <tmpl.icon size={16} style={{ color: tmpl.iconColor }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] mb-1" style={{ color: "var(--eco-text)" }}>{t(tmpl.titleKey)}</div>
                        <p className="text-[12px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>{t(tmpl.bodyKey)}</p>
                      </div>
                      <span className="text-[10px] shrink-0 mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{t("justNow")}</span>
                    </div>
                  </div>

                  {/* Channel pills */}
                  <div className="flex flex-col gap-1.5 shrink-0 pt-1">
                    <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("channel")}:</span>
                    {tmpl.channels.map((ch) => {
                      const chIcon = ch === "inApp" ? Smartphone : ch === "push" ? Bell : Mail;
                      return (
                        <div key={ch} className="flex items-center gap-1.5 px-2 py-1 rounded text-[10px]" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
                          {(() => { const I = chIcon; return <I size={10} />; })()}
                          {t(ch)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </SC>
          );
        })}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function NotificationsInboxPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"dropdown" | "center" | "templates">("dropdown");

  const tabs = [
    { id: "dropdown" as const, label: `A) ${t("notifDropdown")}` },
    { id: "center" as const, label: `B) ${t("notifCenter")}` },
    { id: "templates" as const, label: `C) ${t("notifTemplates")}` },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>
            Page 14
          </span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-success-100)", color: "var(--eco-success-500)" }}>
            Real-time UX
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>
          {t("notificationsTitle")} & Inbox
        </h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>
          {t("notificationsSubtitle")}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--eco-surface)" }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: tab === id ? "var(--eco-bg)" : "transparent",
              color: tab === id ? "var(--eco-text)" : "var(--eco-text-tertiary)",
              boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "dropdown" && <DropdownFrame />}
      {tab === "center" && <CenterFrame />}
      {tab === "templates" && <TemplatesFrame />}
    </div>
  );
}
