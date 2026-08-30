import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, Badge, Button, Input, Modal, Skeleton } from '../ds-primitives';
import {
  UserRound,
  Mail,
  Star,
  Phone,
  CheckCircle2,
  Copy,
  Trash2,
  Upload,
  Search as SearchIcon,
  Home,
  CheckCheck,
  Wallet,
  PiggyBank,
  CalendarClock,
  MessageSquare,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatDate, formatDateTime } from '../../lib/datetime';
import {
  ApiError,
  checkSlugAvailable,
  confirmEmailChangeRequest,
  deleteMyAccount,
  deleteMyAvatar,
  getMyDashboardRequest,
  requestEmailChangeRequest,
  requestPhoneCodeRequest,
  resendVerificationEmailRequest,
  uploadMyAvatar,
  verifyPhoneRequest,
  type MemberDashboardDto,
} from '../../lib/api';
import { serverEmailErrorCode } from '../../lib/email-validation';
import { localizeFieldErrors } from '../../lib/field-errors';
import { useEmailField, useResendCountdown } from '../auth/use-email-field';
import {
  EmailFieldStatusHint,
  EmailSuggestion,
  emailFormatErrorText,
  serverEmailErrorText,
} from '../auth/email-field-messages';
import { MyServiceReviewCard } from './my-service-review';
import { ReputationLevelBadge } from '../reputation/level-badge';
import { reputationOutOfTen } from '../../lib/reputation';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

function profileRoleLabel(role: string | null | undefined, language: Language): string {
  switch ((role ?? '').toUpperCase()) {
    case 'USER':
      return tx(language, 'Пользователь', 'Пайдаланушы', 'User');
    case 'SUPPORT':
      return tx(language, 'Поддержка', 'Қолдау', 'Support');
    case 'ADMIN':
      return tx(language, 'Администратор', 'Әкімші', 'Admin');
    default:
      return tx(language, 'Пользователь', 'Пайдаланушы', 'User');
  }
}

function profileStatusLabel(status: string | null | undefined, language: Language): string {
  switch ((status ?? '').toUpperCase()) {
    case 'ACTIVE':
      return tx(language, 'Активен', 'Белсенді', 'Active');
    case 'PENDING':
      return tx(language, 'На проверке', 'Тексеруде', 'Pending');
    case 'BLOCKED':
    case 'BANNED':
      return tx(language, 'Заблокирован', 'Бұғатталған', 'Blocked');
    case 'DELETED':
      return tx(language, 'Удалён', 'Жойылған', 'Deleted');
    default:
      return tx(language, 'Статус уточняется', 'Мәртебесі анықталуда', 'Status pending');
  }
}

