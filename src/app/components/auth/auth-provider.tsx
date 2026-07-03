import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Client } from "@stomp/stompjs";
import {
  ApiError,
  buildSupportWebSocketUrl,
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
  verifyStaffTwoFactorRequest,
} from "../../lib/api";
import { clearAdminDashboardCache } from "../../lib/admin-dashboard-cache";

interface BanEvent {
  type: "BANNED";
  reason?: string;
  bannedAt?: string;
}

const BAN_EVENT_STORAGE_KEY = "ecosplit.banEvent";

export interface PersistedBanEvent {
  reason: string | null;
  bannedAt: string | null;
}

export function consumePersistedBanEvent(): PersistedBanEvent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(BAN_EVENT_STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(BAN_EVENT_STORAGE_KEY);
    return JSON.parse(raw) as PersistedBanEvent;
  } catch {
    return null;
  }
}

function persistBanEvent(reason: string | null, bannedAt: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(BAN_EVENT_STORAGE_KEY, JSON.stringify({ reason, bannedAt }));
  } catch {
    /* sessionStorage may be unavailable — ban screen will fall back to generic copy */
  }
}

interface SessionState {
  accessToken: string;
  refreshToken: string;
  user: User | null;
}

export type StaffLoginResult =
  | { kind: "session"; user: User }
  | { kind: "twoFactor"; challenge: TwoFactorChallenge };

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isReady: boolean;
  login: (email: string, password: string) => Promise<User>;
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
  ) => Promise<User>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (payload: { displayName: string }) => Promise<User>;
  refreshUser: () => Promise<User | null>;
  authorizedRequest: <T>(operation: (accessToken: string) => Promise<T>) => Promise<T>;
}

const STORAGE_KEY = "ecosplit.session";
const AuthContext = createContext<AuthContextType>(null!);

function loadStoredSession(): SessionState | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as SessionState;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: SessionState | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState | null>(() => loadStoredSession());
  const [isReady, setIsReady] = useState(false);
  const banClientRef = useRef<Client | null>(null);

  const commitSession = (nextSession: SessionState | null) => {
    setSession(nextSession);
    persistSession(nextSession);
  };

  // Realtime ban listener — when a user is banned by an admin, the backend
  // publishes a STOMP message at /topic/users/{id}/account. We tear down the
  // session immediately and bounce to /login with the reason so the same
  // event in the login page can render it.
  useEffect(() => {
    // Tear down any previous subscription if session changes.
    const tearDown = () => {
      const client = banClientRef.current;
      banClientRef.current = null;
      if (client) {
        try { void client.deactivate(); } catch { /* ignore */ }
      }
    };

    const userId = session?.user?.id;
    const accessToken = session?.accessToken;
    if (!userId || !accessToken) {
      tearDown();
      return;
    }

    let active = true;
    const client = new Client({
      webSocketFactory: () => new WebSocket(buildSupportWebSocketUrl(accessToken)),
      reconnectDelay: 5000,
      onConnect: () => {
        if (!active) return;
        client.subscribe(`/topic/users/${userId}/account`, (message) => {
          try {
            const event = JSON.parse(message.body) as BanEvent;
            if (event?.type !== "BANNED") return;
            persistBanEvent(event.reason ?? null, event.bannedAt ?? null);
            // Drop session locally — best-effort server logout follows.
            commitSession(null);
            tearDown();
            const params = new URLSearchParams();
            params.set("banned", "1");
            if (event.reason) params.set("reason", event.reason);
            if (event.bannedAt) params.set("bannedAt", event.bannedAt);
            if (typeof window !== "undefined") {
              window.location.replace(`/login?${params.toString()}`);
            }
          } catch {
            /* malformed event — ignore */
          }
        });
      },
      onStompError: () => { /* swallow — ban listener is best-effort */ },
      onWebSocketError: () => { /* swallow */ },
    });

    banClientRef.current = client;
    client.activate();

    return () => {
      active = false;
      tearDown();
    };
  }, [session?.user?.id, session?.accessToken]);

  useEffect(() => {
    let isCancelled = false;

    async function restoreSession() {
      if (!session) {
        if (!isCancelled) {
          setIsReady(true);
        }
        return;
      }

      try {
        const user = await getCurrentUser(session.accessToken);

        if (!isCancelled) {
          commitSession({ ...session, user });
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          try {
            const refreshed = await refreshRequest(session.refreshToken);
            const nextSession = {
              accessToken: refreshed.accessToken,
              refreshToken: refreshed.refreshToken,
              user: refreshed.user ?? session.user,
            };

            if (!isCancelled) {
              commitSession(nextSession);
            }
          } catch {
            if (!isCancelled) {
              commitSession(null);
            }
          }
        } else if (!isCancelled) {
          commitSession(null);
        }
      } finally {
        if (!isCancelled) {
          setIsReady(true);
        }
      }
    }

    void restoreSession();

    return () => {
      isCancelled = true;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const response = await loginRequest(email, password);
    const nextSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    };

    commitSession(nextSession);
    return response.user;
  };

  const isStaff = (role: string | undefined | null) => role === "ADMIN" || role === "SUPPORT";

  const commitStaffSession = (response: AuthResponse): User => {
    if (!isStaff(response.user?.role)) {
      // Never persist a non-staff session via the admin login path.
      commitSession(null);
      throw new ApiError(403, "This account does not have staff access.");
    }
    commitSession({
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    });
    return response.user;
  };

  const staffLogin = async (email: string, password: string): Promise<StaffLoginResult> => {
    const response: StaffLoginResponse = await staffLoginRequest(email, password);

    if (isTwoFactorChallenge(response)) {
      return { kind: "twoFactor", challenge: response };
    }

    const user = commitStaffSession(response);
    return { kind: "session", user };
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
  ) => {
    const response = await registerRequest(
      displayName,
      email,
      password,
      termsAccepted,
      acceptedTermsVersion,
      acceptedPrivacyVersion,
    );
    const nextSession = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    };

    commitSession(nextSession);
    return response.user;
  };

  const logout = async () => {
    const refreshToken = session?.refreshToken;

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
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

  const authorizedRequest = async <T,>(operation: (accessToken: string) => Promise<T>) => {
    if (!session) {
      throw new ApiError(401, "Please sign in to continue");
    }

    try {
      return await operation(session.accessToken);
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        throw error;
      }

      try {
        const refreshed = await refreshRequest(session.refreshToken);
        const nextSession = {
          accessToken: refreshed.accessToken,
          refreshToken: refreshed.refreshToken,
          user: refreshed.user ?? session.user,
        };

        commitSession(nextSession);
        return operation(nextSession.accessToken);
      } catch (refreshError) {
        commitSession(null);
        throw refreshError;
      }
    }
  };

  const updateProfile = async (payload: { displayName: string }) => {
    const user = await authorizedRequest((accessToken) => updateCurrentUser(payload, accessToken));

    setSession((currentSession) => {
      if (!currentSession) {
        persistSession(null);
        return null;
      }

      const nextSession = {
        ...currentSession,
        user,
      };

      persistSession(nextSession);
      return nextSession;
    });

    return user;
  };

  /** Re-fetch /users/me and update the stored session (e.g. after phone verification). */
  const refreshUser = async () => {
    const user = await authorizedRequest((accessToken) => getCurrentUser(accessToken));

    setSession((currentSession) => {
      if (!currentSession) {
        persistSession(null);
        return null;
      }

      const nextSession = { ...currentSession, user };
      persistSession(nextSession);
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
        logout,
        requestPasswordReset,
        confirmPasswordReset,
        updateProfile,
        refreshUser,
        authorizedRequest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
