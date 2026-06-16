import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { Card, Button, Select, Skeleton } from "../ds-primitives";
import { AdminLayout } from "./admin-layout";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  type DashboardGranularity,
  type NamedCountDto,
  type OperatorDistributionDto,
  type PopularServiceDto,
} from "../../lib/api";
import type { FriendlyApiErrorCode } from "../../lib/locale";
import {
  fetchCategoryDistribution,
  fetchCountryDistribution,
  fetchCurrencyDistribution,
  fetchKpis,
  fetchMetrics,
  fetchOperatorDistribution,
  fetchPopularServices,
  fetchRoomStatusDistribution,
  getMetricsEntry,
  useAdminDashboardCache,
} from "../../lib/admin-dashboard-cache";
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
  Inbox,
  Globe,
  PieChart as PieIcon,
  BarChart3,
  Layers,
  AlertCircle,
  MapPin,
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

function translateCacheError(
  code: FriendlyApiErrorCode | null,
  t: (key: string) => string,
): string | null {
  if (!code) return null;
  switch (code) {
    case "notAvailable":
      return t("errSectionUnavailable");
    case "noAccess":
      return t("noStaffAccessError");
    case "sessionExpired":
      return t("sessionExpiredError");
    case "serverError":
      return t("serverErrorTitle");
    case "network":
      return t("networkError");
    case "generic":
    default:
      return t("errLoadCardFailed");
  }
}


