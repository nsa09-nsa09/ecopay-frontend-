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
  return requestJson<RoomMemberDto>(`/rooms/${roomId}/members`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface RoomMemberDto {
  id: number;
  roomId: number;
  userId: number;
  userDisplayName: string;
  userEmail: string | null;
  status: string;
  requiresAdminReview: boolean;
  accessMethod: string | null;
  ownerAccessConfirmedAt: string | null;
  memberConfirmedAt: string | null;
  activatedAt: string | null;
  rejectedAt: string | null;
  endedAt: string | null;
  consentAcceptedAt: string | null;
  createdAt: string;
}

export interface MyRoomMembershipDto {
  id: number;
  roomId: number;
  userId: number;
  status: string;
  requiresAdminReview: boolean;
  identifierType: string | null;
  identifierMasked: string | null;
  accessMethod: string | null;
  ownerAccessConfirmedAt: string | null;
  memberConfirmedAt: string | null;
  activatedAt: string | null;
}

export interface JoinedRoomDto {
  roomId: number;
  memberId: number;
  title: string;
  roomType: string;
  roomStatus: string;
  memberStatus: string;
  requiresAdminReview: boolean;
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

export interface RevealedIdentifierDto {
  roomId: number;
  roomMemberId: number;
  identifierType: string;
  identifierValue: string;
  revealedForReason: string;
}

export interface CreateRoomPayload {
  categoryId?: number | null;
  serviceId: number;
  tariffPlanId?: number | null;
  roomType: string;
  title: string;
  description?: string | null;
  maxMembers: number;
  priceTotal?: number | null;
  pricePerMember?: number | null;
  currency?: string | null;
  periodType: string;
  startDate: string;
  cancellationPolicy?: string | null;
  providerName?: string | null;
  tariffNameSnapshot?: string | null;
  connectionType?: string | null;
  operatorRestrictions?: string | null;
  operatorTermsConfirmed?: boolean | null;
}

export interface UpdateRoomPayload {
  title?: string;
  description?: string;
  maxMembers?: number;
  priceTotal?: number;
  pricePerMember?: number;
  cancellationPolicy?: string;
  providerName?: string;
  tariffNameSnapshot?: string;
  connectionType?: string;
  operatorRestrictions?: string;
  operatorTermsConfirmed?: boolean;
}

export function getCategories() {
  return requestJson<CategoryDto[]>("/catalog/categories");
}

export function createRoomRequest(payload: CreateRoomPayload, accessToken: string) {
  return requestJson<RoomResponseDto>("/rooms", {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function getMyRooms(accessToken: string, params: Record<string, string | number | undefined> = {}) {
  return requestJson<PagedResponse<RoomSummaryDto>>(`/rooms/me${toSearchParams(params)}`, {}, accessToken);
}

export function getJoinedRooms(accessToken: string) {
  return requestJson<JoinedRoomDto[]>("/rooms/joined", {}, accessToken);
}

export function updateRoomRequest(roomId: number, payload: UpdateRoomPayload, accessToken: string) {
  return requestJson<RoomResponseDto>(`/rooms/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function markRoomReadyRequest(roomId: number, accessToken: string) {
  return requestJson<RoomResponseDto>(`/rooms/${roomId}/ready-for-verification`, {
    method: "POST",
  }, accessToken);
}

export function cancelRoomRequest(roomId: number, accessToken: string) {
  return requestJson<RoomResponseDto>(`/rooms/${roomId}/cancel`, {
    method: "POST",
  }, accessToken);
}

export function completeRoomRequest(roomId: number, accessToken: string) {
  return requestJson<RoomResponseDto>(`/rooms/${roomId}/complete`, {
    method: "POST",
  }, accessToken);
}

export function getRoomMembers(
  roomId: number,
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PagedResponse<RoomMemberDto>>(`/rooms/${roomId}/members${toSearchParams(params)}`, {}, accessToken);
}

export function getMyMembership(roomId: number, accessToken: string) {
  return requestJson<MyRoomMembershipDto>(`/rooms/${roomId}/members/me`, {}, accessToken);
}

export function confirmOwnerAccessRequest(
  roomId: number,
  memberId: number,
  accessMethod: string,
  accessToken: string,
) {
  return requestJson<RoomMemberDto>(`/rooms/${roomId}/members/${memberId}/owner-access`, {
    method: "PATCH",
    body: JSON.stringify({ accessMethod }),
  }, accessToken);
}

export function confirmMemberAccessRequest(roomId: number, accessToken: string) {
  return requestJson<MyRoomMembershipDto>(`/rooms/${roomId}/members/me/confirm-access`, {
    method: "POST",
  }, accessToken);
}

export function revealIdentifierRequest(
  roomId: number,
  memberId: number,
  payload: { reason: string; contextType?: string; contextId?: number },
  accessToken: string,
) {
  return requestJson<RevealedIdentifierDto>(`/rooms/${roomId}/members/${memberId}/reveal-identifier`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}
