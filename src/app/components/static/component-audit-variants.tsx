import { useState, useMemo } from 'react';
import { useI18n } from '../i18n-provider';
import { Badge, Button } from '../ds-primitives';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Ban,
  Bell,
  Bookmark,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileWarning,
  Filter,
  Hourglass,
  Info,
  Loader2,
  MoreHorizontal,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldAlert,
  SlidersHorizontal,
  Trash2,
  Upload,
  X,
  XCircle,
  AlertTriangle,
  Zap,
  MessageSquare,
  LayoutList,
  Table2,
  FileCheck2,
  GitBranch,
  Megaphone,
  Archive,
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
function VLabel({ children }: { children: string }) {
  return (
    <span
      className="text-[10px] px-1.5 py-0.5 rounded"
      style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════
   A: PAGINATION, SORTING, FILTER CHIPS, SAVED FILTERS
   ═══════════════════════════════════════════════════ */
function PaginationSection() {
  const { t } = useI18n();
  const [page, setPage] = useState(3);
  const totalPages = 12;

  const [sort, setSort] = useState('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [activeFilters, setActiveFilters] = useState<string[]>(['Beeline', 'ACTIVE']);
  const allFilterChips = [
    { key: 'Beeline', group: t('filterChipOperator') },
    { key: 'Activ', group: t('filterChipOperator') },
    { key: 'Kcell', group: t('filterChipOperator') },
    { key: 'ACTIVE', group: t('filterChipStatus') },
    { key: 'OPEN', group: t('filterChipStatus') },
    { key: '3000–5000 ₸', group: t('filterChipPriceRange') },
  ];

  const savedFilters = [
    { name: 'Beeline active rooms', chips: ['Beeline', 'ACTIVE'] },
    { name: 'Budget rooms', chips: ['3000–5000 ₸', 'OPEN'] },
  ];

  const sortOptions = [
    { value: 'price', label: t('sortPrice') },
    { value: 'date', label: t('sortDate') },
    { value: 'rating', label: t('sortRating') },
    { value: 'members', label: t('sortMembers') },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <LayoutList size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          A) {t('sectionPagination')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        Catalog + Admin lists — pagination, sorting, filter chips, saved filters
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        {/* Pagination */}
        <SC>
          <SL>PAGINATION COMPONENT</SL>
          <div className="flex flex-col gap-5">
            {/* Standard */}
            <div>
              <VLabel>Standard</VLabel>
              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {t('sortDate')} {page * 10 - 9}–{page * 10} {t('paginationOf')} 120
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{
                      border: '1px solid var(--eco-border)',
                      color: page === 1 ? 'var(--eco-neutral-300)' : 'var(--eco-text)',
                    }}
                    disabled={page === 1}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {[1, 2, 3, null, 11, 12].map((p, i) =>
                    p === null ? (
                      <span
                        key={`e${i}`}
                        className="text-[12px] px-1"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => setPage(p)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[12px] cursor-pointer"
                        style={{
                          background: page === p ? 'var(--eco-primary)' : 'transparent',
                          color:
                            page === p ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                          border: page === p ? 'none' : '1px solid var(--eco-border)',
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
                    style={{
                      border: '1px solid var(--eco-border)',
                      color: page === totalPages ? 'var(--eco-neutral-300)' : 'var(--eco-text)',
                    }}
                    disabled={page === totalPages}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact */}
            <div>
              <VLabel>Compact (mobile)</VLabel>
              <div className="flex items-center justify-center gap-3 mt-3">
                <button
                  className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
                  style={{
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text-secondary)',
                  }}
                >
                  <ChevronLeft size={14} className="inline mr-1" />
                  {t('paginationPrev')}
                </button>
                <span className="text-[12px] tabular-nums" style={{ color: 'var(--eco-text)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer"
                  style={{
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text-secondary)',
                  }}
                >
                  {t('paginationNext')}
                  <ChevronRight size={14} className="inline ml-1" />
                </button>
              </div>
            </div>

            {/* Load more */}
            <div>
              <VLabel>Load more</VLabel>
              <div className="flex flex-col items-center gap-2 mt-3">
                <div
                  className="h-1 w-full rounded-full"
                  style={{ background: 'var(--eco-neutral-200)' }}
                >
                  <div
                    className="h-1 rounded-full"
                    style={{ background: 'var(--eco-primary)', width: '25%' }}
                  />
                </div>
                <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  30 {t('paginationOf')} 120
                </span>
                <Button variant="secondary" size="sm">
                  Load more
                </Button>
              </div>
            </div>
          </div>
        </SC>

        {/* Sorting */}
        <SC>
          <SL>SORTING COMPONENT</SL>
          <div className="flex flex-col gap-4">
            <VLabel>Sort bar</VLabel>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('sortBy')}:
              </span>
              {sortOptions.map((o) => (
                <button
                  key={o.value}
                  onClick={() => {
                    if (sort === o.value) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
                    else {
                      setSort(o.value);
                      setSortDir('desc');
                    }
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors"
                  style={{
                    background: sort === o.value ? 'var(--eco-primary)' : 'var(--eco-bg)',
                    color:
                      sort === o.value ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                    border: sort === o.value ? 'none' : '1px solid var(--eco-border)',
                  }}
                >
                  {o.label}
                  {sort === o.value ? (
                    sortDir === 'asc' ? (
                      <ArrowUp size={12} />
                    ) : (
                      <ArrowDown size={12} />
                    )
                  ) : (
                    <ArrowUpDown size={11} />
                  )}
                </button>
              ))}
            </div>

            <VLabel>Column header sort</VLabel>
            <div
              className="rounded-lg overflow-hidden mt-1"
              style={{ border: '1px solid var(--eco-border)' }}
            >
              <div className="flex" style={{ background: 'var(--eco-bg)' }}>
                {['Room', t('sortPrice'), t('sortMembers'), t('sortDate')].map((col, i) => (
                  <div
                    key={col}
                    className="flex items-center gap-1 px-3 py-2 text-[11px] cursor-pointer flex-1"
                    style={{
                      color: i === 1 ? 'var(--eco-primary)' : 'var(--eco-text-tertiary)',
                      borderBottom: '1px solid var(--eco-border)',
                    }}
                  >
                    {col}
                    {i === 1 ? <ArrowDown size={10} /> : <ArrowUpDown size={10} />}
                  </div>
                ))}
              </div>
              {[1, 2].map((r) => (
                <div
                  key={r}
                  className="flex"
                  style={{ borderBottom: '1px solid var(--eco-border)' }}
                >
                  <div
                    className="px-3 py-2 text-[12px] flex-1"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    Room #{r}
                  </div>
                  <div
                    className="px-3 py-2 text-[12px] flex-1"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {r * 2500} ₸
                  </div>
                  <div
                    className="px-3 py-2 text-[12px] flex-1"
                    style={{ color: 'var(--eco-text)' }}
                  >
                    {r + 2}/5
                  </div>
                  <div
                    className="px-3 py-2 text-[12px] flex-1"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    2026-04-0{r}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SC>
      </div>

      {/* Filter chips + saved */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <SC>
          <SL>FILTER CHIPS</SL>
          <div className="flex flex-wrap gap-2 mb-4">
            {allFilterChips.map((chip) => {
              const active = activeFilters.includes(chip.key);
              return (
                <button
                  key={chip.key}
                  onClick={() =>
                    setActiveFilters(
                      active
                        ? activeFilters.filter((f) => f !== chip.key)
                        : [...activeFilters, chip.key],
                    )
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] cursor-pointer transition-colors"
                  style={{
                    background: active ? 'var(--eco-primary)' : 'var(--eco-bg)',
                    color: active ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                    border: active ? 'none' : '1px solid var(--eco-border)',
                  }}
                >
                  {active && <Check size={12} />}
                  {chip.key}
                  {active && <X size={11} />}
                </button>
              );
            })}
            {activeFilters.length > 0 && (
              <button
                onClick={() => setActiveFilters([])}
                className="text-[12px] px-2 py-1.5 cursor-pointer"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                Clear all
              </button>
            )}
          </div>
          <div
            className="text-[11px] flex items-center gap-2 flex-wrap"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            <Filter size={11} /> Active:{' '}
            {activeFilters.length > 0 ? activeFilters.join(' + ') : 'None'}
          </div>
        </SC>

        <SC>
          <SL>{t('filterSaved').toUpperCase()}</SL>
          <div className="flex flex-col gap-3">
            {savedFilters.map((sf) => (
              <div
                key={sf.name}
                className="flex items-center justify-between rounded-lg p-3"
                style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
              >
                <div className="flex items-center gap-2">
                  <Bookmark size={13} style={{ color: 'var(--eco-primary)' }} />
                  <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                    {sf.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {sf.chips.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] px-1.5 py-0.5 rounded-full"
                      style={{
                        background: 'var(--eco-neutral-100)',
                        color: 'var(--eco-text-tertiary)',
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <button
              className="flex items-center gap-1.5 text-[12px] cursor-pointer mt-1"
              style={{ color: 'var(--eco-primary)' }}
            >
              <Save size={12} /> {t('filterSave')}
            </button>
          </div>
        </SC>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   B: TABLES
   ═══════════════════════════════════════════════════ */
function TablesSection() {
  const { t } = useI18n();
  const [density, setDensity] = useState<'dense' | 'comfortable'>('comfortable');
  const [selected, setSelected] = useState<number[]>([]);

  const rows = [
    {
      id: 1,
      name: 'Beeline Family 20GB',
      operator: 'Beeline',
      status: 'ACTIVE',
      members: '4/5',
      price: '3 500 ₸',
      date: '2026-03-15',
    },
    {
      id: 2,
      name: 'Activ Unlimited',
      operator: 'Activ',
      status: 'OPEN',
      members: '2/4',
      price: '5 200 ₸',
      date: '2026-03-28',
    },
    {
      id: 3,
      name: 'Kcell Team 50GB',
      operator: 'Kcell',
      status: 'COMPLETED',
      members: '5/5',
      price: '4 000 ₸',
      date: '2026-02-10',
    },
    {
      id: 4,
      name: 'Tele2 Budget Share',
      operator: 'Tele2',
      status: 'IN_VERIFICATION',
      members: '1/3',
      price: '2 800 ₸',
      date: '2026-04-01',
    },
    {
      id: 5,
      name: 'Altel Premium',
      operator: 'Altel',
      status: 'BLOCKED',
      members: '3/4',
      price: '6 900 ₸',
      date: '2026-01-20',
    },
  ];

  const allSelected = selected.length === rows.length;
  const toggleAll = () => setSelected(allSelected ? [] : rows.map((r) => r.id));
  const toggleRow = (id: number) =>
    setSelected(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);

  const statusVariant: Record<string, 'success' | 'info' | 'default' | 'warning' | 'danger'> = {
    ACTIVE: 'success',
    OPEN: 'info',
    COMPLETED: 'default',
    IN_VERIFICATION: 'warning',
    BLOCKED: 'danger',
  };

  const py = density === 'dense' ? 'py-1.5' : 'py-3';

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Table2 size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          B) {t('sectionTables')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        Dense / comfortable, sticky header, row actions, bulk select
      </p>

      <SC className="!p-0 overflow-hidden">
        {/* Toolbar */}
        <div
          className="flex items-center justify-between px-5 py-3 flex-wrap gap-3"
          style={{ borderBottom: '1px solid var(--eco-border)' }}
        >
          <div className="flex items-center gap-3">
            {/* Density toggle */}
            <div
              className="flex rounded-lg overflow-hidden"
              style={{ border: '1px solid var(--eco-border)' }}
            >
              {(['dense', 'comfortable'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDensity(d)}
                  className="px-3 py-1.5 text-[11px] cursor-pointer"
                  style={{
                    background: density === d ? 'var(--eco-primary)' : 'transparent',
                    color:
                      density === d ? 'var(--eco-text-on-primary)' : 'var(--eco-text-secondary)',
                  }}
                >
                  {d === 'dense' ? t('tableDense') : t('tableComfortable')}
                </button>
              ))}
            </div>
            {selected.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="info">
                  {selected.length} {t('tableBulkSelect').toLowerCase()}
                </Badge>
                <button
                  className="text-[11px] px-2 py-1 rounded cursor-pointer"
                  style={{ background: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)' }}
                >
                  <Archive size={11} className="inline mr-1" />
                  Archive
                </button>
                <button
                  className="text-[11px] px-2 py-1 rounded cursor-pointer"
                  style={{
                    background: 'var(--eco-neutral-100)',
                    color: 'var(--eco-text-secondary)',
                  }}
                >
                  <Download size={11} className="inline mr-1" />
                  Export
                </button>
              </div>
            )}
          </div>
          <div
            className="flex items-center gap-1 text-[10px]"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            <Badge variant="info">{t('tableStickyHeader')}</Badge>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0 z-10" style={{ background: 'var(--eco-bg)' }}>
              <tr>
                <th
                  className={`text-left px-4 ${py} w-10`}
                  style={{ borderBottom: '1px solid var(--eco-border)' }}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="cursor-pointer accent-[var(--eco-primary)]"
                  />
                </th>
                {['Room', 'Operator', 'Status', 'Members', 'Price', 'Date', t('tableActions')].map(
                  (h) => (
                    <th
                      key={h}
                      className={`text-left px-3 ${py}`}
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
              {rows.map((row) => (
                <tr
                  key={row.id}
                  className="transition-colors"
                  style={{
                    borderBottom: '1px solid var(--eco-border)',
                    background: selected.includes(row.id) ? 'var(--eco-brand-50)' : 'transparent',
                  }}
                >
                  <td className={`px-4 ${py}`}>
                    <input
                      type="checkbox"
                      checked={selected.includes(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="cursor-pointer accent-[var(--eco-primary)]"
                    />
                  </td>
                  <td className={`px-3 ${py}`} style={{ color: 'var(--eco-text)' }}>
                    {row.name}
                  </td>
                  <td className={`px-3 ${py}`} style={{ color: 'var(--eco-text-secondary)' }}>
                    {row.operator}
                  </td>
                  <td className={`px-3 ${py}`}>
                    <Badge variant={statusVariant[row.status] || 'default'}>{row.status}</Badge>
                  </td>
                  <td className={`px-3 ${py}`} style={{ color: 'var(--eco-text)' }}>
                    {row.members}
                  </td>
                  <td className={`px-3 ${py} tabular-nums`} style={{ color: 'var(--eco-text)' }}>
                    {row.price}
                  </td>
                  <td className={`px-3 ${py}`} style={{ color: 'var(--eco-text-tertiary)' }}>
                    {row.date}
                  </td>
                  <td className={`px-3 ${py}`}>
                    <div className="flex items-center gap-1">
                      <button
                        className="w-7 h-7 rounded flex items-center justify-center cursor-pointer"
                        style={{ color: 'var(--eco-text-secondary)' }}
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        className="w-7 h-7 rounded flex items-center justify-center cursor-pointer"
                        style={{ color: 'var(--eco-text-secondary)' }}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        className="w-7 h-7 rounded flex items-center justify-center cursor-pointer"
                        style={{ color: 'var(--eco-danger-500)' }}
                      >
                        <Trash2 size={13} />
                      </button>
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

/* ═══════════════════════════════════════════════════
   C: UPLOAD
   ═══════════════════════════════════════════════════ */
function UploadSection() {
  const { t } = useI18n();

  const variants: {
    variant: string;
    titleKey: string;
    descKey: string;
    icon: React.ElementType;
    iconColor: string;
    borderColor: string;
    borderStyle: string;
    bgColor: string;
    progress?: number;
  }[] = [
    {
      variant: 'Normal',
      titleKey: 'uploadNormal',
      descKey: 'uploadFormats',
      icon: Upload,
      iconColor: 'var(--eco-text-tertiary)',
      borderColor: 'var(--eco-border)',
      borderStyle: 'dashed',
      bgColor: 'var(--eco-bg)',
    },
    {
      variant: 'Drag hover',
      titleKey: 'uploadNormal',
      descKey: 'uploadFormats',
      icon: Upload,
      iconColor: 'var(--eco-primary)',
      borderColor: 'var(--eco-primary)',
      borderStyle: 'dashed',
      bgColor: 'var(--eco-brand-50)',
    },
    {
      variant: 'Uploading',
      titleKey: 'uploadScanning',
      descKey: 'uploadFormats',
      icon: Loader2,
      iconColor: 'var(--eco-warning-500)',
      borderColor: 'var(--eco-warning-300)',
      borderStyle: 'solid',
      bgColor: 'var(--eco-warning-100)',
      progress: 65,
    },
    {
      variant: 'Virus scan',
      titleKey: 'uploadScanning',
      descKey: 'uploadFormats',
      icon: Shield,
      iconColor: 'var(--eco-warning-500)',
      borderColor: 'var(--eco-warning-300)',
      borderStyle: 'solid',
      bgColor: 'var(--eco-warning-100)',
      progress: 100,
    },
    {
      variant: 'Success',
      titleKey: 'uploadSuccess',
      descKey: 'document.pdf — 2.3 MB',
      icon: FileCheck2,
      iconColor: 'var(--eco-success-500)',
      borderColor: 'var(--eco-success-300)',
      borderStyle: 'solid',
      bgColor: 'var(--eco-success-100)',
    },
    {
      variant: 'Error',
      titleKey: 'uploadError',
      descKey: 'uploadFormats',
      icon: FileWarning,
      iconColor: 'var(--eco-danger-500)',
      borderColor: 'var(--eco-danger-300)',
      borderStyle: 'solid',
      bgColor: 'var(--eco-danger-100)',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Upload size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          C) {t('sectionUpload')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        Normal / drag hover / uploading / virus scan pending / success / error
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {variants.map((v) => (
          <SC key={v.variant} className="!p-0 overflow-hidden">
            <div
              className="px-4 py-2 flex items-center justify-between"
              style={{ borderBottom: '1px solid var(--eco-border)', background: 'var(--eco-bg)' }}
            >
              <VLabel>{v.variant}</VLabel>
            </div>
            <div className="p-4">
              <div
                className="rounded-xl flex flex-col items-center justify-center text-center px-4 py-8 cursor-pointer transition-colors"
                style={{ background: v.bgColor, border: `2px ${v.borderStyle} ${v.borderColor}` }}
              >
                <div className="mb-3">
                  {v.icon === Loader2 ? (
                    <Loader2 size={28} className="animate-spin" style={{ color: v.iconColor }} />
                  ) : v.icon === Shield ? (
                    <div className="relative">
                      <Shield size={28} style={{ color: v.iconColor }} />
                      <Loader2
                        size={12}
                        className="animate-spin absolute -bottom-1 -right-1"
                        style={{ color: v.iconColor }}
                      />
                    </div>
                  ) : (
                    <v.icon size={28} style={{ color: v.iconColor }} />
                  )}
                </div>
                <div className="text-[13px] mb-1" style={{ color: v.iconColor }}>
                  {t(v.titleKey)}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {v.descKey.includes('.') ? v.descKey : t(v.descKey)}
                </div>
                {v.progress !== undefined && (
                  <div
                    className="w-full mt-3 h-1.5 rounded-full"
                    style={{ background: 'var(--eco-neutral-200)' }}
                  >
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${v.progress}%`,
                        background: v.progress === 100 ? v.iconColor : 'var(--eco-primary)',
                      }}
                    />
                  </div>
                )}
                {v.variant === 'Success' && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      className="text-[11px] px-2 py-1 rounded cursor-pointer"
                      style={{
                        background: 'var(--eco-neutral-100)',
                        color: 'var(--eco-text-secondary)',
                      }}
                    >
                      <Eye size={10} className="inline mr-1" />
                      Preview
                    </button>
                    <button
                      className="text-[11px] px-2 py-1 rounded cursor-pointer"
                      style={{
                        background: 'var(--eco-danger-100)',
                        color: 'var(--eco-danger-500)',
                      }}
                    >
                      <Trash2 size={10} className="inline mr-1" />
                      Remove
                    </button>
                  </div>
                )}
                {v.variant === 'Error' && (
                  <button
                    className="text-[11px] px-2 py-1 rounded cursor-pointer mt-3"
                    style={{ background: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)' }}
                  >
                    <RefreshCw size={10} className="inline mr-1" />
                    Retry
                  </button>
                )}
              </div>
            </div>
          </SC>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   D: STATUS TIMELINES
   ═══════════════════════════════════════════════════ */
function TimelineSection() {
  const { t } = useI18n();

  interface TLStep {
    label: string;
    desc: string;
    status: 'done' | 'current' | 'upcoming' | 'error';
    time?: string;
  }
  interface TLConfig {
    titleKey: string;
    icon: React.ElementType;
    steps: TLStep[];
  }

  const timelines: TLConfig[] = [
    {
      titleKey: 'timelinePayment',
      icon: CreditCard,
      steps: [
        {
          label: 'Payment initiated',
          desc: '3 500 ₸ via Kaspi',
          status: 'done',
          time: '03 Apr, 14:20',
        },
        { label: 'Hold confirmed', desc: 'Funds reserved', status: 'done', time: '03 Apr, 14:21' },
        {
          label: 'Owner confirmation',
          desc: 'Waiting for room owner',
          status: 'current',
          time: '03 Apr, 14:22',
        },
        { label: 'Access granted', desc: 'Plan credentials shared', status: 'upcoming' },
        { label: 'Complete', desc: '30-day cycle started', status: 'upcoming' },
      ],
    },
    {
      titleKey: 'timelineDispute',
      icon: Shield,
      steps: [
        {
          label: 'Dispute filed',
          desc: 'Reason: no access granted',
          status: 'done',
          time: '01 Apr, 10:00',
        },
        { label: 'Under review', desc: 'Admin assigned', status: 'done', time: '01 Apr, 11:30' },
        {
          label: 'Evidence requested',
          desc: 'Screenshots required',
          status: 'current',
          time: '02 Apr, 09:00',
        },
        { label: 'Decision', desc: 'Refund or rejection', status: 'upcoming' },
        { label: 'Resolved', desc: 'Case closed', status: 'upcoming' },
      ],
    },
    {
      titleKey: 'timelineVerification',
      icon: ShieldAlert,
      steps: [
        {
          label: 'Room created',
          desc: 'Beeline Family 20GB',
          status: 'done',
          time: '28 Mar, 16:00',
        },
        {
          label: 'Document upload',
          desc: 'Plan screenshot uploaded',
          status: 'done',
          time: '28 Mar, 16:05',
        },
        {
          label: 'Auto-check',
          desc: 'Operator match verified',
          status: 'done',
          time: '28 Mar, 16:06',
        },
        {
          label: 'Manual review',
          desc: 'Flagged: price mismatch',
          status: 'error',
          time: '29 Mar, 10:00',
        },
        { label: 'Published', desc: 'Room goes live', status: 'upcoming' },
      ],
    },
  ];

  const stepColor: Record<string, string> = {
    done: 'var(--eco-success-500)',
    current: 'var(--eco-primary)',
    upcoming: 'var(--eco-neutral-300)',
    error: 'var(--eco-danger-500)',
  };
  const stepBg: Record<string, string> = {
    done: 'var(--eco-success-100)',
    current: 'var(--eco-brand-50)',
    upcoming: 'var(--eco-neutral-100)',
    error: 'var(--eco-danger-100)',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <GitBranch size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          D) {t('sectionTimeline')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        Payments / Disputes / Verification — 3 timeline variants
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {timelines.map((tl) => (
          <SC key={tl.titleKey} className="!p-0 overflow-hidden">
            <div
              className="flex items-center gap-2 px-5 py-3"
              style={{ background: 'var(--eco-bg)', borderBottom: '1px solid var(--eco-border)' }}
            >
              <tl.icon size={14} style={{ color: 'var(--eco-primary)' }} />
              <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                {t(tl.titleKey)}
              </span>
            </div>
            <div className="p-5">
              <div className="flex flex-col">
                {tl.steps.map((step, i) => (
                  <div key={i} className="flex gap-3">
                    {/* Left: dot + line */}
                    <div className="flex flex-col items-center">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 z-10"
                        style={{
                          background: stepBg[step.status],
                          border: `2px solid ${stepColor[step.status]}`,
                        }}
                      >
                        {step.status === 'done' && (
                          <Check size={10} style={{ color: stepColor[step.status] }} />
                        )}
                        {step.status === 'current' && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ background: stepColor[step.status] }}
                          />
                        )}
                        {step.status === 'error' && (
                          <X size={10} style={{ color: stepColor[step.status] }} />
                        )}
                      </div>
                      {i < tl.steps.length - 1 && (
                        <div
                          className="w-0.5 flex-1 min-h-[24px]"
                          style={{
                            background:
                              i < tl.steps.length - 1 && tl.steps[i + 1].status !== 'upcoming'
                                ? stepColor['done']
                                : 'var(--eco-neutral-200)',
                          }}
                        />
                      )}
                    </div>
                    {/* Right: content */}
                    <div className={`pb-5 ${step.status === 'upcoming' ? 'opacity-50' : ''}`}>
                      <div
                        className="text-[13px]"
                        style={{
                          color:
                            step.status === 'error' ? 'var(--eco-danger-500)' : 'var(--eco-text)',
                        }}
                      >
                        {step.label}
                      </div>
                      <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {step.desc}
                      </div>
                      {step.time && (
                        <div
                          className="text-[10px] mt-0.5"
                          style={{ color: 'var(--eco-text-tertiary)' }}
                        >
                          <Clock size={9} className="inline mr-1" />
                          {step.time}
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

/* ═══════════════════════════════════════════════════
   E: BANNERS & TOASTS
   ═══════════════════════════════════════════════════ */
function BannersToastsSection() {
  const { t } = useI18n();
  const [dismissed, setDismissed] = useState<string[]>([]);

  const banners: {
    type: 'info' | 'warning' | 'blocking';
    labelKey: string;
    msgKey: string;
    icon: React.ElementType;
    bg: string;
    border: string;
    text: string;
    iconColor: string;
    dismissable: boolean;
  }[] = [
    {
      type: 'info',
      labelKey: 'bannerInfo',
      msgKey: 'bannerInfoMsg',
      icon: Info,
      bg: 'var(--eco-brand-50)',
      border: 'var(--eco-brand-200)',
      text: 'var(--eco-brand-600)',
      iconColor: 'var(--eco-brand-600)',
      dismissable: true,
    },
    {
      type: 'warning',
      labelKey: 'bannerWarning',
      msgKey: 'bannerWarnMsg',
      icon: AlertTriangle,
      bg: 'var(--eco-warning-100)',
      border: 'var(--eco-warning-300)',
      text: 'var(--eco-warning-500)',
      iconColor: 'var(--eco-warning-500)',
      dismissable: true,
    },
    {
      type: 'blocking',
      labelKey: 'bannerBlocking',
      msgKey: 'bannerBlockMsg',
      icon: Ban,
      bg: 'var(--eco-danger-100)',
      border: 'var(--eco-danger-300)',
      text: 'var(--eco-danger-500)',
      iconColor: 'var(--eco-danger-500)',
      dismissable: false,
    },
  ];

  const toasts: {
    type: 'success' | 'error' | 'warning' | 'info';
    titleKey: string;
    msgKey: string;
    icon: React.ElementType;
    iconColor: string;
    accentColor: string;
  }[] = [
    {
      type: 'success',
      titleKey: 'toastSuccess',
      msgKey: 'uploadSuccess',
      icon: CheckCircle2,
      iconColor: 'var(--eco-success-500)',
      accentColor: 'var(--eco-success-500)',
    },
    {
      type: 'error',
      titleKey: 'toastError',
      msgKey: 'paymentFailed',
      icon: XCircle,
      iconColor: 'var(--eco-danger-500)',
      accentColor: 'var(--eco-danger-500)',
    },
    {
      type: 'warning',
      titleKey: 'toastWarning',
      msgKey: 'bannerWarnMsg',
      icon: AlertTriangle,
      iconColor: 'var(--eco-warning-500)',
      accentColor: 'var(--eco-warning-500)',
    },
    {
      type: 'info',
      titleKey: 'toastInfo',
      msgKey: 'bannerInfoMsg',
      icon: Info,
      iconColor: 'var(--eco-brand-600)',
      accentColor: 'var(--eco-brand-600)',
    },
  ];

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <Megaphone size={16} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <h2 className="text-[20px]" style={{ color: 'var(--eco-text)' }}>
          E) {t('sectionBannersToasts')}
        </h2>
      </div>
      <p className="text-[13px] mb-6 ml-11" style={{ color: 'var(--eco-text-secondary)' }}>
        System banners (info / warning / blocking) + toasts taxonomy (4 types)
      </p>

      {/* Banners */}
      <SC className="mb-5">
        <SL>SYSTEM BANNERS</SL>
        <div className="flex flex-col gap-4">
          {banners.map((b) => {
            const isDismissed = dismissed.includes(b.type);
            return (
              <div key={b.type}>
                <VLabel>{t(b.labelKey)}</VLabel>
                {isDismissed ? (
                  <div
                    className="mt-2 text-center py-3 rounded-lg"
                    style={{ background: 'var(--eco-bg)', border: '1px dashed var(--eco-border)' }}
                  >
                    <button
                      onClick={() => setDismissed(dismissed.filter((d) => d !== b.type))}
                      className="text-[11px] cursor-pointer"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      <RefreshCw size={10} className="inline mr-1" />
                      Show again
                    </button>
                  </div>
                ) : (
                  <div
                    className="mt-2 flex items-start gap-3 rounded-xl px-4 py-3"
                    style={{ background: b.bg, border: `1px solid ${b.border}` }}
                  >
                    <b.icon size={16} className="mt-0.5 shrink-0" style={{ color: b.iconColor }} />
                    <div className="flex-1">
                      <div className="text-[12px]" style={{ color: b.text }}>
                        {t(b.labelKey)}
                      </div>
                      <div className="text-[12px] mt-0.5" style={{ color: b.text, opacity: 0.8 }}>
                        {t(b.msgKey)}
                      </div>
                      {b.type === 'blocking' && (
                        <button
                          className="text-[11px] mt-2 px-2 py-1 rounded cursor-pointer"
                          style={{ background: b.iconColor, color: '#fff' }}
                        >
                          Contact support
                        </button>
                      )}
                    </div>
                    {b.dismissable && (
                      <button
                        onClick={() => setDismissed([...dismissed, b.type])}
                        className="shrink-0 cursor-pointer"
                        style={{ color: b.text }}
                      >
                        <X size={14} />
                      </button>
                    )}
                    {!b.dismissable && (
                      <span
                        className="text-[10px] shrink-0 px-1.5 py-0.5 rounded"
                        style={{ background: b.iconColor, color: '#fff' }}
                      >
                        Non-dismissable
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SC>

      {/* Toasts */}
      <SC>
        <SL>TOAST TAXONOMY</SL>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {toasts.map((to) => (
            <div key={to.type}>
              <VLabel>{to.type}</VLabel>
              <div
                className="mt-2 rounded-xl overflow-hidden flex"
                style={{
                  background: 'var(--eco-surface)',
                  border: '1px solid var(--eco-border)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                }}
              >
                <div className="w-1 shrink-0" style={{ background: to.accentColor }} />
                <div className="flex items-start gap-3 p-3 flex-1">
                  <to.icon size={18} className="mt-0.5 shrink-0" style={{ color: to.iconColor }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                      {t(to.titleKey)}
                    </div>
                    <div
                      className="text-[11px] mt-0.5 truncate"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {t(to.msgKey)}
                    </div>
                  </div>
                  <button
                    className="shrink-0 cursor-pointer mt-0.5"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-1.5 pl-1">
                <div
                  className="w-full h-0.5 rounded-full"
                  style={{ background: 'var(--eco-neutral-200)' }}
                >
                  <div
                    className="h-0.5 rounded-full"
                    style={{
                      background: to.accentColor,
                      width: '60%',
                      transition: 'width 5s linear',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] shrink-0"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  5s auto
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Toast rules */}
        <div className="mt-5 rounded-lg p-4" style={{ background: 'var(--eco-bg)' }}>
          <SL>TOAST RULES</SL>
          <ul className="space-y-1.5 text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
            <li className="flex items-center gap-2">
              <Check size={11} style={{ color: 'var(--eco-success-500)' }} /> Max 3 toasts visible
              at a time (stack bottom-right)
            </li>
            <li className="flex items-center gap-2">
              <Check size={11} style={{ color: 'var(--eco-success-500)' }} /> Auto-dismiss: success
              3s, info 5s, warning 8s
            </li>
            <li className="flex items-center gap-2">
              <Check size={11} style={{ color: 'var(--eco-success-500)' }} /> Error toasts require
              manual dismiss
            </li>
            <li className="flex items-center gap-2">
              <Check size={11} style={{ color: 'var(--eco-success-500)' }} /> Hover pauses
              auto-dismiss countdown
            </li>
            <li className="flex items-center gap-2">
              <Check size={11} style={{ color: 'var(--eco-success-500)' }} />{' '}
              <code
                className="px-1 rounded text-[10px]"
                style={{ background: 'var(--eco-neutral-100)' }}
              >
                role="status"
              </code>{' '}
              +{' '}
              <code
                className="px-1 rounded text-[10px]"
                style={{ background: 'var(--eco-neutral-100)' }}
              >
                aria-live="polite"
              </code>{' '}
              for a11y
            </li>
          </ul>
        </div>
      </SC>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════ */
export function ComponentAuditPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'pagination' | 'tables' | 'upload' | 'timeline' | 'banners'>(
    'pagination',
  );

  const tabs = [
    { id: 'pagination' as const, label: `A) ${t('sectionPagination')}`, icon: LayoutList },
    { id: 'tables' as const, label: `B) ${t('sectionTables')}`, icon: Table2 },
    { id: 'upload' as const, label: `C) ${t('sectionUpload')}`, icon: Upload },
    { id: 'timeline' as const, label: `D) ${t('sectionTimeline')}`, icon: GitBranch },
    { id: 'banners' as const, label: `E) ${t('sectionBannersToasts')}`, icon: Megaphone },
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
            Page 17
          </span>
          <span
            className="text-[12px] px-2 py-0.5 rounded-full"
            style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-warning-500)' }}
          >
            Coverage Audit
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {t('compAuditTitle')}
        </h1>
        <p className="text-[16px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('compAuditSubtitle')}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {[
          { n: '5', label: 'Sections' },
          { n: '16', label: t('componentCount') },
          { n: '32', label: t('variantCount') },
          { n: '3', label: 'Timelines' },
          { n: '7', label: 'Banners + Toasts' },
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
            className="flex items-center gap-1.5 flex-1 min-w-0 px-3 py-2.5 rounded-lg text-[12px] transition-all cursor-pointer whitespace-nowrap"
            style={{
              background: tab === id ? 'var(--eco-bg)' : 'transparent',
              color: tab === id ? 'var(--eco-text)' : 'var(--eco-text-tertiary)',
              boxShadow: tab === id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(') ')[0]})</span>
          </button>
        ))}
      </div>

      {tab === 'pagination' && <PaginationSection />}
      {tab === 'tables' && <TablesSection />}
      {tab === 'upload' && <UploadSection />}
      {tab === 'timeline' && <TimelineSection />}
      {tab === 'banners' && <BannersToastsSection />}
    </div>
  );
}
