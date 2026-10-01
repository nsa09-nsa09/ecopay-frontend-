import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  ApiError,
  type User,
  type TwoFactorChallenge,
  type AuthResponse,
  type StaffLoginResponse,
  getCurrentUser,
  isTwoFactorChallenge,
  loginRequest,
  logoutRequest,
  refreshRequest,
  registerRequest,
  requestPasswordResetRequest,
  confirmPasswordResetRequest,
  resendStaffTwoFactorRequest,
  staffLoginRequest,
  updateCurrentUser,
  verifyEmailCodeRequest,
  verifyStaffTwoFactorRequest,
} from '../../lib/api';
import { clearAdminDashboardCache } from '../../lib/admin-dashboard-cache';
import { readWithLegacyMigration, removeWithLegacyKeys } from '../../lib/legacy-storage';
import { parseMessageBody, startRealtime } from '../../lib/realtime';

interface BanEvent {
  type: 'BANNED';
  reason?: string;
  bannedAt?: string;
}

const BAN_EVENT_STORAGE_KEY = 'ecopay.banEvent';
const LEGACY_BAN_EVENT_STORAGE_KEYS = ['ecosplit.banEvent'] as const;

export interface PersistedBanEvent {
  reason: string | null;
  bannedAt: string | null;
}

export function consumePersistedBanEvent(): PersistedBanEvent | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = readWithLegacyMigration(
      window.sessionStorage,
      BAN_EVENT_STORAGE_KEY,
      LEGACY_BAN_EVENT_STORAGE_KEYS,
    );
    if (!raw) return null;
    removeWithLegacyKeys(window.sessionStorage, BAN_EVENT_STORAGE_KEY, LEGACY_BAN_EVENT_STORAGE_KEYS);
    return JSON.parse(raw) as PersistedBanEvent;
  } catch {
    return null;
  }
}

function persistBanEvent(reason: string | null, bannedAt: string | null) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(BAN_EVENT_STORAGE_KEY, JSON.stringify({ reason, bannedAt }));
  } catch {
    /* sessionStorage may be unavailable — ban screen will fall back to generic copy */
  }
}

// Access token lives in memory only. Refresh token lives in an httpOnly cookie
// set by the backend — never in JS-visible storage — so an XSS payload can't
// exfiltrate long-lived credentials.
interface SessionState {
  accessToken: string;
  user: User | null;
}

export type StaffLoginResult =
  { kind: 'session'; user: User } | { kind: 'twoFactor'; challenge: TwoFactorChallenge };

// Regular sign-up confirms the 6-digit code sent to the user's email before a
// session is issued. Dev auto-verify is the exception and returns a ready session.
export type RegisterResult =
  | { kind: 'session'; user: User }
  | { kind: 'verificationRequired'; channel: 'email'; identifier: string };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<StaffLoginResult>;
  staffLogin: (email: string, password: string) => Promise<StaffLoginResult>;
  verifyStaffTwoFactor: (challengeId: string, code: string) => Promise<User>;
  resendStaffTwoFactor: (challengeId: string) => Promise<void>;
  register: (
    displayName: string,
    email: string,
    password: string,
    termsAccepted: boolean,
    acceptedTermsVersion?: number,
    acceptedPrivacyVersion?: number,
  ) => Promise<RegisterResult>;
  verifyEmailCode: (email: string, code: string) => Promise<User>;
  /** Merge a fresh user object (e.g. after confirming an email change) into the session. */
  applyUser: (user: User) => void;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (payload: { displayName: string; slug?: string }) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  authorizedRequest: <T>(operation: (accessToken: string) => Promise<T>) => Promise<T>;
  /** Valid access token for WebSocket handshakes (refreshes if about to expire). */
  getAccessToken: () => Promise<string | null>;
}

// Non-sensitive "were you signed in?" hint so anonymous visitors don't pay a
// pointless /auth/refresh round-trip on every reload. The real credential is
// the httpOnly cookie; this flag just says "try refreshing on boot".
const SESSION_HINT_KEY = 'ecopay.session';
const LEGACY_SESSION_HINT_KEYS = ['ecosplit.session'] as const;
const AuthContext = createContext<AuthContextType>(null!);

