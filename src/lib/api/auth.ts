import { apiPost } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  PasswordResetConfirmRequest,
  PasswordResetRequest,
  RefreshTokenRequest,
  RegisterRequest,
} from "./types";

export const authApi = {
  login: (body: LoginRequest) => apiPost<AuthResponse>("/auth/login", body),
  register: (body: RegisterRequest) => apiPost<AuthResponse>("/auth/register", body),
  refresh: (body: RefreshTokenRequest) => apiPost<AuthResponse>("/auth/refresh", body),
  logout: (refreshToken: string) =>
    apiPost<void>("/auth/logout", { refreshToken }),
  requestReset: (body: PasswordResetRequest) =>
    apiPost<void>("/auth/reset-password", body),
  confirmReset: (body: PasswordResetConfirmRequest) =>
    apiPost<void>("/auth/reset-password/confirm", body),
};
