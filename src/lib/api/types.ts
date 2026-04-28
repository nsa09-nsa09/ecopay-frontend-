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
  firstName?: string;
  lastName?: string;
  phone?: string;
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
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  role: Role;
  status: UserStatus;
  ratingScore?: number;
  createdAt?: string;
  emailVerified?: boolean;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
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

export interface RoomSummaryDto {
  id: string;
  name: string;
  serviceId: string;
  serviceName?: string;
  operator?: string;
  status: RoomStatus;
  seats: number;
  filled: number;
  pricePerMember: number;
  currency: string;
  startDate?: string;
}

export interface RoomMemberDto {
  id: string;
  userId: string;
  displayName?: string;
  avatarUrl?: string;
  status: "PENDING" | "CONFIRMED" | "PAID" | "REMOVED";
  joinedAt?: string;
  paymentStatus?: "NONE" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
}

export interface RoomResponse extends RoomSummaryDto {
  ownerId: string;
  description?: string;
  members?: RoomMemberDto[];
  tariffPlanId?: string;
  isOwner?: boolean;
  myStatus?: RoomMemberDto["status"];
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
  roomId: string;
  amount?: number;
}

export interface PaymentIntentResponse {
  id: string;
  clientSecret?: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  redirectUrl?: string;
}

export interface ConfirmPaymentRequest {
  intentId: string;
  paymentMethod?: string;
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
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface PageParams {
  page?: number;
  size?: number;
}
