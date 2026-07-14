import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Badge, Button, Card, EmptyState, Input, Select, Skeleton } from '../ds-primitives';
import { ArrowLeft, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../auth/auth-provider';
import { useI18n } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import {
  ApiError,
  createFeedbackRequest,
  getMyFeedbackRequest,
  type FeedbackDto,
  type FeedbackStatus,
  type FeedbackType,
} from '../../lib/api';

const MAX_MESSAGE_LENGTH = 2000;
const MAX_SUBJECT_LENGTH = 120;

const STATUS_VARIANT: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  NEW: 'info',
  IN_REVIEW: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'default',
};

function statusKey(status: FeedbackStatus): string {
  switch (status) {
    case 'NEW':
      return 'feedbackStatusNew';
    case 'IN_REVIEW':
      return 'feedbackStatusInReview';
    case 'RESOLVED':
      return 'feedbackStatusResolved';
    case 'DISMISSED':
      return 'feedbackStatusDismissed';
    default:
      return 'feedbackStatusNew';
  }
}

function typeKey(type: FeedbackType): string {
  switch (type) {
    case 'COMPLAINT':
      return 'feedbackTypeComplaint';
    case 'IDEA':
      return 'feedbackTypeIdea';
    case 'REQUEST':
      return 'feedbackTypeRequest';
    default:
      return 'feedbackTypeRequest';
  }
}

