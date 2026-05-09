import { useState } from "react";
import { useI18n } from "../i18n-provider";
import { Card, Badge, Button } from "../ds-primitives";
import { Star, Shield, Lock, AlertCircle, Flag, ThumbsUp, Info } from "lucide-react";
import { GapBanner } from "../../../lib/ui/GapBanner";

// Mock data type
type UserProfile = {
  id: string;
  displayName: string;
  memberSince: string;
  lastActive: string;
  verified: boolean;
  reputationScore: number;
  averageRating: number;
  totalReviews: number;
  roomsCreated: number;
  roomsJoined: number;
  successfulPeriods: number;
  recentRooms: Array<{ id: string; name: string; operator: string; role: "owner" | "member" }>;
  reviews: Array<{
    id: string;
    rating: number;
    text: string;
    roomName: string;
    reviewerName: string;
    date: string;
    moderated?: boolean;
    helpful?: number;
  }>;
};

// Mock user data
const mockUser: UserProfile = {
  id: "user-123",
  displayName: "Айдар К.",
  memberSince: "January 2025",
  lastActive: "2 hours ago",
  verified: true,
  reputationScore: 847,
  averageRating: 4.6,
  totalReviews: 23,
  roomsCreated: 5,
  roomsJoined: 8,
  successfulPeriods: 18,
  recentRooms: [
    { id: "r1", name: "Beeline Mega 100GB", operator: "Beeline", role: "owner" },
    { id: "r2", name: "Activ Family", operator: "Activ", role: "member" },
    { id: "r3", name: "Altel Unlim", operator: "Altel", role: "member" },
  ],
  reviews: [
    {
      id: "rev1",
      rating: 5,
      text: "Отличный владелец комнаты! Всегда оплачивает вовремя и быстро отвечает на сообщения. Рекомендую.",
      roomName: "Beeline Mega 100GB",
      reviewerName: "Серик А.",
      date: "15 days ago",
      helpful: 8,
    },
    {
      id: "rev2",
      rating: 4,
      text: "Хороший участник, но иногда задержки с оплатой. В целом рекомендую.",
      roomName: "Activ Family",
      reviewerName: "Алия М.",
      date: "1 month ago",
      helpful: 3,
    },
    {
      id: "rev3",
      rating: 5,
      text: "Надежный человек, всегда на связи. Комната работала отлично весь период.",
      roomName: "Tele2 Super",
      reviewerName: "Данияр Б.",
      date: "2 months ago",
      moderated: false,
      helpful: 12,
    },
  ],
};

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

// Leave Review Modal
function LeaveReviewModal({ isOpen, onClose, user }: { isOpen: boolean; onClose: () => void; user: UserProfile }) {
  const { t } = useI18n();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Mock completed rooms (in real app, fetch from API)
  const completedRooms = [
    { id: "room1", name: "Beeline Mega 100GB", operator: "Beeline" },
    { id: "room2", name: "Activ Family Plan", operator: "Activ" },
  ];

  if (!isOpen) return null;

  if (submitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
        <Card className="w-full max-w-md text-center">
          <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
            <Star size={24} style={{ color: "var(--eco-positive)" }} fill="var(--eco-positive)" />
          </div>
          <h2 className="text-[20px] mb-2" style={{ color: "var(--eco-text)" }}>{t("reviewSubmitted")}</h2>
          <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>{t("thankYouForReview")}</p>
          <Button variant="primary" size="md" onClick={onClose}>{t("close")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <Card className="w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("leaveAReview")}</h2>
          <button onClick={onClose} style={{ color: "var(--eco-text-tertiary)" }}>✕</button>
        </div>

        <div className="flex flex-col gap-4">
          {/* Room Selector */}
          <div>
            <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("selectRoom")}</label>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            >
              <option value="">{t("selectCompletedRoom")}</option>
              {completedRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.operator})
                </option>
              ))}
            </select>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("yourRating")}</label>
            <div className="flex items-center gap-2">
              <StarRating rating={rating} size={24} interactive onChange={setRating} />
              {rating > 0 && <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>({rating} {t("starsOutOfFive")})</span>}
            </div>
          </div>

          {/* Review Text */}
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

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" size="md" onClick={onClose} className="flex-1">{t("cancel")}</Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setSubmitted(true)}
              disabled={!selectedRoom || rating === 0 || !reviewText.trim()}
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

// Reputation Explanation Panel
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
              { icon: Shield, label: t("factorCompletedPeriods") },
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

          <div className="mt-4 p-3 rounded-lg" style={{ background: "var(--eco-warning-50)" }}>
            <p className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
              {t("reviewModeratedNote")}
            </p>
          </div>

          <Button variant="primary" size="md" onClick={onClose} className="mt-2">{t("close")}</Button>
        </div>
      </Card>
    </div>
  );
}

