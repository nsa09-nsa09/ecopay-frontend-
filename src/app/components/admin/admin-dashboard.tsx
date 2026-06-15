import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { Card, Button, Select, Skeleton } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  getAdminCategoryDistributionRequest,
  getAdminCurrencyDistributionRequest,
  getAdminDashboardKpisRequest,
  getAdminDashboardMetrics,
  getAdminOperatorDistributionRequest,
  getAdminPopularServicesRequest,
  getAdminRoomStatusDistributionRequest,
  type AdminDashboardKpisDto,
  type DashboardGranularity,
  type DashboardMetricsResponse,
  type NamedCountDto,
  type OperatorDistributionDto,
  type PopularServiceDto,
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
  Eye,
  MousePointerClick,
  UserPlus,
  Gauge,
  UsersRound,
  Wallet,
  PlusCircle,
  Percent,
  MessageSquare,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
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

function formatPercent(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(num)}%`;
}

function formatDecimal(value: number | string | null | undefined): string {
  if (value == null) return "—";
  const num = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(num);
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

  // Audience & demand distributions: loaded once on mount in parallel.
  // Failures don't block the rest of the dashboard; the affected card
  // surfaces the error in place.
  const [popularServices, setPopularServices] = useState<PopularServiceDto[] | null>(null);
  const [operatorDistribution, setOperatorDistribution] = useState<OperatorDistributionDto[] | null>(null);
  const [currencyDistribution, setCurrencyDistribution] = useState<NamedCountDto[] | null>(null);
  const [categoryDistribution, setCategoryDistribution] = useState<NamedCountDto[] | null>(null);
  const [roomStatusDistribution, setRoomStatusDistribution] = useState<NamedCountDto[] | null>(null);
  const [distributionsLoading, setDistributionsLoading] = useState(true);
  const [distributionsError, setDistributionsError] = useState<string | null>(null);

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

  const loadDistributions = useCallback(async () => {
    setDistributionsLoading(true);
    setDistributionsError(null);
    try {
      const [popular, operators, currencies, categories, statuses] = await authorizedRequest(
        async (token) =>
          Promise.all([
            getAdminPopularServicesRequest(token, 10),
            getAdminOperatorDistributionRequest(token),
            getAdminCurrencyDistributionRequest(token),
            getAdminCategoryDistributionRequest(token),
            getAdminRoomStatusDistributionRequest(token),
          ]),
      );
      setPopularServices(popular);
      setOperatorDistribution(operators);
      setCurrencyDistribution(currencies);
      setCategoryDistribution(categories);
      setRoomStatusDistribution(statuses);
    } catch (err) {
      setDistributionsError(formatAdminApiError(err, t));
    } finally {
      setDistributionsLoading(false);
    }
  }, [authorizedRequest, t]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  useEffect(() => {
    void loadDistributions();
  }, [loadDistributions]);

  const chartData = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.series)) return [];
    return metrics.series.map((p) => ({
      period: p.period,
      [t("dashboardSignups")]: p.registrations,
      [t("dashboardLogins")]: p.loginsTotal,
    }));
  }, [metrics, t]);

  const trafficChartData = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.series)) return [];
    return metrics.series.map((p) => ({
      period: p.period,
      [t("dashboardMetricUniqueVisitors")]: p.uniqueVisitors ?? 0,
      [t("dashboardMetricPageViews")]: p.pageViews ?? 0,
    }));
  }, [metrics, t]);

  const newRoomsChartData = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.series)) return [];
    return metrics.series.map((p) => ({
      period: p.period,
      [t("dashboardMetricNewRooms")]: p.newRooms ?? 0,
    }));
  }, [metrics, t]);

  const popularServicesData = useMemo(() => {
    if (!popularServices) return [];
    return popularServices.map((s) => ({
      name: s.serviceName,
      [t("dashboardMetricRooms")]: s.roomsCount,
      [t("dashboardMetricActiveMembers")]: s.activeMembersCount,
    }));
  }, [popularServices, t]);

  // Operator distribution: keep the top 6, fold the rest into "Other"
  // so the chart stays readable.
  const operatorChartData = useMemo(() => {
    if (!operatorDistribution) return [];
    const sorted = [...operatorDistribution].sort((a, b) => b.count - a.count);
    if (sorted.length <= 7) {
      return sorted.map((o) => ({ name: o.operatorName || o.code, value: o.count }));
    }
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6).reduce((acc, o) => acc + o.count, 0);
    return [
      ...top.map((o) => ({ name: o.operatorName || o.code, value: o.count })),
      { name: t("dashboardOtherSlice"), value: rest },
    ];
  }, [operatorDistribution, t]);

  const currencyChartData = useMemo(() => {
    if (!currencyDistribution) return [];
    return currencyDistribution.map((c) => ({ name: c.label, value: c.value }));
  }, [currencyDistribution]);

  const categoryChartData = useMemo(() => {
    if (!categoryDistribution) return [];
    return categoryDistribution.map((c) => ({ name: c.label, value: c.value }));
  }, [categoryDistribution]);

  const roomStatusChartData = useMemo(() => {
    if (!roomStatusDistribution) return [];
    return roomStatusDistribution.map((c) => ({ name: c.label, value: c.value }));
  }, [roomStatusDistribution]);

  const revenueChartData = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.series)) return [];
    return metrics.series.map((p) => ({
      period: p.period,
      [t("dashboardMetricRevenue")]: typeof p.revenue === "string" ? Number(p.revenue) : p.revenue ?? 0,
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

  const renderExtendedKpiCards = (): KpiCardConfig[] => {
    if (!kpis) return [];
    return [
      { key: "kpiUniqueVisitorsToday", value: formatCount(kpis.uniqueVisitorsToday ?? null), icon: Eye, variant: "info" },
      { key: "kpiUniqueVisitors30d", value: formatCount(kpis.uniqueVisitors30d ?? null), icon: Users, variant: "info" },
      { key: "kpiPageViews30d", value: formatCount(kpis.totalPageViews30d ?? null), icon: MousePointerClick, variant: "info" },
      { key: "kpiConversion30d", value: formatPercent(kpis.conversionVisitorToUser30d ?? null), icon: UserPlus, variant: "success" },
      { key: "kpiAvgRoomFill", value: formatPercent(kpis.avgRoomFillRate ?? null), icon: Gauge, variant: "info" },
      { key: "kpiAvgMembersPerRoom", value: formatDecimal(kpis.avgMembersPerRoom ?? null), icon: UsersRound, variant: "info" },
      { key: "kpiActiveSubsValue", value: formatMoney(kpis.totalActiveSubscriptionsValueKzt ?? null), icon: Wallet, variant: "success" },
      { key: "kpiNewRooms30d", value: formatCount(kpis.newRoomsLast30Days ?? null), icon: PlusCircle, variant: "success" },
      { key: "kpiRefundRate", value: formatPercent(kpis.refundRatePercent ?? null), icon: Percent, variant: "warning" },
      { key: "kpiOpenTickets", value: formatCount(kpis.openTickets ?? null), icon: MessageSquare, variant: "warning" },
    ];
  };

  const renderKpiCard = (k: KpiCardConfig) => {
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
                  : k.variant === "success"
                  ? "var(--eco-success-100)"
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
                    : k.variant === "success"
                    ? "var(--eco-positive)"
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
              {renderKpiCards().map(renderKpiCard)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
              {renderExtendedKpiCards().map(renderKpiCard)}
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

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mt-4">
              <Card className="flex flex-col gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardChartTrafficTitle")}</div>
                {metricsLoading && !metrics ? (
                  <Skeleton height={220} />
                ) : (
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <LineChart data={trafficChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                          dataKey={t("dashboardMetricUniqueVisitors")}
                          stroke="var(--eco-primary)"
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey={t("dashboardMetricPageViews")}
                          stroke="var(--eco-warning-500)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardChartNewRoomsTitle")}</div>
                {metricsLoading && !metrics ? (
                  <Skeleton height={220} />
                ) : (
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <LineChart data={newRoomsChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
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
                          dataKey={t("dashboardMetricNewRooms")}
                          stroke="var(--eco-positive)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3 xl:col-span-2">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardChartRevenueTitle")}</div>
                {metricsLoading && !metrics ? (
                  <Skeleton height={220} />
                ) : (
                  <div style={{ width: "100%", height: 240 }}>
                    <ResponsiveContainer>
                      <LineChart data={revenueChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="period" tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                        <YAxis tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                        <Tooltip
                          contentStyle={{
                            background: "var(--eco-bg)",
                            border: "1px solid var(--eco-border)",
                            borderRadius: 8,
                            fontSize: 12,
                            color: "var(--eco-text)",
                          }}
                          formatter={(v: number | string) => formatMoney(v)}
                        />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Line
                          type="monotone"
                          dataKey={t("dashboardMetricRevenue")}
                          stroke="var(--eco-brand-600)"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            <div className="mt-8 mb-3 flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{t("dashboardSectionAudience")}</h2>
              <Button variant="secondary" size="sm" onClick={() => void loadDistributions()} disabled={distributionsLoading}>
                <RefreshCw size={13} /> {t("retry")}
              </Button>
            </div>

            {distributionsError && (
              <Card className="mb-4">
                <span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{distributionsError}</span>
              </Card>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card className="flex flex-col gap-3 xl:col-span-2">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardPopularServicesTitle")}</div>
                {distributionsLoading && !popularServices ? (
                  <Skeleton height={260} />
                ) : popularServicesData.length === 0 ? (
                  <EmptyChart label={t("dashboardEmptyChart")} />
                ) : (
                  <div style={{ width: "100%", height: Math.max(220, popularServicesData.length * 36 + 60) }}>
                    <ResponsiveContainer>
                      <BarChart data={popularServicesData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={140} tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar dataKey={t("dashboardMetricRooms")} fill="var(--eco-primary)" />
                        <Bar dataKey={t("dashboardMetricActiveMembers")} fill="var(--eco-warning-500)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardOperatorDistributionTitle")}</div>
                {distributionsLoading && !operatorDistribution ? (
                  <Skeleton height={240} />
                ) : operatorChartData.length === 0 ? (
                  <EmptyChart label={t("dashboardEmptyChart")} />
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={operatorChartData} margin={{ top: 8, right: 12, left: 0, bottom: 30 }}>
                        <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: "var(--eco-text-tertiary)", fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="value" fill="var(--eco-primary)">
                          {operatorChartData.map((entry, idx) => (
                            <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardCurrencyDistributionTitle")}</div>
                {distributionsLoading && !currencyDistribution ? (
                  <Skeleton height={240} />
                ) : currencyChartData.length === 0 ? (
                  <EmptyChart label={t("dashboardEmptyChart")} />
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Pie data={currencyChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {currencyChartData.map((entry, idx) => (
                            <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardCategoryDistributionTitle")}</div>
                {distributionsLoading && !categoryDistribution ? (
                  <Skeleton height={240} />
                ) : categoryChartData.length === 0 ? (
                  <EmptyChart label={t("dashboardEmptyChart")} />
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <BarChart data={categoryChartData} margin={{ top: 8, right: 12, left: 0, bottom: 30 }}>
                        <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fill: "var(--eco-text-tertiary)", fontSize: 11 }} interval={0} angle={-25} textAnchor="end" />
                        <YAxis allowDecimals={false} tick={{ fill: "var(--eco-text-tertiary)", fontSize: 12 }} />
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Bar dataKey="value" fill="var(--eco-primary)">
                          {categoryChartData.map((entry, idx) => (
                            <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>

              <Card className="flex flex-col gap-3">
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{t("dashboardRoomStatusDistributionTitle")}</div>
                {distributionsLoading && !roomStatusDistribution ? (
                  <Skeleton height={240} />
                ) : roomStatusChartData.length === 0 ? (
                  <EmptyChart label={t("dashboardEmptyChart")} />
                ) : (
                  <div style={{ width: "100%", height: 260 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Pie data={roomStatusChartData} dataKey="value" nameKey="name" outerRadius={90} label>
                          {roomStatusChartData.map((entry, idx) => (
                            <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

const CHART_TOOLTIP_STYLE: CSSProperties = {
  background: "var(--eco-bg)",
  border: "1px solid var(--eco-border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--eco-text)",
};

const CHART_PALETTE: readonly string[] = [
  "var(--eco-primary)",
  "var(--eco-warning-500)",
  "var(--eco-positive)",
  "var(--eco-brand-600)",
  "var(--eco-danger-500)",
  "var(--eco-text-tertiary)",
  "var(--eco-warning)",
] as const;

function EmptyChart({ label }: { label: string }) {
  return (
    <div
      className="flex items-center justify-center rounded-lg"
      style={{ height: 220, color: "var(--eco-text-tertiary)", fontSize: 13, background: "var(--eco-surface)" }}
    >
      {label}
    </div>
  );
}
