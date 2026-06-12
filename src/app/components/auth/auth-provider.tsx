import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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
  verifyStaffTwoFactorRequest,
} from "../../lib/api";

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
  register: (displayName: string, email: string, password: string, phone: string) => Promise<User>;
  logout: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (token: string, newPassword: string) => Promise<void>;
  updateProfile: (payload: { displayName: string; avatar?: string | null }) => Promise<User>;
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

  const commitSession = (nextSession: SessionState | null) => {
    setSession(nextSession);
    persistSession(nextSession);
  };

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

  const register = async (displayName: string, email: string, password: string, phone: string) => {
    const response = await registerRequest(displayName, email, password, phone);
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

  const updateProfile = async (payload: { displayName: string; avatar?: string | null }) => {
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
