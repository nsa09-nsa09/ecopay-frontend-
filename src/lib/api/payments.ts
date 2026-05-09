import { apiDelete, apiGet, apiPost } from "./client";
import type {
  ConfirmPaymentRequest,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
  SavedCardDto,
} from "./types";

export const paymentsApi = {
  createIntent: (roomMemberId: string | number, body: CreatePaymentIntentRequest) =>
    apiPost<PaymentIntentResponse>(`/payments/members/${roomMemberId}/intent`, body),
  getIntent: (intentId: string | number) =>
    apiGet<PaymentIntentResponse>(`/payments/intents/${intentId}`),
  confirmSuccess: (intentId: string | number, body: ConfirmPaymentRequest) =>
    apiPost<PaymentIntentResponse>(
      `/payments/intents/${intentId}/confirm-success`,
      body,
    ),
};

export const savedCardsApi = {
  list: () => apiGet<SavedCardDto[]>("/payments/saved-cards"),
  setDefault: (id: number | string) =>
    apiPost<void>(`/payments/saved-cards/${id}/default`),
  delete: (id: number | string) =>
    apiDelete<void>(`/payments/saved-cards/${id}`),
};
