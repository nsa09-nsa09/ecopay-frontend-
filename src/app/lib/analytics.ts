// Client-side coalescing for the anonymous page-visit ping (POST /analytics/visit).
//
// Rules:
// - never blocks navigation or rendering (fire-and-forget, errors swallowed);
// - redirect chains and rapid clicks collapse into one write (trailing debounce);
// - the same path is sent at most once per DEDUPE_WINDOW_MS per tab;
// - no retries; a 429 pauses tracking for a while;
// - only a normalized pathname is sent: no query string, no hash, and
//   identifier segments (room/user/news ids) are replaced by placeholders, so
//   tokens, payment ids and personal identifiers never reach analytics.

import { ApiError, trackVisitRequest } from './api';

const SEND_DELAY_MS = 1200;
const DEDUPE_WINDOW_MS = 30 * 60 * 1000;
const RATE_LIMIT_PAUSE_MS = 10 * 60 * 1000;
const MAX_TRACKED_PATHS = 200;

/** Route patterns whose dynamic segments must not be sent verbatim. */
const DYNAMIC_ROUTES: Array<[RegExp, string]> = [
  [/^\/room\/[^/]+$/, '/room/:id'],
  [/^\/rooms\/member\/[^/]+$/, '/rooms/member/:id'],
  [/^\/rooms\/owner\/[^/]+$/, '/rooms/owner/:id'],
  [/^\/user\/[^/]+$/, '/user/:id'],
  [/^\/u\/[^/]+$/, '/u/:id'],
  [/^\/operator\/[^/]+$/, '/operator/:id'],
  [/^\/news\/[^/]+$/, '/news/:id'],
];

/**
 * Pathname only, lower-cased, trailing slash removed, dynamic ids masked and
 * any remaining long opaque segment (token-like) masked as well.
 */
export function normalizeAnalyticsPath(pathname: string): string {
  let path = (pathname.split(/[?#]/)[0] || '/').toLowerCase();
  if (path.length > 1) path = path.replace(/\/+$/, '');
  for (const [pattern, replacement] of DYNAMIC_ROUTES) {
    if (pattern.test(path)) return replacement;
  }
  // Defensive: mask numeric ids and long opaque segments on unknown routes.
  path = path
    .split('/')
    .map((segment) =>
      /^\d+$/.test(segment) || /^[a-z0-9_-]{20,}$/i.test(segment) ? ':id' : segment,
    )
    .join('/');
  return path.slice(0, 200) || '/';
}

let pendingPath: string | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
let pausedUntil = 0;
const lastSentAt = new Map<string, number>();

function flush() {
  timer = null;
  const path = pendingPath;
  pendingPath = null;
  if (!path) return;
  const now = Date.now();
  if (now < pausedUntil) return;
  const previous = lastSentAt.get(path);
  if (previous != null && now - previous < DEDUPE_WINDOW_MS) return;
  if (lastSentAt.size >= MAX_TRACKED_PATHS) lastSentAt.clear();
  lastSentAt.set(path, now);
  void trackVisitRequest(path).catch((err: unknown) => {
    if (err instanceof ApiError && err.status === 429) {
      pausedUntil = Date.now() + RATE_LIMIT_PAUSE_MS;
    }
    // Swallow everything else — analytics must never surface to the user.
  });
}

/** Records a page view for `pathname`; safe to call on every route change. */
export function trackPageVisit(pathname: string) {
  try {
    pendingPath = normalizeAnalyticsPath(pathname);
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, SEND_DELAY_MS);
  } catch {
    /* never break navigation */
  }
}
