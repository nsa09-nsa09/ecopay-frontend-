import { apiGet, apiPost } from "./client";

export interface CreateReviewRequest {
  recipientId: number;
  roomId: number;
  rating: number;
  text?: string;
}

export interface ReviewDto {
  id: number;
  authorId: number;
  authorDisplayName?: string;
  recipientId: number;
  roomId: number;
  rating: number;
  text?: string;
  createdAt?: string;
}

export interface ReputationDto {
  userId: number;
  displayName: string;
  reputation: number;
  averageRating: number;
  reviewsCount: number;
  completedRoomsCount: number;
}

export const reviewsApi = {
  create: (body: CreateReviewRequest) =>
    apiPost<ReviewDto>("/reviews", body),
};

export const reputationApi = {
  user: (userId: number | string) =>
    apiGet<ReputationDto>(`/reputation/users/${userId}`),
  reviews: (userId: number | string) =>
    apiGet<ReviewDto[]>(`/reputation/users/${userId}/reviews`),
};
