import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { Badge, Pill, Card, Button, RoomStatusBadge, MemberStatusBadge } from '../ds-primitives';
import {
  ArrowRight,
  Clock,
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Ban,
  Timer,
  FileWarning,
  TicketCheck,
  RefreshCw,
  Eye,
  ChevronRight,
  Info,
  AlertCircle,
  Shield,
  Zap,
  Pause,
  MessageSquareWarning,
} from 'lucide-react';

// ─── Shared helpers ───
function SectionCard({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
    >
      {children}
    </div>
  );
}

function Arrow() {
  return (
    <div className="flex items-center justify-center py-1">
      <ArrowRight size={16} style={{ color: 'var(--eco-text-tertiary)' }} />
    </div>
  );
}

function StateNode({
  label,
  variant,
  active,
  size = 'md',
}: {
  label: string;
  variant: 'info' | 'warning' | 'success' | 'danger' | 'default';
  active?: boolean;
  size?: 'sm' | 'md';
}) {
  const colors: Record<string, { bg: string; border: string; text: string }> = {
    info: {
      bg: 'var(--eco-brand-50)',
      border: 'var(--eco-brand-400)',
      text: 'var(--eco-brand-600)',
    },
    warning: {
      bg: 'var(--eco-warning-100)',
      border: 'var(--eco-warning-500)',
      text: 'var(--eco-warning-500)',
    },
    success: {
      bg: 'var(--eco-success-100)',
      border: 'var(--eco-success-500)',
      text: 'var(--eco-success-500)',
    },
    danger: {
      bg: 'var(--eco-danger-100)',
      border: 'var(--eco-danger-500)',
      text: 'var(--eco-danger-500)',
    },
    default: {
      bg: 'var(--eco-neutral-100)',
      border: 'var(--eco-neutral-300)',
      text: 'var(--eco-text-secondary)',
    },
  };
  const c = colors[variant];
  const pad = size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2 text-[13px]';
  return (
    <div
      className={`rounded-lg ${pad} text-center font-medium whitespace-nowrap`}
      style={{
        background: c.bg,
        border: `2px solid ${active ? c.border : 'transparent'}`,
        color: c.text,
        boxShadow: active ? `0 0 0 3px ${c.bg}` : undefined,
      }}
    >
      {label}
    </div>
  );
}

