import { useEffect, useState } from 'react';
import { Button, Input } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n } from '../i18n-provider';
import {
  getAdminRoomSettingsRequest,
  updateAdminRoomSettingsRequest,
} from '../../lib/api';
import { formatAdminApiError } from './admin-action-ui';
import { AdminCard } from './admin-ui';

export function AdminRoomSettingsCard({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { authorizedRequest } = useAuth();
  const { t } = useI18n();
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    authorizedRequest((token) => getAdminRoomSettingsRequest(token))
      .then((settings) => {
        if (!cancelled) setValue(String(settings.minimumRoomMembers));
      })
      .catch((err) => {
        if (!cancelled) {
          const message = formatAdminApiError(err, t);
          setError(message);
          onError(message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest, t]);

  const save = async () => {
    const minimumRoomMembers = Number(value);
    if (!Number.isInteger(minimumRoomMembers) || minimumRoomMembers < 2) {
      setError(t('adminRoomSettingsMinError'));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const updated = await authorizedRequest((token) =>
        updateAdminRoomSettingsRequest({ minimumRoomMembers }, token),
      );
      setValue(String(updated.minimumRoomMembers));
      onSuccess(t('actionCompletedAndLogged'));
    } catch (err) {
      const message = formatAdminApiError(err, t);
      setError(message);
      onError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminCard
      className="max-w-[560px]"
      title={t('adminRoomSettingsTitle')}
      description={t('adminRoomSettingsHint')}
    >
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <Input
          label={t('adminRoomSettingsSeatCount')}
          type="number"
          min={2}
          step={1}
          value={value}
          disabled={loading || saving}
          onChange={(event) => setValue(event.target.value)}
          error={error ?? undefined}
        />
        <Button variant="primary" size="sm" disabled={loading} loading={saving} onClick={() => void save()}>
          {t('save')}
        </Button>
      </div>
    </AdminCard>
  );
}
