import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Star } from "lucide-react";
import { Card } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import { getFeaturedServiceReviews, type PublicServiceReviewDto } from "../../lib/api";

export function FeaturedReviewsSection() {
  const { t } = useI18n();
  const [featuredReviews, setFeaturedReviews] = useState<PublicServiceReviewDto[]>([]);

  useEffect(() => {
    let cancelled = false;
    void getFeaturedServiceReviews()
      .then((data) => { if (!cancelled) setFeaturedReviews(data ?? []); })
      .catch(() => { /* silent — section hides when empty */ });
    return () => { cancelled = true; };
  }, []);

  if (featuredReviews.length === 0) return null;

  return (
    <section style={{ background: "var(--eco-surface)" }} className="px-4 sm:px-6 py-10 sm:py-12 overflow-hidden">
      <div className="max-w-[1200px] mx-auto mb-6 text-center">
        <h2 className="text-[22px] sm:text-[24px]" style={{ color: "var(--eco-text)" }}>{t("serviceReviewsTitle")}</h2>
      </div>
      <div className="ecopay-reviews-marquee" aria-label={t("serviceReviewsTitle")}>
        <div className="ecopay-reviews-track">
          {[...featuredReviews, ...featuredReviews].map((review, index) => (
            <Card key={`${review.id}-${index}`} className="ecopay-review-card flex flex-col gap-4">
              <div className="flex gap-1" aria-label={`${review.rating}/5`}>
                {Array.from({ length: 5 }).map((_, starIndex) => (
                  <Star
                    key={starIndex}
                    size={15}
                    fill={starIndex < review.rating ? "var(--eco-warning-500)" : "none"}
                    style={{ color: starIndex < review.rating ? "var(--eco-warning-500)" : "var(--eco-border)" }}
                  />
                ))}
              </div>
              <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--eco-text-secondary)" }}>{review.text}</p>
              <Link
                to={`/u/${review.authorPublicId}`}
                className="text-[13px] mt-auto"
                style={{ color: "var(--eco-text)", textDecoration: "none" }}
              >
                {review.authorDisplayName}
              </Link>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
