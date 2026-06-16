import { useEffect, useSyncExternalStore } from "react";
import {
  ApiError,
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
} from "./api";
import type { FriendlyApiErrorCode } from "./locale";

/**
 * Shared admin-dashboard cache.
 *
 * Goals:
 *  - Start fetching the heavy "above the fold" dashboard data the moment the
 *    user enters the admin area (in <AdminRoute/>), so by the time they
 *    actually open /admin/dashboard the panels can render instantly.
 *  - Survive panel re-mounts: navigating away from /admin/dashboard and back
 *    must not re-trigger the same network calls.
 *  - Per-distribution status: a single failed distribution endpoint must not
 *    blank the rest. Each entry tracks its own loading/error state.
 */

export type AuthorizedRequest = <T>(fn: (token: string) => Promise<T>) => Promise<T>;

/**
 * `error` holds a stable FriendlyApiErrorCode (see lib/locale.ts), not raw
 * server text. The UI translates it via t() so a failed distribution endpoint
 * never paints a server exception name into the dashboard.
 */
export interface CacheEntry<T> {
  data: T | null;
  loading: boolean;
  error: FriendlyApiErrorCode | null;
  loadedAt: number | null;
}

function emptyEntry<T>(): CacheEntry<T> {
  return { data: null, loading: false, error: null, loadedAt: null };
}

export interface AdminDashboardState {
  kpis: CacheEntry<AdminDashboardKpisDto>;
  metrics: Record<string, CacheEntry<DashboardMetricsResponse>>;
  popularServices: CacheEntry<PopularServiceDto[]>;
  operatorDistribution: CacheEntry<OperatorDistributionDto[]>;
  currencyDistribution: CacheEntry<NamedCountDto[]>;
  categoryDistribution: CacheEntry<NamedCountDto[]>;
  roomStatusDistribution: CacheEntry<NamedCountDto[]>;
}

let state: AdminDashboardState = {
  kpis: emptyEntry(),
  metrics: {},
  popularServices: emptyEntry(),
  operatorDistribution: emptyEntry(),
  currencyDistribution: emptyEntry(),
  categoryDistribution: emptyEntry(),
  roomStatusDistribution: emptyEntry(),
};

const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

