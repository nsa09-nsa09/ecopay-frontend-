export type UserRole = 'USER' | 'SUPPORT' | 'ADMIN';

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
  reputationLevel?: string | null;
  publicId?: string | null;
  slug?: string | null;
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
  logoUrl?: string | null;
}

export type CatalogSort = 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc' | 'newest';

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
  ownerSlug?: string | null;
  ownerPublicId?: string | null;
  ownerReputation?: number | null;
  ownerReputationLevel?: string | null;
  serviceId: number;
  serviceName: string;
  serviceLogoUrl?: string | null;
}

export interface RoomResponseDto {
  id: number;
  ownerUserId: number;
  ownerSlug?: string | null;
  ownerPublicId?: string | null;
  categoryId: number;
  serviceId: number;
  serviceLogoUrl?: string | null;
  tariffPlanId: number;
  roomType: string;
  verificationMode: string;
  status: string;
  title: string;
  description: string | null;
  maxMembers: number;
  priceTotal: number;
  pricePerMember: number;
  /** ECOpay commission a joining member pays on top of pricePerMember (null if not computable). */
  pricePerMemberCommission?: number | null;
  /** Total a joining member pays = pricePerMember + pricePerMemberCommission. */
  pricePerMemberTotal?: number | null;
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

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

export function buildSupportWebSocketUrl(accessToken: string) {
  const wsUrl = new URL(
    '/ws',
    /^https?:\/\//.test(API_BASE_URL) ? new URL(API_BASE_URL).origin : window.location.origin,
  );

  wsUrl.protocol = wsUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  wsUrl.searchParams.set('token', accessToken);
  return wsUrl.toString();
}

import { getFriendlyApiMessage, type FriendlyApiErrorCode } from './locale';

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
  if (status === 0) return 'network';
  if (status === 401) return 'sessionExpired';
  if (status === 403) return 'noAccess';
  if (status === 404) return 'notAvailable';
  if (status === 429) return 'rateLimited';
  if (rawMessage && /no static resource/i.test(rawMessage)) return 'notAvailable';
  if (status >= 500) return 'serverError';
  return 'generic';
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
    this.name = 'ApiError';
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

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
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

async function requestJson<T>(
  path: string,
  init: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(init.headers);
  const hasJsonBody = init.body != null && !(init.body instanceof FormData);

  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
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
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[api] ${init.method ?? 'GET'} ${path} network error:`, err);
    }
    throw new ApiError(0, err instanceof Error ? err.message : 'Network error');
  }

  const body = await parseResponseBody(response);

  if (!response.ok) {
    const payload = typeof body === 'object' && body !== null ? (body as ErrorPayload) : {};
    const rawMessage =
      payload.message ??
      (typeof body === 'string' && body.trim()
        ? body
        : `Request failed with status ${response.status}`);

    // Log the raw server detail to console for engineers; the thrown ApiError
    // exposes a sanitized + localized `.message` to the UI.
    if (typeof console !== 'undefined' && console.warn) {
      console.warn(
        `[api] ${init.method ?? 'GET'} ${path} failed with ${response.status}:`,
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
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ============================================================
// FX rates (multi-currency room creation)
// ============================================================
//
// Backend returns KZT-per-unit rates for each supported foreign currency.
// `base` is always "KZT". The frontend uses this to live-convert any
// non-KZT price the room owner enters into a KZT equivalent.

export type SupportedCurrency = 'KZT' | 'USD' | 'EUR' | 'CNY' | 'GBP' | 'RUB' | 'UZS' | 'KGS';

export interface FxRatesResponse {
  base: string;
  updatedAt: string;
  rates: Partial<Record<SupportedCurrency, number>> & Record<string, number>;
}

export function getFxRatesRequest() {
  return requestJson<FxRatesResponse>('/fx/rates');
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
  return requestJson<MemberDashboardDto>('/users/me/dashboard', {}, accessToken);
}

// ============================================================
// User feedback (complaints / ideas / requests)
// ============================================================

export type FeedbackType = 'COMPLAINT' | 'IDEA' | 'REQUEST' | string;
export type FeedbackStatus = 'NEW' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | string;

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
    '/feedback',
    { method: 'POST', body: JSON.stringify(payload) },
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
    { method: 'PATCH', body: JSON.stringify(payload) },
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
  return requestJson<void>('/analytics/visit', {
    method: 'POST',
    body: JSON.stringify({ path }),
    credentials: 'include',
  });
}

export function loginRequest(email: string, password: string) {
  return requestJson<StaffLoginResponse>('/auth/login', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
}

export function registerRequest(
  displayName: string,
  email: string,
  password: string,
  termsAccepted: boolean,
  acceptedTermsVersion?: number,
  acceptedPrivacyVersion?: number,
) {
  return requestJson<AuthResponse>('/auth/register', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({
      displayName,
      email,
      password,
      termsAccepted,
      acceptedTermsVersion,
      acceptedPrivacyVersion,
    }),
  });
}

/**
 * Final registration step: confirm the 6-digit code emailed at sign-up. On success the backend
 * marks the email verified and returns a full session (access token + httpOnly refresh cookie),
 * so `credentials: 'include'` is required.
 * Backend: POST /api/v1/auth/verify-email-code.
 */
export function verifyEmailCodeRequest(email: string, code: string) {
  return requestJson<AuthResponse>('/auth/verify-email-code', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ email, code }),
  });
}

// Refresh & logout both rely on the httpOnly `ecopay_rt` cookie set by /login
// (or the previous /refresh call). We deliberately send no body so an
// XSS-exfiltrated JS runtime can't smuggle a stolen refresh token here — the
// browser attaches the cookie for us. Old backends that only read the body
// keep working while both sides deploy.
export function refreshRequest() {
  return requestJson<AuthResponse>('/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });
}

export function logoutRequest() {
  return requestJson<void>('/auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
}

export function requestPasswordResetRequest(email: string) {
  return requestJson<void>('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordResetRequest(token: string, newPassword: string) {
  return requestJson<void>('/auth/reset-password/confirm', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export function getCurrentUser(accessToken: string) {
  return requestJson<User>('/users/me', {}, accessToken);
}

export function updateCurrentUser(
  payload: { displayName: string; slug?: string },
  accessToken: string,
) {
  return requestJson<User>(
    '/users/me',
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export interface SlugAvailabilityDto {
  available: boolean;
  normalized: string;
  reason?: string;
}

export function checkSlugAvailable(slug: string, accessToken: string) {
  return requestJson<SlugAvailabilityDto>(
    `/users/me/slug-available${toSearchParams({ slug })}`,
    {},
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
    '/auth/phone/request-code',
    {
      method: 'POST',
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
    '/auth/phone/verify',
    {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    },
    accessToken,
  );
}

const servicesCache = new Map<string, Promise<ServiceDto[]>>();

export function getServices(categoryId?: number, sort?: CatalogSort) {
  const key = `${categoryId ?? ''}::${sort ?? ''}`;
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

export interface RoomInviteLinkDto {
  url: string;
  token: string;
}

export function getRoomInviteLink(roomId: number, accessToken: string) {
  return requestJson<RoomInviteLinkDto>(`/rooms/${roomId}/invite-link`, {}, accessToken);
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
  return requestJson<RoomMemberDto>(
    `/rooms/${roomId}/members`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  sortOrder: number;
}

export interface RoomMemberDto {
  // String: backend serializes 64-bit ids as strings (CockroachDB unique_rowid()
  // exceeds JS Number precision). Kept opaque for owner-action URL round-trips.
  id: string;
  roomId: number;
  userId: number;
  userDisplayName: string;
  userEmail: string | null;
  userReputation?: number | null;
  userReputationLevel?: string | null;
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
  // String: backend serializes 64-bit ids as strings (CockroachDB unique_rowid()
  // exceeds JS Number precision). Kept opaque for URL round-trips.
  id: string;
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
  // Required: seats, price, currency, and billing period are derived from the
  // admin-managed tariff plan server-side — the owner does not send them.
  tariffPlanId: number;
  roomType: string;
  title: string;
  description?: string | null;
  startDate?: string | null;
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
  // maxMembers / price / currency / period are tariff-controlled and not editable here.
  cancellationPolicy?: string;
  providerName?: string;
  tariffNameSnapshot?: string;
  connectionType?: string;
  operatorRestrictions?: string;
  operatorTermsConfirmed?: boolean;
}

export function getCategories() {
  return requestJson<CategoryDto[]>('/catalog/categories');
}

export function createRoomRequest(payload: CreateRoomPayload, accessToken: string) {
  return requestJson<RoomResponseDto>(
    '/rooms',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function getMyRooms(
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PagedResponse<RoomSummaryDto>>(
    `/rooms/me${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function getJoinedRooms(accessToken: string) {
  return requestJson<JoinedRoomDto[]>('/rooms/joined', {}, accessToken);
}

export function updateRoomRequest(roomId: number, payload: UpdateRoomPayload, accessToken: string) {
  return requestJson<RoomResponseDto>(
    `/rooms/${roomId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function markRoomReadyRequest(roomId: number, accessToken: string) {
  return requestJson<RoomResponseDto>(
    `/rooms/${roomId}/ready-for-verification`,
    {
      method: 'POST',
    },
    accessToken,
  );
}

export function cancelRoomRequest(roomId: number, accessToken: string) {
  return requestJson<RoomResponseDto>(
    `/rooms/${roomId}/cancel`,
    {
      method: 'POST',
    },
    accessToken,
  );
}

export function completeRoomRequest(roomId: number, accessToken: string) {
  return requestJson<RoomResponseDto>(
    `/rooms/${roomId}/complete`,
    {
      method: 'POST',
    },
    accessToken,
  );
}

export function getRoomMembers(
  roomId: number,
  accessToken: string,
  params: Record<string, string | number | undefined> = {},
) {
  return requestJson<PagedResponse<RoomMemberDto>>(
    `/rooms/${roomId}/members${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function getMyMembership(roomId: number, accessToken: string) {
  return requestJson<MyRoomMembershipDto>(`/rooms/${roomId}/members/me`, {}, accessToken);
}

export function confirmOwnerAccessRequest(
  roomId: number,
  memberId: string,
  accessMethod: string,
  accessToken: string,
) {
  return requestJson<RoomMemberDto>(
    `/rooms/${roomId}/members/${memberId}/owner-access`,
    {
      method: 'PATCH',
      body: JSON.stringify({ accessMethod }),
    },
    accessToken,
  );
}

export function confirmMemberAccessRequest(roomId: number, accessToken: string) {
  return requestJson<MyRoomMembershipDto>(
    `/rooms/${roomId}/members/me/confirm-access`,
    {
      method: 'POST',
    },
    accessToken,
  );
}

export function revealIdentifierRequest(
  roomId: number,
  memberId: string,
  payload: { reason: string; contextType?: string; contextId?: number },
  accessToken: string,
) {
  return requestJson<RevealedIdentifierDto>(
    `/rooms/${roomId}/members/${memberId}/reveal-identifier`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

// ============================================================
// Payments (membership checkout)
// ============================================================
//
// A member pays their share to advance the membership from APPLIED → PENDING.
// In dev the backend uses the in-memory mock gateway, which charges
// synchronously and returns status SUCCESS (no redirect). Real Freedom Pay in
// prod returns requiresRedirect + paymentUrl, and the webhook finalizes later.

export type PaymentIntentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | string;

export interface PaymentIntentResponseDto {
  // String: backend serializes 64-bit ids as strings (see MyRoomMembershipDto.id).
  // Used to build /payments/intents/{id} and confirm-success URLs.
  id: string;
  idempotencyKey: string;
  /** Total charged to the member = tariff share + ECOpay commission. */
  amount: number;
  /** The member's tariff share (the portion the owner receives). */
  shareAmount?: number | null;
  /** The ECOpay commission added on top of the share. */
  commissionAmount?: number | null;
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
  roomMemberId: string,
  payload: { idempotencyKey: string; saveCard?: boolean; savedCardId?: number },
  accessToken: string,
) {
  return requestJson<PaymentIntentResponseDto>(
    `/payments/members/${roomMemberId}/intent`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function getPaymentIntentRequest(intentId: string, accessToken: string) {
  return requestJson<PaymentIntentResponseDto>(`/payments/intents/${intentId}`, {}, accessToken);
}

/**
 * Redirect-back reconciliation: called when the user returns from the Freedom
 * Pay hosted page. The backend actively queries the gateway and finalizes the
 * intent (and the membership) if the payment already succeeded.
 */
export function confirmPaymentSuccessRequest(
  intentId: string,
  accessToken: string,
  externalTransactionId?: string,
) {
  return requestJson<PaymentIntentResponseDto>(
    `/payments/intents/${intentId}/confirm-success`,
    {
      method: 'POST',
      body: JSON.stringify({ externalTransactionId: externalTransactionId ?? '' }),
    },
    accessToken,
  );
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
  return requestJson<StaffLoginResponse>('/auth/login', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  });
}

export function verifyStaffTwoFactorRequest(challengeId: string, code: string) {
  return requestJson<AuthResponse>('/auth/login/2fa/verify', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ challengeId, code }),
  });
}

export function resendStaffTwoFactorRequest(challengeId: string) {
  return requestJson<void>('/auth/login/2fa/resend', {
    method: 'POST',
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
  return requestJson<AdminDashboardKpisDto>('/admin/dashboard/kpis', {}, accessToken);
}

export type DashboardGranularity = 'day' | 'month';

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
    '/admin/dashboard/operator-distribution',
    {},
    accessToken,
  );
}

export function getAdminCurrencyDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>('/admin/dashboard/currency-distribution', {}, accessToken);
}

export function getAdminCategoryDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>('/admin/dashboard/category-distribution', {}, accessToken);
}

export function getAdminRoomStatusDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>('/admin/dashboard/room-status-distribution', {}, accessToken);
}

export function getAdminCountryDistributionRequest(accessToken: string) {
  return requestJson<NamedCountDto[]>('/admin/dashboard/country-distribution', {}, accessToken);
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
  params: {
    page?: number;
    size?: number;
    search?: string;
    status?: string;
    role?: 'USER' | 'SUPPORT' | 'ADMIN';
    sort?: string;
    direction?: string;
  } & Record<string, string | number | undefined> = {},
) {
  return requestJson<PagedResponse<AdminUserDto>>(
    `/admin/users${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function banUserRequest(userId: number, reason: string, accessToken: string) {
  return requestJson<AdminUserDto>(
    `/admin/users/${userId}/ban`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
    accessToken,
  );
}

export function unbanUserRequest(userId: number, reason: string, accessToken: string) {
  return requestJson<AdminUserDto>(
    `/admin/users/${userId}/unban`,
    {
      method: 'POST',
      body: JSON.stringify({ reason }),
    },
    accessToken,
  );
}

export interface CreateAdminUserRequest {
  email: string;
  displayName: string;
  password: string;
  role: 'USER' | 'SUPPORT' | 'ADMIN';
  phone?: string;
}

export function createAdminUserRequest(payload: CreateAdminUserRequest, accessToken: string) {
  return requestJson<AdminUserDto>(
    '/admin/users',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function getAdminUserRequest(userId: number, accessToken: string) {
  return requestJson<AdminUserDto>(`/admin/users/${userId}`, {}, accessToken);
}

export function updateAdminUserRoleRequest(
  userId: number,
  payload: { role: 'USER' | 'SUPPORT' | 'ADMIN'; reason: string },
  accessToken: string,
) {
  return requestJson<AdminUserDto>(
    `/admin/users/${userId}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function updateAdminUserOwnerVerifiedRequest(
  userId: number,
  payload: { verified: boolean; reason?: string },
  accessToken: string,
) {
  return requestJson<AdminUserDto>(
    `/admin/users/${userId}/owner-verified`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
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
  return requestJson<void>(
    `/admin/moderation/rooms/${roomId}/block`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
    accessToken,
  );
}

export function unblockRoomRequest(roomId: number, reason: string, accessToken: string) {
  return requestJson<void>(
    `/admin/moderation/rooms/${roomId}/unblock`,
    {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    },
    accessToken,
  );
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
  return requestJson<SupportTicketResponse>(`/staff/support-tickets/${ticketId}`, {}, accessToken);
}

export function assignStaffTicketToMeRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}/assign-to-me`,
    { method: 'POST' },
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
    { method: 'POST', body: JSON.stringify({ status }) },
    accessToken,
  );
}

export function escalateStaffTicketRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(
    `/staff/support-tickets/${ticketId}/escalate`,
    { method: 'POST' },
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
    { method: 'POST', body: JSON.stringify({ message }) },
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
    { method: 'PATCH' },
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
    { method: 'PATCH', body: JSON.stringify(payload) },
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
    { method: 'POST', body: JSON.stringify(payload) },
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
    { method: 'PATCH', body: JSON.stringify(payload) },
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
    { method: 'PATCH', body: JSON.stringify(payload) },
    accessToken,
  );
}

// ---- Admin Finance drill-down (backs /admin/finance) ----

// Row-level payment transaction as returned by GET /admin/finance/transactions.
// Aggregates the "who paid, how much, for which room" fields that the operator
// needs to answer a support ticket without opening the DB.
export interface FinanceTransactionDto {
  id: number;
  createdAt: string;
  type: string;
  status: string;
  amount: number | string;
  currency: string | null;
  roomId: number | null;
  roomTitle: string | null;
  ownerUserId: number | null;
  ownerDisplayName: string | null;
  payerUserId: number | null;
  payerDisplayName: string | null;
  providerName: string | null;
  cardPanMask: string | null;
  reason: string | null;
  failureMessage: string | null;
}

export interface FinanceRefundDto {
  id: number;
  createdAt: string;
  status: string;
  amount: number | string;
  currency: string | null;
  reason: string | null;
  adminUserId: number | null;
  adminDisplayName: string | null;
  paymentTransactionId: number | null;
  roomId: number | null;
  roomTitle: string | null;
  memberUserId: number | null;
  memberDisplayName: string | null;
  disputeId: number | null;
}

export function getAdminFinanceTransactionsRequest(
  accessToken: string,
  params: {
    type?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  } = {},
) {
  return requestJson<PagedResponse<FinanceTransactionDto>>(
    `/admin/finance/transactions${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

export function getAdminFinanceRefundsRequest(
  accessToken: string,
  params: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    size?: number;
  } = {},
) {
  return requestJson<PagedResponse<FinanceRefundDto>>(
    `/admin/finance/refunds${toSearchParams(params)}`,
    {},
    accessToken,
  );
}

// ---- Logs ----

export interface AdminActionLogDto {
  id: number;
  eventId: string;
  adminUserId: number;
  adminDisplayName: string | null;
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
  actorDisplayName: string | null;
  actorRole: string | null;
  roomId: number;
  roomOwnerUserId: number | null;
  roomOwnerDisplayName: string | null;
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
  return requestJson<ModerationQueueItemDto[]>('/admin/moderation/queue', {}, accessToken);
}

export function assignModerationItemRequest(queueId: number, accessToken: string) {
  return requestJson<ModerationQueueItemDto>(
    `/admin/moderation/queue/${queueId}/assign`,
    { method: 'PATCH' },
    accessToken,
  );
}

export function confirmModerationItemRequest(queueId: number, reason: string, accessToken: string) {
  return requestJson<ModerationQueueItemDto>(
    `/admin/moderation/queue/${queueId}/confirm`,
    { method: 'PATCH', body: JSON.stringify({ reason }) },
    accessToken,
  );
}

export function rejectModerationItemRequest(queueId: number, reason: string, accessToken: string) {
  return requestJson<ModerationQueueItemDto>(
    `/admin/moderation/queue/${queueId}/reject`,
    { method: 'PATCH', body: JSON.stringify({ reason }) },
    accessToken,
  );
}

export function batchConfirmModerationRequest(payload: BatchConfirmRequest, accessToken: string) {
  return requestJson<ModerationQueueItemDto[]>(
    '/admin/moderation/queue/batch-confirm',
    { method: 'POST', body: JSON.stringify(payload) },
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
  return requestJson<ReviewDto>(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

// ============================================================
// Reputation (public)
// ============================================================

export interface ReputationDto {
  userId: number;
  displayName: string;
  avatar: string | null;
  reputation: number;
  reputationLevel?: string | null;
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
  return requestJson<SupportTicketResponse>(
    '/support-tickets',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function getMySupportTicketsRequest(accessToken: string) {
  return requestJson<SupportTicketResponse[]>('/support-tickets', {}, accessToken);
}

export function getMySupportTicketRequest(ticketId: number, accessToken: string) {
  return requestJson<SupportTicketResponse>(`/support-tickets/${ticketId}`, {}, accessToken);
}

export function postSupportTicketMessageRequest(
  ticketId: number,
  message: string,
  accessToken: string,
) {
  return requestJson<SupportTicketResponse>(
    `/support-tickets/${ticketId}/messages`,
    {
      method: 'POST',
      body: JSON.stringify({ message }),
    },
    accessToken,
  );
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
  return requestJson<PayoutDto[]>('/payouts/me', {}, accessToken);
}

export function getPayoutRequest(payoutId: number, accessToken: string) {
  return requestJson<PayoutDto>(`/payouts/${payoutId}`, {}, accessToken);
}

export function getPayoutMethodsRequest(accessToken: string) {
  return requestJson<PayoutMethodDto[]>('/payouts/methods', {}, accessToken);
}

export function registerPayoutMethodRequest(
  payload: { providerCardToken: string; panMask?: string },
  accessToken: string,
) {
  return requestJson<PayoutMethodDto>(
    '/payouts/methods',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

export function deletePayoutMethodRequest(methodId: number, accessToken: string) {
  return requestJson<void>(
    `/payouts/methods/${methodId}`,
    {
      method: 'DELETE',
    },
    accessToken,
  );
}

// --- Payout card binding (connect a card via the FreedomPay hosted page) ---

export interface PayoutCardBindingResponseDto {
  bindingId: number;
  paymentUrl: string | null;
  requiresRedirect: boolean;
  status: string; // PENDING | FAILED
  failureMessage: string | null;
}

export interface PayoutCardBindingConfirmDto {
  status: string; // SUCCESS | PENDING | FAILED
  method: PayoutMethodDto | null;
  message: string | null;
}

/** Start connecting a payout card. Returns a hosted-page URL to redirect the owner to. */
export function initPayoutCardBindingRequest(payload: { returnUrl: string }, accessToken: string) {
  return requestJson<PayoutCardBindingResponseDto>(
    '/payouts/methods/binding',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    accessToken,
  );
}

/** Finalize the binding after the owner returns from the hosted page. */
export function confirmPayoutCardBindingRequest(bindingId: number, accessToken: string) {
  return requestJson<PayoutCardBindingConfirmDto>(
    `/payouts/methods/binding/${bindingId}/confirm`,
    { method: 'POST' },
    accessToken,
  );
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
  return requestJson<RefundTransactionResponse[]>('/refunds/me', {}, accessToken);
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
  return requestJson<void>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

// ============================================================
// Public user profile by hash + delete account
// ============================================================

export interface PublicProfileDto {
  id: number;
  publicId: string;
  slug?: string | null;
  displayName: string;
  avatar: string | null;
  reputation: number;
  reputationLevel?: string | null;
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
  return requestJson<void>('/users/me', { method: 'DELETE' }, accessToken);
}

export function uploadMyAvatar(file: File, accessToken: string) {
  const form = new FormData();
  form.append('file', file);
  return requestJson<User>('/users/me/avatar', { method: 'POST', body: form }, accessToken);
}

export function deleteMyAvatar(accessToken: string) {
  return requestJson<User>('/users/me/avatar', { method: 'DELETE' }, accessToken);
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
  logoUrl?: string | null;
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
  return requestJson<AdminCategoryDto[]>('/admin/catalog/categories', {}, accessToken);
}

export function adminCreateCategory(payload: CreateCategoryPayload, accessToken: string) {
  return requestJson<AdminCategoryDto>(
    '/admin/catalog/categories',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateCategory(
  id: number,
  payload: UpdateCategoryPayload,
  accessToken: string,
) {
  return requestJson<AdminCategoryDto>(
    `/admin/catalog/categories/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteCategory(id: number, accessToken: string) {
  return requestJson<void>(`/admin/catalog/categories/${id}`, { method: 'DELETE' }, accessToken);
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
    '/admin/catalog/services',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateService(id: number, payload: UpdateServicePayload, accessToken: string) {
  return requestJson<AdminServiceDto>(
    `/admin/catalog/services/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteService(id: number, accessToken: string) {
  return requestJson<void>(`/admin/catalog/services/${id}`, { method: 'DELETE' }, accessToken);
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
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateTariff(id: number, payload: UpdateTariffPayload, accessToken: string) {
  return requestJson<AdminTariffDto>(
    `/admin/catalog/tariffs/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteTariff(id: number, accessToken: string) {
  return requestJson<void>(`/admin/catalog/tariffs/${id}`, { method: 'DELETE' }, accessToken);
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
  return requestJson<PublicServiceReviewDto[]>('/service-reviews/featured');
}

export function getMyServiceReview(accessToken: string) {
  return requestJson<ServiceReviewDto | undefined>('/service-reviews/me', {}, accessToken);
}

export function createServiceReview(payload: ServiceReviewPayload, accessToken: string) {
  return requestJson<ServiceReviewDto>(
    '/service-reviews',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function updateMyServiceReview(payload: ServiceReviewPayload, accessToken: string) {
  return requestJson<ServiceReviewDto>(
    '/service-reviews/me',
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function deleteMyServiceReview(accessToken: string) {
  return requestJson<void>('/service-reviews/me', { method: 'DELETE' }, accessToken);
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
    query.featured = params.featured ? 'true' : 'false';
  }
  return requestJson<PagedResponse<AdminServiceReviewDto>>(
    `/admin/service-reviews${toSearchParams(query)}`,
    {},
    accessToken,
  );
}

export function adminSetServiceReviewFeatured(id: number, featured: boolean, accessToken: string) {
  return requestJson<AdminServiceReviewDto>(
    `/admin/service-reviews/${id}/featured`,
    { method: 'PATCH', body: JSON.stringify({ featured }) },
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
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteServiceReview(id: number, accessToken: string) {
  return requestJson<void>(`/admin/service-reviews/${id}`, { method: 'DELETE' }, accessToken);
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
  apexLink?: string | null;
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
  apexLink?: string | null;
}

export function getSiteAboutRequest() {
  return requestJson<SiteAboutContent>('/site/about');
}

export function adminGetSiteAbout(accessToken: string) {
  return requestJson<SiteAboutContent>('/admin/site/about', {}, accessToken);
}

export function adminUpdateSiteAbout(payload: UpdateSiteAboutPayload, accessToken: string) {
  return requestJson<SiteAboutContent>(
    '/admin/site/about',
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

// ───────────────────────────────────────────────────────────────
// Legal documents — Terms of Service / Privacy consent
// ───────────────────────────────────────────────────────────────

export type LegalDocType = 'terms' | 'privacy';

export interface LegalDocumentDto {
  docType: LegalDocType;
  version: number;
  updatedAt: string | null;
  title_kz?: string | null;
  title_ru?: string | null;
  title_en?: string | null;
  body_kz?: string | null;
  body_ru?: string | null;
  body_en?: string | null;
}

export interface UpdateLegalDocumentPayload {
  title_kz?: string | null;
  title_ru?: string | null;
  title_en?: string | null;
  body_kz?: string | null;
  body_ru?: string | null;
  body_en?: string | null;
}

export function getLegalDocumentRequest(docType: LegalDocType) {
  return requestJson<LegalDocumentDto>(`/site/legal/${docType}`);
}

export function adminGetLegalDocument(docType: LegalDocType, accessToken: string) {
  return requestJson<LegalDocumentDto>(`/admin/legal/${docType}`, {}, accessToken);
}

export function adminUpdateLegalDocument(
  docType: LegalDocType,
  payload: UpdateLegalDocumentPayload,
  accessToken: string,
) {
  return requestJson<LegalDocumentDto>(
    `/admin/legal/${docType}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

// ───────────────────────────────────────────────────────────────
// News module
// ───────────────────────────────────────────────────────────────

export type NewsStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export interface NewsDto {
  id: number;
  titleKz?: string | null;
  titleRu?: string | null;
  titleEn?: string | null;
  bodyKz?: string | null;
  bodyRu?: string | null;
  bodyEn?: string | null;
  imageUrl?: string | null;
  status?: NewsStatus;
  publishedAt?: string | null;
  sortOrder?: number;
}

export interface AdminNewsDto extends NewsDto {
  status: NewsStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertNewsPayload {
  titleKz?: string | null;
  titleRu?: string | null;
  titleEn?: string | null;
  bodyKz?: string | null;
  bodyRu?: string | null;
  bodyEn?: string | null;
  status: NewsStatus;
  sortOrder?: number;
  publishedAt?: string | null;
}

const newsCache = new Map<string, Promise<NewsDto[]>>();

export function getNews(page = 0, limit = 6) {
  const key = `${page}::${limit}`;
  const cached = newsCache.get(key);
  if (cached) return cached;
  const promise = requestJson<PagedResponse<NewsDto>>(`/news${toSearchParams({ page, limit })}`)
    .then((res) => res?.items ?? [])
    .catch((err) => {
      newsCache.delete(key);
      throw err;
    });
  newsCache.set(key, promise);
  return promise;
}

export function clearNewsCache() {
  newsCache.clear();
}

export function adminListNews(accessToken: string) {
  return requestJson<PagedResponse<AdminNewsDto>>('/admin/news', {}, accessToken).then(
    (res) => res?.items ?? [],
  );
}

export function adminGetNews(id: number, accessToken: string) {
  return requestJson<AdminNewsDto>(`/admin/news/${id}`, {}, accessToken);
}

export function adminCreateNews(payload: UpsertNewsPayload, accessToken: string) {
  return requestJson<AdminNewsDto>(
    '/admin/news',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdateNews(id: number, payload: UpsertNewsPayload, accessToken: string) {
  return requestJson<AdminNewsDto>(
    `/admin/news/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeleteNews(id: number, accessToken: string) {
  return requestJson<void>(`/admin/news/${id}`, { method: 'DELETE' }, accessToken);
}

export function adminUploadNewsImage(id: number, file: File, accessToken: string) {
  const form = new FormData();
  form.append('file', file);
  return requestJson<AdminNewsDto>(
    `/admin/news/${id}/image`,
    { method: 'POST', body: form },
    accessToken,
  );
}

// ───────────────────────────────────────────────────────────────
// Public catalog search (typeahead) + match
// ───────────────────────────────────────────────────────────────

export interface CatalogSearchHit {
  serviceId: number;
  name: string;
  categoryName: string;
  logoUrl?: string | null;
}

export function searchCatalog(q: string, init: RequestInit = {}) {
  return requestJson<CatalogSearchHit[]>(`/catalog/search${toSearchParams({ q })}`, init);
}

export interface ServiceMatchResult {
  action: 'JOIN' | 'CREATE';
  roomId: number | null;
}

export function matchRoomForService(serviceId: number, accessToken: string) {
  return requestJson<ServiceMatchResult>(`/catalog/services/${serviceId}/match`, {}, accessToken);
}

// ───────────────────────────────────────────────────────────────
// Admin: service logo upload
// ───────────────────────────────────────────────────────────────

export function adminUploadServiceLogo(serviceId: number, file: File, accessToken: string) {
  const form = new FormData();
  form.append('file', file);
  return requestJson<AdminServiceDto>(
    `/admin/catalog/services/${serviceId}/logo`,
    { method: 'POST', body: form },
    accessToken,
  );
}

// ───────────────────────────────────────────────────────────────
// Notifications (in-app bell + STOMP push)
// ───────────────────────────────────────────────────────────────

export interface NotificationDto {
  id: number;
  title: string;
  body: string;
  link?: string | null;
  read: boolean;
  createdAt: string;
}

export function notificationsTopic(userId: number): string {
  return `/topic/notifications.${userId}`;
}

export function getNotificationsRequest(
  accessToken: string,
  params: { page?: number; size?: number } = {},
) {
  return requestJson<PagedResponse<NotificationDto>>(
    `/notifications${toSearchParams({ page: params.page, size: params.size })}`,
    {},
    accessToken,
  );
}

export function getUnreadNotificationCountRequest(accessToken: string) {
  return requestJson<{ count: number }>('/notifications/unread-count', {}, accessToken);
}

export function markNotificationReadRequest(id: number, accessToken: string) {
  return requestJson<void>(`/notifications/${id}/read`, { method: 'POST' }, accessToken);
}

export function markAllNotificationsReadRequest(accessToken: string) {
  return requestJson<void>('/notifications/read-all', { method: 'POST' }, accessToken);
}

// ============================================================
// Room chat (opens once guests have paid)
// ============================================================
//
// Owner + PENDING/ACTIVE members can read/write. History + send go through
// REST; live delivery rides the STOMP topic below (same /ws socket as the
// notifications bell, gated server-side to the room's paid participants).

export interface RoomChatMessageDto {
  id: number;
  roomId: number;
  senderId: number | null;
  senderPublicId?: string | null;
  senderName: string;
  senderAvatar?: string | null;
  /** True when the sender is the room owner (drives the "owner" tag in the UI). */
  owner: boolean;
  body: string;
  createdAt: string;
}

export function roomChatTopic(roomId: number | string): string {
  return `/topic/rooms/${roomId}/chat`;
}

export function getRoomChatMessagesRequest(
  roomId: number | string,
  accessToken: string,
  params: { page?: number; size?: number } = {},
) {
  return requestJson<PagedResponse<RoomChatMessageDto>>(
    `/rooms/${roomId}/chat/messages${toSearchParams({ page: params.page, size: params.size })}`,
    {},
    accessToken,
  );
}

export function sendRoomChatMessageRequest(
  roomId: number | string,
  body: string,
  accessToken: string,
) {
  return requestJson<RoomChatMessageDto>(
    `/rooms/${roomId}/chat/messages`,
    { method: 'POST', body: JSON.stringify({ body }) },
    accessToken,
  );
}

export type NotificationCategory =
  'MEMBERSHIP' | 'ROOM' | 'PAYMENTS' | 'DISPUTES' | 'SUPPORT' | 'ACCOUNT';

export interface NotificationPreferenceDto {
  type: string;
  category: NotificationCategory | string;
  inApp: boolean;
  email: boolean;
}

export interface NotificationPreferenceUpdate {
  type: string;
  inApp: boolean;
  email: boolean;
}

export function getNotificationPreferencesRequest(accessToken: string) {
  return requestJson<NotificationPreferenceDto[]>('/notifications/preferences', {}, accessToken);
}

export function updateNotificationPreferencesRequest(
  payload: NotificationPreferenceUpdate[],
  accessToken: string,
) {
  return requestJson<NotificationPreferenceDto[]>(
    '/notifications/preferences',
    { method: 'PUT', body: JSON.stringify({ items: payload }) },
    accessToken,
  );
}

// ───────────────────────────────────────────────────────────────
// Admin: subscription price monitoring (/api/v1/admin/pricing/**)
// ───────────────────────────────────────────────────────────────
//
// Field names mirror the backend DTOs verbatim (platformCode / displayName /
// lastPrice / extractorType / …). Keeping the two sides identical means we
// never invent an adapter layer that silently drops fields — which is exactly
// what was masking the 400 on "add source" and the empty platform/price cells
// in the table.

export type PricingExtractionType = 'AUTO' | 'JSON_LD' | 'META' | 'CSS' | 'REGEX' | 'MANUAL';

export type PricingProviderStatus = 'OK' | 'STALE' | 'FAILING' | 'BLOCKED' | 'PENDING';

export type PricingSnapshotOutcome =
  'SUCCESS' | 'OK' | 'UNCHANGED' | 'PARSE_FAILED' | 'FETCH_FAILED' | 'BLOCKED';

export type PricingTestOutcome = 'SUCCESS' | 'PARSE_FAILED' | 'FETCH_FAILED' | 'BLOCKED';

export interface PricingExtractionConfig {
  selector?: string | null;
  regex?: string | null;
  jsonPath?: string | null;
}

export interface PricingProviderDto {
  /**
   * Backend serialises this as a string, not a number: CockroachDB's BIGSERIAL
   * emits ids past 2^53 that JavaScript's number type would silently round on
   * {@code JSON.parse}. Treat it as an opaque token — no arithmetic.
   */
  id: string;
  platformCode: string;
  displayName: string;
  planName: string;
  url: string;
  locale: string | null;
  expectedCurrency: string | null;
  extractorType: PricingExtractionType;
  extractorConfig: PricingExtractionConfig | null;
  requiresJs: boolean;
  checkIntervalMinutes: number;
  active: boolean;
  status: PricingProviderStatus;
  consecutiveFailures: number | null;
  lastCheckedAt: string | null;
  lastSuccessAt: string | null;
  nextCheckAt: string | null;
  /** Most recent successful observation. May be null before the first check lands. */
  lastPrice: number | null;
  lastCurrency: string | null;
  /** Timestamp of the newest {@code price_change} row, or null if none. */
  lastChangedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Body for {@code POST /admin/pricing/providers}. */
export interface CreatePricingProviderPayload {
  platformCode: string;
  displayName: string;
  planName: string;
  url: string;
  locale?: string | null;
  expectedCurrency?: string | null;
  extractorType: PricingExtractionType;
  extractorConfig?: PricingExtractionConfig | null;
  requiresJs?: boolean;
  checkIntervalMinutes?: number;
  active?: boolean;
  /** For MANUAL extraction — seed the first price without a fetch. */
  initialPrice?: number | null;
  initialCurrency?: string | null;
}

/** Body for {@code PUT /admin/pricing/providers/{id}} — every field is optional. */
export interface UpdatePricingProviderPayload {
  platformCode?: string;
  displayName?: string;
  planName?: string;
  url?: string;
  locale?: string | null;
  expectedCurrency?: string | null;
  extractorType?: PricingExtractionType;
  extractorConfig?: PricingExtractionConfig | null;
  requiresJs?: boolean;
  checkIntervalMinutes?: number;
  active?: boolean;
  /** MANUAL providers only: overwrite lastPrice/lastCurrency directly. */
  manualPrice?: number | null;
  manualCurrency?: string | null;
}

export interface PricingSnapshotDto {
  /** String-encoded — see {@link PricingProviderDto.id}. */
  id: string;
  providerId: string;
  price: number | null;
  currency: string | null;
  capturedAt: string;
  outcome: PricingSnapshotOutcome;
  httpStatus: number | null;
  errorMessage: string | null;
}

export interface PricingChangeDto {
  /** String-encoded — see {@link PricingProviderDto.id}. */
  id: string;
  providerId: string;
  providerName: string;
  planName: string;
  oldPrice: number | null;
  newPrice: number | null;
  currency: string | null;
  changedAt: string;
  snapshotId: string | null;
  acknowledged: boolean;
}

/** Body for {@code POST /admin/pricing/providers/test} — dry-run extraction against a URL. */
export interface TestPricingExtractionRequest {
  url: string;
  extractorType: PricingExtractionType;
  extractorConfig?: PricingExtractionConfig | null;
  requiresJs?: boolean;
  expectedCurrency?: string | null;
  locale?: string | null;
}

export interface TestPricingExtractionResponse {
  outcome: PricingTestOutcome;
  price: number | null;
  currency: string | null;
  httpStatus: number | null;
  /** Which extractor path lit up (e.g. "json_ld", "meta", "regex"), or null. */
  source: string | null;
  /** Short diagnostic — empty on SUCCESS. */
  message: string | null;
}

/**
 * Convenient display fallback: the live currency the extractor last emitted, else the admin's
 * expected currency, else null. Used by the admin table where a single "currency" column has to
 * work even before the first observation lands.
 */
export function pricingProviderCurrency(p: PricingProviderDto): string | null {
  return p.lastCurrency ?? p.expectedCurrency ?? null;
}

export function adminListPricingProviders(accessToken: string) {
  return requestJson<PricingProviderDto[]>('/admin/pricing/providers', {}, accessToken);
}

export function adminGetPricingProvider(id: string, accessToken: string) {
  return requestJson<PricingProviderDto>(`/admin/pricing/providers/${id}`, {}, accessToken);
}

export function adminCreatePricingProvider(
  payload: CreatePricingProviderPayload,
  accessToken: string,
) {
  return requestJson<PricingProviderDto>(
    '/admin/pricing/providers',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminUpdatePricingProvider(
  id: string,
  payload: UpdatePricingProviderPayload,
  accessToken: string,
) {
  return requestJson<PricingProviderDto>(
    `/admin/pricing/providers/${id}`,
    { method: 'PUT', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminDeletePricingProvider(id: string, accessToken: string) {
  return requestJson<void>(`/admin/pricing/providers/${id}`, { method: 'DELETE' }, accessToken);
}

export function adminCheckPricingProvider(id: string, accessToken: string) {
  return requestJson<PricingProviderDto>(
    `/admin/pricing/providers/${id}/check`,
    { method: 'POST' },
    accessToken,
  );
}

export function adminTestPricingExtraction(
  payload: TestPricingExtractionRequest,
  accessToken: string,
) {
  return requestJson<TestPricingExtractionResponse>(
    '/admin/pricing/providers/test',
    { method: 'POST', body: JSON.stringify(payload) },
    accessToken,
  );
}

export function adminGetPricingHistory(id: string, accessToken: string) {
  return requestJson<PricingSnapshotDto[]>(
    `/admin/pricing/providers/${id}/history`,
    {},
    accessToken,
  );
}

export function adminListPricingChanges(
  accessToken: string,
  params: { unacknowledged?: boolean } = {},
) {
  const query = toSearchParams({
    unacknowledged: params.unacknowledged === undefined ? undefined : String(params.unacknowledged),
  });
  return requestJson<PricingChangeDto[]>(`/admin/pricing/changes${query}`, {}, accessToken);
}

export function adminAcknowledgePricingChange(id: string, accessToken: string) {
  return requestJson<PricingChangeDto>(
    `/admin/pricing/changes/${id}/ack`,
    { method: 'POST' },
    accessToken,
  );
}
