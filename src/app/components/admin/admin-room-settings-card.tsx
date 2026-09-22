import { useEffect, useState } from 'react';
import { Button, Card, Input } from '../ds-primitives';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import {
  getAdminRoomSettingsRequest,
  updateAdminRoomSettingsRequest,
} from '../../lib/api';
import { formatAdminApiError } from './admin-action-ui';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

export function AdminRoomSettingsCard({
  onSuccess,
  onError,
}: {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { authorizedRequest } = useAuth();
  const { language, t } = useI18n();
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
      setError(tx(language, 'Укажите целое число не меньше 2.', 'Кемінде 2 болатын бүтін санды көрсетіңіз.', 'Enter a whole number of at least 2.'));
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
    <Card className="mb-6 flex flex-col gap-3 max-w-[520px]">
      <div>
        <h2 className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
          {tx(language, 'Минимальное количество мест в новых комнатах', 'Жаңа бөлмелердегі ең аз орын саны', 'Minimum seats in new rooms')}
        </h2>
        <p className="text-[12px] mt-1" style={{ color: 'var(--eco-text-tertiary)' }}>
          {tx(language, 'Настройка применяется только к новым комнатам. Уже созданные комнаты с меньшей вместимостью не изменяются.', 'Баптау тек жаңа бөлмелерге қолданылады. Сыйымдылығы аз жасалған бөлмелер өзгермейді.', 'This setting applies only to new rooms. Existing rooms with fewer seats are unchanged.')}
        </p>
      </div>
      <div className="flex flex-col sm:flex-row sm:items-end gap-2">
        <Input
          label={tx(language, 'Количество мест', 'Орын саны', 'Seat count')}
          type="number"
          min={2}
          step={1}
          value={value}
          disabled={loading || saving}
          onChange={(event) => setValue(event.target.value)}
          error={error ?? undefined}
        />
        <Button variant="primary" size="sm" disabled={loading} loading={saving} onClick={() => void save()}>
          {tx(language, 'Сохранить', 'Сақтау', 'Save')}
        </Button>
      </div>
    </Card>
  );
}
