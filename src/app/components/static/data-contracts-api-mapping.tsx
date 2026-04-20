import { useState } from "react";
import { useI18n } from "../i18n-provider";
import { Badge, Button } from "../ds-primitives";
import {
  AlertTriangle, ArrowRight, Bell, BookOpen, Check, CheckCircle2, ChevronDown,
  ChevronRight, Clock, Cloud, CloudOff, Code, Copy, CreditCard, Database,
  DoorOpen, Eye, EyeOff, FileCode2, FileJson, Filter, Globe2, Hash, Info,
  Key, Layers, Link, List, Lock, MessageSquare, Palette, RefreshCw, Search,
  Server, Shield, ShieldCheck, Smartphone, Star, Table2, Tag, Timer, Type,
  User, Wifi, WifiOff, X, Zap,
} from "lucide-react";

/* ═══════ SHARED PRIMITIVES ═══════ */
const SC = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>
);
const SL = ({ children }: { children: string }) => (
  <div className="text-[10px] mb-2 tracking-widest uppercase" style={{ color: "var(--eco-text-tertiary)" }}>{children}</div>
);
const CodeChip = ({ children }: { children: string }) => (
  <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{children}</code>
);
const MethodBadge = ({ method }: { method: string }) => {
  const colors: Record<string, string> = { GET: "var(--eco-success-500)", POST: "var(--eco-brand-600)", PUT: "var(--eco-warning-500)", PATCH: "var(--eco-warning-500)", DELETE: "var(--eco-danger-500)" };
  return <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: `${colors[method] || "var(--eco-text-tertiary)"}18`, color: colors[method] || "var(--eco-text-tertiary)" }}>{method}</span>;
};

/* ═══════ TYPES ═══════ */
interface FieldRow {
  name: string;
  type: string;
  required: boolean;
  nullHandling: string;
  example: string;
}
interface ApiRow {
  endpoint: string;
  method: string;
  params: string;
  responseFields: string;
  auth: string;
}
interface StateRow {
  state: string;
  trigger: string;
  uiBehavior: string;
  retryable: boolean;
}
interface FormatRow {
  rule: string;
  format: string;
  example: string;
  privacy: string;
}
interface ScreenContract {
  id: string;
  titleKey: string;
  icon: React.ElementType;
  color: string;
  permission: string;
  fields: FieldRow[];
  apis: ApiRow[];
  states: StateRow[];
  formats: FormatRow[];
}

