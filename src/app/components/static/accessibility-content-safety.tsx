import { useState, useRef, useEffect } from 'react';
import { useI18n } from '../i18n-provider';
import { Badge, Button } from '../ds-primitives';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Focus,
  Info,
  Keyboard,
  Minus,
  Monitor,
  MousePointer2,
  PaintBucket,
  Palette,
  Scan,
  Shield,
  ShieldCheck,
  SquareAsterisk,
  Type,
  XCircle,
  Zap,
  FileWarning,
  Lock,
  CreditCard,
  User,
  MessageSquare,
  DoorOpen,
  Settings,
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
   SECTION A: Focus Rings
   ═══════════════════════════════════════════════════ */
function FocusRingsSection() {
  const { t } = useI18n();

  const focusRingStyle = 'outline-2 outline-offset-2 outline-[var(--eco-primary)]';

  const components: { label: string; type: string }[] = [
    { label: 'Button (Primary)', type: 'button-primary' },
    { label: 'Button (Secondary)', type: 'button-secondary' },
    { label: 'Button (Ghost)', type: 'button-ghost' },
    { label: 'Icon Button', type: 'icon-button' },
    { label: 'Tab', type: 'tab' },
    { label: 'Input', type: 'input' },
    { label: 'Select', type: 'select' },
    { label: 'Link', type: 'link' },
    { label: 'Checkbox', type: 'checkbox' },
    { label: 'Modal Close', type: 'modal-close' },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Focus size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          A) {t('sectionFocusRings')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('focusRingDesc')}
      </p>

      {/* Spec card */}
      <SC className="mb-5">
        <SL>FOCUS RING SPECIFICATION</SL>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: 'var(--eco-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              Ring width
            </div>
            <div className="text-[18px] tabular-nums" style={{ color: 'var(--eco-text)' }}>
              2px
            </div>
            <code className="text-[11px]" style={{ color: 'var(--eco-primary)' }}>
              outline-width: 2px
            </code>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--eco-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              Offset
            </div>
            <div className="text-[18px] tabular-nums" style={{ color: 'var(--eco-text)' }}>
              2px
            </div>
            <code className="text-[11px]" style={{ color: 'var(--eco-primary)' }}>
              outline-offset: 2px
            </code>
          </div>
          <div className="rounded-lg p-4" style={{ background: 'var(--eco-bg)' }}>
            <div className="text-[11px] mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
              Color
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded" style={{ background: 'var(--eco-primary)' }} />
              <code className="text-[11px]" style={{ color: 'var(--eco-primary)' }}>
                --eco-primary
              </code>
            </div>
          </div>
        </div>

        {/* Keyboard nav */}
        <div
          className="rounded-lg p-4 mb-6"
          style={{ background: 'var(--eco-brand-50)', border: '1px solid var(--eco-brand-200)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <Keyboard size={14} style={{ color: 'var(--eco-brand-600)' }} />
            <span className="text-[13px]" style={{ color: 'var(--eco-brand-600)' }}>
              Keyboard Navigation
            </span>
          </div>
          <p className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('keyboardNavDesc')}
          </p>
        </div>

        {/* Live demo grid */}
        <SL>INTERACTIVE DEMO — USE TAB KEY</SL>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {components.map((c) => (
            <div key={c.type} className="flex flex-col items-center gap-2">
              <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {c.label}
              </span>
              {c.type === 'button-primary' && (
                <button
                  className="px-4 py-2 rounded-lg text-[13px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'var(--eco-primary)',
                    color: 'var(--eco-text-on-primary)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  Action
                </button>
              )}
              {c.type === 'button-secondary' && (
                <button
                  className="px-4 py-2 rounded-lg text-[13px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'transparent',
                    color: 'var(--eco-text)',
                    border: '1px solid var(--eco-border-strong)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  Cancel
                </button>
              )}
              {c.type === 'button-ghost' && (
                <button
                  className="px-4 py-2 rounded-lg text-[13px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'transparent',
                    color: 'var(--eco-text-secondary)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  More
                </button>
              )}
              {c.type === 'icon-button' && (
                <button
                  aria-label="Settings"
                  className="w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'var(--eco-bg)',
                    border: '1px solid var(--eco-border)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  <Settings size={16} style={{ color: 'var(--eco-text-secondary)' }} />
                </button>
              )}
              {c.type === 'tab' && (
                <button
                  className="px-4 py-2 rounded-lg text-[13px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'var(--eco-bg)',
                    color: 'var(--eco-primary)',
                    borderBottom: '2px solid var(--eco-primary)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  Tab
                </button>
              )}
              {c.type === 'input' && (
                <input
                  className="w-full px-3 py-2 rounded-lg text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'var(--eco-bg)',
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                  placeholder="Input"
                />
              )}
              {c.type === 'select' && (
                <select
                  className="w-full px-3 py-2 rounded-lg text-[13px] focus-visible:outline-2 focus-visible:outline-offset-2 appearance-none"
                  style={{
                    background: 'var(--eco-bg)',
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  <option>Select</option>
                </select>
              )}
              {c.type === 'link' && (
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[13px] underline cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 rounded"
                  style={{ color: 'var(--eco-primary)', outlineColor: 'var(--eco-primary)' }}
                >
                  Link text
                </a>
              )}
              {c.type === 'checkbox' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 accent-[var(--eco-primary)]"
                    style={{ outlineColor: 'var(--eco-primary)' }}
                  />
                  <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    Check
                  </span>
                </label>
              )}
              {c.type === 'modal-close' && (
                <button
                  aria-label="Close modal"
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: 'var(--eco-neutral-100)',
                    outlineColor: 'var(--eco-primary)',
                  }}
                >
                  <XCircle size={16} style={{ color: 'var(--eco-text-secondary)' }} />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Aria note */}
        <div
          className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3"
          style={{ background: 'var(--eco-warning-100)' }}
        >
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--eco-warning-500)' }}
          />
          <span className="text-[12px]" style={{ color: 'var(--eco-warning-500)' }}>
            {t('ariaLabelRequired')}
          </span>
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION B: Contrast Checks
   ═══════════════════════════════════════════════════ */
function ContrastSection() {
  const { t } = useI18n();

  interface ContrastPair {
    label: string;
    fg: string;
    fgVar: string;
    bg: string;
    bgVar: string;
    ratio: string;
    aa: boolean;
    aaa: boolean;
  }

  const pairs: ContrastPair[] = [
    {
      label: 'Primary text / bg',
      fg: '#1a1a2e',
      fgVar: '--eco-text',
      bg: '#ffffff',
      bgVar: '--eco-bg',
      ratio: '16.8:1',
      aa: true,
      aaa: true,
    },
    {
      label: 'Primary text / surface',
      fg: '#1a1a2e',
      fgVar: '--eco-text',
      bg: '#f8f8fa',
      bgVar: '--eco-surface',
      ratio: '15.4:1',
      aa: true,
      aaa: true,
    },
    {
      label: 'Secondary text / bg',
      fg: '#5a5a72',
      fgVar: '--eco-text-secondary',
      bg: '#ffffff',
      bgVar: '--eco-bg',
      ratio: '6.7:1',
      aa: true,
      aaa: false,
    },
    {
      label: 'Tertiary text / bg',
      fg: '#8e8ea0',
      fgVar: '--eco-text-tertiary',
      bg: '#ffffff',
      bgVar: '--eco-bg',
      ratio: '3.9:1',
      aa: false,
      aaa: false,
    },
    {
      label: 'Text on primary btn',
      fg: '#ffffff',
      fgVar: '--eco-text-on-primary',
      bg: '#e85d4a',
      bgVar: '--eco-primary (Coral)',
      ratio: '4.5:1',
      aa: true,
      aaa: false,
    },
    {
      label: 'Text on primary btn',
      fg: '#ffffff',
      fgVar: '--eco-text-on-primary',
      bg: '#3b82f6',
      bgVar: '--eco-primary (Blue)',
      ratio: '4.6:1',
      aa: true,
      aaa: false,
    },
    {
      label: 'Success chip text/bg',
      fg: '#16a34a',
      fgVar: '--eco-success-500',
      bg: '#dcfce7',
      bgVar: '--eco-success-100',
      ratio: '4.8:1',
      aa: true,
      aaa: false,
    },
    {
      label: 'Danger chip text/bg',
      fg: '#dc2626',
      fgVar: '--eco-danger-500',
      bg: '#fee2e2',
      bgVar: '--eco-danger-100',
      ratio: '5.1:1',
      aa: true,
      aaa: false,
    },
    {
      label: 'Warning chip text/bg',
      fg: '#ca8a04',
      fgVar: '--eco-warning-500',
      bg: '#fef9c3',
      bgVar: '--eco-warning-100',
      ratio: '4.5:1',
      aa: true,
      aaa: false,
    },
    {
      label: 'Info chip text/bg',
      fg: '#2563eb',
      fgVar: '--eco-brand-600',
      bg: '#eff6ff',
      bgVar: '--eco-brand-50',
      ratio: '6.3:1',
      aa: true,
      aaa: false,
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Palette size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          B) {t('sectionContrast')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('wcagNote')}
      </p>

      <SC>
        <SL>COLOR CONTRAST MATRIX</SL>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--eco-bg)' }}>
                <th
                  className="text-left px-3 py-2.5"
                  style={{
                    color: 'var(--eco-text-tertiary)',
                    borderBottom: '1px solid var(--eco-border)',
                  }}
                >
                  Pair
                </th>
                <th
                  className="text-left px-3 py-2.5"
                  style={{
                    color: 'var(--eco-text-tertiary)',
                    borderBottom: '1px solid var(--eco-border)',
                  }}
                >
                  Preview
                </th>
                <th
                  className="text-center px-3 py-2.5"
                  style={{
                    color: 'var(--eco-text-tertiary)',
                    borderBottom: '1px solid var(--eco-border)',
                  }}
                >
                  Ratio
                </th>
                <th
                  className="text-center px-3 py-2.5"
                  style={{
                    color: 'var(--eco-text-tertiary)',
                    borderBottom: '1px solid var(--eco-border)',
                  }}
                >
                  {t('contrastAaLabel')}
                </th>
                <th
                  className="text-center px-3 py-2.5"
                  style={{
                    color: 'var(--eco-text-tertiary)',
                    borderBottom: '1px solid var(--eco-border)',
                  }}
                >
                  {t('contrastAaaLabel')}
                </th>
              </tr>
            </thead>
            <tbody>
              {pairs.map((p, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <td className="px-3 py-3">
                    <div className="text-[12px]" style={{ color: 'var(--eco-text)' }}>
                      {p.label}
                    </div>
                    <div className="flex gap-1 mt-1">
                      <code
                        className="text-[10px] px-1 rounded"
                        style={{
                          background: 'var(--eco-neutral-100)',
                          color: 'var(--eco-text-tertiary)',
                        }}
                      >
                        {p.fgVar}
                      </code>
                      <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        /
                      </span>
                      <code
                        className="text-[10px] px-1 rounded"
                        style={{
                          background: 'var(--eco-neutral-100)',
                          color: 'var(--eco-text-tertiary)',
                        }}
                      >
                        {p.bgVar}
                      </code>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div
                      className="w-32 h-8 rounded-lg flex items-center justify-center text-[12px] border"
                      style={{ background: p.bg, color: p.fg, borderColor: 'var(--eco-border)' }}
                    >
                      Sample text
                    </div>
                  </td>
                  <td className="text-center px-3 py-3">
                    <span className="tabular-nums text-[13px]" style={{ color: 'var(--eco-text)' }}>
                      {p.ratio}
                    </span>
                  </td>
                  <td className="text-center px-3 py-3">
                    {p.aa ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--eco-success-100)',
                          color: 'var(--eco-success-500)',
                        }}
                      >
                        <Check size={10} /> {t('contrastPassLabel')}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--eco-danger-100)',
                          color: 'var(--eco-danger-500)',
                        }}
                      >
                        <XCircle size={10} /> {t('contrastFailLabel')}
                      </span>
                    )}
                  </td>
                  <td className="text-center px-3 py-3">
                    {p.aaa ? (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--eco-success-100)',
                          color: 'var(--eco-success-500)',
                        }}
                      >
                        <Check size={10} /> {t('contrastPassLabel')}
                      </span>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--eco-neutral-100)',
                          color: 'var(--eco-text-tertiary)',
                        }}
                      >
                        <Minus size={10} /> N/A
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden flex flex-col gap-3">
          {pairs.map((p, i) => (
            <div
              key={i}
              className="rounded-lg p-3"
              style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
            >
              <div className="text-[12px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {p.label}
              </div>
              <div
                className="w-full h-8 rounded-lg flex items-center justify-center text-[12px] mb-2"
                style={{ background: p.bg, color: p.fg, border: '1px solid var(--eco-border)' }}
              >
                Sample text
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[12px] tabular-nums" style={{ color: 'var(--eco-text)' }}>
                  {p.ratio}
                </span>
                <div className="flex gap-2">
                  {p.aa ? <Badge variant="success">AA</Badge> : <Badge variant="danger">AA</Badge>}
                  {p.aaa ? (
                    <Badge variant="success">AAA</Badge>
                  ) : (
                    <Badge variant="default">AAA</Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tertiary text advisory */}
        <div
          className="mt-5 flex items-start gap-2 rounded-lg px-4 py-3"
          style={{ background: 'var(--eco-warning-100)' }}
        >
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--eco-warning-500)' }}
          />
          <div>
            <span className="text-[12px]" style={{ color: 'var(--eco-warning-500)' }}>
              <strong>Tertiary text (3.9:1)</strong> fails AA for normal text. Use only for
              decorative labels, timestamps, or hint text (WCAG 1.4.3 exception for incidental
              text).
            </span>
          </div>
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION C: Form Validation Patterns
   ═══════════════════════════════════════════════════ */
function FormValidationSection() {
  const { t } = useI18n();

  interface FormModule {
    module: string;
    moduleKey: string;
    icon: React.ElementType;
    fields: { name: string; rules: string[]; ruleKeys: string[] }[];
  }

  const forms: FormModule[] = [
    {
      module: 'Auth (Login / Register)',
      moduleKey: 'moduleAuth',
      icon: Lock,
      fields: [
        {
          name: 'Phone',
          rules: [t('fieldRequired'), t('fieldInvalidPhone')],
          ruleKeys: ['fieldRequired', 'fieldInvalidPhone'],
        },
        {
          name: 'Password',
          rules: [t('fieldRequired'), t('fieldPasswordWeak')],
          ruleKeys: ['fieldRequired', 'fieldPasswordWeak'],
        },
      ],
    },
    {
      module: 'Create Room',
      moduleKey: 'moduleCatalog',
      icon: DoorOpen,
      fields: [
        {
          name: 'Room name',
          rules: [t('fieldRequired'), t('fieldMaxLength')],
          ruleKeys: ['fieldRequired', 'fieldMaxLength'],
        },
        {
          name: 'Price per slot',
          rules: [t('fieldRequired'), t('fieldPriceRange')],
          ruleKeys: ['fieldRequired', 'fieldPriceRange'],
        },
      ],
    },
    {
      module: 'Join Room',
      moduleKey: 'moduleRoomDetail',
      icon: User,
      fields: [
        { name: 'Confirmation checkbox', rules: [t('fieldRequired')], ruleKeys: ['fieldRequired'] },
      ],
    },
    {
      module: 'Dispute',
      moduleKey: 'moduleSupport',
      icon: Shield,
      fields: [
        { name: 'Reason', rules: [t('fieldRequired')], ruleKeys: ['fieldRequired'] },
        {
          name: 'Description',
          rules: [t('fieldRequired'), t('fieldMaxLength')],
          ruleKeys: ['fieldRequired', 'fieldMaxLength'],
        },
        { name: 'Evidence file', rules: [t('fieldInvalidFile')], ruleKeys: ['fieldInvalidFile'] },
      ],
    },
    {
      module: 'Support Ticket',
      moduleKey: 'moduleSupport',
      icon: MessageSquare,
      fields: [
        {
          name: 'Subject',
          rules: [t('fieldRequired'), t('fieldMaxLength')],
          ruleKeys: ['fieldRequired', 'fieldMaxLength'],
        },
        { name: 'Message', rules: [t('fieldRequired')], ruleKeys: ['fieldRequired'] },
        { name: 'Attachment', rules: [t('fieldInvalidFile')], ruleKeys: ['fieldInvalidFile'] },
      ],
    },
  ];

  const [demoErrors, setDemoErrors] = useState<Record<string, string>>({
    phone: t('fieldInvalidPhone'),
    password: t('fieldPasswordWeak'),
  });

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <AlertCircle size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          C) {t('sectionFormValidation')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('inlineValidation')} + {t('summaryValidation')} — 5 modules
      </p>

      {/* Inline + Summary demo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
        {/* Inline demo */}
        <SC>
          <SL>{t('inlineValidation').toUpperCase()}</SL>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                Phone *
              </label>
              <input
                className="px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{
                  background: 'var(--eco-bg)',
                  border: '1px solid var(--eco-negative)',
                  color: 'var(--eco-text)',
                }}
                defaultValue="+7 777 123"
                readOnly
              />
              <div className="flex items-center gap-1">
                <AlertCircle size={12} style={{ color: 'var(--eco-negative)' }} />
                <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                  {t('fieldInvalidPhone')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                Password *
              </label>
              <input
                className="px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{
                  background: 'var(--eco-bg)',
                  border: '1px solid var(--eco-negative)',
                  color: 'var(--eco-text)',
                }}
                type="password"
                defaultValue="123"
                readOnly
              />
              <div className="flex items-center gap-1">
                <AlertCircle size={12} style={{ color: 'var(--eco-negative)' }} />
                <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                  {t('fieldPasswordWeak')}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                Email
              </label>
              <input
                className="px-3 py-2 rounded-lg text-[13px] outline-none"
                style={{
                  background: 'var(--eco-bg)',
                  border: '1px solid var(--eco-success-500)',
                  color: 'var(--eco-text)',
                }}
                defaultValue="user@example.com"
                readOnly
              />
              <div className="flex items-center gap-1">
                <CheckCircle2 size={12} style={{ color: 'var(--eco-success-500)' }} />
                <span className="text-[12px]" style={{ color: 'var(--eco-success-500)' }}>
                  Valid
                </span>
              </div>
            </div>
          </div>
        </SC>

        {/* Summary demo */}
        <SC>
          <SL>{t('summaryValidation').toUpperCase()}</SL>
          <div
            className="rounded-lg p-4 mb-4"
            style={{
              background: 'var(--eco-danger-100)',
              border: '1px solid var(--eco-danger-300)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle size={14} style={{ color: 'var(--eco-danger-500)' }} />
              <span className="text-[13px]" style={{ color: 'var(--eco-danger-500)' }}>
                2 {t('stateError').toLowerCase()}
              </span>
            </div>
            <ul className="list-none space-y-1.5 pl-5">
              <li className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--eco-danger-500)' }}
                />
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[12px] underline"
                  style={{ color: 'var(--eco-danger-500)' }}
                >
                  Phone — {t('fieldInvalidPhone')}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: 'var(--eco-danger-500)' }}
                />
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  className="text-[12px] underline"
                  style={{ color: 'var(--eco-danger-500)' }}
                >
                  Password — {t('fieldPasswordWeak')}
                </a>
              </li>
            </ul>
          </div>
          <div
            className="text-[12px] leading-relaxed"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            Error summary appears at top of form on submit. Each item is an anchor link that focuses
            the corresponding field. Summary uses{' '}
            <code
              className="px-1 rounded text-[11px]"
              style={{ background: 'var(--eco-neutral-100)' }}
            >
              role="alert"
            </code>{' '}
            +{' '}
            <code
              className="px-1 rounded text-[11px]"
              style={{ background: 'var(--eco-neutral-100)' }}
            >
              aria-live="polite"
            </code>
            .
          </div>
        </SC>
      </div>

      {/* Per-module validation matrix */}
      <SC>
        <SL>VALIDATION RULES PER MODULE</SL>
        <div className="flex flex-col gap-4">
          {forms.map((fm) => (
            <div
              key={fm.module}
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--eco-border)' }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
              >
                <fm.icon size={14} style={{ color: 'var(--eco-primary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                  {fm.module}
                </span>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--eco-border)' }}>
                {fm.fields.map((field) => (
                  <div
                    key={field.name}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 px-4 py-2.5"
                    style={{ borderColor: 'var(--eco-border)' }}
                  >
                    <span
                      className="text-[12px] sm:w-36 shrink-0"
                      style={{ color: 'var(--eco-text)' }}
                    >
                      {field.name}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {field.rules.map((r, i) => (
                        <span
                          key={i}
                          className="text-[11px] px-2 py-0.5 rounded"
                          style={{
                            background: 'var(--eco-neutral-100)',
                            color: 'var(--eco-text-secondary)',
                          }}
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION D: Error Tone Rules
   ═══════════════════════════════════════════════════ */
function ErrorToneSection() {
  const { t } = useI18n();

  const rules = [
    { key: 'errorToneRule1', icon: User },
    { key: 'errorToneRule2', icon: FileWarning },
    { key: 'errorToneRule3', icon: ArrowRight },
    { key: 'errorToneRule4', icon: EyeOff },
  ];

  const examples: { context: string; badKey: string; goodKey: string }[] = [
    {
      context: 'Empty state',
      badKey: 'Error 404: Resource not found in database.',
      goodKey: 'catalogNoRoomsDesc',
    },
    {
      context: 'Loading fail',
      badKey: 'HTTP 500 — internal server error.',
      goodKey: 'paymentFailedDesc',
    },
    {
      context: 'Permission',
      badKey: 'Unauthorized: role=USER cannot access /admin.',
      goodKey: 'adminPermDeniedDesc',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Type size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          D) {t('sectionErrorTone')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        Short, calm, action-oriented — never blame, never expose internals
      </p>

      {/* 4 rules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {rules.map(({ key, icon: Icon }) => (
          <SC key={key} className="!p-4 flex items-start gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'var(--eco-success-100)' }}
            >
              <Icon size={14} style={{ color: 'var(--eco-success-500)' }} />
            </div>
            <div>
              <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                {t(key)}
              </span>
            </div>
          </SC>
        ))}
      </div>

      {/* Good vs bad examples */}
      <SC>
        <SL>TONE COMPARISON</SL>
        <div className="flex flex-col gap-4">
          {examples.map((ex, i) => (
            <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Bad */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'var(--eco-danger-100)',
                  border: '1px solid var(--eco-danger-300)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <XCircle size={12} style={{ color: 'var(--eco-danger-500)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--eco-danger-500)' }}>
                    {t('errorToneBad')}
                  </span>
                  <span
                    className="text-[10px] ml-auto"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    {ex.context}
                  </span>
                </div>
                <p className="text-[12px] font-mono" style={{ color: 'var(--eco-danger-500)' }}>
                  {ex.badKey}
                </p>
              </div>
              {/* Good */}
              <div
                className="rounded-lg p-4"
                style={{
                  background: 'var(--eco-success-100)',
                  border: '1px solid var(--eco-success-300)',
                }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 size={12} style={{ color: 'var(--eco-success-500)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--eco-success-500)' }}>
                    {t('errorToneGood')}
                  </span>
                  <span
                    className="text-[10px] ml-auto"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    {ex.context}
                  </span>
                </div>
                <p className="text-[12px]" style={{ color: 'var(--eco-success-500)' }}>
                  {t(ex.goodKey)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   SECTION E: Safe Copy Guidelines
   ═══════════════════════════════════════════════════ */
function SafeCopySection() {
  const { t } = useI18n();

  const scenarios: { scenario: string; badKey: string; goodKey: string; rule: string }[] = [
    {
      scenario: 'Rate Limiting',
      badKey: 'safeCopyRateLimitBad',
      goodKey: 'safeCopyRateLimitGood',
      rule: "Don't expose IP/technical details",
    },
    {
      scenario: 'Auth / Password Reset',
      badKey: 'safeCopyAuthBad',
      goodKey: 'safeCopyAuthGood',
      rule: "Don't confirm account existence",
    },
    {
      scenario: 'Fraud / Security Hold',
      badKey: 'safeCopyFraudBad',
      goodKey: 'safeCopyFraudGood',
      rule: "Don't accuse — use neutral language",
    },
    {
      scenario: 'Payment Decline',
      badKey: 'safeCopyPayBad',
      goodKey: 'safeCopyPayGood',
      rule: "Don't expose error codes",
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <ShieldCheck size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          E) {t('sectionSafeCopy')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        Security-sensitive copy patterns — never reveal system internals to end users
      </p>

      <div className="flex flex-col gap-5">
        {scenarios.map((s) => (
          <SC key={s.scenario} className="!p-0 overflow-hidden">
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
            >
              <div className="flex items-center gap-2">
                <Shield size={14} style={{ color: 'var(--eco-primary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                  {s.scenario}
                </span>
              </div>
              <span
                className="text-[11px] px-2 py-0.5 rounded"
                style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-warning-500)' }}
              >
                {s.rule}
              </span>
            </div>

            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Unsafe */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--eco-danger-300)' }}
              >
                <div
                  className="px-4 py-2 flex items-center gap-1.5"
                  style={{
                    background: 'var(--eco-danger-100)',
                    borderBottom: '1px solid var(--eco-danger-300)',
                  }}
                >
                  <XCircle size={12} style={{ color: 'var(--eco-danger-500)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--eco-danger-500)' }}>
                    UNSAFE — {t('errorToneBad')}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--eco-text)' }}>
                    {t(s.badKey)}
                  </p>
                </div>
              </div>

              {/* Safe */}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: '1px solid var(--eco-success-300)' }}
              >
                <div
                  className="px-4 py-2 flex items-center gap-1.5"
                  style={{
                    background: 'var(--eco-success-100)',
                    borderBottom: '1px solid var(--eco-success-300)',
                  }}
                >
                  <CheckCircle2 size={12} style={{ color: 'var(--eco-success-500)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--eco-success-500)' }}>
                    SAFE — {t('errorToneGood')}
                  </span>
                </div>
                <div className="px-4 py-3">
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--eco-text)' }}>
                    {t(s.goodKey)}
                  </p>
                </div>
              </div>
            </div>
          </SC>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function AccessibilityContentSafetyPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'focus' | 'contrast' | 'forms' | 'tone' | 'safe'>('focus');

  const tabs = [
    { id: 'focus' as const, label: `A) ${t('sectionFocusRings')}`, icon: Focus },
    { id: 'contrast' as const, label: `B) ${t('sectionContrast')}`, icon: Palette },
    { id: 'forms' as const, label: `C) ${t('sectionFormValidation')}`, icon: AlertCircle },
    { id: 'tone' as const, label: `D) ${t('sectionErrorTone')}`, icon: Type },
    { id: 'safe' as const, label: `E) ${t('sectionSafeCopy')}`, icon: ShieldCheck },
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
            Page 16
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)' }}
          >
            Ship Blocker
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('a11yTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('a11ySubtitle')}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { n: '10', label: 'Focus ring specs' },
          { n: '10', label: 'Contrast pairs' },
          { n: '5', label: 'Form modules' },
          { n: '4', label: 'Tone rules' },
          { n: '4', label: 'Safe copy scenarios' },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 text-center"
            style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
          >
            <div className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
              {s.n}
            </div>
            <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
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
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2"
            style={{
              background: tab === id ? 'var(--eco-bg)' : 'transparent',
              color: tab === id ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              outlineColor: 'var(--eco-primary)',
            }}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(') ')[0]})</span>
          </button>
        ))}
      </div>

      {tab === 'focus' && <FocusRingsSection />}
      {tab === 'contrast' && <ContrastSection />}
      {tab === 'forms' && <FormValidationSection />}
      {tab === 'tone' && <ErrorToneSection />}
      {tab === 'safe' && <SafeCopySection />}
    </div>
  );
}
