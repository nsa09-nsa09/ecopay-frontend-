import { Card, Badge } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { ShieldCheck, Scale, Undo2, MessageSquare, Ban, Users, Home, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { GapBanner } from "../../../lib/ui/GapBanner";

const kpis = [
  { label: "Moderation Queue", value: "3", change: "+1", up: true, icon: ShieldCheck, variant: "warning" as const },
  { label: "Open Disputes", value: "2", change: "0", up: false, icon: Scale, variant: "danger" as const },
  { label: "Refunds Pending", value: "5", change: "+2", up: true, icon: Undo2, variant: "warning" as const },
  { label: "Tickets Open", value: "12", change: "-3", up: false, icon: MessageSquare, variant: "info" as const },
  { label: "Active Bans", value: "4", change: "+1", up: true, icon: Ban, variant: "danger" as const },
];

const recentActivity = [
  { time: "10 min ago", action: "Room #R-2048 flagged for verification", actor: "System" },
  { time: "25 min ago", action: "User Dana M. ban reviewed by Admin", actor: "admin@ecopay.kz" },
  { time: "1h ago", action: "Refund ₸5,199 initiated for Ticket T-1018", actor: "admin@ecopay.kz" },
  { time: "2h ago", action: "Dispute D-104 escalated from Ticket T-1018", actor: "support@ecopay.kz" },
  { time: "3h ago", action: "Room #R-2045 blocked — compliance review", actor: "admin@ecopay.kz" },
];

const quickStats = [
  { label: "Total Rooms", value: "248", icon: Home },
  { label: "Total Users", value: "1,024", icon: Users },
  { label: "Monthly Revenue", value: "₸4.2M", icon: TrendingUp },
];

export function AdminDashboardPage() {
  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <GapBanner label="AdminDashboardController is not implemented yet — KPIs and charts shown below are mock." />
        <h1 className="text-[24px] mb-6" style={{ color: "var(--eco-text)" }}>Dashboard</h1>

        {/* KPI cards */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {kpis.map((k) => {
            const Icon = k.icon;
            return (
              <Card key={k.label} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{
                    background: k.variant === "warning" ? "var(--eco-warning-100)" : k.variant === "danger" ? "var(--eco-danger-100)" : "var(--eco-brand-50)",
                  }}>
                    <Icon size={15} style={{
                      color: k.variant === "warning" ? "var(--eco-warning-500)" : k.variant === "danger" ? "var(--eco-danger-500)" : "var(--eco-brand-600)",
                    }} />
                  </div>
                  {k.change !== "0" && (
                    <div className="flex items-center gap-0.5 text-[11px]" style={{ color: k.up ? "var(--eco-negative)" : "var(--eco-positive)" }}>
                      {k.up ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                      {k.change}
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-[22px]" style={{ color: "var(--eco-text)" }}>{k.value}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{k.label}</div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {quickStats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.label} className="flex items-center gap-3">
                <Icon size={18} style={{ color: "var(--eco-text-tertiary)" }} />
                <div>
                  <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{s.value}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Recent activity */}
        <Card className="flex flex-col gap-0">
          <h3 className="text-[15px] mb-4" style={{ color: "var(--eco-text)" }}>Recent Activity</h3>
          {recentActivity.map((a, i) => (
            <div
              key={i}
              className="flex items-start gap-3 py-3"
              style={{ borderTop: i > 0 ? "1px solid var(--eco-border)" : undefined }}
            >
              <div className="w-1.5 h-1.5 rounded-full mt-2 shrink-0" style={{ background: "var(--eco-primary)" }} />
              <div className="flex-1 min-w-0">
                <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{a.action}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{a.actor}</div>
              </div>
              <span className="text-[11px] shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>{a.time}</span>
            </div>
          ))}
        </Card>
      </div>
    </AdminLayout>
  );
}
