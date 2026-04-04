import { useState, useMemo } from "react";
import { useI18n } from "../i18n-provider";
import {
  Bell, BookOpen, Box, Check, CheckCircle2, ChevronDown,
  Circle, Clock, Code, CreditCard, Database, DoorOpen, Eye, EyeOff,
  FileCode2, Gauge, Globe2, Hash, Info, Key, Layers,
  List, Lock, MessageSquare, Monitor, PenLine,
  Rocket, Search, Shield, ShieldCheck,
  Smartphone, Star, Target, WifiOff, X, Zap,
} from "lucide-react";

/* ═══ TYPES ═══ */
type Priority = "critical" | "must" | "nice";
type CheckStatus = "done" | "in-progress" | "pending" | "blocked";

interface CheckItem {
  id: string;
  task: string;
  acceptance: string[];
  priority: Priority;
  status: CheckStatus;
  blocks?: string[];
  notes?: string;
}

interface ComponentDef {
  name: string;
  description: string;
  variants: string[];
  props: string[];
  a11y: string;
  blocksScreens: string[];
  priority: Priority;
  status: CheckStatus;
}

interface ModuleChecklist {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  screens: string[];
  items: CheckItem[];
}

interface PerfRule {
  id: string;
  rule: string;
  rationale: string;
  acceptance: string;
  category: "loading" | "lists" | "images" | "forms" | "navigation" | "offline";
  priority: Priority;
}

interface SecurityRule {
  id: string;
  rule: string;
  acceptance: string[];
  auditHint: string;
  category: "pii" | "auth" | "data" | "admin" | "logging";
  priority: Priority;
}

interface DodItem {
  category: string;
  items: string[];
}

/* ═══ PRIMITIVES ═══ */
const SC = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>
);

const PriorityBadge = ({ p }: { p: Priority }) => {
  const map = {
    critical: { bg: "var(--eco-danger-100)", color: "var(--eco-danger-500)", label: "P0 Critical" },
    must: { bg: "var(--eco-warning-100)", color: "var(--eco-warning-500)", label: "P1 Must" },
    nice: { bg: "var(--eco-neutral-100)", color: "var(--eco-text-tertiary)", label: "P2 Nice" },
  };
  const m = map[p];
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: m.bg, color: m.color }}>{m.label}</span>;
};

const StatusIcon = ({ s }: { s: CheckStatus }) => {
  if (s === "done") return <CheckCircle2 size={14} style={{ color: "var(--eco-success-500)" }} />;
  if (s === "in-progress") return <Clock size={14} style={{ color: "var(--eco-warning-500)" }} />;
  if (s === "blocked") return <X size={14} style={{ color: "var(--eco-danger-500)" }} />;
  return <Circle size={14} style={{ color: "var(--eco-neutral-300)" }} />;
};

const StatusLabel = ({ s }: { s: CheckStatus }) => {
  const map: Record<CheckStatus, { color: string; label: string }> = {
    done: { color: "var(--eco-success-500)", label: "Done" },
    "in-progress": { color: "var(--eco-warning-500)", label: "In Progress" },
    pending: { color: "var(--eco-text-tertiary)", label: "Pending" },
    blocked: { color: "var(--eco-danger-500)", label: "Blocked" },
  };
  const m = map[s];
  return <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: `${m.color}18`, color: m.color }}>{m.label}</span>;
};

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: COMPONENT PREREQUISITES
   ═══════════════════════════════════════════════════════════════════════════ */
