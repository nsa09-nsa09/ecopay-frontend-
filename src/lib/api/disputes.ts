import { apiGet } from "./client";
import type { DisputeResponse } from "./types";

export const disputesApi = {
  list: () => apiGet<DisputeResponse[]>("/disputes"),
  get: (id: string | number) => apiGet<DisputeResponse>(`/disputes/${id}`),
};