function readSessionHint(): { user: User | null } | null {
  if (typeof window === 'undefined') return null;
  let raw: string | null = null;
  try {
    raw = readWithLegacyMigration(window.localStorage, SESSION_HINT_KEY, LEGACY_SESSION_HINT_KEYS);
  } catch {
    // Storage denied (private mode / blocked site data): behave as anonymous.
    return null;
  }
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as { user?: User | null } | null;
    if (!parsed || typeof parsed !== 'object') throw new Error('malformed session hint');
    return { user: parsed.user ?? null };
  } catch {
    try {
      removeWithLegacyKeys(window.localStorage, SESSION_HINT_KEY, LEGACY_SESSION_HINT_KEYS);
    } catch {
      /* storage unavailable */
    }
    return null;
  }
}

function writeSessionHint(user: User | null) {
  if (typeof window === 'undefined') return;
  // The hint is a convenience only; a storage failure must never break login.
  try {
    if (!user) {
      removeWithLegacyKeys(window.localStorage, SESSION_HINT_KEY, LEGACY_SESSION_HINT_KEYS);
      return;
    }
    window.localStorage.setItem(SESSION_HINT_KEY, JSON.stringify({ user }));
  } catch {
    /* storage unavailable — the session still lives in memory */
  }
}

type LockManagerLike = {
  request<T>(name: string, callback: () => Promise<T>): Promise<T>;
};

/**
 * Runs the refresh-token rotation under a cross-tab Web Lock when the browser
 * supports it. The backend treats re-use of an already-rotated refresh cookie
 * as token theft and revokes every session, so two tabs (or two parallel 401s
 * in one tab) must never rotate at the same time.
 */
function runRefreshExclusively(): Promise<AuthResponse> {
  const locks =
    typeof navigator !== 'undefined'
      ? (navigator as Navigator & { locks?: LockManagerLike }).locks
      : undefined;
  if (locks && typeof locks.request === 'function') {
    return locks.request<AuthResponse>('ecopay-auth-refresh', () => refreshRequest());
  }
  return refreshRequest();
}

/**
 * True when the JWT expires within `skewMs`. The token is only decoded to
 * schedule a refresh — never trusted for authorization decisions.
 */
function isTokenExpiring(token: string, skewMs = 30_000): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return false;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as {
      exp?: number;
    };
    return typeof json.exp === 'number' && json.exp * 1000 - Date.now() < skewMs;
  } catch {
    return false;
  }
}

