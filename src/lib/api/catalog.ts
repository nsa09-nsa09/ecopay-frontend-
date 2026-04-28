import { apiGet } from "./client";
import type { CategoryDto, ServiceDto, TariffPlanDto } from "./types";

export const catalogApi = {
  categories: () => apiGet<CategoryDto[]>("/catalog/categories"),
  services: (params?: { categoryId?: string; query?: string }) =>
    apiGet<ServiceDto[]>("/catalog/services", { params }),
  service: (id: string) => apiGet<ServiceDto>(`/catalog/services/${id}`),
  tariffs: (serviceId: string) =>
    apiGet<TariffPlanDto[]>(`/catalog/services/${serviceId}/tariffs`),
};