export function FeedbackPage() {
  const { t, language } = useI18n();
  const { isAuthenticated, isReady, authorizedRequest } = useAuth();
  const navigate = useNavigate();

  const [type, setType] = useState<FeedbackType>('COMPLAINT');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cooldown after the backend returns 429. We keep the absolute deadline
  // and a tick counter so the countdown updates every second without
  // recreating the timer.
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const cooldownLeftSec = cooldownUntil ? Math.max(0, Math.ceil((cooldownUntil - now) / 1000)) : 0;
  const isCoolingDown = cooldownLeftSec > 0;

  useEffect(() => {
    if (!cooldownUntil) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [cooldownUntil]);

  useEffect(() => {
    if (cooldownUntil && Date.now() >= cooldownUntil) {
      setCooldownUntil(null);
    }
  }, [cooldownUntil, now]);

  const [list, setList] = useState<FeedbackDto[] | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login?redirect=/feedback', { replace: true });
    }
  }, [isReady, isAuthenticated, navigate]);

  const loadList = useCallback(async () => {
    if (!isAuthenticated) return;
    setListLoading(true);
    setListError(null);
    try {
      const data = await authorizedRequest((token) =>
        getMyFeedbackRequest(token, { page: 0, size: 25 }),
      );
      setList(data.items);
    } catch (err) {
      setListError(err instanceof ApiError ? err.message : t('feedbackSubmitFailed'));
    } finally {
      setListLoading(false);
    }
  }, [authorizedRequest, isAuthenticated, t]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  const RATE_LIMIT_COOLDOWN_SEC = 60;

  const submit = async () => {
    setError(null);
    if (isCoolingDown) {
      setError(t('feedbackRateLimitedRetryIn', { seconds: cooldownLeftSec }));
      return;
    }
    const trimmed = message.trim();
    if (!trimmed) {
      setError(t('feedbackMessageEmpty'));
      return;
    }
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      setError(t('feedbackMessageTooLong'));
      return;
    }
    setSubmitting(true);
    try {
      await authorizedRequest((token) =>
        createFeedbackRequest(
          {
            type,
            subject: subject.trim() ? subject.trim() : null,
            message: trimmed,
          },
          token,
        ),
      );
      toast.success(t('feedbackSubmitted'));
      setSubject('');
      setMessage('');
      // Reload the list so the user immediately sees their submission.
      void loadList();
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        // Backend already rate-limits us. Block the submit button for a
        // short cooldown so a frustrated user can't hammer the form and
        // make the situation worse.
        setCooldownUntil(Date.now() + RATE_LIMIT_COOLDOWN_SEC * 1000);
        setError(t('feedbackRateLimited'));
      } else if (err instanceof ApiError) {
        setError(err.message || t('feedbackSubmitFailed'));
      } else {
        setError(t('feedbackSubmitFailed'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!isReady || !isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <Card>
          <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {t('loading')}
          </span>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/support"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {t('support')}
      </Link>

      <div className="flex items-start gap-3 mb-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'var(--eco-brand-50)' }}
        >
          <MessageSquare size={18} style={{ color: 'var(--eco-primary)' }} />
        </div>
        <div>
          <h1 className="text-[22px] sm:text-[26px]" style={{ color: 'var(--eco-text)' }}>
            {t('feedbackTitle')}
          </h1>
          <p className="text-[13px] mt-1" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('feedbackIntro')}
          </p>
        </div>
      </div>

      <Card className="flex flex-col gap-4 mt-6">
        <Select
          label={t('feedbackTypeLabel')}
          value={type}
          onChange={(e) => setType(e.target.value as FeedbackType)}
          options={[
            { value: 'COMPLAINT', label: t('feedbackTypeComplaint') },
            { value: 'IDEA', label: t('feedbackTypeIdea') },
            { value: 'REQUEST', label: t('feedbackTypeRequest') },
          ]}
        />

        <Input
          label={t('feedbackSubjectLabel')}
          value={subject}
          onChange={(e) => setSubject(e.target.value.slice(0, MAX_SUBJECT_LENGTH))}
          placeholder={t('feedbackSubjectPlaceholder')}
        />

        <div className="flex flex-col gap-1">
          <label className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
            {t('feedbackMessageLabel')}
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            rows={6}
            maxLength={MAX_MESSAGE_LENGTH}
            placeholder={t('feedbackMessagePlaceholder')}
            className="w-full px-3 py-2 rounded-lg text-[14px] outline-none"
            style={{
              background: 'var(--eco-surface)',
              color: 'var(--eco-text)',
              border: '1px solid var(--eco-border)',
              resize: 'vertical',
            }}
          />
          <div
            className="flex items-center justify-between text-[11px]"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            <span>
              {t('feedbackCharCount', { count: message.length, max: MAX_MESSAGE_LENGTH })}
            </span>
          </div>
        </div>

        {error && (
          <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <Button
            variant="primary"
            onClick={() => void submit()}
            loading={submitting}
            disabled={submitting || isCoolingDown}
          >
            <Send size={14} />
            {isCoolingDown
              ? t('feedbackRetryInLabel', { seconds: cooldownLeftSec })
              : t('feedbackSubmit')}
          </Button>
          {isCoolingDown && (
            <span className="text-[11px]" style={{ color: 'var(--eco-warning-500)' }}>
              {t('feedbackRateLimitedRetryIn', { seconds: cooldownLeftSec })}
            </span>
          )}
        </div>
      </Card>

      <h2 className="text-[16px] mt-8 mb-3" style={{ color: 'var(--eco-text)' }}>
        {t('feedbackMyList')}
      </h2>
      {listLoading && !list ? (
        <div className="flex flex-col gap-2">
          <Skeleton height={72} />
          <Skeleton height={72} />
          <Skeleton height={72} />
        </div>
      ) : listError ? (
        <Card>
          <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
            {listError}
          </span>
        </Card>
      ) : !list || list.length === 0 ? (
        <EmptyState title={t('feedbackMyListEmpty')} description="" />
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((item) => (
            <Card key={item.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2 justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="info">{t(typeKey(item.type))}</Badge>
                  <Badge variant={STATUS_VARIANT[item.status] ?? 'default'}>
                    {t(statusKey(item.status))}
                  </Badge>
                  {item.subject && (
                    <span className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                      {item.subject}
                    </span>
                  )}
                </div>
                <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {formatDateTime(item.createdAt, language)}
                </span>
              </div>
              <p
                className="text-[13px] whitespace-pre-wrap break-words"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {item.message}
              </p>
              {item.adminNote && (
                <div
                  className="text-[12px] p-2 rounded-lg whitespace-pre-wrap break-words"
                  style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-text-secondary)' }}
                >
                  {item.adminNote}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
