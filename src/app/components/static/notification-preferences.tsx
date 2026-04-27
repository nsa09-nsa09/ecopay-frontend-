import { useState } from "react";
import { useI18n } from "../i18n-provider";
import { Badge, Button } from "../ds-primitives";
import {
  Bell, BellOff, Check, CheckCircle2, Clock, CreditCard, DoorOpen,
  Globe2, Info, Lock, Mail, MessageSquare, Moon, Newspaper, Rocket,
  Save, Settings, Shield, ShieldCheck, Smartphone, Sparkles, Sun,
  ToggleLeft, ToggleRight, Volume2, VolumeX, Zap,
} from "lucide-react";

/* ─── types ─── */
interface NotifEvent {
  id: string;
  label: string;
  desc: string;
  inApp: boolean;
  push: boolean;
  email: boolean;
  required?: "inApp" | "all";
}

interface NotifCategory {
  id: string;
  titleKey: string;
  icon: React.ElementType;
  color: string;
  events: NotifEvent[];
}

/* ─── initial data ─── */
function makeDefaults(): NotifCategory[] {
  return [
    {
      id: "payments", titleKey: "npCatPayments", icon: CreditCard, color: "var(--eco-success-500)",
      events: [
        { id: "pay_success", label: "Payment successful", desc: "When your payment is processed", inApp: true, push: true, email: true },
        { id: "pay_failed", label: "Payment failed", desc: "When a payment attempt fails", inApp: true, push: true, email: true, required: "inApp" },
        { id: "pay_received", label: "Payment received (owner)", desc: "When a member pays for your room", inApp: true, push: true, email: true },
        { id: "pay_refund", label: "Refund processed", desc: "When a refund is issued to you", inApp: true, push: true, email: true, required: "inApp" },
        { id: "pay_reminder", label: "Upcoming payment reminder", desc: "3 days before next billing date", inApp: true, push: true, email: false },
      ],
    },
    {
      id: "rooms", titleKey: "npCatRooms", icon: DoorOpen, color: "var(--eco-brand-600)",
      events: [
        { id: "room_join", label: "New member joined", desc: "When someone joins your room", inApp: true, push: true, email: false },
        { id: "room_leave", label: "Member left", desc: "When a member leaves your room", inApp: true, push: false, email: false },
        { id: "room_status", label: "Room status change", desc: "Active, blocked, expired, etc.", inApp: true, push: true, email: true, required: "inApp" },
        { id: "room_verify", label: "Verification update", desc: "Room approved or changes requested", inApp: true, push: true, email: true, required: "inApp" },
        { id: "room_full", label: "Room is full", desc: "All slots taken in your room", inApp: true, push: false, email: false },
      ],
    },
    {
      id: "disputes", titleKey: "npCatDisputes", icon: Shield, color: "var(--eco-warning-500)",
      events: [
        { id: "disp_filed", label: "Dispute filed against you", desc: "Someone opened a dispute", inApp: true, push: true, email: true, required: "all" },
        { id: "disp_update", label: "Dispute status update", desc: "New message or decision in dispute", inApp: true, push: true, email: true, required: "inApp" },
        { id: "disp_resolved", label: "Dispute resolved", desc: "Final decision issued", inApp: true, push: true, email: true, required: "inApp" },
      ],
    },
    {
      id: "security", titleKey: "npCatSecurity", icon: Lock, color: "var(--eco-danger-500)",
      events: [
        { id: "sec_login", label: "New device login", desc: "Login from unrecognized device", inApp: true, push: true, email: true, required: "all" },
        { id: "sec_password", label: "Password changed", desc: "Your password was updated", inApp: true, push: true, email: true, required: "all" },
        { id: "sec_suspicious", label: "Suspicious activity", desc: "Unusual account behavior detected", inApp: true, push: true, email: true, required: "all" },
      ],
    },
    {
      id: "marketing", titleKey: "npCatMarketing", icon: Newspaper, color: "var(--eco-text-tertiary)",
      events: [
        { id: "mkt_newplans", label: "New plans available", desc: "Operators add new shareable plans", inApp: true, push: false, email: false },
        { id: "mkt_promo", label: "Promotions & offers", desc: "Special deals from EcoPay", inApp: false, push: false, email: false },
        { id: "mkt_tips", label: "Tips & guides", desc: "How to save more with sharing", inApp: false, push: false, email: false },
      ],
    },
    {
      id: "system", titleKey: "npCatSystem", icon: Settings, color: "var(--eco-text-secondary)",
      events: [
        { id: "sys_maintenance", label: "Scheduled maintenance", desc: "Planned downtime notifications", inApp: true, push: false, email: true },
        { id: "sys_updates", label: "Product updates", desc: "New features and improvements", inApp: true, push: false, email: false },
      ],
    },
  ];
}

