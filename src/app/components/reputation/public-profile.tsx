import { useState } from "react";
import { useParams } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useI18n } from "../i18n-provider";
import { Card, Button, SkeletonCard, EmptyState } from "../ds-primitives";
import { Star, AlertCircle, Flag, Info, Lock } from "lucide-react";
import { reputationApi, reviewsApi } from "../../../lib/api/reviews";
import { roomsApi } from "../../../lib/api/rooms";
import { useAuth } from "../../../lib/auth/AuthContext";
import { ApiError } from "../../../lib/api/client";

// Star Rating Component
function StarRating({ rating, size = 16, interactive = false, onChange }: { rating: number; size?: number; interactive?: boolean; onChange?: (rating: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onChange?.(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
          className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
        >
          <Star
            size={size}
            fill={(interactive ? hover || rating : rating) >= star ? "var(--eco-warning-500)" : "none"}
            style={{ color: (interactive ? hover || rating : rating) >= star ? "var(--eco-warning-500)" : "var(--eco-border)" }}
          />
        </button>
      ))}
    </div>
  );
}

// Leave Review Modal — submits to the real reviews API.
function LeaveReviewModal({
  isOpen,
  onClose,
  recipientId,
}: {
  isOpen: boolean;
  onClose: () => void;
  recipientId: number;
}) {
  const { t } = useI18n();
  const qc = useQueryClient();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");

  // Rooms the current user is part of — backend validates that the chosen room is
  // actually shared with the recipient and is ACTIVE/COMPLETED.
  const myRoomsQ = useQuery({
    queryKey: ["rooms", "me", "for-review"],
    queryFn: () => roomsApi.myMemberships({ size: 100 }),
    enabled: isOpen,
  });
  const myRooms = myRoomsQ.data?.items ?? [];

  const submit = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        recipientId,
        roomId: Number(selectedRoom),
        rating,
        text: reviewText.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reputation", recipientId] });
      toast.success(t("reviewSubmitted"));
      setRating(0);
      setReviewText("");
      setSelectedRoom("");
      onClose();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to submit review");
    },
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("leaveAReview")}</h2>
          <button onClick={onClose} style={{ color: "var(--eco-text-tertiary)" }}>✕</button>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("selectRoom")}</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            >
              <option value="">{t("selectCompletedRoom")}</option>
              {myRooms.map((room) => (
                <option key={room.id} value={String(room.id)}>
                  {room.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("yourRating")}</label>
            <div className="flex items-center gap-2">
              <StarRating rating={rating} size={24} interactive onChange={setRating} />
              {rating > 0 && <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>({rating} {t("starsOutOfFive")})</span>}
            </div>
          </div>

          <div>
            <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("reviewText")}</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              placeholder={t("reviewTextPlaceholder")}
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none resize-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={onClose} className="flex-1">{t("cancel")}</Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => submit.mutate()}
              loading={submit.isPending}
              disabled={!selectedRoom || rating === 0 || submit.isPending}
              className="flex-1"
            >
              {t("submitReview")}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function ReputationExplanationPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { t } = useI18n();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{t("reputationExplanation")}</h2>
          <button onClick={onClose} style={{ color: "var(--eco-text-tertiary)" }}>✕</button>
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>{t("reputationFactorsDesc")}</p>
          <div className="flex flex-col gap-2">
            {[
              { icon: Star, label: t("factorAverageRating") },
              { icon: AlertCircle, label: t("factorDisputes") },
              { icon: Flag, label: t("factorViolations") },
            ].map((factor, idx) => (
              <div key={idx} className="flex items-start gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
                  <factor.icon size={16} style={{ color: "var(--eco-primary)" }} />
                </div>
                <div className="flex-1 pt-1">
                  <p className="text-[13px]" style={{ color: "var(--eco-text)" }}>{factor.label}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="primary" size="md" onClick={onClose} className="mt-2">{t("close")}</Button>
        </div>
      </Card>
    </div>
  );
}

export function PublicUserProfilePage() {
  const { t } = useI18n();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const profileId = Number(id);

  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative">("all");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);

  const repQ = useQuery({
    queryKey: ["reputation", profileId],
    queryFn: () => reputationApi.user(profileId),
    enabled: Number.isFinite(profileId),
  });
  const reviewsQ = useQuery({
    queryKey: ["reputation", profileId, "reviews"],
    queryFn: () => reputationApi.reviews(profileId),
    enabled: Number.isFinite(profileId),
  });

  // Eligibility: signed-in and not your own profile. The backend enforces the rest
  // (shared ACTIVE/COMPLETED room, one review per room).
  const canLeaveReview = Boolean(currentUser) && currentUser?.id !== profileId;

  if (repQ.isLoading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-6">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  if (repQ.isError || !repQ.data) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <EmptyState title={t("publicProfile")} description="Profile unavailable." />
      </div>
    );
  }

  const rep = repQ.data;
  const reviews = reviewsQ.data ?? [];
  const averageRating = rep.averageRating ?? 0;

  const filteredReviews = reviews.filter((r) => {
    if (reviewFilter === "positive") return r.rating >= 4;
    if (reviewFilter === "negative") return r.rating < 4;
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[28px]" style={{ color: "var(--eco-text)" }}>{t("publicProfile")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <Card>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 text-[24px]" style={{ background: "var(--eco-brand-100)", color: "var(--eco-primary)" }}>
                {(rep.displayName ?? "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-[22px] mb-1" style={{ color: "var(--eco-text)" }}>{rep.displayName ?? `User #${profileId}`}</h2>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-primary)" }}>{rep.reputation ?? 0}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("reputationScore")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{rep.reviewsCount ?? 0}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("reviews")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{rep.completedRoomsCount ?? 0}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("successfulPeriods")}</div>
              </div>
            </div>

            {/* Rating */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--eco-border)" }}>
              <div className="flex items-center gap-3">
                <div className="text-[32px]" style={{ color: "var(--eco-text)" }}>{averageRating.toFixed(1)}</div>
                <div>
                  <StarRating rating={averageRating} size={20} />
                  <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
                    {rep.reviewsCount ?? 0} {t("reviews")}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Reviews Section */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{t("reviewsTitle")}</h3>
              <Button
                variant={canLeaveReview ? "primary" : "ghost"}
                size="sm"
                onClick={() => canLeaveReview && setReviewModalOpen(true)}
                disabled={!canLeaveReview}
              >
                {!canLeaveReview && <Lock size={14} className="mr-1" />}
                {t("leaveReview")}
              </Button>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[
                { key: "all" as const, label: t("allReviews") },
                { key: "positive" as const, label: t("positiveReviews") },
                { key: "negative" as const, label: t("negativeReviews") },
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setReviewFilter(filter.key)}
                  className="px-3 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-colors"
                  style={{
                    background: reviewFilter === filter.key ? "var(--eco-primary)" : "var(--eco-surface)",
                    color: reviewFilter === filter.key ? "#fff" : "var(--eco-text-secondary)",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* Reviews List */}
            {reviewsQ.isLoading ? (
              <SkeletonCard />
            ) : filteredReviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("noReviewsYet")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--eco-neutral-100)" }}>
                        {(review.authorDisplayName ?? "?").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{review.authorDisplayName ?? `User #${review.authorId}`}</span>
                          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ""}
                          </span>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                        {review.text && <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>{review.text}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Info size={16} style={{ color: "var(--eco-primary)" }} />
              <h3 className="text-[16px]" style={{ color: "var(--eco-text)" }}>{t("reputationFactors")}</h3>
            </div>
            <p className="text-[13px] mb-3" style={{ color: "var(--eco-text-secondary)" }}>{t("reputationFactorsDesc")}</p>
            <ul className="flex flex-col gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <li>• {t("factorAverageRating")}</li>
              <li>• {t("factorCompletedPeriods")}</li>
              <li>• {t("factorDisputes")}</li>
              <li>• {t("factorViolations")}</li>
            </ul>
            <Button variant="ghost" size="sm" onClick={() => setExplanationOpen(true)} className="w-full mt-3">
              {t("viewDetails")}
            </Button>
          </Card>
        </div>
      </div>

      <LeaveReviewModal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} recipientId={profileId} />
      <ReputationExplanationPanel isOpen={explanationOpen} onClose={() => setExplanationOpen(false)} />
    </div>
  );
}
