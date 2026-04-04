import { useState } from "react";
import { useI18n } from "../i18n-provider";
import { Badge } from "../ds-primitives";
import {
  AlertTriangle, ArrowRight, Ban, Bookmark, Box, Check, CheckCircle2,
  ChevronRight, Clock, Code2, CreditCard, DoorOpen, Eye, FileText,
  Globe2, Hash, Icon, Key, Languages, Layers, LayoutGrid, Lightbulb,
  Lock, MessageSquare, Minus, Palette, Pen, PenTool, Scale,
  Shield, ShieldCheck, Slash, Smartphone, Sparkles, Tag, Target,
  Type, X, XCircle, Zap,
} from "lucide-react";

/* ─── shared primitives ─── */
const SC = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-6 ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>
);
const SL = ({ children }: { children: string }) => (
  <div className="text-[11px] mb-3 tracking-wide" style={{ color: "var(--eco-text-tertiary)" }}>{children}</div>
);

function DoBox({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg overflow-hidden flex-1" style={{ border: "1px solid var(--eco-success-300)" }}>
      <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ background: "var(--eco-success-100)" }}>
        <CheckCircle2 size={11} style={{ color: "var(--eco-success-500)" }} />
        <span className="text-[10px]" style={{ color: "var(--eco-success-500)" }}>{t("govDo")}</span>
      </div>
      <div className="p-3 text-[12px]" style={{ color: "var(--eco-text)" }}>{children}</div>
    </div>
  );
}

function DontBox({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="rounded-lg overflow-hidden flex-1" style={{ border: "1px solid var(--eco-danger-300)" }}>
      <div className="px-3 py-1.5 flex items-center gap-1.5" style={{ background: "var(--eco-danger-100)" }}>
        <XCircle size={11} style={{ color: "var(--eco-danger-500)" }} />
        <span className="text-[10px]" style={{ color: "var(--eco-danger-500)" }}>{t("govDont")}</span>
      </div>
      <div className="p-3 text-[12px]" style={{ color: "var(--eco-text)" }}>{children}</div>
    </div>
  );
}

