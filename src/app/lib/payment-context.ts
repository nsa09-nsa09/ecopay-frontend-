// Client-side payment correlation state.
//
// Only non-secret correlation identifiers are persisted here (intent id, room
// id, room-member id and the idempotency key the backend already requires).
// Nothing in this file is proof of payment: the UI shows success only after
// the backend returns a final SUCCESS for the intent.

import { safeGetJson, safeRemoveItem, safeSetItem } from './safe-storage';

// ---------------------------------------------------------------------------
// Status classification
// ---------------------------------------------------------------------------

export type PaymentUiState =
  /** Backend confirmed the capture (intent SUCCESS). */
  | 'success'
  /** Backend says the attempt is over and nothing was captured. */
  | 'failed'
  /** Provider confirmed a charge that could not be applied; refund running. */
  | 'refund'
  /** Refund completed. */
  | 'refunded'
  /** Manual review (anomaly / requires review) — never retry. */
  | 'review'
  /** Not final yet (pending / reconciling / unknown / any future status). */
  | 'checking';

const FINAL_FAILED = new Set(['FAILED', 'EXPIRED', 'CANCELLED']);
const REFUND_IN_PROGRESS = new Set(['REFUND_REQUIRED', 'REFUND_PENDING']);
const MANUAL_REVIEW = new Set(['CAPTURE_ANOMALY', 'REQUIRES_REVIEW']);

export function classifyPaymentStatus(status: string | null | undefined): PaymentUiState {
  const normalized = (status ?? '').toUpperCase();
  if (normalized === 'SUCCESS') return 'success';
  if (FINAL_FAILED.has(normalized)) return 'failed';
  if (normalized === 'REFUNDED') return 'refunded';
  if (REFUND_IN_PROGRESS.has(normalized)) return 'refund';
  if (MANUAL_REVIEW.has(normalized)) return 'review';
  // PENDING, UNKNOWN, RECONCILING and anything the backend adds later are
  // treated as "not final": never success, never an invitation to pay again.
  return 'checking';
}

/** True when the outcome will not change without operator/provider action. */
export function isFinalPaymentState(state: PaymentUiState) {
  return state === 'success' || state === 'failed' || state === 'refunded';
}

/**
 * True when starting a new payment for the same seat must be blocked because
 * the previous attempt may still capture money (or already did).
 */
export function blocksNewPaymentAttempt(status: string | null | undefined) {
  const state = classifyPaymentStatus(status);
  return state !== 'failed';
}

// ---------------------------------------------------------------------------
// Identifiers
// ---------------------------------------------------------------------------

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/;

export function isSafeId(value: unknown): value is string {
  return typeof value === 'string' && SAFE_ID.test(value);
}

/** RFC 4122 v4 id. Falls back to getRandomValues where randomUUID is missing (older Safari). */
export function newIdempotencyKey(): string {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  const bytes = new Uint8Array(16);
  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    cryptoApi.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

// ---------------------------------------------------------------------------
// Return context (survives the FreedomPay full-page redirect)
// ---------------------------------------------------------------------------

export interface PendingPaymentContext {
  intentId: string;
  roomId?: string;
  roomMemberId?: string;
  savedAt?: number;
}

/** Latest attempt — used only when the provider drops our query string. */
const LATEST_CONTEXT_KEY = 'ecopay.pendingPayment';
/** Older builds wrote `ecopay.pendingPayment.<intentId>`; read-only fallback. */
const LEGACY_CONTEXT_PREFIX = 'ecopay.pendingPayment.';
const CONTEXT_PREFIX = 'ecopay.paymentReturn.';
/** A stored "latest" context older than this is not offered on a bare return URL. */
const LATEST_CONTEXT_TTL_MS = 24 * 60 * 60 * 1000;

function sanitizeContext(value: unknown): PendingPaymentContext | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Record<string, unknown>;
  if (!isSafeId(raw.intentId)) return null;
  return {
    intentId: raw.intentId,
    roomId: isSafeId(raw.roomId) ? raw.roomId : undefined,
    roomMemberId: isSafeId(raw.roomMemberId) ? raw.roomMemberId : undefined,
    savedAt: typeof raw.savedAt === 'number' ? raw.savedAt : undefined,
  };
}

export function savePendingPaymentContext(context: PendingPaymentContext) {
  const value = JSON.stringify({ ...context, savedAt: Date.now() });
  safeSetItem(`${CONTEXT_PREFIX}${context.intentId}`, value);
  safeSetItem(LATEST_CONTEXT_KEY, value);
}

/**
 * Resolves which payment the return page is about. URL parameters (added by
 * the backend to the provider success/failure URL) win; storage is a fallback
 * for providers that drop the query string. Malformed values are ignored.
 */
