import { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X, AlertCircle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { BrandLogo } from "./brand-logo";
import { useI18n, type Language } from "./i18n-provider";

// ─── Wave SVG ───
// The flipped variant uses a mirrored path instead of CSS scaleY(-1): negative
// scale on a stretched SVG wedges Chrome's compositor capture on some GPUs.
export function WaveDivider({ flip, className }: { flip?: boolean; className?: string }) {
  return (
    <svg
      viewBox="0 0 1440 80"
      fill="none"
      className={className}
      style={{ display: "block", width: "100%" }}
      preserveAspectRatio="none"
    >
      <path
        d={flip
          ? "M0 40C240 0 480 80 720 40C960 0 1200 80 1440 40V0H0V40Z"
          : "M0 40C240 80 480 0 720 40C960 80 1200 0 1440 40V80H0V40Z"}
        fill="var(--eco-surface)"
      />
    </svg>
  );
}

// ─── Buttons ───
type BtnVariant = "primary" | "secondary" | "ghost" | "destructive";
type BtnSize = "sm" | "md" | "lg";

const btnBase = "inline-flex items-center justify-center gap-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
const btnVariants: Record<BtnVariant, string> = {
  primary: "",
  secondary: "",
  ghost: "",
  destructive: "",
};
const btnSizes: Record<BtnSize, string> = {
  sm: "px-3 py-1.5 text-[13px]",
  md: "px-4 py-2 text-[14px]",
  lg: "px-6 py-3 text-[15px]",
};

function getBtnStyle(variant: BtnVariant): React.CSSProperties {
  switch (variant) {
    case "primary":
      return { background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" };
    case "secondary":
      return { background: "transparent", color: "var(--eco-text)", border: "1px solid var(--eco-border-strong)" };
    case "ghost":
      return { background: "transparent", color: "var(--eco-text-secondary)" };
    case "destructive":
      return { background: "var(--eco-negative)", color: "#fff" };
  }
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
}

export function Button({ variant = "primary", size = "md", loading, children, className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`${btnBase} ${btnVariants[variant]} ${btnSizes[size]} ${className}`}
      style={getBtnStyle(variant)}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}

// ─── Input ───
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label style={{ color: "var(--eco-text)", fontSize: 14 }}>{label}</label>}
      <input
        className={`px-3 py-2 rounded-lg outline-none transition-colors ${className}`}
        style={{
          background: "var(--eco-surface)",
          border: `1px solid ${error ? "var(--eco-negative)" : "var(--eco-border)"}`,
          color: "var(--eco-text)",
          fontSize: 14,
        }}
        {...props}
      />
      {error && <span style={{ color: "var(--eco-negative)", fontSize: 12 }}>{error}</span>}
      {hint && !error && <span style={{ color: "var(--eco-text-tertiary)", fontSize: 12 }}>{hint}</span>}
    </div>
  );
}

// ─── Select ───
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, options, className = "", ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label style={{ color: "var(--eco-text)", fontSize: 14 }}>{label}</label>}
      <div className="relative">
        <select
          className={`w-full appearance-none px-3 py-2 pr-8 rounded-lg outline-none ${className}`}
          style={{
            background: "var(--eco-surface)",
            border: "1px solid var(--eco-border)",
            color: "var(--eco-text)",
            fontSize: 14,
          }}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--eco-text-tertiary)" }} />
      </div>
    </div>
  );
}

// ─── Tabs ───
type TabItem = string | { id: string; label: string };

export function Tabs({ tabs, active, onChange }: { tabs: TabItem[]; active: string; onChange: (t: string) => void }) {
  return (
    <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: "var(--eco-border)" }}>
      {tabs.map((tab) => {
        const id = typeof tab === "string" ? tab : tab.id;
        const label = typeof tab === "string" ? tab : tab.label;

        return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="px-4 py-2.5 text-[14px] whitespace-nowrap transition-colors cursor-pointer shrink-0"
          style={{
            color: active === id ? "var(--eco-primary)" : "var(--eco-text-secondary)",
            borderBottom: active === id ? "2px solid var(--eco-primary)" : "2px solid transparent",
            marginBottom: -1,
          }}
        >
          {label}
        </button>
        );
      })}
    </div>
  );
}

