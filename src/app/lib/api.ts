export type UserRole = "USER" | "SUPPORT" | "ADMIN";

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatar: string | null;
  status: string;
  role: UserRole | string;
  reputation: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TwoFactorChallenge {
  requiresTwoFactor: true;
  challengeId: string;
  expiresAt: string;
  maskedEmail: string;
}

export type StaffLoginResponse = AuthResponse | TwoFactorChallenge;

export function isTwoFactorChallenge(value: StaffLoginResponse): value is TwoFactorChallenge {
  return (value as TwoFactorChallenge).requiresTwoFactor === true;
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

export function registerRequest(displayName: string, email: string, password: string, phone: string) {
  return requestJson<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ displayName, email, password, phone }),
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

// ============================================================
// Staff / Admin authentication
// ============================================================
//
// We reuse POST /auth/login for the initial credential step — the backend
// either returns standard session tokens (current behaviour) or a 2FA
// challenge envelope ({ requiresTwoFactor, challengeId, expiresAt,
// maskedEmail }) once 2FA is enabled. Either way, frontend code branches
// on `isTwoFactorChallenge` and does not need a separate path today.
//
// The follow-up verify/resend endpoints live under /auth/login/* to match
// the existing `/auth/reset-password/confirm` sub-resource style. These
// are a backend dependency — they become live once Spring implements the
// 2FA service over the existing `staff_two_factor_challenges` table.

export function staffLoginRequest(email: string, password: string) {
  return requestJson<StaffLoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function verifyStaffTwoFactorRequest(challengeId: string, code: string) {
  return requestJson<AuthResponse>("/auth/login/2fa/verify", {
    method: "POST",
    body: JSON.stringify({ challengeId, code }),
  });
}

export function resendStaffTwoFactorRequest(challengeId: string) {
  return requestJson<void>("/auth/login/2fa/resend", {
    method: "POST",
    body: JSON.stringify({ challengeId }),
  });
}

// ============================================================
// Admin / staff API
// ============================================================

// Backend uses two slightly different page envelopes: PagedResponse (admin
// users/rooms) carries hasNext/hasPrevious flags; PageResponse (logs,
// support tickets, disputes) does not. Both expose page/size/totalItems/
// totalPages/items, which is all the UI relies on.
export interface PageResponse<T> {
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  items: T[];
}

export interface AdminDashboardKpisDto {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalRooms: number;
  openRooms: number;
  activeRooms: number;
  completedRooms: number;
  blockedRooms: number;
  totalRevenue: number | string;
  totalRefunds: number | string;
  openDisputes: number;
  pendingModeration: number;
  pendingPayouts: number;
}

export interface AdminUserDto {
  id: number;
  email: string;
  emailMasked: string | null;
  displayName: string;
  phone: string | null;
  phoneMasked: string | null;
  phoneVerified: boolean | null;
  avatar: string | null;
  role: string | null;
  status: string | null;
  reputation: number | null;
  riskScore: number | null;
  roomsOwned: number | null;
  roomsJoined: number | null;
  tickets: number | null;
  disputes: number | null;
  createdAt: string | null;
}

export interface AdminDecisionRequest {
  reason: string;
}

export function getAdminDashboardKpisRequest(accessToken: string) {
  return requestJson<AdminDashboardKpisDto>("/admin/dashboard/kpis", {}, accessToken);
}

export function getAdminUsersRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PagedResponse<AdminUserDto>>(
    `/admin/users${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function banUserRequest(userId: number, reason: string, accessToken: string) {
  return requestJson<AdminUserDto>(`/admin/users/${userId}/ban`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }, accessToken);
}

export function unbanUserRequest(userId: number, reason: string, accessToken: string) {
  return requestJson<AdminUserDto>(`/admin/users/${userId}/unban`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  }, accessToken);
}

export function getAdminRoomsRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PagedResponse<RoomSummaryDto>>(
    `/admin/rooms${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function blockRoomRequest(roomId: number, reason: string, accessToken: string) {
  return requestJson<void>(`/admin/moderation/rooms/${roomId}/block`, {
    method: "PATCH",
    body: JSON.stringify({ reason }),
  }, accessToken);
}

// ---- Support tickets (staff) ----

export interface SupportMessageDto {
  id: number;
  ticketId: number;
  authorUserId: number;
  authorRole: string;
  body: string;
  internalNote: boolean;
  createdAt: string;
}

export interface SupportTicketResponse {
  id: number;
  userId: number;
  roomId: number | null;
  roomMemberId: number | null;
  subject: string;
  topic: string | null;
  status: string;
  priority: string | null;
  escalatedToDispute: boolean | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages: SupportMessageDto[] | null;
}

export function getStaffSupportQueueRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PageResponse<SupportTicketResponse>>(
    `/staff/support-tickets/queue${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function getStaffSupportTicketRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}`,
    {},
    accessToken,
  );
}

export function assignStaffTicketToMeRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}/assign-to-me`,
    { method: "POST" },
    accessToken,
  );
}

export function updateStaffTicketStatusRequest(
  ticketId: number,
  status: string,
  accessToken: string,
) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}/status`,
    { method: "POST", body: JSON.stringify({ status }) },
    accessToken,
  );
}

