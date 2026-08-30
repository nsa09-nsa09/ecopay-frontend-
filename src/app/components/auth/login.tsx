import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Input, Card } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from './auth-provider';
import { consumePersistedBanEvent } from './auth-provider';
import { VerifyCodeStep } from './verify-code-step';
import { Ban } from 'lucide-react';
import { ApiError } from '../../lib/api';
import { serverEmailErrorCode } from '../../lib/email-validation';
import { localizeFieldErrors } from '../../lib/field-errors';
import { useEmailField } from './use-email-field';
import {
  EmailFieldStatusHint,
  EmailSuggestion,
  emailFormatErrorText,
  serverEmailErrorText,
} from './email-field-messages';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

// The backend tags an unverified-login 403 with this marker inside the errors
// map (see GlobalExceptionHandler#handleEmailNotVerified) so we can detect it
// without depending on the localized message text.
function isEmailNotVerified(err: ApiError): boolean {
  return err.status === 403 && err.errors?.code === 'EMAIL_NOT_VERIFIED';
}

interface BanInfo {
  reason: string | null;
  bannedAt: string | null;
}

function parseBanFromQuery(search: string): BanInfo | null {
  const params = new URLSearchParams(search);
  if (params.get('banned') !== '1') return null;
  return {
    reason: params.get('reason'),
    bannedAt: params.get('bannedAt'),
  };
}

function parseBanFromApiError(err: ApiError): BanInfo | null {
  // Backend sends { code: "ACCOUNT_BANNED", message, errors: { reason, bannedAt } } or
  // a similar shape. We accept either errors.* or a JSON-encoded errors map.
  const code = (err.errors as Record<string, string>)?.code;
  // Use the raw server detail (not the sanitized .message) because the
  // ACCOUNT_BANNED marker is a backend code string, not user-facing text.
  const messageHasCode = /ACCOUNT[_ ]BANNED/i.test(err.serverMessage ?? '');
  if (code !== 'ACCOUNT_BANNED' && !messageHasCode) return null;
  const reason = err.errors?.reason ?? null;
  const bannedAt = err.errors?.bannedAt ?? null;
  return { reason, bannedAt };
}

export function LoginPage() {
  const { t, language } = useI18n();
  const { login } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const redirectTarget = new URLSearchParams(location.search).get('redirect') || '/profile';

  const emailField = useEmailField();

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  // When set, the account exists but its email isn't verified — show the code
  // step (which resends a fresh code and logs the user in on success).
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  useEffect(() => {
    // Order of precedence: query params (just-arrived realtime redirect),
    // then sessionStorage (deep-link survival), then nothing.
    const fromQuery = parseBanFromQuery(location.search);
    if (fromQuery) {
      setBanInfo(fromQuery);
      return;
    }
    const persisted = consumePersistedBanEvent();
    if (persisted) setBanInfo(persisted);
  }, [location.search]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setBanInfo(null);

    const check = emailField.validateNow();
    if (!check.ok) {
      setFieldErrors({ email: emailFormatErrorText(check.error!, language) });
      return;
    }

    setLoading(true);

    try {
      // Submit the canonical form so a stray capital or pasted space can't
      // miss the stored row.
      const result = await login(check.normalized, password);
      if (result.kind === 'twoFactor') {
        navigate('/admin-login', {
          replace: true,
          state: { challenge: result.challenge },
        });
        return;
      }
      navigate(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        const ban = parseBanFromApiError(err);
        const emailCode = serverEmailErrorCode(err.errors);
        if (ban) {
          setBanInfo(ban);
        } else if (isEmailNotVerified(err)) {
          setUnverifiedEmail(emailField.normalized);
        } else if (emailCode) {
          // Server-side format/domain rejection: show it on the field, with
          // the correction it suggested if there is one.
          setFieldErrors({ email: serverEmailErrorText(emailCode, language) });
          if (err.errors.suggestion) emailField.setValue(err.errors.suggestion);
        } else {
          setError(err.message);
          setFieldErrors(localizeFieldErrors(err.errors, language));
        }
      } else {
        setError(t('unableToSignIn'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Unverified account tried to sign in: divert to email confirmation. A fresh
  // code is auto-sent on mount since the original one may have expired.
  if (unverifiedEmail) {
    return (
      <VerifyCodeStep
        email={unverifiedEmail}
        autoResendOnMount
        onVerified={() => navigate(redirectTarget)}
        onBack={() => setUnverifiedEmail(null)}
      />
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('signIn')}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('welcomeBack')}
          </p>
        </div>
        {banInfo && (
          <Card className="mb-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'var(--eco-danger-100)' }}
              >
                <Ban size={15} style={{ color: 'var(--eco-danger-500)' }} />
              </div>
              <h2 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
                {t('bannedHeadline')}
              </h2>
            </div>
            <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
              {t('bannedDescription')}
            </p>
            {banInfo.reason && (
              <div className="text-[13px]">
                <span style={{ color: 'var(--eco-text-tertiary)' }}>
                  {t('bannedReasonLabel')}:{' '}
                </span>
                <span style={{ color: 'var(--eco-text)' }}>{banInfo.reason}</span>
              </div>
            )}
            {banInfo.bannedAt && (
              <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('bannedAtLabel')}: {formatDateTime(banInfo.bannedAt, language)}
              </div>
            )}
          </Card>
        )}
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label={t('email')}
              type="email"
              placeholder={t('yourEmail')}
              value={emailField.value}
              onChange={(event) => emailField.setValue(event.target.value)}
              error={
                fieldErrors.email ??
                (emailField.error ? emailFormatErrorText(emailField.error, language) : undefined)
              }
              autoComplete="email"
            />
            {!fieldErrors.email && !emailField.suggestion && (
              <EmailFieldStatusHint status={emailField.status} />
            )}
            {emailField.suggestion && (
              <EmailSuggestion
                suggestion={emailField.suggestion}
                onAccept={emailField.acceptSuggestion}
                onDismiss={emailField.dismissSuggestion}
              />
            )}
            <Input
              label={t('password')}
              type="password"
              placeholder={t('enterPassword')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              error={fieldErrors.password}
            />
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                  {t('rememberMe')}
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-[13px]"
                style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
              >
                {t('forgotPassword')}
              </Link>
            </div>
            {error && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              {t('signIn')}
            </Button>
          </form>
        </Card>
        <p className="text-center text-[13px] mt-4" style={{ color: 'var(--eco-text-secondary)' }}>
          {t('dontHaveAccount')}{' '}
          <Link to="/register" style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}>
            {t('createAccount')}
          </Link>
        </p>
      </div>
    </div>
  );
}