// ─── Badge / Pill ───
type BadgeVariant = "default" | "success" | "warning" | "danger" | "info";

const badgeColors: Record<BadgeVariant, { bg: string; text: string }> = {
  default: { bg: "var(--eco-neutral-100)", text: "var(--eco-text-secondary)" },
  success: { bg: "var(--eco-success-100)", text: "var(--eco-success-500)" },
  warning: { bg: "var(--eco-warning-100)", text: "var(--eco-warning-500)" },
  danger: { bg: "var(--eco-danger-100)", text: "var(--eco-danger-500)" },
  info: { bg: "var(--eco-brand-50)", text: "var(--eco-brand-600)" },
};

export function Badge({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  const c = badgeColors[variant];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[12px]"
      style={{ background: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
}

export function Pill({ children, variant = "default" }: { children: ReactNode; variant?: BadgeVariant }) {
  const c = badgeColors[variant];
  return (
    <span
      className="inline-flex items-center px-3 py-1 rounded-full text-[12px]"
      style={{ background: c.bg, color: c.text }}
    >
      {children}
    </span>
  );
}

// ─── Status Badges ───
const memberStatusMap: Record<string, BadgeVariant> = {
  APPLIED: "info",
  PENDING: "warning",
  ACTIVE: "success",
  REJECTED: "danger",
  BLOCKED: "danger",
};

const roomStatusMap: Record<string, BadgeVariant> = {
  OPEN: "info",
  IN_VERIFICATION: "warning",
  ACTIVE: "success",
  COMPLETED: "default",
  CANCELLED: "danger",
  BLOCKED: "danger",
};

export const statusLabel = (status: string, lang: Language) => {
  const labels: Record<string, { ru: string; kz: string; en: string }> = {
    APPLIED: { ru: "Заявка", kz: "Өтінім", en: "Applied" },
    PENDING: { ru: "Ожидает", kz: "Күтуде", en: "Pending" },
    ACTIVE: { ru: "Активно", kz: "Белсенді", en: "Active" },
    REJECTED: { ru: "Отклонено", kz: "Қабылданбады", en: "Rejected" },
    BLOCKED: { ru: "Заблокировано", kz: "Бұғатталған", en: "Blocked" },
    BLOCKED_BY_ADMIN: { ru: "Заблокировано", kz: "Бұғатталған", en: "Blocked" },
    OPEN: { ru: "Открыта", kz: "Ашық", en: "Open" },
    IN_VERIFICATION: { ru: "На проверке", kz: "Тексеруде", en: "In verification" },
    COMPLETED: { ru: "Завершена", kz: "Аяқталды", en: "Completed" },
    CANCELLED: { ru: "Отменена", kz: "Бас тартылды", en: "Cancelled" },
  };

  return labels[status]?.[lang] ?? status;
};

export function MemberStatusBadge({ status }: { status: string }) {
  const { language } = useI18n();
  return <Badge variant={memberStatusMap[status] || "default"}>{statusLabel(status, language)}</Badge>;
}

export function RoomStatusBadge({ status }: { status: string }) {
  const { language } = useI18n();
  return <Badge variant={roomStatusMap[status] || "default"}>{statusLabel(status, language)}</Badge>;
}

// ─── Cards ───
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-5 ${className}`}
      style={{
        background: "var(--eco-surface-raised)",
        border: "1px solid var(--eco-border)",
      }}
    >
      {children}
    </div>
  );
}

export function PlanCard({ name, price, features, popular }: { name: string; price: string; features: string[]; popular?: boolean }) {
  return (
    <Card className={`flex flex-col gap-4 relative ${popular ? "ring-2" : ""}`} >
      {popular && (
        <span
          className="absolute -top-3 left-4 px-2 py-0.5 rounded text-[11px]"
          style={{ background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" }}
        >
          Popular
        </span>
      )}
      <div>
        <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{name}</div>
        <div className="text-[28px] mt-1" style={{ color: "var(--eco-text)" }}>{price}</div>
      </div>
      <ul className="flex flex-col gap-2">
        {features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            <Check size={14} style={{ color: "var(--eco-positive)" }} />
            {f}
          </li>
        ))}
      </ul>
      <Button variant={popular ? "primary" : "secondary"} size="md" className="mt-auto w-full">Choose Plan</Button>
    </Card>
  );
}

export function RoomCard({ title, operator, members, maxMembers, status }: { title: string; operator: string; members: number; maxMembers: number; status: string }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[15px]" style={{ color: "var(--eco-text)" }}>{title}</span>
        <RoomStatusBadge status={status} />
      </div>
      <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{operator}</div>
      <div className="flex items-center gap-2">
        <div
          className="h-1.5 rounded-full flex-1"
          style={{ background: "var(--eco-neutral-200)" }}
        >
          <div
            className="h-1.5 rounded-full transition-all"
            style={{ width: `${(members / maxMembers) * 100}%`, background: "var(--eco-primary)" }}
          />
        </div>
        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {members}/{maxMembers}
        </span>
      </div>
    </Card>
  );
}

export function PriceBreakdownCard() {
  const items = [
    { label: "Plan cost", value: "₸4,990" },
    { label: "Members (4)", value: "÷4" },
    { label: "Your share", value: "₸1,248", bold: true },
    { label: "Service fee", value: "₸99" },
  ];
  return (
    <Card className="flex flex-col gap-3">
      <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Price Breakdown</div>
      {items.map((i) => (
        <div key={i.label} className="flex justify-between text-[13px]">
          <span style={{ color: "var(--eco-text-secondary)" }}>{i.label}</span>
          <span style={{ color: i.bold ? "var(--eco-text)" : "var(--eco-text-secondary)" }}>{i.value}</span>
        </div>
      ))}
      <div className="border-t pt-3 flex justify-between text-[14px]" style={{ borderColor: "var(--eco-border)" }}>
        <span style={{ color: "var(--eco-text)" }}>Total / month</span>
        <span style={{ color: "var(--eco-primary)" }}>₸1,347</span>
      </div>
    </Card>
  );
}

export function StatusCard({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <Card className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{title}</div>
        <div className="text-[13px] mt-0.5" style={{ color: "var(--eco-text-secondary)" }}>{description}</div>
      </div>
    </Card>
  );
}

// ─── Table Row ───
export function TableRow({ cells, header }: { cells: ReactNode[]; header?: boolean }) {
  const Tag = header ? "th" : "td";
  return (
    <tr style={{ borderBottom: "1px solid var(--eco-border)" }}>
      {cells.map((c, i) => (
        <Tag
          key={i}
          className={`px-4 py-3 text-left text-[13px] ${header ? "" : ""}`}
          style={{
            color: header ? "var(--eco-text-tertiary)" : "var(--eco-text)",
            background: header ? "var(--eco-surface)" : "transparent",
          }}
        >
          {c}
        </Tag>
      ))}
    </tr>
  );
}

// ─── Empty State ───
export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "var(--eco-surface)" }}
      >
        <Info size={20} style={{ color: "var(--eco-text-tertiary)" }} />
      </div>
      <div className="text-[15px] mb-1" style={{ color: "var(--eco-text)" }}>{title}</div>
      <div className="text-[13px] max-w-xs" style={{ color: "var(--eco-text-secondary)" }}>{description}</div>
    </div>
  );
}

// ─── Skeleton ───
export function Skeleton({ width = "100%", height = 16, rounded = 6 }: { width?: string | number; height?: number; rounded?: number }) {
  return (
    <div
      className="animate-pulse"
      style={{
        width,
        height,
        borderRadius: rounded,
        background: "var(--eco-neutral-200)",
      }}
    />
  );
}

export function SkeletonCard() {
  return (
    <Card className="flex flex-col gap-3">
      <Skeleton width="60%" height={14} />
      <Skeleton width="40%" height={24} />
      <Skeleton height={12} />
      <Skeleton height={12} />
      <Skeleton height={36} rounded={8} />
    </Card>
  );
}

// ─── Toast ───
type ToastType = "success" | "error" | "info" | "warning";
const toastIcons: Record<ToastType, ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error: <AlertCircle size={16} />,
  info: <Info size={16} />,
  warning: <AlertCircle size={16} />,
};
const toastColors: Record<ToastType, { bg: string; text: string; icon: string }> = {
  success: { bg: "var(--eco-success-100)", text: "var(--eco-text)", icon: "var(--eco-success-500)" },
  error: { bg: "var(--eco-danger-100)", text: "var(--eco-text)", icon: "var(--eco-danger-500)" },
  info: { bg: "var(--eco-brand-50)", text: "var(--eco-text)", icon: "var(--eco-brand-600)" },
  warning: { bg: "var(--eco-warning-100)", text: "var(--eco-text)", icon: "var(--eco-warning-500)" },
};

export function ToastExample({ type = "success", message }: { type?: ToastType; message: string }) {
  const c = toastColors[type];
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-lg shadow-sm"
      style={{ background: c.bg, color: c.text }}
    >
      <span style={{ color: c.icon }}>{toastIcons[type]}</span>
      <span className="text-[13px] flex-1">{message}</span>
      <X size={14} className="cursor-pointer" style={{ color: "var(--eco-text-tertiary)" }} />
    </div>
  );
}

// ─── Modal ───
export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl p-6 shadow-xl mx-4"
        style={{ background: "var(--eco-bg)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[16px]" style={{ color: "var(--eco-text)" }}>{title}</span>
          <button onClick={onClose} className="cursor-pointer p-1 rounded hover:bg-black/5">
            <X size={18} style={{ color: "var(--eco-text-tertiary)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Drawer ───
export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className="relative w-full max-w-sm h-full p-6 shadow-xl overflow-y-auto"
        style={{ background: "var(--eco-bg)" }}
      >
        <div className="flex items-center justify-between mb-6">
          <span className="text-[16px]" style={{ color: "var(--eco-text)" }}>{title}</span>
          <button onClick={onClose} className="cursor-pointer p-1 rounded hover:bg-black/5">
            <X size={18} style={{ color: "var(--eco-text-tertiary)" }} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Stepper ───
export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-1 -mx-1 px-1">
      {steps.map((s, i) => (
        <div key={s} className="flex items-center shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-[12px] shrink-0"
              style={{
                background: i <= current ? "var(--eco-primary)" : "var(--eco-neutral-200)",
                color: i <= current ? "var(--eco-text-on-primary)" : "var(--eco-text-tertiary)",
              }}
            >
              {i < current ? <Check size={14} /> : i + 1}
            </div>
            <span
              className="hidden sm:inline text-[13px] whitespace-nowrap"
              style={{ color: i <= current ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}
            >
              {s}
            </span>
            <span
              className="sm:hidden text-[12px] whitespace-nowrap"
              style={{ color: i === current ? "var(--eco-text)" : "var(--eco-text-tertiary)" }}
            >
              {i === current ? s : ""}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className="w-6 sm:w-8 h-px mx-2 shrink-0"
              style={{ background: i < current ? "var(--eco-primary)" : "var(--eco-neutral-200)" }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Language Switcher ───
export function LanguageSwitcher({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const langs = [
    { code: "ru", label: "Рус" },
    { code: "kz", label: "Қазақ" },
    { code: "en", label: "English" },
  ];
  return (
    <div className="flex items-center rounded-lg overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
      {langs.map((l) => (
        <button
          key={l.code}
          onClick={() => onChange(l.code)}
          className="px-3 py-1.5 text-[12px] cursor-pointer transition-colors"
          style={{
            background: value === l.code ? "var(--eco-primary)" : "transparent",
            color: value === l.code ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
          }}
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}

// ─── Top Nav ───
export function TopNav() {
  const [lang, setLang] = useState("ru");
  return (
    <nav
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}
    >
      <div className="flex items-center gap-6">
        <BrandLogo size="md" />
        <div className="hidden md:flex items-center gap-4">
          {["Plans", "Rooms", "Dashboard"].map((item) => (
            <a key={item} href="#" className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{item}</a>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher value={lang} onChange={setLang} />
        <Button variant="ghost" size="sm">Sign In</Button>
        <Button variant="primary" size="sm">Sign Up</Button>
      </div>
    </nav>
  );
}