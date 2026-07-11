import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Badge, Button, Card } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { StarRating } from '../reputation/public-profile';
import {
  ApiError,
  createServiceReview,
  deleteMyServiceReview,
  getMyServiceReview,
  updateMyServiceReview,
  type ServiceReviewDto,
} from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

export function MyServiceReviewCard() {
  const { t, language } = useI18n();
  const { isAuthenticated, authorizedRequest } = useAuth();
  const [review, setReview] = useState<ServiceReviewDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    authorizedRequest((token) => getMyServiceReview(token))
      .then((data) => {
        if (cancelled) return;
        setReview(data ?? null);
        if (data) {
          setRating(data.rating);
          setText(data.text);
        }
      })
      .catch(() => {
        if (!cancelled) setError(t('loadFailedTitle'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, authorizedRequest, t]);

  if (!isAuthenticated) {
    return (
      <Card className="flex flex-col gap-3">
        <h3 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
          {t('serviceReviewMyTitle')}
        </h3>
        <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('serviceReviewSignInPrompt')}
        </p>
        <Link to="/login" style={{ textDecoration: 'none' }}>
          <Button size="sm">{t('signIn')}</Button>
        </Link>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('loading')}
        </span>
      </Card>
    );
  }

  const submit = async () => {
    if (!text.trim()) {
      setError(t('serviceReviewTextLabel'));
      return;
    }
    setSubmitting(true);
    setError(null);
    setInfo(null);
    try {
      const payload = { rating, text: text.trim() };
      const data = review
        ? await authorizedRequest((token) => updateMyServiceReview(payload, token))
        : await authorizedRequest((token) => createServiceReview(payload, token));
      setReview(data);
      setEditing(false);
      setInfo(t('actionCompletedAndLogged'));
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError(t('serviceReviewExistsError'));
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('loadFailedTitle'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!review) return;
    if (typeof window !== 'undefined' && !window.confirm(t('serviceReviewDeleteConfirm'))) return;
    setSubmitting(true);
    try {
      await authorizedRequest((token) => deleteMyServiceReview(token));
      setReview(null);
      setText('');
      setRating(5);
      setEditing(false);
      setInfo(t('actionCompletedAndLogged'));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailedTitle'));
    } finally {
      setSubmitting(false);
    }
  };

  if (review && !editing) {
    return (
      <Card className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
            {t('serviceReviewMyTitle')}
          </h3>
          {review.featured && <Badge variant="success">{t('serviceReviewFeaturedBadge')}</Badge>}
        </div>
        <StarRating rating={review.rating} size={16} />
        <p
          className="text-[13px] whitespace-pre-wrap"
          style={{ color: 'var(--eco-text-secondary)' }}
        >
          {review.text}
        </p>
        {!review.featured && (
          <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {t('serviceReviewModerationNote')}
          </p>
        )}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
            {t('serviceReviewEdit')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void handleDelete()}
            loading={submitting}
          >
            {t('serviceReviewDelete')}
          </Button>
        </div>
        {info && (
          <p className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
            {info}
          </p>
        )}
      </Card>
    );
  }

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
        {t('serviceReviewMyTitle')}
      </h3>
      <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
        {review ? t('serviceReviewEdit') : t('serviceReviewLeavePrompt')}
      </p>
      <div className="flex items-center gap-3">
        <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
          {t('serviceReviewRatingLabel')}:
        </span>
        <StarRating rating={rating} interactive onChange={setRating} size={20} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
          {t('serviceReviewTextLabel')}
        </label>
        <textarea
          rows={4}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={tx(
            language,
            'Расскажите о вашем опыте...',
            'Тәжірибеңіз туралы айтыңыз...',
            'Tell us about your experience...',
          )}
          className="px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        />
      </div>
      <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {t('serviceReviewModerationNote')}
      </p>
      {error && (
        <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </p>
      )}
      {info && (
        <p className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
          {info}
        </p>
      )}
      <div className="flex gap-2">
        <Button variant="primary" loading={submitting} onClick={() => void submit()}>
          {review ? t('serviceReviewSave') : t('serviceReviewSubmit')}
        </Button>
        {review && (
          <Button
            variant="ghost"
            onClick={() => {
              setEditing(false);
              setText(review.text);
              setRating(review.rating);
            }}
          >
            {tx(language, 'Отмена', 'Бас тарту', 'Cancel')}
          </Button>
        )}
      </div>
    </Card>
  );
}
