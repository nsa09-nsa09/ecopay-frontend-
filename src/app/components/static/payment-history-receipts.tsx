import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { Badge, Button } from '../ds-primitives';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  CreditCard,
  Download,
  Eye,
  FileDown,
  FileText,
  Filter,
  Hash,
  Printer,
  Receipt,
  RefreshCw,
  RotateCcw,
  Search,
  Shield,
  ShieldCheck,
  Smartphone,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  X,
  XCircle,
  Inbox,
  Clock,
} from 'lucide-react';

/* ─── types ─── */
type TxnType = 'outgoing' | 'incoming' | 'refund';
type TxnStatus = 'completed' | 'pending' | 'failed' | 'refunded';

interface Txn {
  id: string;
  intentId: string;
  txnId: string;
  refundId?: string;
  type: TxnType;
  status: TxnStatus;
  amount: number;
  currency: 'KZT';
  date: string;
  room: string;
  operator: string;
  method: string;
  methodLast4: string;
  counterparty: string;
  description: string;
}

/* ─── mock data ─── */
const MOCK_TXNS: Txn[] = [
  {
    id: 'TXN-001',
    intentId: 'pi_3Qk8aH2eZv',
    txnId: 'ch_3Qk8aH2eZv',
    type: 'outgoing',
    status: 'completed',
    amount: 3500,
    currency: 'KZT',
    date: '2026-04-01T14:32:00',
    room: 'Beeline Unlim 15GB',
    operator: 'Beeline',
    method: 'Kaspi Gold',
    methodLast4: '4832',
    counterparty: 'Ержан А.',
    description: 'Monthly subscription — April',
  },
  {
    id: 'TXN-002',
    intentId: 'pi_3Qk7bR9fXw',
    txnId: 'ch_3Qk7bR9fXw',
    type: 'incoming',
    status: 'completed',
    amount: 3500,
    currency: 'KZT',
    date: '2026-04-01T14:33:00',
    room: 'Beeline Unlim 15GB',
    operator: 'Beeline',
    method: 'Kaspi Gold',
    methodLast4: '1290',
    counterparty: 'Алмас К.',
    description: 'Member payment — April',
  },
  {
    id: 'TXN-003',
    intentId: 'pi_3Qj5cT1dYz',
    txnId: 'ch_3Qj5cT1dYz',
    type: 'outgoing',
    status: 'completed',
    amount: 2990,
    currency: 'KZT',
    date: '2026-03-28T09:15:00',
    room: 'Activ Smart 10GB',
    operator: 'Activ',
    method: 'Visa',
    methodLast4: '7721',
    counterparty: 'Дана М.',
    description: 'Monthly subscription — March',
  },
  {
    id: 'TXN-004',
    intentId: 'pi_3Qi4dU0eAa',
    txnId: 'ch_3Qi4dU0eAa',
    refundId: 're_3Qi4dU0eAa',
    type: 'refund',
    status: 'refunded',
    amount: 2990,
    currency: 'KZT',
    date: '2026-03-30T11:45:00',
    room: 'Activ Smart 10GB',
    operator: 'Activ',
    method: 'Visa',
    methodLast4: '7721',
    counterparty: 'Дана М.',
    description: 'Dispute refund — room closed',
  },
  {
    id: 'TXN-005',
    intentId: 'pi_3Qh3eV9fBb',
    txnId: 'ch_3Qh3eV9fBb',
    type: 'outgoing',
    status: 'pending',
    amount: 4200,
    currency: 'KZT',
    date: '2026-04-02T16:20:00',
    room: 'Altel Turbo 20GB',
    operator: 'Altel',
    method: 'Mastercard',
    methodLast4: '5543',
    counterparty: 'Бауыржан Т.',
    description: 'Monthly subscription — April',
  },
  {
    id: 'TXN-006',
    intentId: 'pi_3Qg2fW8gCc',
    txnId: '',
    type: 'outgoing',
    status: 'failed',
    amount: 4200,
    currency: 'KZT',
    date: '2026-04-02T16:18:00',
    room: 'Altel Turbo 20GB',
    operator: 'Altel',
    method: 'Mastercard',
    methodLast4: '5543',
    counterparty: 'Бауыржан Т.',
    description: 'Payment failed — card declined',
  },
  {
    id: 'TXN-007',
    intentId: 'pi_3Qf1gX7hDd',
    txnId: 'ch_3Qf1gX7hDd',
    type: 'incoming',
    status: 'completed',
    amount: 1750,
    currency: 'KZT',
    date: '2026-03-15T10:00:00',
    room: 'Tele2 Base 5GB',
    operator: 'Tele2',
    method: 'Kaspi Gold',
    methodLast4: '3367',
    counterparty: 'Мира С.',
    description: 'Member payment — March',
  },
  {
    id: 'TXN-008',
    intentId: 'pi_3Qe0hY6iEe',
    txnId: 'ch_3Qe0hY6iEe',
    type: 'incoming',
    status: 'completed',
    amount: 1750,
    currency: 'KZT',
    date: '2026-03-15T10:02:00',
    room: 'Tele2 Base 5GB',
    operator: 'Tele2',
    method: 'Kaspi QR',
    methodLast4: '—',
    counterparty: 'Аслан Б.',
    description: 'Member payment — March',
  },
  {
    id: 'TXN-009',
    intentId: 'pi_3Qd9iZ5jFf',
    txnId: 'ch_3Qd9iZ5jFf',
    type: 'outgoing',
    status: 'completed',
    amount: 5900,
    currency: 'KZT',
    date: '2026-02-28T08:30:00',
    room: 'Kcell Premium 30GB',
    operator: 'Kcell',
    method: 'Visa',
    methodLast4: '7721',
    counterparty: 'Нурлан Е.',
    description: 'Monthly subscription — February',
  },
  {
    id: 'TXN-010',
    intentId: 'pi_3Qc8jA4kGg',
    txnId: 'ch_3Qc8jA4kGg',
    refundId: 're_3Qc8jA4kGg',
    type: 'refund',
    status: 'refunded',
    amount: 5900,
    currency: 'KZT',
    date: '2026-03-05T13:20:00',
    room: 'Kcell Premium 30GB',
    operator: 'Kcell',
    method: 'Visa',
    methodLast4: '7721',
    counterparty: 'Нурлан Е.',
    description: 'Partial refund — plan downgraded',
  },
  {
    id: 'TXN-011',
    intentId: 'pi_3Qb7kB3lHh',
    txnId: 'ch_3Qb7kB3lHh',
    type: 'incoming',
    status: 'completed',
    amount: 2950,
    currency: 'KZT',
    date: '2026-02-15T09:10:00',
    room: 'Beeline Unlim 15GB',
    operator: 'Beeline',
    method: 'Kaspi Gold',
    methodLast4: '4832',
    counterparty: 'Тимур Ж.',
    description: 'Member payment — February',
  },
  {
    id: 'TXN-012',
    intentId: 'pi_3Qa6lC2mIi',
    txnId: 'ch_3Qa6lC2mIi',
    type: 'outgoing',
    status: 'completed',
    amount: 3500,
    currency: 'KZT',
    date: '2026-03-01T14:30:00',
    room: 'Beeline Unlim 15GB',
    operator: 'Beeline',
    method: 'Kaspi Gold',
    methodLast4: '4832',
    counterparty: 'Ержан А.',
    description: 'Monthly subscription — March',
  },
];

