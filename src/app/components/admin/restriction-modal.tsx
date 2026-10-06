import { useEffect, useState } from 'react';
import { Button, Modal } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { restrictAdminUserRequest, type AdminUserDto } from '../../lib/api';
import { AdminSegmented } from './admin-ui';

const localDateTime = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

export function RestrictionModal({
  userId,
  onClose,
  onSaved,
}: {
  userId: number | string | null;
  onClose: () => void;
  onSaved: (updated: AdminUserDto) => void;
}) {
  const { authorizedRequest } = useAuth();
  const { language, t } = useI18n();
  const [mode, setMode] = useState<'NOW' | 'SCHEDULED'>('NOW');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (userId == null) return;
    const now = new Date();
    setMode('NOW');
    setStartsAt(localDateTime(new Date(now.getTime() + 10 * 60 * 1000)));
    setEndsAt(localDateTime(new Date(now.getTime() + 24 * 60 * 60 * 1000)));
    setReason('');
    setError(null);
  }, [userId]);

  const startDate = mode === 'NOW' ? new Date() : new Date(startsAt);
  const endDate = new Date(endsAt);
  const valid =
    Boolean(reason.trim()) &&
    !Number.isNaN(startDate.getTime()) &&
    !Number.isNaN(endDate.getTime()) &&
    endDate > startDate &&
    (mode === 'NOW' || startDate > new Date());
  const setPreset = (days: number) => {
    const base = mode === 'NOW' ? new Date() : new Date(startsAt);
    if (Number.isNaN(base.getTime())) return;
    setEndsAt(localDateTime(new Date(base.getTime() + days * 24 * 60 * 60 * 1000)));
  };

  const submit = async () => {
    if (userId == null || !valid || saving) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await authorizedRequest((token) =>
        restrictAdminUserRequest(
          userId,
          {
            reason: reason.trim(),
            startsAt: startDate.toISOString(),
            endsAt: endDate.toISOString(),
          },
          token,
        ),
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : t('adminCouldNotSetRestriction'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={userId != null}
      onClose={() => {
        if (!saving) onClose();
      }}
      title={t('adminBlockUser')}
    >
      <div
        className="flex flex-col gap-4 text-[13px]"
        style={{ color: 'var(--eco-text-secondary)' }}
      >
        <AdminSegmented<'NOW' | 'SCHEDULED'>
          value={mode}
          onChange={setMode}
          options={[
            { value: 'NOW', label: t('adminImmediately') },
            { value: 'SCHEDULED', label: t('adminSchedule') },
          ]}
        />
        {mode === 'SCHEDULED' && (
          <label className="flex flex-col gap-1">
            {t('adminStart')}
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="eco-input rounded-lg px-3 py-2 outline-none"
            />
          </label>
        )}
        <label className="flex flex-col gap-1">
          {t('adminEnd')}
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="eco-input rounded-lg px-3 py-2 outline-none"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {[1, 7, 30].map((days) => (
            <Button key={days} variant="ghost" size="sm" onClick={() => setPreset(days)}>
              {t('adminDaysCount', { count: days })}
            </Button>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          {t('adminReasonForRestriction')}
          <textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="eco-input rounded-lg px-3 py-2 outline-none"
          />
        </label>
        {valid && (
          <div
            className="rounded-lg p-3"
            style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
          >
            {t('adminTheUserWillBeBlocked')}{' '}
            {t('adminFrom')}{' '}
            {formatDateTime(startDate.toISOString(), language)}{' '}
            {t('adminUntil')} {formatDateTime(endDate.toISOString(), language)}
          </div>
        )}
        {error && (
          <p role="alert" style={{ color: 'var(--eco-negative)' }}>
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-2">
          <Button variant="ghost" className="flex-1" disabled={saving} onClick={onClose}>
            {t('adminCancel')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!valid || saving}
            loading={saving}
            onClick={() => void submit()}
          >
            {t('adminConfirmRestriction')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