/* ═══════ ALL SCREEN CONTRACTS ═══════ */
const CONTRACTS: ScreenContract[] = [
  /* ── 1. CATALOG LIST ── */
  {
    id: "catalog", titleKey: "dcCatalogList", icon: List, color: "var(--eco-primary)",
    permission: "public (no auth required)",
    fields: [
      { name: "operator_id", type: "uuid", required: true, nullHandling: "—", example: "op_beeline_kz" },
      { name: "operator_name", type: "string", required: true, nullHandling: "—", example: "Beeline" },
      { name: "logo_url", type: "url | null", required: false, nullHandling: "Show initial avatar (first letter)", example: "/assets/beeline.svg" },
      { name: "plan_count", type: "int", required: true, nullHandling: "Show 0", example: "14" },
      { name: "cheapest_price", type: "int (tiyn)", required: true, nullHandling: "Show '—'", example: "249000" },
      { name: "avg_rating", type: "float | null", required: false, nullHandling: "Hide rating chip", example: "4.6" },
      { name: "coverage_badge", type: "enum | null", required: false, nullHandling: "Omit badge", example: "nationwide" },
      { name: "has_5g", type: "boolean", required: true, nullHandling: "false", example: "true" },
      { name: "active_rooms", type: "int", required: true, nullHandling: "Show 0", example: "42" },
    ],
    apis: [
      { endpoint: "/api/v1/catalog/operators", method: "GET", params: "?sort=popular|price|rating&has_5g=bool&page=1&limit=20", responseFields: "data[]{id, name, logo_url, plan_count, cheapest_price, avg_rating, has_5g, active_rooms}, meta{total, page, pages}", auth: "None" },
      { endpoint: "/api/v1/catalog/operators/:id/plans", method: "GET", params: "?sort=price|data_gb&min_price=&max_price=&shareable=true", responseFields: "data[]{id, name, price, data_gb, calls_min, sms_count, shareable, max_members}", auth: "None" },
    ],
    states: [
      { state: "Loading", trigger: "Initial fetch / filter change", uiBehavior: "Skeleton cards (3 rows × operator card shape)", retryable: false },
      { state: "Empty", trigger: "No operators match filter", uiBehavior: "Empty state illustration + 'No operators found' + reset filters CTA", retryable: false },
      { state: "Error (network)", trigger: "Fetch fails", uiBehavior: "Error card + 'Check your connection' + retry button", retryable: true },
      { state: "Error (500)", trigger: "Server error", uiBehavior: "Error card + 'Something went wrong' + retry + support link", retryable: true },
      { state: "Offline", trigger: "No connection", uiBehavior: "Cached data if available + offline banner; else full offline state", retryable: true },
      { state: "Rate-limited", trigger: "429 response", uiBehavior: "Toast 'Too many requests. Wait a moment.' + auto-retry after Retry-After", retryable: true },
    ],
    formats: [
      { rule: "Price display", format: "amount / 100 → toLocaleString('ru-KZ') + ' ₸'", example: "249000 → 2 490 ₸", privacy: "Public" },
      { rule: "Rating", format: "1 decimal, ★ prefix", example: "★ 4.6", privacy: "Public (aggregated)" },
      { rule: "Plan count", format: "Integer + i18n plural", example: "14 тарифов / 14 тариф / 14 plans", privacy: "Public" },
    ],
  },

  /* ── 2. OPERATOR PAGE ── */
  {
    id: "operator", titleKey: "dcOperatorPage", icon: Smartphone, color: "var(--eco-brand-600)",
    permission: "public",
    fields: [
      { name: "operator", type: "Operator", required: true, nullHandling: "404 page", example: "{id, name, logo_url, description, website}" },
      { name: "plans[]", type: "Plan[]", required: true, nullHandling: "Empty state 'No plans yet'", example: "[{id, name, price, data_gb, shareable...}]" },
      { name: "plan.price", type: "int (tiyn)", required: true, nullHandling: "—", example: "349000" },
      { name: "plan.data_gb", type: "int | null", required: false, nullHandling: "Show 'Безлимит'", example: "15" },
      { name: "plan.calls_min", type: "int | null", required: false, nullHandling: "Show 'Безлимит'", example: "500" },
      { name: "plan.sms_count", type: "int | null", required: false, nullHandling: "Show 'Безлимит'", example: "200" },
      { name: "plan.shareable", type: "boolean", required: true, nullHandling: "false → gray out", example: "true" },
      { name: "plan.max_members", type: "int", required: true, nullHandling: "1 (solo)", example: "5" },
      { name: "plan.share_price", type: "int (tiyn)", required: true, nullHandling: "= full price", example: "87250" },
      { name: "rooms_available", type: "int", required: true, nullHandling: "Show 0", example: "8" },
    ],
    apis: [
      { endpoint: "/api/v1/catalog/operators/:id", method: "GET", params: "—", responseFields: "{id, name, logo_url, description, website, coverage_map_url}", auth: "None" },
      { endpoint: "/api/v1/catalog/operators/:id/plans", method: "GET", params: "?shareable=true&sort=price&page=1&limit=50", responseFields: "data[]{...Plan}, meta{total, page}", auth: "None" },
      { endpoint: "/api/v1/rooms?operator_id=:id&status=open", method: "GET", params: "?plan_id=&page=1&limit=10", responseFields: "data[]{id, plan_name, owner_name_masked, members_count, max_members, share_price}", auth: "None (masked data)" },
    ],
    states: [
      { state: "Loading", trigger: "Route enter", uiBehavior: "Skeleton: hero + plan list (4 skeletons)", retryable: false },
      { state: "Not found", trigger: "Invalid operator_id", uiBehavior: "404 page + go to catalog CTA", retryable: false },
      { state: "No shareable plans", trigger: "All plans shareable=false", uiBehavior: "Info card 'This operator doesn't support sharing yet'", retryable: false },
      { state: "Error", trigger: "Fetch fails", uiBehavior: "Error card + retry", retryable: true },
    ],
    formats: [
      { rule: "Share price", format: "plan.price / max_members → ceil → format as KZT", example: "349000/4 = 87250 → 873 ₸/мес", privacy: "Public" },
      { rule: "Data", format: "'Безлимит' if null, else '{n} GB'", example: "15 GB", privacy: "Public" },
      { rule: "Owner name in room list", format: "First name + last initial + '.'", example: "Ержан А.", privacy: "Masked for non-members" },
    ],
  },

  /* ── 3. ROOM DETAIL ── */
  {
    id: "room", titleKey: "dcRoomDetail", icon: DoorOpen, color: "var(--eco-success-500)",
    permission: "public (limited) → auth (full) → owner/member (all fields)",
    fields: [
      { name: "room_id", type: "uuid", required: true, nullHandling: "—", example: "rm_a1b2c3d4" },
      { name: "status", type: "enum", required: true, nullHandling: "—", example: "active | pending | blocked | expired | full" },
      { name: "plan", type: "Plan", required: true, nullHandling: "—", example: "{name, operator, price, data_gb, max_members}" },
      { name: "owner", type: "UserPublic", required: true, nullHandling: "—", example: "{id, display_name, avatar_url, rating, verified}" },
      { name: "members[]", type: "Member[]", required: true, nullHandling: "Empty = no members yet", example: "[{id, display_name, status, joined_at}]" },
      { name: "members_count", type: "int", required: true, nullHandling: "0", example: "3" },
      { name: "max_members", type: "int", required: true, nullHandling: "—", example: "5" },
      { name: "share_price", type: "int (tiyn)", required: true, nullHandling: "—", example: "87250" },
      { name: "next_billing_date", type: "ISO date | null", required: false, nullHandling: "Hide billing section", example: "2026-05-01T00:00:00Z" },
      { name: "created_at", type: "ISO date", required: true, nullHandling: "—", example: "2026-01-15T10:30:00Z" },
      { name: "rules", type: "string | null", required: false, nullHandling: "Hide rules section", example: "'No VPN usage, fair use policy'" },
      { name: "sla_response_hours", type: "int", required: true, nullHandling: "24", example: "24" },
    ],
    apis: [
      { endpoint: "/api/v1/rooms/:id", method: "GET", params: "—", responseFields: "{id, status, plan, owner, members_count, max_members, share_price, next_billing_date, created_at, rules}", auth: "Public: limited fields; Auth: full fields" },
      { endpoint: "/api/v1/rooms/:id/members", method: "GET", params: "—", responseFields: "data[]{id, display_name, avatar_url, status, joined_at, last_paid_at}", auth: "Owner + members only" },
      { endpoint: "/api/v1/rooms/:id/join", method: "POST", params: "body: {payment_method_id}", responseFields: "{member_id, payment_intent_id, status}", auth: "Auth required, not already member" },
      { endpoint: "/api/v1/rooms/:id/leave", method: "POST", params: "body: {reason?}", responseFields: "{success, refund_eligible}", auth: "Member only" },
    ],
    states: [
      { state: "Loading", trigger: "Route enter", uiBehavior: "Skeleton: room card + member list + billing info", retryable: false },
      { state: "Not found", trigger: "Invalid room_id", uiBehavior: "404 + back to catalog", retryable: false },
      { state: "Blocked", trigger: "room.status=blocked", uiBehavior: "Red banner 'Room suspended — contact support' + no actions", retryable: false },
      { state: "Expired", trigger: "room.status=expired", uiBehavior: "Gray overlay + 'Room expired' + renewal CTA (owner) or browse CTA (member)", retryable: false },
      { state: "Full", trigger: "members_count >= max_members", uiBehavior: "Disable join CTA + 'Room full — join waitlist' button", retryable: false },
      { state: "Permission denied", trigger: "Unauth user tries /members", uiBehavior: "Login prompt modal", retryable: false },
      { state: "Offline", trigger: "No connection", uiBehavior: "Cached snapshot if visited before + offline banner", retryable: true },
    ],
    formats: [
      { rule: "Room status", format: "Badge color map (see Status Tables below)", example: "active → green, blocked → red", privacy: "Public" },
      { rule: "Billing date", format: "toLocaleDateString(locale, {day:'numeric', month:'long'})", example: "1 мая / 1 мамыр / May 1", privacy: "Members + owner only" },
      { rule: "Member names", format: "Public: first name + last initial; In-room: full display name", example: "Public: 'Алмас К.' / In-room: 'Алмас Козыбаев'", privacy: "Privacy-tiered" },
      { rule: "SLA timer", format: "Countdown if < 4h remaining, else 'within {n}h'", example: "2h 14m remaining / within 24h", privacy: "Member/owner" },
    ],
  },

  /* ── 4. JOIN & CHECKOUT ── */
  {
    id: "checkout", titleKey: "dcJoinCheckout", icon: CreditCard, color: "var(--eco-warning-500)",
    permission: "auth required, not already member of this room",
    fields: [
      { name: "room", type: "RoomSummary", required: true, nullHandling: "Redirect to room page", example: "{id, plan_name, operator, share_price}" },
      { name: "payment_methods[]", type: "PaymentMethod[]", required: true, nullHandling: "Show 'Add payment method' CTA", example: "[{id, type, last4, brand, is_default}]" },
      { name: "selected_method_id", type: "uuid | null", required: false, nullHandling: "Pre-select is_default", example: "pm_a1b2c3" },
      { name: "amount", type: "int (tiyn)", required: true, nullHandling: "—", example: "87250" },
      { name: "currency", type: "string", required: true, nullHandling: "'KZT'", example: "KZT" },
      { name: "promo_code", type: "string | null", required: false, nullHandling: "No discount applied", example: "ECOSPLIT20" },
      { name: "discount_amount", type: "int (tiyn) | null", required: false, nullHandling: "0", example: "17450" },
      { name: "final_amount", type: "int (tiyn)", required: true, nullHandling: "= amount", example: "69800" },
      { name: "terms_accepted", type: "boolean", required: true, nullHandling: "false → disable pay button", example: "true" },
    ],
    apis: [
      { endpoint: "/api/v1/payments/methods", method: "GET", params: "—", responseFields: "data[]{id, type, last4, brand, exp_month, exp_year, is_default}", auth: "Auth required" },
      { endpoint: "/api/v1/payments/intent", method: "POST", params: "body: {room_id, payment_method_id, promo_code?}", responseFields: "{intent_id, client_secret, amount, currency, status}", auth: "Auth required" },
      { endpoint: "/api/v1/promo/validate", method: "POST", params: "body: {code, room_id}", responseFields: "{valid, discount_type, discount_value, final_amount}", auth: "Auth required" },
    ],
    states: [
      { state: "Loading", trigger: "Page enter", uiBehavior: "Skeleton: room summary + payment form", retryable: false },
      { state: "No payment methods", trigger: "methods[].length === 0", uiBehavior: "Add card form inline + Kaspi QR option", retryable: false },
      { state: "Processing", trigger: "Pay button clicked", uiBehavior: "Full-screen overlay + spinner + 'Processing…' + disable all", retryable: false },
      { state: "3D Secure", trigger: "intent requires_action", uiBehavior: "Redirect to bank 3DS iframe", retryable: false },
      { state: "Payment failed", trigger: "intent.status=failed", uiBehavior: "Error state: reason message + retry + change card CTA", retryable: true },
      { state: "Card declined", trigger: "Specific decline code", uiBehavior: "Specific message per decline_code (insufficient_funds, expired_card…)", retryable: true },
      { state: "Already member", trigger: "User already in room", uiBehavior: "Redirect to room detail + toast 'Already a member'", retryable: false },
      { state: "Room full (race)", trigger: "Room filled while in checkout", uiBehavior: "Error card 'Room just filled up' + browse other rooms CTA", retryable: false },
    ],
    formats: [
      { rule: "Card display", format: "'•••• {last4}' + brand icon", example: "•••• 4832 [Visa icon]", privacy: "Masked, user's own cards only" },
      { rule: "Amount", format: "KZT: tiyn/100 → locale format + ₸", example: "87250 → 873 ₸", privacy: "Auth only" },
      { rule: "Promo", format: "Strike original + show discounted", example: "~~873 ₸~~ 698 ₸ (−20%)", privacy: "Auth only" },
    ],
  },

  /* ── 5. PENDING & HOLD ── */
  {
    id: "pending", titleKey: "dcPendingHold", icon: Clock, color: "var(--eco-brand-600)",
    permission: "auth required, payment initiator",
    fields: [
      { name: "intent_id", type: "string", required: true, nullHandling: "—", example: "pi_3Qk8aH2eZv" },
      { name: "txn_id", type: "string | null", required: false, nullHandling: "Show 'Awaiting confirmation'", example: "ch_3Qk8aH2eZv" },
      { name: "status", type: "enum", required: true, nullHandling: "—", example: "pending | processing | on_hold | succeeded | failed | canceled" },
      { name: "amount", type: "int (tiyn)", required: true, nullHandling: "—", example: "87250" },
      { name: "hold_expires_at", type: "ISO date | null", required: false, nullHandling: "No countdown shown", example: "2026-04-03T14:32:00Z" },
      { name: "room_id", type: "uuid", required: true, nullHandling: "—", example: "rm_a1b2c3d4" },
      { name: "estimated_completion", type: "ISO date | null", required: false, nullHandling: "Show 'Usually within 2 min'", example: "2026-04-03T14:34:00Z" },
      { name: "failure_reason", type: "string | null", required: false, nullHandling: "Generic message", example: "insufficient_funds" },
    ],
    apis: [
      { endpoint: "/api/v1/payments/intent/:id", method: "GET", params: "—", responseFields: "{id, status, amount, currency, hold_expires_at, txn_id, failure_reason, room_id}", auth: "Auth: payment owner or admin" },
      { endpoint: "/api/v1/payments/intent/:id/cancel", method: "POST", params: "body: {reason?}", responseFields: "{success, refund_status}", auth: "Payment owner, only if status=on_hold" },
    ],
    states: [
      { state: "Pending", trigger: "Just created", uiBehavior: "Animated spinner + 'Payment processing…' + poll every 3s", retryable: false },
      { state: "On hold", trigger: "Hold placed by PSP", uiBehavior: "Hold badge + countdown to expiry + cancel CTA", retryable: false },
      { state: "Succeeded", trigger: "Payment confirmed", uiBehavior: "Success animation + 'Welcome to room' + go to room CTA", retryable: false },
      { state: "Failed", trigger: "Payment rejected", uiBehavior: "Error with reason + retry + change card", retryable: true },
      { state: "Canceled", trigger: "User or system canceled", uiBehavior: "Gray state + 'Payment canceled' + browse rooms CTA", retryable: false },
      { state: "Timeout", trigger: "Hold expired", uiBehavior: "Warning state + 'Hold expired' + funds released message", retryable: true },
    ],
    formats: [
      { rule: "Intent ID", format: "Monospace, truncate to 14 chars, click to copy full", example: "pi_3Qk8aH2eZv…", privacy: "Shown to payment owner + admin" },
      { rule: "Hold countdown", format: "mm:ss if < 5 min, else 'Xh Ym remaining'", example: "04:32 remaining", privacy: "Payment owner only" },
      { rule: "Failure reason", format: "Map code → i18n key. Never show raw PSP codes.", example: "insufficient_funds → 'Недостаточно средств'", privacy: "User sees friendly message; admin sees raw code" },
    ],
  },

  /* ── 6. SUPPORT TICKET ── */
  {
    id: "support", titleKey: "dcSupportTicket", icon: MessageSquare, color: "var(--eco-warning-500)",
    permission: "auth required, ticket owner or assigned admin",
    fields: [
      { name: "ticket_id", type: "string", required: true, nullHandling: "—", example: "TKT-2026-04158" },
      { name: "subject", type: "string", required: true, nullHandling: "—", example: "Can't join room — payment stuck" },
      { name: "category", type: "enum", required: true, nullHandling: "—", example: "payment | room | account | other" },
      { name: "priority", type: "enum", required: true, nullHandling: "'normal'", example: "low | normal | high | urgent" },
      { name: "status", type: "enum", required: true, nullHandling: "—", example: "open | in_progress | waiting_user | resolved | closed" },
      { name: "messages[]", type: "Message[]", required: true, nullHandling: "[]", example: "[{id, sender, body, attachments[], created_at}]" },
      { name: "assigned_to", type: "AdminUser | null", required: false, nullHandling: "Show 'Unassigned'", example: "{id, display_name}" },
      { name: "sla_deadline", type: "ISO date", required: true, nullHandling: "Calculate from priority", example: "2026-04-04T14:32:00Z" },
      { name: "created_at", type: "ISO date", required: true, nullHandling: "—", example: "2026-04-03T14:32:00Z" },
      { name: "resolved_at", type: "ISO date | null", required: false, nullHandling: "null → still open", example: "null" },
    ],
    apis: [
      { endpoint: "/api/v1/support/tickets", method: "GET", params: "?status=open|all&page=1&limit=20", responseFields: "data[]{id, subject, category, priority, status, created_at, last_message_at, sla_deadline}", auth: "Auth: own tickets; Admin: all" },
      { endpoint: "/api/v1/support/tickets/:id", method: "GET", params: "—", responseFields: "{...ticket, messages[]}", auth: "Ticket owner or admin" },
      { endpoint: "/api/v1/support/tickets", method: "POST", params: "body: {subject, category, priority, body, attachments[]}", responseFields: "{ticket_id, status}", auth: "Auth required" },
      { endpoint: "/api/v1/support/tickets/:id/messages", method: "POST", params: "body: {body, attachments[]}", responseFields: "{message_id, created_at}", auth: "Ticket owner or assigned admin" },
      { endpoint: "/api/v1/support/tickets/:id/close", method: "POST", params: "body: {resolution_note?}", responseFields: "{success}", auth: "Ticket owner or admin" },
    ],
    states: [
      { state: "Loading", trigger: "Route enter", uiBehavior: "Skeleton: ticket header + message list", retryable: false },
      { state: "Not found", trigger: "Invalid ticket_id", uiBehavior: "404 + go to support home", retryable: false },
      { state: "Permission denied", trigger: "Not owner/admin", uiBehavior: "403 page + login as different user CTA", retryable: false },
      { state: "Uploading attachment", trigger: "File selected", uiBehavior: "Progress bar per file + disable send until complete", retryable: true },
      { state: "SLA breach", trigger: "Now > sla_deadline", uiBehavior: "Red SLA badge 'Overdue' + escalation note for admin", retryable: false },
    ],
    formats: [
      { rule: "Ticket ID", format: "TKT-{YYYY}-{5-digit seq}", example: "TKT-2026-04158", privacy: "Visible to owner + admin" },
      { rule: "SLA timer", format: "Countdown badge: green >4h, yellow 1-4h, red <1h or overdue", example: "🟢 22h left / 🔴 SLA breached", privacy: "Owner sees simplified; admin sees full" },
      { rule: "Attachment", format: "Image preview if jpg/png; file icon + name for others. Max 5MB.", example: "screenshot.png (1.2 MB)", privacy: "Visible to ticket parties only" },
      { rule: "Message timestamp", format: "'Today 14:32' or 'Mar 28, 14:32'", example: "Сегодня 14:32", privacy: "Ticket parties" },
    ],
  },

  /* ── 7. ADMIN MODERATION / DISPUTE ── */
  {
    id: "admin", titleKey: "dcAdminModeration", icon: Shield, color: "var(--eco-danger-500)",
    permission: "role: admin | moderator",
    fields: [
      { name: "dispute_id", type: "string", required: true, nullHandling: "—", example: "DSP-2026-00312" },
      { name: "type", type: "enum", required: true, nullHandling: "—", example: "payment_dispute | room_violation | fraud_report" },
      { name: "status", type: "enum", required: true, nullHandling: "—", example: "open | investigating | awaiting_evidence | resolved | escalated" },
      { name: "parties[]", type: "User[]", required: true, nullHandling: "—", example: "[{id, display_name, role_in_dispute: 'reporter'|'respondent'}]" },
      { name: "evidence[]", type: "Attachment[]", required: false, nullHandling: "[]", example: "[{url, type, uploaded_by, uploaded_at}]" },
      { name: "room", type: "RoomSummary | null", required: false, nullHandling: "Not room-related dispute", example: "{id, plan_name, operator}" },
      { name: "payment", type: "PaymentSummary | null", required: false, nullHandling: "Not payment-related", example: "{intent_id, txn_id, amount}" },
      { name: "admin_notes[]", type: "Note[]", required: false, nullHandling: "[]", example: "[{body, author, created_at}]" },
      { name: "decision", type: "Decision | null", required: false, nullHandling: "Not decided yet", example: "{outcome, refund_amount, reason, decided_by, decided_at}" },
      { name: "audit_log[]", type: "AuditEntry[]", required: true, nullHandling: "[]", example: "[{action, actor, timestamp, metadata}]" },
    ],
    apis: [
      { endpoint: "/api/v1/admin/disputes", method: "GET", params: "?status=&type=&assigned_to=&page=1&limit=20&sort=created_at", responseFields: "data[]{id, type, status, parties, created_at, sla_deadline}, meta{}", auth: "Admin/moderator" },
      { endpoint: "/api/v1/admin/disputes/:id", method: "GET", params: "—", responseFields: "{...dispute, evidence[], admin_notes[], audit_log[]}", auth: "Admin/moderator" },
      { endpoint: "/api/v1/admin/disputes/:id/decide", method: "POST", params: "body: {outcome, refund_amount?, reason, ban_user?}", responseFields: "{decision_id, status}", auth: "Admin only (not moderator)" },
      { endpoint: "/api/v1/admin/disputes/:id/escalate", method: "POST", params: "body: {reason}", responseFields: "{success}", auth: "Moderator → escalates to admin" },
      { endpoint: "/api/v1/admin/rooms/:id/block", method: "POST", params: "body: {reason, dispute_id?}", responseFields: "{success}", auth: "Admin/moderator" },
      { endpoint: "/api/v1/admin/users/:id/ban", method: "POST", params: "body: {reason, duration_days?, dispute_id?}", responseFields: "{success, ban_id}", auth: "Admin only" },
    ],
    states: [
      { state: "Loading", trigger: "Route enter", uiBehavior: "Skeleton: dispute header + timeline + evidence grid", retryable: false },
      { state: "Permission denied", trigger: "Non-admin user", uiBehavior: "403 + redirect to login", retryable: false },
      { state: "Conflict (decision)", trigger: "Another admin decided already", uiBehavior: "Toast 'Dispute already resolved by {admin}' + refresh", retryable: false },
      { state: "Evidence loading", trigger: "Large file", uiBehavior: "Blur placeholder + progress; show type/size label", retryable: true },
    ],
    formats: [
      { rule: "Dispute ID", format: "DSP-{YYYY}-{5-digit}", example: "DSP-2026-00312", privacy: "Admin + parties" },
      { rule: "User PII in admin view", format: "Full name + email + phone visible; marked with 🔒 icon", example: "🔒 Алмас Козыбаев (almaskoz@mail.com)", privacy: "Admin only; audit-logged on view" },
      { rule: "Audit log timestamp", format: "ISO 8601 + relative time", example: "2026-04-03T14:32:00Z (2h ago)", privacy: "Admin only" },
      { rule: "Refund amount", format: "Same as payment formatting", example: "2 990 ₸", privacy: "Admin + affected user" },
    ],
  },

  /* ── 8. PROFILE & REVIEWS ── */
  {
    id: "profile", titleKey: "dcProfileReviews", icon: User, color: "var(--eco-primary)",
    permission: "public profile: all; own profile: auth; edit: self only",
    fields: [
      { name: "user_id", type: "uuid", required: true, nullHandling: "—", example: "usr_x7y8z9" },
      { name: "display_name", type: "string", required: true, nullHandling: "—", example: "Алмас К." },
      { name: "avatar_url", type: "url | null", required: false, nullHandling: "Generate from initials + color", example: "/avatars/usr_x7y8z9.jpg" },
      { name: "rating", type: "float | null", required: false, nullHandling: "Show 'No ratings yet'", example: "4.8" },
      { name: "review_count", type: "int", required: true, nullHandling: "0", example: "12" },
      { name: "rooms_owned", type: "int", required: true, nullHandling: "0", example: "3" },
      { name: "rooms_joined", type: "int", required: true, nullHandling: "0", example: "5" },
      { name: "verified", type: "boolean", required: true, nullHandling: "false", example: "true" },
      { name: "member_since", type: "ISO date", required: true, nullHandling: "—", example: "2025-06-01T00:00:00Z" },
      { name: "reviews[]", type: "Review[]", required: false, nullHandling: "Empty state 'No reviews yet'", example: "[{id, author, rating, body, room_name, created_at}]" },
      { name: "badges[]", type: "Badge[]", required: false, nullHandling: "No badges section", example: "[{id, name, icon, earned_at}]" },
    ],
    apis: [
      { endpoint: "/api/v1/users/:id/profile", method: "GET", params: "—", responseFields: "{id, display_name, avatar_url, rating, review_count, rooms_owned, rooms_joined, verified, member_since, badges[]}", auth: "Public (limited fields); Auth (more fields)" },
      { endpoint: "/api/v1/users/:id/reviews", method: "GET", params: "?page=1&limit=10&sort=recent|highest", responseFields: "data[]{id, author_name, author_avatar, rating, body, room_name, created_at}", auth: "Public" },
      { endpoint: "/api/v1/users/me/profile", method: "PATCH", params: "body: {display_name?, avatar_url?}", responseFields: "{success}", auth: "Self only" },
      { endpoint: "/api/v1/reviews", method: "POST", params: "body: {target_user_id, room_id, rating, body}", responseFields: "{review_id}", auth: "Auth: must have shared room with target" },
    ],
    states: [
      { state: "Loading", trigger: "Route enter", uiBehavior: "Skeleton: avatar circle + name + stats row + review list", retryable: false },
      { state: "Not found", trigger: "Invalid user_id", uiBehavior: "404 + back to home", retryable: false },
      { state: "No reviews", trigger: "review_count === 0", uiBehavior: "Empty state 'No reviews yet' + soft illustration", retryable: false },
      { state: "Own profile", trigger: "user_id === auth.id", uiBehavior: "Show edit button + settings gear", retryable: false },
      { state: "Review submitted", trigger: "POST success", uiBehavior: "Optimistic add to list + success toast", retryable: false },
    ],
    formats: [
      { rule: "Rating", format: "1 decimal + ★. Color: ≥4 green, ≥3 yellow, <3 red", example: "★ 4.8 (green)", privacy: "Public" },
      { rule: "Member since", format: "Month + Year", example: "Июнь 2025 / Маусым 2025 / June 2025", privacy: "Public" },
      { rule: "Review body", format: "Max 500 chars. Sanitized. No HTML. Auto-link detection disabled.", example: "Great room owner, very resp…", privacy: "Public (author name shown)" },
      { rule: "Email/phone on own profile", format: "Masked: e••••@mail.com / +7 ••• ••• ••12", example: "a•••s@gmail.com", privacy: "Self: full; others: hidden" },
    ],
  },

  /* ── 9. NOTIFICATION CENTER ── */
  {
    id: "notif", titleKey: "dcNotifCenter", icon: Bell, color: "var(--eco-warning-500)",
    permission: "auth required",
    fields: [
      { name: "notification_id", type: "uuid", required: true, nullHandling: "—", example: "ntf_a1b2c3" },
      { name: "type", type: "enum", required: true, nullHandling: "—", example: "payment_success | room_join | dispute_filed | system_alert" },
      { name: "title", type: "string", required: true, nullHandling: "—", example: "Payment received — 3 500 ₸" },
      { name: "body", type: "string | null", required: false, nullHandling: "Title only", example: "Алмас К. paid for Beeline Unlim 15GB" },
      { name: "is_read", type: "boolean", required: true, nullHandling: "false", example: "false" },
      { name: "action_url", type: "string | null", required: false, nullHandling: "No click action", example: "/room/rm_a1b2c3d4" },
      { name: "created_at", type: "ISO date", required: true, nullHandling: "—", example: "2026-04-03T14:32:00Z" },
      { name: "group_key", type: "string | null", required: false, nullHandling: "No grouping", example: "room_rm_a1b2c3d4_payments" },
      { name: "priority", type: "enum", required: true, nullHandling: "'normal'", example: "low | normal | high | critical" },
    ],
    apis: [
      { endpoint: "/api/v1/notifications", method: "GET", params: "?is_read=bool&type=&page=1&limit=30", responseFields: "data[]{id, type, title, body, is_read, action_url, created_at, priority}, meta{total, unread_count}", auth: "Auth required" },
      { endpoint: "/api/v1/notifications/:id/read", method: "POST", params: "—", responseFields: "{success}", auth: "Auth: own notification" },
      { endpoint: "/api/v1/notifications/read-all", method: "POST", params: "body: {before?: ISO date}", responseFields: "{count_marked}", auth: "Auth required" },
      { endpoint: "/api/v1/notifications/subscribe", method: "POST", params: "body: {push_token, device_id}", responseFields: "{subscription_id}", auth: "Auth required" },
    ],
    states: [
      { state: "Loading", trigger: "Panel open / route enter", uiBehavior: "Skeleton: 5 notification rows", retryable: false },
      { state: "Empty", trigger: "No notifications", uiBehavior: "Illustration + 'All caught up! No notifications yet'", retryable: false },
      { state: "Real-time update", trigger: "WebSocket / SSE event", uiBehavior: "Prepend to list + badge counter update + subtle slide-in animation", retryable: false },
      { state: "Offline", trigger: "No connection", uiBehavior: "Cached list + 'Offline — may be outdated' banner", retryable: true },
      { state: "Rate-limited", trigger: "Too many reads", uiBehavior: "Batch mark-as-read, debounce 1s", retryable: true },
    ],
    formats: [
      { rule: "Timestamp", format: "'Just now' <1m; '{n}m ago' <60m; '{n}h ago' <24h; 'Yesterday'; date", example: "5 мин назад / 5 min ago", privacy: "Own notifications only" },
      { rule: "Amount in title", format: "Pre-formatted by server in user's locale", example: "3 500 ₸", privacy: "Own" },
      { rule: "Grouping", format: "Group by group_key → show count badge '3 payments for Room X'", example: "+3 more", privacy: "Own" },
      { rule: "Priority styling", format: "critical: red left border + bold; high: yellow; normal: none; low: muted", example: "🔴 Dispute filed against you", privacy: "Own" },
    ],
  },
];

