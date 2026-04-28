import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { clearTokens, getAccess, getRefresh, setTokens } from "./tokens";

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://api.ecopay.kz/api/v1";

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: unknown;
  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  const refreshToken = getRefresh();
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(
      `${API_URL}/auth/refresh`,
      { refreshToken },
      { headers: { "Content-Type": "application/json" } },
    );
    const access: string | undefined = data?.accessToken ?? data?.token;
    const refresh: string | undefined = data?.refreshToken;
    if (!access) return null;
    setTokens(access, refresh ?? refreshToken);
    return access;
  } catch {
    clearTokens();
    return null;
  }
}

api.interceptors.response.use(
  (resp) => resp,
  async (error: AxiosError<any>) => {
    const original = error.config as
      | (AxiosRequestConfig & { _retry?: boolean })
      | undefined;

    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshing) refreshing = performRefresh();
      const newAccess = await refreshing;
      refreshing = null;
      if (newAccess) {
        original.headers = original.headers ?? {};
        (original.headers as Record<string, string>).Authorization = `Bearer ${newAccess}`;
        return api.request(original);
      }
      clearTokens();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
        const redirect = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/login?redirect=${redirect}`;
      }
    }

    const data = error.response?.data;
    const message =
      (data && (data.message || data.error || data.detail)) ||
      error.message ||
      "Request failed";
    throw new ApiError(
      message,
      error.response?.status ?? 0,
      data?.code,
      data,
    );
  },
);

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.get<T>(url, config);
  return data;
}
export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.post<T>(url, body, config);
  return data;
}
export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.put<T>(url, body, config);
  return data;
}
export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.patch<T>(url, body, config);
  return data;
}
export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await api.delete<T>(url, config);
  return data;
}
