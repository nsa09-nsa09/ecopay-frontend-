import { useEffect, useState } from "react";
import { Modal, Button } from "../ds-primitives";
import { toast } from "sonner";
import { ApiError, createReviewRequest } from "../../lib/api";
import { useAuth } from "../auth/auth-provider";
import { useI18n, type Language } from "../i18n-provider";
import { StarRating } from "./public-profile";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

interface LeaveReviewModalProps {
  open: boolean;
  onClose: () => void;
  recipientId: number;
  roomId: number;
  recipientName?: string;
  onSubmitted?: () => void;
}

export function LeaveReviewModal({ open, onClose, recipientId, roomId, recipientName, onSubmitted }: LeaveReviewModalProps) {
  const { authorizedRequest } = useAuth();
  const { language } = useI18n();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setRating(0);
      setText("");
    }
  }, [open]);

  const submit = async () => {
    if (rating < 1) return;
    setSubmitting(true);
    try {
      await authorizedRequest((token) => createReviewRequest({
        recipientId,
        roomId,
        rating,
        text: text.trim() || undefined,
      }, token));
      toast.success(tx(language, "Отзыв отправлен", "Пікір жіберілді", "Review submitted"));
      onSubmitted?.();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError
        ? err.message
        : tx(language, "Не удалось отправить отзыв.", "Пікірді жіберу мүмкін болмады.", "Unable to submit review.");
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={tx(language, "Оставить отзыв", "Пікір қалдыру", "Leave a Review")}>
      <div className="flex flex-col gap-4">
        {recipientName && (
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(language, "Отзыв о", "Пікір", "Reviewing")} {recipientName}
          </div>
        )}

        <div>
          <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Ваша оценка", "Сіздің бағаңыз", "Your rating")}
          </label>
          <div className="flex items-center gap-2">
            <StarRating rating={rating} size={28} interactive onChange={setRating} />
            {rating > 0 && (
              <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{rating} / 5</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Текст отзыва (опционально)", "Пікір мәтіні (міндетті емес)", "Review (optional)")}
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            placeholder={tx(language, "Поделитесь подробностями вашего опыта", "Тәжірибеңіздің егжей-тегжейімен бөлісіңіз", "Share details of your experience")}
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 rounded-lg text-[14px] outline-none resize-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
          <div className="text-[11px] mt-1 text-right" style={{ color: "var(--eco-text-tertiary)" }}>{text.length}/2000</div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1">
            {tx(language, "Отмена", "Болдырмау", "Cancel")}
          </Button>
          <Button variant="primary" size="md" loading={submitting} disabled={rating < 1} onClick={submit} className="flex-1">
            {tx(language, "Отправить отзыв", "Пікір жіберу", "Submit review")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
