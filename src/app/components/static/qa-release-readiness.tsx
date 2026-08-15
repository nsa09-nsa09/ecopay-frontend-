import { useState } from 'react';
import { useI18n } from '../i18n-provider';
import { Badge, Button } from '../ds-primitives';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  DoorOpen,
  Eye,
  EyeOff,
  FileWarning,
  Globe2,
  Grid3X3,
  Info,
  Laptop,
  Lock,
  MessageSquareOff,
  Monitor,
  Phone,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  Tablet,
  X,
  XCircle,
  Clipboard,
  CheckSquare,
  Square,
  Zap,
  ClipboardCheck,
  Columns3,
  Languages,
  Activity,
  Rocket,
} from 'lucide-react';

/* ─── shared ─── */
const SC = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`rounded-xl p-6 ${className}`}
    style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
  >
    {children}
  </div>
);
const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="text-[11px] mb-3 tracking-wide" style={{ color: 'var(--eco-text-tertiary)' }}>
    {children}
  </div>
);
const VL = ({ children }: { children: React.ReactNode }) => (
  <span
    className="text-[10px] px-1.5 py-0.5 rounded"
    style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
  >
    {children}
  </span>
);

/* ═══════ A) COVERAGE MATRIX ═══════ */
function CoverageMatrixSection() {
  const { t } = useI18n();

  type S = 'pass' | 'na' | 'miss' | 'partial';
  const modules = ['Auth', 'Catalog', 'Rooms', 'Payments', 'Support', 'Admin'];
  const states = [
    { key: 'stateEmpty', label: t('stateEmpty') },
    { key: 'stateLoading', label: t('stateLoading') },
    { key: 'stateError', label: t('stateError') },
    { key: 'statePermission', label: t('statePermission') },
    { key: 'stateOffline', label: t('stateOffline') },
    { key: 'stateRateLimit', label: t('stateRateLimit') },
  ];

  const matrix: Record<string, S[]> = {
    Auth: ['pass', 'pass', 'pass', 'na', 'pass', 'pass'],
    Catalog: ['pass', 'pass', 'pass', 'na', 'pass', 'na'],
    Rooms: ['pass', 'pass', 'pass', 'pass', 'pass', 'na'],
    Payments: ['pass', 'pass', 'pass', 'pass', 'pass', 'pass'],
    Support: ['pass', 'pass', 'pass', 'na', 'pass', 'na'],
    Admin: ['pass', 'pass', 'pass', 'pass', 'pass', 'pass'],
  };

  const cellStyle: Record<S, { bg: string; text: string; label: string }> = {
    pass: { bg: 'var(--eco-success-100)', text: 'var(--eco-success-500)', label: '✓' },
    na: {
      bg: 'var(--eco-neutral-100)',
      text: 'var(--eco-text-tertiary)',
      label: t('notApplicable'),
    },
    miss: { bg: 'var(--eco-danger-100)', text: 'var(--eco-danger-500)', label: '✗' },
    partial: { bg: 'var(--eco-warning-100)', text: 'var(--eco-warning-500)', label: '~' },
  };

  const totals = { pass: 0, na: 0, miss: 0, partial: 0 };
  modules.forEach((m) => matrix[m].forEach((s) => totals[s]++));

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Grid3X3 size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          A) {t('sectionCovMatrix')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        6 Modules × 6 States = 36 cells
      </p>

      {/* Legend */}
      <div className="flex gap-4 flex-wrap mb-4">
        {(['pass', 'na', 'partial', 'miss'] as S[]).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <span
              className="w-5 h-5 rounded flex items-center justify-center text-[10px]"
              style={{ background: cellStyle[s].bg, color: cellStyle[s].text }}
            >
              {cellStyle[s].label}
            </span>
            <span className="text-[11px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {s === 'pass'
                ? t('covered')
                : s === 'na'
                  ? t('notApplicable')
                  : s === 'miss'
                    ? t('missingState')
                    : t('qaPartial')}
            </span>
          </div>
        ))}
      </div>

      <SC className="!p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--eco-bg)' }}>
                <th
                  className="text-left px-4 py-3 sticky left-0 z-10"
                  style={{
                    background: 'var(--eco-bg)',
                    borderBottom: '1px solid var(--eco-border)',
                    color: 'var(--eco-text-tertiary)',
                    minWidth: 100,
                  }}
                >
                  Module
                </th>
                {states.map((s) => (
                  <th
                    key={s.key}
                    className="text-center px-3 py-3"
                    style={{
                      borderBottom: '1px solid var(--eco-border)',
                      color: 'var(--eco-text-tertiary)',
                      minWidth: 80,
                    }}
                  >
                    {s.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((mod) => (
                <tr key={mod} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <td
                    className="px-4 py-3 sticky left-0"
                    style={{
                      background: 'var(--eco-surface)',
                      color: 'var(--eco-text)',
                      zIndex: 5,
                    }}
                  >
                    <span className="flex items-center gap-1.5">
                      {mod === 'Auth' && <Lock size={12} />}
                      {mod === 'Catalog' && <Globe2 size={12} />}
                      {mod === 'Rooms' && <DoorOpen size={12} />}
                      {mod === 'Payments' && <CreditCard size={12} />}
                      {mod === 'Support' && <Shield size={12} />}
                      {mod === 'Admin' && <ShieldCheck size={12} />}
                      {mod}
                    </span>
                  </td>
                  {matrix[mod].map((s, i) => {
                    const c = cellStyle[s];
                    return (
                      <td key={i} className="text-center px-3 py-3">
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-[11px]"
                          style={{ background: c.bg, color: c.text }}
                        >
                          {c.label}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ background: 'var(--eco-bg)' }}>
                <td
                  className="px-4 py-2.5 sticky left-0"
                  style={{
                    background: 'var(--eco-bg)',
                    color: 'var(--eco-text-tertiary)',
                    borderTop: '1px solid var(--eco-border)',
                  }}
                >
                  Total
                </td>
                {states.map((_, i) => {
                  const col = modules.map((m) => matrix[m][i]);
                  const passC = col.filter((x) => x === 'pass').length;
                  return (
                    <td
                      key={i}
                      className="text-center px-3 py-2.5 tabular-nums text-[11px]"
                      style={{
                        borderTop: '1px solid var(--eco-border)',
                        color: passC === 6 ? 'var(--eco-success-500)' : 'var(--eco-text-secondary)',
                      }}
                    >
                      {passC}/{col.length}
                    </td>
                  );
                })}
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Summary row */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ borderTop: '1px solid var(--eco-border)', background: 'var(--eco-bg)' }}
        >
          <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {totals.pass} {t('covered')} · {totals.na} {t('notApplicable')} · {totals.partial}{' '}
            {t('qaPartial')} · {totals.miss} {t('missingState')}
          </span>
          <Badge variant={totals.miss === 0 && totals.partial === 0 ? 'success' : 'warning'}>
            {totals.miss === 0 && totals.partial === 0
              ? `100% ${t('covered')}`
              : `${Math.round((totals.pass / 36) * 100)}%`}
          </Badge>
        </div>
      </SC>
    </div>
  );
}

/* ═══════ B) RESPONSIVE & OVERFLOW ═══════ */
function ResponsiveSection() {
  const { t } = useI18n();

  interface BPCheck {
    width: number;
    label: string;
    icon: React.ElementType;
    notes: string[];
  }

  const breakpoints: BPCheck[] = [
    {
      width: 1440,
      label: `${t('breakpointDesktop')} XL`,
      icon: Monitor,
      notes: [
        'Sidebar + 3-column catalog grid — max-width 1200px centered',
        'Table rows: all columns visible, no horizontal scroll',
        'Admin dashboard: 4-stat cards in row, chart + table side-by-side',
      ],
    },
    {
      width: 1280,
      label: `${t('breakpointDesktop')} MD`,
      icon: Laptop,
      notes: [
        'Catalog grid drops to 2 columns',
        'Room detail: info + members stack vertically below 1024px',
        'Admin sidebar collapses to icons at 1100px',
      ],
    },
    {
      width: 768,
      label: t('breakpointTablet'),
      icon: Tablet,
      notes: [
        'Navigation: hamburger replaces top nav links',
        'Tables: hide Date + Actions columns, add row-tap to expand',
        'Filter chips: horizontal scroll with fade edge',
        'Modals: fullscreen sheet from bottom',
      ],
    },
    {
      width: 390,
      label: t('breakpointMobile'),
      icon: Smartphone,
      notes: [
        'Catalog: single-column cards, operator logo left-aligned',
        'Room name: truncate at 24 chars with ellipsis (tooltip on tap)',
        'Payment amounts: right-aligned, no wrapping on ₸ symbol',
        'Bottom sheet: close via swipe-down or ✕ button',
        'Pagination: compact (prev/next only, no page numbers)',
      ],
    },
  ];

  const truncationRules = [
    {
      element: 'Room name',
      maxChars: 28,
      rule: 'text-overflow: ellipsis',
      where: 'Card title, table cell, breadcrumb',
    },
    {
      element: 'Operator name',
      maxChars: 16,
      rule: 'text-overflow: ellipsis',
      where: 'Badge, filter chip',
    },
    {
      element: 'User display name',
      maxChars: 20,
      rule: 'text-overflow: ellipsis',
      where: 'Member list, review author',
    },
    {
      element: 'Support ticket subject',
      maxChars: 40,
      rule: 'text-overflow: ellipsis',
      where: 'Ticket list row',
    },
    {
      element: 'Price with currency',
      maxChars: 12,
      rule: 'No truncation — use tabular-nums',
      where: 'All price displays',
    },
    {
      element: 'KZ string overflow',
      maxChars: 0,
      rule: 'word-break: break-word for KZ',
      where: 'All text containers',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Columns3 size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          B) {t('sectionResponsive')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        1440 / 1280 / 768 / 390 — worst-case layouts with overflow + truncation notes
      </p>

      {/* Breakpoint cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {breakpoints.map((bp) => (
          <SC key={bp.width} className="!p-0 overflow-hidden">
            <div
              className="flex items-center justify-between px-5 py-3"
              style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
            >
              <div className="flex items-center gap-2">
                <bp.icon size={14} style={{ color: 'var(--eco-primary)' }} />
                <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                  {bp.label}
                </span>
              </div>
              <span
                className="text-[11px] px-2 py-0.5 rounded tabular-nums"
                style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-text-secondary)' }}
              >
                {bp.width}px
              </span>
            </div>

            {/* Viewport preview */}
            <div className="px-5 pt-4 pb-2 flex justify-center">
              <div
                className="rounded-lg relative"
                style={{
                  width: `${Math.min(bp.width / 6, 240)}px`,
                  height: `${Math.min(bp.width / 9, 140)}px`,
                  border: '2px solid var(--eco-border)',
                  background: 'var(--eco-bg)',
                }}
              >
                {/* Mini wireframe */}
                <div className="absolute inset-2 flex flex-col gap-1">
                  <div
                    className="h-2 rounded-sm"
                    style={{ background: 'var(--eco-neutral-200)', width: '100%' }}
                  />
                  <div className="flex-1 flex gap-1">
                    {bp.width >= 1280 && (
                      <div
                        className="w-4 rounded-sm"
                        style={{ background: 'var(--eco-neutral-100)' }}
                      />
                    )}
                    <div className="flex-1 flex flex-wrap gap-0.5 content-start">
                      {Array.from({
                        length:
                          bp.width >= 1440 ? 6 : bp.width >= 1280 ? 4 : bp.width >= 768 ? 2 : 1,
                      }).map((_, i) => (
                        <div
                          key={i}
                          className="rounded-sm"
                          style={{
                            background: 'var(--eco-brand-50)',
                            width: bp.width >= 768 ? '45%' : '100%',
                            height: bp.width >= 768 ? 12 : 8,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-4">
              <ul className="space-y-1.5">
                {bp.notes.map((note, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12px]"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    <ChevronRight
                      size={11}
                      className="mt-0.5 shrink-0"
                      style={{ color: 'var(--eco-primary)' }}
                    />
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          </SC>
        ))}
      </div>

      {/* Truncation rules table */}
      <SC>
        <SL>{t('truncationRule').toUpperCase()} TABLE</SL>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--eco-bg)' }}>
                {['Element', 'Max chars', 'CSS Rule', 'Where applied'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2.5"
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
              {truncationRules.map((tr) => (
                <tr key={tr.element} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <td className="px-3 py-2.5" style={{ color: 'var(--eco-text)' }}>
                    {tr.element}
                  </td>
                  <td
                    className="px-3 py-2.5 tabular-nums"
                    style={{
                      color: tr.maxChars === 0 ? 'var(--eco-text-tertiary)' : 'var(--eco-text)',
                    }}
                  >
                    {tr.maxChars === 0 ? '—' : tr.maxChars}
                  </td>
                  <td className="px-3 py-2.5">
                    <code
                      className="text-[10px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-primary)' }}
                    >
                      {tr.rule}
                    </code>
                  </td>
                  <td className="px-3 py-2.5" style={{ color: 'var(--eco-text-secondary)' }}>
                    {tr.where}
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

/* ═══════ C) I18N STRESS TEST ═══════ */
function I18nStressSection() {
  const { t, language } = useI18n();

  const longStrings = [
    {
      key: 'adminPermDeniedDesc',
      ru: 'Нет прав для этого действия. Обратитесь к старшему админу.',
      kz: 'Бұл әрекетке құқық жоқ. Аға әкімшіге хабарласыңыз.',
      en: "You don't have permission. Contact a senior admin.",
    },
    {
      key: 'safeCopyFraudGood',
      ru: 'Для безопасности действие временно приостановлено. Обратитесь в поддержку.',
      kz: 'Қауіпсіздік үшін әрекет тоқтатылды. Қолдауға хабарласыңыз.',
      en: 'For your security, this action is paused. Contact support.',
    },
    {
      key: 'bannerInfoMsg',
      ru: 'Плановое обслуживание 5 апреля, 03:00–05:00. Сервис может быть недоступен.',
      kz: '5 сәуір 03:00–05:00 жоспарлы қызмет көрсету. Сервис қолжетімсіз болуы мүмкін.',
      en: 'Scheduled maintenance Apr 5, 03:00–05:00. Service may be unavailable.',
    },
  ];

  const dateFormats = [
    { locale: 'RU', example: '3 апреля 2026 г.', short: '03.04.2026', time: '14:35' },
    { locale: 'KZ', example: '2026 ж. 3 сәуір', short: '03.04.2026', time: '14:35' },
    { locale: 'EN', example: 'April 3, 2026', short: '04/03/2026', time: '2:35 PM' },
  ];

  const currencies = [
    {
      code: 'KZT',
      symbol: '₸',
      example: '3 500 ₸',
      large: '1 250 000 ₸',
      note: 'Space as thousands separator',
    },
    {
      code: 'USD',
      symbol: '$',
      example: '$7.50',
      large: '$2,500.00',
      note: 'Dot as decimal, comma as thousands',
    },
  ];

  const plurals = [
    {
      word: 'room (комната)',
      ru: '1 комната / 2 комнаты / 5 комнат',
      kz: '1 бөлме / 2 бөлме / 5 бөлме',
      en: '1 room / 2 rooms / 5 rooms',
    },
    {
      word: 'member (участник)',
      ru: '1 участник / 3 участника / 10 участников',
      kz: '1 қатысушы / 3 қатысушы / 10 қатысушы',
      en: '1 member / 3 members / 10 members',
    },
    {
      word: 'day (день)',
      ru: '1 день / 4 дня / 7 дней',
      kz: '1 күн / 4 күн / 7 күн',
      en: '1 day / 4 days / 7 days',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Languages size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          C) {t('sectionI18nStress')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        RU/KZ longest strings, number/date formats, KZT/USD, pluralization
      </p>

      {/* Longest strings */}
      <SC className="mb-5">
        <SL>{t('longestString').toUpperCase()} — OVERFLOW CHECK</SL>
        <div className="flex flex-col gap-4">
          {longStrings.map((s) => (
            <div
              key={s.key}
              className="rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--eco-border)' }}
            >
              <div
                className="px-4 py-2 flex items-center justify-between"
                style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
              >
                <code className="text-[10px]" style={{ color: 'var(--eco-primary)' }}>
                  {s.key}
                </code>
              </div>
              <div className="divide-y" style={{ borderColor: 'var(--eco-border)' }}>
                {(['ru', 'kz', 'en'] as const).map((lang) => (
                  <div
                    key={lang}
                    className="flex gap-3 px-4 py-2.5"
                    style={{
                      background: language === lang ? 'var(--eco-brand-50)' : 'transparent',
                    }}
                  >
                    <span
                      className="text-[10px] w-6 shrink-0 pt-0.5"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {lang.toUpperCase()}
                    </span>
                    <span className="text-[12px] flex-1" style={{ color: 'var(--eco-text)' }}>
                      {s[lang]}
                    </span>
                    <span
                      className="text-[10px] shrink-0 tabular-nums"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {s[lang].length}ch
                    </span>
                  </div>
                ))}
              </div>
              {/* Truncation demo */}
              <div
                className="px-4 py-2"
                style={{
                  background: 'var(--eco-warning-100)',
                  borderTop: '1px solid var(--eco-warning-300)',
                }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={11} style={{ color: 'var(--eco-warning-500)' }} />
                  <span className="text-[11px]" style={{ color: 'var(--eco-warning-500)' }}>
                    In 390px card (max 32ch visible):
                  </span>
                  <span
                    className="text-[11px] truncate max-w-[200px] inline-block"
                    style={{ color: 'var(--eco-warning-500)' }}
                  >
                    {s.kz}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SC>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Date formats */}
        <SC>
          <SL>{t('dateFormat').toUpperCase()}</SL>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--eco-bg)' }}>
                  {['Locale', 'Full', 'Short', 'Time'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2"
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
                {dateFormats.map((d) => (
                  <tr key={d.locale} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                    <td className="px-3 py-2" style={{ color: 'var(--eco-text)' }}>
                      {d.locale}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--eco-text)' }}>
                      {d.example}
                    </td>
                    <td
                      className="px-3 py-2 tabular-nums"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {d.short}
                    </td>
                    <td
                      className="px-3 py-2 tabular-nums"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {d.time}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SC>

        {/* Currency */}
        <SC>
          <SL>{t('currencyFormat').toUpperCase()}</SL>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ background: 'var(--eco-bg)' }}>
                  {['Code', 'Symbol', 'Normal', 'Large', 'Note'].map((h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2"
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
                {currencies.map((c) => (
                  <tr key={c.code} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                    <td className="px-3 py-2" style={{ color: 'var(--eco-text)' }}>
                      {c.code}
                    </td>
                    <td className="px-3 py-2 text-[16px]" style={{ color: 'var(--eco-primary)' }}>
                      {c.symbol}
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--eco-text)' }}>
                      {c.example}
                    </td>
                    <td className="px-3 py-2 tabular-nums" style={{ color: 'var(--eco-text)' }}>
                      {c.large}
                    </td>
                    <td
                      className="px-3 py-2 text-[11px]"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {c.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SC>
      </div>

      {/* Pluralization */}
      <SC>
        <SL>{t('pluralNotes').toUpperCase()}</SL>
        <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--eco-warning-100)' }}>
          <div className="flex items-start gap-2">
            <AlertTriangle
              size={13}
              className="mt-0.5 shrink-0"
              style={{ color: 'var(--eco-warning-500)' }}
            />
            <span className="text-[12px]" style={{ color: 'var(--eco-warning-500)' }}>
              Russian has 3 plural forms (1, 2–4, 5+). Kazakh is simpler (no plural inflection for
              counted nouns). English has 2 (1, other). Use ICU MessageFormat or equivalent.
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--eco-bg)' }}>
                {['Word', 'RU (3 forms)', 'KZ', 'EN (2 forms)'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-3 py-2"
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
              {plurals.map((p) => (
                <tr key={p.word} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <td className="px-3 py-2" style={{ color: 'var(--eco-text)' }}>
                    {p.word}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--eco-text-secondary)' }}>
                    {p.ru}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--eco-text-secondary)' }}>
                    {p.kz}
                  </td>
                  <td className="px-3 py-2" style={{ color: 'var(--eco-text-secondary)' }}>
                    {p.en}
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

/* ═══════ D) SECURITY UX CHECKS ═══════ */
function SecurityUxSection() {
  const { t } = useI18n();

  const piiFields = [
    {
      field: 'Phone number',
      masked: '+7 ••• ••• ••12',
      full: '+7 701 234 5612',
      where: 'Profile, Member list, Admin',
      revealReason: 'Admin: dispute investigation',
    },
    {
      field: 'Email',
      masked: 'u•••@example.com',
      full: 'user@example.com',
      where: 'Profile, Auth',
      revealReason: 'Admin: account recovery',
    },
    {
      field: 'Card number',
      masked: '•••• •••• •••• 4832',
      full: 'Never stored',
      where: 'Payment history',
      revealReason: 'N/A — only last 4 digits',
    },
    {
      field: 'IP address',
      masked: 'Never shown to users',
      full: '192.168.1.1',
      where: 'Admin logs only',
      revealReason: 'Admin: fraud review',
    },
    {
      field: 'Full name',
      masked: 'Ер•••в А.',
      full: 'Ержанов Алмас',
      where: 'Public profile',
      revealReason: 'Trusted member after room join',
    },
  ];

  const checklist = [
    {
      item: t('piiMasking'),
      desc: 'All PII masked by default in all views',
      status: 'pass' as const,
    },
    {
      item: t('revealWithReason'),
      desc: 'Admin must select reason before unmasking PII',
      status: 'pass' as const,
    },
    {
      item: t('noChatRule'),
      desc: 'No direct messaging — all communication via Support tickets or Disputes',
      status: 'pass' as const,
    },
    {
      item: 'Session timeout',
      desc: 'Auto-logout after 30 min inactivity; re-auth for payment actions',
      status: 'pass' as const,
    },
    {
      item: 'No clipboard auto-copy',
      desc: 'Sensitive data never auto-copied; explicit copy button with audit trail',
      status: 'pass' as const,
    },
    {
      item: 'Rate-limit messaging',
      desc: 'No IP/technical details in rate-limit errors (see Page 16)',
      status: 'pass' as const,
    },
    {
      item: 'Error sanitization',
      desc: 'No stack traces, SQL errors, or internal IDs exposed to users',
      status: 'pass' as const,
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
          D) {t('sectionSecurityUx')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        PII masking, reveal-with-reason audit, no user-to-user chat
      </p>

      {/* PII table */}
      <SC className="mb-5">
        <SL>{t('piiMasking').toUpperCase()} TABLE</SL>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: 'var(--eco-bg)' }}>
                {['Field', 'Masked (default)', 'Full value', 'Surfaces', 'Reveal reason'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-3 py-2.5"
                      style={{
                        color: 'var(--eco-text-tertiary)',
                        borderBottom: '1px solid var(--eco-border)',
                      }}
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {piiFields.map((f) => (
                <tr key={f.field} style={{ borderBottom: '1px solid var(--eco-border)' }}>
                  <td className="px-3 py-2.5" style={{ color: 'var(--eco-text)' }}>
                    <div className="flex items-center gap-1.5">
                      <EyeOff size={11} style={{ color: 'var(--eco-text-tertiary)' }} />
                      {f.field}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <code
                      className="text-[11px] px-1.5 py-0.5 rounded"
                      style={{ background: 'var(--eco-neutral-100)', color: 'var(--eco-text)' }}
                    >
                      {f.masked}
                    </code>
                  </td>
                  <td
                    className="px-3 py-2.5 text-[11px]"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    {f.full}
                  </td>
                  <td
                    className="px-3 py-2.5 text-[11px]"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    {f.where}
                  </td>
                  <td
                    className="px-3 py-2.5 text-[11px]"
                    style={{ color: 'var(--eco-warning-500)' }}
                  >
                    {f.revealReason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* Reveal flow */}
      <SC className="mb-5">
        <SL>{t('revealWithReason').toUpperCase()} — ADMIN FLOW</SL>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { step: '1', label: "Click 'Reveal'", icon: Eye },
            { step: '2', label: 'Select reason', icon: Clipboard },
            { step: '3', label: 'Confirm action', icon: CheckCircle2 },
            { step: '4', label: 'PII visible (30s)', icon: Clock },
            { step: '5', label: 'Auto-mask + audit log', icon: Lock },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex items-center gap-2">
              <div
                className="flex items-center gap-2 rounded-lg px-3 py-2"
                style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
              >
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{ background: 'var(--eco-primary)', color: 'var(--eco-text-on-primary)' }}
                >
                  {s.step}
                </div>
                <s.icon size={12} style={{ color: 'var(--eco-text-secondary)' }} />
                <span className="text-[11px]" style={{ color: 'var(--eco-text)' }}>
                  {s.label}
                </span>
              </div>
              {i < arr.length - 1 && (
                <ArrowRight size={14} style={{ color: 'var(--eco-neutral-300)' }} />
              )}
            </div>
          ))}
        </div>
      </SC>

      {/* Security checklist */}
      <SC>
        <SL>SECURITY UX CHECKLIST</SL>
        <div className="flex flex-col gap-2">
          {checklist.map((c) => (
            <div
              key={c.item}
              className="flex items-start gap-3 rounded-lg px-4 py-3"
              style={{ background: 'var(--eco-bg)' }}
            >
              <CheckCircle2
                size={14}
                className="mt-0.5 shrink-0"
                style={{ color: 'var(--eco-success-500)' }}
              />
              <div className="flex-1 min-w-0">
                <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                  {c.item}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {c.desc}
                </div>
              </div>
              <Badge variant="success">{t('qaPass')}</Badge>
            </div>
          ))}
        </div>
      </SC>
    </div>
  );
}

/* ══════�� E) CRITICAL JOURNEYS ═══════ */
function JourneysSection() {
  const { t } = useI18n();

  interface JStep {
    step: string;
    uiState: string;
    badge: 'info' | 'warning' | 'success' | 'danger' | 'default';
    recovery?: string;
  }
  interface Journey {
    titleKey: string;
    icon: React.ElementType;
    color: string;
    steps: JStep[];
  }

  const journeys: Journey[] = [
    {
      titleKey: 'journeyJoin',
      icon: DoorOpen,
      color: 'var(--eco-brand-600)',
      steps: [
        {
          step: 'Browse catalog → select room',
          uiState: 'Room detail: OPEN badge, Join button enabled',
          badge: 'info',
        },
        {
          step: "Click 'Join' → review terms",
          uiState: 'Bottom sheet: plan details + price + confirm checkbox',
          badge: 'info',
        },
        {
          step: 'Proceed to payment → enter card',
          uiState: 'Checkout page: 3 500 ₸, Kaspi/card selector',
          badge: 'warning',
        },
        {
          step: 'Payment processing',
          uiState: "Pending page: spinner + 'Do not close' message",
          badge: 'warning',
          recovery: "Auto-retry in 30s, or 'Retry now' button",
        },
        {
          step: 'Owner confirms → access granted',
          uiState: 'Status changes PENDING → ACTIVE, credentials revealed',
          badge: 'success',
        },
        {
          step: 'Payment fails',
          uiState: "Error card: 'Check card details or try another'",
          badge: 'danger',
          recovery: 'Retry button + change payment method link',
        },
      ],
    },
    {
      titleKey: 'journeyCreate',
      icon: CreditCard,
      color: 'var(--eco-success-500)',
      steps: [
        {
          step: "Click 'Create Room'",
          uiState: 'Form: operator selector, plan name, price, slots',
          badge: 'info',
        },
        {
          step: 'Upload plan screenshot',
          uiState: 'Upload zone → scanning → success',
          badge: 'warning',
        },
        {
          step: 'Submit for verification',
          uiState: "Status: IN_VERIFICATION badge, 'Under review' timeline",
          badge: 'warning',
          recovery: 'Edit button if rejected, support link',
        },
        {
          step: 'Admin approves',
          uiState: 'Status: ACTIVE, room visible in catalog',
          badge: 'success',
        },
        {
          step: 'Member joins → grant access',
          uiState: "Notification: 'New member'. Share credentials via secure field",
          badge: 'success',
        },
        {
          step: 'Verification rejected',
          uiState: "Status: REJECTED + reason + 'Edit & resubmit' CTA",
          badge: 'danger',
          recovery: "'Edit room' button to fix and resubmit",
        },
      ],
    },
    {
      titleKey: 'journeyDispute',
      icon: Shield,
      color: 'var(--eco-danger-500)',
      steps: [
        {
          step: 'Member files dispute',
          uiState: 'Dispute form: reason dropdown, description, file upload',
          badge: 'info',
        },
        {
          step: 'Admin assigned',
          uiState: "Timeline: 'Under review' step active, assigned admin shown",
          badge: 'warning',
        },
        {
          step: 'Evidence requested',
          uiState: 'Notification to both parties: upload screenshots within 48h',
          badge: 'warning',
          recovery: '48h SLA timer visible, reminder notification at 24h',
        },
        {
          step: 'Admin decides: refund',
          uiState: "Decision card: 'Refund approved', amount + timeline",
          badge: 'success',
        },
        {
          step: 'Refund processed',
          uiState: 'Payment history: REFUNDED badge, amount returned',
          badge: 'success',
        },
        {
          step: 'Admin decides: reject',
          uiState: "Decision card: reason, 'Case closed', appeal link",
          badge: 'danger',
          recovery: "'Appeal' button → re-opens with senior admin",
        },
      ],
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Activity size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          E) {t('sectionJourneys')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        3 critical flows — steps + {t('expectedUi').toLowerCase()} +{' '}
        {t('recoveryCta').toLowerCase()}
      </p>

      <div className="flex flex-col gap-6">
        {journeys.map((j) => (
          <SC key={j.titleKey} className="!p-0 overflow-hidden">
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
            >
              <j.icon size={14} style={{ color: j.color }} />
              <span className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                {t(j.titleKey)}
              </span>
            </div>

            <div className="p-5">
              <div className="flex flex-col">
                {j.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    {/* Timeline dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[10px] z-10"
                        style={{
                          background:
                            step.badge === 'success'
                              ? 'var(--eco-success-100)'
                              : step.badge === 'danger'
                                ? 'var(--eco-danger-100)'
                                : step.badge === 'warning'
                                  ? 'var(--eco-warning-100)'
                                  : 'var(--eco-brand-50)',
                          border: `2px solid ${step.badge === 'success' ? 'var(--eco-success-500)' : step.badge === 'danger' ? 'var(--eco-danger-500)' : step.badge === 'warning' ? 'var(--eco-warning-500)' : 'var(--eco-brand-600)'}`,
                          color:
                            step.badge === 'success'
                              ? 'var(--eco-success-500)'
                              : step.badge === 'danger'
                                ? 'var(--eco-danger-500)'
                                : step.badge === 'warning'
                                  ? 'var(--eco-warning-500)'
                                  : 'var(--eco-brand-600)',
                        }}
                      >
                        {i + 1}
                      </div>
                      {i < j.steps.length - 1 && (
                        <div
                          className="w-0.5 flex-1 min-h-[16px]"
                          style={{ background: 'var(--eco-neutral-200)' }}
                        />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          {step.step}
                        </span>
                        <Badge variant={step.badge}>
                          {step.badge === 'success'
                            ? 'Happy path'
                            : step.badge === 'danger'
                              ? 'Error path'
                              : step.badge === 'warning'
                                ? 'Waiting'
                                : 'Action'}
                        </Badge>
                      </div>
                      <div
                        className="mt-1 rounded-lg px-3 py-2 text-[12px]"
                        style={{
                          background: 'var(--eco-bg)',
                          border: '1px solid var(--eco-border)',
                          color: 'var(--eco-text-secondary)',
                        }}
                      >
                        <span className="text-[10px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {t('expectedUi')}:
                        </span>
                        <br />
                        {step.uiState}
                      </div>
                      {step.recovery && (
                        <div
                          className="mt-1.5 flex items-start gap-1.5 text-[11px]"
                          style={{ color: 'var(--eco-warning-500)' }}
                        >
                          <Zap size={11} className="mt-0.5 shrink-0" />
                          <span>
                            <strong>{t('recoveryCta')}:</strong> {step.recovery}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </SC>
        ))}
      </div>
    </div>
  );
}

/* ═══════ F) ACCEPTANCE CRITERIA ═══════ */
function AcceptanceSection() {
  const { t } = useI18n();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const toggle = (key: string) => setChecks({ ...checks, [key]: !checks[key] });

  const items = [
    { key: 'dodItem1', icon: Grid3X3 },
    { key: 'dodItem2', icon: Columns3 },
    { key: 'dodItem3', icon: Languages },
    { key: 'dodItem4', icon: ShieldCheck },
    { key: 'dodItem5', icon: Activity },
    { key: 'dodItem6', icon: Eye },
    { key: 'dodItem7', icon: Zap },
    { key: 'dodItem8', icon: MessageSquareOff },
  ];

  const checked = Object.values(checks).filter(Boolean).length;
  const total = items.length;
  const allPassed = checked === total;

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Rocket size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          F) {t('sectionAcceptance')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('mvpDod')} — interactive checklist
      </p>

      <SC>
        {/* Progress */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex-1 h-2 rounded-full" style={{ background: 'var(--eco-neutral-200)' }}>
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(checked / total) * 100}%`,
                background: allPassed ? 'var(--eco-success-500)' : 'var(--eco-primary)',
              }}
            />
          </div>
          <span
            className="text-[13px] tabular-nums"
            style={{ color: allPassed ? 'var(--eco-success-500)' : 'var(--eco-text)' }}
          >
            {checked}/{total}
          </span>
          {allPassed && <Badge variant="success">READY TO SHIP</Badge>}
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-2">
          {items.map(({ key, icon: Icon }) => {
            const isChecked = checks[key] || false;
            return (
              <button
                key={key}
                onClick={() => toggle(key)}
                className="flex items-center gap-3 rounded-xl px-4 py-3 text-left cursor-pointer transition-colors"
                style={{
                  background: isChecked ? 'var(--eco-success-100)' : 'var(--eco-bg)',
                  border: `1px solid ${isChecked ? 'var(--eco-success-300)' : 'var(--eco-border)'}`,
                }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center shrink-0"
                  style={{
                    background: isChecked ? 'var(--eco-success-500)' : 'transparent',
                    border: isChecked ? 'none' : '2px solid var(--eco-neutral-300)',
                  }}
                >
                  {isChecked && <Check size={12} color="#fff" />}
                </div>
                <Icon
                  size={14}
                  style={{
                    color: isChecked ? 'var(--eco-success-500)' : 'var(--eco-text-tertiary)',
                  }}
                />
                <span
                  className="text-[13px] flex-1"
                  style={{
                    color: isChecked ? 'var(--eco-success-500)' : 'var(--eco-text)',
                    textDecoration: isChecked ? 'line-through' : 'none',
                  }}
                >
                  {t(key)}
                </span>
                {isChecked ? (
                  <Badge variant="success">{t('qaPass')}</Badge>
                ) : (
                  <Badge variant="default">Pending</Badge>
                )}
              </button>
            );
          })}
        </div>

        {/* Sign-off */}
        {allPassed && (
          <div
            className="mt-5 rounded-xl p-5 text-center"
            style={{
              background: 'var(--eco-success-100)',
              border: '1px solid var(--eco-success-300)',
            }}
          >
            <CheckCircle2
              size={32}
              className="mx-auto mb-2"
              style={{ color: 'var(--eco-success-500)' }}
            />
            <div className="text-[16px] mb-1" style={{ color: 'var(--eco-success-500)' }}>
              All checks passed
            </div>
            <div className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
              MVP design-side Definition of Done is complete. Ready for dev handoff.
            </div>
          </div>
        )}
      </SC>
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export function QaReleaseReadinessPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<
    'matrix' | 'responsive' | 'i18n' | 'security' | 'journeys' | 'acceptance'
  >('matrix');

  const tabs = [
    { id: 'matrix' as const, label: `A) ${t('sectionCovMatrix')}`, icon: Grid3X3 },
    { id: 'responsive' as const, label: `B) ${t('sectionResponsive')}`, icon: Columns3 },
    { id: 'i18n' as const, label: `C) ${t('sectionI18nStress')}`, icon: Languages },
    { id: 'security' as const, label: `D) ${t('sectionSecurityUx')}`, icon: ShieldCheck },
    { id: 'journeys' as const, label: `E) ${t('sectionJourneys')}`, icon: Activity },
    { id: 'acceptance' as const, label: `F) ${t('sectionAcceptance')}`, icon: Rocket },
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
            Page 20
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-success-100)', color: 'var(--eco-success-500)' }}
          >
            Release Readiness
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('qaTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('qaSubtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-8">
        {[
          { n: '36', label: 'Matrix cells' },
          { n: '4', label: 'Breakpoints' },
          { n: '3', label: 'Languages' },
          { n: '7', label: 'Security checks' },
          { n: '3', label: 'Journeys' },
          { n: '8', label: 'DoD items' },
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
      <div
        className="flex gap-1 mb-8 p-1 rounded-xl overflow-x-auto"
        style={{ background: 'var(--eco-surface)' }}
      >
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: tab === id ? 'var(--eco-bg)' : 'transparent',
              color: tab === id ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Icon size={13} />
            <span className="hidden md:inline">{label}</span>
            <span className="md:hidden">{label.split(') ')[0]})</span>
          </button>
        ))}
      </div>

      {tab === 'matrix' && <CoverageMatrixSection />}
      {tab === 'responsive' && <ResponsiveSection />}
      {tab === 'i18n' && <I18nStressSection />}
      {tab === 'security' && <SecurityUxSection />}
      {tab === 'journeys' && <JourneysSection />}
      {tab === 'acceptance' && <AcceptanceSection />}
    </div>
  );
}
