import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Badge, Button, Input } from '../ds-primitives';
import { AdminLayout } from './admin-layout';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from '../auth/auth-provider';
import {
  getAdminActionLogsRequest,
  getRoomEventLogsRequest,
  type AdminActionLogDto,
  type RoomEventLogDto,
} from '../../lib/api';
import { formatAdminApiError } from './admin-action-ui';
import { Shield, FileText, ChevronRight, ChevronDown } from 'lucide-react';
import { userEventLabel } from '../../lib/user-facing-enums';
import {
  AdminCard,
  AdminDataTable,
  AdminEmptyState,
  AdminErrorState,
  AdminId,
  AdminPage,
  AdminPageHeader,
  AdminPagination,
  AdminRefreshButton,
  AdminTabs,
  AdminToolbar,
  type AdminColumn,
} from './admin-ui';

const PAGE_SIZE = 25;

const txl = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

type Tab = 'admin-actions' | 'room-events';

interface FilterValues {
  entityType: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: FilterValues = {
  entityType: '',
  eventType: '',
  dateFrom: '',
  dateTo: '',
};

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  // <input type="date"> emits YYYY-MM-DD; the backend expects ISO_DATE_TIME.
  return `${value}T00:00:00`;
}

export function AdminLogsPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();
  const [searchParams] = useSearchParams();

  const initTab = (searchParams.get('tab') === 'room-events' ? 'room-events' : 'admin-actions') as Tab;
  const initRoomId = searchParams.get('roomId') ?? '';

  const [tab, setTab] = useState<Tab>(initTab);
  const [adminLogs, setAdminLogs] = useState<AdminActionLogDto[]>([]);
  const [roomLogs, setRoomLogs] = useState<RoomEventLogDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initFilters: FilterValues = { ...emptyFilters, ...(initRoomId ? { eventType: '' } : {}) };
  const [filters, setFilters] = useState<FilterValues>(initFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(initFilters);
  const [roomIdFilter, setRoomIdFilter] = useState(initRoomId);
  const [appliedRoomId, setAppliedRoomId] = useState(initRoomId);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === 'admin-actions') {
        const result = await authorizedRequest((token) =>
          getAdminActionLogsRequest(token, {
            page,
            size: PAGE_SIZE,
            entityType: appliedFilters.entityType || undefined,
            dateFrom: toIsoOrUndefined(appliedFilters.dateFrom),
            dateTo: toIsoOrUndefined(appliedFilters.dateTo),
          }),
        );
        setAdminLogs(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      } else {
        const result = await authorizedRequest((token) =>
          getRoomEventLogsRequest(token, {
            page,
            size: PAGE_SIZE,
            eventType: appliedFilters.eventType || undefined,
            roomId: appliedRoomId || undefined,
            dateFrom: toIsoOrUndefined(appliedFilters.dateFrom),
            dateTo: toIsoOrUndefined(appliedFilters.dateTo),
          }),
        );
        setRoomLogs(result.items);
        setTotalPages(Math.max(1, result.totalPages));
      }
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, page, tab, appliedFilters, appliedRoomId, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    setPage(0);
    setAppliedFilters(filters);
    setAppliedRoomId(roomIdFilter);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setRoomIdFilter('');
    setAppliedRoomId('');
    setPage(0);
  };

  const userLink = (id: number | string | null | undefined, name: string | null | undefined) =>
    id ? (
      <Link
        to={`/admin/users?selected=${id}`}
        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
      >
        {name ?? `#${id}`}
      </Link>
    ) : (
      '—'
    );

  const typeCell = (raw: string) => (
    <div className="flex flex-col items-start gap-1">
      <Badge variant="info">{userEventLabel(raw, language)}</Badge>
      <code className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {raw}
      </code>
    </div>
  );

  const timeCell = (iso: string) => (
    <span className="tabular-nums whitespace-nowrap" style={{ color: 'var(--eco-text-secondary)' }}>
      {formatDateTime(iso, language)}
    </span>
  );

  const ipCell = (ip: string | null | undefined) =>
    ip ? (
      <span className="text-[12px]" style={{ fontFamily: 'ui-monospace, monospace' }}>
        {ip}
      </span>
    ) : (
      <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>
    );

  const adminColumns: AdminColumn<AdminActionLogDto>[] = [
    {
      id: 'type',
      header: t('colType'),
      priority: 'primary',
      minWidth: 170,
      cell: (log) => typeCell(log.actionType),
    },
    {
      id: 'time',
      header: t('colTimestamp'),
      priority: 'secondary',
      nowrap: true,
      cell: (log) => timeCell(log.createdAt),
    },
    {
      id: 'actor',
      header: t('colActor'),
      nowrap: true,
      cell: (log) => userLink(log.adminUserId, log.adminDisplayName),
    },
    {
      id: 'entity',
      header: t('colEntity'),
      nowrap: true,
      cell: (log) => (
        <span className="tabular-nums">
          {log.entityType} #{log.entityId}
        </span>
      ),
    },
    {
      id: 'reason',
      header: t('colReason'),
      minWidth: 200,
      cell: (log) => (
        <span style={{ color: 'var(--eco-text-secondary)' }}>{log.reason ?? '—'}</span>
      ),
    },
    {
      id: 'ip',
      header: t('logsIpLabel'),
      nowrap: true,
      cell: (log) => ipCell(log.ipAddress),
    },
  ];

  const toggleExpand = (id: number) =>
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stateEntries = (obj: unknown): [string, string][] => {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj as Record<string, unknown>).map(([k, v]) => [
      k,
      v == null ? '—' : String(v),
    ]);
  };

  const roomColumns: AdminColumn<RoomEventLogDto>[] = [
    {
      id: 'expand',
      header: '',
      cell: (log) => {
        const has = log.oldState || log.newState;
        if (!has) return null;
        const open = expandedRows.has(log.id);
        return (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleExpand(log.id); }}
            className="p-0.5 rounded hover:bg-[var(--eco-bg-hover)]"
            aria-label={open ? 'Collapse' : 'Expand'}
          >
            {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
        );
      },
    },
    {
      id: 'event',
      header: txl(language, 'Событие', 'Оқиға', 'Event'),
      priority: 'primary',
      minWidth: 170,
      cell: (log) => (
        <div className="flex flex-col items-start gap-1">
          <Badge variant="info">{log.eventLabel ?? userEventLabel(log.eventType, language)}</Badge>
          <code className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {log.eventType}
          </code>
        </div>
      ),
    },
    {
      id: 'room',
      header: t('rooms'),
      priority: 'primary',
      nowrap: true,
      cell: (log) => (
        <Link to={`/admin/rooms?selected=${log.roomId}`} style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}>
          {log.roomTitle ?? `R-${log.roomId}`}
        </Link>
      ),
    },
    {
      id: 'member',
      header: txl(language, 'Участник', 'Қатысушы', 'Member'),
      nowrap: true,
      cell: (log) =>
        log.memberUserId
          ? userLink(log.memberUserId, log.memberDisplayName)
          : log.roomMemberId
            ? <span style={{ color: 'var(--eco-text-tertiary)' }}>M-{log.roomMemberId}</span>
            : <span style={{ color: 'var(--eco-text-tertiary)' }}>—</span>,
    },
    {
      id: 'summary',
      header: txl(language, 'Детали', 'Мәліметтер', 'Details'),
      minWidth: 200,
      cell: (log) => (
        <span style={{ color: 'var(--eco-text-secondary)' }}>{log.summary ?? '—'}</span>
      ),
    },
    {
      id: 'time',
      header: t('colTimestamp'),
      priority: 'secondary',
      nowrap: true,
      cell: (log) => timeCell(log.createdAt),
    },
    {
      id: 'ip',
      header: t('logsIpLabel'),
      nowrap: true,
      cell: (log) => ipCell(log.ipAddress),
    },
  ];

  return (
    <AdminLayout>
      <AdminPage width="wide">
        <AdminPageHeader
          title={t('adminLogs')}
          subtitle={t('auditTrailSubtitle')}
          meta={
            <>
              <Shield size={13} aria-hidden /> {t('immutableAuditLog')}
            </>
          }
          actions={<AdminRefreshButton onClick={() => void load()} loading={loading} />}
        />

        <AdminTabs<Tab>
          tabs={[
            { id: 'admin-actions', label: t('tabAdminActions') },
            { id: 'room-events', label: t('tabRoomEvents') },
          ]}
          active={tab}
          onChange={(tabKey) => {
            setTab(tabKey);
            setPage(0);
          }}
        />

        {/* Filters */}
        <AdminToolbar>
          {tab === 'admin-actions' ? (
            <div className="flex-[1_1_160px] min-w-0">
              <Input
                label={t('filterEntityType')}
                placeholder="USER / ROOM"
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              />
            </div>
          ) : (
            <>
              <div className="flex-[1_1_160px] min-w-0">
                <Input
                  label={t('filterEventType')}
                  placeholder="room_created"
                  value={filters.eventType}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                />
              </div>
              <div className="flex-[1_1_100px] min-w-0 max-w-[140px]">
                <Input
                  label={t('filterRoomId')}
                  placeholder="123"
                  value={roomIdFilter}
                  onChange={(e) => setRoomIdFilter(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </>
          )}
          <div className="flex-[1_1_140px] min-w-0">
            <Input
              label={t('filterDateFrom')}
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            />
          </div>
          <div className="flex-[1_1_140px] min-w-0">
            <Input
              label={t('filterDateTo')}
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={applyFilters} disabled={loading}>
              {t('filterApply')}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters} disabled={loading}>
              {t('filterReset')}
            </Button>
          </div>
        </AdminToolbar>

        {error && !loading && (tab === 'admin-actions' ? adminLogs : roomLogs).length > 0 && (
          <AdminErrorState inline message={error} onRetry={() => void load()} />
        )}

        {tab === 'admin-actions' && (
          <AdminDataTable
            columns={adminColumns}
            rows={adminLogs}
            rowKey={(log) => log.id}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            minWidth={960}
            empty={
              <AdminCard>
                <AdminEmptyState
                  icon={FileText}
                  title={t('emptyAdminLogs')}
                  description={t('adminLogsEmptyHint')}
                />
              </AdminCard>
            }
          />
        )}

        {tab === 'room-events' && (
          <AdminDataTable
            columns={roomColumns}
            rows={roomLogs}
            rowKey={(log) => log.id}
            loading={loading}
            error={error}
            onRetry={() => void load()}
            onRowClick={(log) => {
              if (log.oldState || log.newState) toggleExpand(log.id);
            }}
            isRowActive={(log) => expandedRows.has(log.id)}
            minWidth={1040}
            empty={
              <AdminCard>
                <AdminEmptyState
                  icon={FileText}
                  title={t('emptyRoomEvents')}
                  description={t('adminLogsEmptyHint')}
                />
              </AdminCard>
            }
          />
        )}
        {tab === 'room-events' && roomLogs.filter((l) => expandedRows.has(l.id)).map((log) => (
          <AdminCard key={`detail-${log.id}`}>
            <div className="text-[13px] mb-2 font-medium" style={{ color: 'var(--eco-text)' }}>
              {log.eventLabel ?? userEventLabel(log.eventType, language)} — R-{log.roomId}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {log.oldState && (
                <div>
                  <div className="text-[12px] font-medium mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {txl(language, 'Прежнее состояние', 'Бұрынғы күй', 'Previous state')}
                  </div>
                  <dl className="text-[12px] space-y-0.5">
                    {stateEntries(log.oldState).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="font-medium shrink-0" style={{ color: 'var(--eco-text-secondary)' }}>{k}:</dt>
                        <dd style={{ color: 'var(--eco-text)' }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {log.newState && (
                <div>
                  <div className="text-[12px] font-medium mb-1" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {txl(language, 'Новое состояние', 'Жаңа күй', 'New state')}
                  </div>
                  <dl className="text-[12px] space-y-0.5">
                    {stateEntries(log.newState).map(([k, v]) => (
                      <div key={k} className="flex gap-2">
                        <dt className="font-medium shrink-0" style={{ color: 'var(--eco-text-secondary)' }}>{k}:</dt>
                        <dd style={{ color: 'var(--eco-text)' }}>{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </AdminCard>
        ))}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          disabled={loading}
        />
      </AdminPage>
    </AdminLayout>
  );
}
