// Payout-card connection ("Connect payout card") helpers.
//
// The provider tokenization details (card tokens, provider codes, raw provider
// messages) never reach the UI. A card counts as connected only when the
// backend says so — reaching the return page proves nothing.

import {
  initPayoutCardBindingRequest,
  type PayoutCardBindingConfirmDto,
  type PayoutMethodDto,
} from './api';
import { isSafeId } from './payment-context';
import { safeGetItem, safeRemoveItem, safeSetItem } from './safe-storage';

const PENDING_BINDING_KEY = 'ecopay.pendingCardBinding';

export const PAYOUT_CARD_RETURN_PATH = '/payment/card-connected';

export function savePendingBinding(bindingId: string | number) {
  safeSetItem(PENDING_BINDING_KEY, String(bindingId));
}

export function readPendingBinding(): string | null {
  const value = safeGetItem(PENDING_BINDING_KEY);
  if (value != null && !isSafeId(value)) {
    safeRemoveItem(PENDING_BINDING_KEY);
    return null;
  }
  return value;
}

export function clearPendingBinding() {
  safeRemoveItem(PENDING_BINDING_KEY);
}

export type BindingUiState = 'success' | 'pending' | 'failed' | 'rebind';

/**
 * Maps the confirm response to a UI state. `REQUIRES_REBIND` / `requiresRebind`
 * are optional fields a newer backend may send; older backends only send
 * SUCCESS | PENDING | FAILED. Unknown statuses are treated as pending.
 */
export function classifyBindingResult(result: PayoutCardBindingConfirmDto | null): BindingUiState {
  if (!result) return 'pending';
  const status = (result.status ?? '').toUpperCase();
  if (result.requiresRebind === true || status === 'REQUIRES_REBIND') return 'rebind';
  if (result.method && payoutMethodNeedsRebind(result.method)) return 'rebind';
  if (status === 'SUCCESS') return 'success';
  if (status === 'FAILED' || status === 'CANCELLED' || status === 'EXPIRED') return 'failed';
  return 'pending';
}

export function payoutMethodNeedsRebind(method: PayoutMethodDto) {
  return method.requiresRebind === true || (method.status ?? '').toUpperCase() === 'REQUIRES_REBIND';
}

/** A method the backend will pay out to: active, default and not flagged for re-binding. */
export function isUsablePayoutMethod(method: PayoutMethodDto) {
  return (
    method.isDefault === true &&
    (method.status ?? '').toUpperCase() === 'ACTIVE' &&
    !payoutMethodNeedsRebind(method)
  );
}

/** Only follow provider redirects to http(s) URLs. */
export function isSafeProviderUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Starts a binding and returns the hosted-page URL. The caller decides whether
 * to navigate in the same tab or a new one. Throws when the backend gives no
 * usable URL.
 */
export async function startPayoutCardBinding(
  authorizedRequest: <T>(operation: (accessToken: string) => Promise<T>) => Promise<T>,
): Promise<string> {
  const res = await authorizedRequest((token) =>
    initPayoutCardBindingRequest(
      { returnUrl: `${window.location.origin}${PAYOUT_CARD_RETURN_PATH}` },
      token,
    ),
  );
  if (!res || !isSafeProviderUrl(res.paymentUrl)) {
    throw new Error('binding-not-started');
  }
  savePendingBinding(res.bindingId);
  return res.paymentUrl;
}
