import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { Badge, Pill, Button, Card } from '../ds-primitives';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCircle2,
  ChevronRight,
  Clock,
  ClipboardList,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  Filter,
  Flag,
  Image,
  Info,
  Loader2,
  Lock,
  MessageSquare,
  Paperclip,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Unlock,
  Upload,
  User,
  UserCog,
  XCircle,
  Zap,
  ChevronDown,
  ExternalLink,
  Scale,
  TicketCheck,
  ArrowDown,
  CircleDot,
  FileUp,
} from 'lucide-react';

/* ─── Shared ─── */
function SC({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-xl p-6 ${className}`}
      style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
    >
      {children}
    </div>
  );
}
function SL({ children }: { children: string }) {
  return (
    <div className="text-[11px] mb-3 tracking-wide" style={{ color: 'var(--eco-text-tertiary)' }}>
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   A) USER FLOWS
   ═══════════════════════════════════════════════════ */

/* ─── A1: Create Dispute ─── */
function CreateDisputeForm() {
  const { t } = useI18n();
  const [topic, setTopic] = useState('');
  const [room, setRoom] = useState('');
  const [desc, setDesc] = useState('');
  const [files, setFiles] = useState<string[]>([]);

  const topics = [
    { value: 'not_connected', label: t('topicNotConnected') },
    { value: 'wrong_tariff', label: t('topicWrongTariff') },
    { value: 'early_disconnect', label: t('topicEarlyDisconnect') },
    { value: 'other', label: t('topicOther') },
  ];

  const rooms = [
    { value: 'rm-0412', label: 'Beeline Family 30GB — RM-0412' },
    { value: 'rm-0399', label: 'Activ Start 15GB — RM-0399' },
    { value: 'rm-0377', label: 'Kcell Unlimited — RM-0377' },
  ];

  const mockAddFile = () => {
    if (files.length < 3) {
      const names = ['screenshot_01.png', 'receipt_march.pdf', 'chat_proof.jpg'];
      setFiles([...files, names[files.length]]);
    }
  };

  return (
    <div>
      <h3 className="text-[18px] mb-1" style={{ color: 'var(--eco-text)' }}>
        A1) {t('createDispute')}
      </h3>
      <p className="text-[13px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('entryPointPending')} · {t('entryPointRefund')}
      </p>

      {/* Entry point cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {[
          {
            icon: Timer,
            label: t('entryPointPending'),
            color: 'var(--eco-warning-500)',
            bg: 'var(--eco-warning-100)',
          },
          {
            icon: Zap,
            label: t('entryPointRefund'),
            color: 'var(--eco-brand-600)',
            bg: 'var(--eco-brand-50)',
          },
        ].map((ep, i) => (
          <div
            key={`ep-${i}`}
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: ep.bg, border: `1px dashed ${ep.color}` }}
          >
            <ep.icon size={18} style={{ color: ep.color }} />
            <div>
              <div className="text-[12px]" style={{ color: ep.color }}>
                {ep.label}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                → {t('createDispute')}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Form */}
      <SC>
        <SL>DISPUTE FORM</SL>
        <div className="max-w-lg flex flex-col gap-5">
          {/* Topic */}
          <div>
            <label className="text-[13px] mb-1.5 block" style={{ color: 'var(--eco-text)' }}>
              {t('disputeTopic')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
            </label>
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none appearance-none"
              style={{
                background: 'var(--eco-bg)',
                border: `1px solid ${topic ? 'var(--eco-border-strong)' : 'var(--eco-border)'}`,
                color: topic ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              }}
            >
              <option value="">{t('selectReason')}</option>
              {topics.map((tp) => (
                <option key={tp.value} value={tp.value}>
                  {tp.label}
                </option>
              ))}
            </select>
          </div>

          {/* Room selector */}
          <div>
            <label className="text-[13px] mb-1.5 block" style={{ color: 'var(--eco-text)' }}>
              {t('selectRoom')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
            </label>
            <select
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none appearance-none"
              style={{
                background: 'var(--eco-bg)',
                border: `1px solid ${room ? 'var(--eco-border-strong)' : 'var(--eco-border)'}`,
                color: room ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              }}
            >
              <option value="">{t('selectRoom')}</option>
              {rooms.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Evidence upload */}
          <div>
            <label className="text-[13px] mb-1.5 block" style={{ color: 'var(--eco-text)' }}>
              {t('evidenceUpload')}
            </label>
            <div
              className="rounded-lg p-5 text-center cursor-pointer transition-colors"
              style={{ background: 'var(--eco-bg)', border: '2px dashed var(--eco-border)' }}
              onClick={mockAddFile}
            >
              <Upload
                size={24}
                className="mx-auto mb-2"
                style={{ color: 'var(--eco-text-tertiary)' }}
              />
              <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('dragOrClick')}
              </div>
              <div className="text-[11px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('evidenceRules')}
              </div>
            </div>
            {files.length > 0 && (
              <div className="flex flex-col gap-2 mt-3">
                {files.map((f, i) => (
                  <div
                    key={`file-${i}`}
                    className="flex items-center gap-2 rounded-lg px-3 py-2"
                    style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
                  >
                    <Paperclip size={13} style={{ color: 'var(--eco-text-tertiary)' }} />
                    <span className="text-[13px] flex-1" style={{ color: 'var(--eco-text)' }}>
                      {f}
                    </span>
                    <button
                      onClick={() => setFiles(files.filter((_, j) => j !== i))}
                      className="cursor-pointer"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                ))}
                <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {files.length}/3 {t('filesAttached')}
                </div>
              </div>
            )}
          </div>

          {/* Short description */}
          <div>
            <label className="text-[13px] mb-1.5 block" style={{ color: 'var(--eco-text)' }}>
              {t('shortDescription')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value.slice(0, 300))}
              placeholder={t('shortDescriptionHint')}
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none resize-none"
              style={{
                background: 'var(--eco-bg)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
              }}
            />
            <div
              className="text-[11px] text-right mt-0.5"
              style={{
                color: desc.length > 250 ? 'var(--eco-warning-500)' : 'var(--eco-text-tertiary)',
              }}
            >
              {desc.length}/300
            </div>
          </div>

          <Button
            variant="primary"
            size="lg"
            className="w-full"
            disabled={!topic || !room || desc.length < 10}
          >
            <Scale size={16} />
            {t('submitDispute')}
          </Button>
        </div>
      </SC>
    </div>
  );
}

/* ─── A2: Dispute Detail (User View) ─── */
function DisputeDetailUser() {
  const { t } = useI18n();

  const timeline = [
    { id: 's-open', status: t('disputeOpen'), date: '2026-03-28 14:00', active: true, done: true },
    {
      id: 's-review',
      status: t('disputeInReview'),
      date: '2026-03-29 09:15',
      active: true,
      done: true,
    },
    {
      id: 's-decision',
      status: t('disputeDecision'),
      date: '2026-04-01 11:30',
      active: true,
      done: false,
    },
    { id: 's-refund', status: t('disputeRefundSent'), date: '—', active: false, done: false },
  ];

  const messages = [
    {
      id: 'msg-1',
      from: 'User_a7k2m',
      role: 'member',
      time: '2026-03-28 14:02',
      text: 'Оплатил 3 дня назад, но доступ так и не получил. Прикладываю скриншот оплаты.',
    },
    {
      id: 'msg-2',
      from: 'Support Agent',
      role: 'support',
      time: '2026-03-29 09:20',
      text: 'Здравствуйте! Мы приняли ваш спор в работу. Запросили информацию у владельца комнаты.',
    },
    {
      id: 'msg-3',
      from: 'Support Agent',
      role: 'support',
      time: '2026-04-01 11:30',
      text: 'По результатам проверки: владелец не предоставил доступ. Инициируем полный возврат.',
    },
  ];

  const evidence = [
    { id: 'ev-1', name: 'payment_receipt.pdf', size: '1.2 MB', type: 'PDF', date: '2026-03-28' },
    { id: 'ev-2', name: 'screenshot_app.png', size: '845 KB', type: 'PNG', date: '2026-03-28' },
  ];

  return (
    <div>
      <h3 className="text-[18px] mb-1" style={{ color: 'var(--eco-text)' }}>
        A2) {t('disputeDetail')}
      </h3>
      <p className="text-[13px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('disputeId')}: DSP-2026-0328-001
      </p>

      {/* Status timeline */}
      <SC className="mb-5">
        <SL>STATUS TIMELINE</SL>
        <div className="flex items-start gap-0 overflow-x-auto pb-2">
          {timeline.map((step, i) => (
            <div key={step.id} className="flex items-start min-w-0">
              <div className="flex flex-col items-center">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: step.done
                      ? 'var(--eco-success-100)'
                      : step.active
                        ? 'var(--eco-brand-50)'
                        : 'var(--eco-neutral-100)',
                    border: `2px solid ${step.done ? 'var(--eco-success-500)' : step.active ? 'var(--eco-primary)' : 'var(--eco-neutral-300)'}`,
                  }}
                >
                  {step.done ? (
                    <CheckCircle2 size={16} style={{ color: 'var(--eco-success-500)' }} />
                  ) : step.active ? (
                    <CircleDot size={16} style={{ color: 'var(--eco-primary)' }} />
                  ) : (
                    <Clock size={14} style={{ color: 'var(--eco-text-tertiary)' }} />
                  )}
                </div>
                <div className="text-center mt-2 px-1">
                  <div
                    className="text-[12px] whitespace-nowrap"
                    style={{
                      color:
                        step.done || step.active ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
                    }}
                  >
                    {step.status}
                  </div>
                  <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {step.date}
                  </div>
                </div>
              </div>
              {i < timeline.length - 1 && (
                <div
                  className="flex-1 min-w-8 h-px mt-4 mx-1"
                  style={{
                    background: step.done ? 'var(--eco-success-500)' : 'var(--eco-neutral-300)',
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </SC>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Messages */}
        <SC>
          <SL>{t('messagesLabel').toUpperCase()}</SL>
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4"
            style={{ background: 'var(--eco-brand-50)', border: '1px solid var(--eco-brand-200)' }}
          >
            <Shield size={13} style={{ color: 'var(--eco-brand-600)' }} />
            <span className="text-[11px]" style={{ color: 'var(--eco-brand-600)' }}>
              {t('onlySupportMessages')}
            </span>
          </div>
          <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'member' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="rounded-xl px-4 py-3 max-w-[85%]"
                  style={{
                    background: msg.role === 'member' ? 'var(--eco-primary)' : 'var(--eco-bg)',
                    color: msg.role === 'member' ? 'var(--eco-text-on-primary)' : 'var(--eco-text)',
                    border: msg.role === 'support' ? '1px solid var(--eco-border)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px]" style={{ opacity: 0.8 }}>
                      {msg.from}
                    </span>
                    <span className="text-[10px]" style={{ opacity: 0.6 }}>
                      {msg.time.split(' ')[1]}
                    </span>
                  </div>
                  <div className="text-[13px]">{msg.text}</div>
                </div>
              </div>
            ))}
          </div>
        </SC>

        {/* Evidence */}
        <SC>
          <SL>{t('evidenceUpload').toUpperCase()}</SL>
          <div className="flex flex-col gap-3 mb-4">
            {evidence.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center gap-3 rounded-lg px-4 py-3"
                style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: 'var(--eco-neutral-100)' }}
                >
                  {ev.type === 'PDF' ? (
                    <FileText size={18} style={{ color: 'var(--eco-danger-500)' }} />
                  ) : (
                    <Image size={18} style={{ color: 'var(--eco-brand-600)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
                    {ev.name}
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {ev.size} · {ev.date}
                  </div>
                </div>
                <Badge variant="default">{ev.type}</Badge>
              </div>
            ))}
          </div>

          {/* Add more evidence */}
          <button
            className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-3 cursor-pointer transition-colors"
            style={{
              background: 'var(--eco-bg)',
              border: '1px dashed var(--eco-border)',
              color: 'var(--eco-primary)',
            }}
          >
            <Plus size={14} />
            <span className="text-[13px]">{t('addMoreEvidence')}</span>
          </button>
          <div
            className="flex items-center gap-2 mt-2 rounded-lg px-3 py-1.5"
            style={{ background: 'var(--eco-warning-100)' }}
          >
            <Clock size={11} style={{ color: 'var(--eco-warning-500)' }} />
            <span className="text-[11px]" style={{ color: 'var(--eco-warning-500)' }}>
              {t('evidenceRateLimited')}
            </span>
          </div>
        </SC>
      </div>
    </div>
  );
}

function UserFlowsTab() {
  const { t } = useI18n();
  const [sub, setSub] = useState<'create' | 'detail'>('create');
  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['create', 'detail'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
            style={{
              background: sub === s ? 'var(--eco-primary)' : 'var(--eco-bg)',
              color: sub === s ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
              border: `1px solid ${sub === s ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
            }}
          >
            {s === 'create' ? `A1) ${t('createDispute')}` : `A2) ${t('disputeDetail')}`}
          </button>
        ))}
      </div>
      {sub === 'create' ? <CreateDisputeForm /> : <DisputeDetailUser />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   B) ADMIN WORKSPACE
   ═══════════════════════════════════════════════════ */

