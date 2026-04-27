import { Card, Badge } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { Shield } from "lucide-react";

const logs = [
  { time: "2026-04-03 09:30", actor: "admin@ecopay.kz", action: "Viewed identifier for U-1003 (Timur B.)", reason: "Moderation review MQ-300", type: "REVEAL" },
  { time: "2026-04-03 09:20", actor: "admin@ecopay.kz", action: "Confirmed MQ-301 — Room R-2048", reason: "Price verified with Beeline catalog", type: "MODERATION" },
  { time: "2026-04-03 09:15", actor: "System", action: "Room R-2048 flagged for moderation (risk: 72)", reason: "Auto-trigger", type: "SYSTEM" },
  { time: "2026-04-02 14:00", actor: "admin@ecopay.kz", action: "Blocked room R-2045", reason: "Compliance violation — fake plan listing", type: "BLOCK" },
  { time: "2026-04-02 11:00", actor: "support@ecopay.kz", action: "Escalated T-1018 to dispute D-104", reason: "User requests refund, owner unresponsive", type: "ESCALATION" },
  { time: "2026-04-01 16:00", actor: "admin@ecopay.kz", action: "Banned user U-1004 (Saule R.)", reason: "Multiple fraud reports confirmed", type: "BAN" },
  { time: "2026-04-01 10:30", actor: "support@ecopay.kz", action: "Replied to T-1024", reason: "—", type: "TICKET" },
  { time: "2026-03-31 09:00", actor: "admin@ecopay.kz", action: "Initiated refund RF-200 (₸3,200)", reason: "Duplicate charge confirmed", type: "REFUND" },
];

const typeVariant: Record<string, "warning" | "danger" | "info" | "success" | "default"> = {
  REVEAL: "warning", MODERATION: "info", SYSTEM: "default", BLOCK: "danger", ESCALATION: "danger", BAN: "danger", TICKET: "info", REFUND: "warning",
};

export function AdminLogsPage() {
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

        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          <div className="col-span-2">Timestamp</div>
          <div className="col-span-2">Actor</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-4">Action</div>
          <div className="col-span-3">Reason</div>
        </div>

        <div className="flex flex-col gap-1.5">
          {logs.map((log, i) => (
            <Card key={i}>
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)", fontFamily: "monospace" }}>{log.time}</div>
                <div className="col-span-2 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{log.actor}</div>
                <div className="col-span-1"><Badge variant={typeVariant[log.type]}>{log.type}</Badge></div>
                <div className="col-span-4 text-[13px]" style={{ color: "var(--eco-text)" }}>{log.action}</div>
                <div className="col-span-3 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{log.reason}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