/** Only an explicit auth rejection ends the session; a network blip must not log the user out. */
function isAuthRejection(error: unknown) {
  return error instanceof ApiError && (error.status === 401 || error.status === 403);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<SessionState | null>(null);
  const [isReady, setIsReady] = useState(false);
  // Mirror of `session` for async code (authorizedRequest, refresh) so it never
  // acts on a stale render closure.
  const sessionRef = useRef<SessionState | null>(null);
  // One in-flight refresh shared by every concurrent 401 in this tab.
  const refreshInFlightRef = useRef<Promise<AuthResponse> | null>(null);

  const setSession = (
    next: SessionState | null | ((current: SessionState | null) => SessionState | null),
  ) => {
    const resolved = typeof next === 'function' ? next(sessionRef.current) : next;
    sessionRef.current = resolved;
    setSessionState(resolved);
  };

  const commitSession = (nextSession: SessionState | null) => {
    setSession(nextSession);
    writeSessionHint(nextSession?.user ?? null);
  };

  const refreshOnce = () => {
    if (!refreshInFlightRef.current) {
      refreshInFlightRef.current = runRefreshExclusively().finally(() => {
        refreshInFlightRef.current = null;
      });
    }
    return refreshInFlightRef.current;
  };

  /**
   * A currently valid access token for long-lived connections (WebSocket
   * handshakes). Refreshes through the shared single-flight refresh when the
   * token is about to expire; returns null when the user is signed out.
   */
  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const current = sessionRef.current;
    if (!current) return null;
    if (!isTokenExpiring(current.accessToken)) return current.accessToken;
    try {
      const refreshed = await refreshOnce();
      const active = sessionRef.current;
      if (active && active.accessToken !== refreshed.accessToken) {
        commitSession({ accessToken: refreshed.accessToken, user: refreshed.user ?? active.user });
      }
      return refreshed.accessToken;
    } catch (error) {
      if (isAuthRejection(error) && sessionRef.current === current) commitSession(null);
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime ban listener — when a user is banned by an admin, the backend
  // publishes a STOMP message at /topic/users/{id}/account. We tear down the
  // session immediately and bounce to /login with the reason so the same
  // event in the login page can render it. Depends only on the user id, so a
  // token rotation does not reconnect it.
  const userId = session?.user?.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const handle = startRealtime({
      getAccessToken,
      onConnect: (client) => {
        if (!active) return;
        client.subscribe(`/topic/users/${userId}/account`, (message) => {
          const event = parseMessageBody<BanEvent>(message.body);
          if (!event || event.type !== 'BANNED') return;
          persistBanEvent(event.reason ?? null, event.bannedAt ?? null);
          // Drop session locally — best-effort server logout follows.
          commitSession(null);
          handle.stop();
          const params = new URLSearchParams();
          params.set('banned', '1');
          if (event.reason) params.set('reason', event.reason);
          if (event.bannedAt) params.set('bannedAt', event.bannedAt);
          if (typeof window !== 'undefined') {
            window.location.replace(`/login?${params.toString()}`);
          }
        });
      },
    });
    return () => {
      active = false;
      handle.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // On mount: if we have a "was signed in" hint, ask the backend to mint a
  // new access token from the httpOnly refresh cookie. If it 401s (cookie
  // expired / revoked), fall back to anonymous.
  useEffect(() => {
    let isCancelled = false;

    async function restoreSession() {
      const hint = readSessionHint();
      if (!hint) {
        if (!isCancelled) setIsReady(true);
        return;
      }

      try {
        const refreshed = await refreshOnce();
        if (isCancelled) return;
        commitSession({
          accessToken: refreshed.accessToken,
          user: refreshed.user ?? hint.user,
        });
      } catch (error) {
        if (isCancelled) return;
        if (isAuthRejection(error)) {
          commitSession(null);
        } else {
          // Offline / server hiccup on boot: stay anonymous for this page view
          // but keep the hint so the next load can still restore the session.
          setSession(null);
        }
      } finally {
        if (!isCancelled) setIsReady(true);
      }
    }

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    if (isTwoFactorChallenge(response)) {
      return { kind: 'twoFactor' as const, challenge: response };
    }
    commitSession({
      accessToken: response.accessToken,
      user: response.user,
    });
    return { kind: 'session' as const, user: response.user };
  };

  const isStaff = (role: string | undefined | null) => role === 'ADMIN' || role === 'SUPPORT';

  const commitStaffSession = (response: AuthResponse): User => {
    if (!isStaff(response.user?.role)) {
      // Never persist a non-staff session via the admin login path.
      commitSession(null);
      throw new ApiError(403, 'This account does not have staff access.');
    }
    commitSession({
      accessToken: response.accessToken,
      user: response.user,
    });
    return response.user;
  };

  const staffLogin = async (email: string, password: string): Promise<StaffLoginResult> => {
    const response: StaffLoginResponse = await staffLoginRequest(email, password);

    if (isTwoFactorChallenge(response)) {
      return { kind: 'twoFactor', challenge: response };
    }

    const user = commitStaffSession(response);
    return { kind: 'session', user };
  };

  const verifyStaffTwoFactor = async (challengeId: string, code: string) => {
    const response = await verifyStaffTwoFactorRequest(challengeId, code);
    return commitStaffSession(response);
  };

  const resendStaffTwoFactor = async (challengeId: string) => {
    await resendStaffTwoFactorRequest(challengeId);
  };

  const register = async (
    displayName: string,
    email: string,
    password: string,
    termsAccepted: boolean,
    acceptedTermsVersion?: number,
    acceptedPrivacyVersion?: number,
  ): Promise<RegisterResult> => {
    const response = await registerRequest(
      displayName,
      email,
      password,
      termsAccepted,
      acceptedTermsVersion,
      acceptedPrivacyVersion,
    );
    // Dev auto-verify returns a ready session; the normal flow returns only the
    // user and expects the emailed code to be confirmed next.
    if (response.accessToken) {
      commitSession({
        accessToken: response.accessToken,
        user: response.user,
      });
      return { kind: 'session', user: response.user };
    }
    return { kind: 'verificationRequired', channel: 'email', identifier: email };
  };

  const verifyEmailCode = async (email: string, code: string) => {
    const response = await verifyEmailCodeRequest(email, code);
    commitSession({
      accessToken: response.accessToken,
      user: response.user,
    });
    return response.user;
  };

  /** Push an updated user object (returned by a profile mutation) into the live session. */
  const applyUser = (user: User) => {
    setSession((currentSession) => {
      if (!currentSession) {
        writeSessionHint(null);
        return null;
      }
      const nextSession = { ...currentSession, user };
      writeSessionHint(user);
      return nextSession;
    });
  };

  const logout = async () => {
    try {
      // Cookie carries the refresh token — no argument needed. Best-effort;
      // we drop local state either way.
      await logoutRequest();
    } catch {
      /* ignore — server-side revoke is best-effort */
    } finally {
      commitSession(null);
      // Drop staff-only caches on sign-out so a fresh login (possibly as a
      // different user) starts with no stale data leaking through.
      clearAdminDashboardCache();
    }
  };

  const requestPasswordReset = async (email: string) => {
    await requestPasswordResetRequest(email);
  };

  const confirmPasswordReset = async (token: string, newPassword: string) => {
    await confirmPasswordResetRequest(token, newPassword);
  };

  // Identity only changes when the signed-in account changes, not on every
  // access-token rotation: pages list `authorizedRequest` in effect deps, so a
  // refresh must not re-run their loads or reconnect their sockets.
  const sessionIdentity = session ? `user:${session.user?.id ?? 'unknown'}` : 'anonymous';
  const authorizedRequest = useCallback(
    async <T,>(operation: (accessToken: string) => Promise<T>): Promise<T> => {
      const current = sessionRef.current;
      if (!current) {
        throw new ApiError(401, 'Please sign in to continue');
      }

      try {
        return await operation(current.accessToken);
      } catch (error) {
        if (!(error instanceof ApiError) || error.status !== 401) {
          throw error;
        }

        // A parallel request may already have rotated the token while this one
        // was in flight — reuse it instead of rotating the cookie again.
        const latest = sessionRef.current;
        if (latest && latest.accessToken !== current.accessToken) {
          return operation(latest.accessToken);
        }

        let refreshed: AuthResponse;
        try {
          refreshed = await refreshOnce();
        } catch (refreshError) {
          if (
            isAuthRejection(refreshError) &&
            sessionRef.current?.accessToken === current.accessToken
          ) {
            commitSession(null);
          }
          throw refreshError;
        }

        const active = sessionRef.current;
        // Commit once (siblings sharing the same refresh skip this) and never
        // resurrect a session the user logged out of in the meantime.
        if (active && active.accessToken !== refreshed.accessToken) {
          commitSession({
            accessToken: refreshed.accessToken,
            user: refreshed.user ?? active.user,
          });
        }
        return operation(refreshed.accessToken);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionIdentity],
  );

  const updateProfile = async (payload: { displayName: string; slug?: string }) => {
    const user = await authorizedRequest((accessToken) => updateCurrentUser(payload, accessToken));

    setSession((currentSession) => {
      if (!currentSession) {
        writeSessionHint(null);
        return null;
      }

      const nextSession = { ...currentSession, user };
      writeSessionHint(user);
      return nextSession;
    });

    return user;
  };

  /** Re-fetch /users/me and update the stored session (e.g. after phone verification). */
  const refreshUser = async () => {
    const user = await authorizedRequest((accessToken) => getCurrentUser(accessToken));

    setSession((currentSession) => {
      if (!currentSession) {
        writeSessionHint(null);
        return null;
      }

      const nextSession = { ...currentSession, user };
      writeSessionHint(user);
      return nextSession;
    });

    return user;
  };

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        isAuthenticated: Boolean(session?.accessToken),
        isReady,
        login,
        staffLogin,
        verifyStaffTwoFactor,
        resendStaffTwoFactor,
        register,
        verifyEmailCode,
        applyUser,
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
        refreshUser,
        authorizedRequest,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
