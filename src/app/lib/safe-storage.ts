// Defensive wrappers around Web Storage.
//
// localStorage/sessionStorage can throw on access (Safari private mode, "block
// site data", sandboxed iframes, quota exceeded). Every caller in payment and
// auth flows must keep working — at worst without persistence — so these
// helpers never throw.

type StorageKind = 'local' | 'session';

function resolve(kind: StorageKind): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export function safeGetItem(key: string, kind: StorageKind = 'local'): string | null {
  try {
    return resolve(kind)?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

export function safeSetItem(key: string, value: string, kind: StorageKind = 'local'): boolean {
  try {
    const storage = resolve(kind);
    if (!storage) return false;
    storage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

export function safeRemoveItem(key: string, kind: StorageKind = 'local'): void {
  try {
    resolve(kind)?.removeItem(key);
  } catch {
    /* storage unavailable */
  }
}

/** Parses JSON from storage; malformed values are removed and reported as missing. */
export function safeGetJson<T>(key: string, kind: StorageKind = 'local'): T | null {
  const raw = safeGetItem(key, kind);
  if (raw == null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    safeRemoveItem(key, kind);
    return null;
  }
}
