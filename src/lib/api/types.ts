// Hand-typed contracts mirroring backend DTOs.
// TODO: replace with `openapi-typescript` generated types from /v3/api-docs once Swagger URL is confirmed.

export type Role = "USER" | "STAFF" | "ADMIN";
export type UserStatus = "ACTIVE" | "BLOCKED" | "SUSPENDED";

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
  phoneVerified?: boolean;
  avatar?: string;
  role: Role;
  status: UserStatus;
  reputation?: number;
}

export interface UpdateProfileRequest {
  displayName?: string;
  avatar?: string;
}

export interface CategoryDto {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface ServiceDto {
  id: string;
  categoryId: string;
  name: string;
  operator: string;
  description?: string;
  logoUrl?: string;
  rating?: number;
}

export interface TariffPlanDto {
  id: string;
  serviceId: string;
  name: string;
  price: number;
  currency: string;
  seats: number;
  periodMonths: number;
  features?: string[];
}

export type RoomStatus =
  | "DRAFT"
  | "OPEN"
  | "PENDING"
  | "ACTIVE"
  | "FULL"
  | "CANCELED"
  | "COMPLETED"
  | "BLOCKED";

export type RoomType = "DIGITAL" | "TELECOM";

export type MemberStatus =
  | "APPLIED"
  | "PENDING"
  | "ACTIVE"
  | "REJECTED"
  | "CANCELLED_BEFORE_PAYMENT"
  | "BLOCKED_BY_ADMIN";

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

export interface RoomMemberDto {
  id: number;
  roomId: number;
  userId: number;
  displayName?: string;
  status: MemberStatus;
  paymentStatus?: "NONE" | "PENDING" | "SUCCESS" | "FAILED" | "REFUNDED";
  requiresAdminReview?: boolean;
  ownerAccessConfirmedAt?: string;
  memberConfirmedAt?: string;
  createdAt?: string;
}

export interface RoomResponse extends RoomSummaryDto {
  description?: string;
  members?: RoomMemberDto[];
  tariffPlanId?: number;
  filled?: number;
}

export interface CreateRoomRequest {
  serviceId: string;
  tariffPlanId: string;
  name: string;
  description?: string;
  startDate?: string;
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  startDate?: string;
}

export interface JoinRoomRequest {
  message?: string;
}

export interface CancelRoomRequest {
  reason?: string;
}

export interface BatchConfirmRequest {
  memberIds: string[];
}

export interface ConfirmOwnerAccessRequest {
  identifier: string;
  note?: string;
}

export interface RevealIdentifierRequest {
  reason?: string;
}

export interface RevealedIdentifierDto {
  identifier: string;
  revealedAt: string;
}

export interface MyRoomMembershipDto {
  room: RoomSummaryDto;
  myRole: "OWNER" | "MEMBER";
  myStatus: RoomMemberDto["status"];
  applicantsCount?: number;
}

export type PaymentStatus =
  | "REQUIRES_PAYMENT_METHOD"
  | "PROCESSING"
  | "REQUIRES_CONFIRMATION"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED";

export interface CreatePaymentIntentRequest {
  idempotencyKey: string;
  saveCard?: boolean;
  savedCardId?: number;
}

export type PaymentIntentStatus = "PENDING" | "SUCCESS" | "FAILED";

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

export interface SupportTicketResponse {
  id: string;
  subject: string;
  status: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  createdAt: string;
  updatedAt?: string;
  messages?: SupportMessageDto[];
}

export interface SupportMessageDto {
  id: string;
  ticketId: string;
  authorId: string;
  authorName?: string;
  body: string;
  createdAt: string;
  attachments?: string[];
}

export interface CreateSupportTicketRequest {
  subject: string;
  body: string;
  priority?: SupportTicketResponse["priority"];
}

export interface CreateSupportMessageRequest {
  body: string;
}

export interface UpdateSupportTicketStatusRequest {
  status: SupportTicketResponse["status"];
}

export type DisputeStatus =
  | "OPEN"
  | "UNDER_REVIEW"
  | "RESOLVED_OWNER"
  | "RESOLVED_MEMBER"
  | "REJECTED";

export interface DisputeResponse {
  id: string;
  roomId: string;
  openedById: string;
  status: DisputeStatus;
  reason: string;
  createdAt: string;
  updatedAt?: string;
}

export interface DisputeDecisionRequest {
  decision: "RESOLVE_OWNER" | "RESOLVE_MEMBER" | "REJECT";
  comment?: string;
}

export interface ApplyDisputeSanctionsRequest {
  blockUserId?: string;
  refundAmount?: number;
  comment?: string;
}

export interface AdminActionLogDto {
  id: string;
  actorId: string;
  actorName?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface RoomEventLogDto {
  id: string;
  roomId: string;
  type: string;
  actorId?: string;
  createdAt: string;
  details?: Record<string, unknown>;
}

export interface ModerationQueueItemDto {
  id: string;
  type: "ROOM" | "USER" | "REVIEW";
  targetId: string;
  reason: string;
  reportedById?: string;
  createdAt: string;
}

export interface BlockRoomRequest {
  reason: string;
}

export interface AdminDecisionRequest {
  decision: "APPROVE" | "REJECT" | "ESCALATE";
  comment?: string;
}

export interface CreateRefundRequest {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface RefundTransactionResponse {
  id: string;
  paymentId: string;
  amount: number;
  status: "PENDING" | "APPROVED" | "REJECTED" | "PROCESSED";
  createdAt: string;
}

export interface UpdateRefundStatusRequest {
  status: RefundTransactionResponse["status"];
  comment?: string;
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

export interface PageParams {
  page?: number;
  size?: number;
}