// ─── A) Room State Map ───
function RoomStateMap() {
  const { t } = useI18n();
  const [selected, setSelected] = useState('OPEN');

  const states = [
    {
      id: 'OPEN',
      label: t('stateOpen'),
      variant: 'info' as const,
      icon: Eye,
      desc: t('roomOpenDesc'),
      actions: [t('edit'), t('shareRoom'), t('inviteLink'), t('cancel')],
      cta: t('shareRoom'),
      transitions: ['IN_VERIFICATION', 'CANCELLED'],
    },
    {
      id: 'IN_VERIFICATION',
      label: t('stateInVerification'),
      variant: 'warning' as const,
      icon: Timer,
      desc: t('roomVerifDesc'),
      actions: [t('grantAccess'), t('sendReminder'), t('cancel')],
      cta: t('grantAccess'),
      transitions: ['ACTIVE', 'CANCELLED', 'BLOCKED'],
    },
    {
      id: 'ACTIVE',
      label: t('stateActive'),
      variant: 'success' as const,
      icon: CheckCircle2,
      desc: t('roomActiveDesc'),
      actions: [t('sendReminder'), t('remove'), t('leaveRoom')],
      cta: t('sendReminder'),
      transitions: ['COMPLETED', 'BLOCKED'],
    },
    {
      id: 'COMPLETED',
      label: t('stateCompleted'),
      variant: 'default' as const,
      icon: CheckCircle2,
      desc: t('roomCompletedDesc'),
      actions: [t('leaveReview'), t('viewDetails')],
      cta: t('leaveReview'),
      transitions: [],
    },
    {
      id: 'CANCELLED',
      label: t('stateCancelled'),
      variant: 'danger' as const,
      icon: XCircle,
      desc: t('roomCancelledDesc'),
      actions: [t('viewDetails')],
      cta: '—',
      transitions: [],
    },
    {
      id: 'BLOCKED',
      label: t('stateBlocked'),
      variant: 'danger' as const,
      icon: Ban,
      desc: t('roomBlockedDesc'),
      actions: [t('contactSupport'), t('viewTicket')],
      cta: t('contactSupport'),
      transitions: [],
    },
  ];

  const current = states.find((s) => s.id === selected)!;
  const Icon = current.icon;

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: 'var(--eco-text)' }}>
        A) {t('roomStates')}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        OPEN → IN_VERIFICATION → ACTIVE → COMPLETED (+ CANCELLED, BLOCKED)
      </p>

      {/* Flow diagram */}
      <SectionCard className="mb-6">
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          STATE FLOW — {t('roomStates').toUpperCase()}
        </div>
        {/* Desktop flow */}
        <div className="hidden md:flex items-center gap-2 flex-wrap mb-4">
          {['OPEN', 'IN_VERIFICATION', 'ACTIVE', 'COMPLETED'].map((id, i) => {
            const s = states.find((x) => x.id === id)!;
            return (
              <div key={id} className="flex items-center gap-2">
                <button className="cursor-pointer" onClick={() => setSelected(id)}>
                  <StateNode label={s.label} variant={s.variant} active={selected === id} />
                </button>
                {i < 3 && <Arrow />}
              </div>
            );
          })}
        </div>
        {/* Exception states */}
        <div className="hidden md:flex items-center gap-3 ml-8 mt-2">
          <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            +
          </span>
          {['CANCELLED', 'BLOCKED'].map((id) => {
            const s = states.find((x) => x.id === id)!;
            return (
              <button key={id} className="cursor-pointer" onClick={() => setSelected(id)}>
                <StateNode label={s.label} variant={s.variant} active={selected === id} size="sm" />
              </button>
            );
          })}
        </div>
        {/* Mobile: vertical */}
        <div className="md:hidden flex flex-wrap gap-2">
          {states.map((s) => (
            <button key={s.id} className="cursor-pointer" onClick={() => setSelected(s.id)}>
              <StateNode label={s.label} variant={s.variant} active={selected === s.id} size="sm" />
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Detail panel */}
      <SectionCard>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{
              background:
                current.variant === 'info'
                  ? 'var(--eco-brand-50)'
                  : current.variant === 'warning'
                    ? 'var(--eco-warning-100)'
                    : current.variant === 'success'
                      ? 'var(--eco-success-100)'
                      : current.variant === 'danger'
                        ? 'var(--eco-danger-100)'
                        : 'var(--eco-neutral-100)',
            }}
          >
            <Icon
              size={20}
              style={{
                color:
                  current.variant === 'info'
                    ? 'var(--eco-brand-600)'
                    : current.variant === 'warning'
                      ? 'var(--eco-warning-500)'
                      : current.variant === 'success'
                        ? 'var(--eco-success-500)'
                        : current.variant === 'danger'
                          ? 'var(--eco-danger-500)'
                          : 'var(--eco-text-secondary)',
              }}
            />
          </div>
          <div>
            <div className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
              {current.label}
            </div>
            <code className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {current.id}
            </code>
          </div>
          <div className="ml-auto">
            <RoomStatusBadge status={current.id} />
          </div>
        </div>

        <p className="text-[14px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
          {current.desc}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Allowed Actions */}
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('allowedActions').toUpperCase()}
            </div>
            <div className="flex flex-col gap-1.5">
              {current.actions.map((a, i) => (
                <div
                  key={`${current.id}-action-${i}`}
                  className="flex items-center gap-2 text-[13px]"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  <ChevronRight size={12} style={{ color: 'var(--eco-text-tertiary)' }} />
                  {a}
                </div>
              ))}
            </div>
          </div>

          {/* Primary CTA */}
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('primaryCta').toUpperCase()}
            </div>
            <Button
              variant={current.variant === 'danger' ? 'destructive' : 'primary'}
              size="sm"
              className="mt-1"
              disabled
            >
              {current.cta}
            </Button>
          </div>

          {/* Transitions */}
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('transitionsTo').toUpperCase()}
            </div>
            {current.transitions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {current.transitions.map((tid) => {
                  const ts = states.find((x) => x.id === tid)!;
                  return <StateNode key={tid} label={ts.label} variant={ts.variant} size="sm" />;
                })}
              </div>
            ) : (
              <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                — ({t('stateCompleted').toLowerCase()})
              </span>
            )}
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── B) Member State Map ───
function MemberStateMap() {
  const { t } = useI18n();
  const [selected, setSelected] = useState('APPLIED');

  const states = [
    {
      id: 'APPLIED',
      label: t('stateApplied'),
      variant: 'info' as const,
      desc: t('memberAppliedDesc'),
      actions: [t('cancel')],
      cta: t('cancel'),
      transitions: ['PENDING', 'REJECTED'],
    },
    {
      id: 'PENDING',
      label: t('statePending'),
      variant: 'warning' as const,
      desc: t('memberPendingDesc'),
      actions: [t('payNow'), t('cancel')],
      cta: t('payNow'),
      transitions: ['ACTIVE', 'CANCELLED_BEFORE_PAYMENT'],
    },
    {
      id: 'ACTIVE',
      label: t('stateActive'),
      variant: 'success' as const,
      desc: t('memberActiveDesc'),
      actions: [t('confirmAccessReceived'), t('leaveRoom')],
      cta: t('confirmAccessReceived'),
      transitions: ['BLOCKED'],
    },
    {
      id: 'REJECTED',
      label: t('stateRejected'),
      variant: 'danger' as const,
      desc: t('memberRejectedDesc'),
      actions: [],
      cta: '—',
      transitions: [],
    },
    {
      id: 'BLOCKED',
      label: t('stateBlocked'),
      variant: 'danger' as const,
      desc: t('memberBlockedDesc'),
      actions: [t('contactSupport')],
      cta: t('contactSupport'),
      transitions: [],
    },
    {
      id: 'CANCELLED_BEFORE_PAYMENT',
      label: t('stateCancelledBeforePayment'),
      variant: 'default' as const,
      desc: t('memberCancelledPayDesc'),
      actions: [],
      cta: '—',
      transitions: [],
    },
  ];

  const current = states.find((s) => s.id === selected)!;

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: 'var(--eco-text)' }}>
        B) {t('memberStates')}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        APPLIED → PENDING → ACTIVE (+ REJECTED, BLOCKED, CANCELLED_BEFORE_PAYMENT)
      </p>

      {/* Flow */}
      <SectionCard className="mb-6">
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          STATE FLOW — {t('memberStates').toUpperCase()}
        </div>
        <div className="hidden md:flex items-center gap-2 flex-wrap mb-4">
          {['APPLIED', 'PENDING', 'ACTIVE'].map((id, i) => {
            const s = states.find((x) => x.id === id)!;
            return (
              <div key={id} className="flex items-center gap-2">
                <button className="cursor-pointer" onClick={() => setSelected(id)}>
                  <StateNode label={s.label} variant={s.variant} active={selected === id} />
                </button>
                {i < 2 && <Arrow />}
              </div>
            );
          })}
        </div>
        <div className="hidden md:flex items-center gap-3 ml-8 mt-2">
          <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            +
          </span>
          {['REJECTED', 'BLOCKED', 'CANCELLED_BEFORE_PAYMENT'].map((id) => {
            const s = states.find((x) => x.id === id)!;
            return (
              <button key={id} className="cursor-pointer" onClick={() => setSelected(id)}>
                <StateNode label={s.label} variant={s.variant} active={selected === id} size="sm" />
              </button>
            );
          })}
        </div>
        <div className="md:hidden flex flex-wrap gap-2">
          {states.map((s) => (
            <button key={s.id} className="cursor-pointer" onClick={() => setSelected(s.id)}>
              <StateNode label={s.label} variant={s.variant} active={selected === s.id} size="sm" />
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Detail */}
      <SectionCard className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
            {current.label}
          </div>
          <code className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {current.id}
          </code>
          <div className="ml-auto">
            <MemberStatusBadge status={current.id} />
          </div>
        </div>
        <p className="text-[14px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
          {current.desc}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('allowedActions').toUpperCase()}
            </div>
            {current.actions.length > 0 ? (
              current.actions.map((a, i) => (
                <div
                  key={`${current.id}-ma-${i}`}
                  className="flex items-center gap-2 text-[13px] mb-1"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  <ChevronRight size={12} style={{ color: 'var(--eco-text-tertiary)' }} /> {a}
                </div>
              ))
            ) : (
              <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                —
              </span>
            )}
          </div>
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('primaryCta').toUpperCase()}
            </div>
            <Button variant="primary" size="sm" disabled>
              {current.cta}
            </Button>
          </div>
          <div
            className="rounded-lg p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('transitionsTo').toUpperCase()}
            </div>
            {current.transitions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {current.transitions.map((tid) => {
                  const ts = states.find((x) => x.id === tid)!;
                  return <StateNode key={tid} label={ts.label} variant={ts.variant} size="sm" />;
                })}
              </div>
            ) : (
              <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                — (terminal)
              </span>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Rules */}
      <SectionCard>
        <div className="text-[12px] mb-3" style={{ color: 'var(--eco-text-tertiary)' }}>
          BUSINESS RULES
        </div>
        <div className="flex flex-col gap-3">
          {[
            { icon: Info, text: t('slotsRule'), variant: 'info' as const },
            { icon: Clock, text: t('joinClosedAfterStart'), variant: 'warning' as const },
            { icon: Shield, text: t('postPaymentAdminOnly'), variant: 'danger' as const },
          ].map((rule, i) => (
            <div
              key={`rule-${i}`}
              className="flex items-start gap-3 rounded-lg p-3"
              style={{
                background:
                  rule.variant === 'info'
                    ? 'var(--eco-brand-50)'
                    : rule.variant === 'warning'
                      ? 'var(--eco-warning-100)'
                      : 'var(--eco-danger-100)',
              }}
            >
              <rule.icon
                size={16}
                className="shrink-0 mt-0.5"
                style={{
                  color:
                    rule.variant === 'info'
                      ? 'var(--eco-brand-600)'
                      : rule.variant === 'warning'
                        ? 'var(--eco-warning-500)'
                        : 'var(--eco-danger-500)',
                }}
              />
              <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                {rule.text}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}

// ─── C) SLA Panels ───
function SlaPanels() {
  const { t } = useI18n();

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: 'var(--eco-text)' }}>
        C) {t('slaPanels')}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('slaWaitingAccess')} · {t('slaMemberConfirmDeadline')} · {t('slaAutoTicketCreated')}
      </p>

      {/* SLA Timer — 3 variants */}
      <SectionCard className="mb-6">
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          SLA TIMER — {t('slaWaitingAccess').toUpperCase()}
        </div>
        <p className="text-[13px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('slaOwnerMustGrant')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Normal */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '2px solid var(--eco-success-500)' }}
          >
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{ background: 'var(--eco-success-100)' }}
            >
              <Clock size={14} style={{ color: 'var(--eco-success-500)' }} />
              <span className="text-[12px] font-medium" style={{ color: 'var(--eco-success-500)' }}>
                {t('slaNormal').toUpperCase()}
              </span>
            </div>
            <div className="p-4" style={{ background: 'var(--eco-bg)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('slaTimeRemaining')}
              </div>
              <div className="text-[28px] mb-3" style={{ color: 'var(--eco-success-500)' }}>
                18:42:15
              </div>
              <div
                className="h-2 rounded-full mb-3"
                style={{ background: 'var(--eco-neutral-200)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{ width: '78%', background: 'var(--eco-success-500)' }}
                />
              </div>
              <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('slaOwnerMustGrant')}
              </div>
              <Button variant="primary" size="sm" className="w-full mt-3" disabled>
                {t('grantAccess')}
              </Button>
            </div>
          </div>

          {/* Warning */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '2px solid var(--eco-warning-500)' }}
          >
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{ background: 'var(--eco-warning-100)' }}
            >
              <AlertTriangle size={14} style={{ color: 'var(--eco-warning-500)' }} />
              <span className="text-[12px] font-medium" style={{ color: 'var(--eco-warning-500)' }}>
                {t('slaWarning').toUpperCase()}
              </span>
            </div>
            <div className="p-4" style={{ background: 'var(--eco-bg)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('slaTimeRemaining')}
              </div>
              <div className="text-[28px] mb-3" style={{ color: 'var(--eco-warning-500)' }}>
                02:15:33
              </div>
              <div
                className="h-2 rounded-full mb-3"
                style={{ background: 'var(--eco-neutral-200)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{ width: '15%', background: 'var(--eco-warning-500)' }}
                />
              </div>
              <div
                className="flex items-start gap-2 rounded-lg p-2 mb-3"
                style={{ background: 'var(--eco-warning-100)' }}
              >
                <AlertTriangle
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--eco-warning-500)' }}
                />
                <span className="text-[12px]" style={{ color: 'var(--eco-warning-500)' }}>
                  {t('slaOwnerMustGrant')}
                </span>
              </div>
              <Button variant="primary" size="sm" className="w-full" disabled>
                {t('grantAccess')}
              </Button>
            </div>
          </div>

          {/* Breached */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '2px solid var(--eco-danger-500)' }}
          >
            <div
              className="px-4 py-2 flex items-center gap-2"
              style={{ background: 'var(--eco-danger-100)' }}
            >
              <XCircle size={14} style={{ color: 'var(--eco-danger-500)' }} />
              <span className="text-[12px] font-medium" style={{ color: 'var(--eco-danger-500)' }}>
                {t('slaBreached').toUpperCase()}
              </span>
            </div>
            <div className="p-4" style={{ background: 'var(--eco-bg)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('slaTimeRemaining')}
              </div>
              <div className="text-[28px] mb-3" style={{ color: 'var(--eco-danger-500)' }}>
                00:00:00
              </div>
              <div
                className="h-2 rounded-full mb-3"
                style={{ background: 'var(--eco-danger-100)' }}
              >
                <div
                  className="h-2 rounded-full"
                  style={{ width: '100%', background: 'var(--eco-danger-500)' }}
                />
              </div>
              <div
                className="flex items-start gap-2 rounded-lg p-2 mb-3"
                style={{ background: 'var(--eco-danger-100)' }}
              >
                <ShieldAlert
                  size={14}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--eco-danger-500)' }}
                />
                <span className="text-[12px]" style={{ color: 'var(--eco-danger-500)' }}>
                  {t('slaAutoTicketDesc')}
                </span>
              </div>
              <Button variant="secondary" size="sm" className="w-full" disabled>
                {t('viewTicket')}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* T_confirm — Member confirmation deadline */}
      <SectionCard className="mb-6">
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          T_CONFIRM — {t('slaMemberConfirmDeadline').toUpperCase()}
        </div>
        <p className="text-[13px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('slaMemberMustConfirm')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Member sees */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[11px] mb-3" style={{ color: 'var(--eco-text-tertiary)' }}>
              MEMBER VIEW
            </div>
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--eco-brand-50)' }}
              >
                <CheckCircle2 size={16} style={{ color: 'var(--eco-brand-600)' }} />
              </div>
              <div>
                <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                  {t('accessGranted')}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  Beeline Family 30GB
                </div>
              </div>
            </div>
            <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--eco-warning-100)' }}>
              <div className="flex items-center gap-2 mb-1">
                <Timer size={14} style={{ color: 'var(--eco-warning-500)' }} />
                <span
                  className="text-[13px] font-medium"
                  style={{ color: 'var(--eco-warning-500)' }}
                >
                  {t('slaConfirmAccess')}
                </span>
              </div>
              <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('slaTimeRemaining')}: 23:15:00
              </div>
            </div>
            <Button variant="primary" size="sm" className="w-full" disabled>
              {t('confirmAccessReceived')}
            </Button>
          </div>

          {/* Breached state */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--eco-bg)', border: '2px solid var(--eco-danger-500)' }}
          >
            <div className="text-[11px] mb-3" style={{ color: 'var(--eco-danger-500)' }}>
              T_CONFIRM BREACHED
            </div>
            <div
              className="flex items-start gap-3 mb-3 rounded-lg p-3"
              style={{ background: 'var(--eco-danger-100)' }}
            >
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--eco-danger-500)' }}
              />
              <div>
                <div
                  className="text-[13px] font-medium mb-1"
                  style={{ color: 'var(--eco-danger-500)' }}
                >
                  {t('slaAutoDisputeCreated')}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {t('edgeMemberNoConfirmDesc')}
                </div>
              </div>
            </div>
            <div
              className="text-[11px] px-2 py-1 rounded inline-block mb-3"
              style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-text-tertiary)' }}
            >
              {t('idempotentNote')}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                {t('viewTicket')}
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                {t('contactSupport')}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Auto-ticket banner */}
      <SectionCard>
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          AUTO-TICKET / DISPUTE BANNERS
        </div>
        <div className="flex flex-col gap-4">
          {/* Auto ticket */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--eco-warning-500)' }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'var(--eco-warning-100)' }}
            >
              <TicketCheck size={18} style={{ color: 'var(--eco-warning-500)' }} />
              <div className="flex-1">
                <div
                  className="text-[14px] font-medium"
                  style={{ color: 'var(--eco-warning-500)' }}
                >
                  {t('slaAutoTicketCreated')}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {t('slaAutoTicketDesc')}
                </div>
              </div>
              <Button variant="secondary" size="sm" disabled>
                {t('viewTicket')}
              </Button>
            </div>
          </div>

          {/* Auto dispute */}
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--eco-danger-500)' }}
          >
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ background: 'var(--eco-danger-100)' }}
            >
              <MessageSquareWarning size={18} style={{ color: 'var(--eco-danger-500)' }} />
              <div className="flex-1">
                <div className="text-[14px] font-medium" style={{ color: 'var(--eco-danger-500)' }}>
                  {t('slaAutoDisputeCreated')}
                </div>
                <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {t('edgeMemberNoConfirmDesc')}
                </div>
              </div>
              <Button variant="destructive" size="sm" disabled>
                {t('viewDetails')}
              </Button>
            </div>
          </div>

          {/* Idempotent note */}
          <div
            className="flex items-center gap-2 rounded-lg p-3"
            style={{ background: 'var(--eco-brand-50)' }}
          >
            <Info size={14} style={{ color: 'var(--eco-brand-600)' }} />
            <span className="text-[12px]" style={{ color: 'var(--eco-brand-600)' }}>
              {t('idempotentNote')}
            </span>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── D) Edge Cases ───
