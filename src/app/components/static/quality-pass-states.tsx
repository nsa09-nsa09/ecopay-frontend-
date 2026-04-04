import { useState, useEffect } from "react";
import { useI18n } from "../i18n-provider";
import { Badge, Button } from "../ds-primitives";
import {
  AlertCircle, AlertTriangle, ArrowRight, Ban, Bell, CheckCircle2, Clock,
  CreditCard, DoorOpen, ExternalLink, FileWarning, Filter, Inbox,
  KeyRound, Loader2, Lock, Mail, MessageSquare, RefreshCw, Search,
  Shield, ShieldAlert, Timer, Upload, UserCog, XCircle, ZapOff,
  Frown, Meh, PackageOpen, ServerCrash, Hourglass,
} from "lucide-react";

/* ─── Types ─── */
type StateType = "error" | "empty" | "info" | "loading";

interface StateCard {
  id: string;
  module: string;
  moduleKey: string;
  type: StateType;
  titleKey: string;
  descKey: string;
  ctaKey: string;
  ctaVariant: "primary" | "ghost" | "outline";
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  skeleton?: boolean;
  countdown?: number;
}

/* ─── Helpers ─── */
const typeConfig: Record<StateType, { labelKey: string; badgeVariant: "danger" | "default" | "info" | "warning"; borderColor: string }> = {
  error: { labelKey: "stateError", badgeVariant: "danger", borderColor: "var(--eco-danger-300)" },
  empty: { labelKey: "stateEmpty", badgeVariant: "default", borderColor: "var(--eco-neutral-300)" },
  info: { labelKey: "stateInfo", badgeVariant: "info", borderColor: "var(--eco-brand-200)" },
  loading: { labelKey: "stateLoading", badgeVariant: "warning", borderColor: "var(--eco-warning-300)" },
};

