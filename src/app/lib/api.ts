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
  publicId?: string | null;
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
  minPricePerMember?: number | null;
  currency?: string | null;
  tariffCount?: number;
}

export type CatalogSort = "name_asc" | "name_desc" | "price_asc" | "price_desc" | "newest";

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
  features?: string[] | null;
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

export function buildSupportWebSocketUrl(accessToken: string) {
  const wsUrl = new URL(
    "/ws",
    /^https?:\/\//.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin,
  );

  wsUrl.protocol = wsUrl.protocol === "https:" ? "wss:" : "ws:";
  wsUrl.searchParams.set("token", accessToken);
  return wsUrl.toString();
}

import { getFriendlyApiMessage, type FriendlyApiErrorCode } from "./locale";

/**
 * Heuristic: detect server-side internals that must never leak to end users
 * (Java exception class names, raw stack-trace hints, Spring's "no static
 * resource" 404 page, etc).
 */
function looksLikeServerInternalsMessage(raw: string | undefined | null): boolean {
  if (!raw) return false;
  const s = raw.trim();
  if (!s) return false;
  // Spring's NoResourceFoundException leaks the request path.
  if (/no static resource/i.test(s)) return true;
  // Anything that mentions a Java exception class.
  if (/exception\b/i.test(s)) return true;
  // Common "stack trace" or fully-qualified Java class hints.
  if (/(\b[a-z][a-z0-9_]*\.){2,}[A-Z][A-Za-z0-9_]*/.test(s)) return true;
  // Generic "Request failed with status N" produced when the body had no JSON.
  if (/^request failed with status \d+/i.test(s)) return true;
  return false;
}

function classifyApiErrorCode(
  status: number,
  rawMessage: string | undefined | null,
): FriendlyApiErrorCode {
  if (status === 0) return "network";
  if (status === 401) return "sessionExpired";
  if (status === 403) return "noAccess";
  if (status === 404) return "notAvailable";
  if (rawMessage && /no static resource/i.test(rawMessage)) return "notAvailable";
  if (status >= 500) return "serverError";
  return "generic";
}

/**
 * Returns a UI-safe message: the server's friendly `payload.message` when it
 * is clearly a curated string, otherwise our own localized fallback. Raw
 * server internals (exception classes, "no static resource", stack-trace
 * hints) are never returned.
 */
function buildFriendlyApiMessage(
  status: number,
  rawMessage: string | undefined | null,
  code: FriendlyApiErrorCode,
): string {
  if (rawMessage && !looksLikeServerInternalsMessage(rawMessage) && rawMessage.length <= 240) {
    return rawMessage;
  }
  return getFriendlyApiMessage(code);
}

export class ApiError extends Error {
  status: number;
  errors: Record<string, string>;
  /**
   * Stable, locale-agnostic code derived from the HTTP status / message
   * shape. UI code can switch on this to render an appropriate retry block.
   */
  code: FriendlyApiErrorCode;
  /**
   * Raw server-provided message. Kept for logging only — DO NOT render this
   * directly to end users; use `message` (already sanitized + localized) or
   * `getFriendlyApiMessage(error.code)` instead.
   */
  serverMessage: string | null;

