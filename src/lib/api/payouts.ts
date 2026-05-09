import { apiDelete, apiGet, apiPost } from "./client";

export interface PayoutDto {
  id: number;
  amount: number;
  currency: string;
  status: "PENDING" | "PENDING_METHOD" | "PROCESSING" | "SUCCESS" | "FAILED" | "CANCELED";
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
  status: "ACTIVE" | "REVOKED";
  createdAt?: string;
}

export const payoutsApi = {
  listMine: () => apiGet<PayoutDto[]>("/payouts/me"),
  get: (id: number | string) => apiGet<PayoutDto>(`/payouts/${id}`),
  listMethods: () => apiGet<PayoutMethodDto[]>("/payouts/methods"),
  registerMethod: (providerCardToken: string, panMask?: string) =>
    apiPost<PayoutMethodDto>("/payouts/methods", { providerCardToken, panMask }),
  revokeMethod: (id: number | string) =>
    apiDelete<void>(`/payouts/methods/${id}`),
};