/* ═══════ STATUS MAPPING TABLES ═══════ */
interface StatusMapRow { status: string; badge: string; color: string; icon: string; userAction: string; adminAction: string; }

const STATUS_MAPS: { entity: string; icon: React.ElementType; rows: StatusMapRow[] }[] = [
  {
    entity: "Room", icon: DoorOpen, rows: [
      { status: "draft", badge: "Draft", color: "neutral-400", icon: "FileCode2", userAction: "Complete setup", adminAction: "—" },
      { status: "pending_review", badge: "Pending Review", color: "warning-500", icon: "Clock", userAction: "Wait", adminAction: "Approve / reject" },
      { status: "active", badge: "Active", color: "success-500", icon: "Check", userAction: "Manage members", adminAction: "Monitor" },
      { status: "full", badge: "Full", color: "brand-600", icon: "Users", userAction: "Waitlist or leave", adminAction: "—" },
      { status: "blocked", badge: "Blocked", color: "danger-500", icon: "X", userAction: "Contact support", adminAction: "Unblock / investigate" },
      { status: "expired", badge: "Expired", color: "neutral-400", icon: "Clock", userAction: "Renew or leave", adminAction: "Auto-archive after 30d" },
      { status: "archived", badge: "Archived", color: "neutral-300", icon: "Archive", userAction: "View history only", adminAction: "Purge after 90d" },
    ],
  },
  {
    entity: "Room Member", icon: User, rows: [
      { status: "invited", badge: "Invited", color: "brand-600", icon: "Mail", userAction: "Accept / decline", adminAction: "—" },
      { status: "pending_payment", badge: "Pending Payment", color: "warning-500", icon: "CreditCard", userAction: "Complete payment", adminAction: "—" },
      { status: "active", badge: "Active", color: "success-500", icon: "Check", userAction: "Use plan", adminAction: "Monitor" },
      { status: "overdue", badge: "Overdue", color: "danger-500", icon: "AlertTriangle", userAction: "Pay within 72h", adminAction: "Notify → auto-remove" },
      { status: "removed", badge: "Removed", color: "neutral-400", icon: "UserMinus", userAction: "Rejoin if allowed", adminAction: "Audit log" },
      { status: "left", badge: "Left", color: "neutral-300", icon: "LogOut", userAction: "—", adminAction: "—" },
      { status: "banned", badge: "Banned", color: "danger-500", icon: "Ban", userAction: "Appeal via support", adminAction: "Review appeal" },
    ],
  },
  {
    entity: "Payment", icon: CreditCard, rows: [
      { status: "created", badge: "Created", color: "neutral-400", icon: "Plus", userAction: "—", adminAction: "—" },
      { status: "processing", badge: "Processing", color: "warning-500", icon: "Loader", userAction: "Wait", adminAction: "Monitor" },
      { status: "on_hold", badge: "On Hold", color: "brand-600", icon: "Pause", userAction: "Wait or cancel", adminAction: "Investigate if >1h" },
      { status: "succeeded", badge: "Succeeded", color: "success-500", icon: "Check", userAction: "View receipt", adminAction: "—" },
      { status: "failed", badge: "Failed", color: "danger-500", icon: "X", userAction: "Retry / change card", adminAction: "Monitor failure rate" },
      { status: "refund_pending", badge: "Refund Pending", color: "warning-500", icon: "RotateCcw", userAction: "Wait", adminAction: "Approve refund" },
      { status: "refunded", badge: "Refunded", color: "brand-600", icon: "RotateCcw", userAction: "Funds returned", adminAction: "Audit" },
      { status: "canceled", badge: "Canceled", color: "neutral-300", icon: "X", userAction: "—", adminAction: "—" },
    ],
  },
  {
    entity: "Dispute", icon: Shield, rows: [
      { status: "open", badge: "Open", color: "warning-500", icon: "AlertTriangle", userAction: "Add evidence", adminAction: "Assign + investigate" },
      { status: "investigating", badge: "Investigating", color: "brand-600", icon: "Search", userAction: "Respond to requests", adminAction: "Gather evidence" },
      { status: "awaiting_evidence", badge: "Awaiting Evidence", color: "warning-500", icon: "Upload", userAction: "Upload evidence by deadline", adminAction: "Wait for deadline" },
      { status: "resolved", badge: "Resolved", color: "success-500", icon: "CheckCircle", userAction: "View decision", adminAction: "Close" },
      { status: "escalated", badge: "Escalated", color: "danger-500", icon: "ArrowUp", userAction: "Wait", adminAction: "Senior admin review" },
      { status: "closed", badge: "Closed", color: "neutral-300", icon: "Archive", userAction: "View history", adminAction: "—" },
    ],
  },
  {
    entity: "Support Ticket", icon: MessageSquare, rows: [
      { status: "open", badge: "Open", color: "success-500", icon: "Inbox", userAction: "Wait for response", adminAction: "Assign + respond" },
      { status: "in_progress", badge: "In Progress", color: "brand-600", icon: "Loader", userAction: "Respond if asked", adminAction: "Working on it" },
      { status: "waiting_user", badge: "Waiting on User", color: "warning-500", icon: "Clock", userAction: "Respond within 72h", adminAction: "Wait" },
      { status: "resolved", badge: "Resolved", color: "success-500", icon: "Check", userAction: "Confirm or reopen", adminAction: "—" },
      { status: "closed", badge: "Closed", color: "neutral-300", icon: "Archive", userAction: "Reopen if needed", adminAction: "—" },
    ],
  },
];

