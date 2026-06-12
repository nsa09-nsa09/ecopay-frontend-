export type UserRole = "USER" | "SUPPORT" | "ADMIN";

export interface User {
  id: number;
  email: string;
  displayName: string;
  phone: string | null;
  phoneVerified: boolean;
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, "");

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

/**
 * Send a 6-digit SMS code to verify the given phone for the signed-in user.
 * Backend: POST /api/v1/auth/phone/request-code (auth required).
 * Phone must be in +7XXXXXXXXXX format.
 */
export function requestPhoneCodeRequest(phone: string, accessToken: string) {
  return requestJson<void>(
    "/auth/phone/request-code",
    {
      method: "POST",
      body: JSON.stringify({ phone }),
    },
    accessToken,
  );
}

/**
 * Confirm the SMS code for the signed-in user, marking their phone verified.
 * Backend: POST /api/v1/auth/phone/verify (auth required).
 */
export function verifyPhoneRequest(phone: string, code: string, accessToken: string) {
  return requestJson<void>(
    "/auth/phone/verify",
    {
      method: "POST",
      body: JSON.stringify({ phone, code }),
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
// Payments (membership checkout)
// ============================================================
//
// A member pays their share to advance the membership from APPLIED → PENDING.
// In dev the backend uses the in-memory mock gateway, which charges
// synchronously and returns status SUCCESS (no redirect). Real Freedom Pay in
// prod returns requiresRedirect + paymentUrl, and the webhook finalizes later.

export type PaymentIntentStatus = "PENDING" | "SUCCESS" | "FAILED" | "EXPIRED" | string;

export interface PaymentIntentResponseDto {
  id: number;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  providerName: string;
  externalPaymentId: string | null;
  roomMemberId: number;
  paymentUrl: string | null;
  requiresRedirect: boolean;
  saveCardRequested: boolean;
  failureCode: string | null;
  failureMessage: string | null;
}

export function createPaymentIntentRequest(
  roomMemberId: number,
  payload: { idempotencyKey: string; saveCard?: boolean; savedCardId?: number },
  accessToken: string,
) {
  return requestJson<PaymentIntentResponseDto>(`/payments/members/${roomMemberId}/intent`, {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function getPaymentIntentRequest(intentId: number, accessToken: string) {
  return requestJson<PaymentIntentResponseDto>(`/payments/intents/${intentId}`, {}, accessToken);
}

/**
 * Redirect-back reconciliation: called when the user returns from the Freedom
 * Pay hosted page. The backend actively queries the gateway and finalizes the
 * intent (and the membership) if the payment already succeeded.
 */
export function confirmPaymentSuccessRequest(
  intentId: number,
  accessToken: string,
  externalTransactionId?: string,
) {
  return requestJson<PaymentIntentResponseDto>(`/payments/intents/${intentId}/confirm-success`, {
    method: "POST",
    body: JSON.stringify({ externalTransactionId: externalTransactionId ?? "" }),
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
  senderUserId: number;
  senderRole: string;
  message: string;
  attachmentUrl: string | null;
  createdAt: string;
}

export interface SupportTicketResponse {
  id: number;
  userId: number;
  roomId: number | null;
  roomMemberId: number | null;
  subject: string;
  topic: string;
  status: string;
  priority: string;
  escalatedToDispute: boolean;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  messages: SupportMessageDto[];
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

// ============================================================
// Reviews
// ============================================================

export interface ReviewDto {
  id: number;
  authorId: number;
  authorDisplayName: string;
  recipientId: number;
  roomId: number;
  rating: number;
  text: string | null;
  createdAt: string;
}

export interface CreateReviewPayload {
  recipientId: number;
  roomId: number;
  rating: number;
  text?: string;
}

export function createReviewRequest(payload: CreateReviewPayload, accessToken: string) {
  return requestJson<ReviewDto>("/reviews", {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

// ============================================================
// Reputation (public)
// ============================================================

export interface ReputationDto {
  userId: number;
  displayName: string;
  reputation: number;
  averageRating: number | null;
  reviewsCount: number;
  completedRoomsCount: number;
}

export function getReputationRequest(userId: number) {
  return requestJson<ReputationDto>(`/reputation/users/${userId}`);
}

export function getReputationReviewsRequest(userId: number) {
  return requestJson<ReviewDto[]>(`/reputation/users/${userId}/reviews`);
}

// ============================================================
// Support tickets (current user)
// ============================================================

export interface CreateSupportTicketPayload {
  roomId?: number;
  roomMemberId?: number;
  subject: string;
  topic: string;
  message: string;
}

export function createSupportTicketRequest(
  payload: CreateSupportTicketPayload,
  accessToken: string,
) {
  return requestJson<SupportTicketResponse>("/support-tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function getMySupportTicketsRequest(accessToken: string) {
  return requestJson<SupportTicketResponse[]>("/support-tickets", {}, accessToken);
}

export function getMySupportTicketRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(`/support-tickets/${ticketId}`, {}, accessToken);
}

export function postSupportTicketMessageRequest(
  ticketId: number,
  message: string,
  accessToken: string,
) {
  return requestJson<SupportTicketResponse>(`/support-tickets/${ticketId}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  }, accessToken);
}

// ============================================================
// Payouts (owner)
// ============================================================

export interface PayoutDto {
  id: number;
  amount: number;
  currency: string;
  status: string;
  providerPayoutId: string | null;
  failureReason: string | null;
  roomId: number | null;
  createdAt: string;
  processedAt: string | null;
}

export interface PayoutMethodDto {
  id: number;
  providerName: string;
  panMask: string;
  isDefault: boolean;
  status: string;
  createdAt: string;
}

export function getMyPayoutsRequest(accessToken: string) {
  return requestJson<PayoutDto[]>("/payouts/me", {}, accessToken);
}

export function getPayoutRequest(payoutId: number, accessToken: string) {
  return requestJson<PayoutDto>(`/payouts/${payoutId}`, {}, accessToken);
}

export function getPayoutMethodsRequest(accessToken: string) {
  return requestJson<PayoutMethodDto[]>("/payouts/methods", {}, accessToken);
}

export function registerPayoutMethodRequest(
  payload: { providerCardToken: string; panMask?: string },
  accessToken: string,
) {
  return requestJson<PayoutMethodDto>("/payouts/methods", {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function deletePayoutMethodRequest(methodId: number, accessToken: string) {
  return requestJson<void>(`/payouts/methods/${methodId}`, {
    method: "DELETE",
  }, accessToken);
}

// ============================================================
// Refunds (member)
// ============================================================

export interface RefundTransactionResponse {
  id: number;
  paymentTransactionId: number;
  disputeId: number | null;
  adminUserId: number | null;
  status: string;
  amount: number;
  currency: string;
  reason: string | null;
  idempotencyKey: string;
  providerRefundId: string | null;
  createdAt: string;
  updatedAt: string;
}

export function getMyRefundsRequest(accessToken: string) {
  return requestJson<RefundTransactionResponse[]>("/refunds/me", {}, accessToken);
}

export function getRefundRequest(refundId: number, accessToken: string) {
  return requestJson<RefundTransactionResponse>(`/refunds/${refundId}`, {}, accessToken);
}

// ============================================================
// Email verification
// ============================================================

// Backend returns a plain text body on success; requestJson<string> falls
// through the JSON.parse catch and hands us the raw string.
export function verifyEmailRequest(token: string) {
  return requestJson<string>(`/auth/verify-email${toSearchParams({ token })}`);
}

export function resendVerificationEmailRequest(email: string) {
  return requestJson<void>("/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}