  constructor(status: number, rawMessage: string, errors: Record<string, string> = {}) {
    const code = classifyApiErrorCode(status, rawMessage);
    const friendly = buildFriendlyApiMessage(status, rawMessage, code);
    super(friendly);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
    this.code = code;
    this.serverMessage = rawMessage ?? null;
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

  let response: Response;
  try {
    response = await fetch(buildUrl(path), {
      ...init,
      headers,
    });
  } catch (err) {
    // Network failure (DNS, offline, CORS preflight reject). Surface a
    // friendly localized ApiError so catch-blocks across the UI render a
    // user-safe message rather than "TypeError: Failed to fetch".
    if (typeof console !== "undefined" && console.warn) {
      console.warn(`[api] ${init.method ?? "GET"} ${path} network error:`, err);
    }
    throw new ApiError(0, err instanceof Error ? err.message : "Network error");
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const payload = typeof body === "object" && body !== null ? (body as ErrorPayload) : {};
    const rawMessage =
      payload.message ??
      (typeof body === "string" && body.trim() ? body : `Request failed with status ${response.status}`);

    // Log the raw server detail to console for engineers; the thrown ApiError
    // exposes a sanitized + localized `.message` to the UI.
    if (typeof console !== "undefined" && console.warn) {
      console.warn(
        `[api] ${init.method ?? "GET"} ${path} failed with ${response.status}:`,
        rawMessage,
      );
    }

    throw new ApiError(response.status, rawMessage, payload.errors ?? {});
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

// ============================================================
// FX rates (multi-currency room creation)
// ============================================================
//
// Backend returns KZT-per-unit rates for each supported foreign currency.
// `base` is always "KZT". The frontend uses this to live-convert any
// non-KZT price the room owner enters into a KZT equivalent.

export type SupportedCurrency =
  | "KZT"
  | "USD"
  | "EUR"
  | "CNY"
  | "GBP"
  | "RUB"
  | "UZS"
  | "KGS";

export interface FxRatesResponse {
  base: string;
  updatedAt: string;
  rates: Partial<Record<SupportedCurrency, number>> & Record<string, number>;
}

export function getFxRatesRequest() {
  return requestJson<FxRatesResponse>("/fx/rates");
}

// ============================================================
// Member dashboard (current user's stats)
// ============================================================

export interface MemberDashboardEventDto {
  id?: number;
  eventType: string;
  roomId?: number | null;
  roomTitle?: string | null;
  amountKzt?: number | string | null;
  createdAt: string;
}

export interface MemberDashboardDto {
  joinedRoomsActive: number;
  joinedRoomsCompleted: number;
  totalRoomsJoined: number;
  monthlySpendKzt: number | string;
  totalSpentKzt: number | string;
  totalSavedKzt: number | string;
  nextPaymentDate: string | null;
  nextPaymentAmountKzt: number | string | null;
  reputationScore: number | string;
  reviewsReceived: number;
  disputesAsMember: number;
  recentEvents: MemberDashboardEventDto[];
}

export function getMyDashboardRequest(accessToken: string) {
  return requestJson<MemberDashboardDto>("/users/me/dashboard", {}, accessToken);
}

// ============================================================
// User feedback (complaints / ideas / requests)
// ============================================================

export type FeedbackType = "COMPLAINT" | "IDEA" | "REQUEST" | string;
export type FeedbackStatus = "NEW" | "IN_REVIEW" | "RESOLVED" | "DISMISSED" | string;

export interface FeedbackDto {
  id: number;
  userId: number | null;
  userDisplayName?: string | null;
  userEmail?: string | null;
  type: FeedbackType;
  subject: string | null;
  message: string;
  status: FeedbackStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFeedbackPayload {
  type: FeedbackType;
  subject?: string | null;
  message: string;
}

export interface UpdateFeedbackPayload {
  status?: FeedbackStatus;
  adminNote?: string | null;
}

export function createFeedbackRequest(payload: CreateFeedbackPayload, accessToken: string) {
  return requestJson<FeedbackDto>(
    "/feedback",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function getMyFeedbackRequest(
  accessToken: string,
  params: { page?: number; size?: number } = {},
) {
  return requestJson<PageResponse<FeedbackDto>>(
    `/feedback/me${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function adminGetFeedbackRequest(
  accessToken: string,
  params: {
    type?: string;
    status?: string;
    q?: string;
    page?: number;
    size?: number;
  } = {},
) {
  return requestJson<PageResponse<FeedbackDto>>(
    `/admin/feedback${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function adminGetFeedbackItemRequest(id: number, accessToken: string) {
  return requestJson<FeedbackDto>(`/admin/feedback/${id}`, {}, accessToken);
}

export function adminUpdateFeedbackRequest(
  id: number,
  payload: UpdateFeedbackPayload,
  accessToken: string,
) {
  return requestJson<FeedbackDto>(
    `/admin/feedback/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
}

// ============================================================
// Anonymous analytics (guest visit tracking)
// ============================================================
//
// Lightweight POST that records a page view for traffic analytics. No auth
// header — the backend cookies the guest and aggregates uniqueness.
// Failures are ignored on the client (errors are swallowed by the caller),
// so this must never block rendering.

export function trackVisitRequest(path: string): Promise<void> {
  return requestJson<void>("/analytics/visit", {
    method: "POST",
    body: JSON.stringify({ path }),
    credentials: "include",
  });
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
  payload: { displayName: string },
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

const servicesCache = new Map<string, Promise<ServiceDto[]>>();

export function getServices(categoryId?: number, sort?: CatalogSort) {
  const key = `${categoryId ?? ""}::${sort ?? ""}`;
  const cached = servicesCache.get(key);
  if (cached) return cached;
  const promise = requestJson<ServiceDto[]>(
    `/catalog/services${toSearchParams({ categoryId, sort })}`,
  ).catch((err) => {
    servicesCache.delete(key);
    throw err;
  });
  servicesCache.set(key, promise);
  return promise;
}

export function clearServicesCache() {
  servicesCache.clear();
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
  currency?: SupportedCurrency | string | null;
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
  // Extended fields delivered by the backend alongside the original KPIs.
  // All optional so old responses don't break the UI.
  uniqueVisitorsToday?: number | null;
  uniqueVisitors30d?: number | null;
  totalPageViews30d?: number | null;
  avgMembersPerRoom?: number | string | null;
  totalActiveSubscriptionsValueKzt?: number | string | null;
  newRoomsLast30Days?: number | null;
  conversionVisitorToUser30d?: number | string | null;
  refundRatePercent?: number | string | null;
  openTickets?: number | null;
  avgRoomFillRate?: number | string | null;
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
  ownerVerified?: boolean | null;
  publicId?: string | null;
  lastLoginAt?: string | null;
}

export interface AdminDecisionRequest {
  reason: string;
}

export function getAdminDashboardKpisRequest(accessToken: string) {
  return requestJson<AdminDashboardKpisDto>("/admin/dashboard/kpis", {}, accessToken);
}

export type DashboardGranularity = "day" | "month";

export interface DashboardMetricPoint {
  period: string;
  registrations: number;
  loginsTotal: number;
  uniqueLogins: number;
  // Extended series fields (optional).
  uniqueVisitors?: number | null;
  pageViews?: number | null;
  newRooms?: number | null;
  revenue?: number | string | null;
}

export interface DashboardMetricsResponse {
  granularity: DashboardGranularity;
  from: string;
  to: string;
  series: DashboardMetricPoint[];
  newUsersLast30Days?: number | null;
}

export function getAdminDashboardMetrics(
  accessToken: string,
  params: { granularity?: DashboardGranularity; from?: string; to?: string } = {},
) {
  return requestJson<DashboardMetricsResponse>(
    `/admin/dashboard/metrics${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

// ---- Admin dashboard: distributions / popular ----

export interface PopularServiceDto {
  serviceId: number;
  serviceName: string;
  roomsCount: number;
  activeMembersCount: number;
}

export interface OperatorDistributionDto {
  code: string;
  operatorName: string;
  count: number;
}

export interface NamedCountDto {
  label: string;
  value: number;
}

export function getAdminPopularServicesRequest(accessToken: string, limit = 10) {
  return requestJson<PopularServiceDto[]>(
    `/admin/dashboard/popular-services${toSearchParams({ limit })}`,
    {},
    accessToken,
  );
}

export function getAdminOperatorDistributionRequest(accessToken: string) {
  return requestJson<OperatorDistributionDto[]>(
    "/admin/dashboard/operator-distribution",
    {},
    accessToken,
  );
}

export function getAdminCurrencyDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>(
    "/admin/dashboard/currency-distribution",
    {},
    accessToken,
  );
}

export function getAdminCategoryDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>(
    "/admin/dashboard/category-distribution",
    {},
    accessToken,
  );
}

export function getAdminRoomStatusDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>(
    "/admin/dashboard/room-status-distribution",
    {},
    accessToken,
  );
}

export function getAdminCountryDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>(
    "/admin/dashboard/country-distribution",
    {},
    accessToken,
  );
}

// ---- Global admin search (top bar) ----

export interface AdminSearchRoomDto {
  id: number;
  title: string;
  status: string | null;
  serviceName: string | null;
  ownerDisplayName: string | null;
}

export interface AdminSearchUserDto {
  id: number;
  displayName: string;
  email: string | null;
  role: string | null;
  status: string | null;
}

export interface AdminSearchFeedbackDto {
  id: number;
  subject: string | null;
  message: string;
  type: string | null;
  status: string | null;
}

export interface AdminSearchResponse {
  rooms: AdminSearchRoomDto[];
  users: AdminSearchUserDto[];
  feedback: AdminSearchFeedbackDto[];
}

export function adminGlobalSearchRequest(
  query: string,
  accessToken: string,
  init?: { signal?: AbortSignal },
) {
  return requestJson<AdminSearchResponse>(
    `/admin/search${toSearchParams({ q: query })}`,
    { signal: init?.signal },
    accessToken,
  );
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

export interface CreateAdminUserRequest {
  email: string;
  displayName: string;
  password: string;
  role: "USER" | "SUPPORT" | "ADMIN";
  phone?: string;
}

export function createAdminUserRequest(payload: CreateAdminUserRequest, accessToken: string) {
  return requestJson<AdminUserDto>("/admin/users", {
    method: "POST",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function getAdminUserRequest(userId: number, accessToken: string) {
  return requestJson<AdminUserDto>(`/admin/users/${userId}`, {}, accessToken);
}

export function updateAdminUserRoleRequest(
  userId: number,
  payload: { role: "USER" | "SUPPORT" | "ADMIN"; reason: string },
  accessToken: string,
) {
  return requestJson<AdminUserDto>(`/admin/users/${userId}/role`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  }, accessToken);
}

export function updateAdminUserOwnerVerifiedRequest(
  userId: number,
  payload: { verified: boolean; reason?: string },
  accessToken: string,
) {
  return requestJson<AdminUserDto>(`/admin/users/${userId}/owner-verified`, {
    method: "PATCH",
    body: JSON.stringify(payload),
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
  assignedAdminId: number | null;
  assignedAdminDisplayName: string | null;
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

export function getStaffAssignedSupportTicketsRequest(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PageResponse<SupportTicketResponse>>(
    `/staff/support-tickets/assigned${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function postStaffSupportTicketMessageRequest(
  ticketId: number,
  message: string,
  accessToken: string,
) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}/messages`,
    { method: "POST", body: JSON.stringify({ message }) },
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

export interface OwnerViolationSanctionRequest {
  createRefund: boolean;
  paymentTransactionId?: number;
  refundAmount?: number;
  reason: string;
}

export function applyOwnerViolationSanctionRequest(
  disputeId: number,
  payload: OwnerViolationSanctionRequest,
  accessToken: string,
) {
  return requestJson<DisputeResponse>(
    `/admin/disputes/${disputeId}/sanctions/owner-violation`,
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}

// ---- Refunds ----

export interface RefundTransactionResponse {
  id: number;
  disputeId: number | null;
  paymentTransactionId: number | null;
  providerRefundId: string | null;
  amount: number | string;
  currency: string | null;
  status: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export function getRefundsByDisputeRequest(disputeId: number, accessToken: string) {
  return requestJson<RefundTransactionResponse[]>(
    `/admin/refunds/by-dispute/${disputeId}`,
    {},
    accessToken,
  );
}

export function markRefundSuccessRequest(
  refundId: number,
  payload: { providerRefundId?: string },
  accessToken: string,
) {
  return requestJson<RefundTransactionResponse>(
    `/admin/refunds/${refundId}/success`,
    { method: "PATCH", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function markRefundFailRequest(
  refundId: number,
  payload: { providerRefundId?: string },
  accessToken: string,
) {
  return requestJson<RefundTransactionResponse>(
    `/admin/refunds/${refundId}/fail`,
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

// ============================================================
// Public user profile by hash + delete account
// ============================================================

export interface PublicProfileDto {
  id: number;
  publicId: string;
  displayName: string;
  avatar: string | null;
  reputation: number;
  status: string;
  averageRating: number | null;
  reviewsCount: number;
  completedRoomsCount: number;
  createdAt: string;
}

export function getPublicProfile(publicId: string) {
  return requestJson<PublicProfileDto>(`/users/public/${encodeURIComponent(publicId)}`);
}

export function deleteMyAccount(accessToken: string) {
  return requestJson<void>("/users/me", { method: "DELETE" }, accessToken);
}

export function uploadMyAvatar(file: File, accessToken: string) {
  const form = new FormData();
  form.append("file", file);
  return requestJson<User>(
    "/users/me/avatar",
    { method: "POST", body: form },
    accessToken,
  );
}

export function deleteMyAvatar(accessToken: string) {
  return requestJson<User>("/users/me/avatar", { method: "DELETE" }, accessToken);
}

// ============================================================
// Admin catalog CRUD (categories / services / tariffs)
// ============================================================

export interface AdminCategoryDto {
  id: number;
  name: string;
  slug: string;
  isActive: boolean;
  sortOrder: number;
  servicesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceDto {
  id: number;
  categoryId: number;
  categoryName: string;
  name: string;
  slug: string;
  providerType: string;
  isActive: boolean;
  tariffsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminTariffDto {
  id: number;
  serviceId: number;
  name: string;
  periodType: string;
  maxMembers: number;
  basePriceTotal: number;
  currency: string;
  connectionType: string | null;
  operatorRules: string | null;
  features?: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryPayload {
  name: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateCategoryPayload {
  name?: string;
  slug?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface CreateServicePayload {
  categoryId: number;
  name: string;
  slug?: string;
  providerType: string;
  isActive?: boolean;
}

export interface UpdateServicePayload {
  categoryId?: number;
  name?: string;
  slug?: string;
  providerType?: string;
  isActive?: boolean;
}

export interface CreateTariffPayload {
  name: string;
  periodType: string;
  maxMembers: number;
  basePriceTotal: number;
  currency?: string;
  connectionType?: string | null;
  operatorRules?: string | null;
  features?: string[];
}

export interface UpdateTariffPayload {
  name?: string;
  periodType?: string;
  maxMembers?: number;
  basePriceTotal?: number;
  currency?: string;
  connectionType?: string | null;
  operatorRules?: string | null;
  features?: string[];
  isActive?: boolean;
}

export function adminGetCategories(accessToken: string) {
  return requestJson<AdminCategoryDto[]>("/admin/catalog/categories", {}, accessToken);
}

export function adminCreateCategory(payload: CreateCategoryPayload, accessToken: string) {
  return requestJson<AdminCategoryDto>(
    "/admin/catalog/categories",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateCategory(id: number, payload: UpdateCategoryPayload, accessToken: string) {
  return requestJson<AdminCategoryDto>(
    `/admin/catalog/categories/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteCategory(id: number, accessToken: string) {
  return requestJson<void>(
    `/admin/catalog/categories/${id}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function adminGetServices(accessToken: string, categoryId?: number) {
  return requestJson<AdminServiceDto[]>(
    `/admin/catalog/services${toSearchParams({ categoryId })}`,
    {},
    accessToken,
  );
}

export function adminCreateService(payload: CreateServicePayload, accessToken: string) {
  return requestJson<AdminServiceDto>(
    "/admin/catalog/services",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateService(id: number, payload: UpdateServicePayload, accessToken: string) {
  return requestJson<AdminServiceDto>(
    `/admin/catalog/services/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteService(id: number, accessToken: string) {
  return requestJson<void>(
    `/admin/catalog/services/${id}`,
    { method: "DELETE" },
    accessToken,
  );
}

export function adminGetTariffs(serviceId: number, accessToken: string) {
  return requestJson<AdminTariffDto[]>(
    `/admin/catalog/services/${serviceId}/tariffs`,
    {},
    accessToken,
  );
}

export function adminCreateTariff(
  serviceId: number,
  payload: CreateTariffPayload,
  accessToken: string,
) {
  return requestJson<AdminTariffDto>(
    `/admin/catalog/services/${serviceId}/tariffs`,
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateTariff(id: number, payload: UpdateTariffPayload, accessToken: string) {
  return requestJson<AdminTariffDto>(
    `/admin/catalog/tariffs/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteTariff(id: number, accessToken: string) {
  return requestJson<void>(
    `/admin/catalog/tariffs/${id}`,
    { method: "DELETE" },
    accessToken,
  );
}

// ============================================================
// Service reviews (subscription service testimonials)
// ============================================================

export interface PublicServiceReviewDto {
  id: number;
  rating: number;
  text: string;
  authorDisplayName: string;
  authorPublicId: string;
  createdAt: string;
}

export interface ServiceReviewDto {
  id: number;
  authorId: number;
  authorDisplayName: string;
  authorPublicId: string;
  rating: number;
  text: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminServiceReviewDto {
  id: number;
  authorId: number;
  authorPublicId: string;
  authorDisplayName: string;
  authorEmail: string;
  rating: number;
  text: string;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceReviewPayload {
  rating: number;
  text: string;
}

export function getFeaturedServiceReviews() {
  return requestJson<PublicServiceReviewDto[]>("/service-reviews/featured");
}

export function getMyServiceReview(accessToken: string) {
  return requestJson<ServiceReviewDto | undefined>("/service-reviews/me", {}, accessToken);
}

export function createServiceReview(payload: ServiceReviewPayload, accessToken: string) {
  return requestJson<ServiceReviewDto>(
    "/service-reviews",
    { method: "POST", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function updateMyServiceReview(payload: ServiceReviewPayload, accessToken: string) {
  return requestJson<ServiceReviewDto>(
    "/service-reviews/me",
    { method: "PUT", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function deleteMyServiceReview(accessToken: string) {
  return requestJson<void>("/service-reviews/me", { method: "DELETE" }, accessToken);
}

export function adminGetServiceReviews(
  accessToken: string,
  params: { page?: number; size?: number; featured?: boolean } = {},
) {
  const query: Record<string, string | number | undefined> = {
    page: params.page,
    size: params.size,
  };
  if (params.featured !== undefined) {
    query.featured = params.featured ? "true" : "false";
  }
  return requestJson<PagedResponse<AdminServiceReviewDto>>(
    `/admin/service-reviews${toSearchParams(query)}`,
    {},
    accessToken,
  );
}

export function adminSetServiceReviewFeatured(
  id: number,
  featured: boolean,
  accessToken: string,
) {
  return requestJson<AdminServiceReviewDto>(
    `/admin/service-reviews/${id}/featured`,
    { method: "PATCH", body: JSON.stringify({ featured }) },
    accessToken,
  );
}

export function adminUpdateServiceReview(
  id: number,
  payload: { rating?: number; text?: string },
  accessToken: string,
) {
  return requestJson<AdminServiceReviewDto>(
    `/admin/service-reviews/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteServiceReview(id: number, accessToken: string) {
  return requestJson<void>(
    `/admin/service-reviews/${id}`,
    { method: "DELETE" },
    accessToken,
  );
}

// ───────────────────────────────────────────────────────────────
// Site content — "About Us" page
// ───────────────────────────────────────────────────────────────

export interface SiteAboutContent {
  companyName: string;
  // Legacy single-language fields — backend keeps them populated for
  // backward compatibility; new clients prefer the *_kz/_ru/_en variants.
  title: string;
  mission: string | null;
  description: string | null;
  // Per-language variants (added when the About page went multilingual).
  title_kz?: string | null;
  title_ru?: string | null;
  title_en?: string | null;
  mission_kz?: string | null;
  mission_ru?: string | null;
  mission_en?: string | null;
  description_kz?: string | null;
  description_ru?: string | null;
  description_en?: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  updatedAt: string | null;
}

export interface UpdateSiteAboutPayload {
  companyName: string;
  title: string;
  mission?: string | null;
  description?: string | null;
  title_kz?: string | null;
  title_ru?: string | null;
  title_en?: string | null;
  mission_kz?: string | null;
  mission_ru?: string | null;
  mission_en?: string | null;
  description_kz?: string | null;
  description_ru?: string | null;
  description_en?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

export function getSiteAboutRequest() {
  return requestJson<SiteAboutContent>("/site/about");
}

export function adminGetSiteAbout(accessToken: string) {
  return requestJson<SiteAboutContent>("/admin/site/about", {}, accessToken);
}

export function adminUpdateSiteAbout(payload: UpdateSiteAboutPayload, accessToken: string) {
  return requestJson<SiteAboutContent>(
    "/admin/site/about",
    { method: "PUT", body: JSON.stringify(payload) },
    accessToken,
  );
}