/* ═══════ FORMATTING SPEC ═══════ */
interface FormatSpecRow { category: string; rule: string; format: string; ruExample: string; kzExample: string; enExample: string; }

const FORMAT_SPEC: FormatSpecRow[] = [
  { category: "Currency (KZT)", rule: "Amount from tiyn (1/100)", format: "Math.ceil(tiyn / 100).toLocaleString(locale) + ' ₸'", ruExample: "3 500 ₸", kzExample: "3 500 ₸", enExample: "3,500 ₸" },
  { category: "Currency (KZT)", rule: "Negative / refund", format: "Prefix '−' (minus sign U+2212)", ruExample: "−2 990 ₸", kzExample: "−2 990 ₸", enExample: "−2,990 ₸" },
  { category: "Currency (KZT)", rule: "Free / zero", format: "i18n key 'free'", ruExample: "Бесплатно", kzExample: "Тегін", enExample: "Free" },
  { category: "Date", rule: "Full date", format: "toLocaleDateString(locale, {day:'numeric', month:'long', year:'numeric'})", ruExample: "3 апреля 2026", kzExample: "3 сәуір 2026", enExample: "April 3, 2026" },
  { category: "Date", rule: "Short date", format: "toLocaleDateString(locale, {day:'numeric', month:'short'})", ruExample: "3 апр.", kzExample: "3 сәу.", enExample: "Apr 3" },
  { category: "Date", rule: "Relative time", format: "'Just now' <1m, '{n}m' <60m, '{n}h' <24h, 'Yesterday', then date", ruExample: "5 мин назад", kzExample: "5 мин бұрын", enExample: "5m ago" },
  { category: "Date", rule: "Timestamp (admin)", format: "ISO 8601 + relative in parentheses", ruExample: "2026-04-03T14:32:00Z (2ч назад)", kzExample: "2026-04-03T14:32:00Z (2с бұрын)", enExample: "2026-04-03T14:32:00Z (2h ago)" },
  { category: "Identifiers", rule: "Intent ID", format: "Show first 14 chars + '…'. Click to copy full. Monospace.", ruExample: "pi_3Qk8aH2eZv…", kzExample: "pi_3Qk8aH2eZv…", enExample: "pi_3Qk8aH2eZv…" },
  { category: "Identifiers", rule: "Transaction ID", format: "Same pattern as Intent ID", ruExample: "ch_3Qk8aH2eZv…", kzExample: "ch_3Qk8aH2eZv…", enExample: "ch_3Qk8aH2eZv…" },
  { category: "Identifiers", rule: "Ticket ID", format: "TKT-{YYYY}-{5-digit}", ruExample: "TKT-2026-04158", kzExample: "TKT-2026-04158", enExample: "TKT-2026-04158" },
  { category: "Identifiers", rule: "Dispute ID", format: "DSP-{YYYY}-{5-digit}", ruExample: "DSP-2026-00312", kzExample: "DSP-2026-00312", enExample: "DSP-2026-00312" },
  { category: "Masking", rule: "Card number", format: "'•••• {last4}'", ruExample: "•••• 4832", kzExample: "•••• 4832", enExample: "•••• 4832" },
  { category: "Masking", rule: "Phone number", format: "'+7 ••• ••• ••{last2}'", ruExample: "+7 ••• ••• ••12", kzExample: "+7 ••• ••• ••12", enExample: "+7 ••• ••• ••12" },
  { category: "Masking", rule: "Email", format: "'{first}{dots}@{domain}'", ruExample: "a•••s@gmail.com", kzExample: "a•••s@gmail.com", enExample: "a•••s@gmail.com" },
  { category: "Masking", rule: "Full name (public)", format: "'{first_name} {last_initial}.'", ruExample: "Алмас К.", kzExample: "Алмас К.", enExample: "Almas K." },
  { category: "Masking", rule: "Reveal with reason", format: "Admin clicks reveal → audit log entry → show full value for 30s", ruExample: "🔓 Revealed for 30s", kzExample: "🔓 30с ашылды", enExample: "🔓 Revealed for 30s" },
  { category: "SLA Timers", rule: "Countdown display", format: "If <1h: mm:ss. If <24h: Xh Ym. If >24h: Xd", ruExample: "14:32 / 3ч 15м / 2д", kzExample: "14:32 / 3с 15м / 2к", enExample: "14:32 / 3h 15m / 2d" },
  { category: "SLA Timers", rule: "SLA color coding", format: ">50% left: green. 25-50%: yellow. <25%: red. Breached: red pulse.", ruExample: "🟢/🟡/🔴", kzExample: "🟢/🟡/🔴", enExample: "🟢/🟡/🔴" },
  { category: "Numbers", rule: "Large numbers", format: "toLocaleString(locale) for grouping separator", ruExample: "42 158", kzExample: "42 158", enExample: "42,158" },
  { category: "Numbers", rule: "Percentages", format: "'{n}%' — no space before %", ruExample: "87%", kzExample: "87%", enExample: "87%" },
];

