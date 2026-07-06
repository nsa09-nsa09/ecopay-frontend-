import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Mail, Save, Settings, Smartphone } from 'lucide-react';
import { Card, Button, EmptyState, SkeletonCard } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import {
  ApiError,
  getNotificationPreferencesRequest,
  updateNotificationPreferencesRequest,
  type NotificationPreferenceDto,
  type NotificationCategory,
} from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const CATEGORY_ORDER: NotificationCategory[] = [
  'MEMBERSHIP',
  'ROOM',
  'PAYMENTS',
  'DISPUTES',
  'SUPPORT',
  'ACCOUNT',
];

function categoryLabel(category: string, language: Language): string {
  switch (category) {
    case 'MEMBERSHIP':
      return tx(language, 'Участие в комнатах', 'Бөлмелерге қатысу', 'Membership');
    case 'ROOM':
      return tx(language, 'Статус комнаты', 'Бөлме күйі', 'Room status');
    case 'PAYMENTS':
      return tx(language, 'Платежи и выплаты', 'Төлемдер мен аударымдар', 'Payments & payouts');
    case 'DISPUTES':
      return tx(language, 'Споры', 'Даулар', 'Disputes');
    case 'SUPPORT':
      return tx(language, 'Поддержка', 'Қолдау', 'Support');
    case 'ACCOUNT':
      return tx(language, 'Аккаунт', 'Аккаунт', 'Account');
    default:
      return category;
  }
}

function typeLabel(type: string, language: Language): string {
  switch (type) {
    case 'MEMBER_JOINED':
      return tx(
        language,
        'Новая заявка в вашу комнату',
        'Бөлмеңізге жаңа өтінім',
        'New applicant to your room',
      );
    case 'OWNER_ACCESS_GRANTED':
      return tx(
        language,
        'Владелец предоставил доступ',
        'Иесі қатынас берді',
        'Owner granted access',
      );
    case 'MEMBER_CONFIRMED':
      return tx(
        language,
        'Участник подтвердил доступ',
        'Қатысушы қатынасты растады',
        'Member confirmed access',
      );
    case 'MEMBERSHIP_ACTIVATED':
      return tx(language, 'Участие активировано', 'Қатысу белсендірілді', 'Membership activated');
    case 'MEMBERSHIP_REJECTED':
      return tx(language, 'Участие отклонено', 'Қатысу қабылданбады', 'Membership rejected');
    case 'CONFIRMATION_DEADLINE_WARNING':
      return tx(
        language,
        'Напоминание о подтверждении',
        'Растау туралы еске салу',
        'Confirmation reminder',
      );
    case 'ROOM_ACTIVE':
      return tx(language, 'Комната активирована', 'Бөлме белсендірілді', 'Room activated');
    case 'ROOM_COMPLETED':
      return tx(language, 'Комната завершена', 'Бөлме аяқталды', 'Room completed');
    case 'ROOM_BLOCKED':
      return tx(language, 'Комната заблокирована', 'Бөлме бұғатталды', 'Room blocked');
    case 'ROOM_CANCELLED':
      return tx(language, 'Комната отменена', 'Бөлме болдырылмады', 'Room cancelled');
    case 'PAYMENT_SUCCESS':
      return tx(language, 'Платёж принят', 'Төлем қабылданды', 'Payment succeeded');
    case 'PAYMENT_FAILED':
      return tx(language, 'Платёж не прошёл', 'Төлем өтпеді', 'Payment failed');
    case 'REFUND_ISSUED':
      return tx(language, 'Возврат средств', 'Қаражатты қайтару', 'Refund issued');
    case 'PAYOUT_SENT':
      return tx(language, 'Выплата отправлена', 'Аударым жіберілді', 'Payout sent');
    case 'DISPUTE_OPENED':
      return tx(language, 'Спор открыт', 'Дау ашылды', 'Dispute opened');
    case 'DISPUTE_RESOLVED':
      return tx(language, 'Спор решён', 'Дау шешілді', 'Dispute resolved');
    case 'TICKET_REPLY':
      return tx(language, 'Ответ поддержки', 'Қолдау жауабы', 'Support reply');
    case 'ACCOUNT_BANNED':
      return tx(language, 'Аккаунт заблокирован', 'Аккаунт бұғатталды', 'Account banned');
    case 'ACCOUNT_UNBANNED':
      return tx(
        language,
        'Аккаунт разблокирован',
        'Аккаунт бұғаттан шығарылды',
        'Account unbanned',
      );
    default:
      return type;
  }
}

