import { useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Card, Badge, Button, Input, Select, EmptyState, Skeleton } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { Shield, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { adminLogsApi } from "../../../lib/api/admin";

type Filters = {
  entityType: string;
  actorUserId: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  size: number;
};

const initialFilters: Filters = {
  entityType: "",
  actorUserId: "",
  dateFrom: "",
  dateTo: "",
  page: 0,
  size: 25,
};

export function AdminLogsPage() {
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const apiParams = {
    page: filters.page,
    size: filters.size,
    entityType: filters.entityType || undefined,
    actorUserId: filters.actorUserId || undefined,
    dateFrom: filters.dateFrom || undefined,
    dateTo: filters.dateTo || undefined,
  };

  const logsQ = useQuery({
    queryKey: ["admin", "logs", "actions", apiParams],
    queryFn: () => adminLogsApi.actions(apiParams),
    placeholderData: keepPreviousData,
  });

  const data = logsQ.data;
  const items = data?.content ?? [];
  const totalPages = data?.totalPages ?? 0;

  const setFilter = <K extends keyof Filters>(k: K, v: Filters[K]) => {
    setFilters((f) => ({ ...f, [k]: v, page: k === "page" ? (v as number) : 0 }));
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>Admin Logs</h1>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>Complete audit trail of all admin and support actions</p>
          </div>
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <Shield size={13} /> Immutable audit log
          </div>
        </div>

        <Card className="flex flex-col gap-3 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <Select
              label="Entity type"
              options={[
                { value: "", label: "All" },
                { value: "ROOM", label: "Room" },
                { value: "USER", label: "User" },
                { value: "DISPUTE", label: "Dispute" },
                { value: "REFUND", label: "Refund" },
                { value: "TICKET", label: "Ticket" },
                { value: "MODERATION", label: "Moderation" },
              ]}
              value={filters.entityType}
              onChange={(e) => setFilter("entityType", e.target.value)}
            />
            <Input
              label="Actor user ID"
              placeholder="UUID"
              value={filters.actorUserId}
              onChange={(e) => setFilter("actorUserId", e.target.value)}
            />
            <Input
              label="From"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilter("dateFrom", e.target.value)}
            />
            <Input
              label="To"
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilter("dateTo", e.target.value)}
            />
          </div>
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => setFilters(initialFilters)}>
              Reset filters
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Actor</div>
          <div className="col-span-2">Action</div>
          <div className="col-span-2">Target</div>
          <div className="col-span-4">Details</div>
        </div>

        {logsQ.isLoading ? (
          <div className="flex flex-col gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2"><Skeleton width="100%" height={12} /></div>
                  <div className="col-span-2"><Skeleton width="80%" height={12} /></div>
                  <div className="col-span-2"><Skeleton width={100} height={20} rounded={4} /></div>
                  <div className="col-span-2"><Skeleton width="70%" height={12} /></div>
                  <div className="col-span-4"><Skeleton width="100%" height={12} /></div>
                </div>
              </Card>
            ))}
          </div>
        ) : logsQ.isError ? (
          <Card className="flex flex-col items-center gap-3 py-10">
            <AlertTriangle size={20} style={{ color: "var(--eco-negative)" }} />
            <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>Failed to load logs</div>
            <Button variant="secondary" size="md" onClick={() => logsQ.refetch()}>Retry</Button>
          </Card>
        ) : items.length === 0 ? (
          <EmptyState title="No log entries" description="No actions match the current filters." />
        ) : (
          <div className="flex flex-col gap-1.5">
            {items.map((log) => (
              <Card key={log.id}>
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </div>
                  <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {log.actorName || log.actorId.slice(0, 10)}
                  </div>
                  <div className="col-span-2">
                    <Badge variant="info">{log.action}</Badge>
                  </div>
                  <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>
                    {log.targetType ? `${log.targetType}:` : ""}{log.targetId ? log.targetId.slice(0, 10) : ""}
                  </div>
                  <div className="col-span-4 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {log.details ? JSON.stringify(log.details).slice(0, 200) : "—"}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              Page {filters.page + 1} of {totalPages} · {data?.totalElements ?? 0} entries
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page === 0 || logsQ.isFetching}
                onClick={() => setFilter("page", Math.max(0, filters.page - 1))}
              >
                <ChevronLeft size={13} /> Prev
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={filters.page >= totalPages - 1 || logsQ.isFetching}
                onClick={() => setFilter("page", filters.page + 1)}
              >
                Next <ChevronRight size={13} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
