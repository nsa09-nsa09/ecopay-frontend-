import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, Button, Select, Skeleton } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  getAdminDashboardKpisRequest,
  getAdminDashboardMetrics,
  type AdminDashboardKpisDto,
  type DashboardGranularity,
  type DashboardMetricsResponse,
} from "../../lib/api";
import { formatAdminApiError } from "./admin-action-ui";
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
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function AdminDashboardPage() {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [kpis, setKpis] = useState<AdminDashboardKpisDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [granularity, setGranularity] = useState<DashboardGranularity>("month");
  const [rangeKey, setRangeKey] = useState<"12m" | "30d">("12m");
  const [metrics, setMetrics] = useState<DashboardMetricsResponse | null>(null);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await authorizedRequest((token) => getAdminDashboardKpisRequest(token));
      setKpis(data);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, t]);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(null);
    const to = new Date();
    const from = new Date(to);
    if (rangeKey === "12m") from.setMonth(from.getMonth() - 12);
    else from.setDate(from.getDate() - 30);
    try {
      const data = await authorizedRequest((token) =>
        getAdminDashboardMetrics(token, {
          granularity,
          from: isoDate(from),
          to: isoDate(to),
        }),
      );
      setMetrics(data);
    } catch (err) {
      setMetricsError(formatAdminApiError(err, t));
    } finally {
      setMetricsLoading(false);
    }
  }, [authorizedRequest, granularity, rangeKey, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  const chartData = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.series)) return [];
    return metrics.series.map((p) => ({
      period: p.period,
      [t("dashboardSignups")]: p.registrations,
      [t("dashboardLogins")]: p.loginsTotal,
    }));
  }, [metrics, t]);

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
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("dashboard")}</h1>
          <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={13} /> {t("retry")}
          </Button>
        </div>

        {loading && !kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
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
                <div className="grid grid-cols-3 gap-2 text-[13px]">
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("activeUsersLabel")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(kpis.activeUsers)}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("bannedUsersLabel")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(kpis.bannedUsers)}</div>
                  </div>
                  <div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("dashboardNewLast30d")}</div>
                    <div style={{ color: "var(--eco-text)" }}>{formatCount(metrics?.newUsersLast30Days ?? null)}</div>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardChartTitle")}</div>
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="w-32 sm:w-36">
                    <Select
                      aria-label={t("dashboardGranularity")}
                      value={granularity}
                      onChange={(e) => setGranularity(e.target.value as DashboardGranularity)}
                      options={[
                        { value: "month", label: t("dashboardGranularityMonth") },
                        { value: "day", label: t("dashboardGranularityDay") },
                      ]}
                    />
                  </div>
                  <div className="w-32 sm:w-36">
                    <Select
                      aria-label={t("dashboardRange")}
                      value={rangeKey}
                      onChange={(e) => setRangeKey(e.target.value as "12m" | "30d")}
                      options={[
                        { value: "12m", label: t("dashboardRange12m") },
                        { value: "30d", label: t("dashboardRange30d") },
                      ]}
                    />
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => void loadMetrics()} disabled={metricsLoading}>
                    <RefreshCw size={13} /> {t("retry")}
                  </Button>
                </div>
              </div>

              {metricsError && (
                <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{metricsError}</div>
              )}

              {metricsLoading && !metrics ? (
                <Skeleton height={260} />
              ) : (
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                      <XAxis dataKey="period" tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--eco-bg)",
                          border: "1px solid var(--eco-border)",
                          borderRadius: 8,
                          fontSize: 12,
                          color: "var(--eco-text)",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line
                        type="monotone"
                        dataKey={t("dashboardSignups")}
                        stroke="var(--eco-primary)"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey={t("dashboardLogins")}
                        stroke="var(--eco-warning-500)"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}
