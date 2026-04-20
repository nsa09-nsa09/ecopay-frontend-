import { useState } from "react";
import { useI18n } from "../i18n-provider";
import { Badge, Pill, Button, Card } from "../ds-primitives";
import {
  Eye, EyeOff, Lock, Unlock, Shield, ShieldCheck, ShieldAlert,
  ClipboardList, FileText, AlertTriangle, CheckCircle2, XCircle,
  ChevronRight, Info, Clock, User, UserCog, MessageSquareOff,
  Phone, FileKey, Ban, RefreshCw, ExternalLink,
} from "lucide-react";

/* ─── Shared layout ─── */
function SectionCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl p-6 ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: string }) {
  return <div className="text-[11px] mb-3 tracking-wide" style={{ color: "var(--eco-text-tertiary)" }}>{children}</div>;
}

/* ─── A) Identifier Masking Patterns ─── */
function IdentifierMaskingFrame() {
  const { t } = useI18n();

  const maskExamples = [
    {
      id: "phone-1",
      type: t("phoneMasked"),
      icon: Phone,
      full: "+7 705 123 45 67",
      masked: "+7 7** *** ** 67",
      rule: t("visibleToOwnerAfterPayment"),
      ruleColor: "warning",
    },
    {
      id: "phone-2",
      type: t("phoneMasked"),
      icon: Phone,
      full: "+7 777 888 99 00",
      masked: "+7 7** *** ** 00",
      rule: t("visibleToOwnerAfterPayment"),
      ruleColor: "warning",
    },
    {
      id: "contract-1",
      type: t("contractIdMasked"),
      icon: FileKey,
      full: "CTR-2026-0412-7834",
      masked: "CTR-****-****-7834",
      rule: t("visibleToAdminOnly"),
      ruleColor: "danger",
    },
    {
      id: "contract-2",
      type: t("contractIdMasked"),
      icon: FileKey,
      full: "BLN-FAM-30GB-0091",
      masked: "BLN-***-****-0091",
      rule: t("visibleToAdminOnly"),
      ruleColor: "danger",
    },
    {
      id: "email",
      type: "Email",
      icon: FileText,
      full: "aidar.serik@mail.kz",
      masked: "a****r@****.kz",
      rule: t("visibleToAdminOnly"),
      ruleColor: "danger",
    },
  ];

  const ruleColorMap: Record<string, { bg: string; text: string; border: string }> = {
    warning: { bg: "var(--eco-warning-100)", text: "var(--eco-warning-500)", border: "var(--eco-warning-500)" },
    danger: { bg: "var(--eco-danger-100)", text: "var(--eco-danger-500)", border: "var(--eco-danger-500)" },
  };

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>
        A) {t("identifierMasking")}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("maskingPatterns")}
      </p>

      <SectionCard className="mb-6">
        <SectionLabel>MASKING EXAMPLES</SectionLabel>

        {/* Table header - desktop */}
        <div className="hidden sm:grid grid-cols-[180px_180px_200px_1fr] gap-4 text-[11px] pb-3 mb-3" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>
          <span>{t("fullValue").toUpperCase()}</span>
          <span>{t("maskedValue").toUpperCase()}</span>
          <span>{t("visibilityRule").toUpperCase()}</span>
          <span>TYPE</span>
        </div>

        <div className="flex flex-col gap-3">
          {maskExamples.map((ex) => {
            const rc = ruleColorMap[ex.ruleColor];
            return (
              <div key={ex.id}>
                {/* Desktop */}
                <div className="hidden sm:grid grid-cols-[180px_180px_200px_1fr] gap-4 items-center py-2.5" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                  <div className="flex items-center gap-2">
                    <EyeOff size={12} style={{ color: "var(--eco-text-tertiary)" }} />
                    <code className="text-[13px]" style={{ color: "var(--eco-text-tertiary)", textDecoration: "line-through" }}>{ex.full}</code>
                  </div>
                  <code className="text-[13px] px-2 py-1 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text)" }}>
                    {ex.masked}
                  </code>
                  <span className="text-[11px] px-2 py-1 rounded-lg inline-flex items-center gap-1.5" style={{ background: rc.bg, color: rc.text }}>
                    <Lock size={10} />
                    {ex.rule}
                  </span>
                  <div className="flex items-center gap-2">
                    <ex.icon size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                    <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{ex.type}</span>
                  </div>
                </div>
                {/* Mobile */}
                <div className="sm:hidden rounded-lg p-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <ex.icon size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                    <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{ex.type}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("fullValue")}:</span>
                    <code className="text-[12px]" style={{ color: "var(--eco-text-tertiary)", textDecoration: "line-through" }}>{ex.full}</code>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("maskedValue")}:</span>
                    <code className="text-[13px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text)" }}>{ex.masked}</code>
                  </div>
                  <span className="text-[10px] px-2 py-1 rounded-lg inline-flex items-center gap-1" style={{ background: rc.bg, color: rc.text }}>
                    <Lock size={9} /> {ex.rule}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Inline rule component */}
      <SectionCard>
        <SectionLabel>INLINE RULE COMPONENT — REUSABLE</SectionLabel>
        <p className="text-[13px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
          Drop-in component for any field that has visibility restrictions.
        </p>
        <div className="flex flex-col gap-3">
          {/* Variant: owner after payment */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--eco-warning-100)", border: "1px dashed var(--eco-warning-500)" }}>
            <Eye size={14} style={{ color: "var(--eco-warning-500)" }} />
            <span className="text-[13px]" style={{ color: "var(--eco-warning-500)" }}>
              {t("visibleToOwnerAfterPayment")}
            </span>
          </div>
          {/* Variant: admin only */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--eco-danger-100)", border: "1px dashed var(--eco-danger-500)" }}>
            <ShieldAlert size={14} style={{ color: "var(--eco-danger-500)" }} />
            <span className="text-[13px]" style={{ color: "var(--eco-danger-500)" }}>
              {t("visibleToAdminOnly")}
            </span>
          </div>
          {/* Variant: masked default */}
          <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--eco-neutral-100)", border: "1px dashed var(--eco-neutral-300)" }}>
            <EyeOff size={14} style={{ color: "var(--eco-text-tertiary)" }} />
            <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
              {t("maskedDefault")}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── B) Reveal Flow ─── */
