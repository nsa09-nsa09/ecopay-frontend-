import { apiGet, apiPatch, apiPost } from "./client";
import type {
  AdminActionLogDto,
  AdminDecisionRequest,
  ApplyDisputeSanctionsRequest,
  CreateRefundRequest,
  CreateSupportMessageRequest,
  DisputeDecisionRequest,
  DisputeResponse,
  ModerationQueueItemDto,
  PageParams,
  PagedResponse,
  RefundTransactionResponse,
  RoomEventLogDto,
  SupportTicketResponse,
  UpdateRefundStatusRequest,
  UpdateSupportTicketStatusRequest,
} from "./types";

export const adminDisputesApi = {
  list: () => apiGet<DisputeResponse[]>("/admin/disputes"),
  get: (id: string | number) => apiGet<DisputeResponse>(`/admin/disputes/${id}`),
  assign: (id: string | number) =>
    apiPatch<DisputeResponse>(`/admin/disputes/${id}/assign`),
  decide: (id: string | number, body: DisputeDecisionRequest) =>
    apiPatch<DisputeResponse>(`/admin/disputes/${id}/decision`, body),
  applyOwnerSanctions: (id: string | number, body: ApplyDisputeSanctionsRequest) =>
    apiPost<DisputeResponse>(
      `/admin/disputes/${id}/sanctions/owner-violation`,
      body,
    ),
};

export const adminLogsApi = {
  actions: (params?: PageParams & {
    entityType?: string;
    actorUserId?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    apiGet<PagedResponse<AdminActionLogDto>>("/admin/logs/admin-actions", {
      params,
    }),
  roomEvents: (params?: PageParams & {
    roomId?: string;
    actorUserId?: string;
    eventType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) =>
    apiGet<PagedResponse<RoomEventLogDto>>("/admin/logs/room-events", { params }),
  roomEventsByRoom: (roomId: string | number) =>
    apiGet<RoomEventLogDto[]>(`/admin/logs/room-events/room/${roomId}`),
};

export const adminModerationApi = {
  queue: () => apiGet<ModerationQueueItemDto[]>("/admin/moderation/queue"),
  assign: (queueId: string | number) =>
    apiPatch<ModerationQueueItemDto>(`/admin/moderation/queue/${queueId}/assign`),
  confirm: (queueId: string | number, body: AdminDecisionRequest) =>
    apiPatch<ModerationQueueItemDto>(
      `/admin/moderation/queue/${queueId}/confirm`,
      body,
    ),
  reject: (queueId: string | number, body: AdminDecisionRequest) =>
    apiPatch<ModerationQueueItemDto>(
      `/admin/moderation/queue/${queueId}/reject`,
      body,
    ),
  blockRoom: (roomId: string | number, body: AdminDecisionRequest) =>
    apiPatch<void>(`/admin/moderation/rooms/${roomId}/block`, body),
  banUser: (userId: string | number, body: AdminDecisionRequest) =>
    apiPatch<void>(`/admin/moderation/users/${userId}/ban`, body),
  batchConfirm: (memberIds: string[]) =>
    apiPost<unknown>(`/admin/moderation/queue/batch-confirm`, { memberIds }),
};

export const adminRefundsApi = {
  create: (body: CreateRefundRequest) =>
    apiPost<RefundTransactionResponse>("/admin/refunds", body),
  byDispute: (disputeId: string | number) =>
    apiGet<RefundTransactionResponse[]>(`/admin/refunds/by-dispute/${disputeId}`),
  markSuccess: (refundId: string | number, body: UpdateRefundStatusRequest) =>
    apiPatch<RefundTransactionResponse>(
      `/admin/refunds/${refundId}/success`,
      body,
    ),
  markFail: (refundId: string | number) =>
    apiPatch<RefundTransactionResponse>(`/admin/refunds/${refundId}/fail`),
};

export const staffTicketsApi = {
  queue: () => apiGet<SupportTicketResponse[]>("/staff/support-tickets/queue"),
  assigned: () =>
    apiGet<SupportTicketResponse[]>("/staff/support-tickets/assigned"),
  get: (id: string | number) =>
    apiGet<SupportTicketResponse>(`/staff/support-tickets/${id}`),
  assignToMe: (id: string | number) =>
    apiPost<SupportTicketResponse>(`/staff/support-tickets/${id}/assign-to-me`),
  setStatus: (id: string | number, body: UpdateSupportTicketStatusRequest) =>
    apiPost<SupportTicketResponse>(`/staff/support-tickets/${id}/status`, body),
  reply: (id: string | number, body: CreateSupportMessageRequest) =>
    apiPost<unknown>(`/staff/support-tickets/${id}/messages`, body),
  escalate: (id: string | number) =>
    apiPost<SupportTicketResponse>(`/staff/support-tickets/${id}/escalate`),
};
