import { apiGet, apiPatch } from "./client";
import type { UpdateProfileRequest, UserDto } from "./types";

export const userApi = {
  me: () => apiGet<UserDto>("/users/me"),
  updateMe: (body: UpdateProfileRequest) => apiPatch<UserDto>("/users/me", body),
};
