import { apiGet, apiPost } from "./client";

export interface CreateRefundRequest {
  paymentTransactionId: number;
  amount: number;
  reason: string;
  idempotencyKey: string;
}

export interface RefundTransactionResponse {
  id: number;
  paymentTransactionId: number;
  status: "PENDING" | "SUCCESS" | "FAILED";
  amount: number;
  currency: string;
  reason: string;
  idempotencyKey: string;
  providerRefundId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const refundsApi = {
  request: (body: CreateRefundRequest) =>
    apiPost<RefundTransactionResponse>("/refunds", body),
  listMine: () => apiGet<RefundTransactionResponse[]>("/refunds/me"),
  get: (id: number | string) =>
    apiGet<RefundTransactionResponse>(`/refunds/${id}`),
};
