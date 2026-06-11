import { useEffect, useState } from "react";
import { Modal, Button } from "../ds-primitives";
import { toast } from "sonner";
import { ApiError, createReviewRequest } from "../../lib/api";
import { useAuth } from "../auth/auth-provider";
import { StarRating } from "./public-profile";

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
      toast.success("Review submitted");
      onSubmitted?.();
      onClose();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "Unable to submit review.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Leave a Review">
      <div className="flex flex-col gap-4">
        {recipientName && (
          <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            Reviewing {recipientName}
          </div>
        )}

        <div>
          <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>Your rating</label>
          <div className="flex items-center gap-2">
            <StarRating rating={rating} size={28} interactive onChange={setRating} />
            {rating > 0 && (
              <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{rating} / 5</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>Review (optional)</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 2000))}
            placeholder="Share details of your experience"
            rows={4}
            maxLength={2000}
            className="w-full px-3 py-2 rounded-lg text-[14px] outline-none resize-none"
            style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
          />
          <div className="text-[11px] mt-1 text-right" style={{ color: "var(--eco-text-tertiary)" }}>{text.length}/2000</div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="ghost" size="md" onClick={onClose} className="flex-1">Cancel</Button>
          <Button variant="primary" size="md" loading={submitting} disabled={rating < 1} onClick={submit} className="flex-1">
            Submit review
          </Button>
        </div>
      </div>
    </Modal>
  );
}
