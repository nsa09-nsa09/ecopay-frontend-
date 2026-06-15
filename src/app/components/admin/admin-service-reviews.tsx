import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router";
import { AdminLayout } from "./admin-layout";
import { Badge, Button, Card, Modal, Select } from "../ds-primitives";
import { useI18n, type Language } from "../i18n-provider";
import { formatDateTime } from "../../lib/datetime";
import { useAuth } from "../auth/auth-provider";
import { FlashBanner, formatAdminApiError, useFlash } from "./admin-action-ui";
import { StarRating } from "../reputation/public-profile";
import { ChevronLeft, ChevronRight, ExternalLink, Pencil, RefreshCw, Star, Trash2 } from "lucide-react";
import {
  adminDeleteServiceReview,
  adminGetServiceReviews,
  adminSetServiceReviewFeatured,
  adminUpdateServiceReview,
  type AdminServiceReviewDto,
} from "../../lib/api";

const PAGE_SIZE = 20;

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

type FeaturedFilter = "all" | "featured" | "not_featured";

export function AdminServiceReviewsPage() {
  const { t, language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [items, setItems] = useState<AdminServiceReviewDto[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState<FeaturedFilter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<AdminServiceReviewDto | null>(null);
  const [deleting, setDeleting] = useState<AdminServiceReviewDto | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const { flash, show } = useFlash();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const featuredParam = filter === "all" ? undefined : filter === "featured";
      const data = await authorizedRequest((token) =>
        adminGetServiceReviews(token, { page, size: PAGE_SIZE, featured: featuredParam }),
      );
      setItems(data.items);
      setTotalPages(Math.max(1, data.totalPages));
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, filter, page, t]);

  useEffect(() => { void load(); }, [load]);

  const toggleFeatured = async (review: AdminServiceReviewDto) => {
    setPendingId(review.id);
    try {
      const updated = await authorizedRequest((token) =>
        adminSetServiceReviewFeatured(review.id, !review.featured, token),
      );
      setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
      show("success", t("actionCompletedAndLogged"));
    } catch (err) {
      show("error", formatAdminApiError(err, t));
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await authorizedRequest((token) => adminDeleteServiceReview(deleting.id, token));
      setDeleting(null);
      show("success", t("actionCompletedAndLogged"));
      void load();
    } catch (err) {
      show("error", formatAdminApiError(err, t));
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-[1100px]">
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("adminServiceReviews")}</h1>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-full sm:w-52">
              <Select
                value={filter}
                onChange={(e) => { setPage(0); setFilter(e.target.value as FeaturedFilter); }}
                options={[
                  { value: "all", label: t("adminServiceReviewsAll") },
                  { value: "featured", label: t("adminServiceReviewsFeatured") },
                  { value: "not_featured", label: t("adminServiceReviewsNotFeatured") },
                ]}
              />
            </div>
            <Button variant="secondary" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw size={13} /> {t("retry")}
            </Button>
          </div>
        </div>

        <FlashBanner flash={flash} />

        {error && !loading && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</span>
          </Card>
        )}

        {loading ? (
          <Card><span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("loading")}</span></Card>
        ) : items.length === 0 ? (
          <Card className="text-center py-10 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {tx(language, "Отзывов пока нет", "Әзірге пікірлер жоқ", "No reviews yet")}
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {items.map((review) => (
              <Card key={review.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link
                        to={`/u/${review.authorPublicId}`}
                        className="text-[14px] inline-flex items-center gap-1"
                        style={{ color: "var(--eco-primary)", textDecoration: "none" }}
                        title={t("adminServiceReviewOpenAuthor")}
                      >
                        {review.authorDisplayName} <ExternalLink size={12} />
                      </Link>
                      <span className="text-[11px] break-all" style={{ color: "var(--eco-text-tertiary)" }}>
                        U-{review.authorId} · {review.authorEmail}
                      </span>
                      {review.featured && <Badge variant="success">{t("serviceReviewFeaturedBadge")}</Badge>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StarRating rating={review.rating} size={14} />
                      <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {formatDateTime(review.createdAt, language)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="flex items-center gap-1.5 text-[12px] cursor-pointer" style={{ color: "var(--eco-text-secondary)" }}>
                      <input
                        type="checkbox"
                        checked={review.featured}
                        disabled={pendingId === review.id}
                        onChange={() => void toggleFeatured(review)}
                      />
                      {t("adminServiceReviewFeatureToggle")}
                    </label>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(review)}>
                      <Pencil size={12} /> {t("catalogEdit")}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(review)}>
                      <Trash2 size={12} /> {t("catalogDelete")}
                    </Button>
                  </div>
                </div>
                <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--eco-text)" }}>{review.text}</p>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 text-[12px]">
            <Button variant="ghost" size="sm" disabled={page <= 0 || loading} onClick={() => setPage((p) => Math.max(0, p - 1))}>
              <ChevronLeft size={12} /> {t("prevPage")}
            </Button>
            <span style={{ color: "var(--eco-text-tertiary)" }}>
              {t("pageOf", { page: page + 1, total: totalPages })}
            </span>
            <Button variant="ghost" size="sm" disabled={page >= totalPages - 1 || loading} onClick={() => setPage((p) => p + 1)}>
              {t("nextPage")} <ChevronRight size={12} />
            </Button>
          </div>
        )}

        <EditReviewModal
          open={!!editing}
          existing={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setItems((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
            setEditing(null);
            show("success", t("actionCompletedAndLogged"));
          }}
        />

        <Modal open={!!deleting} onClose={() => setDeleting(null)} title={t("adminServiceReviewDeleteConfirm")}>
          <div className="flex flex-col gap-4">
            {deleting && (
              <div className="p-3 rounded-lg text-[12px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text)" }}>
                {deleting.authorDisplayName} — {deleting.rating}/5
              </div>
            )}
            <Button variant="destructive" onClick={() => void handleDelete()}>{t("catalogDelete")}</Button>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}

function EditReviewModal({
  open, existing, onClose, onSaved,
}: {
  open: boolean;
  existing: AdminServiceReviewDto | null;
  onClose: () => void;
  onSaved: (updated: AdminServiceReviewDto) => void;
}) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const [rating, setRating] = useState(5);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !existing) return;
    setRating(existing.rating);
    setText(existing.text);
    setError(null);
  }, [open, existing]);

  const submit = async () => {
    if (!existing) return;
    setSubmitting(true);
    setError(null);
    try {
      const updated = await authorizedRequest((token) =>
        adminUpdateServiceReview(existing.id, { rating, text: text.trim() }, token),
      );
      onSaved(updated);
    } catch (err) {
      setError(formatAdminApiError(err, t));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t("adminServiceReviewEditTitle")}>
      <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
        <div className="flex items-center gap-3">
          <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{t("serviceReviewRatingLabel")}:</span>
          <StarRating rating={rating} interactive onChange={setRating} size={18} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: "var(--eco-text)" }}>{t("serviceReviewTextLabel")}</label>
          <textarea
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="px-3 py-2 rounded-lg outline-none text-[13px]"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
        </div>
        {error && <div className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{error}</div>}
        <Button variant="primary" loading={submitting} onClick={() => void submit()}>
          <Star size={13} /> {t("serviceReviewSave")}
        </Button>
      </div>
    </Modal>
  );
}