/* ═══════ I18N CONVENTIONS ═══════ */
interface I18nConvRow { pattern: string; example: string; usage: string; }

const I18N_CONVENTIONS: I18nConvRow[] = [
  { pattern: "{module}{Screen}{Element}", example: "catListTitle", usage: "Catalog → List screen → title" },
  { pattern: "{module}{Entity}{Action}", example: "roomJoinBtn", usage: "Room module → join action button" },
  { pattern: "{module}{Entity}{Status}", example: "payStatusSucceeded", usage: "Payment module → succeeded status label" },
  { pattern: "{module}{Entity}{Empty}", example: "roomMembersEmpty", usage: "Empty state for room members list" },
  { pattern: "{module}{Entity}{Error}{Type}", example: "payErrorDeclined", usage: "Payment error → card declined message" },
  { pattern: "err{Module}{Code}", example: "errPayInsufficientFunds", usage: "Error mapping for API error codes" },
  { pattern: "sla{Entity}{State}", example: "slaTicketBreached", usage: "SLA breach label for tickets" },
  { pattern: "fmt{Type}", example: "fmtDateRelative", usage: "Format helper labels" },
  { pattern: "val{Field}{Rule}", example: "valEmailInvalid", usage: "Validation messages" },
  { pattern: "toast{Action}{Result}", example: "toastPaymentSuccess", usage: "Toast/snackbar messages" },
  { pattern: "modal{Action}Title", example: "modalLeaveRoomTitle", usage: "Modal/dialog titles" },
  { pattern: "modal{Action}Body", example: "modalLeaveRoomBody", usage: "Modal/dialog body text" },
  { pattern: "placeholder{Field}", example: "placeholderSearch", usage: "Input placeholder text" },
  { pattern: "aria{Component}{State}", example: "ariaNavMenuOpen", usage: "Screen reader labels" },
];

