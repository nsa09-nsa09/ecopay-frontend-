import { useEffect, useState } from 'react';
import { Button, Modal } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { restrictAdminUserRequest, type AdminUserDto } from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;
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
  const { language } = useI18n();
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
          : tx(
              language,
              'Не удалось установить блокировку.',
              'Бұғаттауды орнату мүмкін болмады.',
              'Could not set restriction.',
            ),
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
      title={tx(language, 'Заблокировать пользователя', 'Пайдаланушыны бұғаттау', 'Block user')}
    >
      <div
        className="flex flex-col gap-4 text-[13px]"
        style={{ color: 'var(--eco-text-secondary)' }}
      >
        <div className="flex gap-2">
          <Button
            variant={mode === 'NOW' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('NOW')}
          >
            {tx(language, 'Сразу', 'Бірден', 'Immediately')}
          </Button>
          <Button
            variant={mode === 'SCHEDULED' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setMode('SCHEDULED')}
          >
            {tx(language, 'Запланировать', 'Жоспарлау', 'Schedule')}
          </Button>
        </div>
        {mode === 'SCHEDULED' && (
          <label className="flex flex-col gap-1">
            {tx(language, 'Начало', 'Басталуы', 'Start')}
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) => setStartsAt(event.target.value)}
              className="rounded-lg p-2"
              style={{
                background: 'var(--eco-surface)',
                color: 'var(--eco-text)',
                border: '1px solid var(--eco-border)',
              }}
            />
          </label>
        )}
        <label className="flex flex-col gap-1">
          {tx(language, 'Окончание', 'Аяқталуы', 'End')}
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="rounded-lg p-2"
            style={{
              background: 'var(--eco-surface)',
              color: 'var(--eco-text)',
              border: '1px solid var(--eco-border)',
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          {[1, 7, 30].map((days) => (
            <Button key={days} variant="ghost" size="sm" onClick={() => setPreset(days)}>
              {days}{' '}
              {tx(language, days === 1 ? 'день' : 'дней', 'күн', days === 1 ? 'day' : 'days')}
            </Button>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          {tx(language, 'Причина блокировки', 'Бұғаттау себебі', 'Reason for restriction')}
          <textarea
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="rounded-lg p-2"
            style={{
              background: 'var(--eco-surface)',
              color: 'var(--eco-text)',
              border: '1px solid var(--eco-border)',
            }}
          />
        </label>
        {valid && (
          <div
            className="rounded-lg p-3"
            style={{ background: 'var(--eco-surface)', color: 'var(--eco-text)' }}
          >
            {tx(
              language,
              'Пользователь будет заблокирован',
              'Пайдаланушы бұғатталады',
              'The user will be blocked',
            )}{' '}
            {tx(language, 'с', 'бастап', 'from')}{' '}
            {formatDateTime(startDate.toISOString(), language)}{' '}
            {tx(language, 'до', 'дейін', 'until')} {formatDateTime(endDate.toISOString(), language)}
          </div>
        )}
        {error && <p style={{ color: 'var(--eco-negative)' }}>{error}</p>}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" disabled={saving} onClick={onClose}>
            {tx(language, 'Отмена', 'Бас тарту', 'Cancel')}
          </Button>
          <Button
            variant="destructive"
            className="flex-1"
            disabled={!valid || saving}
            loading={saving}
            onClick={() => void submit()}
          >
            {tx(language, 'Подтвердить блокировку', 'Бұғаттауды растау', 'Confirm restriction')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