function RevealFlowFrame() {
  const { t } = useI18n();
  const [step, setStep] = useState<"masked" | "modal" | "revealed" | "denied">("masked");
  const [reason, setReason] = useState("");

  const reasons = [
    t("reasonVerifyIdentity"),
    t("reasonPaymentDispute"),
    t("reasonSupportEscalation"),
    t("reasonComplianceCheck"),
    t("reasonAccessProvisioning"),
  ];

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>
        B) {t("revealFlow")}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("revealRequiresReason")}. {t("allRevealsAudited")}.
      </p>

      {/* Step selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(["masked", "modal", "revealed", "denied"] as const).map((s) => {
          const labels: Record<string, string> = {
            masked: t("maskedDefault"),
            modal: t("revealIdentifier"),
            revealed: t("accessGranted"),
            denied: t("accessDenied"),
          };
          return (
            <button
              key={s}
              onClick={() => { setStep(s); setReason(""); }}
              className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
              style={{
                background: step === s ? "var(--eco-primary)" : "var(--eco-bg)",
                color: step === s ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
                border: `1px solid ${step === s ? "var(--eco-primary)" : "var(--eco-border)"}`,
              }}
            >
              {labels[s]}
            </button>
          );
        })}
      </div>

      {/* STATE: Masked (default) */}
      {step === "masked" && (
        <SectionCard>
          <SectionLabel>{t("maskedDefault").toUpperCase()}</SectionLabel>
          <div className="max-w-md">
            <div className="rounded-xl p-5" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
                    <User size={18} style={{ color: "var(--eco-brand-600)" }} />
                  </div>
                  <div>
                    <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>User_a7k2m</div>
                    <Badge variant="success">{t("stateActive")}</Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between rounded-lg p-3" style={{ background: "var(--eco-neutral-100)" }}>
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("phoneMasked")}</div>
                    <code className="text-[15px]" style={{ color: "var(--eco-text)" }}>+7 7** *** ** 67</code>
                  </div>
                  <button
                    onClick={() => setStep("modal")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors"
                    style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)", color: "var(--eco-primary)" }}
                  >
                    <Eye size={12} />
                    {t("viewFull")}
                  </button>
                </div>

                <div className="flex items-center justify-between rounded-lg p-3" style={{ background: "var(--eco-neutral-100)" }}>
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("contractIdMasked")}</div>
                    <code className="text-[15px]" style={{ color: "var(--eco-text)" }}>CTR-****-****-7834</code>
                  </div>
                  <button
                    onClick={() => setStep("modal")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors"
                    style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)", color: "var(--eco-primary)" }}
                  >
                    <Eye size={12} />
                    {t("viewFull")}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 rounded-lg px-3 py-2" style={{ background: "var(--eco-warning-100)", border: "1px dashed var(--eco-warning-500)" }}>
                <Eye size={12} style={{ color: "var(--eco-warning-500)" }} />
                <span className="text-[11px]" style={{ color: "var(--eco-warning-500)" }}>
                  {t("visibleToOwnerAfterPayment")}
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* STATE: Modal */}
      {step === "modal" && (
        <SectionCard>
          <SectionLabel>{t("revealIdentifier").toUpperCase()} — MODAL</SectionLabel>
          <div className="max-w-lg mx-auto">
            {/* Modal mock */}
            <div className="rounded-xl overflow-hidden shadow-xl" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                <div className="flex items-center gap-2">
                  <Unlock size={18} style={{ color: "var(--eco-primary)" }} />
                  <span className="text-[16px]" style={{ color: "var(--eco-text)" }}>{t("revealIdentifier")}</span>
                </div>
                <button onClick={() => setStep("masked")} className="cursor-pointer p-1 rounded" style={{ color: "var(--eco-text-tertiary)" }}>
                  <XCircle size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="p-5">
                {/* What you're revealing */}
                <div className="rounded-lg p-3 mb-5" style={{ background: "var(--eco-neutral-100)" }}>
                  <div className="text-[11px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{t("phoneMasked")}</div>
                  <code className="text-[15px]" style={{ color: "var(--eco-text)" }}>+7 7** *** ** 67</code>
                </div>

                {/* Reason select */}
                <div className="mb-4">
                  <label className="text-[13px] mb-1.5 block" style={{ color: "var(--eco-text)" }}>
                    {t("revealReason")} <span style={{ color: "var(--eco-danger-500)" }}>*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none appearance-none"
                    style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: reason ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}
                  >
                    <option value="">{t("selectReason")}</option>
                    {reasons.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Optional comment */}
                <div className="mb-5">
                  <label className="text-[13px] mb-1.5 block" style={{ color: "var(--eco-text)" }}>
                    {t("optionalComment")}
                  </label>
                  <textarea
                    placeholder={t("addContextComment")}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg text-[14px] outline-none resize-none"
                    style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
                  />
                </div>

                {/* Audit warning */}
                <div className="flex items-start gap-2 rounded-lg p-3 mb-5" style={{ background: "var(--eco-brand-50)" }}>
                  <ClipboardList size={14} className="shrink-0 mt-0.5" style={{ color: "var(--eco-brand-600)" }} />
                  <span className="text-[12px]" style={{ color: "var(--eco-brand-600)" }}>
                    {t("actionLogged")}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="ghost" size="md" className="flex-1" onClick={() => setStep("masked")}>
                    {t("cancel")}
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    className="flex-1"
                    disabled={!reason}
                    onClick={() => setStep("revealed")}
                  >
                    <Unlock size={14} />
                    {t("confirmReveal")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* STATE: Revealed */}
      {step === "revealed" && (
        <SectionCard>
          <SectionLabel>{t("accessGranted").toUpperCase()}</SectionLabel>
          <div className="max-w-md">
            <div className="rounded-xl p-5" style={{ background: "var(--eco-bg)", border: "2px solid var(--eco-success-500)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
                  <ShieldCheck size={18} style={{ color: "var(--eco-success-500)" }} />
                </div>
                <div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>User_a7k2m</div>
                  <Badge variant="success">{t("stateActive")}</Badge>
                </div>
              </div>

              {/* Revealed data */}
              <div className="flex flex-col gap-3 mb-4">
                <div className="rounded-lg p-3" style={{ background: "var(--eco-success-100)", border: "1px solid var(--eco-success-500)" }}>
                  <div className="text-[11px] mb-1" style={{ color: "var(--eco-success-500)" }}>{t("phoneNumber")}</div>
                  <code className="text-[16px]" style={{ color: "var(--eco-text)" }}>+7 705 123 45 67</code>
                </div>
              </div>

              {/* Audit hint */}
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--eco-brand-50)" }}>
                <ClipboardList size={12} style={{ color: "var(--eco-brand-600)" }} />
                <span className="text-[12px]" style={{ color: "var(--eco-brand-600)" }}>
                  {t("actionLogged")}
                </span>
                <span className="text-[11px] ml-auto" style={{ color: "var(--eco-text-tertiary)" }}>
                  2026-04-03 14:22:01
                </span>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* STATE: Access Denied */}
      {step === "denied" && (
        <SectionCard>
          <SectionLabel>{t("accessDenied").toUpperCase()}</SectionLabel>
          <div className="max-w-md">
            <div className="rounded-xl p-5" style={{ background: "var(--eco-bg)", border: "2px solid var(--eco-danger-500)" }}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--eco-danger-100)" }}>
                  <Ban size={22} style={{ color: "var(--eco-danger-500)" }} />
                </div>
                <div>
                  <div className="text-[16px]" style={{ color: "var(--eco-danger-500)" }}>{t("accessDenied")}</div>
                </div>
              </div>

              <p className="text-[14px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
                {t("accessDeniedDesc")}
              </p>

              <div className="rounded-lg p-3 mb-4" style={{ background: "var(--eco-neutral-100)" }}>
                <div className="text-[11px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{t("phoneMasked")}</div>
                <div className="flex items-center gap-2">
                  <code className="text-[15px]" style={{ color: "var(--eco-text-tertiary)" }}>+7 7** *** ** 67</code>
                  <Lock size={14} style={{ color: "var(--eco-danger-500)" }} />
                </div>
              </div>

              <Button variant="secondary" size="sm" onClick={() => setStep("masked")}>
                {t("contactSupport")}
              </Button>
            </div>
          </div>
        </SectionCard>
      )}
    </div>
  );
}