function setState(updater: (prev: AdminDashboardState) => AdminDashboardState) {
  state = updater(state);
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

export function useAdminDashboardCache(): AdminDashboardState {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

// ───────── Per-resource fetchers (idempotent) ─────────

function pickKey<K extends keyof AdminDashboardState>(key: K) {
  return key;
}

function startLoading<K extends "kpis" | "popularServices" | "operatorDistribution" | "currencyDistribution" | "categoryDistribution" | "roomStatusDistribution">(key: K) {
  setState((prev) => ({ ...prev, [pickKey(key)]: { ...prev[key], loading: true, error: null } }));
}

function setError<K extends "kpis" | "popularServices" | "operatorDistribution" | "currencyDistribution" | "categoryDistribution" | "roomStatusDistribution">(key: K, code: FriendlyApiErrorCode) {
  setState((prev) => ({ ...prev, [pickKey(key)]: { ...prev[key], loading: false, error: code } }));
}

function setData<K extends "kpis" | "popularServices" | "operatorDistribution" | "currencyDistribution" | "categoryDistribution" | "roomStatusDistribution", T>(
  key: K,
  data: T,
) {
  setState((prev) => ({
    ...prev,
    [pickKey(key)]: { data: data as unknown as AdminDashboardState[K]["data"], loading: false, error: null, loadedAt: Date.now() },
  }));
}

function toErrorCode(err: unknown): FriendlyApiErrorCode {
  if (err instanceof ApiError) return err.code;
  return "network";
}

// In-flight promise map prevents racing duplicate fetches from concurrent
// callers (e.g. prefetch from AdminRoute + on-mount fetch in the panel).
const inflight = new Map<string, Promise<unknown>>();

function dedupe<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const cached = inflight.get(key) as Promise<T> | undefined;
  if (cached) return cached;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}

export function fetchKpis(authorizedRequest: AuthorizedRequest, force = false): Promise<void> {
  if (!force && state.kpis.data) return Promise.resolve();
  startLoading("kpis");
  return dedupe("kpis", async () => {
    try {
      const data = await authorizedRequest((token) => getAdminDashboardKpisRequest(token));
      setData("kpis", data);
    } catch (err) {
      setError("kpis", toErrorCode(err));
      throw err;
    }
  });
}

export function fetchPopularServices(authorizedRequest: AuthorizedRequest, force = false): Promise<void> {
  if (!force && state.popularServices.data) return Promise.resolve();
  startLoading("popularServices");
  return dedupe("popularServices", async () => {
    try {
      const data = await authorizedRequest((token) => getAdminPopularServicesRequest(token, 10));
      setData("popularServices", data);
    } catch (err) {
      setError("popularServices", toErrorCode(err));
      throw err;
    }
  });
}

export function fetchOperatorDistribution(authorizedRequest: AuthorizedRequest, force = false): Promise<void> {
  if (!force && state.operatorDistribution.data) return Promise.resolve();
  startLoading("operatorDistribution");
  return dedupe("operatorDistribution", async () => {
    try {
      const data = await authorizedRequest((token) => getAdminOperatorDistributionRequest(token));
      setData("operatorDistribution", data);
    } catch (err) {
      setError("operatorDistribution", toErrorCode(err));
      throw err;
    }
  });
}

export function fetchCurrencyDistribution(authorizedRequest: AuthorizedRequest, force = false): Promise<void> {
  if (!force && state.currencyDistribution.data) return Promise.resolve();
  startLoading("currencyDistribution");
  return dedupe("currencyDistribution", async () => {
    try {
      const data = await authorizedRequest((token) => getAdminCurrencyDistributionRequest(token));
      setData("currencyDistribution", data);
    } catch (err) {
      setError("currencyDistribution", toErrorCode(err));
      throw err;
    }
  });
}

export function fetchCategoryDistribution(authorizedRequest: AuthorizedRequest, force = false): Promise<void> {
  if (!force && state.categoryDistribution.data) return Promise.resolve();
  startLoading("categoryDistribution");
  return dedupe("categoryDistribution", async () => {
    try {
      const data = await authorizedRequest((token) => getAdminCategoryDistributionRequest(token));
      setData("categoryDistribution", data);
    } catch (err) {
      setError("categoryDistribution", toErrorCode(err));
      throw err;
    }
  });
}

export function fetchRoomStatusDistribution(authorizedRequest: AuthorizedRequest, force = false): Promise<void> {
  if (!force && state.roomStatusDistribution.data) return Promise.resolve();
  startLoading("roomStatusDistribution");
  return dedupe("roomStatusDistribution", async () => {
    try {
      const data = await authorizedRequest((token) => getAdminRoomStatusDistributionRequest(token));
      setData("roomStatusDistribution", data);
    } catch (err) {
      setError("roomStatusDistribution", toErrorCode(err));
      throw err;
    }
  });
}

// ───────── Metrics (parametrised by granularity + range) ─────────

function metricsKey(granularity: DashboardGranularity, rangeKey: "12m" | "30d"): string {
  return `${granularity}|${rangeKey}`;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeBounds(rangeKey: "12m" | "30d"): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  if (rangeKey === "12m") from.setMonth(from.getMonth() - 12);
  else from.setDate(from.getDate() - 30);
  return { from: isoDate(from), to: isoDate(to) };
}

export function getMetricsEntry(
  granularity: DashboardGranularity,
  rangeKey: "12m" | "30d",
): CacheEntry<DashboardMetricsResponse> {
  return state.metrics[metricsKey(granularity, rangeKey)] ?? emptyEntry();
}

export function fetchMetrics(
  authorizedRequest: AuthorizedRequest,
  granularity: DashboardGranularity,
  rangeKey: "12m" | "30d",
  force = false,
): Promise<void> {
  const key = metricsKey(granularity, rangeKey);
  const existing = state.metrics[key];
  if (!force && existing?.data) return Promise.resolve();

  setState((prev) => ({
    ...prev,
    metrics: {
      ...prev.metrics,
      [key]: { ...(prev.metrics[key] ?? emptyEntry<DashboardMetricsResponse>()), loading: true, error: null },
    },
  }));

  return dedupe(`metrics:${key}`, async () => {
    try {
      const { from, to } = rangeBounds(rangeKey);
      const data = await authorizedRequest((token) =>
        getAdminDashboardMetrics(token, { granularity, from, to }),
      );
      setState((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [key]: { data, loading: false, error: null, loadedAt: Date.now() },
        },
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        metrics: {
          ...prev.metrics,
          [key]: { ...(prev.metrics[key] ?? emptyEntry<DashboardMetricsResponse>()), loading: false, error: toErrorCode(err) },
        },
      }));
      throw err;
    }
  });
}

// ───────── Prefetch entry-point used by AdminRoute ─────────

/**
 * Kick off all dashboard requests in parallel. Uses Promise.allSettled so a
 * failure of one resource does not abort the rest — each resource's failure
 * is recorded against its own cache entry. Safe to call repeatedly: cached
 * entries are skipped, and in-flight fetches are deduped.
 *
 * Returns the settled-results array for callers that want to observe overall
 * status; most callers can fire-and-forget.
 */
export function prefetchAdminDashboard(
  authorizedRequest: AuthorizedRequest,
  options: { granularity?: DashboardGranularity; rangeKey?: "12m" | "30d"; force?: boolean } = {},
): Promise<PromiseSettledResult<void>[]> {
  const granularity = options.granularity ?? "month";
  const rangeKey = options.rangeKey ?? "12m";
  const force = options.force ?? false;
  return Promise.allSettled([
    fetchKpis(authorizedRequest, force),
    fetchMetrics(authorizedRequest, granularity, rangeKey, force),
    fetchPopularServices(authorizedRequest, force),
    fetchOperatorDistribution(authorizedRequest, force),
    fetchCurrencyDistribution(authorizedRequest, force),
    fetchCategoryDistribution(authorizedRequest, force),
    fetchRoomStatusDistribution(authorizedRequest, force),
  ]);
}

/** Resets the in-memory cache. Use on staff logout. */
export function clearAdminDashboardCache() {
  state = {
    kpis: emptyEntry(),
    metrics: {},
    popularServices: emptyEntry(),
    operatorDistribution: emptyEntry(),
    currencyDistribution: emptyEntry(),
    categoryDistribution: emptyEntry(),
    roomStatusDistribution: emptyEntry(),
  };
  inflight.clear();
  notify();
}

/**
 * Convenience hook for components that want a one-line "fire prefetch when
 * I mount" effect. Fires only the first time the component mounts.
 */
export function useAdminDashboardPrefetch(authorizedRequest: AuthorizedRequest, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    void prefetchAdminDashboard(authorizedRequest);
  }, [authorizedRequest, enabled]);
}