/* ─── Countdown hook ─── */
function Countdown({ initial }: { initial: number }) {
  const { t } = useI18n();
  const [sec, setSec] = useState(initial);
  useEffect(() => {
    if (sec <= 0) return;
    const id = setTimeout(() => setSec((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [sec]);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return (
    <div className="flex items-center gap-2 mt-3 rounded-lg px-3 py-2" style={{ background: "var(--eco-warning-100)" }}>
      <Timer size={13} style={{ color: "var(--eco-warning-500)" }} />
      <span className="text-[12px] tabular-nums" style={{ color: "var(--eco-warning-500)" }}>
        {t("waitSeconds")} {m}:{s.toString().padStart(2, "0")}
      </span>
    </div>
  );
}

/* ─── Skeleton block ─── */
function SkeletonBlock() {
  return (
    <div className="flex flex-col gap-3 mt-3 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={`sk-${i}`} className="flex gap-3 items-center">
          <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: "var(--eco-neutral-200)" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded w-3/4" style={{ background: "var(--eco-neutral-200)" }} />
            <div className="h-2.5 rounded w-1/2" style={{ background: "var(--eco-neutral-100)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Single state card render ─── */
function StateCardRender({ card }: { card: StateCard }) {
  const { t } = useI18n();
  const tc = typeConfig[card.type];

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1px solid ${tc.borderColor}`, background: "var(--eco-surface)" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="flex items-center gap-2">
          <span className="text-[12px] px-2 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
            {t(card.moduleKey)}
          </span>
          <Badge variant={tc.badgeVariant}>{t(tc.labelKey)}</Badge>
        </div>
        <code className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{card.id}</code>
      </div>

      {/* Body */}
      <div className="px-5 py-5">
        <div className="flex flex-col items-center text-center max-w-xs mx-auto">
          {/* Icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: card.iconBg }}
          >
            {card.type === "loading" ? (
              <Loader2 size={24} className="animate-spin" style={{ color: card.iconColor }} />
            ) : (
              <card.icon size={24} style={{ color: card.iconColor }} />
            )}
          </div>

          {/* Title */}
          <div className="text-[16px] mb-1.5" style={{ color: "var(--eco-text)" }}>
            {t(card.titleKey)}
          </div>

          {/* Description */}
          <p className="text-[13px] leading-relaxed mb-4" style={{ color: "var(--eco-text-secondary)" }}>
            {t(card.descKey)}
          </p>

          {/* CTA */}
          <Button variant={card.ctaVariant} size="md">
            {t(card.ctaKey)} <ArrowRight size={14} />
          </Button>

          {/* Optional countdown */}
          {card.countdown && <Countdown initial={card.countdown} />}

          {/* Optional skeleton */}
          {card.skeleton && <SkeletonBlock />}
        </div>
      </div>

      {/* Footer - recommended CTA label */}
      <div className="px-5 py-2.5 flex items-center gap-2" style={{ background: "var(--eco-bg)", borderTop: "1px solid var(--eco-border)" }}>
        <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("recommendedCta")}:</span>
        <code className="text-[11px]" style={{ color: "var(--eco-primary)" }}>{t(card.ctaKey)}</code>
      </div>
    </div>
  );
}

/* ─── All state definitions ─── */
function useStateCards(): Record<string, StateCard[]> {
  return {
    auth: [
      { id: "AUTH-ERR-01", module: "Auth", moduleKey: "moduleAuth", type: "error", titleKey: "authLoginError", descKey: "authLoginErrorDesc", ctaKey: "authLoginErrorCta", ctaVariant: "ghost", icon: XCircle, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)" },
      { id: "AUTH-ERR-02", module: "Auth", moduleKey: "moduleAuth", type: "error", titleKey: "authRateLimited", descKey: "authRateLimitedDesc", ctaKey: "authRateLimitedCta", ctaVariant: "ghost", icon: ShieldAlert, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)", countdown: 300 },
      { id: "AUTH-INFO-01", module: "Auth", moduleKey: "moduleAuth", type: "info", titleKey: "authEmailSent", descKey: "authEmailSentDesc", ctaKey: "authEmailSentCta", ctaVariant: "primary", icon: Mail, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)" },
    ],
    catalog: [
      { id: "CAT-EMPTY-01", module: "Catalog", moduleKey: "moduleCatalog", type: "empty", titleKey: "catalogNoRooms", descKey: "catalogNoRoomsDesc", ctaKey: "catalogNoRoomsCta", ctaVariant: "primary", icon: PackageOpen, iconColor: "var(--eco-text-tertiary)", iconBg: "var(--eco-neutral-100)" },
      { id: "CAT-EMPTY-02", module: "Catalog", moduleKey: "moduleCatalog", type: "empty", titleKey: "catalogFilterEmpty", descKey: "catalogFilterEmptyDesc", ctaKey: "catalogFilterEmptyCta", ctaVariant: "ghost", icon: Search, iconColor: "var(--eco-text-tertiary)", iconBg: "var(--eco-neutral-100)" },
    ],
    room: [
      { id: "ROOM-ERR-01", module: "Room", moduleKey: "moduleRoomDetail", type: "error", titleKey: "roomFullState", descKey: "roomFullStateDesc", ctaKey: "roomFullStateCta", ctaVariant: "primary", icon: DoorOpen, iconColor: "var(--eco-warning-500)", iconBg: "var(--eco-warning-100)" },
      { id: "ROOM-ERR-02", module: "Room", moduleKey: "moduleRoomDetail", type: "error", titleKey: "roomJoinClosed", descKey: "roomJoinClosedDesc", ctaKey: "roomJoinClosedCta", ctaVariant: "ghost", icon: Lock, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)" },
    ],
    payments: [
      { id: "PAY-ERR-01", module: "Payments", moduleKey: "modulePayments", type: "error", titleKey: "paymentFailed", descKey: "paymentFailedDesc", ctaKey: "paymentFailedCta", ctaVariant: "primary", icon: XCircle, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)" },
      { id: "PAY-LOAD-01", module: "Payments", moduleKey: "modulePayments", type: "loading", titleKey: "paymentPendingHold", descKey: "paymentPendingHoldDesc", ctaKey: "paymentPendingHoldCta", ctaVariant: "ghost", icon: Hourglass, iconColor: "var(--eco-warning-500)", iconBg: "var(--eco-warning-100)", skeleton: true },
      { id: "PAY-INFO-01", module: "Payments", moduleKey: "modulePayments", type: "info", titleKey: "paymentRetrySafe", descKey: "paymentRetrySafeDesc", ctaKey: "paymentRetrySafeCta", ctaVariant: "primary", icon: RefreshCw, iconColor: "var(--eco-brand-600)", iconBg: "var(--eco-brand-50)" },
    ],
    support: [
      { id: "SUP-EMPTY-01", module: "Support", moduleKey: "moduleSupport", type: "empty", titleKey: "supportNoTickets", descKey: "supportNoTicketsDesc", ctaKey: "supportNoTicketsCta", ctaVariant: "primary", icon: Inbox, iconColor: "var(--eco-text-tertiary)", iconBg: "var(--eco-neutral-100)" },
      { id: "SUP-ERR-01", module: "Support", moduleKey: "moduleSupport", type: "error", titleKey: "supportAttachRejected", descKey: "supportAttachRejectedDesc", ctaKey: "supportAttachRejectedCta", ctaVariant: "ghost", icon: FileWarning, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)" },
    ],
    admin: [
      { id: "ADM-EMPTY-01", module: "Admin", moduleKey: "moduleAdmin", type: "empty", titleKey: "adminQueueEmpty", descKey: "adminQueueEmptyDesc", ctaKey: "adminQueueEmptyCta", ctaVariant: "ghost", icon: CheckCircle2, iconColor: "var(--eco-success-500)", iconBg: "var(--eco-success-100)" },
      { id: "ADM-ERR-01", module: "Admin", moduleKey: "moduleAdmin", type: "error", titleKey: "adminPermDenied", descKey: "adminPermDeniedDesc", ctaKey: "adminPermDeniedCta", ctaVariant: "ghost", icon: Ban, iconColor: "var(--eco-danger-500)", iconBg: "var(--eco-danger-100)" },
    ],
  };
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function QualityPassStatesPage() {
  const { t } = useI18n();
  const cards = useStateCards();
  const modules = [
    { key: "auth", labelKey: "moduleAuth" },
    { key: "catalog", labelKey: "moduleCatalog" },
    { key: "room", labelKey: "moduleRoomDetail" },
    { key: "payments", labelKey: "modulePayments" },
    { key: "support", labelKey: "moduleSupport" },
    { key: "admin", labelKey: "moduleAdmin" },
  ];
  const [activeModule, setActiveModule] = useState("auth");

  const activeCards = cards[activeModule] || [];

  // Stats
  const totalCards = Object.values(cards).flat().length;
  const byType: Record<StateType, number> = { error: 0, empty: 0, info: 0, loading: 0 };
  Object.values(cards).flat().forEach((c) => { byType[c.type]++; });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>
            Page 15
          </span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-success-100)", color: "var(--eco-success-500)" }}>
            UX Polish
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>
          {t("qualityPassTitle")}
        </h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>
          {t("qualityPassSubtitle")}
        </p>
      </div>

      {/* Overview counters */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        <div className="rounded-xl p-4 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
          <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{totalCards}</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Total states</div>
        </div>
        {(["error", "empty", "info", "loading"] as StateType[]).map((st) => {
          const tc = typeConfig[st];
          return (
            <div key={st} className="rounded-xl p-4 text-center" style={{ background: "var(--eco-surface)", border: `1px solid ${tc.borderColor}` }}>
              <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{byType[st]}</div>
              <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <Badge variant={tc.badgeVariant}>{t(tc.labelKey)}</Badge>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--eco-surface)" }}>
        {modules.map(({ key, labelKey }) => {
          const count = cards[key]?.length || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveModule(key)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer whitespace-nowrap"
              style={{
                background: activeModule === key ? "var(--eco-bg)" : "transparent",
                color: activeModule === key ? "var(--eco-text)" : "var(--eco-text-tertiary)",
                boxShadow: activeModule === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {t(labelKey)}
              <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: activeModule === key ? "var(--eco-primary)" : "var(--eco-neutral-200)", color: activeModule === key ? "var(--eco-text-on-primary)" : "var(--eco-text-tertiary)" }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Desktop: side-by-side grid of cards; Mobile: stack */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {activeCards.map((card) => (
          <StateCardRender key={card.id} card={card} />
        ))}
      </div>

      {/* Full matrix view */}
      <div className="mt-12">
        <div className="rounded-xl overflow-hidden" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--eco-border)" }}>
            <div className="text-[16px]" style={{ color: "var(--eco-text)" }}>State Coverage Matrix</div>
            <div className="text-[12px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>
              Every module × state type combination at a glance
            </div>
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--eco-bg)" }}>
                  <th className="text-left px-4 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>Module</th>
                  {(["error", "empty", "info", "loading"] as StateType[]).map((st) => (
                    <th key={st} className="text-center px-4 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>
                      <Badge variant={typeConfig[st].badgeVariant}>{t(typeConfig[st].labelKey)}</Badge>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {modules.map(({ key, labelKey }) => (
                  <tr key={key} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                    <td className="px-4 py-3" style={{ color: "var(--eco-text)" }}>{t(labelKey)}</td>
                    {(["error", "empty", "info", "loading"] as StateType[]).map((st) => {
                      const matches = (cards[key] || []).filter((c) => c.type === st);
                      return (
                        <td key={st} className="text-center px-4 py-3">
                          {matches.length > 0 ? (
                            <div className="flex flex-col items-center gap-1">
                              {matches.map((m) => (
                                <span key={m.id} className="text-[11px] px-2 py-0.5 rounded" style={{ background: "var(--eco-bg)", color: "var(--eco-text-secondary)" }}>
                                  {t(m.titleKey)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span style={{ color: "var(--eco-neutral-300)" }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: simple list */}
          <div className="sm:hidden p-4">
            {modules.map(({ key, labelKey }) => (
              <div key={key} className="mb-4">
                <div className="text-[13px] mb-2" style={{ color: "var(--eco-text)" }}>{t(labelKey)}</div>
                <div className="flex flex-wrap gap-1.5">
                  {(cards[key] || []).map((c) => (
                    <Badge key={c.id} variant={typeConfig[c.type].badgeVariant}>{t(c.titleKey)}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
