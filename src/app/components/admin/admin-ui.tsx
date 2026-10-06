import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  Info,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Button, Modal, Skeleton } from '../ds-primitives';
import { useI18n } from '../i18n-provider';

/*
 * Shared admin presentation primitives.
 *
 * Type scale (the only sizes admin screens should use):
 *   page title 20px · section title 15px · body 13px · meta 12px
 * Row height: 44px (ADMIN_ROW_HEIGHT) for table rows and list rows.
 *
 * Horizontal page padding is owned by AdminLayout's <main>; AdminPage owns the
 * max-width and the vertical rhythm between sections.
 */

export const ADMIN_ROW_HEIGHT = 44;

const MOBILE_QUERY = '(max-width: 767.98px)';

/** True below 768px. Initialised synchronously so the first paint is right. */
export function useAdminIsMobile(): boolean {
  const [mobile, setMobile] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(MOBILE_QUERY).matches
      : false,
  );
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(mql.matches);
    update();
    mql.addEventListener('change', update);
    return () => mql.removeEventListener('change', update);
  }, []);
  return mobile;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function AdminPage({
  children,
  width = 'default',
  className = '',
}: {
  children: ReactNode;
  /** default = 1100px reading width, wide = 1400px for dense tables, full = no cap. */
  width?: 'narrow' | 'default' | 'wide' | 'full';
  className?: string;
}) {
  const max =
    width === 'narrow'
      ? 'max-w-[760px]'
      : width === 'wide'
        ? 'max-w-[1400px]'
        : width === 'full'
          ? 'max-w-none'
          : 'max-w-[1100px]';
  return (
    <div className={`eco-admin-page w-full min-w-0 ${max} flex flex-col gap-5 ${className}`}>
      {children}
    </div>
  );
}