function RuleRow({ rule, why }: { rule: string; why: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg px-4 py-3" style={{ background: "var(--eco-bg)" }}>
      <ChevronRight size={12} className="mt-1 shrink-0" style={{ color: "var(--eco-primary)" }} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{rule}</div>
        <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{why}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   A) TOKEN RULES
   ═══════════════════════════════════════════ */
function TokenRulesSection() {
  const { t } = useI18n();

  const tokenPairs = [
    { semantic: "--eco-primary", raw: "#E07A5F", desc: "Brand action color", usage: "Buttons, active tabs, links" },
    { semantic: "--eco-text", raw: "#1A1A2E", desc: "Primary text", usage: "Headings, body, labels" },
    { semantic: "--eco-text-secondary", raw: "#6B7280", desc: "Secondary text", usage: "Descriptions, help text" },
    { semantic: "--eco-surface", raw: "#FFFFFF", desc: "Card/panel bg", usage: "Cards, modals, drawers" },
    { semantic: "--eco-bg", raw: "#F8F8FA", desc: "Page background", usage: "Page bg, table header bg" },
    { semantic: "--eco-border", raw: "#E5E7EB", desc: "Default border", usage: "Cards, dividers, inputs" },
    { semantic: "--eco-success-500", raw: "#22C55E", desc: "Positive status", usage: "Badges, icons, toasts" },
    { semantic: "--eco-danger-500", raw: "#EF4444", desc: "Negative status", usage: "Error, destructive actions" },
    { semantic: "--eco-warning-500", raw: "#F59E0B", desc: "Caution", usage: "Pending, attention badges" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Palette size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>A) {t("sectionTokenRules")}</h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: "var(--eco-text-secondary)" }}>
        Semantic tokens only. No raw hex/rgb colors anywhere in components.
      </p>

      {/* Rules */}
      <SC className="mb-5">
        <SL>CORE RULES</SL>
        <div className="flex flex-col gap-2">
          <RuleRow rule="Always use semantic token names (--eco-*)" why="Enables Eco Coral ↔ Eco Blue theme switching without code changes" />
          <RuleRow rule="Never hardcode hex values (#E07A5F) in components" why="Breaks theming — color will not adapt when user switches theme" />
          <RuleRow rule="Use -100 / -300 / -500 scale for status colors" why="100 = background fill, 300 = border, 500 = text/icon" />
          <RuleRow rule="Surface hierarchy: --eco-bg → --eco-surface → --eco-surface-raised" why="Maintains visual depth — page, card, elevated card" />
          <RuleRow rule="Spacing: multiples of 8px only (8, 16, 24, 32, 40, 48)" why="8pt grid keeps all whitespace harmonious across breakpoints" />
        </div>
      </SC>

      {/* Do / Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <DoBox>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-1" style={{ background: "var(--eco-bg)" }}>
            {'style={{ color: "var(--eco-text)" }}'}
          </code>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-1" style={{ background: "var(--eco-bg)" }}>
            {'style={{ background: "var(--eco-success-100)" }}'}
          </code>
          <code className="text-[11px] block rounded px-2 py-1.5" style={{ background: "var(--eco-bg)" }}>
            {'className="p-4 gap-3"   /* 16px, 12px — 8pt grid */'}
          </code>
        </DoBox>
        <DontBox>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-1" style={{ background: "var(--eco-bg)" }}>
            {'style={{ color: "#1A1A2E" }}  '}
            <span style={{ color: "var(--eco-danger-500)" }}>← raw hex</span>
          </code>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-1" style={{ background: "var(--eco-bg)" }}>
            {'style={{ background: "green" }}  '}
            <span style={{ color: "var(--eco-danger-500)" }}>← CSS name</span>
          </code>
          <code className="text-[11px] block rounded px-2 py-1.5" style={{ background: "var(--eco-bg)" }}>
            {'className="p-[13px]"  '}
            <span style={{ color: "var(--eco-danger-500)" }}>← off-grid</span>
          </code>
        </DontBox>
      </div>

      {/* Token reference table */}
      <SC>
        <SL>SEMANTIC TOKEN REFERENCE</SL>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--eco-bg)" }}>
                {["Token", "Swatch", "Purpose", "Usage"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tokenPairs.map((tp) => (
                <tr key={tp.semantic} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                  <td className="px-3 py-2.5">
                    <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{tp.semantic}</code>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded" style={{ background: `var(${tp.semantic})`, border: "1px solid var(--eco-border)" }} />
                      <span className="text-[10px] tabular-nums" style={{ color: "var(--eco-text-tertiary)" }}>{tp.raw}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: "var(--eco-text)" }}>{tp.desc}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--eco-text-secondary)" }}>{tp.usage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════
   B) COMPONENT RULES
   ═══════════════════════════════════════════ */
function ComponentRulesSection() {
  const { t } = useI18n();

  const components = [
    { name: "Button", variants: ["primary", "secondary", "ghost", "destructive"], sizes: ["sm", "md", "lg"], rule: "Never create a new button style. Extend via variant prop." },
    { name: "Badge", variants: ["success", "danger", "warning", "info", "default"], sizes: ["—"], rule: "All status indicators must use Badge. No ad-hoc colored spans." },
    { name: "Card", variants: ["default", "elevated (surface-raised)"], sizes: ["—"], rule: "Wrap all content blocks in Card. Never style raw divs as cards." },
    { name: "Input / Select", variants: ["default", "error", "disabled"], sizes: ["md"], rule: "Use ds-primitives Input/Select. No raw <input> elements." },
    { name: "Toast", variants: ["success", "error", "warning", "info"], sizes: ["—"], rule: "Toasts only via the toast system. No inline alerts for transient messages." },
    { name: "Modal / Sheet", variants: ["center modal", "bottom sheet (mobile)"], sizes: ["sm", "md", "lg"], rule: "All overlays through one Modal component. No custom positioned divs." },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Box size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>B) {t("sectionCompRules")}</h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: "var(--eco-text-secondary)" }}>
        Don't create new primitives — extend existing variants. One source of truth.
      </p>

      {/* Golden rule */}
      <div className="rounded-xl px-5 py-4 mb-5 flex items-start gap-3" style={{ background: "var(--eco-warning-100)", border: "1px solid var(--eco-warning-300)" }}>
        <Lightbulb size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning-500)" }} />
        <div>
          <div className="text-[13px]" style={{ color: "var(--eco-warning-500)" }}>Golden Rule: "If it exists in ds-primitives, use it. If it doesn't, add a variant there — never in the feature module."</div>
          <div className="text-[11px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>All reusable UI must live in <code className="px-1 rounded" style={{ background: "var(--eco-neutral-100)" }}>ds-primitives.tsx</code>. Feature pages only compose primitives.</div>
        </div>
      </div>

      {/* Component registry */}
      <SC className="!p-0 overflow-hidden mb-5">
        <div className="px-5 py-3" style={{ background: "var(--eco-bg)", borderBottom: "1px solid var(--eco-border)" }}>
          <SL>COMPONENT REGISTRY</SL>
        </div>
        <div className="divide-y" style={{ borderColor: "var(--eco-border)" }}>
          {components.map((c) => (
            <div key={c.name} className="px-5 py-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{c.name}</span>
                <div className="flex gap-1">
                  {c.variants.map((v) => (
                    <span key={v} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{v}</span>
                  ))}
                </div>
              </div>
              <div className="text-[12px] flex items-start gap-2" style={{ color: "var(--eco-text-secondary)" }}>
                <Shield size={11} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
                {c.rule}
              </div>
            </div>
          ))}
        </div>
      </SC>

      {/* Do/Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DoBox>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-2" style={{ background: "var(--eco-bg)" }}>
            {'<Button variant="primary" size="md">'}
            <br />{'  Submit'}
            <br />{'</Button>'}
          </code>
          <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Uses existing variant + size</span>
        </DoBox>
        <DontBox>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-2" style={{ background: "var(--eco-bg)" }}>
            {'<button className="bg-coral-500'}
            <br />{'  text-white rounded-xl py-3">'}
            <br />{'  Submit</button>'}
          </code>
          <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Custom button bypasses the design system</span>
        </DontBox>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   C) COPY RULES
   ═══════════════════════════════════════════ */
function CopyRulesSection() {
  const { t } = useI18n();

  const toneRules = [
    { rule: "Calm, clear, helpful", example: "Payment didn't go through. Try another card.", bad: "PAYMENT FAILED!!! ERROR CODE 502." },
    { rule: "Short — 1 sentence max for toasts, 2 for modals", example: "Room joined successfully.", bad: "Congratulations! You have successfully joined the room. You will now be redirected to your rooms page." },
    { rule: "No blame — frame as 'what to do next'", example: "We couldn't verify your plan. Please re-upload.", bad: "You uploaded an invalid document." },
    { rule: "No jargon or internal codes", example: "Something went wrong. Please try again.", bad: "Error: INTERNAL_SERVER_ERROR at /api/v2/rooms" },
  ];

  const banned = [
    { phrase: "Error code: XXX", why: "Exposes internals, scares users" },
    { phrase: "Invalid / Illegal", why: "Blaming tone — use 'couldn't process' or 'please check'" },
    { phrase: "Click here", why: "Non-descriptive link text, poor for a11y" },
    { phrase: "Are you sure?", why: "Vague — state what will happen: 'This will leave the room'" },
    { phrase: "Please be patient", why: "Condescending — use specific time: 'Usually takes 1–2 min'" },
    { phrase: "Dear user", why: "Unnecessarily formal — address directly: 'Your room is ready'" },
    { phrase: "ASAP / URGENT", why: "Creates anxiety — use 'within 24 hours' or SLA language" },
  ];

  const lengthLimits = [
    { element: "Toast title", max: "40 chars", example: "Payment successful" },
    { element: "Toast description", max: "80 chars", example: "3 500 ₸ sent to room owner" },
    { element: "Button label", max: "24 chars", example: "Join room" },
    { element: "Page heading", max: "50 chars", example: "My rooms" },
    { element: "Empty state message", max: "120 chars", example: "No rooms yet. Browse the catalog to find a plan that fits." },
    { element: "Error message", max: "100 chars", example: "Payment didn't go through. Check your card or try another." },
    { element: "Banner text", max: "140 chars", example: "Scheduled maintenance Apr 5, 03:00–05:00. Service may be unavailable." },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Pen size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>C) {t("sectionCopyRules")}</h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: "var(--eco-text-secondary)" }}>
        Tone, length limits, banned phrases, and security messaging guidelines
      </p>

      {/* Tone rules with Do/Don't */}
      <SC className="mb-5">
        <SL>TONE & PHRASING</SL>
        <div className="flex flex-col gap-4">
          {toneRules.map((tr, i) => (
            <div key={i}>
              <RuleRow rule={tr.rule} why="" />
              <div className="flex gap-3 mt-2 ml-7">
                <DoBox><span className="text-[11px]">{tr.example}</span></DoBox>
                <DontBox><span className="text-[11px]">{tr.bad}</span></DontBox>
              </div>
            </div>
          ))}
        </div>
      </SC>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Banned phrases */}
        <SC>
          <SL>BANNED PHRASES</SL>
          <div className="flex flex-col gap-1.5">
            {banned.map((b) => (
              <div key={b.phrase} className="flex items-start gap-2 rounded-lg px-3 py-2.5" style={{ background: "var(--eco-danger-100)" }}>
                <Ban size={11} className="mt-0.5 shrink-0" style={{ color: "var(--eco-danger-500)" }} />
                <div className="flex-1 min-w-0">
                  <span className="text-[12px]" style={{ color: "var(--eco-danger-500)" }}>"{b.phrase}"</span>
                  <span className="text-[11px] ml-2" style={{ color: "var(--eco-text-tertiary)" }}>— {b.why}</span>
                </div>
              </div>
            ))}
          </div>
        </SC>

        {/* Length limits */}
        <SC>
          <SL>CHARACTER LIMITS</SL>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--eco-bg)" }}>
                  {["Element", "Max", "Example"].map((h) => (
                    <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lengthLimits.map((ll) => (
                  <tr key={ll.element} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                    <td className="px-3 py-2" style={{ color: "var(--eco-text)" }}>{ll.element}</td>
                    <td className="px-3 py-2 tabular-nums">
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{ll.max}</span>
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{ll.example}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SC>
      </div>

      {/* Security copy */}
      <SC>
        <SL>SECURITY & SENSITIVE MESSAGING</SL>
        <div className="flex flex-col gap-2">
          <RuleRow rule="Never reveal whether an account exists in error messages" why="Login: 'Invalid credentials' — never 'User not found' or 'Wrong password'" />
          <RuleRow rule="Never show technical error details to end users" why="Replace stack traces with 'Something went wrong. If this persists, contact support.'" />
          <RuleRow rule="Rate-limit messages: time-based, no attempt counts" why="'Try again in 5 minutes' — not 'You have 2 attempts remaining'" />
          <RuleRow rule="Payment declines: suggest action, not cause" why="'Check card details or try another' — not 'Insufficient funds'" />
          <RuleRow rule="Fraud holds: neutral, no accusation" why="'This action is paused for review' — not 'Suspicious activity detected'" />
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════
   D) ICON RULES
   ═══════════════════════════════════════════ */
function IconRulesSection() {
  const { t } = useI18n();

  const sizeGuide = [
    { size: 12, use: "Inline with 11–12px text (badges, timestamps)", example: <Clock size={12} /> },
    { size: 14, use: "Inline with 13–14px text (body, buttons)", example: <ChevronRight size={14} /> },
    { size: 16, use: "Section headers, nav icons, input icons", example: <DoorOpen size={16} /> },
    { size: 20, use: "Card headers, stat values, feature highlights", example: <CreditCard size={20} /> },
    { size: 24, use: "Page title icons, empty state decorations", example: <Shield size={24} /> },
    { size: 32, use: "Empty state hero only — never in dense UI", example: <Globe2 size={32} /> },
  ];

  const iconUsage = [
    { when: "Status badge accompaniment", icons: "CheckCircle2, XCircle, AlertTriangle, Info, Clock", rule: "Match icon color to badge variant color" },
    { when: "Navigation items", icons: "DoorOpen, CreditCard, Shield, User, Settings", rule: "16px, 1.5px stroke, secondary text color" },
    { when: "Actions (buttons / row actions)", icons: "Eye, Edit2, Trash2, Download, ExternalLink", rule: "14px inside buttons, 13px for table row actions" },
    { when: "Empty states", icons: "Inbox, Search, FileX, WifiOff, ShieldOff", rule: "32px centered, tertiary color, single icon per state" },
    { when: "Form validation", icons: "AlertCircle (error), CheckCircle2 (success)", rule: "14px, right-aligned in input, danger/success color" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Sparkles size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>D) {t("sectionIconRules")}</h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: "var(--eco-text-secondary)" }}>
        Lucide React — consistent stroke width (1.5–2px), 6 sanctioned sizes
      </p>

      {/* Size guide */}
      <SC className="mb-5">
        <SL>SIZE GUIDE</SL>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {sizeGuide.map((sg) => (
            <div key={sg.size} className="flex flex-col items-center gap-2 rounded-xl px-3 py-4" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-surface)", border: "1px dashed var(--eco-border)" }}>
                <span style={{ color: "var(--eco-text)" }}>{sg.example}</span>
              </div>
              <span className="text-[16px] tabular-nums" style={{ color: "var(--eco-text)" }}>{sg.size}px</span>
              <span className="text-[10px] text-center" style={{ color: "var(--eco-text-tertiary)" }}>{sg.use}</span>
            </div>
          ))}
        </div>
      </SC>

      {/* Usage matrix */}
      <SC className="mb-5">
        <SL>ICON USAGE MATRIX</SL>
        <div className="flex flex-col gap-2">
          {iconUsage.map((iu) => (
            <div key={iu.when} className="rounded-lg px-4 py-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{iu.when}</span>
              </div>
              <div className="text-[11px] mb-1.5" style={{ color: "var(--eco-text-tertiary)" }}>
                Icons: <code className="px-1 rounded" style={{ background: "var(--eco-neutral-100)" }}>{iu.icons}</code>
              </div>
              <div className="text-[11px] flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
                <Target size={10} /> {iu.rule}
              </div>
            </div>
          ))}
        </div>
      </SC>

      {/* Do/Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DoBox>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={14} style={{ color: "var(--eco-success-500)" }} />
            <span className="text-[12px]" style={{ color: "var(--eco-text)" }}>Active</span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>14px icon, same color as badge, left-aligned</span>
        </DoBox>
        <DontBox>
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={24} style={{ color: "green" }} />
            <span className="text-[12px]" style={{ color: "var(--eco-text)" }}>Active</span>
          </div>
          <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>24px oversized, raw CSS color, mismatched scale</span>
        </DontBox>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   E) STATUS LANGUAGE
   ═══════════════════════════════════════════ */
function StatusRulesSection() {
  const { t } = useI18n();

  const statuses: { name: string; badge: "success" | "danger" | "warning" | "info" | "default"; modules: string[]; userLabel: { ru: string; kz: string; en: string }; internalKey: string }[] = [
    { name: "ACTIVE", badge: "success", modules: ["Rooms", "Payments", "Members"], userLabel: { ru: "Активно", kz: "Белсенді", en: "Active" }, internalKey: "ACTIVE" },
    { name: "OPEN", badge: "info", modules: ["Rooms", "Catalog"], userLabel: { ru: "Открыто", kz: "Ашық", en: "Open" }, internalKey: "OPEN" },
    { name: "PENDING", badge: "warning", modules: ["Payments", "Rooms", "Disputes"], userLabel: { ru: "Ожидание", kz: "Күту", en: "Pending" }, internalKey: "PENDING" },
    { name: "IN_VERIFICATION", badge: "warning", modules: ["Rooms", "Admin"], userLabel: { ru: "На проверке", kz: "Тексеруде", en: "Under review" }, internalKey: "IN_VERIFICATION" },
    { name: "COMPLETED", badge: "default", modules: ["Payments", "Disputes"], userLabel: { ru: "Завершено", kz: "Аяқталды", en: "Completed" }, internalKey: "COMPLETED" },
    { name: "BLOCKED", badge: "danger", modules: ["Rooms", "Members", "Admin"], userLabel: { ru: "Заблокировано", kz: "Бұғатталған", en: "Blocked" }, internalKey: "BLOCKED" },
    { name: "CANCELLED", badge: "danger", modules: ["Payments", "Rooms"], userLabel: { ru: "Отменено", kz: "Болдырылмады", en: "Cancelled" }, internalKey: "CANCELLED" },
    { name: "REFUNDED", badge: "info", modules: ["Payments", "Disputes"], userLabel: { ru: "Возвращено", kz: "Қайтарылды", en: "Refunded" }, internalKey: "REFUNDED" },
    { name: "RESOLVED", badge: "success", modules: ["Disputes", "Support"], userLabel: { ru: "Решено", kz: "Шешілді", en: "Resolved" }, internalKey: "RESOLVED" },
    { name: "EXPIRED", badge: "default", modules: ["Rooms", "Payments"], userLabel: { ru: "Истекло", kz: "Мерзімі өтті", en: "Expired" }, internalKey: "EXPIRED" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Tag size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>E) {t("sectionStatusRules")}</h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: "var(--eco-text-secondary)" }}>
        Consistent naming across all modules — 10 canonical statuses
      </p>

      {/* Rules */}
      <SC className="mb-5">
        <SL>STATUS RULES</SL>
        <div className="flex flex-col gap-2">
          <RuleRow rule="Use the canonical UPPER_SNAKE internal key for data/API" why="Prevents 'active', 'Active', 'ACTIVE' inconsistency across modules" />
          <RuleRow rule="Display user-facing labels via i18n translation, not the key itself" why="Users see 'Under review' not 'IN_VERIFICATION'" />
          <RuleRow rule="Map each status to exactly one Badge variant — no ad-hoc colors" why="ACTIVE=success, PENDING=warning, BLOCKED=danger — always" />
          <RuleRow rule="Never invent new statuses in feature modules" why="If a new state is needed, add it to the canonical list + all 3 locales" />
          <RuleRow rule="Transitions must be documented: OPEN → ACTIVE → COMPLETED" why="Prevents impossible states in the UI (e.g. COMPLETED → OPEN)" />
        </div>
      </SC>

      {/* Status registry */}
      <SC className="!p-0 overflow-hidden">
        <div className="px-5 py-3" style={{ background: "var(--eco-bg)", borderBottom: "1px solid var(--eco-border)" }}>
          <SL>CANONICAL STATUS REGISTRY</SL>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--eco-bg)" }}>
                {["Internal key", "Badge", "RU", "KZ", "EN", "Used in"].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statuses.map((s) => (
                <tr key={s.name} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                  <td className="px-3 py-2.5">
                    <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text)" }}>{s.internalKey}</code>
                  </td>
                  <td className="px-3 py-2.5"><Badge variant={s.badge}>{s.userLabel.en}</Badge></td>
                  <td className="px-3 py-2.5" style={{ color: "var(--eco-text-secondary)" }}>{s.userLabel.ru}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--eco-text-secondary)" }}>{s.userLabel.kz}</td>
                  <td className="px-3 py-2.5" style={{ color: "var(--eco-text-secondary)" }}>{s.userLabel.en}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex gap-1 flex-wrap">
                      {s.modules.map((m) => (
                        <span key={m} className="text-[9px] px-1 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{m}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════
   F) I18N KEY RULES
   ═══════════════════════════════════════════ */
function I18nKeyRulesSection() {
  const { t } = useI18n();

  const namingConventions = [
    { pattern: "moduleCamelCase", example: "roomDetailTitle", when: "Page/section headings" },
    { pattern: "moduleActionNoun", example: "paymentCheckoutBtn", when: "Button labels" },
    { pattern: "moduleStateDesc", example: "roomEmptyMessage", when: "Empty/error/loading states" },
    { pattern: "toastType", example: "toastSuccess, toastError", when: "Toast titles" },
    { pattern: "bannerType + Msg", example: "bannerInfoMsg", when: "Banner copy" },
    { pattern: "statusUpperSnake", example: "statusActive", when: "Status display labels" },
    { pattern: "validationField", example: "validationEmailRequired", when: "Form validation" },
    { pattern: "safeCopyContext", example: "safeCopyAuthBad", when: "Security sensitive text" },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Languages size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>F) {t("sectionI18nRules")}</h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: "var(--eco-text-secondary)" }}>
        Naming conventions, mandatory triples, and review workflow
      </p>

      {/* Core rules */}
      <SC className="mb-5">
        <SL>CORE I18N RULES</SL>
        <div className="flex flex-col gap-2">
          <RuleRow rule="Every user-visible string must go through t() — no hardcoded text in JSX" why="Enables language switching and ensures all strings are translatable" />
          <RuleRow rule="Every key must have all 3 locales: { ru, kz, en }" why="Missing translations cause runtime fallback to key name (broken UI)" />
          <RuleRow rule="Key names: camelCase, prefixed by module/context" why="Prevents collisions: 'roomTitle' vs 'paymentTitle' instead of just 'title'" />
          <RuleRow rule="Group keys by section with comment separators" why="Keeps the translations file scannable: // ===== Auth =====" />
          <RuleRow rule="No string concatenation — use template keys with {placeholders}" why="Word order differs across RU/KZ/EN — concatenation breaks grammar" />
          <RuleRow rule="Max 280+ keys: audit quarterly, remove orphans" why="Dead keys increase file size and confuse translators" />
        </div>
      </SC>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Naming conventions */}
        <SC>
          <SL>KEY NAMING CONVENTIONS</SL>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: "var(--eco-bg)" }}>
                  {["Pattern", "Example", "When"].map((h) => (
                    <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {namingConventions.map((nc) => (
                  <tr key={nc.pattern} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                    <td className="px-3 py-2">
                      <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{nc.pattern}</code>
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-[10px] px-1 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text)" }}>{nc.example}</code>
                    </td>
                    <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{nc.when}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SC>

        {/* Review workflow */}
        <SC>
          <SL>TRANSLATION REVIEW WORKFLOW</SL>
          <div className="flex flex-col gap-3">
            {[
              { step: "1", label: "Dev adds key with EN value", desc: "Create key in i18n-provider with English text" },
              { step: "2", label: "RU/KZ placeholders added", desc: "Copy EN as placeholder with [NEEDS_TRANSLATION] prefix" },
              { step: "3", label: "Native speaker review", desc: "RU + KZ translations reviewed by native speakers" },
              { step: "4", label: "Truncation test", desc: "Check longest locale (usually KZ) at 390px breakpoint" },
              { step: "5", label: "Merge to main", desc: "All 3 locales filled + truncation verified" },
            ].map((s, i, arr) => (
              <div key={s.step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] shrink-0" style={{ background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" }}>{s.step}</div>
                  {i < arr.length - 1 && <div className="w-0.5 flex-1" style={{ background: "var(--eco-neutral-200)" }} />}
                </div>
                <div className="pb-2">
                  <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{s.label}</div>
                  <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </SC>
      </div>

      {/* Do/Don't */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DoBox>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-1" style={{ background: "var(--eco-bg)" }}>
            {'roomTitle: {'}
            <br />{'  ru: "Комната", kz: "Бөлме", en: "Room"'}
            <br />{'}'}
          </code>
          <code className="text-[11px] block rounded px-2 py-1.5" style={{ background: "var(--eco-bg)" }}>
            {'<h1>{t("roomTitle")}</h1>'}
          </code>
        </DoBox>
        <DontBox>
          <code className="text-[11px] block rounded px-2 py-1.5 mb-1" style={{ background: "var(--eco-bg)" }}>
            {'<h1>Room</h1>  '}
            <span style={{ color: "var(--eco-danger-500)" }}>← hardcoded</span>
          </code>
          <code className="text-[11px] block rounded px-2 py-1.5" style={{ background: "var(--eco-bg)" }}>
            {'{t("members") + ": " + count}  '}
            <span style={{ color: "var(--eco-danger-500)" }}>← concat</span>
          </code>
        </DontBox>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════ */
export function GovernanceRulesPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"tokens" | "components" | "copy" | "icons" | "statuses" | "i18n">("tokens");

  const tabs = [
    { id: "tokens" as const, label: `A) ${t("sectionTokenRules")}`, icon: Palette },
    { id: "components" as const, label: `B) ${t("sectionCompRules")}`, icon: Box },
    { id: "copy" as const, label: `C) ${t("sectionCopyRules")}`, icon: Pen },
    { id: "icons" as const, label: `D) ${t("sectionIconRules")}`, icon: Sparkles },
    { id: "statuses" as const, label: `E) ${t("sectionStatusRules")}`, icon: Tag },
    { id: "i18n" as const, label: `F) ${t("sectionI18nRules")}`, icon: Languages },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>Page 21</span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-warning-100)", color: "var(--eco-warning-500)" }}>Governance</span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>{t("govTitle")}</h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>{t("govSubtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
        {[
          { n: "6", label: "Sections" },
          { n: "9", label: "Token refs" },
          { n: "6", label: "Components" },
          { n: "7", label: "Banned phrases" },
          { n: "10", label: "Statuses" },
          { n: "8", label: "Key patterns" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <div className="text-[22px]" style={{ color: "var(--eco-text)" }}>{s.n}</div>
            <div className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--eco-surface)" }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: tab === id ? "var(--eco-bg)" : "transparent",
              color: tab === id ? "var(--eco-text)" : "var(--eco-text-tertiary)",
              boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon size={13} />
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{label.split(") ")[0]})</span>
          </button>
        ))}
      </div>

      {tab === "tokens" && <TokenRulesSection />}
      {tab === "components" && <ComponentRulesSection />}
      {tab === "copy" && <CopyRulesSection />}
      {tab === "icons" && <IconRulesSection />}
      {tab === "statuses" && <StatusRulesSection />}
      {tab === "i18n" && <I18nKeyRulesSection />}
    </div>
  );
}