export function AdminDashboardPage() {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();

  // Read all data from the shared admin-dashboard cache. The cache is
  // (pre)populated by <AdminRoute/> at admin-shell mount, so when the user
  // opens this page the panels usually render straight from the cache.
  const cache = useAdminDashboardCache();
  const kpisEntry = cache.kpis;
  const kpis = kpisEntry.data;
  const loading = kpisEntry.loading && !kpisEntry.data;
  const error = translateCacheError(kpisEntry.error, t);

  const [granularity, setGranularity] = useState<DashboardGranularity>("month");
  const [rangeKey, setRangeKey] = useState<"12m" | "30d">("12m");
  const metricsEntry = getMetricsEntry(granularity, rangeKey);
  // Subscribe to the cache so metrics re-render when fetch resolves.
  // The hook above is enough — we just read from the snapshot, but
  // `getMetricsEntry` reads from the module state directly; bridge via
  // `cache.metrics` to ensure subscription covers this key too.
  const metricsKey = `${granularity}|${rangeKey}`;
  const metricsLive = cache.metrics[metricsKey] ?? metricsEntry;
  const metrics = metricsLive.data;
  const metricsLoading = metricsLive.loading && !metricsLive.data;
  const metricsError = translateCacheError(metricsLive.error, t);

  const popularEntry = cache.popularServices;
  const operatorEntry = cache.operatorDistribution;
  const currencyEntry = cache.currencyDistribution;
  const categoryEntry = cache.categoryDistribution;
  const roomStatusEntry = cache.roomStatusDistribution;
  const countryEntry = cache.countryDistribution;

  const popularServices: PopularServiceDto[] | null = popularEntry.data;
  const operatorDistribution: OperatorDistributionDto[] | null = operatorEntry.data;
  const currencyDistribution: NamedCountDto[] | null = currencyEntry.data;
  const categoryDistribution: NamedCountDto[] | null = categoryEntry.data;
  const roomStatusDistribution: NamedCountDto[] | null = roomStatusEntry.data;
  const countryDistribution: NamedCountDto[] | null = countryEntry.data;

  const load = useCallback(() => {
    void fetchKpis(authorizedRequest, true);
  }, [authorizedRequest]);

  const loadMetrics = useCallback(() => {
    void fetchMetrics(authorizedRequest, granularity, rangeKey, true);
  }, [authorizedRequest, granularity, rangeKey]);

  useEffect(() => {
    void fetchKpis(authorizedRequest);
  }, [authorizedRequest]);

  useEffect(() => {
    void fetchMetrics(authorizedRequest, granularity, rangeKey);
  }, [authorizedRequest, granularity, rangeKey]);

  useEffect(() => {
    // Per-card distribution loads (allSettled-style): each runs and fails
    // independently, no single rejection blanks the others.
    void fetchPopularServices(authorizedRequest);
    void fetchOperatorDistribution(authorizedRequest);
    void fetchCurrencyDistribution(authorizedRequest);
    void fetchCategoryDistribution(authorizedRequest);
    void fetchRoomStatusDistribution(authorizedRequest);
    void fetchCountryDistribution(authorizedRequest);
  }, [authorizedRequest]);

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

  // Backend already returns one row per operator (with its own "Other"
  // bucket) — we just map the response to chart-ready shape.
  const operatorChartData = useMemo(() => {
    if (!operatorDistribution) return [];
    return [...operatorDistribution]
      .sort((a, b) => b.count - a.count)
      .map((o) => ({ name: o.operatorName || o.code, value: o.count }));
  }, [operatorDistribution]);

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

  const countryChartData = useMemo(() => {
    if (!countryDistribution) return [];
    return [...countryDistribution]
      .sort((a, b) => b.value - a.value)
      .map((c) => ({ name: c.label, value: c.value }));
  }, [countryDistribution]);

  const revenueChartData = useMemo(() => {
    if (!metrics || !Array.isArray(metrics.series)) return [];
    return metrics.series.map((p) => ({
      period: p.period,
      [t("dashboardMetricRevenue")]: typeof p.revenue === "string" ? Number(p.revenue) : p.revenue ?? 0,
    }));
  }, [metrics, t]);

  // KPI cards are organised into named sections with exactly four cards each
  // so the responsive grid `grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` always
  // produces balanced rows (4 / 2x2 / 4x1) — no lonely orphans.
  interface KpiSectionConfig {
    titleKey: string;
    cards: KpiCardConfig[];
  }

  const kpiSections = useMemo<KpiSectionConfig[]>(() => {
    if (!kpis) return [];
    const newUsers30d = metrics?.newUsersLast30Days ?? null;
    return [
      {
        titleKey: "kpiSectionOperations",
        cards: [
          { key: "pendingModerationLabel", value: formatCount(kpis.pendingModeration), icon: ShieldCheck, variant: "warning" },
          { key: "openDisputes", value: formatCount(kpis.openDisputes), icon: Scale, variant: "danger" },
          { key: "kpiOpenTickets", value: formatCount(kpis.openTickets ?? null), icon: MessageSquare, variant: "warning" },
          { key: "blockedRoomsLabel", value: formatCount(kpis.blockedRooms), icon: Home, variant: "info" },
        ],
      },
      {
        titleKey: "kpiSectionFinance",
        cards: [
          { key: "totalRevenueLabel", value: formatMoney(kpis.totalRevenue), icon: TrendingUp, variant: "success" },
          { key: "totalRefundsLabel", value: formatMoney(kpis.totalRefunds), icon: Undo2, variant: "warning" },
          { key: "kpiActiveSubsValue", value: formatMoney(kpis.totalActiveSubscriptionsValueKzt ?? null), icon: Wallet, variant: "success" },
          { key: "kpiRefundRate", value: formatPercent(kpis.refundRatePercent ?? null), icon: Percent, variant: "warning" },
        ],
      },
      {
        titleKey: "kpiSectionAudience",
        cards: [
          { key: "kpiUniqueVisitorsToday", value: formatCount(kpis.uniqueVisitorsToday ?? null), icon: Eye, variant: "info" },
          { key: "kpiUniqueVisitors30d", value: formatCount(kpis.uniqueVisitors30d ?? null), icon: Users, variant: "info" },
          { key: "kpiPageViews30d", value: formatCount(kpis.totalPageViews30d ?? null), icon: MousePointerClick, variant: "info" },
          { key: "kpiConversion30d", value: formatPercent(kpis.conversionVisitorToUser30d ?? null), icon: UserPlus, variant: "success" },
        ],
      },
      {
        titleKey: "kpiSectionRooms",
        cards: [
          { key: "totalRoomsLabel", value: formatCount(kpis.totalRooms), icon: Home, variant: "info" },
          { key: "activeRoomsLabel", value: formatCount(kpis.activeRooms), icon: ShieldCheck, variant: "success" },
          { key: "kpiNewRooms30d", value: formatCount(kpis.newRoomsLast30Days ?? null), icon: PlusCircle, variant: "success" },
          { key: "kpiAvgRoomFill", value: formatPercent(kpis.avgRoomFillRate ?? null), icon: Gauge, variant: "info" },
        ],
      },
      {
        titleKey: "kpiSectionUsers",
        cards: [
          { key: "totalUsersLabel", value: formatCount(kpis.totalUsers), icon: Users, variant: "info" },
          { key: "activeUsersLabel", value: formatCount(kpis.activeUsers), icon: UsersRound, variant: "success" },
          { key: "bannedUsersLabel", value: formatCount(kpis.bannedUsers), icon: Ban, variant: "danger" },
          { key: "dashboardNewLast30d", value: formatCount(newUsers30d), icon: UserPlus, variant: "info" },
        ],
      },
    ];
  }, [kpis, metrics]);

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
            {kpiSections.map((section, idx) => (
              <section key={section.titleKey} className={idx === 0 ? "mb-8" : "mb-8"}>
                <h2 className="text-[14px] uppercase tracking-wide mb-3" style={{ color: "var(--eco-text-tertiary)" }}>
                  {t(section.titleKey)}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  {section.cards.map(renderKpiCard)}
                </div>
              </section>
            ))}

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

            <div className="mt-10 mb-4 flex items-center justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{t("dashboardSectionAudience")}</h2>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{t("dashboardSectionAudienceHint")}</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  void fetchPopularServices(authorizedRequest, true);
                  void fetchOperatorDistribution(authorizedRequest, true);
                  void fetchCurrencyDistribution(authorizedRequest, true);
                  void fetchCategoryDistribution(authorizedRequest, true);
                  void fetchRoomStatusDistribution(authorizedRequest, true);
                  void fetchCountryDistribution(authorizedRequest, true);
                }}
              >
                <RefreshCw size={13} /> {t("refresh")}
              </Button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <ChartShell
                icon={BarChart3}
                title={t("dashboardPopularServicesTitle")}
                loading={popularEntry.loading && !popularServices}
                error={translateCacheError(popularEntry.error, t)}
                empty={popularServicesData.length === 0}
                emptyLabel={t("dashboardEmptyChart")}
                onRetry={() => void fetchPopularServices(authorizedRequest, true)}
                placeholderShape="bars"
                className="xl:col-span-2"
                height={Math.max(220, popularServicesData.length * 36 + 60)}
              >
                <ResponsiveContainer>
                  <BarChart data={popularServicesData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={CHART_TICK_STYLE} tickFormatter={formatCount} />
                    <YAxis type="category" dataKey="name" width={150} tick={CHART_TICK_STYLE} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number | string) => formatCount(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey={t("dashboardMetricRooms")} fill={CHART_PALETTE[0]} radius={[0, 4, 4, 0]} />
                    <Bar dataKey={t("dashboardMetricActiveMembers")} fill={CHART_PALETTE[1]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>

              <ChartShell
                icon={Globe}
                title={t("dashboardOperatorDistributionTitle")}
                loading={operatorEntry.loading && !operatorDistribution}
                error={translateCacheError(operatorEntry.error, t)}
                empty={operatorChartData.length === 0}
                emptyLabel={t("dashboardEmptyChart")}
                onRetry={() => void fetchOperatorDistribution(authorizedRequest, true)}
                placeholderShape="bars"
                height={280}
              >
                <ResponsiveContainer>
                  <BarChart data={operatorChartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
                    <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ ...CHART_TICK_STYLE, fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} tickFormatter={formatCount} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number | string) => formatCount(Number(v))} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={CHART_PALETTE[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>

              <ChartShell
                icon={PieIcon}
                title={t("dashboardCurrencyDistributionTitle")}
                loading={currencyEntry.loading && !currencyDistribution}
                error={translateCacheError(currencyEntry.error, t)}
                empty={currencyChartData.length === 0}
                emptyLabel={t("dashboardEmptyChart")}
                onRetry={() => void fetchCurrencyDistribution(authorizedRequest, true)}
                placeholderShape="pie"
                height={280}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number | string) => formatCount(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Pie
                      data={currencyChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={pieLabel}
                      stroke="var(--eco-bg)"
                      strokeWidth={2}
                    >
                      {currencyChartData.map((entry, idx) => (
                        <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartShell>

              <ChartShell
                icon={Layers}
                title={t("dashboardCategoryDistributionTitle")}
                loading={categoryEntry.loading && !categoryDistribution}
                error={translateCacheError(categoryEntry.error, t)}
                empty={categoryChartData.length === 0}
                emptyLabel={t("dashboardEmptyChart")}
                onRetry={() => void fetchCategoryDistribution(authorizedRequest, true)}
                placeholderShape="bars"
                height={280}
              >
                <ResponsiveContainer>
                  <BarChart data={categoryChartData} margin={{ top: 8, right: 12, left: 0, bottom: 40 }}>
                    <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ ...CHART_TICK_STYLE, fontSize: 11 }} interval={0} angle={-25} textAnchor="end" height={50} />
                    <YAxis allowDecimals={false} tick={CHART_TICK_STYLE} tickFormatter={formatCount} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number | string) => formatCount(Number(v))} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} fill={CHART_PALETTE[1]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>

              <ChartShell
                icon={Home}
                title={t("dashboardRoomStatusDistributionTitle")}
                loading={roomStatusEntry.loading && !roomStatusDistribution}
                error={translateCacheError(roomStatusEntry.error, t)}
                empty={roomStatusChartData.length === 0}
                emptyLabel={t("dashboardEmptyChart")}
                onRetry={() => void fetchRoomStatusDistribution(authorizedRequest, true)}
                placeholderShape="pie"
                height={280}
              >
                <ResponsiveContainer>
                  <PieChart>
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number | string) => formatCount(Number(v))} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Pie
                      data={roomStatusChartData}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                      label={pieLabel}
                      stroke="var(--eco-bg)"
                      strokeWidth={2}
                    >
                      {roomStatusChartData.map((entry, idx) => (
                        <Cell key={entry.name} fill={CHART_PALETTE[idx % CHART_PALETTE.length]} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </ChartShell>

              <ChartShell
                icon={MapPin}
                title={t("dashboardCountryDistributionTitle")}
                loading={countryEntry.loading && !countryDistribution}
                error={translateCacheError(countryEntry.error, t)}
                empty={countryChartData.length === 0}
                emptyLabel={t("dashboardEmptyChart")}
                onRetry={() => void fetchCountryDistribution(authorizedRequest, true)}
                placeholderShape="bars"
                className="xl:col-span-2"
                height={Math.max(220, countryChartData.length * 28 + 80)}
              >
                <ResponsiveContainer>
                  <BarChart data={countryChartData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                    <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} tick={CHART_TICK_STYLE} tickFormatter={formatCount} />
                    <YAxis type="category" dataKey="name" width={150} tick={CHART_TICK_STYLE} />
                    <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v: number | string) => formatCount(Number(v))} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={CHART_PALETTE[0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartShell>
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
  boxShadow: "0 6px 16px rgba(0,0,0,0.06)",
};

const CHART_TICK_STYLE = { fill: "var(--eco-text-tertiary)", fontSize: 12 } as const;

// Branded palette derived entirely from --eco-* tokens so every chart shares
// the same visual language as the rest of the admin UI (KPI cards, badges,
// status colors). No raw hex colors — the theme owns the source of truth.
const CHART_PALETTE: readonly string[] = [
  "var(--eco-primary)",
  "var(--eco-brand-600)",
  "var(--eco-warning-500)",
  "var(--eco-positive)",
  "var(--eco-danger-500)",
  "var(--eco-warning)",
  "var(--eco-text-tertiary)",
] as const;

type PieLabelProps = {
  name?: string;
  percent?: number;
};

function pieLabel(props: unknown): string {
  const { name, percent } = (props ?? {}) as PieLabelProps;
  if (!name) return "";
  const pct = typeof percent === "number" ? Math.round(percent * 100) : 0;
  return `${name} · ${pct}%`;
}

/**
 * Unified shell for a "distribution" chart card. Provides:
 *  - icon + title header in the same shape as the rest of the dashboard
 *  - shimmer placeholders that hint at the chart shape during loading
 *  - per-card error with a retry button (no top-level blanket error)
 *  - friendly empty state with icon
 */
function ChartShell({
  icon: Icon,
  title,
  loading,
  error,
  empty,
  emptyLabel,
  onRetry,
  placeholderShape,
  height,
  className,
  children,
}: {
  icon: typeof Inbox;
  title: string;
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyLabel: string;
  onRetry: () => void;
  placeholderShape: "bars" | "pie";
  height: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={`flex flex-col gap-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
            <Icon size={14} style={{ color: "var(--eco-brand-600)" }} />
          </div>
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{title}</div>
        </div>
        {error && (
          <Button variant="ghost" size="sm" onClick={onRetry}>
            <RefreshCw size={12} />
          </Button>
        )}
      </div>
      <div style={{ width: "100%", height }}>
        {loading ? (
          <ChartPlaceholder shape={placeholderShape} height={height} />
        ) : error ? (
          <ChartErrorState message={error} onRetry={onRetry} />
        ) : empty ? (
          <ChartEmptyState label={emptyLabel} icon={Icon} />
        ) : (
          <div className="w-full h-full animate-eco-fade-in">{children}</div>
        )}
      </div>
    </Card>
  );
}

function ChartPlaceholder({ shape, height }: { shape: "bars" | "pie"; height: number }) {
  if (shape === "pie") {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div
          className="rounded-full animate-pulse"
          style={{ width: Math.min(height - 40, 180), height: Math.min(height - 40, 180), background: "var(--eco-neutral-200)" }}
        />
      </div>
    );
  }
  const rows = 5;
  return (
    <div className="w-full h-full flex items-end gap-3 px-2 pb-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex-1 rounded-md animate-pulse"
          style={{
            height: `${30 + ((i * 17) % 60)}%`,
            background: "var(--eco-neutral-200)",
          }}
        />
      ))}
    </div>
  );
}

function ChartErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg" style={{ background: "var(--eco-surface)" }}>
      <AlertCircle size={20} style={{ color: "var(--eco-danger-500)" }} />
      <span className="text-[12px] text-center max-w-[260px]" style={{ color: "var(--eco-text-secondary)" }}>{message}</span>
      <Button variant="secondary" size="sm" onClick={onRetry}>
        <RefreshCw size={12} />
      </Button>
    </div>
  );
}

function ChartEmptyState({ label, icon: Icon }: { label: string; icon: typeof Inbox }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 rounded-lg" style={{ background: "var(--eco-surface)" }}>
      <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "var(--eco-neutral-100)" }}>
        <Icon size={16} style={{ color: "var(--eco-text-tertiary)" }} />
      </div>
      <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{label}</span>
    </div>
  );
}
