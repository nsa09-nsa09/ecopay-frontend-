import { apiGet, apiPatch, apiPost } from "./client";
import type {
  CancelRoomRequest,
  ConfirmOwnerAccessRequest,
  CreateRoomRequest,
  JoinRoomRequest,
  MyRoomMembershipDto,
  PagedResponse,
  PageParams,
  RevealIdentifierRequest,
  RevealedIdentifierDto,
  RoomMemberDto,
  RoomResponse,
  RoomStatus,
  RoomSummaryDto,
  RoomType,
  UpdateRoomRequest,
} from "./types";

export const roomsApi = {
  list: (params?: PageParams & {
    status?: RoomStatus;
    roomType?: RoomType;
    categoryId?: number;
    serviceId?: number;
    sortBy?: string;
    sortDir?: "asc" | "desc";
  }) => apiGet<PagedResponse<RoomSummaryDto>>("/rooms", { params }),
  myMemberships: (params?: PageParams) =>
    apiGet<PagedResponse<RoomSummaryDto>>("/rooms/me", { params }),
  get: (id: string | number) => apiGet<RoomResponse>(`/rooms/${id}`),
  create: (body: CreateRoomRequest) => apiPost<RoomResponse>("/rooms", body),
  update: (id: string | number, body: UpdateRoomRequest) =>
    apiPatch<RoomResponse>(`/rooms/${id}`, body),
  cancel: (id: string | number, body?: CancelRoomRequest) =>
    apiPost<RoomResponse>(`/rooms/${id}/cancel`, body ?? {}),
  complete: (id: string | number) => apiPost<RoomResponse>(`/rooms/${id}/complete`),
  readyForVerification: (id: string | number) =>
    apiPost<RoomResponse>(`/rooms/${id}/ready-for-verification`),
};

export const roomMembersApi = {
  join: (roomId: string | number, body: JoinRoomRequest) =>
    apiPost<RoomMemberDto>(`/rooms/${roomId}/members`, body),
  list: (roomId: string | number, params?: PageParams) =>
    apiGet<PagedResponse<RoomMemberDto>>(`/rooms/${roomId}/members`, { params }),
  myMembership: (roomId: string | number) =>
    apiGet<MyRoomMembershipDto>(`/rooms/${roomId}/members/me`),
  confirmAccessAsMember: (roomId: string | number) =>
    apiPost<MyRoomMembershipDto>(`/rooms/${roomId}/members/me/confirm-access`),
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