/* ─── C) Audit Trail Block ─── */
function AuditTrailFrame() {
  const { t } = useI18n();

  const auditEntries = [
    {
      id: "aud-1",
      actor: "admin@ecosplit.kz",
      role: "Admin",
      roleVariant: "danger" as const,
      timestamp: "2026-04-03 14:22:01",
      action: t("auditViewedPhone"),
      reason: t("reasonPaymentDispute"),
      entity: "room_id: RM-0412 / member_id: MEM-7834",
    },
    {
      id: "aud-2",
      actor: "owner_serik_42",
      role: t("owner"),
      roleVariant: "warning" as const,
      timestamp: "2026-04-03 13:15:44",
      action: t("auditRevealedIdentifier"),
      reason: t("reasonAccessProvisioning"),
      entity: "room_id: RM-0412 / member_id: MEM-2291",
    },
    {
      id: "aud-3",
      actor: "admin@ecosplit.kz",
      role: "Admin",
      roleVariant: "danger" as const,
      timestamp: "2026-04-02 18:03:12",
      action: t("auditBlockedMember"),
      reason: t("reasonComplianceCheck"),
      entity: "room_id: RM-0399 / member_id: MEM-1120",
    },
    {
      id: "aud-4",
      actor: "admin@ecosplit.kz",
      role: "Admin",
      roleVariant: "danger" as const,
      timestamp: "2026-04-02 11:45:00",
      action: t("auditApprovedRefund"),
      reason: t("reasonSupportEscalation"),
      entity: "room_id: RM-0388 / payment_id: PAY-9921",
    },
    {
      id: "aud-5",
      actor: "owner_dana_99",
      role: t("owner"),
      roleVariant: "warning" as const,
      timestamp: "2026-04-01 09:20:33",
      action: t("auditViewedContract"),
      reason: t("reasonVerifyIdentity"),
      entity: "room_id: RM-0377 / member_id: MEM-5501",
    },
  ];

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>
        C) {t("auditTrail")}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("allRevealsAudited")}
      </p>

      <SectionCard className="mb-6">
        <SectionLabel>AUDIT TRAIL — REUSABLE BLOCK COMPONENT</SectionLabel>
        <p className="text-[13px] mb-5" style={{ color: "var(--eco-text-secondary)" }}>
          {t("usedOn")}: Admin Dashboard, {t("roomDetailsPage")}, Disputes
        </p>

        <div className="flex flex-col gap-0">
          {auditEntries.map((entry, i) => (
            <div key={entry.id}>
              {/* Desktop */}
              <div
                className="hidden md:grid grid-cols-[180px_120px_1fr_1fr] gap-4 py-3.5 items-start"
                style={{ borderBottom: i < auditEntries.length - 1 ? "1px solid var(--eco-border)" : "none" }}
              >
                {/* Timestamp + Actor */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={11} style={{ color: "var(--eco-text-tertiary)" }} />
                    <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{entry.timestamp}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{entry.actor}</span>
                    <Badge variant={entry.roleVariant}>{entry.role}</Badge>
                  </div>
                </div>

                {/* Action */}
                <div>
                  <div className="text-[11px] mb-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{t("auditAction")}</div>
                  <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{entry.action}</span>
                </div>

                {/* Reason */}
                <div>
                  <div className="text-[11px] mb-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{t("auditReason")}</div>
                  <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{entry.reason}</span>
                </div>

                {/* Entity */}
                <div>
                  <div className="text-[11px] mb-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{t("auditEntity")}</div>
                  <code className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>
                    {entry.entity}
                  </code>
                </div>
              </div>

              {/* Mobile card */}
              <div
                className="md:hidden rounded-lg p-3.5 mb-2"
                style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{entry.actor}</span>
                    <Badge variant={entry.roleVariant}>{entry.role}</Badge>
                  </div>
                </div>
                <div className="text-[13px] mb-1" style={{ color: "var(--eco-text)" }}>{entry.action}</div>
                <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-secondary)" }}>
                  {t("auditReason")}: {entry.reason}
                </div>
                <code className="text-[10px] px-1.5 py-0.5 rounded inline-block mb-1.5" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-tertiary)" }}>
                  {entry.entity}
                </code>
                <div className="flex items-center gap-1 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  <Clock size={10} /> {entry.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Anatomy callout */}
      <SectionCard>
        <SectionLabel>AUDIT ENTRY ANATOMY</SectionLabel>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { icon: UserCog, label: t("auditActor"), desc: "role + identifier" },
            { icon: Clock, label: t("auditTimestamp"), desc: "ISO 8601" },
            { icon: FileText, label: t("auditAction"), desc: "viewed / revealed / blocked" },
            { icon: Info, label: t("auditReason"), desc: "from reason select" },
            { icon: ExternalLink, label: t("auditEntity"), desc: "room_id / member_id" },
          ].map((field, i) => (
            <div key={`anat-${i}`} className="rounded-lg p-3 text-center" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
              <field.icon size={16} className="mx-auto mb-1.5" style={{ color: "var(--eco-primary)" }} />
              <div className="text-[12px] mb-0.5" style={{ color: "var(--eco-text)" }}>{field.label}</div>
              <div className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{field.desc}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── D) No Direct Contacts Callout ─── */
function NoDirectContactsFrame() {
  const { t } = useI18n();

  const rules = [
    { key: "rule1", text: t("noDirectContactsRule1"), icon: EyeOff },
    { key: "rule2", text: t("noDirectContactsRule2"), icon: Eye },
    { key: "rule3", text: t("noDirectContactsRule3"), icon: ClipboardList },
    { key: "rule4", text: t("noDirectContactsRule4"), icon: MessageSquareOff },
  ];

  const usedOnPages = [
    { key: "p-room", label: t("roomDetailsPage"), icon: FileText },
    { key: "p-profile", label: t("profilePage"), icon: User },
    { key: "p-join", label: t("joinFlowPage"), icon: ChevronRight },
    { key: "p-support", label: t("supportPages"), icon: Shield },
    { key: "p-admin", label: t("adminPanels"), icon: UserCog },
  ];

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>
        D) {t("noDirectContacts")}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t("noDirectContactsDesc")}
      </p>

      {/* Main callout component — all 3 variants */}
      <SectionCard className="mb-6">
        <SectionLabel>CALLOUT COMPONENT — 3 VARIANTS</SectionLabel>

        <div className="flex flex-col gap-4">
          {/* Variant 1: Compact inline */}
          <div>
            <div className="text-[11px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>COMPACT (inline)</div>
            <div className="flex items-center gap-2.5 rounded-lg px-4 py-3" style={{ background: "var(--eco-brand-50)", border: "1px solid var(--eco-brand-200)" }}>
              <MessageSquareOff size={16} style={{ color: "var(--eco-brand-600)" }} />
              <span className="text-[13px]" style={{ color: "var(--eco-brand-600)" }}>
                {t("noDirectContactsTitle")}
              </span>
            </div>
          </div>

          {/* Variant 2: Standard with description */}
          <div>
            <div className="text-[11px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>STANDARD (with description)</div>
            <div className="rounded-xl p-4" style={{ background: "var(--eco-brand-50)", border: "1px solid var(--eco-brand-200)" }}>
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-100)" }}>
                  <MessageSquareOff size={16} style={{ color: "var(--eco-brand-600)" }} />
                </div>
                <span className="text-[14px]" style={{ color: "var(--eco-brand-600)" }}>
                  {t("noDirectContactsTitle")}
                </span>
              </div>
              <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {t("noDirectContactsDesc")}
              </p>
            </div>
          </div>

          {/* Variant 3: Full with rules */}
          <div>
            <div className="text-[11px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>EXPANDED (with rules list)</div>
            <div className="rounded-xl p-5" style={{ background: "var(--eco-brand-50)", border: "1px solid var(--eco-brand-200)" }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-100)" }}>
                  <Shield size={20} style={{ color: "var(--eco-brand-600)" }} />
                </div>
                <div>
                  <div className="text-[15px]" style={{ color: "var(--eco-brand-600)" }}>
                    {t("noDirectContactsTitle")}
                  </div>
                </div>
              </div>
              <p className="text-[13px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
                {t("noDirectContactsDesc")}
              </p>
              <div className="flex flex-col gap-2.5">
                {rules.map((rule) => (
                  <div key={rule.key} className="flex items-start gap-2.5">
                    <rule.icon size={14} className="shrink-0 mt-0.5" style={{ color: "var(--eco-brand-600)" }} />
                    <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{rule.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Where it's used */}
      <SectionCard>
        <SectionLabel>{t("usedOn").toUpperCase()}</SectionLabel>
        <p className="text-[13px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
          This reusable callout appears across five different contexts in the application.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {usedOnPages.map((page) => (
            <div
              key={page.key}
              className="rounded-lg p-3 text-center"
              style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}
            >
              <page.icon size={18} className="mx-auto mb-2" style={{ color: "var(--eco-primary)" }} />
              <div className="text-[12px]" style={{ color: "var(--eco-text)" }}>{page.label}</div>
            </div>
          ))}
        </div>

        {/* In-context previews */}
        <div className="mt-6">
          <SectionLabel>IN-CONTEXT PREVIEW — ROOM DETAIL CARD</SectionLabel>
          <div className="max-w-md rounded-xl overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
            <div className="p-4" style={{ background: "var(--eco-bg)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[15px]" style={{ color: "var(--eco-text)" }}>Beeline Family 30GB</span>
                <Badge variant="success">ACTIVE</Badge>
              </div>
              <div className="flex items-center gap-2 mb-3 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                <User size={14} /> 3/5 {t("members")}
              </div>
              <div className="rounded-lg p-3 mb-3" style={{ background: "var(--eco-neutral-100)" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>User_m2k9x</div>
                    <code className="text-[13px]" style={{ color: "var(--eco-text)" }}>+7 7** *** ** 45</code>
                  </div>
                  <button className="flex items-center gap-1 px-2 py-1 rounded text-[11px]" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)", color: "var(--eco-primary)" }}>
                    <Eye size={10} /> {t("viewFull")}
                  </button>
                </div>
              </div>
              {/* Callout inline */}
              <div className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: "var(--eco-brand-50)", border: "1px solid var(--eco-brand-200)" }}>
                <MessageSquareOff size={13} style={{ color: "var(--eco-brand-600)" }} />
                <span className="text-[11px]" style={{ color: "var(--eco-brand-600)" }}>
                  {t("noDirectContactsTitle")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

/* ─── Main Page ─── */
export function PrivacyAuditPatternsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"masking" | "reveal" | "audit" | "nocontact">("masking");

  const tabs = [
    { id: "masking" as const, label: `A) ${t("identifierMasking")}` },
    { id: "reveal" as const, label: `B) ${t("revealFlow")}` },
    { id: "audit" as const, label: `C) ${t("auditTrail")}` },
    { id: "nocontact" as const, label: `D) ${t("noDirectContacts")}` },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>
            Page 10
          </span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
            Security
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>
          {t("privacyAuditTitle")}
        </h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>
          {t("privacyAuditSubtitle")}
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

      {/* Content */}
      {tab === "masking" && <IdentifierMaskingFrame />}
      {tab === "reveal" && <RevealFlowFrame />}
      {tab === "audit" && <AuditTrailFrame />}
      {tab === "nocontact" && <NoDirectContactsFrame />}
    </div>
  );
}