/* ═══════ TABLE COMPONENTS ═══════ */
function DataContractTable({ fields }: { fields: FieldRow[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ background: "var(--eco-bg)" }}>
            {[t("dcField"), t("dcType"), t("dcRequired"), t("dcNullHandling"), t("dcExample")].map((h) => (
              <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {fields.map((f, i) => (
            <tr key={f.name} style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <td className="px-3 py-2"><CodeChip>{f.name}</CodeChip></td>
              <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-brand-600)" }}>{f.type}</code></td>
              <td className="px-3 py-2">{f.required ? <Check size={11} style={{ color: "var(--eco-success-500)" }} /> : <span style={{ color: "var(--eco-text-tertiary)" }}>—</span>}</td>
              <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{f.nullHandling}</td>
              <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-text-secondary)" }}>{f.example}</code></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApiMappingTable({ apis }: { apis: ApiRow[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ background: "var(--eco-bg)" }}>
            {[t("dcEndpoint"), t("dcMethod"), t("dcParams"), t("dcResponse"), t("dcPermission")].map((h) => (
              <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {apis.map((a, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <td className="px-3 py-2"><CodeChip>{a.endpoint}</CodeChip></td>
              <td className="px-3 py-2"><MethodBadge method={a.method} /></td>
              <td className="px-3 py-2 max-w-[200px]"><code className="text-[10px] break-all" style={{ color: "var(--eco-text-secondary)" }}>{a.params}</code></td>
              <td className="px-3 py-2 max-w-[240px]"><code className="text-[10px] break-all" style={{ color: "var(--eco-text-secondary)" }}>{a.responseFields}</code></td>
              <td className="px-3 py-2"><span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{a.auth}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StateHandlingTable({ states }: { states: StateRow[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ background: "var(--eco-bg)" }}>
            {[t("dcState"), "Trigger", t("dcBehavior"), "Retry"].map((h) => (
              <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {states.map((s, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <td className="px-3 py-2">
                <span className="text-[10px] px-1.5 py-0.5 rounded" style={{
                  background: s.state.includes("Error") || s.state.includes("Failed") || s.state.includes("denied") ? "var(--eco-danger-100)" :
                    s.state.includes("Loading") || s.state.includes("Pending") || s.state.includes("Processing") ? "var(--eco-warning-100)" :
                    s.state.includes("Empty") || s.state.includes("No ") ? "var(--eco-neutral-100)" :
                    s.state.includes("Success") || s.state.includes("Succeeded") ? "var(--eco-success-100)" : "var(--eco-brand-50)",
                  color: s.state.includes("Error") || s.state.includes("Failed") || s.state.includes("denied") ? "var(--eco-danger-500)" :
                    s.state.includes("Loading") || s.state.includes("Pending") || s.state.includes("Processing") ? "var(--eco-warning-500)" :
                    s.state.includes("Empty") || s.state.includes("No ") ? "var(--eco-text-tertiary)" :
                    s.state.includes("Success") || s.state.includes("Succeeded") ? "var(--eco-success-500)" : "var(--eco-primary)",
                }}>{s.state}</span>
              </td>
              <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{s.trigger}</td>
              <td className="px-3 py-2" style={{ color: "var(--eco-text)" }}>{s.uiBehavior}</td>
              <td className="px-3 py-2">{s.retryable ? <Badge variant="success">Yes</Badge> : <span style={{ color: "var(--eco-text-tertiary)" }}>No</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormatRulesTable({ formats }: { formats: FormatRow[] }) {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[11px]">
        <thead>
          <tr style={{ background: "var(--eco-bg)" }}>
            {[t("dcRule"), t("dcFormat"), t("dcExample"), "Privacy"].map((h) => (
              <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {formats.map((f, i) => (
            <tr key={i} style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <td className="px-3 py-2" style={{ color: "var(--eco-text)" }}>{f.rule}</td>
              <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-brand-600)" }}>{f.format}</code></td>
              <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-text-secondary)" }}>{f.example}</code></td>
              <td className="px-3 py-2">
                <span className="text-[10px] flex items-center gap-1" style={{ color: f.privacy.includes("Admin") || f.privacy.includes("Masked") ? "var(--eco-warning-500)" : f.privacy.includes("Public") ? "var(--eco-success-500)" : "var(--eco-text-tertiary)" }}>
                  {f.privacy.includes("Admin") || f.privacy.includes("Masked") ? <EyeOff size={9} /> : f.privacy.includes("Public") ? <Eye size={9} /> : <Lock size={9} />}
                  {f.privacy}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════ SCREEN CONTRACT CARD ═══════ */
function ScreenContractCard({ contract }: { contract: ScreenContract }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState<string | null>("fields");
  const Icon = contract.icon;

  const sections = [
    { id: "fields", label: t("dcDataContract"), icon: Database, count: contract.fields.length },
    { id: "apis", label: t("dcApiMapping"), icon: Server, count: contract.apis.length },
    { id: "states", label: t("dcStateHandling"), icon: Layers, count: contract.states.length },
    { id: "formats", label: t("dcFormatRules"), icon: Type, count: contract.formats.length },
  ];

  return (
    <SC className="!p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${contract.color}15` }}>
          <Icon size={16} style={{ color: contract.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t(contract.titleKey)}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
              <Key size={9} /> {contract.permission}
            </span>
          </div>
        </div>
        <div className="flex gap-1.5">
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{contract.fields.length} fields</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-success-100)", color: "var(--eco-success-500)" }}>{contract.apis.length} endpoints</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-warning-100)", color: "var(--eco-warning-500)" }}>{contract.states.length} states</span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-0 px-2 pt-2" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] cursor-pointer transition-colors rounded-t-lg"
            style={{
              background: expanded === s.id ? "var(--eco-bg)" : "transparent",
              color: expanded === s.id ? "var(--eco-text)" : "var(--eco-text-tertiary)",
              borderBottom: expanded === s.id ? "2px solid var(--eco-primary)" : "2px solid transparent",
            }}
          >
            <s.icon size={11} />
            {s.label}
            <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-tertiary)" }}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {expanded === "fields" && <DataContractTable fields={contract.fields} />}
      {expanded === "apis" && <ApiMappingTable apis={contract.apis} />}
      {expanded === "states" && <StateHandlingTable states={contract.states} />}
      {expanded === "formats" && <FormatRulesTable formats={contract.formats} />}
    </SC>
  );
}

/* ═══════ STATUS MAP SECTION ═══════ */
function StatusMapSection() {
  const { t } = useI18n();
  const [activeEntity, setActiveEntity] = useState(0);

  return (
    <SC className="!p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <Palette size={16} style={{ color: "var(--eco-primary)" }} />
        </div>
        <div>
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t("dcStatusMaps")}</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>5 entities · {STATUS_MAPS.reduce((s, m) => s + m.rows.length, 0)} {t("dcStatuses")}</div>
        </div>
      </div>

      {/* Entity tabs */}
      <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--eco-border)", background: "var(--eco-bg)" }}>
        {STATUS_MAPS.map((m, i) => (
          <button
            key={m.entity}
            onClick={() => setActiveEntity(i)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] cursor-pointer whitespace-nowrap transition-colors"
            style={{
              background: activeEntity === i ? "var(--eco-primary)" : "transparent",
              color: activeEntity === i ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
            }}
          >
            <m.icon size={11} /> {m.entity}
            <span className="text-[9px] px-1 rounded-full" style={{
              background: activeEntity === i ? "rgba(255,255,255,0.2)" : "var(--eco-neutral-100)",
              color: activeEntity === i ? "var(--eco-text-on-primary)" : "var(--eco-text-tertiary)",
            }}>{m.rows.length}</span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: "var(--eco-bg)" }}>
              {[t("dcStatus"), t("dcBadge"), t("dcColor"), "User Action", "Admin Action"].map((h) => (
                <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {STATUS_MAPS[activeEntity].rows.map((r) => (
              <tr key={r.status} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                <td className="px-3 py-2"><CodeChip>{r.status}</CodeChip></td>
                <td className="px-3 py-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: `var(--eco-${r.color})18`, color: `var(--eco-${r.color})` }}>{r.badge}</span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full" style={{ background: `var(--eco-${r.color})` }} />
                    <code className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>--eco-{r.color}</code>
                  </div>
                </td>
                <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{r.userAction}</td>
                <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{r.adminAction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SC>
  );
}

/* ═══════ FORMATTING SPEC SECTION ═══════ */
function FormattingSpecSection() {
  const { t } = useI18n();
  const [activeCat, setActiveCat] = useState("Currency (KZT)");
  const categories = [...new Set(FORMAT_SPEC.map((r) => r.category))];
  const filtered = FORMAT_SPEC.filter((r) => r.category === activeCat);

  return (
    <SC className="!p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
          <Hash size={16} style={{ color: "var(--eco-success-500)" }} />
        </div>
        <div>
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t("dcFormattingSpec")}</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{categories.length} categories · {FORMAT_SPEC.length} rules</div>
        </div>
      </div>

      <div className="flex gap-1 px-3 py-2 overflow-x-auto" style={{ borderBottom: "1px solid var(--eco-border)", background: "var(--eco-bg)" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer whitespace-nowrap transition-colors"
            style={{
              background: activeCat === cat ? "var(--eco-primary)" : "transparent",
              color: activeCat === cat ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
            }}
          >{cat}</button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: "var(--eco-bg)" }}>
              {[t("dcRule"), t("dcFormat"), "RU", "KZ", "EN"].map((h) => (
                <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                <td className="px-3 py-2" style={{ color: "var(--eco-text)" }}>{r.rule}</td>
                <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-brand-600)" }}>{r.format}</code></td>
                <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-text-secondary)" }}>{r.ruExample}</code></td>
                <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-text-secondary)" }}>{r.kzExample}</code></td>
                <td className="px-3 py-2"><code className="text-[10px]" style={{ color: "var(--eco-text-secondary)" }}>{r.enExample}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SC>
  );
}

/* ═══════ I18N CONVENTIONS SECTION ═══════ */
function I18nConventionsSection() {
  const { t } = useI18n();
  return (
    <SC className="!p-0 overflow-hidden">
      <div className="px-5 py-4 flex items-center gap-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "var(--eco-warning-100)" }}>
          <Globe2 size={16} style={{ color: "var(--eco-warning-500)" }} />
        </div>
        <div>
          <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{t("dcI18nConventions")}</div>
          <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{I18N_CONVENTIONS.length} naming patterns</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: "var(--eco-bg)" }}>
              {["Pattern", t("dcExample"), "Usage"].map((h) => (
                <th key={h} className="text-left px-3 py-2" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {I18N_CONVENTIONS.map((r, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                <td className="px-3 py-2"><code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{r.pattern}</code></td>
                <td className="px-3 py-2"><CodeChip>{r.example}</CodeChip></td>
                <td className="px-3 py-2" style={{ color: "var(--eco-text-secondary)" }}>{r.usage}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Placeholder rules */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--eco-border)", background: "var(--eco-bg)" }}>
        <SL>PLACEHOLDER CONVENTIONS</SL>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { pattern: "{count}", desc: "Numeric values for pluralization", example: '"{count} тарифов" → "14 тарифов"' },
            { pattern: "{name}", desc: "User or entity display names", example: '"{name} joined" → "Алмас К. joined"' },
            { pattern: "{amount}", desc: "Pre-formatted currency strings", example: '"{amount}" → "3 500 ₸"' },
            { pattern: "{date}", desc: "Pre-formatted date strings", example: '"{date}" → "3 апреля 2026"' },
            { pattern: "{operator}", desc: "Operator brand name (never translate)", example: '"{operator}" → "Beeline"' },
            { pattern: "{time_remaining}", desc: "SLA/countdown formatted string", example: '"{time_remaining}" → "2h 14m"' },
          ].map((p) => (
            <div key={p.pattern} className="rounded-lg p-3" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <CodeChip>{p.pattern}</CodeChip>
              </div>
              <div className="text-[11px] mb-1" style={{ color: "var(--eco-text-secondary)" }}>{p.desc}</div>
              <code className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{p.example}</code>
            </div>
          ))}
        </div>
      </div>
    </SC>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export function DataContractsApiMappingPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<"screens" | "statuses" | "formatting" | "i18n">("screens");

  const totalFields = CONTRACTS.reduce((s, c) => s + c.fields.length, 0);
  const totalApis = CONTRACTS.reduce((s, c) => s + c.apis.length, 0);
  const totalStates = CONTRACTS.reduce((s, c) => s + c.states.length, 0);
  const totalStatuses = STATUS_MAPS.reduce((s, m) => s + m.rows.length, 0);

  const tabs = [
    { id: "screens" as const, label: `Screen Contracts (${CONTRACTS.length})`, icon: Layers },
    { id: "statuses" as const, label: `Status Maps (${totalStatuses})`, icon: Palette },
    { id: "formatting" as const, label: `Formatting (${FORMAT_SPEC.length})`, icon: Hash },
    { id: "i18n" as const, label: `i18n (${I18N_CONVENTIONS.length})`, icon: Globe2 },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>Page 23</span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>Dev Accelerant</span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>{t("dcTitle")}</h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>{t("dcSubtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-8">
        {[
          { n: CONTRACTS.length.toString(), label: "Screens", color: "var(--eco-primary)" },
          { n: totalFields.toString(), label: "Fields", color: "var(--eco-brand-600)" },
          { n: totalApis.toString(), label: "Endpoints", color: "var(--eco-success-500)" },
          { n: totalStates.toString(), label: "UI States", color: "var(--eco-warning-500)" },
          { n: totalStatuses.toString(), label: "Statuses", color: "var(--eco-danger-500)" },
          { n: STATUS_MAPS.length.toString(), label: "Entities", color: "var(--eco-text-secondary)" },
          { n: FORMAT_SPEC.length.toString(), label: "Format Rules", color: "var(--eco-primary)" },
          { n: I18N_CONVENTIONS.length.toString(), label: "i18n Patterns", color: "var(--eco-warning-500)" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <div className="text-[20px] tabular-nums" style={{ color: s.color }}>{s.n}</div>
            <div className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--eco-surface)" }}>
        {tabs.map(({ id, label, icon: TIcon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 flex-1 px-4 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer justify-center whitespace-nowrap"
            style={{
              background: activeTab === id ? "var(--eco-bg)" : "transparent",
              color: activeTab === id ? "var(--eco-text)" : "var(--eco-text-tertiary)",
              boxShadow: activeTab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <TIcon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "screens" && (
        <div className="flex flex-col gap-6">
          {/* Quick jump */}
          <div className="flex gap-2 flex-wrap">
            {CONTRACTS.map((c) => (
              <a
                key={c.id}
                href={`#contract-${c.id}`}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text-secondary)" }}
              >
                <c.icon size={11} style={{ color: c.color }} />
                {c.id}
              </a>
            ))}
          </div>

          {CONTRACTS.map((c) => (
            <div key={c.id} id={`contract-${c.id}`}>
              <ScreenContractCard contract={c} />
            </div>
          ))}
        </div>
      )}

      {activeTab === "statuses" && <StatusMapSection />}
      {activeTab === "formatting" && <FormattingSpecSection />}
      {activeTab === "i18n" && <I18nConventionsSection />}

      {/* Footer note */}
      <div className="mt-8 rounded-xl px-5 py-3 flex items-start gap-2" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
        <div>
          <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
            All endpoints are placeholders (<code className="text-[10px]" style={{ color: "var(--eco-primary)" }}>/api/v1/...</code>). Actual base URL, auth headers (Bearer JWT), rate limits, and pagination cursors will be defined in the API gateway spec. All amounts are stored in tiyn (1 KZT = 100 tiyn). Dates are always UTC ISO 8601 from the server; client formats using user's locale.
          </span>
        </div>
      </div>
    </div>
  );
}
