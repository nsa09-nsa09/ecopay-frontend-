// Hand-typed contracts mirroring backend DTOs (kz.hrms.splitupauth.dto).
// Backend is the source of truth. All entity ids are numeric (Java Long → JSON number).
// TODO: replace with `openapi-typescript` generated types from /v3/api-docs once Swagger URL is confirmed.

// ---------- Enums (mirror backend entity enums) ----------
export type Role = "USER" | "SUPPORT" | "ADMIN";
export type UserStatus = "ACTIVE" | "BANNED";
export type ProviderType = "OPERATOR" | "ISP" | "DIGITAL";
export type PeriodType = "MONTHLY" | "YEARLY" | "OTHER";
export type ConnectionType = "SIM" | "ESIM" | "ACCOUNT_LINK" | "OTHER";
export type RoomType = "DIGITAL" | "TELECOM";
export type VerificationMode = "AUTO" | "ADMIN_REQUIRED" | "RISK_BASED";
export type AccessType = "FAMILY_PLAN" | "SHARED_ACCOUNT" | "INVITE_LINK" | "EMAIL_INVITE";
export type IdentifierType = "PHONE" | "ACCOUNT" | "SIM" | "ESIM";

export type RoomStatus =
  | "OPEN"
  | "IN_VERIFICATION"
  | "ACTIVE"
  | "COMPLETED"
  | "CANCELLED"
  | "BLOCKED";

export type MemberStatus =
  | "APPLIED"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED_BEFORE_PAYMENT"
  | "BLOCKED_BY_ADMIN";

export type PaymentIntentStatus = "PENDING" | "SUCCESS" | "FAILED";

export type SupportTicketStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "WAITING_USER"
  | "ESCALATED"
  | "CLOSED";

export type DisputeStatus = "OPEN" | "UNDER_REVIEW" | "RESOLVED" | "REJECTED";

// ---------- Auth ----------
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user?: UserDto;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  phone: string;
}

export interface RequestPhoneCodeRequest {
  phone: string;
}