/* ─── B1: Triage List ─── */
function AdminTriageList() {
  const { t } = useI18n();
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  const disputes = [
    {
      id: 'DSP-001',
      claimant: 'User_a7k2m',
      room: 'RM-0412',
      topic: t('topicNotConnected'),
      operator: 'Beeline',
      status: 'OPEN',
      risk: 'high',
      sla: '4h 12m',
      assigned: false,
    },
    {
      id: 'DSP-002',
      claimant: 'User_k9x3p',
      room: 'RM-0399',
      topic: t('topicWrongTariff'),
      operator: 'Activ',
      status: 'IN_REVIEW',
      risk: 'medium',
      sla: '18h 45m',
      assigned: true,
    },
    {
      id: 'DSP-003',
      claimant: 'User_m2k9x',
      room: 'RM-0377',
      topic: t('topicEarlyDisconnect'),
      operator: 'Kcell',
      status: 'IN_REVIEW',
      risk: 'low',
      sla: '22h 10m',
      assigned: true,
    },
    {
      id: 'DSP-004',
      claimant: 'User_r7n1q',
      room: 'RM-0361',
      topic: t('topicNotConnected'),
      operator: 'Tele2',
      status: 'OPEN',
      risk: 'high',
      sla: '1h 05m',
      assigned: false,
    },
    {
      id: 'DSP-005',
      claimant: 'User_w4t8s',
      room: 'RM-0350',
      topic: t('topicOther'),
      operator: 'Altel',
      status: 'DECISION',
      risk: 'low',
      sla: '—',
      assigned: true,
    },
  ];

  const statusMap: Record<
    string,
    { label: string; variant: 'info' | 'warning' | 'success' | 'danger' | 'default' }
  > = {
    OPEN: { label: t('disputeOpen'), variant: 'info' },
    IN_REVIEW: { label: t('disputeInReview'), variant: 'warning' },
    DECISION: { label: t('disputeDecision'), variant: 'success' },
  };

  const riskMap: Record<string, { label: string; variant: 'danger' | 'warning' | 'success' }> = {
    high: { label: t('riskHigh'), variant: 'danger' },
    medium: { label: t('riskMedium'), variant: 'warning' },
    low: { label: t('riskLow'), variant: 'success' },
  };

  const filtered = disputes.filter((d) => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (riskFilter !== 'all' && d.risk !== riskFilter) return false;
    return true;
  });

  return (
    <div>
      <h3 className="text-[18px] mb-1" style={{ color: 'var(--eco-text)' }}>
        B1) {t('disputeTriageList')}
      </h3>
      <p className="text-[13px] mb-5" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('slaIndicator')} · {t('assignToMe')} · {t('requestInfo')}
      </p>

      {/* Filters */}
      <SC className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Filter size={14} style={{ color: 'var(--eco-text-tertiary)' }} />
          <div className="flex items-center gap-2">
            <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              Status:
            </span>
            {['all', 'OPEN', 'IN_REVIEW', 'DECISION'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className="px-2.5 py-1 rounded text-[11px] cursor-pointer"
                style={{
                  background: statusFilter === s ? 'var(--eco-primary)' : 'var(--eco-bg)',
                  color:
                    statusFilter === s ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                  border: `1px solid ${statusFilter === s ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                }}
              >
                {s === 'all' ? 'All' : statusMap[s]?.label || s}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              Risk:
            </span>
            {['all', 'high', 'medium', 'low'].map((r) => (
              <button
                key={r}
                onClick={() => setRiskFilter(r)}
                className="px-2.5 py-1 rounded text-[11px] cursor-pointer"
                style={{
                  background: riskFilter === r ? 'var(--eco-primary)' : 'var(--eco-bg)',
                  color:
                    riskFilter === r ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                  border: `1px solid ${riskFilter === r ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                }}
              >
                {r === 'all' ? 'All' : riskMap[r]?.label || r}
              </button>
            ))}
          </div>
        </div>
      </SC>

      {/* Table */}
      <SC>
        {/* Desktop header */}
        <div
          className="hidden lg:grid grid-cols-[100px_100px_1fr_100px_80px_90px_80px_140px] gap-3 text-[11px] pb-3 mb-1"
          style={{ color: 'var(--eco-text-tertiary)', borderBottom: '1px solid var(--eco-border)' }}
        >
          <span>ID</span>
          <span>{t('claimant').toUpperCase()}</span>
          <span>{t('disputeTopic').toUpperCase()}</span>
          <span>OPERATOR</span>
          <span>STATUS</span>
          <span>{t('riskLevel').toUpperCase()}</span>
          <span>SLA</span>
          <span>ACTIONS</span>
        </div>

        {filtered.map((d) => {
          const st = statusMap[d.status];
          const rl = riskMap[d.risk];
          const slaUrgent = d.sla !== '—' && parseInt(d.sla) <= 4;
          return (
            <div key={d.id}>
              {/* Desktop row */}
              <div
                className="hidden lg:grid grid-cols-[100px_100px_1fr_100px_80px_90px_80px_140px] gap-3 items-center py-3"
                style={{ borderBottom: '1px solid var(--eco-border)' }}
              >
                <code className="text-[12px]" style={{ color: 'var(--eco-primary)' }}>
                  {d.id}
                </code>
                <span className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                  {d.claimant}
                </span>
                <div>
                  <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {d.topic}
                  </span>
                  <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {d.room}
                  </div>
                </div>
                <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {d.operator}
                </span>
                <Badge variant={st.variant}>{st.label}</Badge>
                <Badge variant={rl.variant}>{rl.label}</Badge>
                <div className="flex items-center gap-1">
                  <Clock
                    size={11}
                    style={{
                      color: slaUrgent ? 'var(--eco-danger-500)' : 'var(--eco-text-tertiary)',
                    }}
                  />
                  <span
                    className="text-[12px]"
                    style={{
                      color: slaUrgent ? 'var(--eco-danger-500)' : 'var(--eco-text-secondary)',
                    }}
                  >
                    {d.sla}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  {!d.assigned && (
                    <button
                      className="px-2 py-1 rounded text-[10px] cursor-pointer"
                      style={{
                        background: 'var(--eco-brand-50)',
                        color: 'var(--eco-primary)',
                        border: '1px solid var(--eco-brand-200)',
                      }}
                    >
                      {t('assignToMe')}
                    </button>
                  )}
                  <button
                    className="px-2 py-1 rounded text-[10px] cursor-pointer"
                    style={{
                      background: 'var(--eco-bg)',
                      color: 'var(--eco-text-secondary)',
                      border: '1px solid var(--eco-border)',
                    }}
                  >
                    {t('requestInfo')}
                  </button>
                </div>
              </div>

              {/* Mobile card */}
              <div
                className="lg:hidden rounded-lg p-4 mb-2"
                style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <code className="text-[12px]" style={{ color: 'var(--eco-primary)' }}>
                    {d.id}
                  </code>
                  <Badge variant={st.variant}>{st.label}</Badge>
                </div>
                <div className="text-[13px] mb-1" style={{ color: 'var(--eco-text)' }}>
                  {d.topic}
                </div>
                <div
                  className="flex items-center gap-3 text-[11px] mb-2"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  <span>{d.claimant}</span>
                  <span>{d.operator}</span>
                  <span>{d.room}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={rl.variant}>{rl.label}</Badge>
                  <div className="flex items-center gap-1">
                    <Clock
                      size={10}
                      style={{
                        color: slaUrgent ? 'var(--eco-danger-500)' : 'var(--eco-text-tertiary)',
                      }}
                    />
                    <span
                      className="text-[11px]"
                      style={{
                        color: slaUrgent ? 'var(--eco-danger-500)' : 'var(--eco-text-tertiary)',
                      }}
                    >
                      {d.sla}
                    </span>
                  </div>
                  <div className="ml-auto flex gap-1.5">
                    {!d.assigned && (
                      <button
                        className="px-2 py-1 rounded text-[10px] cursor-pointer"
                        style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
                      >
                        {t('assignToMe')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </SC>
    </div>
  );
}

/* ─── B2: Admin Dispute Detail ─── */
function AdminDisputeDetail() {
  const { t } = useI18n();
  const [decision, setDecision] = useState('');
  const [refundType, setRefundType] = useState('');
  const [comment, setComment] = useState('');
  const [showRevealModal, setShowRevealModal] = useState(false);

  return (
    <div>
      <h3 className="text-[18px] mb-1" style={{ color: 'var(--eco-text)' }}>
        B2) {t('disputeDetail')} (Admin)
      </h3>
      <div className="flex items-center gap-2 mb-5">
        <code className="text-[13px]" style={{ color: 'var(--eco-primary)' }}>
          DSP-2026-0328-001
        </code>
        <Badge variant="warning">{t('disputeInReview')}</Badge>
        <Badge variant="danger">{t('riskHigh')}</Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left column: snapshots */}
        <div className="xl:col-span-2 flex flex-col gap-5">
          {/* Room snapshot */}
          <SC>
            <SL>{t('roomSnapshot').toUpperCase()}</SL>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Room', value: 'RM-0412' },
                { label: t('planDetails'), value: 'Beeline Family 30GB' },
                { label: 'Start', value: '2026-03-01' },
                { label: t('status'), value: 'IN_VERIFICATION' },
              ].map((item, i) => (
                <div
                  key={`rs-${i}`}
                  className="rounded-lg p-3"
                  style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {item.label}
                  </div>
                  <div className="text-[13px] mt-0.5" style={{ color: 'var(--eco-text)' }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
            {/* Payment mini-table */}
            <div className="text-[11px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('paymentHistory').toUpperCase()}
            </div>
            <div className="flex flex-col gap-1.5">
              {[
                { date: '2026-03-01', amount: '4 500 ₸', status: 'success' },
                { date: '2026-03-15', amount: '4 500 ₸', status: 'success' },
                { date: '2026-03-28', amount: '4 500 ₸', status: 'disputed' },
              ].map((p, i) => (
                <div
                  key={`pay-${i}`}
                  className="flex items-center gap-3 text-[12px] py-1.5 px-2 rounded"
                  style={{ background: 'var(--eco-bg)' }}
                >
                  <span style={{ color: 'var(--eco-text-tertiary)' }}>{p.date}</span>
                  <span style={{ color: 'var(--eco-text)' }}>{p.amount}</span>
                  <Badge variant={p.status === 'success' ? 'success' : 'danger'}>{p.status}</Badge>
                </div>
              ))}
            </div>
          </SC>

          {/* Member snapshot */}
          <SC>
            <SL>{t('memberSnapshot').toUpperCase()}</SL>
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center"
                style={{ background: 'var(--eco-brand-50)' }}
              >
                <User size={18} style={{ color: 'var(--eco-brand-600)' }} />
              </div>
              <div>
                <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                  User_a7k2m
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="success">ACTIVE</Badge>
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    Member since 2026-02-15
                  </span>
                </div>
              </div>
              {/* Reveal button */}
              <button
                onClick={() => setShowRevealModal(true)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
                style={{
                  background: 'var(--eco-bg)',
                  border: '1px solid var(--eco-border)',
                  color: 'var(--eco-primary)',
                }}
              >
                <Eye size={12} />
                {t('viewFull')}
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: t('phoneMasked'), value: '+7 7** *** ** 67', icon: Lock },
                { label: t('joinDate'), value: '2026-02-15' },
                { label: t('lastPayment'), value: '2026-03-28 · 4 500 ₸' },
              ].map((item, i) => (
                <div
                  key={`ms-${i}`}
                  className="rounded-lg p-3"
                  style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
                >
                  <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {item.label}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                      {item.value}
                    </span>
                    {'icon' in item && item.icon && (
                      <item.icon size={11} style={{ color: 'var(--eco-text-tertiary)' }} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SC>

          {/* Evidence viewer */}
          <SC>
            <SL>{t('evidenceViewer').toUpperCase()}</SL>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  name: 'payment_receipt.pdf',
                  size: '1.2 MB',
                  type: 'PDF',
                  by: 'User_a7k2m',
                  date: '2026-03-28',
                },
                {
                  name: 'screenshot_app.png',
                  size: '845 KB',
                  type: 'PNG',
                  by: 'User_a7k2m',
                  date: '2026-03-28',
                },
              ].map((ev, i) => (
                <div
                  key={`aev-${i}`}
                  className="rounded-lg overflow-hidden"
                  style={{ border: '1px solid var(--eco-border)' }}
                >
                  {/* Preview area */}
                  <div
                    className="h-32 flex items-center justify-center"
                    style={{ background: 'var(--eco-neutral-100)' }}
                  >
                    {ev.type === 'PDF' ? (
                      <FileText size={32} style={{ color: 'var(--eco-danger-500)' }} />
                    ) : (
                      <Image size={32} style={{ color: 'var(--eco-brand-400)' }} />
                    )}
                  </div>
                  <div className="p-3" style={{ background: 'var(--eco-bg)' }}>
                    <div className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
                      {ev.name}
                    </div>
                    <div
                      className="flex items-center gap-2 mt-1 text-[11px]"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      <span>{ev.size}</span>
                      <span>·</span>
                      <span>
                        {t('uploadedBy')}: {ev.by}
                      </span>
                      <span>·</span>
                      <span>{ev.date}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SC>
        </div>

        {/* Right column: decision + audit */}
        <div className="flex flex-col gap-5">
          {/* Decision panel */}
          <SC>
            <SL>{t('decisionPanel').toUpperCase()}</SL>

            {/* Decision direction */}
            <div className="mb-4">
              <label
                className="text-[12px] mb-2 block"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {t('decisionSummary')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
              </label>
              <div className="flex flex-col gap-2">
                {[
                  {
                    value: 'claimant',
                    label: t('favorClaimant'),
                    icon: User,
                    color: 'var(--eco-success-500)',
                    bg: 'var(--eco-success-100)',
                  },
                  {
                    value: 'owner',
                    label: t('favorOwner'),
                    icon: ShieldCheck,
                    color: 'var(--eco-brand-600)',
                    bg: 'var(--eco-brand-50)',
                  },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setDecision(opt.value)}
                    className="flex items-center gap-3 rounded-lg px-4 py-3 cursor-pointer transition-colors text-left"
                    style={{
                      background: decision === opt.value ? opt.bg : 'var(--eco-bg)',
                      border: `2px solid ${decision === opt.value ? opt.color : 'var(--eco-border)'}`,
                    }}
                  >
                    <opt.icon
                      size={16}
                      style={{
                        color: decision === opt.value ? opt.color : 'var(--eco-text-tertiary)',
                      }}
                    />
                    <span
                      className="text-[13px]"
                      style={{
                        color: decision === opt.value ? opt.color : 'var(--eco-text-secondary)',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Refund type */}
            <div className="mb-4">
              <label
                className="text-[12px] mb-2 block"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {t('refundAmount')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
              </label>
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'full', label: t('refundFull') },
                  { value: 'partial', label: t('refundPartial') },
                  { value: 'none', label: t('refundNone') },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setRefundType(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors"
                    style={{
                      background: refundType === opt.value ? 'var(--eco-primary)' : 'var(--eco-bg)',
                      color:
                        refundType === opt.value
                          ? 'var(--eco-text-on-primary)'
                          : 'var(--eco-text-secondary)',
                      border: `1px solid ${refundType === opt.value ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {refundType === 'partial' && (
                <div className="mt-2">
                  <input
                    type="text"
                    placeholder="0 ₸"
                    className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
                    style={{
                      background: 'var(--eco-bg)',
                      border: '1px solid var(--eco-border)',
                      color: 'var(--eco-text)',
                    }}
                  />
                </div>
              )}
            </div>

            {/* Mandatory comment */}
            <div className="mb-4">
              <label
                className="text-[12px] mb-2 block"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {t('mandatoryComment')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('writeDecisionComment')}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-[13px] outline-none resize-none"
                style={{
                  background: 'var(--eco-bg)',
                  border: '1px solid var(--eco-border)',
                  color: 'var(--eco-text)',
                }}
              />
            </div>

            {/* Idempotency note */}
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2 mb-4"
              style={{ background: 'var(--eco-warning-100)' }}
            >
              <Info
                size={13}
                className="shrink-0 mt-0.5"
                style={{ color: 'var(--eco-warning-500)' }}
              />
              <span className="text-[11px]" style={{ color: 'var(--eco-warning-500)' }}>
                {t('noDuplicateRefunds')}
              </span>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              disabled={!decision || !refundType || comment.length < 10}
            >
              <Scale size={14} />
              {t('issueDecision')}
            </Button>
          </SC>

          {/* Audit trail always visible */}
          <SC>
            <SL>{t('auditTrail').toUpperCase()}</SL>
            <div
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-3"
              style={{ background: 'var(--eco-brand-50)' }}
            >
              <ClipboardList size={12} style={{ color: 'var(--eco-brand-600)' }} />
              <span className="text-[11px]" style={{ color: 'var(--eco-brand-600)' }}>
                {t('allRevealsAudited')}
              </span>
            </div>
            <div className="flex flex-col gap-2.5">
              {[
                {
                  actor: 'System',
                  action: t('disputeSubmitted'),
                  time: '2026-03-28 14:00',
                  role: 'system',
                },
                {
                  actor: 'admin_01',
                  action: t('assignToMe'),
                  time: '2026-03-29 09:10',
                  role: 'admin',
                },
                {
                  actor: 'admin_01',
                  action: t('requestInfo'),
                  time: '2026-03-29 09:15',
                  role: 'admin',
                },
                {
                  actor: 'admin_01',
                  action: t('auditViewedPhone'),
                  time: '2026-03-30 14:22',
                  role: 'admin',
                },
              ].map((log, i) => (
                <div key={`log-${i}`} className="flex items-start gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                    style={{
                      background:
                        log.role === 'system' ? 'var(--eco-text-tertiary)' : 'var(--eco-primary)',
                    }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                        {log.actor}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {log.time}
                      </span>
                    </div>
                    <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {log.action}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SC>
        </div>
      </div>

      {/* Reveal modal overlay */}
      {showRevealModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowRevealModal(false)}
        >
          <div
            className="max-w-md w-full rounded-xl overflow-hidden shadow-2xl"
            style={{ background: 'var(--eco-bg)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: '1px solid var(--eco-border)' }}
            >
              <div className="flex items-center gap-2">
                <Unlock size={18} style={{ color: 'var(--eco-primary)' }} />
                <span className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
                  {t('revealIdentifier')}
                </span>
              </div>
              <button
                onClick={() => setShowRevealModal(false)}
                className="cursor-pointer p-1"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <XCircle size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--eco-neutral-100)' }}>
                <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('phoneMasked')}
                </div>
                <code className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                  +7 7** *** ** 67
                </code>
              </div>
              <div className="mb-4">
                <label className="text-[13px] mb-1.5 block" style={{ color: 'var(--eco-text)' }}>
                  {t('revealReason')} <span style={{ color: 'var(--eco-danger-500)' }}>*</span>
                </label>
                <select
                  className="w-full px-3 py-2.5 rounded-lg text-[14px] outline-none appearance-none"
                  style={{
                    background: 'var(--eco-surface)',
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text-tertiary)',
                  }}
                >
                  <option>{t('selectReason')}</option>
                  <option>{t('reasonPaymentDispute')}</option>
                  <option>{t('reasonVerifyIdentity')}</option>
                  <option>{t('reasonSupportEscalation')}</option>
                  <option>{t('reasonComplianceCheck')}</option>
                </select>
              </div>
              <div
                className="flex items-start gap-2 rounded-lg p-3 mb-4"
                style={{ background: 'var(--eco-brand-50)' }}
              >
                <ClipboardList
                  size={13}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--eco-brand-600)' }}
                />
                <span className="text-[12px]" style={{ color: 'var(--eco-brand-600)' }}>
                  {t('actionLogged')}
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowRevealModal(false)}
                >
                  {t('cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="flex-1"
                  onClick={() => setShowRevealModal(false)}
                >
                  <Unlock size={14} />
                  {t('confirmReveal')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AdminWorkspaceTab() {
  const { t } = useI18n();
  const [sub, setSub] = useState<'triage' | 'detail'>('triage');
  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['triage', 'detail'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSub(s)}
            className="px-3 py-1.5 rounded-lg text-[13px] cursor-pointer transition-colors"
            style={{
              background: sub === s ? 'var(--eco-primary)' : 'var(--eco-bg)',
              color: sub === s ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
              border: `1px solid ${sub === s ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
            }}
          >
            {s === 'triage' ? `B1) ${t('disputeTriageList')}` : `B2) ${t('disputeDetail')}`}
          </button>
        ))}
      </div>
      {sub === 'triage' ? <AdminTriageList /> : <AdminDisputeDetail />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function DisputesUserAdminPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'user' | 'admin'>('user');

  const tabs = [
    { id: 'user' as const, label: `A) ${t('userFlows')}` },
    { id: 'admin' as const, label: `B) ${t('adminWorkspace')}` },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
          >
            Page 13
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-warning-500)' }}
          >
            End-to-end
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('disputesPageTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('disputesPageSubtitle')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: 'var(--eco-surface)' }}>
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex-1 px-4 py-2.5 rounded-lg text-[14px] transition-all cursor-pointer"
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

      {tab === 'user' && <UserFlowsTab />}
      {tab === 'admin' && <AdminWorkspaceTab />}
    </div>
  );
}