function Toggle({
  on,
  disabled,
  onClick,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className="relative w-10 h-6 rounded-full transition-colors shrink-0"
      style={{
        background: on && !disabled ? 'var(--eco-primary)' : 'var(--eco-border)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span
        className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
        style={{ background: '#fff', left: on ? '18px' : '2px' }}
      />
    </button>
  );
}

export function NotificationPreferencesPage() {
  const { language } = useI18n();
  const { authorizedRequest } = useAuth();

  const [prefs, setPrefs] = useState<NotificationPreferenceDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const data = await authorizedRequest((token) => getNotificationPreferencesRequest(token));
        if (!cancelled) setPrefs(data);
      } catch {
        /* leave empty — empty-state renders */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authorizedRequest]);

  const grouped = useMemo(() => {
    const map = new Map<string, NotificationPreferenceDto[]>();
    for (const p of prefs) {
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [prefs]);

  const setChannel = (type: string, channel: 'inApp' | 'email', value: boolean) => {
    setPrefs((prev) => prev.map((p) => (p.type === type ? { ...p, [channel]: value } : p)));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload = prefs.map((p) => ({ type: String(p.type), inApp: p.inApp, email: p.email }));
      const updated = await authorizedRequest((token) =>
        updateNotificationPreferencesRequest(payload, token),
      );
      setPrefs(updated);
      setDirty(false);
      toast.success(
        tx(language, 'Настройки сохранены', 'Параметрлер сақталды', 'Preferences saved'),
      );
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : tx(language, 'Не удалось сохранить', 'Сақтау мүмкін болмады', 'Could not save'),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center gap-2 mb-2">
        <Settings size={20} style={{ color: 'var(--eco-primary)' }} />
        <h1 className="text-[20px] font-semibold" style={{ color: 'var(--eco-text)' }}>
          {tx(language, 'Настройки уведомлений', 'Хабарлама параметрлері', 'Notification settings')}
        </h1>
      </div>
      <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
        {tx(
          language,
          'Выберите, какие уведомления получать в приложении и на email.',
          'Қолданбада және email арқылы қандай хабарламалар алатыныңызды таңдаңыз.',
          'Choose which notifications you get in-app and by email.',
        )}
      </p>

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      ) : prefs.length === 0 ? (
        <Card>
          <EmptyState
            title={tx(language, 'Недоступно', 'Қолжетімсіз', 'Unavailable')}
            description={tx(
              language,
              'Не удалось загрузить настройки. Попробуйте обновить страницу.',
              'Параметрлерді жүктеу мүмкін болмады. Бетті жаңартып көріңіз.',
              'Could not load settings. Try refreshing the page.',
            )}
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-4">
            {grouped.map(([category, items]) => (
              <Card key={category}>
                <div className="text-[14px] font-medium mb-1" style={{ color: 'var(--eco-text)' }}>
                  {categoryLabel(category, language)}
                </div>
                <div className="hidden sm:flex items-center justify-end gap-6 pb-2 pr-1">
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    <Smartphone size={12} /> {tx(language, 'В приложении', 'Қолданбада', 'In-app')}
                  </span>
                  <span
                    className="flex items-center gap-1 text-[11px]"
                    style={{ color: 'var(--eco-text-tertiary)' }}
                  >
                    <Mail size={12} /> Email
                  </span>
                </div>
                <div
                  className="flex flex-col divide-y"
                  style={{ borderColor: 'var(--eco-border)' }}
                >
                  {items.map((p) => (
                    <div
                      key={String(p.type)}
                      className="flex items-center justify-between gap-4 py-3"
                    >
                      <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                        {typeLabel(String(p.type), language)}
                      </span>
                      <div className="flex items-center gap-6 shrink-0">
                        <Toggle
                          on={p.inApp}
                          onClick={() => setChannel(String(p.type), 'inApp', !p.inApp)}
                        />
                        <Toggle
                          on={p.email}
                          disabled={!p.emailEligible}
                          onClick={() => setChannel(String(p.type), 'email', !p.email)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <div className="sticky bottom-4 mt-6 flex justify-end">
            <Button
              variant="primary"
              onClick={() => void save()}
              loading={saving}
              disabled={!dirty || saving}
            >
              <Save size={15} />
              {tx(language, 'Сохранить', 'Сақтау', 'Save')}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