export function escalateStaffTicketRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}/escalate`,
    { method: "POST" },
    accessToken,
  );
}

// ---- Disputes ----

export interface DisputeResponse {
  id: number;
  roomId: number | null;
  roomMemberId: number | null;
  ticketId: number | null;
  openedByUserId: number | null;
  assignedAdminId: number | null;
  reasonCode: string | null;
  description: string | null;
  status: string;
  decision: string | null;
  decisionComment: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DisputeDecisionRequest {
  decision: string;
  decisionComment: string;
}

export function getAdminDisputesRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PageResponse<DisputeResponse>>(
    `/admin/disputes${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function assignDisputeToMeRequest(disputeId: number, accessToken: string) {
  return requestJson<DisputeResponse>(
    `/admin/disputes/${disputeId}/assign`,
    { method: "PATCH" },
    accessToken,
  );
}

export function decideDisputeRequest(
  disputeId: number,
  payload: DisputeDecisionRequest,
  accessToken: string,
) {
  return requestJson<DisputeResponse>(
    `/admin/disputes/${disputeId}/decision`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
}

// ---- Logs ----

export interface AdminActionLogDto {
  id: number;
  eventId: string;
  adminUserId: number;
  actionType: string;
  entityType: string;
  entityId: number;
  reason: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface RoomEventLogDto {
  id: number;
  eventId: string;
  actorUserId: number | null;
  actorRole: string | null;
  roomId: number;
  roomMemberId: number | null;
  eventType: string;
  oldState: unknown;
  newState: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export function getAdminActionLogsRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PageResponse<AdminActionLogDto>>(
    `/admin/logs/admin-actions${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function getRoomEventLogsRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PageResponse<RoomEventLogDto>>(
    `/admin/logs/room-events${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

// ---- Moderation queue ----

export interface ModerationQueueItemDto {
  id: number;
  entityType: string;
  entityId: number;
  roomId: number | null;
  roomMemberId: number | null;
  reasonCode: string | null;
  riskScore: number | string | null;
  status: string;
  assignedAdminId: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface BatchConfirmRequest {
  queueIds: number[];
  reason: string;
}

export function getModerationQueueRequest(accessToken: string) {
  return requestJson<ModerationQueueItemDto[]>(
    "/admin/moderation/queue",
    {},
    accessToken,
  );
}

export function assignModerationItemRequest(queueId: number, accessToken: string) {
  return requestJson<ModerationQueueItemDto>(
    `/admin/moderation/queue/${queueId}/assign`,
    { method: "PATCH" },
    accessToken,
  );
}

export function confirmModerationItemRequest(
  queueId: number,
  reason: string,
  accessToken: string,
) {
  return requestJson<ModerationQueueItemDto>(
    `/admin/moderation/queue/${queueId}/confirm`,
    { method: "PATCH", body: JSON.stringify({ reason }) },
    accessToken,
  );
}

export function rejectModerationItemRequest(
  queueId: number,
  reason: string,
  accessToken: string,
) {
  return requestJson<ModerationQueueItemDto>(
    `/admin/moderation/queue/${queueId}/reject`,
    { method: "PATCH", body: JSON.stringify({ reason }) },
    accessToken,
  );
}

export function batchConfirmModerationRequest(
  payload: BatchConfirmRequest,
  accessToken: string,
) {
  return requestJson<ModerationQueueItemDto[]>(
    "/admin/moderation/queue/batch-confirm",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}