/* ─── helpers ─── */
const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';
const fmtDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString('ru-KZ', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fmtTime = (d: string) =>
  new Date(d).toLocaleTimeString('ru-KZ', { hour: '2-digit', minute: '2-digit' });

const SC = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl p-6 ${className}`}
    style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
  >
    {children}
  </div>
);
const SL = ({ children }: { children: string }) => (
  <div className="text-[11px] mb-3 tracking-wide" style={{ color: 'var(--eco-text-tertiary)' }}>
    {children}
  </div>
);

function TxnIcon({ type }: { type: TxnType }) {
  if (type === 'incoming')
    return <ArrowDownLeft size={14} style={{ color: 'var(--eco-success-500)' }} />;
  if (type === 'refund') return <RotateCcw size={14} style={{ color: 'var(--eco-brand-600)' }} />;
  return <ArrowUpRight size={14} style={{ color: 'var(--eco-text)' }} />;
}

function StatusBadge({ status }: { status: TxnStatus }) {
  const map: Record<
    TxnStatus,
    { variant: 'success' | 'warning' | 'danger' | 'info'; label: string }
  > = {
    completed: { variant: 'success', label: 'Completed' },
    pending: { variant: 'warning', label: 'Pending' },
    failed: { variant: 'danger', label: 'Failed' },
    refunded: { variant: 'info', label: 'Refunded' },
  };
  const { variant, label } = map[status];
  return <Badge variant={variant}>{label}</Badge>;
}

function IdChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  if (!value)
    return (
      <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        —
      </span>
    );
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(value).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 cursor-pointer transition-colors"
      style={{ background: copied ? 'var(--eco-success-100)' : 'var(--eco-neutral-100)' }}
      title={`Copy ${label}`}
    >
      <span className="text-[9px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {label}:
      </span>
      <code
        className="text-[10px] tabular-nums"
        style={{ color: copied ? 'var(--eco-success-500)' : 'var(--eco-text-secondary)' }}
      >
        {copied ? 'Copied!' : value.slice(0, 14)}
      </code>
      {!copied && <ClipboardCopy size={9} style={{ color: 'var(--eco-text-tertiary)' }} />}
    </button>
  );
}

/* ═══════ RECEIPT MODAL ═══════ */
function ReceiptPanel({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{ background: 'var(--eco-surface)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid var(--eco-border)' }}
        >
          <div className="flex items-center gap-2">
            <Receipt size={16} style={{ color: 'var(--eco-primary)' }} />
            <span className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
              {t('phReceiptTitle')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer"
            style={{ background: 'var(--eco-neutral-100)' }}
          >
            <X size={14} style={{ color: 'var(--eco-text-secondary)' }} />
          </button>
        </div>

        {/* Receipt body */}
        <div className="p-6">
          {/* Logo + status */}
          <div className="text-center mb-6">
            <div className="text-[28px] mb-1" style={{ color: 'var(--eco-primary)' }}>
              EcoSplit
            </div>
            <StatusBadge status={txn.status} />
          </div>

          {/* Amount */}
          <div className="text-center mb-6">
            <div
              className="text-[32px] tabular-nums"
              style={{
                color:
                  txn.type === 'incoming'
                    ? 'var(--eco-success-500)'
                    : txn.type === 'refund'
                      ? 'var(--eco-brand-600)'
                      : 'var(--eco-text)',
              }}
            >
              {txn.type === 'incoming' ? '+' : txn.type === 'refund' ? '+' : '−'}
              {fmt(txn.amount)}
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              {txn.description}
            </div>
          </div>

          {/* Details table */}
          <div
            className="rounded-xl overflow-hidden mb-4"
            style={{ border: '1px solid var(--eco-border)' }}
          >
            {[
              { label: t('phDate'), value: `${fmtDate(txn.date)}, ${fmtTime(txn.date)}` },
              { label: t('phRoom'), value: txn.room },
              { label: t('phOperator'), value: txn.operator },
              { label: t('phMethod'), value: `${txn.method} ••${txn.methodLast4}` },
              {
                label: t('phReceiptFrom'),
                value: txn.type === 'incoming' ? txn.counterparty : 'Вы (You)',
              },
              {
                label: t('phReceiptTo'),
                value: txn.type === 'incoming' ? 'Вы (You)' : txn.counterparty,
              },
            ].map((row, i) => (
              <div
                key={i}
                className="flex justify-between px-4 py-2.5"
                style={{
                  borderBottom: i < 5 ? '1px solid var(--eco-border)' : 'none',
                  background: i % 2 === 0 ? 'var(--eco-bg)' : 'transparent',
                }}
              >
                <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {row.label}
                </span>
                <span className="text-[12px] text-right" style={{ color: 'var(--eco-text)' }}>
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {/* IDs */}
          <div
            className="rounded-xl p-4 mb-5"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
          >
            <SL>TRANSACTION IDS</SL>
            <div className="flex flex-wrap gap-2">
              <IdChip label={t('phIntentId')} value={txn.intentId} />
              <IdChip label={t('phTxnId')} value={txn.txnId} />
              {txn.refundId && <IdChip label={t('phRefundId')} value={txn.refundId} />}
            </div>
          </div>

          {/* Generated timestamp */}
          <div
            className="text-center text-[11px] mb-4"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            {t('phReceiptGenerated')}: {new Date().toLocaleString('ru-KZ')}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex-1">
              <Printer size={13} /> Print
            </Button>
            <Button variant="secondary" size="sm" className="flex-1">
              <FileDown size={13} /> {t('phExportPdf')}
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-center"
          style={{ background: 'var(--eco-bg)', borderTop: '1px solid var(--eco-border)' }}
        >
          <div className="flex items-center justify-center gap-1.5">
            <Shield size={10} style={{ color: 'var(--eco-text-tertiary)' }} />
            <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              EcoSplit does not store full card numbers. All payments processed by certified PSP.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ SUMMARY CARDS ═══════ */
function SummaryCards({ txns }: { txns: Txn[] }) {
  const { t } = useI18n();

  const paid = txns
    .filter((tx) => tx.type === 'outgoing' && tx.status === 'completed')
    .reduce((s, tx) => s + tx.amount, 0);
  const received = txns
    .filter((tx) => tx.type === 'incoming' && tx.status === 'completed')
    .reduce((s, tx) => s + tx.amount, 0);
  const refunded = txns.filter((tx) => tx.type === 'refund').reduce((s, tx) => s + tx.amount, 0);
  const net = received - paid + refunded;

  const cards = [
    { label: t('phPaid'), value: paid, icon: ArrowUpRight, color: 'var(--eco-text)', prefix: '−' },
    {
      label: t('phReceived'),
      value: received,
      icon: ArrowDownLeft,
      color: 'var(--eco-success-500)',
      prefix: '+',
    },
    {
      label: t('phRefunded'),
      value: refunded,
      icon: RotateCcw,
      color: 'var(--eco-brand-600)',
      prefix: '+',
    },
    {
      label: t('phNet'),
      value: Math.abs(net),
      icon: net >= 0 ? TrendingUp : TrendingDown,
      color: net >= 0 ? 'var(--eco-success-500)' : 'var(--eco-danger-500)',
      prefix: net >= 0 ? '+' : '−',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl p-4"
          style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <c.icon size={14} style={{ color: c.color }} />
            <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {c.label}
            </span>
          </div>
          <div className="text-[20px] tabular-nums" style={{ color: c.color }}>
            {c.prefix}
            {fmt(c.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════ USER VIEW ═══════ */
function UserPaymentsView() {
  const { t } = useI18n();
  const [filter, setFilter] = useState<'all' | TxnType>('all');
  const [period, setPeriod] = useState('all');
  const [search, setSearch] = useState('');
  const [receipt, setReceipt] = useState<Txn | null>(null);
  const [showExport, setShowExport] = useState(false);

  const filtered = MOCK_TXNS.filter((tx) => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        tx.room.toLowerCase().includes(q) ||
        tx.operator.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        tx.counterparty.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filters: { id: 'all' | TxnType; label: string; count: number }[] = [
    { id: 'all', label: t('phFilterAll'), count: MOCK_TXNS.length },
    {
      id: 'outgoing',
      label: t('phFilterOutgoing'),
      count: MOCK_TXNS.filter((tx) => tx.type === 'outgoing').length,
    },
    {
      id: 'incoming',
      label: t('phFilterIncoming'),
      count: MOCK_TXNS.filter((tx) => tx.type === 'incoming').length,
    },
    {
      id: 'refund',
      label: t('phFilterRefunds'),
      count: MOCK_TXNS.filter((tx) => tx.type === 'refund').length,
    },
  ];

  return (
    <div>
      <SummaryCards txns={MOCK_TXNS} />

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        {/* Filter chips */}
        <div className="flex gap-1.5 flex-1 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] cursor-pointer whitespace-nowrap transition-colors"
              style={{
                background: filter === f.id ? 'var(--eco-primary)' : 'var(--eco-surface)',
                color: filter === f.id ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                border: filter === f.id ? 'none' : '1px solid var(--eco-border)',
              }}
            >
              {f.label}
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: filter === f.id ? 'rgba(255,255,255,0.2)' : 'var(--eco-neutral-100)',
                  color:
                    filter === f.id ? 'var(--eco-text-on-primary)' : 'var(--eco-text-tertiary)',
                }}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search + Period + Export */}
        <div className="flex gap-2">
          <div className="relative">
            <Search
              size={13}
              className="absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--eco-text-tertiary)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="pl-8 pr-3 py-2 rounded-lg text-[12px] w-[160px]"
              style={{
                background: 'var(--eco-surface)',
                border: '1px solid var(--eco-border)',
                color: 'var(--eco-text)',
                outline: 'none',
              }}
            />
          </div>

          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 rounded-lg text-[12px] cursor-pointer"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
              outline: 'none',
            }}
          >
            <option value="month">{t('phThisMonth')}</option>
            <option value="3m">{t('phLast3')}</option>
            <option value="6m">{t('phLast6')}</option>
            <option value="all">{t('phAllTime')}</option>
          </select>

          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowExport(!showExport)}>
              <Download size={13} /> {t('phExport')}
            </Button>
            {showExport && (
              <div
                className="absolute right-0 top-full mt-1 rounded-lg py-1 z-20 min-w-[140px]"
                style={{
                  background: 'var(--eco-surface)',
                  border: '1px solid var(--eco-border)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
                }}
              >
                {[t('phExportCsv'), t('phExportPdf')].map((label) => (
                  <button
                    key={label}
                    onClick={() => setShowExport(false)}
                    className="w-full text-left px-4 py-2 text-[12px] cursor-pointer"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    <FileDown
                      size={12}
                      className="inline mr-2"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transaction list */}
      {filtered.length === 0 ? (
        <SC className="text-center py-12">
          <Inbox size={32} className="mx-auto mb-3" style={{ color: 'var(--eco-text-tertiary)' }} />
          <div className="text-[14px] mb-1" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('phNoResults')}
          </div>
          <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            Try adjusting your filters or search term
          </div>
        </SC>
      ) : (
        <SC className="!p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--eco-bg)' }}>
                  {[
                    '',
                    t('phDate'),
                    'Description',
                    t('phRoom'),
                    t('phOperator'),
                    t('phMethod'),
                    'IDs',
                    t('phAmount'),
                    '',
                  ].map((h, i) => (
                    <th
                      key={i}
                      className="text-left px-3 py-3 whitespace-nowrap"
                      style={{
                        color: 'var(--eco-text-tertiary)',
                        borderBottom: '1px solid var(--eco-border)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((tx) => (
                  <tr
                    key={tx.id}
                    className="group"
                    style={{ borderBottom: '1px solid var(--eco-border)' }}
                  >
                    {/* Type icon */}
                    <td className="pl-4 pr-1 py-3">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            tx.type === 'incoming'
                              ? 'var(--eco-success-100)'
                              : tx.type === 'refund'
                                ? 'var(--eco-brand-50)'
                                : 'var(--eco-neutral-100)',
                        }}
                      >
                        <TxnIcon type={tx.type} />
                      </div>
                    </td>
                    {/* Date */}
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div style={{ color: 'var(--eco-text)' }}>{fmtDate(tx.date)}</div>
                      <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {fmtTime(tx.date)}
                      </div>
                    </td>
                    {/* Description + status */}
                    <td className="px-3 py-3 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span style={{ color: 'var(--eco-text)' }}>{tx.description}</span>
                      </div>
                      <div className="mt-1">
                        <StatusBadge status={tx.status} />
                      </div>
                    </td>
                    {/* Room */}
                    <td
                      className="px-3 py-3 whitespace-nowrap"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {tx.room}
                    </td>
                    {/* Operator */}
                    <td className="px-3 py-3">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
                      >
                        {tx.operator}
                      </span>
                    </td>
                    {/* Method */}
                    <td
                      className="px-3 py-3 whitespace-nowrap"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      <div>{tx.method}</div>
                      <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        ••{tx.methodLast4}
                      </div>
                    </td>
                    {/* IDs */}
                    <td className="px-3 py-3">
                      <div className="flex flex-col gap-0.5">
                        <IdChip label="INT" value={tx.intentId} />
                        <IdChip label="TXN" value={tx.txnId} />
                        {tx.refundId && <IdChip label="REF" value={tx.refundId} />}
                      </div>
                    </td>
                    {/* Amount */}
                    <td
                      className="px-3 py-3 text-right whitespace-nowrap tabular-nums"
                      style={{
                        color:
                          tx.type === 'incoming'
                            ? 'var(--eco-success-500)'
                            : tx.type === 'refund'
                              ? 'var(--eco-brand-600)'
                              : 'var(--eco-text)',
                      }}
                    >
                      <span className="text-[13px]">
                        {tx.type === 'incoming' ? '+' : tx.type === 'refund' ? '+' : '−'}
                        {fmt(tx.amount)}
                      </span>
                    </td>
                    {/* Actions */}
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setReceipt(tx)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer opacity-60 hover:opacity-100 transition-opacity"
                        style={{ background: 'var(--eco-neutral-100)' }}
                        title={t('phViewReceipt')}
                      >
                        <FileText size={13} style={{ color: 'var(--eco-text-secondary)' }} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderTop: '1px solid var(--eco-border)', background: 'var(--eco-bg)' }}
          >
            <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {filtered.length} transactions
            </span>
            <div className="flex items-center gap-1">
              <button
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: 'var(--eco-neutral-100)' }}
              >
                <ChevronLeft size={13} style={{ color: 'var(--eco-text-tertiary)' }} />
              </button>
              <span
                className="w-7 h-7 rounded flex items-center justify-center text-[11px]"
                style={{ background: 'var(--eco-primary)', color: 'var(--eco-text-on-primary)' }}
              >
                1
              </span>
              <span
                className="w-7 h-7 rounded flex items-center justify-center text-[11px] cursor-pointer"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                2
              </span>
              <button
                className="w-7 h-7 rounded flex items-center justify-center"
                style={{ background: 'var(--eco-neutral-100)' }}
              >
                <ChevronRight size={13} style={{ color: 'var(--eco-text-tertiary)' }} />
              </button>
            </div>
          </div>
        </SC>
      )}

      {receipt && <ReceiptPanel txn={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

/* ═══════ ADMIN VIEW ═══════ */
function AdminTransactionsView() {
  const { t } = useI18n();
  const [receipt, setReceipt] = useState<Txn | null>(null);

  const statCounts = {
    total: MOCK_TXNS.length,
    completed: MOCK_TXNS.filter((tx) => tx.status === 'completed').length,
    pending: MOCK_TXNS.filter((tx) => tx.status === 'pending').length,
    failed: MOCK_TXNS.filter((tx) => tx.status === 'failed').length,
    refunded: MOCK_TXNS.filter((tx) => tx.status === 'refunded').length,
  };

  const volume = MOCK_TXNS.filter((tx) => tx.status === 'completed').reduce(
    (s, tx) => s + tx.amount,
    0,
  );

  return (
    <div>
      {/* Admin stat bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'Total TXNs', value: statCounts.total, color: 'var(--eco-text)' },
          { label: 'Volume', value: fmt(volume), color: 'var(--eco-primary)' },
          { label: 'Completed', value: statCounts.completed, color: 'var(--eco-success-500)' },
          { label: 'Pending', value: statCounts.pending, color: 'var(--eco-warning-500)' },
          { label: 'Failed', value: statCounts.failed, color: 'var(--eco-danger-500)' },
          { label: 'Refunded', value: statCounts.refunded, color: 'var(--eco-brand-600)' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[18px] tabular-nums" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Admin table with extra columns */}
      <SC className="!p-0 overflow-hidden">
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} style={{ color: 'var(--eco-primary)' }} />
            <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
              {t('phAdminView')}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">
              <Filter size={12} /> Filters
            </Button>
            <Button variant="secondary" size="sm">
              <Download size={12} /> {t('phExport')}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--eco-bg)' }}>
                {[
                  'ID',
                  'Type',
                  t('phDate'),
                  'User',
                  'Counterparty',
                  t('phRoom'),
                  'Operator',
                  'Status',
                  'Intent / TXN / Refund',
                  t('phAmount'),
                  '',
                ].map((h, i) => (
                  <th
                    key={i}
                    className="text-left px-3 py-2.5 whitespace-nowrap"
                    style={{
                      color: 'var(--eco-text-tertiary)',
                      borderBottom: '1px solid var(--eco-border)',
                      fontSize: '10px',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MOCK_TXNS.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <td className="px-3 py-2.5">
                    <code
                      className="text-[10px] tabular-nums"
                      style={{ color: 'var(--eco-primary)' }}
                    >
                      {tx.id}
                    </code>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <TxnIcon type={tx.type} />
                      <span className="text-[10px]" style={{ color: 'var(--eco-text-secondary)' }}>
                        {tx.type === 'outgoing' ? 'OUT' : tx.type === 'incoming' ? 'IN' : 'REF'}
                      </span>
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 whitespace-nowrap"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    {fmtDate(tx.date)}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px]"
                        style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
                      >
                        <User size={10} />
                      </div>
                      <span style={{ color: 'var(--eco-text)' }}>
                        {tx.type === 'incoming' ? tx.counterparty : 'You'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx.counterparty}
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx.room}
                  </td>
                  <td className="px-3 py-2.5">
                    <span
                      className="text-[10px] px-1 py-0.5 rounded"
                      style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
                    >
                      {tx.operator}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <StatusBadge status={tx.status} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-0.5">
                      <IdChip label="INT" value={tx.intentId} />
                      <IdChip label="TXN" value={tx.txnId} />
                      {tx.refundId && <IdChip label="REF" value={tx.refundId} />}
                    </div>
                  </td>
                  <td
                    className="px-3 py-2.5 text-right whitespace-nowrap tabular-nums"
                    style={{
                      color:
                        tx.type === 'incoming'
                          ? 'var(--eco-success-500)'
                          : tx.type === 'refund'
                            ? 'var(--eco-brand-600)'
                            : 'var(--eco-text)',
                    }}
                  >
                    {tx.type === 'incoming' ? '+' : tx.type === 'refund' ? '+' : '−'}
                    {fmt(tx.amount)}
                  </td>
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => setReceipt(tx)}
                      className="w-6 h-6 rounded flex items-center justify-center cursor-pointer"
                      style={{ background: 'var(--eco-neutral-100)' }}
                      title={t('phViewReceipt')}
                    >
                      <FileText size={11} style={{ color: 'var(--eco-text-secondary)' }} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderTop: '1px solid var(--eco-border)', background: 'var(--eco-bg)' }}
        >
          <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {MOCK_TXNS.length} transactions · Volume: {fmt(volume)}
          </span>
          <div className="flex items-center gap-1">
            <button
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'var(--eco-neutral-100)' }}
            >
              <ChevronLeft size={13} style={{ color: 'var(--eco-text-tertiary)' }} />
            </button>
            <span
              className="w-7 h-7 rounded flex items-center justify-center text-[11px]"
              style={{ background: 'var(--eco-primary)', color: 'var(--eco-text-on-primary)' }}
            >
              1
            </span>
            <button
              className="w-7 h-7 rounded flex items-center justify-center"
              style={{ background: 'var(--eco-neutral-100)' }}
            >
              <ChevronRight size={13} style={{ color: 'var(--eco-text-tertiary)' }} />
            </button>
          </div>
        </div>
      </SC>

      {receipt && <ReceiptPanel txn={receipt} onClose={() => setReceipt(null)} />}
    </div>
  );
}

/* ═══════ RECEIPT SAMPLE (standalone) ═══════ */
function ReceiptSampleView() {
  const { t } = useI18n();
  const sampleTxn = MOCK_TXNS[0];

  return (
    <div>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        Standalone receipt view — what the user sees when they click "View receipt" or receive a
        receipt link.
      </p>

      {/* Full receipt card */}
      <div className="max-w-[520px] mx-auto">
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          }}
        >
          {/* Header with wave */}
          <div className="relative px-6 pt-6 pb-10" style={{ background: 'var(--eco-primary)' }}>
            <div className="flex items-center justify-between mb-6">
              <span className="text-[22px]" style={{ color: 'var(--eco-text-on-primary)' }}>
                EcoSplit
              </span>
              <span
                className="text-[11px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,255,255,0.2)', color: 'var(--eco-text-on-primary)' }}
              >
                {t('phReceiptView')}
              </span>
            </div>
            <div className="text-center">
              <div
                className="text-[36px] tabular-nums"
                style={{ color: 'var(--eco-text-on-primary)' }}
              >
                −{fmt(sampleTxn.amount)}
              </div>
              <div className="text-[13px] mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                {sampleTxn.description}
              </div>
            </div>
            {/* Wave divider */}
            <svg
              viewBox="0 0 520 24"
              fill="none"
              className="absolute bottom-0 left-0 right-0 w-full"
              preserveAspectRatio="none"
            >
              <path
                d="M0 12C130 24 260 0 390 12C455 18 488 22 520 12V24H0V12Z"
                fill="var(--eco-surface)"
              />
            </svg>
          </div>

          {/* Details */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-center gap-2 mb-5">
              <StatusBadge status={sampleTxn.status} />
              <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {fmtDate(sampleTxn.date)}, {fmtTime(sampleTxn.date)}
              </span>
            </div>

            {/* From / To */}
            <div className="flex gap-4 mb-5">
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
              >
                <div className="text-[10px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('phReceiptFrom')}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--eco-brand-50)' }}
                  >
                    <User size={12} style={{ color: 'var(--eco-primary)' }} />
                  </div>
                  <div>
                    <div className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                      Алмас К.
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      +7 •••••• ••12
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center">
                <ArrowUpRight size={16} style={{ color: 'var(--eco-neutral-300)' }} />
              </div>
              <div
                className="flex-1 rounded-xl p-3"
                style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
              >
                <div className="text-[10px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('phReceiptTo')}
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--eco-success-100)' }}
                  >
                    <User size={12} style={{ color: 'var(--eco-success-500)' }} />
                  </div>
                  <div>
                    <div className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                      {sampleTxn.counterparty}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      Room owner
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Detail rows */}
            <div
              className="rounded-xl overflow-hidden mb-5"
              style={{ border: '1px solid var(--eco-border)' }}
            >
              {[
                { label: t('phRoom'), value: sampleTxn.room },
                { label: t('phOperator'), value: sampleTxn.operator },
                { label: t('phMethod'), value: `${sampleTxn.method} ••${sampleTxn.methodLast4}` },
                { label: t('phAmount'), value: fmt(sampleTxn.amount) },
              ].map((row, i, arr) => (
                <div
                  key={i}
                  className="flex justify-between px-4 py-2.5"
                  style={{
                    borderBottom: i < arr.length - 1 ? '1px solid var(--eco-border)' : 'none',
                    background: i % 2 === 0 ? 'var(--eco-bg)' : 'transparent',
                  }}
                >
                  <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {row.label}
                  </span>
                  <span className="text-[12px] tabular-nums" style={{ color: 'var(--eco-text)' }}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>

            {/* IDs section */}
            <div
              className="rounded-xl p-4 mb-5"
              style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
            >
              <SL>TRANSACTION IDENTIFIERS</SL>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {t('phIntentId')}
                  </span>
                  <IdChip label="" value={sampleTxn.intentId} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {t('phTxnId')}
                  </span>
                  <IdChip label="" value={sampleTxn.txnId} />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="primary" size="md" className="flex-1">
                <FileDown size={14} /> {t('phExportPdf')}
              </Button>
              <Button variant="secondary" size="md">
                <Printer size={14} />
              </Button>
            </div>

            {/* Footer note */}
            <div className="mt-4 flex items-center justify-center gap-1.5 text-center">
              <Shield size={10} style={{ color: 'var(--eco-text-tertiary)' }} />
              <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('phReceiptGenerated')}: {new Date().toLocaleString('ru-KZ')} · EcoSplit does not
                store full card data
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export function PaymentHistoryPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'user' | 'admin' | 'receipt'>('user');

  const tabs = [
    { id: 'user' as const, label: t('phUserView'), icon: Wallet },
    { id: 'admin' as const, label: t('phAdminView'), icon: ShieldCheck },
    { id: 'receipt' as const, label: t('phReceiptView'), icon: Receipt },
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
            Page 22
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-success-100)', color: 'var(--eco-success-500)' }}
          >
            Finance
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('phTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('phSubtitle')}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {[
          { n: '12', label: 'Transactions' },
          { n: '5', label: 'Operators' },
          { n: '3', label: 'ID types (INT/TXN/REF)' },
          { n: '2', label: 'Export formats' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-3 text-center"
            style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
              {s.n}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: 'var(--eco-surface)' }}>
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 flex-1 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer justify-center"
            style={{
              background: tab === id ? 'var(--eco-bg)' : 'transparent',
              color: tab === id ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'user' && <UserPaymentsView />}
      {tab === 'admin' && <AdminTransactionsView />}
      {tab === 'receipt' && <ReceiptSampleView />}
    </div>
  );
}
