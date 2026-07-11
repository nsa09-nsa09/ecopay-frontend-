import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Button, Modal } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { ApiError } from '../../lib/api';

export const REASON_MIN_LENGTH = 10;

/**
 * Map a thrown error from an admin API call to a short, user-friendly message.
 * Routes everything through ApiError.code (see lib/api.ts) so we never render
 * raw Spring exception strings ("NoResourceFoundException: ...") or other
 * server internals to staff users.
 */
export function formatAdminApiError(
  err: unknown,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  if (err instanceof ApiError) {
    switch (err.code) {
      case 'sessionExpired':
        return t('sessionExpiredError');
      case 'noAccess':
        return t('noStaffAccessError');
      case 'notAvailable':
        return t('errSectionUnavailable');
      case 'serverError':
        return t('serverErrorTitle');
      case 'network':
        return t('networkError');
      case 'generic':
      default:
        return t('loadFailedTitle');
    }
  }
  return t('loadFailedTitle');
}

interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  subjectLabel?: ReactNode;
  destructive?: boolean;
  submitLabel: string;
  submitting?: boolean;
  errorMessage?: string | null;
  onConfirm: (reason: string) => void | Promise<void>;
  minReasonLength?: number;
}

/**
 * Shared destructive-action confirmation modal used by ban/unban, block,
 * moderation reject, dispute decision flows. Enforces a minimum reason
 * length and surfaces server errors inline.
 */
export function ConfirmActionModal({
  open,
  onClose,
  title,
  description,
  subjectLabel,
  destructive = false,
  submitLabel,
  submitting = false,
  errorMessage,
  onConfirm,
  minReasonLength = REASON_MIN_LENGTH,
}: ConfirmActionModalProps) {
  const { t } = useI18n();
  const [reason, setReason] = useState('');

  // Reset on close so a stale value never leaks into the next destructive flow.
  useEffect(() => {
    if (!open) setReason('');
  }, [open]);

  const trimmed = reason.trim();
  const tooShort = trimmed.length < minReasonLength;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-4">
        {description && (
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {description}
          </div>
        )}
        {subjectLabel && (
          <div
            className="p-3 rounded-lg text-[12px]"
            style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
          >
            {subjectLabel}
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
            {t('reason')} <span style={{ color: 'var(--eco-negative)' }}>*</span>
          </label>
          <textarea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t('mandatoryAuditLogged')}
            className="px-3 py-2 rounded-lg outline-none resize-none text-[13px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
            }}
          />
          <span
            className="text-[11px]"
            style={{ color: tooShort ? 'var(--eco-text-tertiary)' : 'var(--eco-positive)' }}
          >
            {t('reasonMinLength', { n: minReasonLength })}
          </span>
        </div>
        {errorMessage && (
          <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
            {errorMessage}
          </div>
        )}
        <div
          className="text-[11px] flex items-center gap-1"
          style={{ color: 'var(--eco-text-tertiary)' }}
        >
          <Shield size={11} /> {t('auditLoggedShort')}
        </div>
        <Button
          variant={destructive ? 'destructive' : 'primary'}
          disabled={tooShort}
          loading={submitting}
          onClick={() => void onConfirm(trimmed)}
        >
          {submitLabel}
        </Button>
      </div>
    </Modal>
  );
}

/**
 * Tiny flash banner — a short-lived success/error notification displayed at
 * the top of an admin page. Avoids pulling in a full toast framework while
 * still giving destructive actions a visible "Action completed and logged."
 * confirmation.
 */
export type FlashKind = 'success' | 'error';

export interface FlashState {
  kind: FlashKind;
  message: string;
}

export function useFlash(timeoutMs = 3500) {
  const [flash, setFlash] = useState<FlashState | null>(null);

  useEffect(() => {
    if (!flash) return;
    const id = window.setTimeout(() => setFlash(null), timeoutMs);
    return () => window.clearTimeout(id);
  }, [flash, timeoutMs]);

  const show = useCallback((kind: FlashKind, message: string) => {
    setFlash({ kind, message });
  }, []);

  const clear = useCallback(() => setFlash(null), []);

  return { flash, show, clear };
}

export function FlashBanner({
  flash,
  onClose,
}: {
  flash: FlashState | null;
  onClose?: () => void;
}) {
  if (!flash) return null;
  const isSuccess = flash.kind === 'success';
  return (
    <div
      role="status"
      className="flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-[13px]"
      style={{
        background: isSuccess ? 'var(--eco-success-100)' : 'var(--eco-danger-100)',
        color: isSuccess ? 'var(--eco-success-500)' : 'var(--eco-danger-500)',
      }}
      onClick={onClose}
    >
      {isSuccess ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      <span>{flash.message}</span>
    </div>
  );
}
