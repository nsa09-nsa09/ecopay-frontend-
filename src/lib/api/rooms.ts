import { apiGet, apiPatch, apiPost } from "./client";
import type {
  ConfirmOwnerAccessRequest,
  CreateRoomRequest,
  JoinRoomRequest,
  PageParams,
  RevealIdentifierRequest,
  RevealedIdentifierDto,
  RoomMemberDto,
  RoomResponse,
  UpdateRoomRequest,
} from "./types";

export const roomsApi = {
  list: (params?: PageParams & { status?: string; serviceId?: string; query?: string }) =>
    apiGet<RoomResponse[]>("/rooms", { params }),
  myMemberships: () =>
    apiGet<RoomResponse[]>("/rooms", { params: { mine: true } }),
  get: (id: string | number) => apiGet<RoomResponse>(`/rooms/${id}`),
  create: (body: CreateRoomRequest) => apiPost<RoomResponse>("/rooms", body),
  update: (id: string | number, body: UpdateRoomRequest) =>
    apiPatch<RoomResponse>(`/rooms/${id}`, body),
  cancel: (id: string | number) => apiPost<RoomResponse>(`/rooms/${id}/cancel`),
  complete: (id: string | number) => apiPost<RoomResponse>(`/rooms/${id}/complete`),
  readyForVerification: (id: string | number) =>
    apiPost<RoomResponse>(`/rooms/${id}/ready-for-verification`),
};

export const roomMembersApi = {
  join: (roomId: string | number, body: JoinRoomRequest) =>
    apiPost<RoomMemberDto>(`/rooms/${roomId}/members`, body),
  list: (roomId: string | number) =>
    apiGet<RoomMemberDto[]>(`/rooms/${roomId}/members`),
  myMembership: (roomId: string | number) =>
    apiGet<RoomMemberDto>(`/rooms/${roomId}/members/me`),
  confirmAccessAsMember: (roomId: string | number) =>
    apiPost<RoomMemberDto>(`/rooms/${roomId}/members/me/confirm-access`),
  ownerAccess: (
    roomId: string | number,
    memberId: string | number,
    body: ConfirmOwnerAccessRequest,
  ) =>
    apiPatch<RoomMemberDto>(
      `/rooms/${roomId}/members/${memberId}/owner-access`,
      body,
    ),
  revealIdentifier: (
    roomId: string | number,
    memberId: string | number,
    body: RevealIdentifierRequest,
  ) =>
    apiPost<RevealedIdentifierDto>(
      `/rooms/${roomId}/members/${memberId}/reveal-identifier`,
      body,
    ),
};
