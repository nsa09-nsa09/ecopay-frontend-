export interface User {
  id: number;
  email: string;
  displayName: string;
  avatar: string | null;
  status: string;
  role: string;
  reputation: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface ServiceDto {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  providerType: string;
}

export interface TariffPlanDto {
  id: number;
  serviceId: number;
  name: string;
  periodType: string;
  maxMembers: number;
  basePriceTotal: number;
  currency: string;
  connectionType: string;
  operatorRules: string;
}

export interface RoomSummaryDto {
  id: number;
  title: string;
  roomType: string;
  status: string;
  maxMembers: number;
  priceTotal: number;
  pricePerMember: number;
  currency: string;
  startDate: string;
  ownerUserId: number;
  ownerDisplayName: string;
  serviceId: number;
  serviceName: string;
}

export interface RoomResponseDto {
  id: number;
  ownerUserId: number;
  categoryId: number;
  serviceId: number;
  tariffPlanId: number;
  roomType: string;
  verificationMode: string;
  status: string;
  title: string;
  description: string | null;
  maxMembers: number;
  priceTotal: number;
  pricePerMember: number;
  currency: string;
  periodType: string;
  startDate: string;
  cancellationPolicy: string | null;
  providerName: string;
  tariffNameSnapshot: string;
  connectionType: string;
  operatorRestrictions: string | null;
  operatorTermsConfirmed: boolean;
  readyForVerificationAt: string | null;
  completedAt: string | null;
  blockedAt: string | null;
  blockReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

interface ErrorPayload {
  message?: string;
  errors?: Record<string, string>;
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "/api/v1").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  errors: Record<string, string>;

  constructor(status: number, message: string, errors: Record<string, string> = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function buildUrl(path: string) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

async function parseResponseBody(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}, accessToken?: string): Promise<T> {
  const headers = new Headers(init.headers);
  const hasJsonBody = init.body != null && !(init.body instanceof FormData);

  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers,
  });

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const payload = typeof body === "object" && body !== null ? (body as ErrorPayload) : {};
    const message =
      payload.message ??
      (typeof body === "string" && body.trim() ? body : `Request failed with status ${response.status}`);

    throw new ApiError(response.status, message, payload.errors ?? {});
  }

  if (response.status === 204 || body == null) {
    return undefined as T;
  }

  return body as T;
}

function toSearchParams(params: Record<string, string | number | undefined>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export function loginRequest(email: string, password: string) {
  return requestJson<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(displayName: string, email: string, password: string) {
  return requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName, email, password }),
  });
}

export function refreshRequest(refreshToken: string) {
  return requestJson<AuthResponse>("/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function logoutRequest(refreshToken: string) {
  return requestJson<void>("/auth/logout", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });
}

export function requestPasswordResetRequest(email: string) {
  return requestJson<void>("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordResetRequest(token: string, newPassword: string) {
  return requestJson<void>("/auth/reset-password/confirm", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getCurrentUser(accessToken: string) {
  return requestJson<User>("/users/me", {}, accessToken);
}

export function updateCurrentUser(
  payload: { displayName: string; avatar?: string | null },
  accessToken: string,
) {
  return requestJson<User>(
    "/users/me",
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function getServices(categoryId?: number) {
  return requestJson<ServiceDto[]>(`/catalog/services${toSearchParams({ categoryId })}`);
}

export function getService(serviceId: number) {
  return requestJson<ServiceDto>(`/catalog/services/${serviceId}`);
}

export function getTariffs(serviceId: number) {
  return requestJson<TariffPlanDto[]>(`/catalog/services/${serviceId}/tariffs`);
}

export function getRooms(params: Record<string, string | number | undefined> = {}) {
  return requestJson<PagedResponse<RoomSummaryDto>>(`/rooms${toSearchParams(params)}`);
}

export function getRoom(roomId: number) {
  return requestJson<RoomResponseDto>(`/rooms/${roomId}`);
}

export function joinRoomRequest(
  roomId: number,
  payload: {
    consentAccepted: boolean;
    identifierType?: string;
    identifierValue?: string;
  },
  accessToken: string,
) {
  return requestJson(`/rooms/${roomId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}
