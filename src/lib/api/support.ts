import { apiGet, apiPost } from "./client";
import type {
  CreateSupportMessageRequest,
  CreateSupportTicketRequest,
  SupportMessageDto,
  SupportTicketResponse,
} from "./types";

export const supportApi = {
  list: () => apiGet<SupportTicketResponse[]>("/support-tickets"),
  get: (id: string | number) => apiGet<SupportTicketResponse>(`/support-tickets/${id}`),
  create: (body: CreateSupportTicketRequest) =>
    apiPost<SupportTicketResponse>("/support-tickets", body),
  postMessage: (id: string | number, body: CreateSupportMessageRequest) =>
    apiPost<SupportMessageDto>(`/support-tickets/${id}/messages`, body),
};
