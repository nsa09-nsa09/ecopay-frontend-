import { useCallback, useEffect, useState } from "react";
import { Card, Button } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  ApiError,
  getAdminDashboardKpisRequest,
  type AdminDashboardKpisDto,
} from "../../lib/api";
import {
  ShieldCheck,
  Scale,
  Undo2,
  Ban,
  Users,
  Home,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface KpiCardConfig {
  key: string;
  value: string | number;
  icon: typeof ShieldCheck;
  variant: "warning" | "danger" | "info" | "success";
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("ru-RU").format(value);
}

function formatMoney(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `₸${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(num)}`;
}

export function AdminDashboardPage() {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [kpis, setKpis] = useState<AdminDashboardKpisDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => getAdminDashboardKpisRequest(token));
      setKpis(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("loadFailedTitle"));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const renderKpiCards = (): KpiCardConfig[] => {
    if (!kpis) return [];
    return [
      { key: "pendingModerationLabel", value: formatCount(kpis.pendingModeration), icon: ShieldCheck, variant: "warning" },
      { key: "openDisputes", value: formatCount(kpis.openDisputes), icon: Scale, variant: "danger" },
      { key: "totalRefundsLabel", value: formatMoney(kpis.totalRefunds), icon: Undo2, variant: "warning" },
      { key: "blockedRoomsLabel", value: formatCount(kpis.blockedRooms), icon: Home, variant: "info" },
      { key: "bannedUsersLabel", value: formatCount(kpis.bannedUsers), icon: Ban, variant: "danger" },
    ];
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("dashboard")}</h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
        </div>

        {loading && !kpis && (
          <div className="grid grid-cols-5 gap-4 mb-8">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-lg" style={{ background: "var(--eco-surface)" }} />
                <div className="h-6 rounded" style={{ background: "var(--eco-surface)" }} />
                <div className="h-3 rounded" style={{ background: "var(--eco-surface)" }} />
              </Card>
            ))}
          </div>
        )}

        {error && !loading && (
          <Card className="flex flex-col gap-3 mb-6">
            <div className="text-[14px]" style={{ color: "var(--eco-negative)" }}>{t("loadFailedTitle")}</div>
            <div className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{error}</div>
            <div>
              <Button variant="primary" size="sm" onClick={() => void load()}>
                <RefreshCw size={13} /> {t("retry")}
              </Button>
            </div>
          </Card>
        )}

        {kpis && (
          <>
            <div className="grid grid-cols-5 gap-4 mb-8">
              {renderKpiCards().map((k) => {
                const Icon = k.icon;
                return (
                  <Card key={k.key} className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{
                          background:
                            k.variant === "warning"
                              ? "var(--eco-warning-100)"
                              : k.variant === "danger"
                              ? "var(--eco-danger-100)"
                              : "var(--eco-brand-50)",
                        }}
                      >
                        <Icon
                          size={15}
                          style={{
                            color:
                              k.variant === "warning"
                                ? "var(--eco-warning-500)"
                                : k.variant === "danger"
                                ? "var(--eco-danger-500)"
                                : "var(--eco-brand-600)",
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-[22px]" style={{ color: "var(--eco-text)" }}>{k.value}</div>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t(k.key)}</div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { key: "totalRoomsLabel", value: formatCount(kpis.totalRooms), icon: Home },
                { key: "totalUsersLabel", value: formatCount(kpis.totalUsers), icon: Users },
                { key: "totalRevenueLabel", value: formatMoney(kpis.totalRevenue), icon: TrendingUp },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <Card key={s.key} className="flex items-center gap-3">
                    <Icon size={18} style={{ color: "var(--eco-text-tertiary)" }} />
                    <div>
                      <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{s.value}</div>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t(s.key)}</div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card className="flex flex-col gap-2">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("rooms")}</div>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("activeUsersLabel")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(kpis.activeRooms)}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("statusOpen")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(kpis.openRooms)}</div>
                  </div>
                </div>
              </Card>
              <Card className="flex flex-col gap-2">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("users")}</div>
                <div className="grid grid-cols-2 gap-2 text-[13px]">
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("activeUsersLabel")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(kpis.activeUsers)}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("bannedUsersLabel")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(kpis.bannedUsers)}</div>
                  </div>
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