/* ─── shared ─── */
const SC = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-6 ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>
);

/* ─── Toggle component ─── */
function Toggle({ checked, onChange, disabled, required }: { checked: boolean; onChange: () => void; disabled?: boolean; required?: boolean }) {
  const { t } = useI18n();
  return (
    <button
      onClick={disabled || required ? undefined : onChange}
      className={`relative w-9 h-5 rounded-full transition-colors ${disabled || required ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      style={{ background: checked ? "var(--eco-primary)" : "var(--eco-neutral-200)" }}
      title={required ? t("npAlwaysOn") : undefined}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
        style={{
          background: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
          transform: checked ? "translateX(18px)" : "translateX(2px)",
        }}
      />
      {required && (
        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full flex items-center justify-center" style={{ background: "var(--eco-warning-500)" }}>
          <Lock size={7} color="#fff" />
        </div>
      )}
    </button>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export function NotificationPreferencesPage() {
  const { t } = useI18n();
  const [categories, setCategories] = useState(makeDefaults);
  const [saved, setSaved] = useState(false);
  const [quietEnabled, setQuietEnabled] = useState(true);
  const [quietFrom, setQuietFrom] = useState("23:00");
  const [quietTo, setQuietTo] = useState("07:00");
  const [digestEnabled, setDigestEnabled] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>("payments");

  const toggleEvent = (catId: string, eventId: string, channel: "inApp" | "push" | "email") => {
    setCategories((prev) =>
      prev.map((cat) => {
        if (cat.id !== catId) return cat;
        return {
          ...cat,
          events: cat.events.map((ev) => {
            if (ev.id !== eventId) return ev;
            if (ev.required === "all") return ev;
            if (ev.required === "inApp" && channel === "inApp") return ev;
            return { ...ev, [channel]: !ev[channel] };
          }),
        };
      })
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleReset = () => {
    setCategories(makeDefaults());
    setQuietEnabled(true);
    setQuietFrom("23:00");
    setQuietTo("07:00");
    setDigestEnabled(true);
    setSaved(false);
  };

  // Stats
  const allEvents = categories.flatMap((c) => c.events);
  const totalOn = allEvents.reduce((s, e) => s + (e.inApp ? 1 : 0) + (e.push ? 1 : 0) + (e.email ? 1 : 0), 0);
  const totalPossible = allEvents.length * 3;

  return (
    <div className="max-w-[900px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>Page 24</span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>Preferences</span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>{t("npTitle")}</h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>{t("npSubtitle")}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { n: `${categories.length}`, label: "Categories" },
          { n: `${allEvents.length}`, label: "Event types" },
          { n: `${totalOn}/${totalPossible}`, label: "Channels active" },
          { n: "3", label: "Channels (in-app/push/email)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{s.n}</div>
            <div className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Channel legend */}
      <div className="flex items-center gap-4 mb-5 px-1">
        {[
          { icon: Bell, label: t("npInApp"), desc: "Badge + inbox" },
          { icon: Smartphone, label: t("npPush"), desc: "Device notification" },
          { icon: Mail, label: t("npEmail"), desc: "Email message" },
        ].map((ch) => (
          <div key={ch.label} className="flex items-center gap-1.5">
            <ch.icon size={13} style={{ color: "var(--eco-primary)" }} />
            <span className="text-[12px]" style={{ color: "var(--eco-text)" }}>{ch.label}</span>
            <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>({ch.desc})</span>
          </div>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          <Lock size={10} style={{ color: "var(--eco-warning-500)" }} />
          <span className="text-[10px]" style={{ color: "var(--eco-warning-500)" }}>{t("npRequired")}</span>
        </div>
      </div>

      {/* Category sections */}
      <div className="flex flex-col gap-3 mb-6">
        {categories.map((cat) => {
          const isExpanded = expandedCat === cat.id;
          const onCount = cat.events.reduce((s, e) => s + (e.inApp ? 1 : 0) + (e.push ? 1 : 0) + (e.email ? 1 : 0), 0);
          const maxCount = cat.events.length * 3;

          return (
            <SC key={cat.id} className="!p-0 overflow-hidden">
              {/* Category header */}
              <button
                onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left transition-colors"
                style={{ background: isExpanded ? "var(--eco-bg)" : "transparent" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${cat.color}18` }}>
                  <cat.icon size={15} style={{ color: cat.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t(cat.titleKey)}</div>
                  <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{cat.events.length} events · {onCount}/{maxCount} active</div>
                </div>
                {/* Mini channel indicators */}
                <div className="flex gap-2">
                  {(["inApp", "push", "email"] as const).map((ch) => {
                    const on = cat.events.filter((e) => e[ch]).length;
                    return (
                      <div key={ch} className="flex items-center gap-1" title={`${on}/${cat.events.length} ${ch}`}>
                        {ch === "inApp" ? <Bell size={10} /> : ch === "push" ? <Smartphone size={10} /> : <Mail size={10} />}
                        <span className="text-[10px] tabular-nums" style={{ color: on === cat.events.length ? "var(--eco-success-500)" : on > 0 ? "var(--eco-warning-500)" : "var(--eco-text-tertiary)" }}>
                          {on}/{cat.events.length}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="w-5 h-5 rounded flex items-center justify-center transition-transform" style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0)", color: "var(--eco-text-tertiary)" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 1L7 5L3 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </button>

              {/* Events */}
              {isExpanded && (
                <div>
                  {/* Column headers */}
                  <div className="flex items-center px-5 py-2 gap-3" style={{ borderTop: "1px solid var(--eco-border)", borderBottom: "1px solid var(--eco-border)", background: "var(--eco-bg)" }}>
                    <div className="flex-1" />
                    <div className="flex gap-6">
                      {[
                        { icon: Bell, label: t("npInApp") },
                        { icon: Smartphone, label: t("npPush") },
                        { icon: Mail, label: t("npEmail") },
                      ].map((ch) => (
                        <div key={ch.label} className="w-14 text-center flex flex-col items-center gap-0.5">
                          <ch.icon size={11} style={{ color: "var(--eco-text-tertiary)" }} />
                          <span className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>{ch.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-5" />
                  </div>

                  {cat.events.map((ev, i) => (
                    <div
                      key={ev.id}
                      className="flex items-center px-5 py-3 gap-3"
                      style={{ borderBottom: i < cat.events.length - 1 ? "1px solid var(--eco-border)" : "none" }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{ev.label}</span>
                          {ev.required && (
                            <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: "var(--eco-warning-100)", color: "var(--eco-warning-500)" }}>
                              {ev.required === "all" ? t("npAlwaysOn") : t("npRequired")}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{ev.desc}</div>
                      </div>
                      <div className="flex gap-6">
                        {(["inApp", "push", "email"] as const).map((ch) => (
                          <div key={ch} className="w-14 flex justify-center">
                            <Toggle
                              checked={ev[ch]}
                              onChange={() => toggleEvent(cat.id, ev.id, ch)}
                              required={ev.required === "all" || (ev.required === "inApp" && ch === "inApp")}
                            />
                          </div>
                        ))}
                      </div>
                      <div className="w-5" />
                    </div>
                  ))}
                </div>
              )}
            </SC>
          );
        })}
      </div>

      {/* Quiet Hours + Digest */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Quiet Hours */}
        <SC>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Moon size={14} style={{ color: "var(--eco-primary)" }} />
              <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("npQuietHours")}</span>
            </div>
            <Toggle checked={quietEnabled} onChange={() => setQuietEnabled(!quietEnabled)} />
          </div>
          <p className="text-[12px] mb-4" style={{ color: "var(--eco-text-tertiary)" }}>{t("npQuietDesc")}</p>

          {quietEnabled && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] mb-1 block" style={{ color: "var(--eco-text-tertiary)" }}>From</label>
                <input
                  type="time"
                  value={quietFrom}
                  onChange={(e) => setQuietFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[13px]"
                  style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", outline: "none" }}
                />
              </div>
              <span className="text-[14px] mt-4" style={{ color: "var(--eco-text-tertiary)" }}>→</span>
              <div className="flex-1">
                <label className="text-[10px] mb-1 block" style={{ color: "var(--eco-text-tertiary)" }}>To</label>
                <input
                  type="time"
                  value={quietTo}
                  onChange={(e) => setQuietTo(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[13px]"
                  style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)", color: "var(--eco-text)", outline: "none" }}
                />
              </div>
            </div>
          )}

          {quietEnabled && (
            <div className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: "var(--eco-brand-50)" }}>
              <BellOff size={12} style={{ color: "var(--eco-primary)" }} />
              <span className="text-[11px]" style={{ color: "var(--eco-primary)" }}>
                Push silent {quietFrom} – {quietTo}. In-app + email unaffected.
              </span>
            </div>
          )}
        </SC>

        {/* Email Digest */}
        <SC>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Mail size={14} style={{ color: "var(--eco-primary)" }} />
              <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("npDigest")}</span>
            </div>
            <Toggle checked={digestEnabled} onChange={() => setDigestEnabled(!digestEnabled)} />
          </div>
          <p className="text-[12px] mb-4" style={{ color: "var(--eco-text-tertiary)" }}>{t("npDigestDesc")}</p>

          {digestEnabled && (
            <div>
              <label className="text-[10px] mb-1 block" style={{ color: "var(--eco-text-tertiary)" }}>Frequency</label>
              <div className="flex gap-2">
                {["Daily", "Weekly"].map((f) => (
                  <button
                    key={f}
                    className="flex-1 px-3 py-2 rounded-lg text-[12px] cursor-pointer text-center transition-colors"
                    style={{
                      background: f === "Daily" ? "var(--eco-primary)" : "var(--eco-bg)",
                      color: f === "Daily" ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
                      border: f === "Daily" ? "none" : "1px solid var(--eco-border)",
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: "var(--eco-brand-50)" }}>
                <Clock size={12} style={{ color: "var(--eco-primary)" }} />
                <span className="text-[11px]" style={{ color: "var(--eco-primary)" }}>
                  Daily digest at 09:00 — groups non-urgent emails into one summary.
                </span>
              </div>
            </div>
          )}
        </SC>
      </div>

      {/* Privacy note */}
      <div className="rounded-xl px-5 py-3 mb-6 flex items-start gap-2" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
        <ShieldCheck size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-success-500)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{t("npPrivacyNote")}</span>
      </div>

      {/* Save / Reset bar */}
      <div className="flex items-center justify-between rounded-xl px-5 py-4 sticky bottom-4" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}>
        <Button variant="ghost" size="sm" onClick={handleReset}>
          {t("npReset")}
        </Button>
        <div className="flex items-center gap-3">
          {saved && (
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-success-500)" }}>
              <CheckCircle2 size={14} /> Saved!
            </div>
          )}
          <Button variant="primary" size="md" onClick={handleSave}>
            <Save size={14} /> {t("npSavePrefs")}
          </Button>
        </div>
      </div>
    </div>
  );
}