const COMPONENTS: ComponentDef[] = [
  {
    name: "Button", description: "Primary interactive element", variants: ["primary", "secondary", "ghost", "destructive"],
    props: ["variant", "size (sm/md/lg)", "disabled", "loading", "icon", "fullWidth"],
    a11y: "Focus ring, disabled state announced, loading spinner with aria-busy", blocksScreens: ["All screens"],
    priority: "critical", status: "done",
  },
  {
    name: "Badge", description: "Status and count indicator", variants: ["success", "warning", "danger", "info", "neutral"],
    props: ["variant", "children", "dot", "count"],
    a11y: "Color not sole indicator — always pair with text/icon", blocksScreens: ["Room detail", "Admin dashboard", "Payments"],
    priority: "critical", status: "done",
  },
  {
    name: "Input / TextArea", description: "Form text inputs", variants: ["default", "error", "disabled", "with-icon", "with-counter"],
    props: ["label", "placeholder", "error", "helperText", "maxLength", "type"],
    a11y: "Label association via htmlFor, error announced via aria-describedby", blocksScreens: ["Auth", "Support", "Create room", "Profile"],
    priority: "critical", status: "done",
  },
  {
    name: "Select / Dropdown", description: "Single-value picker", variants: ["default", "error", "disabled", "searchable"],
    props: ["options[]", "value", "onChange", "placeholder", "error"],
    a11y: "Keyboard nav (arrow keys), escape to close, aria-expanded", blocksScreens: ["Catalog filters", "Create room", "Admin"],
    priority: "critical", status: "done",
  },
  {
    name: "Modal / Dialog", description: "Overlay confirmation and forms", variants: ["confirm", "destructive", "info", "form"],
    props: ["open", "onClose", "title", "children", "actions[]"],
    a11y: "Focus trap, escape to close, aria-modal, return focus on close", blocksScreens: ["Leave room", "Delete account", "Dispute actions"],
    priority: "critical", status: "done",
  },
  {
    name: "Toast / Snackbar", description: "Non-blocking feedback", variants: ["success", "error", "warning", "info"],
    props: ["message", "variant", "duration", "action?"],
    a11y: "role=status, aria-live=polite, auto-dismiss configurable", blocksScreens: ["All screens with mutations"],
    priority: "critical", status: "done",
  },
  {
    name: "Skeleton", description: "Loading placeholder shapes", variants: ["text", "card", "avatar", "table-row", "full-page"],
    props: ["variant", "width", "height", "count"],
    a11y: "aria-busy=true on container, aria-label='Loading'", blocksScreens: ["All list screens", "Detail screens"],
    priority: "critical", status: "done",
  },
  {
    name: "Card (Room/Plan)", description: "Content card for catalog and lists", variants: ["room-card", "plan-card", "operator-card", "compact"],
    props: ["data", "onClick", "loading", "variant"],
    a11y: "Interactive cards are buttons or links, not divs", blocksScreens: ["Catalog", "My rooms", "Operator page"],
    priority: "critical", status: "done",
  },
  {
    name: "Avatar", description: "User profile image", variants: ["image", "initials", "anonymous", "group"],
    props: ["src", "name", "size (sm/md/lg)", "verified"],
    a11y: "alt text = user name, decorative if beside text name", blocksScreens: ["Room detail", "Profile", "Reviews"],
    priority: "must", status: "done",
  },
  {
    name: "EmptyState", description: "Zero-data illustration + CTA", variants: ["no-rooms", "no-results", "no-notifications", "no-reviews", "no-payments", "generic"],
    props: ["variant", "title", "subtitle", "actionLabel", "onAction"],
    a11y: "Illustration is decorative (aria-hidden), CTA is focusable", blocksScreens: ["All list screens"],
    priority: "must", status: "done",
  },
  {
    name: "ErrorState", description: "Error display with retry", variants: ["network", "server", "403", "404", "rate-limit", "generic"],
    props: ["variant", "title", "subtitle", "onRetry", "onContact"],
    a11y: "Error announced via aria-live=assertive on mount", blocksScreens: ["All screens"],
    priority: "critical", status: "done",
  },
  {
    name: "Pagination / InfiniteScroll", description: "List navigation", variants: ["numbered", "load-more", "infinite-scroll", "cursor"],
    props: ["page", "totalPages", "onPageChange", "loading"],
    a11y: "Current page announced, disabled prev/next when at bounds", blocksScreens: ["Catalog", "Payment history", "Admin lists"],
    priority: "must", status: "pending",
  },
  {
    name: "Table", description: "Data table for admin and history views", variants: ["default", "sortable", "selectable", "compact"],
    props: ["columns[]", "data[]", "sortBy", "onSort", "loading", "emptyState"],
    a11y: "Proper th/td semantics, sortable columns have aria-sort", blocksScreens: ["Payment history", "Admin all-views"],
    priority: "must", status: "done",
  },
  {
    name: "SLA Timer", description: "Countdown display for SLA deadlines", variants: ["badge", "inline", "countdown"],
    props: ["deadline", "warningThreshold", "breachLabel"],
    a11y: "aria-live for updates, color + text (never color alone)", blocksScreens: ["Support tickets", "Admin disputes"],
    priority: "must", status: "pending",
  },
  {
    name: "CopyableID", description: "Monospace truncated ID with copy action", variants: ["inline", "block"],
    props: ["value", "label", "truncateAt"],
    a11y: "Copy button has aria-label, success announced via aria-live", blocksScreens: ["Payment history", "Receipts", "Admin"],
    priority: "must", status: "done",
  },
  {
    name: "WaveDivider", description: "Decorative wave SVG separator", variants: ["default", "flip"],
    props: ["flip", "className"],
    a11y: "aria-hidden (purely decorative)", blocksScreens: ["Home", "About", "How it works"],
    priority: "nice", status: "done",
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: MODULE CHECKLISTS
   ═══════════════════════════════════════════════════════════════════════════ */
const MODULES: ModuleChecklist[] = [
  {
    id: "auth", name: "Auth", icon: Key, color: "var(--eco-primary)",
    screens: ["Login", "Register", "Forgot Password", "Email Verification"],
    items: [
      { id: "auth-1", task: "Login form with email + password", acceptance: ["Form validates email format + min 8 chars password", "Error states: invalid credentials, locked account, rate limit", "Loading state disables form + shows spinner", "Success → redirect to previous page or home", "RU/KZ/EN placeholders and validation messages"], priority: "critical", status: "done" },
      { id: "auth-2", task: "Registration form with display name", acceptance: ["Name 2-50 chars, email format, password 8+ with complexity hint", "Duplicate email → specific error, not generic", "Terms checkbox required before submit", "Success → welcome notification + redirect to catalog"], priority: "critical", status: "done" },
      { id: "auth-3", task: "Forgot password flow", acceptance: ["Email input → success message regardless (no email enumeration)", "Rate limit: max 3 requests per 15 min per email", "Link expires after 1 hour"], priority: "critical", status: "done" },
      { id: "auth-4", task: "Session management", acceptance: ["JWT refresh token rotation", "Auto-logout after 30 min inactivity + toast", "New device login triggers notification (Page 24 — secNewDevice)"], priority: "critical", status: "pending" },
      { id: "auth-5", task: "Rate limiting on auth endpoints", acceptance: ["5 failed attempts → 15 min lockout", "Lockout message shows remaining time (Page 24 — secAccountLockedSub)", "No timing-based enumeration attacks"], priority: "critical", status: "pending" },
    ],
  },
  {
    id: "catalog", name: "Catalog", icon: Search, color: "var(--eco-brand-600)",
    screens: ["Operator List", "Operator Detail", "Plan Cards", "Search + Filters"],
    items: [
      { id: "cat-1", task: "Operator list with pagination", acceptance: ["20 per page, skeleton loading (3 card shapes)", "Sort: popular, price, rating", "5G filter toggle", "Empty state if no match (Page 24 — emptySearchTitle)", "Cached for offline if previously visited"], priority: "critical", status: "done" },
      { id: "cat-2", task: "Operator detail page", acceptance: ["Hero with logo, name, description, coverage badge", "Plans list with shareable toggle filter", "Share price calculated: ceil(price / max_members)", "Unlimited data/calls shows 'Безлимит' / 'Шексіз' / 'Unlimited'", "Open rooms count with link to browse"], priority: "critical", status: "done" },
      { id: "cat-3", task: "Plan card component", acceptance: ["Shows: name, price, data, calls, SMS, shareable badge, member count", "Non-shareable plans grayed with explanation", "Price formatted as KZT with locale grouping", "Responsive: 1 col mobile, 2 col tablet, 3 col desktop"], priority: "critical", status: "done" },
      { id: "cat-4", task: "Search with debounce", acceptance: ["300ms debounce on keystroke", "Min 2 chars before search fires", "Clear button resets to full list", "Results highlight matching term"], priority: "must", status: "pending" },
      { id: "cat-5", task: "Offline cached catalog", acceptance: ["Previously visited operators/plans served from cache", "Stale banner shown: 'Offline — data may be outdated'", "Retry button appears when connection restored"], priority: "nice", status: "pending" },
    ],
  },
  {
    id: "rooms", name: "Rooms", icon: DoorOpen, color: "var(--eco-success-500)",
    screens: ["Room Detail", "Create Room", "My Rooms", "Member Detail", "Owner Detail", "Join Flow", "Error States"],
    items: [
      { id: "room-1", task: "Room detail page", acceptance: ["Status badge (active/pending/blocked/expired/full) with correct color", "Member list with avatar, name (masked for public), join date", "Owner profile card with rating + verified badge", "Share price, billing date, room rules sections", "SLA timer badge for response time commitment"], priority: "critical", status: "done" },
      { id: "room-2", task: "Create room form", acceptance: ["Operator → plan → max members → rules → preview", "Plan selection filters to shareable-only", "Share price auto-calculated and shown in preview", "Validation: plan required, max_members >= 2", "Success → redirect to room detail + toast"], priority: "critical", status: "done" },
      { id: "room-3", task: "My rooms list (owner + member tabs)", acceptance: ["Tabs: 'Owned' and 'Joined'", "Status badges on each card", "Sort by newest, billing date, member count", "Pagination: 10 per page", "Empty state per tab (Page 24 — emptyRoomsTitle)"], priority: "critical", status: "done" },
      { id: "room-4", task: "Join room flow", acceptance: ["Auth gate: redirect to login if not authenticated", "Show room summary + share price + payment method selection", "Already-member check → redirect with toast", "Room-full race condition → specific error (Page 24 — errRoomFull)"], priority: "critical", status: "done" },
      { id: "room-5", task: "Leave room with confirmation", acceptance: ["Modal confirmation with prorated billing info", "Copy from Page 24 — confirmLeaveRoom", "Success → remove from my rooms + toast", "Owner cannot leave until room is empty or transferred"], priority: "must", status: "done" },
      { id: "room-6", task: "Room error states", acceptance: ["Room full: illustration + browse CTA", "Payment failed: error details + retry + change card", "Room blocked: red banner + support CTA", "All states match Page 24 copy exactly"], priority: "must", status: "done" },
      { id: "room-7", task: "Owner transfer flow", acceptance: ["Owner can transfer ownership to active member", "Confirmation modal with new owner name", "Audit log entry created", "Old owner becomes regular member"], priority: "nice", status: "pending" },
    ],
  },
  {
    id: "payments", name: "Payments", icon: CreditCard, color: "var(--eco-warning-500)",
    screens: ["Checkout", "Pending/Hold", "Confirmation", "Refund Status", "Owner Payout", "Payment History"],
    items: [
      { id: "pay-1", task: "Checkout page", acceptance: ["Room summary card + share price + payment methods list", "Promo code input with validate endpoint", "Discount shows strikethrough + discounted price", "Terms checkbox required, pay button shows amount", "3D Secure redirect handling", "Card declined / insufficient funds / expired → specific messages"], priority: "critical", status: "done" },
      { id: "pay-2", task: "Payment pending / hold screen", acceptance: ["Animated spinner for processing state", "Hold state: countdown timer to expiry + cancel CTA", "Poll every 3 seconds for status update", "Success → confetti-free animation + room link", "Failure → error with reason + retry"], priority: "critical", status: "done" },
      { id: "pay-3", task: "Payment history with tabs", acceptance: ["Tab 1: My Payments — summary cards + transaction table", "Tab 2: All Transactions (admin) — 6-stat dashboard", "Tab 3: Receipt view — standalone + modal", "Period filter: this month, 3mo, 6mo, all-time", "CSV + PDF export buttons", "Copyable Intent/TXN/Refund IDs"], priority: "critical", status: "done" },
      { id: "pay-4", task: "Refund status page", acceptance: ["Refund timeline: initiated → processing → completed/denied", "Timeline shows each step with timestamp", "Estimated return: 3-5 business days", "Partial refund shows original + refund amounts"], priority: "must", status: "done" },
      { id: "pay-5", task: "Owner payout dashboard", acceptance: ["Total earned, pending, withdrawn amounts", "Payout history table with dates + amounts", "Minimum payout threshold: 5,000 ₸", "Bank account management (masked display)"], priority: "must", status: "done" },
      { id: "pay-6", task: "Receipt print/PDF", acceptance: ["Print-ready layout with EcoSplit logo", "All IDs visible and copyable", "Date, amount, operator, plan, room ID, parties", "Separate URL for standalone receipt view"], priority: "must", status: "done" },
    ],
  },
  {
    id: "support", name: "Support", icon: MessageSquare, color: "var(--eco-text-secondary)",
    screens: ["Ticket List", "New Ticket", "Ticket Detail", "FAQ"],
    items: [
      { id: "sup-1", task: "Ticket list page", acceptance: ["Tabs: open, resolved, all", "Each row: ID (TKT-YYYY-NNNNN), subject, category, priority badge, SLA timer, last activity", "Sort by newest, priority, SLA urgency", "Pagination: 20 per page", "Empty state: Page 24 — emptyTicketsTitle"], priority: "critical", status: "done" },
      { id: "sup-2", task: "Create ticket form", acceptance: ["Category dropdown: payment, room, account, other", "Priority auto-assigned based on category (payment=high)", "Subject: 5-100 chars, body: 10-2000 chars", "Attachments: max 3, max 5MB each, JPG/PNG/PDF only", "Upload progress bar per file", "Success → redirect to ticket detail + toast"], priority: "critical", status: "done" },
      { id: "sup-3", task: "Ticket detail with chat", acceptance: ["Message thread with timestamps", "User vs admin messages visually distinct (left/right or color)", "SLA timer badge: green >4h, yellow 1-4h, red <1h, pulsing red if breached", "Attachment previews (image thumbnails, file icons)", "Close/resolve action for ticket owner"], priority: "critical", status: "done" },
      { id: "sup-4", task: "SLA enforcement", acceptance: ["SLA auto-calculated from priority (urgent=4h, high=12h, normal=24h, low=48h)", "Breach → auto-escalation notification to admin", "Timer visible to user in simplified form, full detail for admin"], priority: "must", status: "pending" },
    ],
  },
  {
    id: "admin", name: "Admin & Moderation", icon: Shield, color: "var(--eco-danger-500)",
    screens: ["Dashboard", "Moderation Queue", "Room Management", "User Management", "Disputes", "Audit Logs"],
    items: [
      { id: "adm-1", task: "Admin dashboard", acceptance: ["6-stat summary: users, rooms, active disputes, revenue, tickets, avg SLA", "Charts: revenue trend (30d), new users (30d)", "Quick links to moderation queue, flagged rooms, overdue tickets", "Real-time update badge for new items"], priority: "critical", status: "done" },
      { id: "adm-2", task: "Moderation queue", acceptance: ["Filter by type: room review, user report, content flag", "Sort by age, priority", "Bulk approve/reject with reason field", "Each item shows: entity, reporter, created_at, SLA remaining"], priority: "critical", status: "done" },
      { id: "adm-3", task: "Dispute management", acceptance: ["Full timeline: filed → evidence → decision", "Evidence gallery with preview", "Admin notes (internal, not visible to parties)", "Decision form: outcome, refund amount, ban option, reason", "Conflict detection: if another admin decided, show warning", "All actions create audit log entries"], priority: "critical", status: "done" },
      { id: "adm-4", task: "User management", acceptance: ["Search by name, email, phone (exact match only for PII)", "User profile: rooms, payments, disputes, support tickets", "Ban action: reason, duration (temp/permanent), linked dispute", "PII reveal: click → reason modal → 30s reveal → audit log"], priority: "critical", status: "done" },
      { id: "adm-5", task: "Room block/unblock", acceptance: ["Block: reason field, optional dispute link", "Members notified via push + email", "Unblock: requires admin note", "Audit trail for all block/unblock actions"], priority: "must", status: "done" },
      { id: "adm-6", task: "Audit log viewer", acceptance: ["Filter by actor, action type, entity, date range", "Each entry: timestamp (ISO + relative), actor, action, entity, metadata JSON", "Export to CSV", "No deletion — append-only", "Log access to audit log is itself logged"], priority: "critical", status: "done" },
    ],
  },
  {
    id: "profile", name: "Profile & Reputation", icon: Star, color: "var(--eco-primary)",
    screens: ["Own Profile", "Public Profile", "Edit Profile", "Reviews List"],
    items: [
      { id: "prof-1", task: "Public profile page", acceptance: ["Avatar, display name, rating, verified badge, member since", "Rooms owned + joined counts", "Review list with pagination (10 per page)", "No PII shown: masked last name, no email/phone", "Empty reviews: Page 24 — emptyReviewsTitle"], priority: "critical", status: "done" },
      { id: "prof-2", task: "Own profile with edit", acceptance: ["Editable: display name, avatar", "Non-editable but visible: email (masked), phone (masked)", "Full reveal only via settings with re-authentication", "Save → optimistic update + toast"], priority: "critical", status: "done" },
      { id: "prof-3", task: "Review submission", acceptance: ["Gate: must have shared a room with target user", "Rating: 1-5 stars, required", "Body: 10-500 chars, required", "Profanity filter (client-side basic + server-side)", "One review per room per user pair", "Optimistic add to list + success toast"], priority: "must", status: "done" },
      { id: "prof-4", task: "Reputation badges", acceptance: ["Auto-awarded based on milestones (5 rooms, 10 reviews, verified owner)", "Badge list on profile card", "Tooltip with earned_at date"], priority: "nice", status: "pending" },
    ],
  },
  {
    id: "notif", name: "Notifications", icon: Bell, color: "var(--eco-warning-500)",
    screens: ["Notification Center", "Preferences", "Inbox"],
    items: [
      { id: "notif-1", task: "Notification center", acceptance: ["List: icon, title, body preview, timestamp (relative), read/unread", "Filter: all, unread", "Mark as read: single click + mark-all button", "Group by group_key (e.g., room payments)", "Real-time: new items prepend with slide-in", "Empty state: Page 24 — emptyNotifTitle"], priority: "critical", status: "done" },
      { id: "notif-2", task: "Notification preferences page", acceptance: ["6 categories × 3 channels (in-app, push, email) matrix", "Per-event toggles with required locks (security events)", "Quiet hours: time range picker, affects push only", "Email digest: daily/weekly toggle", "Save + reset to defaults", "Privacy note footer"], priority: "must", status: "done" },
      { id: "notif-3", task: "Push notification registration", acceptance: ["Service worker registration on login", "Push permission request (non-blocking, after first action)", "Token refresh on new device", "Unsubscribe on logout"], priority: "must", status: "pending" },
      { id: "notif-4", task: "Notification delivery", acceptance: ["In-app: instant via WebSocket/SSE", "Push: within 30s of event", "Email: within 5 min (or batched in digest)", "Priority=critical bypasses quiet hours"], priority: "must", status: "pending", blocks: ["notif-3"] },
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: PERFORMANCE / UX RULES
   ═══════════════════════════════════════════════════════════════════════════ */
const PERF_RULES: PerfRule[] = [
  { id: "perf-1", rule: "Every list must paginate", rationale: "Prevents DOM bloat and slow renders", acceptance: "No API call returns >50 items. Default page size: 10-20.", category: "lists", priority: "critical" },
  { id: "perf-2", rule: "Every fetch shows a skeleton", rationale: "Users perceive content as loading faster", acceptance: "Skeleton shape matches final layout. Duration: aria-busy=true. Min 200ms to prevent flash.", category: "loading", priority: "critical" },
  { id: "perf-3", rule: "Images lazy-load below fold", rationale: "Reduces initial payload", acceptance: "loading='lazy' on all images except hero/logo. Placeholder blur or skeleton.", category: "images", priority: "must" },
  { id: "perf-4", rule: "Search/filter inputs debounce 300ms", rationale: "Prevents excessive API calls", acceptance: "No API call on every keystroke. Minimum 2 characters before first call.", category: "forms", priority: "must" },
  { id: "perf-5", rule: "Route transitions show instant feedback", rationale: "Perceived performance", acceptance: "Link click → instant navigation shell → content skeleton. No blank white screen.", category: "navigation", priority: "critical" },
  { id: "perf-6", rule: "Optimistic UI for mutations", rationale: "Actions feel instant", acceptance: "Toggle, mark-as-read, like → instant UI update. Rollback on error with toast.", category: "forms", priority: "must" },
  { id: "perf-7", rule: "Bundle per-route code splitting", rationale: "Reduces initial JS bundle", acceptance: "Each route lazily loaded. Admin routes never in user bundle. Vendor chunk shared.", category: "navigation", priority: "must" },
  { id: "perf-8", rule: "Offline-capable for visited data", rationale: "Kazakhstan has variable connectivity", acceptance: "Previously fetched data served from cache. Stale banner shown. Retry on reconnect.", category: "offline", priority: "must" },
  { id: "perf-9", rule: "No layout shift on data load", rationale: "CLS hurts perceived quality", acceptance: "Skeleton dimensions match final content. Images have width/height or aspect-ratio.", category: "loading", priority: "critical" },
  { id: "perf-10", rule: "Payment flow zero-reload", rationale: "Reload during payment = panic", acceptance: "Checkout → processing → result: single-page flow, no full page reloads. State persists across 3DS redirect.", category: "forms", priority: "critical" },
  { id: "perf-11", rule: "Admin tables virtualized at >100 rows", rationale: "Admin views may have large datasets", acceptance: "Table uses windowing (react-window or similar) when rows > 100.", category: "lists", priority: "nice" },
  { id: "perf-12", rule: "Toast auto-dismiss: 4s default", rationale: "Non-blocking feedback shouldn't linger", acceptance: "Success: 4s. Error: 6s (user needs time to read). User can dismiss early.", category: "forms", priority: "must" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: SECURITY / PRIVACY RULES
   ═══════════════════════════════════════════════════════════════════════════ */
const SEC_RULES: SecurityRule[] = [
  { id: "sec-1", rule: "No PII in URLs or query params", acceptance: ["User IDs, emails, phone numbers never appear in URL", "Room invites use opaque tokens, not user_id", "Search params: only filter keys, no PII values"], auditHint: "Grep all router paths for email, phone, name patterns", category: "pii", priority: "critical" },
  { id: "sec-2", rule: "Masked PII display by default", acceptance: ["Email: a•••s@gmail.com", "Phone: +7 ••• ••• ••12", "Name (public): Алмас К.", "Card: •••• 4832", "Full reveal: requires re-auth or admin reason"], auditHint: "Check all user-facing API responses for unmasked PII fields", category: "pii", priority: "critical" },
  { id: "sec-3", rule: "Admin PII reveal needs reason + audit", acceptance: ["Click 'Reveal' → modal with reason textarea → submit → audit log entry", "Revealed data visible for max 30 seconds, then re-masked", "Audit log: who, when, what, why, IP address", "Bulk reveal disabled — one field at a time"], auditHint: "Verify audit_log table has entries for every reveal action", category: "admin", priority: "critical" },
  { id: "sec-4", rule: "JWT stored in httpOnly cookie, not localStorage", acceptance: ["Access token: httpOnly, secure, SameSite=strict", "Refresh token: httpOnly, secure, SameSite=strict, path=/api/auth/refresh", "No tokens in localStorage, sessionStorage, or URL"], auditHint: "Browser devtools → Application → Cookies: verify httpOnly flag", category: "auth", priority: "critical" },
  { id: "sec-5", rule: "CSRF protection on all mutations", acceptance: ["POST/PUT/PATCH/DELETE require CSRF token", "Token rotates per session", "Double-submit cookie pattern or synchronizer token"], auditHint: "Test: replay a POST without CSRF header → expect 403", category: "auth", priority: "critical" },
  { id: "sec-6", rule: "Rate limiting on all endpoints", acceptance: ["Auth: 5 req/min per IP", "API read: 60 req/min per user", "API write: 20 req/min per user", "429 response includes Retry-After header", "UI shows calm message (Page 24 — errRateLimit)"], auditHint: "Load test each endpoint category", category: "auth", priority: "critical" },
  { id: "sec-7", rule: "Input sanitization everywhere", acceptance: ["All text inputs: strip HTML tags (server-side)", "SQL injection: parameterized queries only", "XSS: React handles most, but dangerouslySetInnerHTML never used", "File uploads: server-side type verification, not just extension"], auditHint: "Search codebase for dangerouslySetInnerHTML, eval, innerHTML", category: "data", priority: "critical" },
  { id: "sec-8", rule: "Audit trail on all state-changing admin actions", acceptance: ["Create, update, delete, block, ban, unblock, refund, decide", "Each entry: actor_id, action, entity_type, entity_id, timestamp, metadata", "Append-only: no delete/update on audit_log table", "Access to audit log is itself logged"], auditHint: "Verify RLS on audit_log: insert-only for service role, read for admin", category: "logging", priority: "critical" },
  { id: "sec-9", rule: "File upload security", acceptance: ["Max size: 5 MB per file", "Allowed types: JPG, PNG, PDF (server-side magic byte check)", "Files stored with random UUID names, not original filenames", "No direct public URL — served via signed URLs with expiry"], auditHint: "Upload a .exe renamed to .jpg → expect rejection", category: "data", priority: "must" },
  { id: "sec-10", rule: "No sensitive data in error messages", acceptance: ["Stack traces never shown to user", "Database errors → generic 'Something went wrong'", "Payment PSP error codes → mapped to friendly i18n keys", "Admin sees error code; user sees friendly message"], auditHint: "Trigger errors on each endpoint, verify response body", category: "data", priority: "critical" },
  { id: "sec-11", rule: "Content moderation on user-generated text", acceptance: ["Room names, rules, review bodies: profanity filter", "Client-side: basic word list, non-blocking warning", "Server-side: comprehensive filter, blocks submission", "Admin can override false positives"], auditHint: "Submit known profanity in each text field → verify block/flag", category: "data", priority: "must" },
  { id: "sec-12", rule: "Geolocation data never persisted", acceptance: ["Coordinates used in-memory for operator matching only", "No database write of lat/lng", "Privacy note shown before requesting permission (Page 24 — secGeoPrivacy)", "Works without location via manual city picker"], auditHint: "Check DB schema: no lat/lng/coordinates columns in users table", category: "pii", priority: "must" },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: DEFINITION OF DONE
   ═══════════════════════════════════════════════════════════════════════════ */
const DOD: DodItem[] = [
  { category: "Functionality", items: [
    "All acceptance criteria for the task are met",
    "Happy path works end-to-end",
    "Error states handled: network error, server error, 403, 404, rate limit, offline",
    "Empty states present with correct copy (Page 24 reference)",
    "Loading states use skeletons matching final layout",
  ]},
  { category: "i18n (RU/KZ/EN)", items: [
    "All user-visible strings use t() with registered keys",
    "No hardcoded Russian, Kazakh, or English text in components",
    "Pluralization uses correct plural forms (3 for RU, 1 for KZ, 2 for EN)",
    "Date/time formatting respects locale",
    "Currency formatting: locale grouping + ₸ suffix",
    "UI tested in all 3 locales — no overflow or truncation",
  ]},
  { category: "Responsive", items: [
    "Works at 320px (small mobile) without horizontal scroll",
    "Breakpoints: mobile (<640), tablet (640-1024), desktop (>1024)",
    "Touch targets: minimum 44×44px",
    "Tables scroll horizontally on mobile, not break layout",
    "Modals: full-screen on mobile, centered on desktop",
  ]},
  { category: "Accessibility", items: [
    "Keyboard navigation: all interactive elements focusable via Tab",
    "Focus ring visible on all focusable elements",
    "Screen reader: headings in order (h1→h2→h3), labels on all inputs",
    "Color is never the sole indicator of state",
    "aria-live regions for dynamic content (toasts, counters, SLA timers)",
    "Modal focus trap: Tab stays inside modal until closed",
    "Images: alt text or aria-hidden if decorative",
  ]},
  { category: "Security & Privacy", items: [
    "No PII in URLs, logs, or error messages",
    "All PII masked by default, reveal requires auth/reason",
    "API calls use auth tokens, not embedded credentials",
    "User-generated content sanitized server-side",
    "File uploads validated by type and size",
    "Admin actions create audit log entries",
  ]},
  { category: "Performance", items: [
    "No list renders >50 items without pagination or virtualization",
    "All images have explicit dimensions (no CLS)",
    "Route code-split — admin code not in user bundle",
    "Skeleton loading for every async data fetch",
    "Debounced search/filter inputs",
  ]},
  { category: "Testing", items: [
    "Unit tests for business logic (price calculation, plural forms, SLA computation)",
    "Integration tests for critical flows (auth, payment, join room)",
    "E2E test for happy path of each module",
    "Visual regression snapshots for all component variants",
    "Tested with network throttling (3G) and offline mode",
  ]},
  { category: "Code Quality", items: [
    "TypeScript strict mode — no `any` types",
    "No console.log in production code",
    "Component props have explicit interfaces",
    "i18n keys follow naming convention from Page 23",
    "No inline styles except design token variables",
    "PR reviewed by at least 1 team member",
  ]},
];

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Components Prerequisites ─── */
function ComponentsSection() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | Priority>("all");
  const filtered = filter === "all" ? COMPONENTS : COMPONENTS.filter((c) => c.priority === filter);
  const done = COMPONENTS.filter((c) => c.status === "done").length;

  return (
    <div>
      {/* Progress bar */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>Component Readiness</span>
          <span className="text-[13px] tabular-nums" style={{ color: "var(--eco-success-500)" }}>{done}/{COMPONENTS.length}</span>
        </div>
        <div className="w-full h-2 rounded-full" style={{ background: "var(--eco-neutral-200)" }}>
          <div className="h-2 rounded-full transition-all" style={{ width: `${(done / COMPONENTS.length) * 100}%`, background: "var(--eco-success-500)" }} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "critical", "must", "nice"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className="px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors"
            style={{ background: filter === f ? "var(--eco-primary)" : "var(--eco-neutral-100)", color: filter === f ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)" }}>
            {f === "all" ? `All (${COMPONENTS.length})` : f === "critical" ? `P0 (${COMPONENTS.filter((c) => c.priority === "critical").length})` : f === "must" ? `P1 (${COMPONENTS.filter((c) => c.priority === "must").length})` : `P2 (${COMPONENTS.filter((c) => c.priority === "nice").length})`}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map((comp) => (
          <SC key={comp.name} className="!p-0 overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <StatusIcon s={comp.status} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{comp.name}</span>
                  <PriorityBadge p={comp.priority} />
                  <StatusLabel s={comp.status} />
                </div>
                <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{comp.description}</div>
              </div>
            </div>
            <div className="px-4 py-3 grid grid-cols-2 gap-3 text-[10px]">
              <div>
                <div className="mb-1" style={{ color: "var(--eco-text-tertiary)" }}>VARIANTS</div>
                <div className="flex flex-wrap gap-1">
                  {comp.variants.map((v) => (
                    <code key={v} className="px-1 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{v}</code>
                  ))}
                </div>
              </div>
              <div>
                <div className="mb-1" style={{ color: "var(--eco-text-tertiary)" }}>PROPS</div>
                <div className="flex flex-wrap gap-1">
                  {comp.props.map((p) => (
                    <code key={p} className="px-1 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-secondary)" }}>{p}</code>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-4 py-2 text-[10px] flex items-start gap-1" style={{ background: "var(--eco-bg)", borderTop: "1px solid var(--eco-border)" }}>
              <ShieldCheck size={10} className="mt-0.5 shrink-0" style={{ color: "var(--eco-success-500)" }} />
              <span style={{ color: "var(--eco-text-tertiary)" }}><strong style={{ color: "var(--eco-text-secondary)" }}>a11y:</strong> {comp.a11y}</span>
            </div>
            <div className="px-4 py-2 text-[10px] flex items-start gap-1" style={{ borderTop: "1px solid var(--eco-border)" }}>
              <Layers size={10} className="mt-0.5 shrink-0" style={{ color: "var(--eco-brand-600)" }} />
              <span style={{ color: "var(--eco-text-tertiary)" }}><strong style={{ color: "var(--eco-text-secondary)" }}>Blocks:</strong> {comp.blocksScreens.join(", ")}</span>
            </div>
          </SC>
        ))}
      </div>
    </div>
  );
}

/* ─── Module Checklists ─── */
function ModulesSection() {
  const { t } = useI18n();
  const [expandedModule, setExpandedModule] = useState<string | null>("auth");

  return (
    <div className="flex flex-col gap-4">
      {MODULES.map((mod) => {
        const isExpanded = expandedModule === mod.id;
        const doneCount = mod.items.filter((i) => i.status === "done").length;
        const critCount = mod.items.filter((i) => i.priority === "critical").length;
        const Icon = mod.icon;

        return (
          <SC key={mod.id} className="!p-0 overflow-hidden">
            {/* Header */}
            <button onClick={() => setExpandedModule(isExpanded ? null : mod.id)}
              className="w-full flex items-center gap-3 px-5 py-4 cursor-pointer text-left" style={{ background: isExpanded ? "var(--eco-bg)" : "transparent" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${mod.color}15` }}>
                <Icon size={16} style={{ color: mod.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{mod.name}</div>
                <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  {mod.screens.join(" · ")}
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* Progress ring */}
                <div className="relative w-10 h-10">
                  <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke="var(--eco-neutral-200)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.5" fill="none" stroke={doneCount === mod.items.length ? "var(--eco-success-500)" : "var(--eco-primary)"}
                      strokeWidth="3" strokeDasharray={`${(doneCount / mod.items.length) * 97.4} 97.4`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[9px] tabular-nums" style={{ color: "var(--eco-text)" }}>{doneCount}/{mod.items.length}</div>
                </div>
                <div className="flex flex-col gap-0.5 text-right">
                  <span className="text-[9px]" style={{ color: "var(--eco-danger-500)" }}>{critCount} critical</span>
                  <span className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>{mod.items.length} total</span>
                </div>
                <ChevronDown size={14} className="transition-transform" style={{ color: "var(--eco-neutral-300)", transform: isExpanded ? "rotate(180deg)" : "rotate(0)" }} />
              </div>
            </button>

            {/* Items */}
            {isExpanded && (
              <div>
                {mod.items.map((item, idx) => (
                  <div key={item.id} className="px-5 py-4" style={{ borderTop: "1px solid var(--eco-border)" }}>
                    <div className="flex items-start gap-3">
                      <StatusIcon s={item.status} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{item.id}</code>
                          <PriorityBadge p={item.priority} />
                          <StatusLabel s={item.status} />
                          {item.blocks?.map((b) => (
                            <span key={b} className="text-[8px] px-1 py-0.5 rounded flex items-center gap-0.5" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>
                              <Lock size={7} /> blocks {b}
                            </span>
                          ))}
                        </div>
                        <div className="text-[13px] mb-2" style={{ color: "var(--eco-text)" }}>{item.task}</div>

                        {/* Acceptance criteria */}
                        <div className="rounded-lg p-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                          <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color: "var(--eco-text-tertiary)" }}>{t("bcAcceptance")}</div>
                          <div className="space-y-1.5">
                            {item.acceptance.map((ac, i) => (
                              <div key={i} className="flex items-start gap-2 text-[11px]">
                                <div className="mt-1 w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0"
                                  style={{ borderColor: item.status === "done" ? "var(--eco-success-500)" : "var(--eco-neutral-300)", background: item.status === "done" ? "var(--eco-success-500)" : "transparent" }}>
                                  {item.status === "done" && <Check size={8} color="#fff" />}
                                </div>
                                <span style={{ color: item.status === "done" ? "var(--eco-text-secondary)" : "var(--eco-text)" }}>{ac}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {item.notes && (
                          <div className="mt-2 text-[10px] flex items-start gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                            <Info size={10} className="mt-0.5 shrink-0" />
                            {item.notes}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SC>
        );
      })}
    </div>
  );
}

/* ─── Performance / UX Rules ─── */
function PerfSection() {
  const catIcons: Record<string, React.ElementType> = { loading: Clock, lists: List, images: Monitor, forms: PenLine, navigation: Rocket, offline: WifiOff };
  const categories = [...new Set(PERF_RULES.map((r) => r.category))];
  const [activeCat, setActiveCat] = useState("loading");

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map((cat) => {
          const Icon = catIcons[cat] || Zap;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors capitalize"
              style={{ background: activeCat === cat ? "var(--eco-primary)" : "var(--eco-neutral-100)", color: activeCat === cat ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)" }}>
              <Icon size={11} /> {cat} ({PERF_RULES.filter((r) => r.category === cat).length})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {PERF_RULES.filter((r) => r.category === activeCat).map((rule) => (
          <SC key={rule.id} className="!p-0 overflow-hidden">
            <div className="flex items-start gap-3 px-5 py-3">
              <code className="text-[10px] px-1.5 py-0.5 rounded shrink-0 mt-0.5" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{rule.id}</code>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{rule.rule}</span>
                  <PriorityBadge p={rule.priority} />
                </div>
                <div className="text-[11px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>{rule.rationale}</div>
                <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                  <Target size={10} className="mt-0.5 shrink-0" style={{ color: "var(--eco-success-500)" }} />
                  <span className="text-[11px]" style={{ color: "var(--eco-text-secondary)" }}>{rule.acceptance}</span>
                </div>
              </div>
            </div>
          </SC>
        ))}
      </div>
    </div>
  );
}

/* ─── Security / Privacy Rules ─── */
function SecuritySection() {
  const catIcons: Record<string, React.ElementType> = { pii: EyeOff, auth: Key, data: Database, admin: Shield, logging: FileCode2 };
  const categories = [...new Set(SEC_RULES.map((r) => r.category))];
  const [activeCat, setActiveCat] = useState("pii");

  return (
    <div>
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map((cat) => {
          const Icon = catIcons[cat] || Shield;
          return (
            <button key={cat} onClick={() => setActiveCat(cat)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] cursor-pointer transition-colors uppercase"
              style={{ background: activeCat === cat ? "var(--eco-primary)" : "var(--eco-neutral-100)", color: activeCat === cat ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)" }}>
              <Icon size={11} /> {cat} ({SEC_RULES.filter((r) => r.category === cat).length})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {SEC_RULES.filter((r) => r.category === activeCat).map((rule) => (
          <SC key={rule.id} className="!p-0 overflow-hidden">
            <div className="px-5 py-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <code className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-primary)" }}>{rule.id}</code>
                <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{rule.rule}</span>
                <PriorityBadge p={rule.priority} />
              </div>
            </div>
            <div className="px-5 py-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Acceptance */}
              <div>
                <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color: "var(--eco-text-tertiary)" }}>ACCEPTANCE CRITERIA</div>
                <div className="space-y-1.5">
                  {rule.acceptance.map((ac, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <div className="mt-1 w-3 h-3 rounded-sm border shrink-0" style={{ borderColor: "var(--eco-neutral-300)" }} />
                      <span style={{ color: "var(--eco-text)" }}>{ac}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Audit hint */}
              <div>
                <div className="text-[9px] tracking-widest uppercase mb-2" style={{ color: "var(--eco-warning-500)" }}>AUDIT HINT</div>
                <div className="rounded-lg px-3 py-2 flex items-start gap-2" style={{ background: "var(--eco-warning-100)", border: "1px solid var(--eco-warning-300)" }}>
                  <Search size={10} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning-500)" }} />
                  <span className="text-[11px]" style={{ color: "var(--eco-warning-500)" }}>{rule.auditHint}</span>
                </div>
              </div>
            </div>
          </SC>
        ))}
      </div>
    </div>
  );
}

/* ─── Definition of Done ─── */
function DodSection() {
  const icons: Record<string, React.ElementType> = {
    Functionality: Zap, "i18n (RU/KZ/EN)": Globe2, Responsive: Smartphone,
    Accessibility: Eye, "Security & Privacy": Lock, Performance: Gauge,
    Testing: Target, "Code Quality": Code,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {DOD.map((section) => {
        const Icon = icons[section.category] || Check;
        return (
          <SC key={section.category} className="!p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--eco-border)", background: "var(--eco-bg)" }}>
              <Icon size={13} style={{ color: "var(--eco-primary)" }} />
              <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{section.category}</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded-full ml-auto" style={{ background: "var(--eco-neutral-100)", color: "var(--eco-text-tertiary)" }}>{section.items.length}</span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <div className="mt-1 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center" style={{ borderColor: "var(--eco-neutral-300)" }} />
                  <span style={{ color: "var(--eco-text)" }}>{item}</span>
                </div>
              ))}
            </div>
          </SC>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════════ */
export function BuildChecklistPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<"components" | "modules" | "perf" | "security" | "dod">("components");

  // Global stats
  const totalTasks = MODULES.reduce((s, m) => s + m.items.length, 0);
  const doneTasks = MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "done").length, 0);
  const criticalTasks = MODULES.reduce((s, m) => s + m.items.filter((i) => i.priority === "critical").length, 0);
  const doneComponents = COMPONENTS.filter((c) => c.status === "done").length;
  const totalAcceptance = MODULES.reduce((s, m) => s + m.items.reduce((a, i) => a + i.acceptance.length, 0), 0);

  const tabs = [
    { id: "components" as const, label: t("bcComponents"), icon: Box, count: COMPONENTS.length },
    { id: "modules" as const, label: t("bcModules"), icon: Layers, count: MODULES.length },
    { id: "perf" as const, label: t("bcPerfUx"), icon: Gauge, count: PERF_RULES.length },
    { id: "security" as const, label: t("bcSecPrivacy"), icon: Shield, count: SEC_RULES.length },
    { id: "dod" as const, label: t("bcDod"), icon: CheckCircle2, count: DOD.length },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>Page 26</span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>Dev Handoff</span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>{t("bcTitle")}</h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>{t("bcSubtitle")}</p>
      </div>

      {/* Global progress */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { n: `${doneTasks}/${totalTasks}`, label: "Module tasks", color: "var(--eco-success-500)", sub: `${Math.round((doneTasks / totalTasks) * 100)}%` },
          { n: `${doneComponents}/${COMPONENTS.length}`, label: "Components", color: "var(--eco-brand-600)", sub: `${Math.round((doneComponents / COMPONENTS.length) * 100)}%` },
          { n: criticalTasks.toString(), label: t("bcCritical"), color: "var(--eco-danger-500)", sub: "P0" },
          { n: totalAcceptance.toString(), label: t("bcAcceptance"), color: "var(--eco-warning-500)", sub: "criteria" },
          { n: PERF_RULES.length.toString(), label: "Perf rules", color: "var(--eco-primary)", sub: "enforced" },
          { n: SEC_RULES.length.toString(), label: "Security rules", color: "var(--eco-danger-500)", sub: "required" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <div className="text-[18px] tabular-nums" style={{ color: s.color }}>{s.n}</div>
            <div className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
            <div className="text-[8px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Global progress bar */}
      <SC className="!p-4 mb-8">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[12px]" style={{ color: "var(--eco-text)" }}>Overall Implementation Progress</span>
          <span className="text-[14px] tabular-nums ml-auto" style={{ color: "var(--eco-success-500)" }}>{Math.round((doneTasks / totalTasks) * 100)}%</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden flex" style={{ background: "var(--eco-neutral-200)" }}>
          <div className="h-3 transition-all" style={{ width: `${(MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "done").length, 0) / totalTasks) * 100}%`, background: "var(--eco-success-500)" }} />
          <div className="h-3 transition-all" style={{ width: `${(MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "in-progress").length, 0) / totalTasks) * 100}%`, background: "var(--eco-warning-500)" }} />
          <div className="h-3 transition-all" style={{ width: `${(MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "blocked").length, 0) / totalTasks) * 100}%`, background: "var(--eco-danger-500)" }} />
        </div>
        <div className="flex items-center gap-4 mt-2">
          {[
            { label: "Done", color: "var(--eco-success-500)", count: doneTasks },
            { label: "In Progress", color: "var(--eco-warning-500)", count: MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "in-progress").length, 0) },
            { label: "Pending", color: "var(--eco-neutral-300)", count: MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "pending").length, 0) },
            { label: "Blocked", color: "var(--eco-danger-500)", count: MODULES.reduce((s, m) => s + m.items.filter((i) => i.status === "blocked").length, 0) },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5 text-[10px]">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.color }} />
              <span style={{ color: "var(--eco-text-tertiary)" }}>{l.label} ({l.count})</span>
            </div>
          ))}
        </div>
      </SC>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto" style={{ background: "var(--eco-surface)" }}>
        {tabs.map(({ id, label, icon: TIcon, count }) => (
          <button key={id} onClick={() => setTab(id)}
            className="flex items-center gap-1.5 flex-1 px-4 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer justify-center whitespace-nowrap"
            style={{ background: tab === id ? "var(--eco-bg)" : "transparent", color: tab === id ? "var(--eco-text)" : "var(--eco-text-tertiary)", boxShadow: tab === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>
            <TIcon size={13} /> {label}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: tab === id ? "var(--eco-primary)" : "var(--eco-neutral-100)", color: tab === id ? "var(--eco-text-on-primary)" : "var(--eco-text-tertiary)" }}>{count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "components" && <ComponentsSection />}
      {tab === "modules" && <ModulesSection />}
      {tab === "perf" && <PerfSection />}
      {tab === "security" && <SecuritySection />}
      {tab === "dod" && <DodSection />}

      {/* Footer */}
      <div className="mt-8 rounded-xl px-5 py-3 flex items-start gap-2" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
          This checklist references: Page 23 (Data Contracts) for field specs and API shapes, Page 24 (Copy Library) for all user-facing text, and Page 21 (Governance) for token/component rules.
          Each acceptance criterion is verifiable by a QA engineer or automated test. No task is "done" until the full Definition of Done checklist passes.
        </span>
      </div>
    </div>
  );
}
