import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { useI18n } from "../i18n-provider";
import { formatDate } from "../../lib/datetime";
import { Card, Button, Skeleton } from "../ds-primitives";
import { Star, Shield, AlertCircle, Flag, Info } from "lucide-react";
import {
  ApiError,
  getPublicProfile,
  getReputationRequest,
  getReputationReviewsRequest,
  type PublicProfileDto,
  type ReputationDto,
  type ReviewDto,
} from "../../lib/api";
import { reputationProgress } from "../../lib/reputation";
import { ReputationLevelBadge } from "./level-badge";

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

export { StarRating };

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
            <p className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{t("reviewModeratedNote")}</p>
          </div>
          <Button variant="primary" size="md" onClick={onClose} className="mt-2">{t("close")}</Button>
        </div>
      </Card>
    </div>
  );
}

export function PublicUserProfilePage() {
  const { t, language } = useI18n();
  const { id, publicId } = useParams<{ id?: string; publicId?: string }>();

  const [reviewFilter, setReviewFilter] = useState<"all" | "positive" | "negative" | "recent">("all");
  const [explanationOpen, setExplanationOpen] = useState(false);

  const [reputation, setReputation] = useState<ReputationDto | null>(null);
  const [profile, setProfile] = useState<PublicProfileDto | null>(null);
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setProfile(null);

    async function loadByPublicId(hash: string) {
      const prof = await getPublicProfile(hash);
      if (cancelled) return;
      setProfile(prof);
      const [rep, rev] = await Promise.all([
        getReputationRequest(prof.id).catch(() => null),
        getReputationReviewsRequest(prof.id).catch(() => [] as ReviewDto[]),
      ]);
      if (cancelled) return;
      if (rep) {
        setReputation(rep);
      } else {
        setReputation({
          userId: prof.id,
          displayName: prof.displayName,
          avatar: prof.avatar ?? null,
          reputation: prof.reputation,
          averageRating: prof.averageRating,
          reviewsCount: prof.reviewsCount,
          completedRoomsCount: prof.completedRoomsCount,
        });
      }
      setReviews(rev);
    }

    async function loadByNumericId(uid: number) {
      const [rep, rev] = await Promise.all([
        getReputationRequest(uid),
        getReputationReviewsRequest(uid),
      ]);
      if (cancelled) return;
      setReputation(rep);
      setReviews(rev);
    }

    const run = async () => {
      try {
        if (publicId) {
          await loadByPublicId(publicId);
        } else if (id) {
          const numeric = Number(id);
          if (!Number.isNaN(numeric)) {
            await loadByNumericId(numeric);
          } else {
            throw new ApiError(400, "Invalid user.");
          }
        } else {
          throw new ApiError(400, "Invalid user.");
        }
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setError(t("publicProfileNotFound"));
        } else {
          setError(err instanceof ApiError ? err.message : "Unable to load this profile right now.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => { cancelled = true; };
  }, [id, publicId, t]);

  const filteredReviews = reviews
    .filter((r) => {
      if (reviewFilter === "positive") return r.rating >= 4;
      if (reviewFilter === "negative") return r.rating < 4;
      return true;
    })
    .slice()
    .sort((a, b) => {
      if (reviewFilter === "recent") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Skeleton width={200} height={28} />
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
          <div className="flex flex-col gap-6">
            <Card className="flex flex-col gap-3">
              <Skeleton width={120} height={20} />
              <Skeleton width="60%" height={14} />
              <Skeleton width="40%" height={14} />
            </Card>
            <Card><Skeleton width="100%" height={120} /></Card>
          </div>
          <Card><Skeleton width="100%" height={160} /></Card>
        </div>
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card>
          <div className="flex items-center gap-2 text-[14px]" style={{ color: "var(--eco-negative)" }}>
            <AlertCircle size={15} /> {error ?? "User not found."}
          </div>
        </Card>
      </div>
    );
  }

  const initial = (reputation.displayName ?? "?").charAt(0).toUpperCase();
  const avg = reputation.averageRating ?? 0;

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-[22px] sm:text-[28px]" style={{ color: "var(--eco-text)" }}>{t("publicProfile")}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">
        <div className="flex flex-col gap-6">
          <Card>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              {reputation.avatar ? (
                <img
                  src={reputation.avatar}
                  alt={reputation.displayName ?? ""}
                  className="w-20 h-20 rounded-full object-cover shrink-0"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center shrink-0 text-[24px]"
                  style={{ background: "var(--eco-brand-100)", color: "var(--eco-primary)" }}
                >
                  {initial}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h2 className="text-[20px] sm:text-[22px] break-words" style={{ color: "var(--eco-text)" }}>{reputation.displayName}</h2>
                <div className="mt-1.5">
                  <ReputationLevelBadge level={reputation.reputationLevel} score={reputation.reputation} />
                </div>
                <div className="text-[13px] mt-1.5" style={{ color: "var(--eco-text-tertiary)" }}>
                  {profile?.publicId ? <span style={{ fontFamily: "monospace" }}>{profile.publicId}</span> : <>User #{reputation.userId}</>}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-primary)" }}>{reputation.reputation}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("reputationScore")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{reputation.completedRoomsCount}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("successfulPeriods")}</div>
              </div>
              <div className="text-center">
                <div className="text-[24px]" style={{ color: "var(--eco-text)" }}>{reputation.reviewsCount}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("reviews")}</div>
              </div>
            </div>

            {(() => {
              const prog = reputationProgress(reputation.reputation);
              return (
                <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--eco-border)" }}>
                  <div className="flex items-center justify-between mb-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    <span>{t("reputationLevel")}</span>
                    {prog ? (
                      <span>{prog.pointsToNext} {t("repPointsToNext")} {t(prog.next.labelKey)}</span>
                    ) : (
                      <span>{t("repMaxLevel")}</span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--eco-surface)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.round((prog ? prog.progress : 1) * 100)}%`, background: "var(--eco-primary)" }} />
                  </div>
                </div>
              );
            })()}

            {reputation.averageRating != null && (
              <div className="mt-6 pt-6 border-t" style={{ borderColor: "var(--eco-border)" }}>
                <div className="flex items-center gap-3">
                  <div className="text-[32px]" style={{ color: "var(--eco-text)" }}>{avg.toFixed(1)}</div>
                  <div>
                    <StarRating rating={avg} size={20} />
                    <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>
                      {reputation.reviewsCount} {t("reviews")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px]" style={{ color: "var(--eco-text)" }}>{t("reviewsTitle")}</h3>
            </div>

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
                  className="px-3 py-1.5 rounded-lg text-[13px] whitespace-nowrap transition-colors cursor-pointer"
                  style={{
                    background: reviewFilter === filter.key ? "var(--eco-primary)" : "var(--eco-surface)",
                    color: reviewFilter === filter.key ? "#fff" : "var(--eco-text-secondary)",
                    border: "none",
                  }}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {filteredReviews.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[14px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("noReviewsYet")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="p-4 rounded-lg" style={{ background: "var(--eco-surface)" }}>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--eco-neutral-100)" }}>
                        {(review.authorDisplayName ?? "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{review.authorDisplayName}</span>
                          <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                            {formatDate(review.createdAt, language)}
                          </span>
                        </div>
                        <StarRating rating={review.rating} size={14} />
                        {review.text && (
                          <p className="text-[13px] mt-2 whitespace-pre-wrap" style={{ color: "var(--eco-text-secondary)" }}>
                            {review.text}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

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

      <ReputationExplanationPanel isOpen={explanationOpen} onClose={() => setExplanationOpen(false)} />
    </div>
  );
}