export interface AdminBreadcrumb {
  label: string;
  to?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  meta,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  breadcrumbs?: AdminBreadcrumb[];
  /** Right-hand slot; wraps below the title on narrow screens. */
  actions?: ReactNode;
  /** Small inline note rendered next to the actions (e.g. "immutable log"). */
  meta?: ReactNode;
}) {
  const { t } = useI18n();
  return (
    <header className="flex flex-col gap-1.5 min-w-0">
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label={t('adminBreadcrumbs')}>
          <ol className="flex flex-wrap items-center gap-1 text-[12px]">
            {breadcrumbs.map((crumb, index) => (
              <li key={`${crumb.label}-${index}`} className="flex items-center gap-1 min-w-0">
                {index > 0 && (
                  <ChevronRight
                    size={12}
                    aria-hidden
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  />
                )}
                {crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="truncate hover:underline"
                    style={{ color: 'var(--eco-text-secondary)', textDecoration: 'none' }}
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {crumb.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-[1_1_240px]">
          <h1
            className="text-[20px] leading-7 font-semibold break-words"
            style={{ color: 'var(--eco-text)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-[13px] mt-0.5" style={{ color: 'var(--eco-text-secondary)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {(actions || meta) && (
          <div className="flex flex-wrap items-center gap-2 min-w-0 max-w-full">
            {meta && (
              <div
                className="flex items-center gap-1.5 text-[12px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                {meta}
              </div>
            )}
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/** Standard refresh button for page headers. */
export function AdminRefreshButton({
  onClick,
  loading,
}: {
  onClick: () => void;
  loading?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Button variant="secondary" size="sm" onClick={onClick} disabled={loading}>
      <RefreshCw size={13} className={loading ? 'animate-spin' : undefined} aria-hidden />
      {t('adminRefresh')}
    </Button>
  );
}

// ─── Toolbar ────────────────────────────────────────────────────────────────

export function AdminToolbar({
  children,
  className = '',
  bare = false,
}: {
  children: ReactNode;
  className?: string;
  /** Render without the card surface (for toolbars nested inside a card). */
  bare?: boolean;
}) {
  return (
    <div
      role="toolbar"
      className={`flex flex-wrap items-end gap-x-3 gap-y-2.5 min-w-0 ${bare ? '' : 'rounded-xl px-4 py-3'} ${className}`}
      style={
        bare
          ? undefined
          : { background: 'var(--eco-surface-raised)', border: '1px solid var(--eco-border)' }
      }
    >
      {children}
    </div>
  );
}

/** A labelled segmented control (radio group) for small enum filters. */
export function AdminSegmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label?: string;
  value: T;
  options: { value: T; label: string; count?: number }[];
  onChange: (value: T) => void;
}) {
  const groupId = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (event: ReactKeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  };
  return (
    <div className="flex flex-col gap-1.5 min-w-0 max-w-full">
      {label && (
        <span id={groupId} className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {label}
        </span>
      )}
      <div
        role="radiogroup"
        aria-labelledby={label ? groupId : undefined}
        className="inline-flex flex-wrap gap-1 p-1 rounded-lg max-w-full"
        style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
      >
        {options.map((option, index) => {
          const active = option.value === value;
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className="px-2.5 py-1 rounded-md text-[12px] cursor-pointer whitespace-nowrap transition-colors"
              style={{
                background: active ? 'var(--eco-surface-raised)' : 'transparent',
                color: active ? 'var(--eco-text)' : 'var(--eco-text-secondary)',
                boxShadow: active ? '0 1px 2px rgba(19, 19, 38, 0.08)' : undefined,
                border: 'none',
                fontWeight: active ? 600 : 400,
              }}
            >
              {option.label}
              {option.count !== undefined && (
                <span className="ml-1 tabular-nums" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {option.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Card ───────────────────────────────────────────────────────────────────

export function AdminCard({
  title,
  description,
  actions,
  footer,
  children,
  padded = true,
  className = '',
  style,
  id,
}: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** false = body has no inner padding (for tables that run edge to edge). */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
  id?: string;
}) {
  const hasHeader = title || description || actions;
  return (
    <section
      id={id}
      className={`eco-card rounded-xl min-w-0 ${className}`}
      style={{
        background: 'var(--eco-surface-raised)',
        border: '1px solid var(--eco-border)',
        ...style,
      }}
    >
      {hasHeader && (
        <div
          className={`flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-4 sm:px-5 pt-4 ${padded ? '' : 'pb-3'}`}
        >
          <div className="min-w-0 flex-[1_1_200px]">
            {title && (
              <h2
                className="text-[15px] leading-6 font-semibold"
                style={{ color: 'var(--eco-text)' }}
              >
                {title}
              </h2>
            )}
            {description && (
              <p className="text-[12px] mt-0.5" style={{ color: 'var(--eco-text-secondary)' }}>
                {description}
              </p>
            )}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children !== undefined && children !== null && children !== false && (
        <div className={padded ? `px-4 sm:px-5 pb-4 ${hasHeader ? 'pt-3' : 'pt-4'}` : ''}>
          {children}
        </div>
      )}
      {footer && (
        <div
          className="px-4 sm:px-5 py-3 border-t flex flex-wrap items-center gap-2"
          style={{ borderColor: 'var(--eco-border)' }}
        >
          {footer}
        </div>
      )}
    </section>
  );
}

// ─── Empty / error ──────────────────────────────────────────────────────────

export function AdminEmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center px-4 ${compact ? 'py-8' : 'py-12'}`}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
        style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
        aria-hidden
      >
        <Icon size={18} style={{ color: 'var(--eco-text-tertiary)' }} />
      </div>
      <div className="text-[15px] font-semibold" style={{ color: 'var(--eco-text)' }}>
        {title}
      </div>
      {description && (
        <div
          className="text-[13px] mt-1 max-w-[420px]"
          style={{ color: 'var(--eco-text-secondary)' }}
        >
          {description}
        </div>
      )}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Load-failure block with a retry button. `message` is already localized. */
export function AdminErrorState({
  message,
  onRetry,
  retrying,
  inline = false,
}: {
  message?: string | null;
  onRetry?: () => void;
  retrying?: boolean;
  /** inline = slim banner (when stale data is still shown below). */
  inline?: boolean;
}) {
  const { t } = useI18n();
  if (inline) {
    return (
      <div
        role="alert"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 rounded-xl text-[13px]"
        style={{
          background: 'var(--eco-danger-100)',
          color: 'var(--eco-danger-500)',
        }}
      >
        <AlertTriangle size={15} aria-hidden className="shrink-0" />
        <span className="flex-1 min-w-[160px]">
          <strong className="font-semibold">{t('loadFailedTitle')}</strong>
          {message && message !== t('loadFailedTitle') ? ` · ${message}` : ''}
        </span>
        {onRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry} loading={retrying}>
            {t('retry')}
          </Button>
        )}
      </div>
    );
  }
  return (
    <div role="alert">
      <AdminEmptyState
        icon={AlertTriangle}
        title={t('loadFailedTitle')}
        description={
          message && message !== t('loadFailedTitle') ? message : t('adminErrorHint')
        }
        action={
          onRetry ? (
            <Button variant="primary" size="sm" onClick={onRetry} loading={retrying}>
              <RefreshCw size={13} aria-hidden /> {t('retry')}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

// ─── Pagination ─────────────────────────────────────────────────────────────

export function AdminPagination({
  page,
  totalPages,
  onPageChange,
  disabled,
}: {
  /** zero-based */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useI18n();
  if (totalPages <= 1) return null;
  return (
    <nav
      aria-label={t('adminPagination')}
      className="flex items-center justify-between gap-2 text-[12px]"
    >
      <Button
        variant="ghost"
        size="sm"
        disabled={page <= 0 || disabled}
        onClick={() => onPageChange(Math.max(0, page - 1))}
      >
        <ChevronLeft size={13} aria-hidden /> {t('prevPage')}
      </Button>
      <span className="tabular-nums" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('pageOf', { page: page + 1, total: totalPages })}
      </span>
      <Button
        variant="ghost"
        size="sm"
        disabled={page >= totalPages - 1 || disabled}
        onClick={() => onPageChange(page + 1)}
      >
        {t('nextPage')} <ChevronRight size={13} aria-hidden />
      </Button>
    </nav>
  );
}

// ─── Data table ─────────────────────────────────────────────────────────────

export type AdminColumnPriority = 'primary' | 'secondary' | 'detail' | 'actions';

export interface AdminColumn<Row> {
  id: string;
  header: ReactNode;
  /** Plain-text label used in the mobile card when `header` is not a string. */
  label?: string;
  cell: (row: Row) => ReactNode;
  align?: 'left' | 'right' | 'center';
  /** Right-aligns and applies tabular-nums. */
  numeric?: boolean;
  width?: number | string;
  minWidth?: number | string;
  /** Keep cell content on one line (amounts, statuses, ids). */
  nowrap?: boolean;
  /**
   * Mobile (<768px) record-card role:
   *  primary   — card title (first one) / title-row trailing item (rest, e.g. status)
   *  secondary — subtitle line under the title
   *  detail    — label/value pair (default)
   *  actions   — card footer
   */
  priority?: AdminColumnPriority;
}

const CELL_PAD = 'px-3 first:pl-4 last:pr-4';

function alignOf<Row>(col: AdminColumn<Row>): 'left' | 'right' | 'center' {
  return col.align ?? (col.numeric ? 'right' : 'left');
}

function columnLabel<Row>(col: AdminColumn<Row>): ReactNode {
  return col.label ?? col.header;
}

export function AdminDataTable<Row>({
  columns,
  rows,
  rowKey,
  loading = false,
  error,
  onRetry,
  empty,
  onRowClick,
  isRowActive,
  rowLabel,
  skeletonRows = 6,
  maxHeight = '70vh',
  minWidth,
  caption,
}: {
  columns: AdminColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string | number;
  loading?: boolean;
  /** Localized load error. When set and there are no rows, renders AdminErrorState. */
  error?: string | null;
  onRetry?: () => void;
  /** Rendered when not loading, no error and no rows. */
  empty?: ReactNode;
  onRowClick?: (row: Row) => void;
  isRowActive?: (row: Row) => boolean;
  /** Accessible name for clickable rows (screen readers read it on focus). */
  rowLabel?: (row: Row) => string;
  skeletonRows?: number;
  /** Desktop scroll-container height; the header row sticks within it. */
  maxHeight?: string;
  /** Desktop table min-width; below it the container scrolls horizontally. */
  minWidth?: number;
  caption?: string;
}) {
  const isMobile = useAdminIsMobile();
  const { t } = useI18n();

  if (loading && rows.length === 0) {
    return <AdminTableSkeleton columns={columns} rows={skeletonRows} minWidth={minWidth} />;
  }
  if (error && rows.length === 0) {
    return <AdminErrorState message={error} onRetry={onRetry} />;
  }
  if (rows.length === 0) {
    return <>{empty ?? <AdminEmptyState title={t('adminEmptyTitle')} compact />}</>;
  }

  const handleKey = (event: ReactKeyboardEvent, row: Row) => {
    if (!onRowClick) return;
    if (event.key === 'Enter' || event.key === ' ') {
      if (event.target !== event.currentTarget) return;
      event.preventDefault();
      onRowClick(row);
    }
  };

  if (isMobile) {
    return (
      <ul className="flex flex-col gap-2" aria-busy={loading || undefined}>
        {rows.map((row) => (
          <AdminRecordCard
            key={rowKey(row)}
            row={row}
            columns={columns}
            active={isRowActive?.(row) ?? false}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            onKeyDown={(event) => handleKey(event, row)}
            label={rowLabel?.(row)}
          />
        ))}
      </ul>
    );
  }

  return (
    <div
      className="eco-admin-table-scroll rounded-xl"
      style={{
        maxHeight,
        border: '1px solid var(--eco-border)',
        background: 'var(--eco-surface-raised)',
      }}
      aria-busy={loading || undefined}
    >
      <table
        className="w-full text-[13px]"
        style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth }}
      >
        {caption && <caption className="sr-only">{caption}</caption>}
        <AdminTableHead columns={columns} />
        <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 150ms' }}>
          {rows.map((row) => {
            const active = isRowActive?.(row) ?? false;
            return (
              <tr
                key={rowKey(row)}
                className={`eco-admin-row ${onRowClick ? 'is-clickable' : ''} ${active ? 'is-active' : ''}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                onKeyDown={onRowClick ? (event) => handleKey(event, row) : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                aria-label={onRowClick ? rowLabel?.(row) : undefined}
                aria-selected={onRowClick && isRowActive ? active : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.id}
                    className={`${CELL_PAD} py-2 align-middle ${col.nowrap || col.numeric ? 'whitespace-nowrap' : ''} ${col.numeric ? 'tabular-nums' : ''}`}
                    style={{
                      textAlign: alignOf(col),
                      width: col.width,
                      minWidth: col.minWidth,
                      height: ADMIN_ROW_HEIGHT,
                      color: 'var(--eco-text)',
                    }}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AdminTableHead<Row>({ columns }: { columns: AdminColumn<Row>[] }) {
  return (
    <thead>
      <tr>
        {columns.map((col) => (
          <th
            key={col.id}
            scope="col"
            className={`${CELL_PAD} py-2 text-[12px] font-medium whitespace-nowrap sticky top-0 z-[1]`}
            style={{
              textAlign: alignOf(col),
              width: col.width,
              minWidth: col.minWidth,
              color: 'var(--eco-text-secondary)',
              background: 'var(--eco-surface)',
              borderBottom: '1px solid var(--eco-border)',
            }}
          >
            {col.header}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function AdminRecordCard<Row>({
  row,
  columns,
  active,
  onClick,
  onKeyDown,
  label,
}: {
  row: Row;
  columns: AdminColumn<Row>[];
  active: boolean;
  onClick?: () => void;
  onKeyDown: (event: ReactKeyboardEvent) => void;
  label?: string;
}) {
  const primary = columns.filter((c) => c.priority === 'primary');
  const [titleCol, ...trailing] = primary;
  const secondary = columns.filter((c) => c.priority === 'secondary');
  const actions = columns.filter((c) => c.priority === 'actions');
  const details = columns.filter((c) => !c.priority || c.priority === 'detail');
  return (
    <li
      className={`eco-admin-record rounded-xl px-4 py-3 flex flex-col gap-2 ${onClick ? 'is-clickable' : ''} ${active ? 'is-active' : ''}`}
      onClick={onClick}
      onKeyDown={onClick ? onKeyDown : undefined}
      tabIndex={onClick ? 0 : undefined}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? label : undefined}
      aria-pressed={onClick ? active : undefined}
    >
      {(titleCol || trailing.length > 0) && (
        <div className="flex items-start justify-between gap-2 min-w-0">
          {titleCol && (
            <div
              className="min-w-0 flex-1 text-[13px] font-semibold break-words"
              style={{ color: 'var(--eco-text)' }}
            >
              {titleCol.cell(row)}
            </div>
          )}
          {trailing.length > 0 && (
            <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0 max-w-[50%]">
              {trailing.map((c) => (
                <span key={c.id} className={c.numeric ? 'tabular-nums whitespace-nowrap' : ''}>
                  {c.cell(row)}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {secondary.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] min-w-0"
          style={{ color: 'var(--eco-text-secondary)' }}
        >
          {secondary.map((c, i) => (
            <span key={c.id} className="min-w-0 break-words flex items-center gap-2">
              {i > 0 && <span aria-hidden>·</span>}
              {c.cell(row)}
            </span>
          ))}
        </div>
      )}
      {details.length > 0 && (
        <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1.5 text-[13px]">
          {details.map((c) => (
            <div key={c.id} className="contents">
              <dt className="text-[12px] pt-px" style={{ color: 'var(--eco-text-tertiary)' }}>
                {columnLabel(c)}
              </dt>
              <dd
                className={`min-w-0 break-words ${c.numeric ? 'tabular-nums' : ''}`}
                style={{ color: 'var(--eco-text)' }}
              >
                {c.cell(row)}
              </dd>
            </div>
          ))}
        </dl>
      )}
      {actions.length > 0 && (
        <div
          className="flex flex-wrap items-center gap-2 pt-2 border-t"
          style={{ borderColor: 'var(--eco-border)' }}
          onClick={(event) => event.stopPropagation()}
        >
          {actions.map((c) => (
            <div key={c.id} className="contents">
              {c.cell(row)}
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

export function AdminTableSkeleton<Row>({
  columns,
  rows = 6,
  minWidth,
}: {
  columns: AdminColumn<Row>[] | number;
  rows?: number;
  minWidth?: number;
}) {
  const isMobile = useAdminIsMobile();
  const { t } = useI18n();
  const cols: Pick<AdminColumn<Row>, 'id' | 'header' | 'align' | 'numeric' | 'width' | 'minWidth'>[] =
    typeof columns === 'number'
      ? Array.from({ length: columns }, (_, i) => ({ id: String(i), header: '' }))
      : columns;

  if (isMobile) {
    return (
      <ul className="flex flex-col gap-2" aria-busy="true" aria-label={t('loading')}>
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <li key={i} className="eco-admin-record rounded-xl px-4 py-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-3">
              <Skeleton width="55%" height={14} />
              <Skeleton width={64} height={18} rounded={4} />
            </div>
            <Skeleton width="40%" height={12} />
            <Skeleton width="80%" height={12} />
            <Skeleton width="70%" height={12} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div
      className="eco-admin-table-scroll rounded-xl"
      style={{ border: '1px solid var(--eco-border)', background: 'var(--eco-surface-raised)' }}
      aria-busy="true"
      aria-label={t('loading')}
    >
      <table
        className="w-full text-[13px]"
        style={{ borderCollapse: 'separate', borderSpacing: 0, minWidth }}
      >
        <AdminTableHead columns={cols as AdminColumn<Row>[]} />
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="eco-admin-row">
              {cols.map((col, c) => (
                <td
                  key={col.id}
                  className={`${CELL_PAD} py-2`}
                  style={{ height: ADMIN_ROW_HEIGHT, width: col.width, minWidth: col.minWidth }}
                >
                  <div
                    className="flex"
                    style={{
                      justifyContent:
                        col.align === 'right' || col.numeric
                          ? 'flex-end'
                          : col.align === 'center'
                            ? 'center'
                            : 'flex-start',
                    }}
                  >
                    <Skeleton width={`${45 + ((r * 7 + c * 13) % 40)}%`} height={12} />
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Skeleton for list/master-detail screens that render stacked rows, not tables. */
export function AdminListSkeleton({ rows = 5, height = 72 }: { rows?: number; height?: number }) {
  const { t } = useI18n();
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label={t('loading')}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl px-4 py-3 flex flex-col justify-center gap-2"
          style={{
            minHeight: height,
            background: 'var(--eco-surface-raised)',
            border: '1px solid var(--eco-border)',
          }}
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton width={`${40 + ((i * 11) % 30)}%`} height={12} />
            <Skeleton width={56} height={16} rounded={4} />
          </div>
          <Skeleton width={`${55 + ((i * 17) % 35)}%`} height={12} />
        </div>
      ))}
    </div>
  );
}

// ─── Stat card ──────────────────────────────────────────────────────────────

export function AdminStatCard({
  label,
  value,
  delta,
  hint,
  icon: Icon,
  loading = false,
  tone = 'default',
}: {
  label: ReactNode;
  value: ReactNode;
  /** e.g. { value: '+12%', direction: 'up' } — direction drives colour. */
  delta?: { value: ReactNode; direction: 'up' | 'down' | 'flat'; positiveIsGood?: boolean };
  hint?: string;
  icon?: LucideIcon;
  loading?: boolean;
  tone?: 'default' | 'warning' | 'danger' | 'success';
}) {
  const toneColor =
    tone === 'danger'
      ? 'var(--eco-danger-500)'
      : tone === 'warning'
        ? 'var(--eco-warning-500)'
        : tone === 'success'
          ? 'var(--eco-success-500)'
          : 'var(--eco-text)';
  const good = delta
    ? delta.direction === 'flat'
      ? null
      : (delta.direction === 'up') === (delta.positiveIsGood ?? true)
    : null;
  return (
    <div
      className="eco-card rounded-xl px-4 py-3.5 flex flex-col gap-1 min-w-0"
      style={{ background: 'var(--eco-surface-raised)', border: '1px solid var(--eco-border)' }}
    >
      <div
        className="flex items-center gap-1.5 text-[12px] min-w-0"
        style={{ color: 'var(--eco-text-secondary)' }}
      >
        {Icon && <Icon size={13} aria-hidden className="shrink-0" />}
        <span className="truncate">{label}</span>
        {hint && (
          <span
            tabIndex={0}
            role="img"
            aria-label={hint}
            title={hint}
            className="inline-flex shrink-0 rounded-full cursor-help eco-admin-focusable"
          >
            <Info size={12} style={{ color: 'var(--eco-text-tertiary)' }} aria-hidden />
          </span>
        )}
      </div>
      <div className="min-h-[30px] flex items-end">
        {loading ? (
          <Skeleton width="50%" height={22} />
        ) : (
          <span
            className="text-[22px] leading-[30px] font-semibold tabular-nums break-all"
            style={{ color: toneColor }}
          >
            {value}
          </span>
        )}
      </div>
      {delta && !loading && (
        <div
          className="flex items-center gap-1 text-[12px] tabular-nums"
          style={{
            color:
              good === null
                ? 'var(--eco-text-tertiary)'
                : good
                  ? 'var(--eco-success-500)'
                  : 'var(--eco-danger-500)',
          }}
        >
          {delta.direction === 'up' && <TrendingUp size={12} aria-hidden />}
          {delta.direction === 'down' && <TrendingDown size={12} aria-hidden />}
          {delta.value}
        </div>
      )}
    </div>
  );
}

// ─── Status badge ───────────────────────────────────────────────────────────

export type AdminStatusTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

// Colour only. Status TEXT is localized by the caller and passed as children.
const TONE_BY_STATUS: Record<string, AdminStatusTone> = {
  ACTIVE: 'success',
  APPROVED: 'success',
  RESOLVED: 'success',
  PAID: 'success',
  PUBLISHED: 'success',
  SUCCEEDED: 'success',
  SUCCESS: 'success',
  VERIFIED: 'success',
  COMPLETED: 'success',
  DONE: 'success',
  OK: 'success',
  RELEASED: 'success',
  REFUNDED: 'success',
  PENDING: 'warning',
  IN_PROGRESS: 'warning',
  IN_REVIEW: 'warning',
  IN_VERIFICATION: 'warning',
  UNDER_REVIEW: 'warning',
  WAITING_USER: 'warning',
  WAITING: 'warning',
  PROCESSING: 'warning',
  HELD: 'warning',
  ON_HOLD: 'warning',
  DRAFT: 'default',
  NEW: 'info',
  OPEN: 'info',
  APPLIED: 'info',
  SCHEDULED: 'info',
  REVIEWED: 'info',
  CLOSED: 'default',
  ARCHIVED: 'default',
  HIDDEN: 'default',
  INACTIVE: 'default',
  BLOCKED: 'danger',
  BANNED: 'danger',
  REJECTED: 'danger',
  FAILED: 'danger',
  ERROR: 'danger',
  CANCELLED: 'danger',
  CANCELED: 'danger',
  ESCALATED: 'danger',
  DELETED: 'danger',
  EXPIRED: 'danger',
  DISPUTED: 'danger',
  SUSPENDED: 'danger',
  RESTRICTED: 'danger',
};

export function adminStatusTone(status: string | null | undefined): AdminStatusTone {
  if (!status) return 'default';
  return TONE_BY_STATUS[status.toUpperCase()] ?? 'default';
}

export function AdminStatusBadge({
  status,
  tone,
  children,
}: {
  /** Raw backend status — used only to pick the colour. */
  status?: string | null;
  /** Explicit override when the screen already knows the semantic tone. */
  tone?: AdminStatusTone;
  /** Already-localized label. */
  children: ReactNode;
}) {
  return (
    <span className="inline-flex whitespace-nowrap">
      <Badge variant={tone ?? adminStatusTone(status)}>{children}</Badge>
    </span>
  );
}

// ─── Tabs ───────────────────────────────────────────────────────────────────

export interface AdminTabItem<T extends string> {
  id: T;
  label: ReactNode;
  count?: number;
  icon?: LucideIcon;
}

export function AdminTabs<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: AdminTabItem<T>[];
  active: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const onKeyDown = (event: ReactKeyboardEvent, index: number) => {
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + tabs.length) % tabs.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = tabs.length - 1;
    if (next < 0) return;
    event.preventDefault();
    onChange(tabs[next].id);
    refs.current[next]?.focus();
  };
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className="eco-admin-tabs flex flex-wrap gap-x-1 border-b min-w-0"
      style={{ borderColor: 'var(--eco-border)' }}
    >
      {tabs.map((tab, index) => {
        const selected = tab.id === active;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="eco-admin-tab inline-flex items-center gap-1.5 px-3 py-2.5 text-[13px] whitespace-nowrap cursor-pointer shrink-0"
            style={{
              color: selected ? 'var(--eco-primary)' : 'var(--eco-text-secondary)',
              fontWeight: selected ? 600 : 400,
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${selected ? 'var(--eco-primary)' : 'transparent'}`,
              marginBottom: -1,
              borderRadius: 0,
            }}
          >
            {Icon && <Icon size={14} aria-hidden />}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span
                className="text-[12px] leading-4 px-1.5 rounded-full tabular-nums"
                style={{
                  background: selected ? 'var(--eco-brand-50)' : 'var(--eco-neutral-100)',
                  color: selected ? 'var(--eco-brand-700)' : 'var(--eco-text-secondary)',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Alias: same control, used for in-page section switching. */
export const AdminSectionNav = AdminTabs;

// ─── Confirm ────────────────────────────────────────────────────────────────

/**
 * Plain confirmation dialog (no reason field). For audited moderation actions
 * that need a reason, keep using ConfirmActionModal from admin-action-ui.
 * Focus trap, Escape and focus restore come from the ds Modal.
 */
export function AdminConfirm({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  destructive = true,
  irreversible = true,
  loading = false,
  errorMessage,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** Show the "cannot be undone" warning (off for soft deletes/deactivation). */
  irreversible?: boolean;
  loading?: boolean;
  errorMessage?: string | null;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const close = useCallback(() => {
    if (!loading) onClose();
  }, [loading, onClose]);
  return (
    <Modal open={open} onClose={close} title={title}>
      <div className="flex flex-col gap-4">
        {destructive && irreversible && (
          <div
            className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg text-[13px]"
            style={{ background: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)' }}
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5" aria-hidden />
            <span>{t('adminConfirmIrreversible')}</span>
          </div>
        )}
        {description && (
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {description}
          </div>
        )}
        {children}
        {errorMessage && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {errorMessage}
          </div>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={close} disabled={loading}>
            {cancelLabel ?? t('cancel')}
          </Button>
          <Button
            variant={destructive ? 'destructive' : 'primary'}
            size="sm"
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Misc small pieces ──────────────────────────────────────────────────────

/** Label/value pair for detail panels. */
export function AdminField({
  label,
  children,
  numeric,
}: {
  label: ReactNode;
  children: ReactNode;
  numeric?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {label}
      </div>
      <div
        className={`text-[13px] break-words ${numeric ? 'tabular-nums' : ''}`}
        style={{ color: 'var(--eco-text)' }}
      >
        {children}
      </div>
    </div>
  );
}

/** Monospace id chip (R-12, U-4…). */
export function AdminId({ children }: { children: ReactNode }) {
  return (
    <span
      className="text-[12px] tabular-nums whitespace-nowrap"
      style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'ui-monospace, monospace' }}
    >
      {children}
    </span>
  );
}
