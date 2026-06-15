import { useCallback, useEffect, useState } from "react";
import { Card, Badge, Button, Input } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  getAdminActionLogsRequest,
  getRoomEventLogsRequest,
  type AdminActionLogDto,
  type RoomEventLogDto,
} from "../../lib/api";
import { formatAdminApiError } from "./admin-action-ui";
import {
  Shield,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const PAGE_SIZE = 25;

type Tab = "admin-actions" | "room-events";

interface FilterValues {
  entityType: string;
  eventType: string;
  dateFrom: string;
  dateTo: string;
}

const emptyFilters: FilterValues = {
  entityType: "",
  eventType: "",
  dateFrom: "",
  dateTo: "",
};

function toIsoOrUndefined(value: string): string | undefined {
  if (!value) return undefined;
  // <input type="date"> emits YYYY-MM-DD; the backend expects ISO_DATE_TIME.
  return `${value}T00:00:00`;
}

export function AdminLogsPage() {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();

  const [tab, setTab] = useState<Tab>("admin-actions");
  const [adminLogs, setAdminLogs] = useState<AdminActionLogDto[]>([]);
  const [roomLogs, setRoomLogs] = useState<RoomEventLogDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterValues>(emptyFilters);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (tab === "admin-actions") {
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
  }, [authorizedRequest, page, tab, appliedFilters, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const applyFilters = () => {
    setPage(0);
    setAppliedFilters(filters);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(0);
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-start justify-between gap-3 mb-6 flex-wrap">
          <div>
            <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("adminLogs")}</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>{t("auditTrailSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <Shield size={13} /> {t("immutableAuditLog")}
            </div>
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> {t("retry")}
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b mb-6" style={{ borderColor: "var(--eco-border)" }}>
          {(["admin-actions", "room-events"] as const).map((tabKey) => (
            <button
              key={tabKey}
              onClick={() => {
                setTab(tabKey);
                setPage(0);
              }}
              className="px-4 py-2.5 text-[14px] cursor-pointer"
              style={{
                color: tab === tabKey ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                borderBottom: tab === tabKey ? "2px solid var(--eco-primary)" : "2px solid transparent",
                marginBottom: -1,
                background: "transparent",
                border: "none",
                borderBottomStyle: "solid",
                borderBottomWidth: 2,
                borderBottomColor: tab === tabKey ? "var(--eco-primary)" : "transparent",
              }}
            >
              {tabKey === "admin-actions" ? t("tabAdminActions") : t("tabRoomEvents")}
            </button>
          ))}
        </div>

        {/* Filters */}
        <Card className="flex flex-wrap items-end gap-3 mb-4">
          {tab === "admin-actions" ? (
            <div className="flex flex-col gap-1.5" style={{ minWidth: 160 }}>
              <Input
                label={t("filterEntityType")}
                placeholder="USER / ROOM"
                value={filters.entityType}
                onChange={(e) => setFilters({ ...filters, entityType: e.target.value })}
              />
            </div>
          ) : (
            <div className="flex flex-col gap-1.5" style={{ minWidth: 160 }}>
              <Input
                label={t("filterEventType")}
                placeholder="room_created"
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
              />
            </div>
          )}
          <Input
            label={t("filterDateFrom")}
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
          />
          <Input
            label={t("filterDateTo")}
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
          />
          <div className="flex gap-2">
            <Button variant="primary" size="sm" onClick={applyFilters} disabled={loading}>
              {t("filterApply")}
            </Button>
            <Button variant="ghost" size="sm" onClick={resetFilters} disabled={loading}>
              {t("filterReset")}
            </Button>
          </div>
        </Card>

        {error && !loading && (
          <Card className="flex flex-col gap-2 mb-4">
            <div className="text-[14px]" style={{ color: "var(--eco-negative)" }}>{t("loadFailedTitle")}</div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{error}</div>
            <Button variant="primary" size="sm" onClick={() => void load()}>
              <RefreshCw size={13} /> {t("retry")}
            </Button>
          </Card>
        )}

        {tab === "admin-actions" && (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <div className="col-span-3">{t("colTimestamp")}</div>
                <div className="col-span-2">{t("colActor")}</div>
                <div className="col-span-2">{t("colType")}</div>
                <div className="col-span-2">{t("colEntity")}</div>
                <div className="col-span-3">{t("colReason")}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {loading && adminLogs.length === 0 && (
                  <Card className="text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</Card>
                )}
                {!loading && adminLogs.length === 0 && (
                  <Card className="text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("emptyAdminLogs")}</Card>
                )}
                {adminLogs.map((log) => (
                  <Card key={log.id}>
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-3 text-[12px] whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      <div className="col-span-2 text-[12px] whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>
                        #{log.adminUserId}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="info">{log.actionType}</Badge>
                      </div>
                      <div className="col-span-2 text-[12px] whitespace-nowrap" style={{ color: "var(--eco-text)" }}>
                        {log.entityType} #{log.entityId}
                      </div>
                      <div className="col-span-3 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {log.reason ?? "—"}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === "room-events" && (
          <div className="overflow-x-auto">
            <div className="min-w-[860px]">
              <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                <div className="col-span-3">{t("colTimestamp")}</div>
                <div className="col-span-2">{t("colActor")}</div>
                <div className="col-span-2">{t("colType")}</div>
                <div className="col-span-2">{t("rooms")}</div>
                <div className="col-span-3">{t("colReason")}</div>
              </div>
              <div className="flex flex-col gap-1.5">
                {loading && roomLogs.length === 0 && (
                  <Card className="text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</Card>
                )}
                {!loading && roomLogs.length === 0 && (
                  <Card className="text-center text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("emptyRoomEvents")}</Card>
                )}
                {roomLogs.map((log) => (
                  <Card key={log.id}>
                    <div className="grid grid-cols-12 gap-3 items-center">
                      <div className="col-span-3 text-[12px] whitespace-nowrap" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                      <div className="col-span-2 text-[12px] whitespace-nowrap" style={{ color: "var(--eco-text-secondary)" }}>
                        {log.actorRole ?? "—"}
                        {log.actorUserId ? ` #${log.actorUserId}` : ""}
                      </div>
                      <div className="col-span-2">
                        <Badge variant="info">{log.eventType}</Badge>
                      </div>
                      <div className="col-span-2 text-[12px] whitespace-nowrap" style={{ color: "var(--eco-text)" }}>
                        R-{log.roomId}
                      </div>
                      <div className="col-span-3 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {log.eventId}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-[12px]">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 0 || loading}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              <ChevronLeft size={12} /> {t("prevPage")}
            </Button>
            <span style={{ color: "var(--eco-text-tertiary)" }}>
              {t("pageOf", { page: page + 1, total: totalPages })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages - 1 || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("nextPage")} <ChevronRight size={12} />
            </Button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