export function readPendingPaymentContext(search: string): PendingPaymentContext | null {
  const params = new URLSearchParams(search);
  const urlIntentId = params.get('intentId') ?? params.get('paymentIntentId');
  if (urlIntentId != null) {
    if (!isSafeId(urlIntentId)) return null;
    const stored =
      sanitizeContext(safeGetJson(`${CONTEXT_PREFIX}${urlIntentId}`)) ??
      sanitizeContext(safeGetJson(`${LEGACY_CONTEXT_PREFIX}${urlIntentId}`));
    const urlRoomId = params.get('roomId');
    const urlRoomMemberId = params.get('roomMemberId');
    return {
      intentId: urlIntentId,
      roomId: isSafeId(urlRoomId) ? urlRoomId : stored?.roomId,
      roomMemberId: isSafeId(urlRoomMemberId) ? urlRoomMemberId : stored?.roomMemberId,
    };
  }
  const latest = sanitizeContext(safeGetJson(LATEST_CONTEXT_KEY));
  if (!latest) {
    safeRemoveItem(LATEST_CONTEXT_KEY);
    return null;
  }
  if (latest.savedAt != null && Date.now() - latest.savedAt > LATEST_CONTEXT_TTL_MS) {
    safeRemoveItem(LATEST_CONTEXT_KEY);
    return null;
  }
  return latest;
}

/** Drop the return context once the backend reported a final outcome. */
export function clearPendingPaymentContext(context: PendingPaymentContext) {
  safeRemoveItem(`${CONTEXT_PREFIX}${context.intentId}`);
  safeRemoveItem(`${LEGACY_CONTEXT_PREFIX}${context.intentId}`);
  const latest = sanitizeContext(safeGetJson(LATEST_CONTEXT_KEY));
  if (!latest || latest.intentId === context.intentId) {
    safeRemoveItem(LATEST_CONTEXT_KEY);
  }
}

// ---------------------------------------------------------------------------
// Payment attempt (idempotency key reuse per room membership)
// ---------------------------------------------------------------------------

export interface PaymentAttempt {
  idempotencyKey: string;
  intentId?: string;
}

const ATTEMPT_PREFIX = 'ecopay.paymentAttempt.';

/**
 * Older builds stored the attempt at `ecopay.pendingPayment.<memberId>`, the
 * same namespace as the return context keyed by intent id — a member id equal
 * to an intent id could overwrite the idempotency key. Attempts now live under
 * their own prefix; the legacy key is still read so an in-flight attempt keeps
 * its idempotency key across the deploy.
 */
export function readPaymentAttempt(memberId: string): PaymentAttempt | null {
  for (const key of [`${ATTEMPT_PREFIX}${memberId}`, `${LEGACY_CONTEXT_PREFIX}${memberId}`]) {
    const parsed = safeGetJson<Record<string, unknown>>(key);
    if (parsed && typeof parsed.idempotencyKey === 'string' && parsed.idempotencyKey.length > 0) {
      return {
        idempotencyKey: parsed.idempotencyKey,
        intentId: isSafeId(parsed.intentId) ? parsed.intentId : undefined,
      };
    }
  }
  return null;
}

export function writePaymentAttempt(memberId: string, attempt: PaymentAttempt) {
  safeSetItem(`${ATTEMPT_PREFIX}${memberId}`, JSON.stringify(attempt));
}

export function clearPaymentAttempt(memberId: string) {
  safeRemoveItem(`${ATTEMPT_PREFIX}${memberId}`);
  const legacy = safeGetJson<Record<string, unknown>>(`${LEGACY_CONTEXT_PREFIX}${memberId}`);
  if (legacy && typeof legacy.idempotencyKey === 'string') {
    safeRemoveItem(`${LEGACY_CONTEXT_PREFIX}${memberId}`);
  }
}

// ---------------------------------------------------------------------------
// Return-page polling schedule
// ---------------------------------------------------------------------------

/**
 * Automatic status checks after the redirect-back: about 40 s in total, then
 * the page stops and offers a manual "Refresh status". Never polls forever.
 */
export const PAYMENT_RETURN_POLL_DELAYS_MS = [2000, 3000, 5000, 8000, 10000, 12000] as const;

/** Provider parameters appended to the return URL that the page never needs. */
export function stripProviderReturnParams(search: string): string {
  const params = new URLSearchParams(search);
  let changed = false;
  for (const key of Array.from(params.keys())) {
    if (/^pg_/i.test(key)) {
      params.delete(key);
      changed = true;
    }
  }
  if (!changed) return search;
  const next = params.toString();
  return next ? `?${next}` : '';
}
