import { apiPost } from "./client";
import type {
  ConfirmPaymentRequest,
  CreatePaymentIntentRequest,
  PaymentIntentResponse,
} from "./types";

export const paymentsApi = {
  createIntent: (roomMemberId: string | number, body: CreatePaymentIntentRequest) =>
    apiPost<PaymentIntentResponse>(`/payments/members/${roomMemberId}/intent`, body),
  confirmSuccess: (intentId: string | number, body: ConfirmPaymentRequest) =>
    apiPost<PaymentIntentResponse>(
      `/payments/intents/${intentId}/confirm-success`,
      body,
    ),
};
