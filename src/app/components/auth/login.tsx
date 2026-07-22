import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Button, Input, Card } from '../ds-primitives';
import { useI18n, type Language } from '../i18n-provider';
import { formatDateTime } from '../../lib/datetime';
import { useAuth } from './auth-provider';
import { consumePersistedBanEvent } from './auth-provider';
import { VerifyCodeStep } from './verify-code-step';
import { VerifyPhoneStep } from './verify-phone-step';
import { Ban } from 'lucide-react';
import { ApiError, normalizePhone } from '../../lib/api';
import { looksLikeEmail, serverEmailErrorCode } from '../../lib/email-validation';
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

// Same marker convention for phone-registered accounts that never confirmed
// their SMS code (GlobalExceptionHandler#handlePhoneNotVerified).
function isPhoneNotVerified(err: ApiError): boolean {
  return err.status === 403 && err.errors?.code === 'PHONE_NOT_VERIFIED';
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

  // One field for both identifiers: phone-registered users type their +7…
  // number, email users their address. loginRequest routes accordingly.
  //
  // The hook only judges input containing '@' — a phone number must not be
  // flagged as a malformed email — and it debounces, so we never scold someone
  // mid-keystroke.
  const emailField = useEmailField('', { onlyWhenEmailLike: true });
  const identifier = emailField.value;
  const setIdentifier = emailField.setValue;
  const isEmailIdentifier = looksLikeEmail(identifier);

  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
  // When set, the account exists but its email isn't verified — show the code
  // step (which resends a fresh code and logs the user in on success).
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  // Same for phone-registered accounts that never confirmed the SMS code.
  const [unverifiedPhone, setUnverifiedPhone] = useState<string | null>(null);

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

    // Catch a malformed address before spending a request on it — a failed
    // round trip would come back as "invalid credentials", which sends the
    // user hunting for a password problem they don't have.
    if (isEmailIdentifier) {
      const check = emailField.validateNow();
      if (!check.ok) {
        setFieldErrors({ email: emailFormatErrorText(check.error!, language) });
        return;
      }
    }

    setLoading(true);

    try {
      // Submit the canonical form so a stray capital or pasted space can't
      // miss the stored row.
      await login(isEmailIdentifier ? emailField.normalized : identifier, password);
      navigate(redirectTarget);
    } catch (err) {
      if (err instanceof ApiError) {
        const ban = parseBanFromApiError(err);
        const emailCode = serverEmailErrorCode(err.errors);
        if (ban) {
          setBanInfo(ban);
        } else if (isEmailNotVerified(err)) {
          setUnverifiedEmail(emailField.normalized);
        } else if (isPhoneNotVerified(err)) {
          setUnverifiedPhone(normalizePhone(identifier));
        } else if (emailCode) {
          // Server-side format/domain rejection: show it on the field, with
          // the correction it suggested if there is one.
          setFieldErrors({ email: serverEmailErrorText(emailCode, language) });
          if (err.errors.suggestion) emailField.setValue(err.errors.suggestion);
        } else {
          setError(err.message);
          setFieldErrors(err.errors);
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

  // Phone-registered account that never confirmed its SMS code: divert to the
  // SMS step ("resend" there requests a fresh code if the original expired).
  if (unverifiedPhone) {
    return (
      <VerifyPhoneStep
        phone={unverifiedPhone}
        onVerified={() => navigate(redirectTarget)}
        onBack={() => setUnverifiedPhone(null)}
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
              label={tx(language, 'Телефон или email', 'Телефон немесе email', 'Phone or email')}
              type="text"
              placeholder={tx(
                language,
                '+7 700 123 45 67 или you@mail.kz',
                '+7 700 123 45 67 немесе you@mail.kz',
                '+7 700 123 45 67 or you@mail.kz',
              )}
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              error={
                fieldErrors.email ??
                fieldErrors.phone ??
                (emailField.error ? emailFormatErrorText(emailField.error, language) : undefined)
              }
              autoComplete="username"
            />
            {/* Inline state for the email case only; a phone number stays unjudged.
                Suppressed while a typo suggestion is up: "looks good" next to
                "did you mean…?" reads as two contradictory verdicts. */}
            {isEmailIdentifier && !fieldErrors.email && !emailField.suggestion && (
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
