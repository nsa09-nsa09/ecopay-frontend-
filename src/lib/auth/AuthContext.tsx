import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../api/auth";
import { userApi } from "../api/user";
import { clearTokens, getAccess, getRefresh, setTokens } from "../api/tokens";
import type { LoginRequest, RegisterRequest, Role, UserDto } from "../api/types";

interface AuthContextValue {
  user: UserDto | null;
  role: Role | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (creds: LoginRequest) => Promise<UserDto>;
  register: (body: RegisterRequest) => Promise<UserDto>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setLoading] = useState<boolean>(Boolean(getAccess()));

  const refreshMe = useCallback(async () => {
    try {
      if (!getAccess()) {
        setUser(null);
        return;
      }
      const me = await userApi.me();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (creds: LoginRequest) => {
    const resp = await authApi.login(creds);
    setTokens(resp.accessToken, resp.refreshToken);
    const me = resp.user ?? (await userApi.me());
    setUser(me);
    return me;
  }, []);

  const register = useCallback(async (body: RegisterRequest) => {
    const resp = await authApi.register(body);
    setTokens(resp.accessToken, resp.refreshToken);
    const me = resp.user ?? (await userApi.me());
    setUser(me);
    return me;
  }, []);

  const logout = useCallback(async () => {
    const refresh = getRefresh();
    try {
      if (refresh) await authApi.logout(refresh);
    } catch {
      // ignore — token may already be expired
    }
    clearTokens();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, isLoading, login, register, logout, refreshMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
