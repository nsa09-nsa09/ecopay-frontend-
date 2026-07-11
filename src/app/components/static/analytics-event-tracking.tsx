import { useState, useMemo } from 'react';
import { useI18n } from '../i18n-provider';
import {
  Activity,
  BarChart3,
  ChevronRight,
  Code,
  Database,
  Info,
  Monitor,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

/* ═══ TYPES ═══ */
type EventCategory = 'funnel' | 'engagement' | 'payment' | 'support' | 'abuse' | 'admin' | 'system';
type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';

interface AnalyticsEvent {
  name: string;
  displayName: string;
  category: EventCategory;
  module: string;
  trigger: string;
  properties: EventProperty[];
  metric: string;
  funnelStep?: number;
}

interface EventProperty {
  name: string;
  type: string;
  example: string;
  required: boolean;
}

interface FunnelStage {
  step: number;
  event: string;
  displayName: string;
  description: string;
  dropoffMetric: string;
  benchmark: string;
}

interface AbuseSignal {
  id: string;
  name: string;
  description: string;
  detectionEvents: string[];
  threshold: string;
  window: string;
  severity: Severity;
  automatedAction: string;
  properties: string[];
}

interface AdminEvent {
  name: string;
  displayName: string;
  trigger: string;
  properties: EventProperty[];
  auditRequired: boolean;
  dashboardWidget: string;
}

interface ImplSpec {
  layer: string;
  icon: React.ElementType;
  description: string;
  rules: string[];
}

/* ═══ PRIMITIVES ═══ */
const SC = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl ${className}`}
    style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
  >
    {children}
  </div>
);

const SevBadge = ({ s }: { s: Severity }) => {
  const m: Record<Severity, { bg: string; color: string; label: string }> = {
    critical: { bg: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)', label: 'Critical' },
    high: { bg: 'var(--eco-warning-100)', color: 'var(--eco-warning-500)', label: 'High' },
    medium: { bg: 'var(--eco-brand-50)', color: 'var(--eco-brand-600)', label: 'Medium' },
    low: { bg: 'var(--eco-neutral-100)', color: 'var(--eco-text-tertiary)', label: 'Low' },
    info: { bg: 'var(--eco-neutral-100)', color: 'var(--eco-text-tertiary)', label: 'Info' },
  };
  const v = m[s];
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: v.bg, color: v.color }}
    >
      {v.label}
    </span>
  );
};

const CatBadge = ({ c }: { c: EventCategory }) => {
  const m: Record<EventCategory, { color: string; label: string }> = {
    funnel: { color: 'var(--eco-primary)', label: 'Funnel' },
    engagement: { color: 'var(--eco-brand-600)', label: 'Engagement' },
    payment: { color: 'var(--eco-warning-500)', label: 'Payment' },
    support: { color: 'var(--eco-text-secondary)', label: 'Support' },
    abuse: { color: 'var(--eco-danger-500)', label: 'Abuse' },
    admin: { color: 'var(--eco-success-500)', label: 'Admin' },
    system: { color: 'var(--eco-text-tertiary)', label: 'System' },
  };
  const v = m[c];
  return (
    <span
      className="text-[9px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ background: `${v.color}15`, color: v.color }}
    >
      {v.label}
    </span>
  );
};

const PropTag = ({ name, type, required }: { name: string; type: string; required: boolean }) => (
  <span
    className="inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded"
    style={{ background: 'var(--eco-neutral-100)' }}
  >
    <code style={{ color: 'var(--eco-primary)' }}>{name}</code>
    <span style={{ color: 'var(--eco-text-tertiary)' }}>{type}</span>
    {required && (
      <span className="w-1 h-1 rounded-full" style={{ background: 'var(--eco-danger-500)' }} />
    )}
  </span>
);

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: PRIMARY CONVERSION FUNNEL
   ═══════════════════════════════════════════════════════════════════════════ */
const PRIMARY_FUNNEL: FunnelStage[] = [
  {
    step: 1,
    event: 'catalog.operator_viewed',
    displayName: 'View Operator',
    description: 'User lands on operator detail page',
    dropoffMetric: 'Exit rate from catalog',
    benchmark: '< 40% exit',
  },
  {
    step: 2,
    event: 'catalog.plan_viewed',
    displayName: 'View Plan',
    description: 'User expands or clicks a specific plan',
    dropoffMetric: 'Plan view → room browse rate',
    benchmark: '> 60% proceed',
  },
  {
    step: 3,
    event: 'room.list_viewed',
    displayName: 'Browse Rooms',
    description: 'User views available rooms for a plan',
    dropoffMetric: 'Room list → room detail rate',
    benchmark: '> 50% click a room',
  },
  {
    step: 4,
    event: 'room.detail_viewed',
    displayName: 'View Room',
    description: 'User opens a specific room detail page',
    dropoffMetric: 'Room detail → join intent',
    benchmark: '> 35% click Join',
  },
  {
    step: 5,
    event: 'room.join_started',
    displayName: 'Start Join',
    description: "User clicks 'Join Room' — auth gate passed",
    dropoffMetric: 'Join start → checkout rate',
    benchmark: '> 80% reach checkout',
  },
  {
    step: 6,
    event: 'payment.checkout_viewed',
    displayName: 'View Checkout',
    description: 'Checkout page loaded with amount + method',
    dropoffMetric: 'Checkout → payment intent',
    benchmark: '> 70% initiate pay',
  },
  {
    step: 7,
    event: 'payment.intent_created',
    displayName: 'Payment Intent',
    description: 'Backend creates payment intent / hold',
    dropoffMetric: 'Intent → PSP response',
    benchmark: '> 95% PSP response',
  },
  {
    step: 8,
    event: 'payment.success',
    displayName: 'Payment Success',
    description: 'PSP confirms successful charge',
    dropoffMetric: 'Success → active member',
    benchmark: '> 99% activation',
  },
  {
    step: 9,
    event: 'room.member_activated',
    displayName: 'Member Active',
    description: 'User appears as active member in room',
    dropoffMetric: 'Activation → 30d retention',
    benchmark: '> 70% 30d retention',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: ALL PRODUCT EVENTS
   ═══════════════════════════════════════════════════════════════════════════ */
const EVENTS: AnalyticsEvent[] = [
  // ── Auth ──
  {
    name: 'auth.login_viewed',
    displayName: 'Login Page Viewed',
    category: 'funnel',
    module: 'Auth',
    trigger: 'Navigate to /login',
    properties: [
      { name: 'referrer', type: 'string', example: '/room/abc123', required: false },
      {
        name: 'auth_prompt_reason',
        type: 'enum',
        example: 'join_gate | session_expired | manual',
        required: true,
      },
    ],
    metric: 'Login page → successful login rate',
  },
  {
    name: 'auth.login_success',
    displayName: 'Login Success',
    category: 'funnel',
    module: 'Auth',
    trigger: 'Auth API returns 200',
    properties: [
      { name: 'method', type: 'enum', example: 'email | phone | google', required: true },
      { name: 'is_new_device', type: 'boolean', example: 'true', required: true },
      { name: 'session_duration_prev', type: 'number', example: '1800', required: false },
    ],
    metric: 'Login success rate > 95% of attempts',
  },
  {
    name: 'auth.login_failed',
    displayName: 'Login Failed',
    category: 'abuse',
    module: 'Auth',
    trigger: 'Auth API returns 401/429',
    properties: [
      {
        name: 'error_code',
        type: 'enum',
        example: 'invalid_credentials | locked | rate_limited',
        required: true,
      },
      { name: 'attempt_count', type: 'number', example: '3', required: true },
      { name: 'ip_hash', type: 'string', example: 'sha256:a1b2c3', required: true },
    ],
    metric: 'Failed login rate < 5% of total attempts',
  },
  {
    name: 'auth.signup_success',
    displayName: 'Signup Success',
    category: 'funnel',
    module: 'Auth',
    trigger: 'Registration API returns 201',
    properties: [
      { name: 'method', type: 'enum', example: 'email | phone | google', required: true },
      { name: 'referral_code', type: 'string?', example: 'REF-AKS92', required: false },
      { name: 'locale', type: 'enum', example: 'ru | kz | en', required: true },
    ],
    metric: 'Signup completion rate > 80% of started',
  },
  {
    name: 'auth.password_reset_requested',
    displayName: 'Password Reset Requested',
    category: 'engagement',
    module: 'Auth',
    trigger: 'Forgot password form submit',
    properties: [{ name: 'email_hash', type: 'string', example: 'sha256:x9y8z7', required: true }],
    metric: 'Reset request → completion rate',
  },

  // ── Catalog ──
  {
    name: 'catalog.page_viewed',
    displayName: 'Catalog Page Viewed',
    category: 'funnel',
    module: 'Catalog',
    trigger: 'Navigate to / (home)',
    properties: [
      {
        name: 'entry_point',
        type: 'enum',
        example: 'direct | search | deeplink | push',
        required: true,
      },
      { name: 'locale', type: 'enum', example: 'ru | kz | en', required: true },
    ],
    metric: 'Catalog → operator view rate',
  },
  {
    name: 'catalog.operator_viewed',
    displayName: 'Operator Viewed',
    category: 'funnel',
    module: 'Catalog',
    trigger: 'Click operator card / Navigate to /operator/:id',
    properties: [
      { name: 'operator_id', type: 'string', example: 'beeline', required: true },
      { name: 'operator_name', type: 'string', example: 'Beeline', required: true },
      { name: 'position_in_list', type: 'number', example: '2', required: true },
      { name: 'filter_active', type: 'boolean', example: 'false', required: true },
    ],
    metric: 'Top 3 operator view distribution',
    funnelStep: 1,
  },
  {
    name: 'catalog.plan_viewed',
    displayName: 'Plan Viewed',
    category: 'funnel',
    module: 'Catalog',
    trigger: 'Expand plan card on operator page',
    properties: [
      { name: 'operator_id', type: 'string', example: 'activ', required: true },
      { name: 'plan_id', type: 'string', example: 'activ-premium-35', required: true },
      { name: 'plan_price_kzt', type: 'number', example: '6990', required: true },
      { name: 'is_shareable', type: 'boolean', example: 'true', required: true },
      { name: 'data_gb', type: 'number|null', example: '35', required: false },
    ],
    metric: 'Plan view → room browse rate',
    funnelStep: 2,
  },
  {
    name: 'catalog.search_executed',
    displayName: 'Search Executed',
    category: 'engagement',
    module: 'Catalog',
    trigger: 'Search input after 300ms debounce',
    properties: [
      { name: 'query', type: 'string', example: 'beeline 5g', required: true },
      { name: 'results_count', type: 'number', example: '4', required: true },
      { name: 'has_results', type: 'boolean', example: 'true', required: true },
    ],
    metric: 'Search → result click rate > 40%',
  },
  {
    name: 'catalog.filter_applied',
    displayName: 'Filter Applied',
    category: 'engagement',
    module: 'Catalog',
    trigger: 'Toggle filter on catalog page',
    properties: [
      {
        name: 'filter_type',
        type: 'enum',
        example: 'operator | price_range | 5g | shareable_only',
        required: true,
      },
      { name: 'filter_value', type: 'string', example: '5g:true', required: true },
      { name: 'results_count_after', type: 'number', example: '12', required: true },
    ],
    metric: 'Filter usage rate per session',
  },

  // ── Rooms ──
  {
    name: 'room.list_viewed',
    displayName: 'Room List Viewed',
    category: 'funnel',
    module: 'Rooms',
    trigger: 'Browse rooms for a plan',
    properties: [
      { name: 'plan_id', type: 'string', example: 'kcell-start-15', required: true },
      { name: 'rooms_available', type: 'number', example: '7', required: true },
      { name: 'sort_by', type: 'enum', example: 'newest | price | rating', required: true },
    ],
    metric: 'Room list → room detail rate',
    funnelStep: 3,
  },
  {
    name: 'room.detail_viewed',
    displayName: 'Room Detail Viewed',
    category: 'funnel',
    module: 'Rooms',
    trigger: 'Click room card / Navigate to /room/:id',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'room_status', type: 'enum', example: 'active | pending | full', required: true },
      { name: 'owner_rating', type: 'number', example: '4.7', required: false },
      { name: 'members_current', type: 'number', example: '3', required: true },
      { name: 'members_max', type: 'number', example: '5', required: true },
      { name: 'share_price_kzt', type: 'number', example: '1398', required: true },
      { name: 'operator_id', type: 'string', example: 'beeline', required: true },
      { name: 'plan_id', type: 'string', example: 'beeline-all-30', required: true },
    ],
    metric: 'Room detail → join start rate > 35%',
    funnelStep: 4,
  },
  {
    name: 'room.join_started',
    displayName: 'Join Room Started',
    category: 'funnel',
    module: 'Rooms',
    trigger: "Click 'Join Room' CTA on detail page",
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'share_price_kzt', type: 'number', example: '1398', required: true },
      { name: 'spots_remaining', type: 'number', example: '2', required: true },
      {
        name: 'auth_state',
        type: 'enum',
        example: 'authenticated | redirected_to_login',
        required: true,
      },
    ],
    metric: 'Join start → checkout rate > 80%',
    funnelStep: 5,
  },
  {
    name: 'room.join_completed',
    displayName: 'Join Room Completed',
    category: 'funnel',
    module: 'Rooms',
    trigger: 'Member appears in room after payment',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'time_to_join_ms', type: 'number', example: '45000', required: true },
      { name: 'payment_method', type: 'enum', example: 'card | wallet', required: true },
      { name: 'promo_applied', type: 'boolean', example: 'false', required: true },
    ],
    metric: 'Join → 7d active rate',
    funnelStep: 9,
  },
  {
    name: 'room.leave_initiated',
    displayName: 'Leave Room Initiated',
    category: 'engagement',
    module: 'Rooms',
    trigger: "Click 'Leave Room' in settings",
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'membership_days', type: 'number', example: '34', required: true },
      {
        name: 'reason_selected',
        type: 'enum?',
        example: 'too_expensive | not_using | switching | other',
        required: false,
      },
    ],
    metric: 'Churn rate per room < 15% monthly',
  },
  {
    name: 'room.leave_confirmed',
    displayName: 'Leave Room Confirmed',
    category: 'engagement',
    module: 'Rooms',
    trigger: 'Confirm leave in modal',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'prorated_refund_kzt', type: 'number', example: '466', required: false },
    ],
    metric: 'Leave confirm → churn analysis',
  },
  {
    name: 'room.created',
    displayName: 'Room Created',
    category: 'engagement',
    module: 'Rooms',
    trigger: 'Create room form submit success',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_n3w1d', required: true },
      { name: 'operator_id', type: 'string', example: 'tele2', required: true },
      { name: 'plan_id', type: 'string', example: 'tele2-max-50', required: true },
      { name: 'max_members', type: 'number', example: '5', required: true },
      { name: 'share_price_kzt', type: 'number', example: '1598', required: true },
      { name: 'verification_mode', type: 'enum', example: 'auto | manual | none', required: true },
    ],
    metric: 'Room creation → first member join rate',
  },
  {
    name: 'room.share_link_copied',
    displayName: 'Share Link Copied',
    category: 'engagement',
    module: 'Rooms',
    trigger: 'Click share/copy invite link',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      {
        name: 'share_context',
        type: 'enum',
        example: 'detail_page | my_rooms | owner_panel',
        required: true,
      },
    ],
    metric: 'Share → invited user conversion',
  },

  // ── Payments ──
  {
    name: 'payment.checkout_viewed',
    displayName: 'Checkout Viewed',
    category: 'funnel',
    module: 'Payments',
    trigger: 'Navigate to /payment/checkout',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'amount_kzt', type: 'number', example: '1398', required: true },
      { name: 'payment_methods_available', type: 'number', example: '2', required: true },
      { name: 'promo_code_present', type: 'boolean', example: 'false', required: false },
    ],
    metric: 'Checkout → payment intent rate > 70%',
    funnelStep: 6,
  },
  {
    name: 'payment.promo_applied',
    displayName: 'Promo Code Applied',
    category: 'engagement',
    module: 'Payments',
    trigger: 'Submit promo code at checkout',
    properties: [
      { name: 'promo_code', type: 'string', example: 'WELCOME20', required: true },
      { name: 'discount_kzt', type: 'number', example: '280', required: true },
      { name: 'is_valid', type: 'boolean', example: 'true', required: true },
      {
        name: 'error_reason',
        type: 'string?',
        example: 'expired | invalid | already_used',
        required: false,
      },
    ],
    metric: 'Promo usage rate, avg discount',
  },
  {
    name: 'payment.intent_created',
    displayName: 'Payment Intent Created',
    category: 'funnel',
    module: 'Payments',
    trigger: "Click 'Pay {amount}' button",
    properties: [
      { name: 'intent_id', type: 'string', example: 'pi_abc123xyz', required: true },
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'amount_kzt', type: 'number', example: '1118', required: true },
      {
        name: 'payment_method_type',
        type: 'enum',
        example: 'card | kaspi | wallet',
        required: true,
      },
      {
        name: 'card_brand',
        type: 'enum?',
        example: 'visa | mastercard | unknown',
        required: false,
      },
      { name: 'is_3ds_required', type: 'boolean', example: 'true', required: true },
      { name: 'risk_score_bucket', type: 'enum', example: 'low | medium | high', required: true },
    ],
    metric: 'Intent → success rate > 92%',
    funnelStep: 7,
  },
  {
    name: 'payment.success',
    displayName: 'Payment Success',
    category: 'funnel',
    module: 'Payments',
    trigger: 'PSP webhook confirms charge',
    properties: [
      { name: 'intent_id', type: 'string', example: 'pi_abc123xyz', required: true },
      { name: 'txn_id', type: 'string', example: 'txn_p9q8r7', required: true },
      { name: 'amount_kzt', type: 'number', example: '1118', required: true },
      { name: 'processing_time_ms', type: 'number', example: '2300', required: true },
      { name: 'was_3ds', type: 'boolean', example: 'true', required: true },
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
    ],
    metric: 'Payment success rate > 92%',
    funnelStep: 8,
  },
  {
    name: 'payment.failed',
    displayName: 'Payment Failed',
    category: 'payment',
    module: 'Payments',
    trigger: 'PSP returns failure / error state page',
    properties: [
      { name: 'intent_id', type: 'string', example: 'pi_abc123xyz', required: true },
      {
        name: 'error_code',
        type: 'enum',
        example: 'declined | insufficient_funds | expired_card | network | timeout',
        required: true,
      },
      { name: 'amount_kzt', type: 'number', example: '1118', required: true },
      { name: 'retry_number', type: 'number', example: '0', required: true },
    ],
    metric: 'Failure → retry rate, failure → churn rate',
  },
  {
    name: 'payment.retry_attempted',
    displayName: 'Payment Retry',
    category: 'payment',
    module: 'Payments',
    trigger: "Click 'Try Again' on failure page",
    properties: [
      { name: 'original_intent_id', type: 'string', example: 'pi_abc123xyz', required: true },
      { name: 'retry_number', type: 'number', example: '1', required: true },
      { name: 'changed_method', type: 'boolean', example: 'true', required: true },
    ],
    metric: 'Retry → success rate > 50%',
  },
  {
    name: 'payment.refund_requested',
    displayName: 'Refund Requested',
    category: 'payment',
    module: 'Payments',
    trigger: 'Submit refund request form',
    properties: [
      { name: 'txn_id', type: 'string', example: 'txn_p9q8r7', required: true },
      { name: 'refund_type', type: 'enum', example: 'full | partial', required: true },
      { name: 'amount_kzt', type: 'number', example: '1118', required: true },
      {
        name: 'reason',
        type: 'enum',
        example: 'room_closed | dispute_won | owner_cancelled | other',
        required: true,
      },
    ],
    metric: 'Refund rate < 5% of payments',
  },
  {
    name: 'payment.receipt_viewed',
    displayName: 'Receipt Viewed',
    category: 'engagement',
    module: 'Payments',
    trigger: 'Open receipt modal or /payment/receipt/:id',
    properties: [
      { name: 'txn_id', type: 'string', example: 'txn_p9q8r7', required: true },
      {
        name: 'view_context',
        type: 'enum',
        example: 'history_tab | confirmation | email_link',
        required: true,
      },
    ],
    metric: 'Receipt view rate per payment',
  },
  {
    name: 'payment.export_downloaded',
    displayName: 'Export Downloaded',
    category: 'engagement',
    module: 'Payments',
    trigger: 'Click CSV/PDF export in payment history',
    properties: [
      { name: 'format', type: 'enum', example: 'csv | pdf', required: true },
      { name: 'date_range', type: 'string', example: '2026-01-01..2026-03-31', required: true },
      { name: 'records_count', type: 'number', example: '24', required: true },
    ],
    metric: 'Export usage rate',
  },

  // ── Support ──
  {
    name: 'support.ticket_created',
    displayName: 'Ticket Created',
    category: 'support',
    module: 'Support',
    trigger: 'Submit new ticket form',
    properties: [
      { name: 'ticket_id', type: 'string', example: 'TKT-2026-00142', required: true },
      {
        name: 'category',
        type: 'enum',
        example: 'payment | room | account | other',
        required: true,
      },
      { name: 'priority', type: 'enum', example: 'urgent | high | normal | low', required: true },
      { name: 'has_attachments', type: 'boolean', example: 'true', required: true },
      { name: 'body_length', type: 'number', example: '245', required: true },
    ],
    metric: 'Ticket volume trend, avg resolution time',
  },
  {
    name: 'support.ticket_resolved',
    displayName: 'Ticket Resolved',
    category: 'support',
    module: 'Support',
    trigger: 'Agent/user marks ticket resolved',
    properties: [
      { name: 'ticket_id', type: 'string', example: 'TKT-2026-00142', required: true },
      { name: 'resolution_time_h', type: 'number', example: '4.5', required: true },
      { name: 'sla_breached', type: 'boolean', example: 'false', required: true },
      { name: 'resolved_by', type: 'enum', example: 'agent | user | auto', required: true },
      { name: 'satisfaction_rating', type: 'number?', example: '4', required: false },
    ],
    metric: 'SLA breach rate < 5%, CSAT > 4.0',
  },
  {
    name: 'support.faq_viewed',
    displayName: 'FAQ Viewed',
    category: 'engagement',
    module: 'Support',
    trigger: 'Expand FAQ item',
    properties: [
      { name: 'faq_id', type: 'string', example: 'faq-payment-timeline', required: true },
      { name: 'search_query', type: 'string?', example: 'refund time', required: false },
      { name: 'deflected_ticket', type: 'boolean', example: 'true', required: true },
    ],
    metric: 'FAQ deflection rate > 30%',
  },

  // ── Profile & Reputation ──
  {
    name: 'profile.viewed',
    displayName: 'Profile Viewed',
    category: 'engagement',
    module: 'Profile',
    trigger: 'Navigate to /user/:id',
    properties: [
      { name: 'profile_user_id', type: 'string', example: 'usr_a1b2c3', required: true },
      {
        name: 'viewer_relationship',
        type: 'enum',
        example: 'self | room_member | stranger',
        required: true,
      },
      { name: 'profile_rating', type: 'number', example: '4.6', required: false },
    ],
    metric: 'Profile view → trust decision',
  },
  {
    name: 'profile.review_submitted',
    displayName: 'Review Submitted',
    category: 'engagement',
    module: 'Profile',
    trigger: 'Submit review form',
    properties: [
      { name: 'target_user_id', type: 'string', example: 'usr_x7y8z9', required: true },
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'rating', type: 'number', example: '4', required: true },
      { name: 'body_length', type: 'number', example: '82', required: true },
      { name: 'flagged_profanity', type: 'boolean', example: 'false', required: true },
    ],
    metric: 'Review submission rate per completed room',
  },

  // ── Notifications ──
  {
    name: 'notification.received',
    displayName: 'Notification Received',
    category: 'system',
    module: 'Notifications',
    trigger: 'Server delivers notification',
    properties: [
      {
        name: 'notification_type',
        type: 'enum',
        example: 'payment_success | member_joined | dispute_filed',
        required: true,
      },
      { name: 'channel', type: 'enum', example: 'in_app | push | email', required: true },
      { name: 'group_key', type: 'string?', example: 'room:rm_k8x9p2', required: false },
    ],
    metric: 'Delivery rate by channel',
  },
  {
    name: 'notification.clicked',
    displayName: 'Notification Clicked',
    category: 'engagement',
    module: 'Notifications',
    trigger: 'Click notification in center/push',
    properties: [
      { name: 'notification_id', type: 'string', example: 'ntf_abc123', required: true },
      { name: 'notification_type', type: 'string', example: 'payment_reminder', required: true },
      { name: 'time_since_delivery_s', type: 'number', example: '120', required: true },
      { name: 'channel', type: 'enum', example: 'in_app | push', required: true },
    ],
    metric: 'Click-through rate by type > 25%',
  },
  {
    name: 'notification.preferences_changed',
    displayName: 'Notification Prefs Changed',
    category: 'engagement',
    module: 'Notifications',
    trigger: 'Save on /notification-prefs',
    properties: [
      { name: 'changes_count', type: 'number', example: '3', required: true },
      { name: 'channels_disabled', type: 'string[]', example: '["push", "email"]', required: true },
      { name: 'quiet_hours_enabled', type: 'boolean', example: 'true', required: true },
    ],
    metric: 'Opt-out rate by channel',
  },

  // ── Geo ──
  {
    name: 'geo.operator_lookup',
    displayName: 'Geo Operator Lookup',
    category: 'engagement',
    module: 'Geo',
    trigger: 'Location permission granted on /geo-operator',
    properties: [
      { name: 'city', type: 'string', example: 'Almaty', required: true },
      { name: 'lat_bucket', type: 'string', example: '43.2', required: true },
      { name: 'lng_bucket', type: 'string', example: '76.9', required: true },
      { name: 'operators_found', type: 'number', example: '5', required: true },
      { name: 'top_operator', type: 'string', example: 'Beeline', required: true },
    ],
    metric: 'Geo lookup → operator page visit rate',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: ABUSE / FRAUD SIGNALS
   ═══════════════════════════════════════════════════════════════════════════ */
const ABUSE_SIGNALS: AbuseSignal[] = [
  {
    id: 'abuse-1',
    name: 'Brute-Force Login',
    description:
      'Repeated failed login attempts from same IP or account, indicating credential stuffing or brute force attack',
    detectionEvents: ['auth.login_failed'],
    threshold: '> 5 failed attempts',
    window: '15 min',
    severity: 'critical',
    automatedAction: 'Lock account for 15 min. Notify user via email. Flag IP for monitoring.',
    properties: ['ip_hash', 'attempt_count', 'user_agent_hash', 'email_hash'],
  },
  {
    id: 'abuse-2',
    name: 'Rapid Room Join Attempts',
    description:
      'User attempts to join many rooms quickly, possibly to hold spots or test stolen cards',
    detectionEvents: ['room.join_started', 'payment.intent_created'],
    threshold: '> 5 join attempts',
    window: '10 min',
    severity: 'high',
    automatedAction:
      'Block further join attempts for 30 min. Alert admin. If payment fails > 3, flag for fraud review.',
    properties: ['user_id', 'room_ids[]', 'intent_ids[]', 'failure_count'],
  },
  {
    id: 'abuse-3',
    name: 'High Dispute Rate',
    description: 'User files disputes on > 30% of their rooms within a period',
    detectionEvents: ['support.ticket_created', 'dispute.filed'],
    threshold: '> 30% dispute ratio',
    window: '90 days',
    severity: 'high',
    automatedAction: 'Flag user for manual review. Restrict from creating new rooms. Notify admin.',
    properties: ['user_id', 'total_rooms', 'dispute_count', 'dispute_ratio'],
  },
  {
    id: 'abuse-4',
    name: 'Payment Card Testing',
    description: 'Multiple small payment attempts with different cards from same account',
    detectionEvents: ['payment.intent_created', 'payment.failed'],
    threshold: '> 3 different cards in 1h, or > 3 failures',
    window: '1 hour',
    severity: 'critical',
    automatedAction: 'Block payment for 24h. Lock account. Notify security team. Report to PSP.',
    properties: ['user_id', 'card_fingerprints[]', 'failure_codes[]', 'amounts_kzt[]'],
  },
  {
    id: 'abuse-5',
    name: 'Excessive PII Reveal (Admin)',
    description: 'Admin reveals user PII more than expected, potential data harvesting',
    detectionEvents: ['admin.pii_revealed'],
    threshold: '> 20 reveals',
    window: '1 hour',
    severity: 'critical',
    automatedAction: 'Suspend admin privileges. Notify security lead. Create incident report.',
    properties: ['admin_user_id', 'reveal_count', 'target_user_ids[]', 'reasons[]'],
  },
  {
    id: 'abuse-6',
    name: 'Review Manipulation',
    description:
      'User submits suspiciously positive/negative reviews on multiple rooms in short time',
    detectionEvents: ['profile.review_submitted'],
    threshold: '> 5 reviews',
    window: '1 hour',
    severity: 'medium',
    automatedAction: 'Hold reviews for manual moderation. Flag for review manipulation.',
    properties: [
      'user_id',
      'review_count',
      'avg_rating',
      'target_user_ids[]',
      'text_similarity_score',
    ],
  },
  {
    id: 'abuse-7',
    name: 'Signup Spam',
    description: 'Multiple accounts created from same IP or device fingerprint',
    detectionEvents: ['auth.signup_success'],
    threshold: '> 3 signups',
    window: '24 hours',
    severity: 'high',
    automatedAction: 'CAPTCHA challenge on new signups from IP. Flag accounts for review.',
    properties: ['ip_hash', 'device_fingerprint', 'email_patterns[]', 'signup_count'],
  },
  {
    id: 'abuse-8',
    name: 'Room Owner Ghost',
    description: 'Room owner is inactive but rooms still active with paying members',
    detectionEvents: ['auth.login_success', 'room.detail_viewed'],
    threshold: 'Owner last active > 30 days',
    window: '30 days',
    severity: 'medium',
    automatedAction:
      'Send re-engagement email series (7d, 14d, 21d). At 30d, notify members and flag room.',
    properties: [
      'owner_user_id',
      'room_ids[]',
      'active_members_count',
      'last_active_at',
      'revenue_at_risk_kzt',
    ],
  },
  {
    id: 'abuse-9',
    name: 'Refund Abuse',
    description: 'User requests refunds on high percentage of payments',
    detectionEvents: ['payment.refund_requested'],
    threshold: '> 3 refunds or > 40% refund ratio',
    window: '90 days',
    severity: 'high',
    automatedAction:
      'Manual review required for future refunds. Restrict from joining new rooms until resolved.',
    properties: ['user_id', 'refund_count', 'refund_total_kzt', 'payment_count', 'refund_ratio'],
  },
  {
    id: 'abuse-10',
    name: 'Concurrent Session Anomaly',
    description: 'Same account active from geographically distant locations simultaneously',
    detectionEvents: ['auth.login_success'],
    threshold: '> 500km apart',
    window: '5 min',
    severity: 'high',
    automatedAction:
      'Terminate older session. Send security notification. Require password change.',
    properties: ['user_id', 'session_ids[]', 'geo_locations[]', 'distance_km'],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: ADMIN EVENTS
   ═══════════════════════════════════════════════════════════════════════════ */
const ADMIN_EVENTS: AdminEvent[] = [
  {
    name: 'admin.moderation_decision',
    displayName: 'Moderation Decision',
    trigger: 'Admin approves/rejects moderation item',
    properties: [
      { name: 'item_id', type: 'string', example: 'mod_123', required: true },
      {
        name: 'item_type',
        type: 'enum',
        example: 'room_review | user_report | content_flag',
        required: true,
      },
      { name: 'decision', type: 'enum', example: 'approve | reject | escalate', required: true },
      { name: 'reason', type: 'string', example: 'Violates terms section 4.2', required: true },
      { name: 'processing_time_s', type: 'number', example: '45', required: true },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Moderation throughput / day',
  },
  {
    name: 'admin.room_blocked',
    displayName: 'Room Blocked',
    trigger: 'Admin blocks a room via admin panel',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      { name: 'reason', type: 'string', example: 'Fraudulent listing', required: true },
      { name: 'dispute_id', type: 'string?', example: 'dsp_456', required: false },
      { name: 'affected_members', type: 'number', example: '4', required: true },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Blocked rooms / week',
  },
  {
    name: 'admin.room_unblocked',
    displayName: 'Room Unblocked',
    trigger: 'Admin unblocks a room',
    properties: [
      { name: 'room_id', type: 'string', example: 'rm_k8x9p2', required: true },
      {
        name: 'unblock_reason',
        type: 'string',
        example: 'False positive — owner verified',
        required: true,
      },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Unblock rate (of total blocks)',
  },
  {
    name: 'admin.user_banned',
    displayName: 'User Banned',
    trigger: 'Admin bans user from platform',
    properties: [
      { name: 'target_user_id', type: 'string', example: 'usr_bad1', required: true },
      { name: 'ban_type', type: 'enum', example: 'temporary | permanent', required: true },
      { name: 'ban_duration_days', type: 'number?', example: '30', required: false },
      { name: 'reason', type: 'string', example: 'Repeated fraud violations', required: true },
      { name: 'linked_dispute_id', type: 'string?', example: 'dsp_789', required: false },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Bans / month, ban appeal rate',
  },
  {
    name: 'admin.refund_initiated',
    displayName: 'Refund Initiated by Admin',
    trigger: 'Admin processes refund via dispute or direct',
    properties: [
      { name: 'refund_id', type: 'string', example: 'ref_xyz789', required: true },
      { name: 'txn_id', type: 'string', example: 'txn_p9q8r7', required: true },
      { name: 'amount_kzt', type: 'number', example: '1398', required: true },
      { name: 'refund_type', type: 'enum', example: 'full | partial', required: true },
      {
        name: 'reason',
        type: 'enum',
        example: 'dispute_resolved | service_issue | goodwill',
        required: true,
      },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Refund volume ₸ / week',
  },
  {
    name: 'admin.dispute_decided',
    displayName: 'Dispute Decided',
    trigger: 'Admin renders decision on dispute',
    properties: [
      { name: 'dispute_id', type: 'string', example: 'dsp_456', required: true },
      {
        name: 'outcome',
        type: 'enum',
        example: 'reporter_wins | respondent_wins | no_action | partial',
        required: true,
      },
      { name: 'refund_amount_kzt', type: 'number', example: '699', required: false },
      { name: 'ban_applied', type: 'boolean', example: 'false', required: true },
      { name: 'resolution_time_h', type: 'number', example: '18.5', required: true },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Avg resolution time, outcome distribution',
  },
  {
    name: 'admin.pii_revealed',
    displayName: 'PII Revealed',
    trigger: 'Admin clicks reveal on masked PII field',
    properties: [
      { name: 'target_user_id', type: 'string', example: 'usr_a1b2c3', required: true },
      {
        name: 'field_revealed',
        type: 'enum',
        example: 'email | phone | full_name | card_last4',
        required: true,
      },
      {
        name: 'reason',
        type: 'string',
        example: 'Verifying identity for dispute DSP-456',
        required: true,
      },
      { name: 'reveal_duration_s', type: 'number', example: '30', required: true },
      { name: 'admin_user_id', type: 'string', example: 'adm_001', required: true },
      { name: 'ip_address', type: 'string', example: '192.168.1.x', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'PII reveals / day, reveals / admin',
  },
  {
    name: 'admin.audit_log_accessed',
    displayName: 'Audit Log Accessed',
    trigger: 'Admin opens audit log viewer',
    properties: [
      {
        name: 'filter_applied',
        type: 'string',
        example: 'actor:adm_001,action:refund',
        required: false,
      },
      { name: 'date_range', type: 'string', example: '2026-03-01..2026-03-31', required: true },
      { name: 'results_count', type: 'number', example: '156', required: true },
      { name: 'admin_user_id', type: 'string', example: 'adm_002', required: true },
    ],
    auditRequired: true,
    dashboardWidget: 'Audit access frequency',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   DATA: IMPLEMENTATION SPEC
   ═══════════════════════════════════════════════════════════════════════════ */
const IMPL_SPECS: ImplSpec[] = [
  {
    layer: 'Client SDK',
    icon: Monitor,
    description: 'Browser-side event collection',
    rules: [
      'Use a single track(eventName, properties) function — no direct vendor calls',
      'Queue events in memory, flush every 5s or on page unload (sendBeacon)',
      'Automatically attach: session_id, user_id (hashed), locale, timestamp, page_url, device_type',
      'Never include PII (email, phone, name) in event properties — use hashed IDs only',
      'Respect user consent: check analytics_consent before tracking. No tracking before consent.',
      'Event names: snake_case, module.action format (e.g., room.detail_viewed)',
      'Max 20 custom properties per event — additional data goes to server-side enrichment',
    ],
  },
  {
    layer: 'Server Events',
    icon: Server,
    description: 'Backend event emission',
    rules: [
      'Emit from service layer, not controller — ensures business logic events fire regardless of API surface',
      'Payment events MUST come from webhook handler, not client — prevents spoofing',
      'Enrich with server-only data: risk_score_bucket, ip_geo_country, account_age_days',
      'Abuse signals computed by streaming processor, not inline — keep request latency clean',
      'All admin events auto-create audit_log entry in same transaction',
      'Event schema versioned: include schema_version: 1 in all payloads',
    ],
  },
  {
    layer: 'Data Pipeline',
    icon: Database,
    description: 'Event storage and processing',
    rules: [
      'Raw events → message queue (Kafka/SQS) → data warehouse (BigQuery/Redshift)',
      'Real-time stream for abuse detection: < 30s from event to signal evaluation',
      'Daily batch for funnel/retention metrics',
      'Retain raw events for 2 years, aggregates forever',
      'PII scrubbing: automated job removes any accidentally-included PII within 24h',
      'Schema registry validates event payloads before warehouse ingestion',
    ],
  },
  {
    layer: 'Dashboards',
    icon: BarChart3,
    description: 'Visualization and alerting',
    rules: [
      'Primary funnel dashboard: real-time conversion rates per step',
      'Abuse dashboard: signals triggered / day, false positive rate, response time',
      'Revenue dashboard: daily GMV, average transaction, refund rate',
      'Support dashboard: ticket volume, SLA compliance, CSAT trend',
      'Admin ops dashboard: moderation throughput, decision distribution, avg processing time',
      'Alerts: Slack/PagerDuty for critical abuse signals, SLA breaches > 10%, payment failure spike > 15%',
    ],
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   RENDER COMPONENTS
   ═══════════════════════════════════════════════════════════════════════════ */

/* ── Funnel Visualization ── */
function FunnelSection() {
  const { t } = useI18n();
  const mockConversions = [100, 72, 58, 44, 36, 30, 28, 26, 25];

  return (
    <div className="flex flex-col gap-6">
      {/* Visual funnel */}
      <SC className="!p-5">
        <div className="text-[14px] mb-4" style={{ color: 'var(--eco-text)' }}>
          {t('anFunnelConversion')}: Catalog → Active Member
        </div>
        <div className="flex flex-col gap-0">
          {PRIMARY_FUNNEL.map((stage, i) => {
            const width = mockConversions[i];
            const prevWidth = i > 0 ? mockConversions[i - 1] : 100;
            const dropoff =
              i > 0 ? Math.round((1 - mockConversions[i] / mockConversions[i - 1]) * 100) : 0;
            return (
              <div key={stage.step} className="flex items-center gap-3 mb-1">
                <div
                  className="w-6 text-right text-[10px] tabular-nums shrink-0"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  {stage.step}
                </div>
                <div className="flex-1 relative">
                  <div
                    className="h-8 rounded-md flex items-center px-3 transition-all relative overflow-hidden"
                    style={{
                      width: `${width}%`,
                      background: `var(--eco-primary)`,
                      opacity: 0.15 + 0.85 * (width / 100),
                    }}
                  >
                    <span
                      className="text-[10px] whitespace-nowrap relative z-10"
                      style={{ color: 'var(--eco-text)' }}
                    >
                      {stage.displayName}
                    </span>
                  </div>
                </div>
                <div
                  className="w-12 text-right text-[11px] tabular-nums shrink-0"
                  style={{ color: 'var(--eco-primary)' }}
                >
                  {width}%
                </div>
                {i > 0 && (
                  <div
                    className="w-16 text-right text-[9px] shrink-0"
                    style={{
                      color: dropoff > 20 ? 'var(--eco-danger-500)' : 'var(--eco-text-tertiary)',
                    }}
                  >
                    −{dropoff}% drop
                  </div>
                )}
                {i === 0 && <div className="w-16" />}
              </div>
            );
          })}
        </div>
        <div
          className="mt-3 text-[10px] px-3 py-2 rounded-lg"
          style={{ background: 'var(--eco-bg)', color: 'var(--eco-text-tertiary)' }}
        >
          Mock data for visualization. Actual benchmarks in{' '}
          <code style={{ color: 'var(--eco-primary)' }}>benchmark</code> field per stage. Primary
          optimization target: steps with &gt;20% dropoff.
        </div>
      </SC>

      {/* Stage cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRIMARY_FUNNEL.map((stage, i) => (
          <SC key={stage.step} className="!p-0 overflow-hidden">
            <div
              className="px-4 py-3 flex items-center gap-2"
              style={{ borderBottom: '1px solid var(--eco-border)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px]"
                style={{ background: 'var(--eco-primary)', color: 'var(--eco-text-on-primary)' }}
              >
                {stage.step}
              </div>
              <span className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                {stage.displayName}
              </span>
            </div>
            <div className="px-4 py-3 space-y-2">
              <code
                className="text-[10px] block px-2 py-1 rounded"
                style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
              >
                {stage.event}
              </code>
              <div className="text-[11px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {stage.description}
              </div>
              <div
                className="text-[10px] flex items-start gap-1"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <TrendingDown
                  size={10}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--eco-danger-500)' }}
                />
                <span>
                  <strong>Dropoff:</strong> {stage.dropoffMetric}
                </span>
              </div>
              <div
                className="text-[10px] flex items-start gap-1"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <Target
                  size={10}
                  className="mt-0.5 shrink-0"
                  style={{ color: 'var(--eco-success-500)' }}
                />
                <span>
                  <strong>Target:</strong> {stage.benchmark}
                </span>
              </div>
            </div>
          </SC>
        ))}
      </div>

      {/* Secondary funnels */}
      <SC className="!p-5">
        <div className="text-[14px] mb-3" style={{ color: 'var(--eco-text)' }}>
          Secondary Funnels
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            {
              name: 'Room Creation',
              steps: [
                'catalog.plan_viewed',
                'room.create_started',
                'room.created',
                'room.share_link_copied',
                'room.first_member_joined',
              ],
              target: 'Creation → first member < 48h',
            },
            {
              name: 'Support Resolution',
              steps: [
                'support.ticket_created',
                'support.agent_assigned',
                'support.first_reply',
                'support.ticket_resolved',
              ],
              target: 'Avg resolution < 12h, SLA breach < 5%',
            },
            {
              name: 'Dispute Flow',
              steps: [
                'dispute.filed',
                'dispute.evidence_submitted',
                'admin.dispute_decided',
                'payment.refund_completed',
              ],
              target: 'Decision within 48h, satisfaction > 70%',
            },
            {
              name: 'Re-engagement',
              steps: [
                'notification.payment_reminder_sent',
                'notification.clicked',
                'payment.checkout_viewed',
                'payment.success',
              ],
              target: 'Reminder → payment rate > 85%',
            },
            {
              name: 'Onboarding',
              steps: [
                'auth.signup_success',
                'profile.avatar_uploaded',
                'catalog.operator_viewed',
                'room.join_completed',
              ],
              target: 'Signup → first join < 7 days',
            },
            {
              name: 'Retention (30d)',
              steps: [
                'room.member_activated',
                'payment.recurring_success',
                'room.detail_viewed (return)',
                'room.member_active_30d',
              ],
              target: '30d retention > 70%',
            },
          ].map((f) => (
            <div
              key={f.name}
              className="rounded-lg p-3"
              style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
            >
              <div className="text-[12px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {f.name}
              </div>
              <div className="flex flex-col gap-1">
                {f.steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center text-[7px]"
                      style={{
                        background: `var(--eco-primary)`,
                        opacity: 0.3 + 0.7 * ((i + 1) / f.steps.length),
                        color: 'var(--eco-text-on-primary)',
                      }}
                    >
                      {i + 1}
                    </div>
                    <code className="text-[9px]" style={{ color: 'var(--eco-primary)' }}>
                      {s}
                    </code>
                  </div>
                ))}
              </div>
              <div
                className="mt-2 text-[9px] flex items-start gap-1"
                style={{ color: 'var(--eco-success-500)' }}
              >
                <Target size={8} className="mt-0.5" /> {f.target}
              </div>
            </div>
          ))}
        </div>
      </SC>
    </div>
  );
}

/* ── Product Events Section ── */
function EventsSection() {
  const { t, language } = useI18n();
  const [search, setSearch] = useState('');
  const [filterModule, setFilterModule] = useState('all');
  const [filterCat, setFilterCat] = useState<'all' | EventCategory>('all');
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const modules = useMemo(() => ['all', ...new Set(EVENTS.map((e) => e.module))], []);
  const searchLower = search.toLowerCase();

  const filtered = EVENTS.filter((e) => {
    if (filterModule !== 'all' && e.module !== filterModule) return false;
    if (filterCat !== 'all' && e.category !== filterCat) return false;
    if (
      searchLower &&
      !e.name.includes(searchLower) &&
      !e.displayName.toLowerCase().includes(searchLower) &&
      !e.trigger.toLowerCase().includes(searchLower)
    )
      return false;
    return true;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--eco-text-tertiary)' }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('anSearchEvents')}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-[12px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
              outline: 'none',
            }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {modules.map((m) => (
            <button
              key={m}
              onClick={() => setFilterModule(m)}
              className="px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors"
              style={{
                background: filterModule === m ? 'var(--eco-primary)' : 'var(--eco-neutral-100)',
                color:
                  filterModule === m ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
              }}
            >
              {m === 'all' ? 'All' : m}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-1.5 mb-5 flex-wrap">
        {(['all', 'funnel', 'engagement', 'payment', 'support', 'abuse', 'system'] as const).map(
          (c) => (
            <button
              key={c}
              onClick={() => setFilterCat(c)}
              className="px-2.5 py-1 rounded-lg text-[10px] cursor-pointer transition-colors capitalize"
              style={{
                background: filterCat === c ? 'var(--eco-primary)' : 'var(--eco-neutral-100)',
                color: filterCat === c ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
              }}
            >
              {c === 'all'
                ? `All (${EVENTS.length})`
                : `${c} (${EVENTS.filter((e) => e.category === c).length})`}
            </button>
          ),
        )}
      </div>

      <div className="text-[10px] mb-3" style={{ color: 'var(--eco-text-tertiary)' }}>
        Showing {filtered.length} of {EVENTS.length} {t('anTotalEvents')} ·{' '}
        <span style={{ color: 'var(--eco-danger-500)' }}>●</span> = required property
      </div>

      {/* Events list */}
      <div className="flex flex-col gap-2">
        {filtered.map((evt) => {
          const isExpanded = expandedEvent === evt.name;
          return (
            <SC key={evt.name} className="!p-0 overflow-hidden">
              <button
                onClick={() => setExpandedEvent(isExpanded ? null : evt.name)}
                className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left transition-colors hover:bg-[var(--eco-bg)]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <code
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
                    >
                      {evt.name}
                    </code>
                    <CatBadge c={evt.category} />
                    <span
                      className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'var(--eco-neutral-100)',
                        color: 'var(--eco-text-tertiary)',
                      }}
                    >
                      {evt.module}
                    </span>
                    {evt.funnelStep && (
                      <span
                        className="text-[8px] px-1 py-0.5 rounded-full"
                        style={{
                          background: 'var(--eco-primary)',
                          color: 'var(--eco-text-on-primary)',
                        }}
                      >
                        F{evt.funnelStep}
                      </span>
                    )}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                    {evt.displayName}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded-full tabular-nums"
                    style={{
                      background: 'var(--eco-neutral-100)',
                      color: 'var(--eco-text-tertiary)',
                    }}
                  >
                    {evt.properties.length} props
                  </span>
                  <ChevronRight
                    size={12}
                    className="transition-transform"
                    style={{
                      color: 'var(--eco-neutral-300)',
                      transform: isExpanded ? 'rotate(90deg)' : 'none',
                    }}
                  />
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4" style={{ borderTop: '1px solid var(--eco-border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3">
                    {/* Left: trigger + metric */}
                    <div className="space-y-3">
                      <div>
                        <div
                          className="text-[9px] tracking-widest uppercase mb-1"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          {t('anTrigger')}
                        </div>
                        <div
                          className="text-[11px] px-3 py-2 rounded-lg"
                          style={{ background: 'var(--eco-bg)', color: 'var(--eco-text)' }}
                        >
                          {evt.trigger}
                        </div>
                      </div>
                      <div>
                        <div
                          className="text-[9px] tracking-widest uppercase mb-1"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          {t('anMetric')}
                        </div>
                        <div
                          className="text-[11px] px-3 py-2 rounded-lg flex items-start gap-1.5"
                          style={{
                            background: 'var(--eco-success-100)',
                            border: '1px solid var(--eco-success-300)',
                          }}
                        >
                          <Target
                            size={10}
                            className="mt-0.5 shrink-0"
                            style={{ color: 'var(--eco-success-500)' }}
                          />
                          <span style={{ color: 'var(--eco-success-500)' }}>{evt.metric}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: properties table */}
                    <div>
                      <div
                        className="text-[9px] tracking-widest uppercase mb-1"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        {t('anProperties')} ({evt.properties.length})
                      </div>
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{ border: '1px solid var(--eco-border)' }}
                      >
                        <div
                          className="grid grid-cols-[1fr_auto_1fr_auto] text-[8px] px-3 py-1.5"
                          style={{ background: 'var(--eco-bg)', color: 'var(--eco-text-tertiary)' }}
                        >
                          <span>PROPERTY</span>
                          <span>TYPE</span>
                          <span>EXAMPLE</span>
                          <span>REQ</span>
                        </div>
                        {evt.properties.map((p) => (
                          <div
                            key={p.name}
                            className="grid grid-cols-[1fr_auto_1fr_auto] text-[10px] px-3 py-1.5 items-center gap-2"
                            style={{ borderTop: '1px solid var(--eco-border)' }}
                          >
                            <code style={{ color: 'var(--eco-primary)' }}>{p.name}</code>
                            <span
                              className="text-[9px] px-1 rounded"
                              style={{
                                background: 'var(--eco-neutral-100)',
                                color: 'var(--eco-text-tertiary)',
                              }}
                            >
                              {p.type}
                            </span>
                            <span
                              className="text-[9px] truncate"
                              style={{ color: 'var(--eco-text-secondary)' }}
                            >
                              {p.example}
                            </span>
                            <span>
                              {p.required ? (
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ background: 'var(--eco-danger-500)' }}
                                />
                              ) : (
                                <span
                                  className="w-2 h-2 rounded-full inline-block"
                                  style={{ background: 'var(--eco-neutral-200)' }}
                                />
                              )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </SC>
          );
        })}
      </div>
    </div>
  );
}

/* ── Abuse Signals Section ── */
function AbuseSection() {
  const { t } = useI18n();

  return (
    <div className="flex flex-col gap-4">
      {/* Severity legend */}
      <SC className="!px-5 !py-3 flex items-center gap-4 flex-wrap">
        <span className="text-[11px]" style={{ color: 'var(--eco-text-secondary)' }}>
          Severity levels:
        </span>
        {(['critical', 'high', 'medium', 'low'] as Severity[]).map((s) => (
          <SevBadge key={s} s={s} />
        ))}
        <span className="text-[10px] ml-auto" style={{ color: 'var(--eco-text-tertiary)' }}>
          {ABUSE_SIGNALS.length} {t('anSignals')}
        </span>
      </SC>

      {ABUSE_SIGNALS.map((signal) => (
        <SC key={signal.id} className="!p-0 overflow-hidden">
          {/* Header */}
          <div
            className="px-5 py-3 flex items-center gap-3"
            style={{ borderBottom: '1px solid var(--eco-border)' }}
          >
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--eco-danger-100)' }}
            >
              <ShieldAlert size={14} style={{ color: 'var(--eco-danger-500)' }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <code
                  className="text-[10px] px-1.5 py-0.5 rounded"
                  style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
                >
                  {signal.id}
                </code>
                <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                  {signal.name}
                </span>
                <SevBadge s={signal.severity} />
              </div>
              <div className="text-[11px] mt-0.5" style={{ color: 'var(--eco-text-tertiary)' }}>
                {signal.description}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div
              className="px-5 py-3 space-y-3"
              style={{ borderRight: '1px solid var(--eco-border)' }}
            >
              {/* Detection */}
              <div>
                <div
                  className="text-[9px] tracking-widest uppercase mb-1.5"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  DETECTION EVENTS
                </div>
                <div className="flex flex-wrap gap-1">
                  {signal.detectionEvents.map((e) => (
                    <code
                      key={e}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
                    >
                      {e}
                    </code>
                  ))}
                </div>
              </div>
              {/* Threshold */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div
                    className="text-[9px] tracking-widest uppercase mb-1"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    {t('anThreshold')}
                  </div>
                  <div
                    className="text-[11px] px-2 py-1.5 rounded-lg"
                    style={{
                      background: 'var(--eco-warning-100)',
                      color: 'var(--eco-warning-500)',
                    }}
                  >
                    {signal.threshold}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[9px] tracking-widest uppercase mb-1"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    WINDOW
                  </div>
                  <div
                    className="text-[11px] px-2 py-1.5 rounded-lg"
                    style={{
                      background: 'var(--eco-neutral-100)',
                      color: 'var(--eco-text-secondary)',
                    }}
                  >
                    {signal.window}
                  </div>
                </div>
              </div>
              {/* Properties */}
              <div>
                <div
                  className="text-[9px] tracking-widest uppercase mb-1"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  {t('anProperties')}
                </div>
                <div className="flex flex-wrap gap-1">
                  {signal.properties.map((p) => (
                    <code
                      key={p}
                      className="text-[9px] px-1.5 py-0.5 rounded"
                      style={{
                        background: 'var(--eco-neutral-100)',
                        color: 'var(--eco-text-secondary)',
                      }}
                    >
                      {p}
                    </code>
                  ))}
                </div>
              </div>
            </div>

            {/* Automated action */}
            <div className="px-5 py-3">
              <div
                className="text-[9px] tracking-widest uppercase mb-1.5"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                AUTOMATED RESPONSE
              </div>
              <div
                className="rounded-lg p-3"
                style={{
                  background: 'var(--eco-danger-100)',
                  border: '1px solid var(--eco-danger-300)',
                }}
              >
                <div className="text-[11px]" style={{ color: 'var(--eco-danger-500)' }}>
                  {signal.automatedAction}
                </div>
              </div>
            </div>
          </div>
        </SC>
      ))}
    </div>
  );
}

/* ── Admin Events Section ── */
function AdminSection() {
  const { t } = useI18n();
  const [expandedAdmin, setExpandedAdmin] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-3">
      <SC className="!px-5 !py-3 flex items-center gap-2 flex-wrap">
        <ShieldCheck size={14} style={{ color: 'var(--eco-success-500)' }} />
        <span className="text-[11px]" style={{ color: 'var(--eco-text-secondary)' }}>
          All admin events require audit logging. Events are written to append-only{' '}
          <code style={{ color: 'var(--eco-primary)' }}>audit_log</code> table in the same database
          transaction.
        </span>
        <span
          className="text-[10px] px-2 py-0.5 rounded-full ml-auto"
          style={{ background: 'var(--eco-success-100)', color: 'var(--eco-success-500)' }}
        >
          {ADMIN_EVENTS.length} events
        </span>
      </SC>

      {ADMIN_EVENTS.map((evt) => {
        const isExpanded = expandedAdmin === evt.name;
        return (
          <SC key={evt.name} className="!p-0 overflow-hidden">
            <button
              onClick={() => setExpandedAdmin(isExpanded ? null : evt.name)}
              className="w-full flex items-center gap-3 px-4 py-3 cursor-pointer text-left transition-colors hover:bg-[var(--eco-bg)]"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <code
                    className="text-[11px] px-1.5 py-0.5 rounded"
                    style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
                  >
                    {evt.name}
                  </code>
                  <span
                    className="text-[8px] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: 'var(--eco-success-100)',
                      color: 'var(--eco-success-500)',
                    }}
                  >
                    audit: required
                  </span>
                </div>
                <div className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                  {evt.displayName}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[9px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {evt.dashboardWidget}
                </span>
                <ChevronRight
                  size={12}
                  className="transition-transform"
                  style={{
                    color: 'var(--eco-neutral-300)',
                    transform: isExpanded ? 'rotate(90deg)' : 'none',
                  }}
                />
              </div>
            </button>

            {isExpanded && (
              <div
                className="px-4 pb-4 pt-2 grid grid-cols-1 md:grid-cols-2 gap-4"
                style={{ borderTop: '1px solid var(--eco-border)' }}
              >
                <div>
                  <div
                    className="text-[9px] tracking-widest uppercase mb-1"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    {t('anTrigger')}
                  </div>
                  <div
                    className="text-[11px] px-3 py-2 rounded-lg mb-3"
                    style={{ background: 'var(--eco-bg)', color: 'var(--eco-text)' }}
                  >
                    {evt.trigger}
                  </div>
                  <div
                    className="text-[9px] tracking-widest uppercase mb-1"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    DASHBOARD WIDGET
                  </div>
                  <div
                    className="text-[11px] px-3 py-2 rounded-lg flex items-center gap-1.5"
                    style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
                  >
                    <BarChart3 size={10} /> {evt.dashboardWidget}
                  </div>
                </div>
                <div>
                  <div
                    className="text-[9px] tracking-widest uppercase mb-1"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    {t('anProperties')} ({evt.properties.length})
                  </div>
                  <div
                    className="rounded-lg overflow-hidden"
                    style={{ border: '1px solid var(--eco-border)' }}
                  >
                    {evt.properties.map((p, i) => (
                      <div
                        key={p.name}
                        className="flex items-center gap-2 text-[10px] px-3 py-1.5"
                        style={{ borderTop: i > 0 ? '1px solid var(--eco-border)' : 'none' }}
                      >
                        <code style={{ color: 'var(--eco-primary)' }}>{p.name}</code>
                        <span
                          className="text-[9px] px-1 rounded"
                          style={{
                            background: 'var(--eco-neutral-100)',
                            color: 'var(--eco-text-tertiary)',
                          }}
                        >
                          {p.type}
                        </span>
                        <span
                          className="text-[9px] ml-auto"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          {p.example}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </SC>
        );
      })}
    </div>
  );
}

/* ── Implementation Section ── */
function ImplSection() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {IMPL_SPECS.map((spec) => {
        const Icon = spec.icon;
        return (
          <SC key={spec.layer} className="!p-0 overflow-hidden">
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: '1px solid var(--eco-border)', background: 'var(--eco-bg)' }}
            >
              <Icon size={14} style={{ color: 'var(--eco-primary)' }} />
              <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                {spec.layer}
              </span>
              <span className="text-[10px] ml-auto" style={{ color: 'var(--eco-text-tertiary)' }}>
                {spec.description}
              </span>
            </div>
            <div className="px-4 py-3 space-y-2">
              {spec.rules.map((rule, i) => (
                <div key={i} className="flex items-start gap-2 text-[11px]">
                  <div
                    className="mt-1 w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center"
                    style={{ borderColor: 'var(--eco-neutral-300)' }}
                  />
                  <span style={{ color: 'var(--eco-text)' }}>{rule}</span>
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
export function AnalyticsEventTrackingPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'funnels' | 'events' | 'abuse' | 'admin' | 'impl'>('funnels');

  const totalProps = EVENTS.reduce((s, e) => s + e.properties.length, 0);

  const tabs = [
    {
      id: 'funnels' as const,
      label: t('anFunnels'),
      icon: TrendingUp,
      count: PRIMARY_FUNNEL.length + 6,
    },
    { id: 'events' as const, label: t('anEvents'), icon: Activity, count: EVENTS.length },
    { id: 'abuse' as const, label: t('anAbuse'), icon: ShieldAlert, count: ABUSE_SIGNALS.length },
    { id: 'admin' as const, label: t('anAdmin'), icon: Shield, count: ADMIN_EVENTS.length },
    { id: 'impl' as const, label: t('anImplementation'), icon: Code, count: IMPL_SPECS.length },
  ];

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
          >
            Page 25
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-warning-500)' }}
          >
            Instrumentation
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('anTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('anSubtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { n: EVENTS.length.toString(), label: 'Product events', color: 'var(--eco-primary)' },
          { n: totalProps.toString(), label: 'Event properties', color: 'var(--eco-brand-600)' },
          {
            n: (PRIMARY_FUNNEL.length + 6).toString(),
            label: 'Funnel stages',
            color: 'var(--eco-success-500)',
          },
          {
            n: ABUSE_SIGNALS.length.toString(),
            label: 'Abuse signals',
            color: 'var(--eco-danger-500)',
          },
          {
            n: ADMIN_EVENTS.length.toString(),
            label: 'Admin events',
            color: 'var(--eco-warning-500)',
          },
          {
            n: IMPL_SPECS.length.toString(),
            label: 'Impl layers',
            color: 'var(--eco-text-secondary)',
          },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[20px] tabular-nums" style={{ color: s.color }}>
              {s.n}
            </div>
            <div className="text-[9px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--eco-surface)' }}
      >
        {tabs.map(({ id, label, icon: TIcon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 flex-1 px-4 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer justify-center whitespace-nowrap"
            style={{
              background: tab === id ? 'var(--eco-bg)' : 'transparent',
              color: tab === id ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <TIcon size={13} /> {label}
            <span
              className="text-[9px] px-1.5 py-0.5 rounded-full"
              style={{
                background: tab === id ? 'var(--eco-primary)' : 'var(--eco-neutral-100)',
                color: tab === id ? 'var(--eco-text-on-primary)' : 'var(--eco-text-tertiary)',
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'funnels' && <FunnelSection />}
      {tab === 'events' && <EventsSection />}
      {tab === 'abuse' && <AbuseSection />}
      {tab === 'admin' && <AdminSection />}
      {tab === 'impl' && <ImplSection />}

      {/* Footer */}
      <div
        className="mt-8 rounded-xl px-5 py-3 flex items-start gap-2"
        style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
      >
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--eco-primary)' }} />
        <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
          Event names follow{' '}
          <code
            className="text-[10px] px-1 rounded"
            style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
          >
            module.action_detail
          </code>{' '}
          convention. All events auto-attach:{' '}
          <code
            className="text-[10px] px-1 rounded"
            style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
          >
            session_id, user_id_hash, locale, timestamp, device_type, page_url, schema_version
          </code>
          . PII is never included in analytics — use hashed identifiers only. This plan
          cross-references Page 23 (Data Contracts), Page 24 (Copy Library), and Page 26 (Build
          Checklist).
        </span>
      </div>
    </div>
  );
}