export function ProfilePage() {
  const { user, isAuthenticated, isReady, updateProfile, authorizedRequest, logout } = useAuth();
  const { language, t } = useI18n();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugStatus, setSlugStatus] = useState<
    | { state: 'idle' }
    | { state: 'checking' }
    | { state: 'ok'; normalized: string }
    | { state: 'taken' }
    | { state: 'invalid'; reason?: string }
  >({ state: 'idle' });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(user?.displayName ?? '');
    setSlug(user?.slug ?? '');
    setSlugStatus({ state: 'idle' });
  }, [user]);

  const originalSlug = user?.slug ?? '';
  const trimmedSlug = slug.trim().toLowerCase();
  const slugChanged = trimmedSlug !== originalSlug;
  const slugFormatValid = trimmedSlug === '' || /^[a-z0-9-]{3,30}$/.test(trimmedSlug);

  useEffect(() => {
    if (!slugChanged) {
      setSlugStatus({ state: 'idle' });
      return;
    }
    if (trimmedSlug === '') {
      setSlugStatus({ state: 'idle' });
      return;
    }
    if (!slugFormatValid) {
      setSlugStatus({ state: 'invalid' });
      return;
    }
    let cancelled = false;
    setSlugStatus({ state: 'checking' });
    const handle = window.setTimeout(() => {
      authorizedRequest((token) => checkSlugAvailable(trimmedSlug, token))
        .then((res) => {
          if (cancelled) return;
          if (res.available) {
            setSlugStatus({ state: 'ok', normalized: res.normalized });
          } else if (res.reason === 'reserved' || res.reason === 'invalid') {
            setSlugStatus({ state: 'invalid', reason: res.reason });
          } else {
            setSlugStatus({ state: 'taken' });
          }
        })
        .catch(() => {
          if (cancelled) return;
          setSlugStatus({ state: 'idle' });
        });
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [trimmedSlug, slugChanged, slugFormatValid, authorizedRequest]);

  if (!isReady) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card>
          {tx(language, 'Загрузка профиля...', 'Профиль жүктелуде...', 'Loading profile...')}
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col gap-4 items-start">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Профиль', 'Профиль', 'Profile')}
          </h1>
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Войдите, чтобы управлять аккаунтом EcoPay.',
              'EcoPay тіркелгісін басқару үшін кіріңіз.',
              'Sign in to manage your EcoPay account.',
            )}
          </p>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <Button>{tx(language, 'Войти', 'Кіру', 'Sign in')}</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const initials = user.displayName
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setSaving(true);

    try {
      const payload: { displayName: string; slug?: string } = { displayName };
      if (slugChanged && (slugStatus.state === 'ok' || trimmedSlug === '')) {
        payload.slug = trimmedSlug;
      }
      await updateProfile(payload);
      setMessage(tx(language, 'Профиль обновлён.', 'Профиль жаңартылды.', 'Profile updated.'));
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(localizeFieldErrors(err.errors, language));
      } else {
        setError(
          tx(
            language,
            'Не удалось обновить профиль.',
            'Профильді жаңарту мүмкін болмады.',
            'Unable to update the profile right now.',
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-[22px] sm:text-[24px] mb-6" style={{ color: 'var(--eco-text)' }}>
        {tx(language, 'Профиль', 'Профиль', 'Profile')}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col items-center text-center gap-4">
            <AvatarUploader />
            <div>
              <div className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
                {user.displayName}
              </div>
              <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {user.email ?? user.phone}
              </div>
            </div>
            <div className="flex items-center gap-1" style={{ color: 'var(--eco-warning)' }}>
              <Star size={16} fill="currentColor" />
              <span className="text-[16px]">
                {reputationOutOfTen(user.reputation).toFixed(1)}/10
              </span>
              <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {tx(language, 'рейтинг доверия', 'сенім рейтингі', 'trust rating')}
              </span>
            </div>
            <ReputationLevelBadge level={user.reputationLevel} score={user.reputation ?? 0} />
            {(user.slug || user.publicId) && (
              <Link
                to={`/u/${user.slug ?? user.publicId}`}
                className="text-[12px]"
                style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
              >
                {t('viewMyPublicProfile')}
              </Link>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <h3
              className="flex items-center gap-2 text-[16px]"
              style={{ color: 'var(--eco-text)' }}
            >
              <Wallet size={16} />
              {tx(language, 'Выплаты владельцу', 'Иеге төлемдер', 'Owner payouts')}
            </h3>
            <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(
                language,
                'Просматривайте деньги, которые EcoPay временно удерживает до выплаты владельцу, и управляйте выплатами.',
                'EcoPay иесіне аударғанға дейін уақытша ұстайтын ақшаны көріп, аударымдарды басқарыңыз.',
                'View money EcoPay temporarily holds until owner payout and manage your payouts.',
              )}
            </p>
            <Link to="/payment/payout" style={{ textDecoration: 'none' }}>
              <Button variant="ghost" size="sm" className="self-start">
                {tx(language, 'Открыть выплаты', 'Төлемдерді ашу', 'Open payouts')}
              </Button>
            </Link>
            <Link to="/payments/history" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="sm" className="self-start">
                {tx(language, 'История платежей', 'Төлем тарихы', 'Payment history')}
              </Button>
            </Link>
          </Card>

          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(language, 'Роль', 'Рөл', 'Role')}
              </span>
              <Badge>{profileRoleLabel(user.role, language)}</Badge>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(language, 'Статус', 'Мәртебесі', 'Status')}
              </span>
              <Badge variant={user.status === 'ACTIVE' ? 'success' : 'default'}>
                {profileStatusLabel(user.status, language)}
              </Badge>
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <h3 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Данные аккаунта', 'Тіркелгі деректері', 'Account Details')}
              </h3>
              <Input
                label={tx(language, 'Отображаемое имя', 'Көрсетілетін ат', 'Display name')}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                error={fieldErrors.displayName}
              />
              <div className="flex flex-col gap-1.5">
                <Input
                  label={t('slugLabel')}
                  value={slug}
                  onChange={(event) => setSlug(event.target.value)}
                  placeholder="my-handle"
                  error={fieldErrors.slug}
                />
                <div
                  className="text-[12px]"
                  style={{ color: 'var(--eco-text-tertiary)', fontFamily: 'monospace' }}
                >
                  {typeof window !== 'undefined' ? window.location.origin : ''}/u/
                  {trimmedSlug || (user.slug ?? user.publicId ?? '')}
                </div>
                {slugChanged && slugStatus.state === 'checking' && (
                  <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    …
                  </span>
                )}
                {slugChanged && slugStatus.state === 'ok' && (
                  <span className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
                    {t('slugAvailable')}
                  </span>
                )}
                {slugChanged && slugStatus.state === 'taken' && (
                  <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                    {t('slugTaken')}
                  </span>
                )}
                {slugChanged && slugStatus.state === 'invalid' && (
                  <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                    {slugStatus.reason === 'reserved' ? t('slugReserved') : t('slugInvalid')}
                  </span>
                )}
                <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('slugHint')}
                </span>
              </div>
              {error && (
                <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                  {error}
                </p>
              )}
              {message && (
                <p className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
                  {message}
                </p>
              )}
              <Button
                type="submit"
                loading={saving}
                disabled={
                  saving ||
                  (slugChanged &&
                    trimmedSlug !== '' &&
                    (slugStatus.state === 'taken' ||
                      slugStatus.state === 'invalid' ||
                      slugStatus.state === 'checking'))
                }
              >
                {tx(language, 'Сохранить изменения', 'Өзгерістерді сақтау', 'Save changes')}
              </Button>
            </form>
          </Card>

          <PhoneVerificationCard />

          <EmailCard />

          {(user.slug || user.publicId) && (
            <PublicLinkCard slug={user.slug ?? null} publicId={user.publicId ?? null} />
          )}

          <FindUserCard />

          <MemberDashboardCard />

          <MyServiceReviewCard />

          <Card className="flex flex-col gap-3">
            <h3
              className="flex items-center gap-2 text-[16px]"
              style={{ color: 'var(--eco-text)' }}
            >
              <Trash2 size={16} /> {t('deleteAccount')}
            </h3>
            <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {t('deleteAccountWarning')}
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="self-start"
              onClick={() => setDeleteOpen(true)}
            >
              {t('deleteAccount')}
            </Button>
          </Card>

          <Modal
            open={deleteOpen}
            onClose={() => setDeleteOpen(false)}
            title={t('deleteAccountTitle')}
          >
            <div className="flex flex-col gap-4">
              <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('deleteAccountWarning')}
              </p>
              {deleteError && (
                <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                  {deleteError}
                </p>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setDeleteOpen(false)}>
                  {tx(language, 'Отмена', 'Бас тарту', 'Cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  loading={deleting}
                  onClick={async () => {
                    setDeleting(true);
                    setDeleteError(null);
                    try {
                      await authorizedRequest((token) => deleteMyAccount(token));
                      try {
                        await logout();
                      } catch {
                        /* ignore */
                      }
                      navigate('/', { replace: true });
                    } catch (err) {
                      setDeleteError(
                        err instanceof ApiError && err.status === 409
                          ? tx(
                              language,
                              'Сначала завершите активные финансовые операции.',
                              'Алдымен белсенді қаржылық операцияларды аяқтаңыз.',
                              'Complete active financial operations first.',
                            )
                          : err instanceof ApiError
                            ? err.message
                            : t('deleteAccountFailed'),
                      );
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {t('deleteAccountConfirm')}
                </Button>
              </div>
            </div>
          </Modal>

          <Card className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg p-4" style={{ background: 'var(--eco-surface)' }}>
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <UserRound size={14} />{' '}
                {tx(language, 'Отображаемое имя', 'Көрсетілетін ат', 'Display name')}
              </div>
              <div className="mt-2 text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {user.displayName}
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--eco-surface)' }}>
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <Mail size={14} /> Email
              </div>
              <div className="mt-2 text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {user.email ?? tx(language, 'Не добавлен', 'Қосылмаған', 'Not added')}
              </div>
            </div>
            <div className="rounded-lg p-4" style={{ background: 'var(--eco-surface)' }}>
              <div
                className="flex items-center gap-2 text-[12px]"
                style={{ color: 'var(--eco-text-tertiary)' }}
              >
                <Star size={14} /> {tx(language, 'Репутация', 'Репутация', 'Reputation')}
              </div>
              <div className="mt-2 text-[15px]" style={{ color: 'var(--eco-text)' }}>
                {reputationOutOfTen(user.reputation).toFixed(1)}/10
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Mirrors app.sms.resend-cooldown-seconds on the backend. The server is the
// authority — this only keeps the button from offering a request it will refuse.
const RESEND_COOLDOWN_SECONDS = 60;

/** Seconds as m:ss — "0:45" reads as a wait, "45" reads as a quantity. */
function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Turns a failed phone-verification call into a localized sentence.
 *
 * <p>Maps on HTTP status rather than the server text: those messages are English
 * strings written for developers, and ApiError passes them straight through
 * whenever they look curated — so rendering `err.message` shows "Invalid
 * verification code" to a Russian user. The three statuses below are exactly the
 * cases the flow needs to tell apart.
 */
function phoneErrorMessage(status: number, language: Language): string {
  switch (status) {
    case 400:
      return tx(
        language,
        'Неверный код. Проверьте цифры из SMS.',
        'Код қате. SMS-тегі сандарды тексеріңіз.',
        'Wrong code. Check the digits from the SMS.',
      );
    case 410:
      return tx(
        language,
        'Срок действия кода истёк. Запросите новый.',
        'Кодтың мерзімі бітті. Жаңасын сұраңыз.',
        'The code has expired. Request a new one.',
      );
    case 429:
      return tx(
        language,
        'Слишком много попыток. Подождите немного и попробуйте снова.',
        'Тым көп әрекет. Сәл күтіп, қайта көріңіз.',
        'Too many attempts. Wait a moment and try again.',
      );
    case 409:
      return tx(
        language,
        'Этот номер уже привязан к другому аккаунту.',
        'Бұл нөмір басқа аккаунтқа тіркелген.',
        'This number is already linked to another account.',
      );
    default:
      return tx(
        language,
        'Не удалось выполнить запрос. Попробуйте позже.',
        'Сұранысты орындау мүмкін болмады. Кейінірек көріңіз.',
        'The request failed. Please try again later.',
      );
  }
}

function PhoneVerificationCard() {
  const { user, authorizedRequest, refreshUser } = useAuth();
  const { language } = useI18n();

  const [phone, setPhone] = useState(user?.phone ?? '+7');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Same hook the email-resend block uses, so both cooldowns behave identically.
  const cooldown = useResendCountdown(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    setPhone(user?.phone ?? '+7');
  }, [user?.phone]);

  const verified = Boolean(user?.phoneVerified);
  const phoneChanged = verified && phone !== (user?.phone ?? '');

  const handleRequestCode = async () => {
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setSending(true);

    try {
      await authorizedRequest((token) => requestPhoneCodeRequest(phone, token));
      setCodeSent(true);
      cooldown.start();
      setMessage(
        tx(
          language,
          'Мы отправили 6-значный код на ваш телефон. Введите его ниже.',
          'Біз 6 таңбалы кодты телефоныңызға жібердік. Оны төменде енгізіңіз.',
          'We sent a 6-digit code to your phone. Enter it below.',
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(phoneErrorMessage(err.status, language));
        setFieldErrors(localizeFieldErrors(err.errors, language));
        // The server refused because a code is still fresh: run the timer out
        // rather than leaving a button that keeps failing.
        if (err.status === 429) cooldown.start();
      } else {
        setError(
          tx(
            language,
            'Не удалось отправить код.',
            'Кодты жіберу мүмкін болмады.',
            'Unable to send a code right now.',
          ),
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setFieldErrors({});
    setVerifying(true);

    try {
      await authorizedRequest((token) => verifyPhoneRequest(phone, code, token));
      await refreshUser();
      setCode('');
      setCodeSent(false);
      cooldown.reset();
      setMessage(
        tx(
          language,
          'Номер телефона подтверждён.',
          'Телефон нөмірі расталды.',
          'Phone number verified.',
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(phoneErrorMessage(err.status, language));
        setFieldErrors(localizeFieldErrors(err.errors, language));
        // Expired or attempts exhausted: the current code is dead, so drop back
        // to the request step instead of letting the user retype into a corpse.
        if (err.status === 410 || err.status === 429) {
          setCodeSent(false);
          setCode('');
        }
      } else {
        setError(
          tx(
            language,
            'Не удалось проверить код.',
            'Кодты тексеру мүмкін болмады.',
            'Unable to verify the code right now.',
          ),
        );
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[16px]" style={{ color: 'var(--eco-text)' }}>
          <Phone size={16} /> {tx(language, 'Номер телефона', 'Телефон нөмірі', 'Phone number')}
        </h3>
        {verified && !phoneChanged ? (
          <Badge variant="success">{tx(language, 'Подтверждён', 'Расталған', 'Verified')}</Badge>
        ) : (
          <Badge>{tx(language, 'Не подтверждён', 'Расталмаған', 'Not verified')}</Badge>
        )}
      </div>

      {verified && !phoneChanged && (
        <p
          className="flex items-center gap-1.5 text-[12px]"
          style={{ color: 'var(--eco-positive)' }}
        >
          <CheckCircle2 size={14} /> {user?.phone}{' '}
          {tx(language, 'подтверждён.', 'расталған.', 'is verified.')}
        </p>
      )}

      <Input
        label={tx(language, 'Телефон', 'Телефон', 'Phone')}
        value={phone}
        onChange={(event) => {
          setPhone(event.target.value);
          setCodeSent(false);
        }}
        error={fieldErrors.phone}
        hint={tx(language, 'Формат: +7XXXXXXXXXX', 'Формат: +7XXXXXXXXXX', 'Format: +7XXXXXXXXXX')}
        placeholder="+77001234567"
      />

      {!codeSent ? (
        <Button onClick={handleRequestCode} loading={sending} disabled={verified && !phoneChanged}>
          {phoneChanged
            ? tx(
                language,
                'Отправить код на новый номер',
                'Жаңа нөмірге код жіберу',
                'Send code to new number',
              )
            : tx(
                language,
                'Отправить код подтверждения',
                'Растау кодын жіберу',
                'Send verification code',
              )}
        </Button>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={handleVerify}>
          <Input
            label={tx(language, 'Код подтверждения', 'Растау коды', 'Verification code')}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
            error={fieldErrors.code}
            hint={tx(language, '6 цифр из SMS', 'SMS-тен 6 цифр', '6-digit code from the SMS')}
            inputMode="numeric"
            placeholder="123456"
          />
          <div className="flex gap-2">
            <Button type="submit" loading={verifying}>
              {tx(language, 'Подтвердить', 'Растау', 'Verify')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleRequestCode}
              loading={sending}
              disabled={!cooldown.canResend}
            >
              {!cooldown.canResend
                ? tx(
                    language,
                    `Отправить ещё раз через ${formatCountdown(cooldown.remaining)}`,
                    `${formatCountdown(cooldown.remaining)} кейін қайта жіберу`,
                    `Resend in ${formatCountdown(cooldown.remaining)}`,
                  )
                : tx(language, 'Отправить код ещё раз', 'Кодты қайта жіберу', 'Resend code')}
            </Button>
          </div>
        </form>
      )}

      {error && (
        <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </p>
      )}
      {message && (
        <p className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
          {message}
        </p>
      )}
    </Card>
  );
}

// Must mirror the backend allowlist/limit (AvatarStorageService + AvatarUploadProperties):
// PNG/JPEG only, 5 MB. WEBP is not accepted server-side.
const ACCEPTED_AVATAR_TYPES = ['image/png', 'image/jpeg'];
const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

function AvatarUploader() {
  const { user, refreshUser, authorizedRequest } = useAuth();
  const { language, t } = useI18n();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!user) return null;

  const initials = user.displayName
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  const displayAvatar = preview ?? user.avatar ?? null;

  const handleFile = async (file: File) => {
    setError(null);

    if (!ACCEPTED_AVATAR_TYPES.includes(file.type)) {
      setError(
        tx(
          language,
          'Поддерживаются PNG и JPEG.',
          'PNG және JPEG қолдау көрсетіледі.',
          'PNG and JPEG are supported.',
        ),
      );
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setError(
        tx(
          language,
          'Файл слишком большой (максимум 5 МБ).',
          'Файл тым үлкен (максимум 5 МБ).',
          'File is too large (max 5 MB).',
        ),
      );
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    setUploading(true);
    try {
      await authorizedRequest((token) => uploadMyAvatar(file, token));
      await refreshUser();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError(t('loadFailedTitle'));
      }
    } finally {
      setUploading(false);
      URL.revokeObjectURL(localUrl);
      setPreview(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    if (!user.avatar) return;
    setError(null);
    setUploading(true);
    try {
      await authorizedRequest((token) => deleteMyAvatar(token));
      await refreshUser();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('loadFailedTitle'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center text-[22px] overflow-hidden"
        style={{ background: 'var(--eco-surface)', color: 'var(--eco-text-secondary)' }}
      >
        {displayAvatar ? (
          <img src={displayAvatar} alt={user.displayName} className="w-full h-full object-cover" />
        ) : (
          initials || '?'
        )}
      </div>
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_AVATAR_TYPES.join(',')}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          loading={uploading}
          onClick={() => inputRef.current?.click()}
        >
          <Upload size={13} /> {t('avatarUpload')}
        </Button>
        {user.avatar && !uploading && (
          <Button variant="ghost" size="sm" onClick={() => void handleDelete()}>
            <Trash2 size={13} /> {t('avatarDelete')}
          </Button>
        )}
      </div>
      <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
        {t('avatarHint')}
      </span>
      {error && (
        <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </span>
      )}
    </div>
  );
}

function PublicLinkCard({ slug, publicId }: { slug: string | null; publicId: string | null }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const handle = slug ?? publicId ?? '';
  const url =
    typeof window !== 'undefined' ? `${window.location.origin}/u/${handle}` : `/u/${handle}`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const input = document.createElement('input');
        input.value = url;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — user can still copy manually */
    }
  };

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-[16px]" style={{ color: 'var(--eco-text)' }}>
        <UserRound size={16} /> {t('publicProfileLink')}
      </h3>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          readOnly
          value={url}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
            fontFamily: 'monospace',
          }}
          onClick={(e) => (e.target as HTMLInputElement).select()}
        />
        <Button
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => void handleCopy()}
        >
          <Copy size={13} /> {copied ? t('publicProfileCopied') : t('publicProfileCopy')}
        </Button>
      </div>
      <Link
        to={`/u/${handle}`}
        className="text-[12px]"
        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
      >
        {t('publicProfile')} →
      </Link>
    </Card>
  );
}

function FindUserCard() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const submit = () => {
    const raw = query.trim();
    if (!raw) return;
    let hash = raw;
    const match = raw.match(/\/u\/([^/?#\s]+)/);
    if (match) hash = match[1];
    navigate(`/u/${encodeURIComponent(hash)}`);
  };

  return (
    <Card className="flex flex-col gap-3">
      <h3 className="flex items-center gap-2 text-[16px]" style={{ color: 'var(--eco-text)' }}>
        <SearchIcon size={16} /> {t('publicProfileSearchTitle')}
      </h3>
      <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
        {t('publicProfileSearchHint')}
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder={tx(language, 'ссылка или хэш', 'сілтеме немесе хэш', 'link or hash')}
          className="flex-1 min-w-0 px-3 py-2 rounded-lg outline-none text-[13px]"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        />
        <Button variant="primary" size="sm" className="shrink-0" onClick={submit}>
          {t('publicProfileSearchGo')}
        </Button>
      </div>
    </Card>
  );
}

/**
 * Email is the primary sign-in identifier; this card covers the profile email
 * states: missing, unverified, and verified. Adding/changing goes through
 * /users/me/email/request + /confirm: the account keeps its current address
 * until the emailed one-time code is confirmed.
 */
function EmailCard() {
  const { language } = useI18n();
  const { user, authorizedRequest, applyUser } = useAuth();

  const currentEmail = user?.email ?? null;
  const verified = Boolean(user?.emailVerified);

  // 'idle' shows the current state; 'editing' the new-address input;
  // 'codeSent' the 6-digit confirmation input.
  const [step, setStep] = useState<'idle' | 'editing' | 'codeSent'>(
    currentEmail ? 'idle' : 'editing',
  );
  const emailField = useEmailField();
  const newEmail = emailField.value;
  // Mirrors the server's 60s cooldown so the button reads as unavailable
  // instead of failing with a 429 the user cannot interpret.
  const resend = useResendCountdown(60);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const resetFeedback = () => {
    setMessage(null);
    setError(null);
  };

  // Legacy path: an email-registered account that never confirmed the
  // registration email keeps the old "resend" action.
  const handleResendRegistrationEmail = async () => {
    if (!currentEmail) return;
    resetFeedback();
    setBusy(true);
    try {
      await resendVerificationEmailRequest(currentEmail);
      setMessage(
        tx(
          language,
          'Если адрес не подтверждён, новое письмо отправлено.',
          'Егер email расталмаған болса, жаңа хат жіберілді.',
          'If unverified, a new verification email has been sent.',
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось отправить письмо повторно.',
              'Хатты қайта жіберу мүмкін болмады.',
              'Unable to resend verification email.',
            ),
      );
    } finally {
      setBusy(false);
    }
  };

  const handleRequestCode = async () => {
    resetFeedback();

    // Level 1 locally: don't spend a request (or the server's send quota) on
    // an address that is visibly malformed.
    const check = emailField.validateNow();
    if (!check.ok) {
      setError(emailFormatErrorText(check.error!, language));
      return;
    }

    setBusy(true);
    try {
      await authorizedRequest((token) => requestEmailChangeRequest(check.normalized, token));
      setStep('codeSent');
      resend.start();
      setMessage(
        tx(
          language,
          'Мы отправили код подтверждения на новый адрес.',
          'Жаңа мекенжайға растау кодын жібердік.',
          'We sent a confirmation code to the new address.',
        ),
      );
    } catch (err) {
      if (err instanceof ApiError) {
        // Levels the client can't check: dead domain, address already taken,
        // rate limit, SMTP down. Each gets its own message — a blanket
        // "ошибка" leaves the user with nothing to act on.
        const emailCode = serverEmailErrorCode(err.errors);
        if (emailCode) {
          setError(serverEmailErrorText(emailCode, language));
          if (err.errors.suggestion) emailField.setValue(err.errors.suggestion);
        } else if (err.status === 409) {
          setError(
            tx(
              language,
              'Этот адрес уже привязан к другому аккаунту.',
              'Бұл мекенжай басқа аккаунтқа байланған.',
              'That address is already used by another account.',
            ),
          );
        } else if (err.status === 429) {
          setError(
            tx(
              language,
              'Слишком много попыток. Подождите минуту и попробуйте снова.',
              'Тым көп әрекет. Бір минут күтіп, қайталап көріңіз.',
              'Too many attempts. Please wait a minute and try again.',
            ),
          );
          resend.start();
        } else {
          setError(err.message);
        }
      } else {
        setError(
          tx(
            language,
            'Не удалось отправить код.',
            'Кодты жіберу мүмкін болмады.',
            'Unable to send the code right now.',
          ),
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCode = async () => {
    resetFeedback();
    if (code.length !== 6) {
      setError(
        tx(
          language,
          'Введите 6-значный код.',
          '6 таңбалы кодты енгізіңіз.',
          'Enter the 6-digit code.',
        ),
      );
      return;
    }
    setBusy(true);
    try {
      const updated = await authorizedRequest((token) => confirmEmailChangeRequest(code, token));
      applyUser(updated);
      setStep('idle');
      emailField.reset();
      setCode('');
      setMessage(tx(language, 'Email подтверждён.', 'Email расталды.', 'Email verified.'));
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось подтвердить код.',
              'Кодты растау мүмкін болмады.',
              'Unable to verify the code right now.',
            ),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-[16px]" style={{ color: 'var(--eco-text)' }}>
          <Mail size={16} /> Email
        </h3>
        {currentEmail &&
          (verified ? (
            <Badge variant="success">{tx(language, 'Подтверждён', 'Расталған', 'Verified')}</Badge>
          ) : (
            <Badge>{tx(language, 'Не подтверждён', 'Расталмаған', 'Not verified')}</Badge>
          ))}
      </div>

      {currentEmail ? (
        <p
          className="flex items-center gap-1.5 text-[13px]"
          style={{ color: verified ? 'var(--eco-positive)' : 'var(--eco-text-secondary)' }}
        >
          {verified && <CheckCircle2 size={14} />} {currentEmail}
        </p>
      ) : (
        <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'Почта не добавлена. Добавьте её, чтобы восстанавливать доступ, если потеряете телефон, и получать уведомления. Это необязательно.',
            'Пошта қосылмаған. Телефоннан айырылған жағдайда қатынасты қалпына келтіру және хабарламалар алу үшін қосыңыз. Бұл міндетті емес.',
            'No email yet. Add one to recover access if you lose your phone and to receive notifications. This is optional.',
          )}
        </p>
      )}

      {step === 'editing' || step === 'codeSent' ? (
        <>
          <Input
            label={currentEmail ? tx(language, 'Новый email', 'Жаңа email', 'New email') : 'Email'}
            type="email"
            placeholder="you@mail.kz"
            value={newEmail}
            onChange={(event) => {
              emailField.setValue(event.target.value);
              // Editing the address invalidates the code we just sent.
              if (step === 'codeSent') {
                setStep('editing');
                resend.reset();
              }
            }}
            error={emailField.error ? emailFormatErrorText(emailField.error, language) : undefined}
          />
          {/* Hidden while a suggestion is up: "looks good" next to "did you
              mean…?" reads as two contradictory verdicts. */}
          {!emailField.error && !emailField.suggestion && (
            <EmailFieldStatusHint status={emailField.status} />
          )}
          {emailField.suggestion && (
            <EmailSuggestion
              suggestion={emailField.suggestion}
              onAccept={emailField.acceptSuggestion}
              onDismiss={emailField.dismissSuggestion}
            />
          )}
          {step === 'codeSent' ? (
            <>
              <Input
                label={tx(language, 'Код из письма', 'Хаттағы код', 'Code from the email')}
                value={code}
                onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                inputMode="numeric"
                placeholder="123456"
                hint={tx(
                  language,
                  'Код действует 30 минут.',
                  'Код 30 минут жарамды.',
                  'The code is valid for 30 minutes.',
                )}
              />
              <div className="flex gap-2">
                <Button loading={busy} onClick={handleConfirmCode} disabled={code.length !== 6}>
                  {tx(language, 'Подтвердить', 'Растау', 'Confirm')}
                </Button>
                <Button
                  variant="ghost"
                  loading={busy}
                  disabled={!resend.canResend}
                  onClick={handleRequestCode}
                >
                  {resend.canResend
                    ? tx(language, 'Отправить код ещё раз', 'Кодты қайта жіберу', 'Resend code')
                    : tx(
                        language,
                        `Отправить повторно через ${resend.remaining} с`,
                        `${resend.remaining} с кейін қайта жіберу`,
                        `Resend in ${resend.remaining}s`,
                      )}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex gap-2">
              <Button
                loading={busy}
                onClick={handleRequestCode}
                disabled={!newEmail.trim() || emailField.status === 'invalid'}
              >
                {currentEmail
                  ? tx(language, 'Отправить код', 'Код жіберу', 'Send code')
                  : tx(language, 'Добавить email', 'Email қосу', 'Add email')}
              </Button>
              {currentEmail && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setStep('idle');
                    emailField.reset();
                    resetFeedback();
                  }}
                >
                  {tx(language, 'Отмена', 'Бас тарту', 'Cancel')}
                </Button>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setStep('editing');
              resetFeedback();
            }}
          >
            {tx(language, 'Сменить email', 'Email ауыстыру', 'Change email')}
          </Button>
          {currentEmail && !verified && (
            <Button variant="ghost" loading={busy} onClick={handleResendRegistrationEmail}>
              {tx(
                language,
                'Отправить письмо ещё раз',
                'Хатты қайта жіберу',
                'Resend verification email',
              )}
            </Button>
          )}
        </div>
      )}

      {message && (
        <p className="text-[12px]" style={{ color: 'var(--eco-positive)' }}>
          {message}
        </p>
      )}
      {error && (
        <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </p>
      )}
    </Card>
  );
}

function formatKzt(value: number | string | null | undefined): string {
  if (value == null) return '—';
  const num = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(num)) return String(value);
  return `₸${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(num)}`;
}

function formatCount(value: number | null | undefined): string {
  if (value == null) return '—';
  return new Intl.NumberFormat('ru-RU').format(value);
}

interface MemberStat {
  key: string;
  value: string;
  icon: typeof Home;
  variant: 'info' | 'success' | 'warning' | 'danger';
  hint?: string;
}

function MemberDashboardCard() {
  const { t, language } = useI18n();
  const { authorizedRequest, isAuthenticated } = useAuth();
  const [data, setData] = useState<MemberDashboardDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const dto = await authorizedRequest((token) => getMyDashboardRequest(token));
      setData(dto);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('memberDashboardLoadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const spendChartData = useMemo(() => {
    if (!data || !Array.isArray(data.recentEvents)) return [];
    const points = data.recentEvents
      .filter((event) => event.amountKzt != null)
      .map((event) => ({
        period: formatDate(event.createdAt, language),
        amount:
          typeof event.amountKzt === 'string'
            ? Number(event.amountKzt)
            : Number(event.amountKzt ?? 0),
      }));
    // recent events arrive newest-first; reverse so the chart reads left→right.
    return points.reverse();
  }, [data, language]);

  const stats: MemberStat[] = data
    ? [
        {
          key: 'memberStatActiveRooms',
          value: formatCount(data.joinedRoomsActive),
          icon: Home,
          variant: 'info',
        },
        {
          key: 'memberStatCompletedRooms',
          value: formatCount(data.joinedRoomsCompleted),
          icon: CheckCheck,
          variant: 'success',
        },
        {
          key: 'memberStatTotalJoined',
          value: formatCount(data.totalRoomsJoined),
          icon: BarChart3,
          variant: 'info',
        },
        {
          key: 'memberStatMonthlySpend',
          value: formatKzt(data.monthlySpendKzt),
          icon: Wallet,
          variant: 'warning',
        },
        {
          key: 'memberStatTotalSpent',
          value: formatKzt(data.totalSpentKzt),
          icon: TrendingUp,
          variant: 'info',
        },
        {
          key: 'memberStatTotalSaved',
          value: formatKzt(data.totalSavedKzt),
          icon: PiggyBank,
          variant: 'success',
        },
        {
          key: 'memberStatNextPayment',
          value: data.nextPaymentDate
            ? `${formatDate(data.nextPaymentDate, language)} · ${formatKzt(data.nextPaymentAmountKzt)}`
            : t('memberNoUpcomingPayment'),
          icon: CalendarClock,
          variant: 'warning',
        },
        {
          key: 'memberStatReputation',
          value: `${reputationOutOfTen(
            typeof data.reputationScore === 'string'
              ? Number(data.reputationScore)
              : data.reputationScore,
          ).toFixed(1)}/10`,
          icon: Star,
          variant: 'success',
        },
        {
          key: 'memberStatReviewsReceived',
          value: formatCount(data.reviewsReceived),
          icon: MessageSquare,
          variant: 'info',
        },
        {
          key: 'memberStatDisputes',
          value: formatCount(data.disputesAsMember),
          icon: AlertTriangle,
          variant: 'danger',
        },
      ]
    : [];

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h3 className="flex items-center gap-2 text-[16px]" style={{ color: 'var(--eco-text)' }}>
          <BarChart3 size={16} /> {t('memberDashboardTitle')}
        </h3>
        <Button variant="ghost" size="sm" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={13} /> {t('memberDashboardRefresh')}
        </Button>
      </div>

      {loading && !data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} height={70} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
          {error}
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.key}
                  className="p-3 rounded-lg flex flex-col gap-2"
                  style={{ background: 'var(--eco-surface)' }}
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        s.variant === 'warning'
                          ? 'var(--eco-warning-100)'
                          : s.variant === 'danger'
                            ? 'var(--eco-danger-100)'
                            : s.variant === 'success'
                              ? 'var(--eco-success-100)'
                              : 'var(--eco-brand-50)',
                    }}
                  >
                    <Icon
                      size={13}
                      style={{
                        color:
                          s.variant === 'warning'
                            ? 'var(--eco-warning-500)'
                            : s.variant === 'danger'
                              ? 'var(--eco-danger-500)'
                              : s.variant === 'success'
                                ? 'var(--eco-positive)'
                                : 'var(--eco-brand-600)',
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-[15px]" style={{ color: 'var(--eco-text)' }}>
                      {s.value}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                      {t(s.key)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {spendChartData.length > 0 && (
            <div>
              <div className="text-[13px] mb-2" style={{ color: 'var(--eco-text-secondary)' }}>
                {t('memberSpendChartTitle')}
              </div>
              <div style={{ width: '100%', height: 180 }}>
                <ResponsiveContainer>
                  <LineChart
                    data={spendChartData}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid stroke="var(--eco-border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="period"
                      tick={{ fill: 'var(--eco-text-tertiary)', fontSize: 11 }}
                    />
                    <YAxis tick={{ fill: 'var(--eco-text-tertiary)', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{
                        background: 'var(--eco-bg)',
                        border: '1px solid var(--eco-border)',
                        borderRadius: 8,
                        fontSize: 12,
                        color: 'var(--eco-text)',
                      }}
                      formatter={(v: number | string) => formatKzt(v)}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      name={t('memberStatMonthlySpend')}
                      stroke="var(--eco-primary)"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div>
            <div className="text-[13px] mb-2" style={{ color: 'var(--eco-text-secondary)' }}>
              {t('memberRecentEvents')}
            </div>
            {data.recentEvents.length === 0 ? (
              <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('memberRecentEventsEmpty')}
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {data.recentEvents.slice(0, 8).map((event, idx) => (
                  <div
                    key={event.id ?? `${event.createdAt}-${idx}`}
                    className="flex items-start justify-between gap-3 text-[12px] py-2 border-b last:border-b-0"
                    style={{ borderColor: 'var(--eco-border)' }}
                  >
                    <div className="min-w-0">
                      <div style={{ color: 'var(--eco-text)' }}>
                        {event.eventType}
                        {event.roomTitle
                          ? ` · ${event.roomTitle}`
                          : event.roomId
                            ? ` · #${event.roomId}`
                            : ''}
                      </div>
                      <div style={{ color: 'var(--eco-text-tertiary)' }}>
                        {formatDateTime(event.createdAt, language)}
                      </div>
                    </div>
                    {event.amountKzt != null && (
                      <div className="shrink-0" style={{ color: 'var(--eco-text)' }}>
                        {formatKzt(event.amountKzt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