export function PublicUserProfilePage() {
  const { t } = useI18n();
  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative" | "recent">("all");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [explanationOpen, setExplanationOpen] = useState(false);
  const [canLeaveReview] = useState(false); // MVP: eligibility check

  const user = mockUser;

  // Filter reviews
  const filteredReviews = user.reviews.filter((review) => {
    if (reviewFilter === "positive") return review.rating >= 4;
    if (reviewFilter === "negative") return review.rating < 4;
    if (reviewFilter === "recent") return true; // Already sorted by date
    return true;
  });

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[28px]" style={{ color: "var(--eco-text)" }}>{t("publicProfile")}</h1>
      </div>

      {/* Desktop Layout: 2 columns */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        {/* Main Content */}
        <div className="flex flex-col gap-6">
          {/* Profile Card */}
          <Card>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {/* Avatar */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 text-[24px]" style={{ background: "var(--eco-brand-100)", color: "var(--eco-primary)" }}>
                {user.displayName.charAt(0)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-[22px]" style={{ color: "var(--eco-text)" }}>{user.displayName}</h2>
                  {user.verified && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: "var(--eco-success-100)" }}>
                      <Shield size={12} style={{ color: "var(--eco-positive)" }} />
                      <span className="text-[11px]" style={{ color: "var(--eco-positive)" }}>{t("verified")}</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
                  <span>{t("memberSince")}: {user.memberSince}</span>
                  <span>·</span>
                  <span>{t("lastActive")}: {user.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-primary)" }}>{user.reputationScore}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("reputationScore")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{user.roomsCreated}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("roomsCreated")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{user.roomsJoined}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("roomsJoined")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{user.successfulPeriods}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("successfulPeriods")}</div>
              </div>
            </div>

            {/* Rating */}
            <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--eco-border)" }}>
              <div className="flex items-center gap-3">
                <div className="text-[32px]" style={{ color: "var(--eco-text)" }}>{user.averageRating.toFixed(1)}</div>
                <div>
                  <StarRating rating={user.averageRating} size={20} />
                  <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
                    {user.totalReviews} {t("reviews")}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Rooms */}
          <Card>
            <h3 className="text-[18px] mb-4" style={{ color: "var(--eco-text)" }}>{t("recentRooms")}</h3>
            <div className="flex flex-col gap-2">
              {user.recentRooms.map((room) => (
                <div key={room.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                  <div className="flex-1">
                    <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{room.name}</div>
                    <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{room.operator}</div>
                  </div>
                  <Badge variant={room.role === "owner" ? "default" : "secondary"}>{room.role === "owner" ? t("owner") : t("member")}</Badge>
                </div>
              ))}
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
                className="relative"
              >
                {!canLeaveReview && <Lock size={14} className="mr-1" />}
                {t("leaveReview")}
              </Button>
            </div>

            {/* Review Eligibility Note */}
            {!canLeaveReview && (
              <div className="mb-4 p-3 rounded-lg flex items-start gap-2" style={{ background: "var(--eco-warning-50)" }}>
                <Lock size={16} style={{ color: "var(--eco-warning-500)" }} className="shrink-0 mt-0.5" />
                <div>
                  <p className="text-[13px]" style={{ color: "var(--eco-text)" }}>{t("reviewLocked")}</p>
                  <p className="text-[12px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>{t("reviewEligibilityDesc")}</p>
                </div>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {[
                { key: "all" as const, label: t("allReviews") },
                { key: "positive" as const, label: t("positiveReviews") },
                { key: "negative" as const, label: t("negativeReviews") },
                { key: "recent" as const, label: t("recentReviews") },
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
            {filteredReviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("noReviewsYet")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg" style={{ background: "var(--eco-surface)", border: review.moderated ? "1px solid var(--eco-warning-500)" : "none" }}>
                    {review.moderated && (
                      <div className="flex items-center gap-2 mb-2 text-[12px]" style={{ color: "var(--eco-warning-500)" }}>
                        <AlertCircle size={14} />
                        <span>{t("moderatedReview")}</span>
                      </div>
                    )}
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--eco-neutral-100)" }}>
                        {review.reviewerName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{review.reviewerName}</span>
                          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{review.date}</span>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                        <p className="text-[13px] mt-2" style={{ color: "var(--eco-text-secondary)" }}>{review.text}</p>
                        <div className="flex items-center gap-4 mt-2">
                          <button className="flex items-center gap-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                            <ThumbsUp size={12} />
                            <span>{t("helpful")} ({review.helpful})</span>
                          </button>
                          <button className="flex items-center gap-1 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                            <Flag size={12} />
                            <span>{t("report")}</span>
                          </button>
                        </div>
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
          {/* Reputation Explanation */}
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

      {/* Modals */}
      <LeaveReviewModal isOpen={reviewModalOpen} onClose={() => setReviewModalOpen(false)} user={user} />
      <ReputationExplanationPanel isOpen={explanationOpen} onClose={() => setExplanationOpen(false)} />
    </div>
  );
}