export interface VerifyPhoneRequest {
  phone: string;
  code: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirmRequest {
  token: string;
  newPassword: string;
}

export interface UserDto {
  id: number;
  email: string;
  displayName: string;
  phone?: string;
  phoneVerified: boolean;
  avatar?: string;
  status: UserStatus;
  role: Role;
  reputation?: number;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatar?: string;
}

// ---------- Catalog ----------
export interface CategoryDto {
  id: number;
  name: string;
  slug: string;
  sortOrder?: number;
}

export interface ServiceDto {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  slug: string;
  providerType: ProviderType;
}

export interface TariffPlanDto {
  id: number;
  serviceId: number;
  name: string;
  periodType: PeriodType;
  maxMembers: number;
  basePriceTotal?: number;
  currency: string;
  connectionType?: ConnectionType;
  operatorRules?: string;
}

// ---------- Rooms ----------
export interface RoomSummaryDto {
  id: number;
  title: string;
  roomType: RoomType;
  status: RoomStatus;
  maxMembers: number;
  priceTotal: number;
  pricePerMember: number;
  currency: string;
  startDate?: string;
  ownerUserId: number;
  ownerDisplayName?: string;
  serviceId: number;
  serviceName?: string;
}

export interface RoomResponse {
  id: number;
  ownerUserId: number;
  categoryId?: number;
  serviceId: number;
  tariffPlanId?: number;
  roomType: RoomType;
  verificationMode: VerificationMode;
  status: RoomStatus;
  title: string;
  description?: string;
  maxMembers: number;
  priceTotal?: number;
  pricePerMember?: number;
  currency: string;
  periodType: PeriodType;
  startDate?: string;
  cancellationPolicy?: string;
  providerName?: string;
  tariffNameSnapshot?: string;
  connectionType?: ConnectionType;
  operatorRestrictions?: string;
  operatorTermsConfirmed?: boolean;
  accessType?: AccessType;
  regionRestriction?: string;
  requiresEmailForInvite?: boolean;
  emailChangeForbidden?: boolean;
  accessGrantSlaHours?: number;
  readyForVerificationAt?: string;
  completedAt?: string;
  blockedAt?: string;
  blockReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RoomMemberDto {
  id: number;
  roomId: number;
  userId: number;
  userDisplayName?: string;
  userEmail?: string;
  status: MemberStatus;
  requiresAdminReview?: boolean;
  accessMethod?: string;
  ownerAccessConfirmedAt?: string;
  memberConfirmedAt?: string;
  activatedAt?: string;
  rejectedAt?: string;
  endedAt?: string;
  consentAcceptedAt?: string;
  createdAt?: string;
}

export interface MyRoomMembershipDto {
  id: number;
  roomId: number;
  userId: number;
  status: MemberStatus;
  requiresAdminReview?: boolean;
  identifierType?: IdentifierType;
  identifierMasked?: string;
  accessMethod?: string;
  ownerAccessConfirmedAt?: string;
  memberConfirmedAt?: string;
  activatedAt?: string;
}

export interface CreateRoomRequest {
  categoryId?: number;
  serviceId: number;
  tariffPlanId?: number;
  roomType: RoomType;
  title: string;
  description?: string;
  maxMembers: number;
  priceTotal?: number;
  pricePerMember?: number;
  currency?: string;
  periodType: PeriodType;
  startDate: string; // ISO LocalDateTime, e.g. "2026-06-15T00:00:00"
  cancellationPolicy?: string;
  providerName?: string;
  tariffNameSnapshot?: string;
  connectionType?: ConnectionType;
  operatorRestrictions?: string;
  operatorTermsConfirmed?: boolean;
  accessType?: AccessType;
  regionRestriction?: string;
  requiresEmailForInvite?: boolean;
  emailChangeForbidden?: boolean;
  accessGrantSlaHours?: number;
}

export interface UpdateRoomRequest {
  title?: string;
  description?: string;
  maxMembers?: number;
  priceTotal?: number;
  pricePerMember?: number;
  cancellationPolicy?: string;
  providerName?: string;
  tariffNameSnapshot?: string;
  connectionType?: ConnectionType;
  operatorRestrictions?: string;
  operatorTermsConfirmed?: boolean;
  accessType?: AccessType;
  regionRestriction?: string;
  requiresEmailForInvite?: boolean;
  emailChangeForbidden?: boolean;
  accessGrantSlaHours?: number;
}

export interface JoinRoomRequest {
  consentAccepted: boolean;
  identifierType?: IdentifierType;
  identifierValue?: string;
}

export interface CancelRoomRequest {
  reason?: string;
}

export interface ConfirmOwnerAccessRequest {
  accessMethod: string;
}

export interface RevealIdentifierRequest {
  reason: string;
  contextType?: string;
  contextId?: number;
}

export interface RevealedIdentifierDto {
  roomId: number;
  roomMemberId: number;
  identifierType: string;
  identifierValue: string;
  revealedForReason?: string;
}

// ---------- Payments ----------
export interface CreatePaymentIntentRequest {
  idempotencyKey: string;
  saveCard?: boolean;
  savedCardId?: number;
}

export interface PaymentIntentResponse {
  id: number;
  idempotencyKey: string;
  amount: number;
  currency: string;
  status: PaymentIntentStatus;
  providerName?: string;
  externalPaymentId?: string;
  roomMemberId: number;
  paymentUrl?: string;
  requiresRedirect?: boolean;
  saveCardRequested?: boolean;
  failureCode?: string;
  failureMessage?: string;
}

export interface ConfirmPaymentRequest {
  externalTransactionId?: string;
}

export interface SavedCardDto {
  id: number;
  providerName: string;
  panMask?: string;
  cardType?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
  status?: "ACTIVE" | "EXPIRED" | "REVOKED";
  createdAt?: string;
}

// ---------- Payouts ----------
export interface PayoutDto {
  id: number;
  amount: number;
  currency: string;
  status: string;
  providerPayoutId?: string;
  failureReason?: string;
  roomId?: number;
  createdAt?: string;
  processedAt?: string;
}

export interface PayoutMethodDto {
  id: number;
  providerName: string;
  panMask?: string;
  isDefault?: boolean;
  status?: string;
  createdAt?: string;
}

export interface RegisterPayoutMethodRequest {
  providerName: string;
  providerCardToken: string;
  panMask?: string;
  makeDefault?: boolean;
}

// ---------- Reviews / Reputation ----------
export interface CreateReviewRequest {
  recipientId: number;
  roomId: number;
  rating: number; // 1..5
  text?: string;
}

export interface ReviewDto {
  id: number;
  authorId: number;
  authorDisplayName?: string;
  recipientId: number;
  roomId: number;
  rating: number;
  text?: string;
  createdAt: string;
}

export interface ReputationDto {
  userId: number;
  displayName?: string;
  reputation?: number;
  averageRating?: number;
  reviewsCount?: number;
  completedRoomsCount?: number;
}

// ---------- Support ----------
export interface SupportTicketResponse {
  id: number;
  userId: number;
  roomId?: number;
  roomMemberId?: number;
  subject: string;
  topic: string;
  status: SupportTicketStatus;
  priority?: string;
  escalatedToDispute?: boolean;
  createdAt: string;
  updatedAt?: string;
  closedAt?: string;
  messages?: SupportMessageDto[];
}

export interface SupportMessageDto {
  id: number;
  senderUserId: number;
  senderRole?: string;
  message: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface CreateSupportTicketRequest {
  roomId?: number;
  roomMemberId?: number;
  subject: string;
  topic: string;
  message: string;
}

export interface CreateSupportMessageRequest {
  message: string;
}

// ---------- Disputes ----------
export interface DisputeResponse {
  id: number;
  roomId?: number;
  roomMemberId?: number;
  ticketId?: number;
  openedByUserId?: number;
  assignedAdminId?: number;
  reasonCode?: string;
  description?: string;
  status: DisputeStatus;
  decision?: string;
  decisionComment?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DisputeDecisionRequest {
  decision: "RESOLVE_OWNER" | "RESOLVE_MEMBER" | "REJECT";
  comment?: string;
}

export interface ApplyDisputeSanctionsRequest {
  blockUserId?: number;
  refundAmount?: number;
  comment?: string;
}

// ---------- Admin ----------
export interface AdminActionLogDto {
  id: number;
  actorId?: number;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: number;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface RoomEventLogDto {
  id: number;
  roomId?: number;
  type: string;
  actorId?: number;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface ModerationQueueItemDto {
  id: number;
  type: string;
  targetId: number;
  reason: string;
  reportedById?: number;
  createdAt: string;
}

export interface BlockRoomRequest {
  reason: string;
}

export interface BatchConfirmRequest {
  queueIds: number[];
  reason: string;
}

export interface AdminDecisionRequest {
  decision: "APPROVE" | "REJECT" | "ESCALATE";
  comment?: string;
}

export interface CreateRefundRequest {
  paymentId: number;
  amount?: number;
  reason?: string;
}

export interface RefundTransactionResponse {
  id: number;
  paymentId: number;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  createdAt: string;
}

export interface UpdateRefundStatusRequest {
  status: RefundTransactionResponse["status"];
  comment?: string;
}

// ---------- Pagination ----------
export interface PagedResponse<T> {
  items: T[];
  page: number;
  size: number;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
}