function EdgeCases() {
  const { t } = useI18n();

  const cases = [
    {
      id: 'payment-no-access',
      title: t('edgePaymentNoAccess'),
      desc: t('edgePaymentNoAccessDesc'),
      icon: Zap,
      color: 'warning' as const,
      flags: [t('autoSupportTicket'), t('adminReviewFlag')],
      nextSteps: [t('waitForResolution'), t('viewTicket')],
    },
    {
      id: 'no-confirm',
      title: t('edgeMemberNoConfirm'),
      desc: t('edgeMemberNoConfirmDesc'),
      icon: Timer,
      color: 'warning' as const,
      flags: [t('slaAutoDisputeCreated'), t('adminReviewFlag')],
      nextSteps: [t('waitForResolution'), t('contactSupport')],
    },
    {
      id: 'blocked-mid-verif',
      title: t('edgeRoomBlockedMidVerif'),
      desc: t('edgeRoomBlockedMidVerifDesc'),
      icon: Ban,
      color: 'danger' as const,
      flags: [t('paymentsFrozen'), t('allActionsSuspended')],
      nextSteps: [t('waitForResolution'), t('contactSupport')],
    },
    {
      id: 'refund-initiated',
      title: t('edgeRefundInitiated'),
      desc: t('edgeRefundInitiatedDesc'),
      icon: RefreshCw,
      color: 'info' as const,
      flags: [t('refundTimeline')],
      nextSteps: [t('viewTicket')],
    },
    {
      id: 'risk-flags',
      title: t('edgeRiskFlags'),
      desc: t('edgeRiskFlagsDesc'),
      icon: ShieldAlert,
      color: 'danger' as const,
      flags: [t('requiresAdminReview'), t('moderationExplanation')],
      nextSteps: [t('waitForResolution'), t('contactSupport')],
    },
  ];

  const colorMap = {
    warning: {
      bg: 'var(--eco-warning-100)',
      border: 'var(--eco-warning-500)',
      text: 'var(--eco-warning-500)',
      iconBg: 'var(--eco-warning-100)',
    },
    danger: {
      bg: 'var(--eco-danger-100)',
      border: 'var(--eco-danger-500)',
      text: 'var(--eco-danger-500)',
      iconBg: 'var(--eco-danger-100)',
    },
    info: {
      bg: 'var(--eco-brand-50)',
      border: 'var(--eco-brand-400)',
      text: 'var(--eco-brand-600)',
      iconBg: 'var(--eco-brand-50)',
    },
  };

  return (
    <div>
      <h2 className="text-[20px] mb-1" style={{ color: 'var(--eco-text)' }}>
        D) {t('edgeCases')}
      </h2>
      <p className="text-[14px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('statesSlaSubtitle')}
      </p>

      <div className="flex flex-col gap-5">
        {cases.map((c) => {
          const cm = colorMap[c.color];
          return (
            <SectionCard key={c.id}>
              <div className="flex items-start gap-4 mb-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: cm.iconBg }}
                >
                  <c.icon size={20} style={{ color: cm.text }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
                      {c.title}
                    </span>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{ background: cm.bg, color: cm.text }}
                    >
                      EDGE CASE
                    </span>
                  </div>
                  <p className="text-[14px]" style={{ color: 'var(--eco-text-secondary)' }}>
                    {c.desc}
                  </p>
                </div>
              </div>

              {/* UI Preview */}
              <div
                className="rounded-xl p-4 mb-4"
                style={{ background: cm.bg, border: `1px solid ${cm.border}` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <c.icon size={16} style={{ color: cm.text }} />
                  <span className="text-[14px] font-medium" style={{ color: cm.text }}>
                    {c.title}
                  </span>
                </div>
                <p className="text-[13px] mb-3" style={{ color: 'var(--eco-text-secondary)' }}>
                  {c.desc}
                </p>

                {/* Flags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {c.flags.map((flag, fi) => (
                    <span
                      key={`${c.id}-flag-${fi}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px]"
                      style={{
                        background: 'var(--eco-bg)',
                        color: 'var(--eco-text-secondary)',
                        border: '1px solid var(--eco-border)',
                      }}
                    >
                      <AlertCircle size={12} style={{ color: cm.text }} />
                      {flag}
                    </span>
                  ))}
                </div>

                {/* Next steps */}
                <div className="rounded-lg p-3" style={{ background: 'var(--eco-bg)' }}>
                  <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {t('safeNextSteps').toUpperCase()}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {c.nextSteps.map((step, si) => (
                      <Button key={`${c.id}-step-${si}`} variant="secondary" size="sm" disabled>
                        {step}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          );
        })}
      </div>

      {/* Refund timeline special */}
      <SectionCard className="mt-6">
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('refundTimeline').toUpperCase()} — STATUS CHIPS
        </div>
        <div className="flex flex-wrap gap-3">
          {[
            { label: t('refundRequested'), variant: 'warning' as const },
            { label: t('refundApproved'), variant: 'info' as const },
            { label: t('refundProcessing'), variant: 'info' as const },
            { label: t('refundCompleted'), variant: 'success' as const },
          ].map((chip) => (
            <Pill key={chip.label} variant={chip.variant}>
              {chip.label}
            </Pill>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-4">
          {[
            t('refundRequested'),
            t('refundApproved'),
            t('refundProcessing'),
            t('refundCompleted'),
          ].map((label, i, arr) => (
            <div key={`tl-${i}`} className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    background: i <= 1 ? 'var(--eco-primary)' : 'var(--eco-neutral-300)',
                  }}
                />
                {i < arr.length - 1 && (
                  <div className="hidden" /> // spacer
                )}
              </div>
              <span
                className="text-[11px] whitespace-nowrap"
                style={{ color: i <= 1 ? 'var(--eco-text)' : 'var(--eco-text-tertiary)' }}
              >
                {label}
              </span>
              {i < arr.length - 1 && (
                <div
                  className="w-8 h-px"
                  style={{ background: i < 1 ? 'var(--eco-primary)' : 'var(--eco-neutral-300)' }}
                />
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Requires Admin Review state mock */}
      <SectionCard className="mt-6">
        <div className="text-[12px] mb-4" style={{ color: 'var(--eco-text-tertiary)' }}>
          "{t('requiresAdminReview').toUpperCase()}" — ROOM CARD STATE
        </div>
        <div
          className="max-w-md rounded-xl overflow-hidden"
          style={{ border: '2px solid var(--eco-danger-500)' }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2"
            style={{ background: 'var(--eco-danger-100)' }}
          >
            <ShieldAlert size={14} style={{ color: 'var(--eco-danger-500)' }} />
            <span className="text-[12px] font-medium" style={{ color: 'var(--eco-danger-500)' }}>
              {t('requiresAdminReview')}
            </span>
          </div>
          <div className="p-4" style={{ background: 'var(--eco-bg)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                Beeline Family 30GB
              </span>
              <Badge variant="danger">BLOCKED</Badge>
            </div>
            <p className="text-[13px] mb-3" style={{ color: 'var(--eco-text-secondary)' }}>
              {t('edgeRiskFlagsDesc')}
            </p>
            <div className="rounded-lg p-3 mb-3" style={{ background: 'var(--eco-neutral-100)' }}>
              <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('moderationExplanation')}
              </div>
              <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('investigationOngoing')}. {t('allActionsSuspended')}.
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                {t('contactSupport')}
              </Button>
              <Button variant="secondary" size="sm" className="flex-1" disabled>
                {t('viewTicket')}
              </Button>
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}

// ─── Main Page ───
export function StatesSlaEdgeCasesPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'rooms' | 'members' | 'sla' | 'edge'>('rooms');

  const tabs = [
    { id: 'rooms' as const, label: `A) ${t('roomStates')}` },
    { id: 'members' as const, label: `B) ${t('memberStates')}` },
    { id: 'sla' as const, label: `C) ${t('slaPanels')}` },
    { id: 'edge' as const, label: `D) ${t('edgeCases')}` },
  ];

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
          >
            Page 09
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)' }}
          >
            Critical
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('statesSlaTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('statesSlaSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--eco-surface)' }}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: tab === id ? 'var(--eco-bg)' : 'transparent',
              color: tab === id ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'rooms' && <RoomStateMap />}
      {tab === 'members' && <MemberStateMap />}
      {tab === 'sla' && <SlaPanels />}
      {tab === 'edge' && <EdgeCases />}
    </div>
  );
}
