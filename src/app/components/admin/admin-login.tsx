import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router';
import { Button, Input } from '../ds-primitives';
import { BrandLogo } from '../brand-logo';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { ApiError, type TwoFactorChallenge } from '../../lib/api';
import { Shield, Lock, Eye, EyeOff, ArrowLeft, LogOut } from 'lucide-react';
import { defaultLandingForRole } from './admin-nav';

type Stage = 'credentials' | 'twoFactor';

/**
 * Returns the `?redirect=` value only when it is a safe, internal /admin/*
 * path. Anything else (external URLs, protocol-relative, "//evil", or any
 * non-admin internal path) is rejected to prevent open-redirect abuse.
 */
function safeRedirectTarget(rawSearch: string): string | null {
  const params = new URLSearchParams(rawSearch);
  const raw = params.get('redirect');
  if (!raw) return null;
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return null;
  }
  // Disallow protocol-relative, absolute URLs, and anything not starting
  // with `/admin/`. We intentionally exclude `/admin-login` itself so we
  // don't loop the user back here.
  if (!decoded.startsWith('/admin/')) return null;
  if (decoded.startsWith('//')) return null;
  return decoded;
}

export function AdminLoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useI18n();
  const {
    staffLogin,
    verifyStaffTwoFactor,
    resendStaffTwoFactor,
    user,
    isAuthenticated,
    isReady,
    logout,
  } = useAuth();

  const [stage, setStage] = useState<Stage>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Challenge lives in component state only — never persisted. Going back
  // to the credentials stage clears it (see handleBackToCredentials).
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSupported, setResendSupported] = useState(true);

  const redirectTarget = useMemo(() => safeRedirectTarget(location.search), [location.search]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const id = window.setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(id);
  }, [resendCooldown]);

  const expiresLabel = useMemo(() => {
    if (!challenge?.expiresAt) return null;
    const parsed = new Date(challenge.expiresAt);
    if (Number.isNaN(parsed.getTime())) return null;
    return new Intl.DateTimeFormat(undefined, {
      timeZone: 'Asia/Almaty',
      hour: '2-digit',
      minute: '2-digit',
    }).format(parsed);
  }, [challenge]);

  const translateApiError = (err: ApiError): string => {
    if (err.status === 401) return t('invalidCredentialsError');
    if (err.status === 403) return t('noStaffAccessError');
    if (err.status === 410) return t('challengeExpiredError');
    if (err.status === 422) return t('invalidTwoFactorCodeError');
    if (err.status === 429) return t('tooManyAttemptsError');
    return t('genericSignInError');
  };

  const navigateAfterSuccess = (role: string | undefined | null) => {
    const fallback = defaultLandingForRole(role);
    navigate(redirectTarget ?? fallback, { replace: true });
  };

  // Already logged in? Resolve straight away without re-prompting.
  if (isReady && isAuthenticated && user) {
    if (user.role === 'ADMIN' || user.role === 'SUPPORT') {
      return <Navigate to={redirectTarget ?? defaultLandingForRole(user.role)} replace />;
    }
    // USER role landed here — show a no-access panel with sign-out so they
    // can switch accounts without the page silently doing nothing.
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--eco-bg)' }}
      >
        <div className="w-full max-w-md text-center">
          <h1 className="text-[22px] mb-2" style={{ color: 'var(--eco-text)' }}>
            {t('accessDeniedTitle')}
          </h1>
          <p className="text-[14px] mb-2" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('noStaffAccessError')}
          </p>
          <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-tertiary)' }}>
            {t('signedInAs', { email: user.email })}
          </p>
          <Button
            variant="primary"
            onClick={async () => {
              await logout();
              // Stay on /admin-login so the user can sign in as staff next.
            }}
          >
            <LogOut size={14} /> {t('switchAccount')}
          </Button>
        </div>
      </div>
    );
  }

  const handleCredentialsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const result = await staffLogin(email.trim(), password);
      if (result.kind === 'twoFactor') {
        setChallenge(result.challenge);
        setStage('twoFactor');
        setResendCooldown(30);
        setResendSupported(true);
      } else {
        navigateAfterSuccess(result.user.role);
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(translateApiError(err));
        setFieldErrors(err.errors ?? {});
      } else {
        setError(t('networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!challenge) return;
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      const signedInUser = await verifyStaffTwoFactor(challenge.challengeId, code.trim());
      navigateAfterSuccess(signedInUser.role);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(translateApiError(err));
        setFieldErrors(err.errors ?? {});
        if (err.status === 410) {
          // expired challenge → user must restart
          setStage('credentials');
          setChallenge(null);
          setCode('');
        }
      } else {
        setError(t('networkError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!challenge || resendCooldown > 0) return;
    setError(null);
    try {
      await resendStaffTwoFactor(challenge.challengeId);
      setResendCooldown(30);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404 || err.status === 405) {
          // Backend does not implement resend — hide the button going forward.
          setResendSupported(false);
        } else {
          setError(translateApiError(err));
        }
      } else {
        setError(t('networkError'));
      }
    }
  };

  const handleBackToCredentials = () => {
    setStage('credentials');
    setChallenge(null);
    setCode('');
    setError(null);
    setFieldErrors({});
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--eco-bg)' }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 flex flex-col items-center gap-2">
          <BrandLogo size="lg" sublabel={t('adminPortal')} />
          <div className="text-[14px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {t('administrationAndSupport')}
          </div>
        </div>

        <div className="w-full max-w-md mb-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-[13px] cursor-pointer self-start"
            style={{ color: 'var(--eco-primary)', background: 'transparent', border: 'none' }}
          >
            {t('adminBackToSite')}
          </button>
        </div>

        {stage === 'credentials' && (
          <form
            onSubmit={handleCredentialsSubmit}
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{
              background: 'var(--eco-surface-raised)',
              border: '1px solid var(--eco-border)',
            }}
          >
            <Input
              label={t('email')}
              type="email"
              placeholder="admin@ecopay.kz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              autoComplete="username"
              required
            />

            <div className="flex flex-col gap-1.5">
              <label style={{ color: 'var(--eco-text)', fontSize: 14 }}>{t('password')}</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 rounded-lg outline-none"
                  style={{
                    background: 'var(--eco-surface)',
                    border: '1px solid var(--eco-border)',
                    color: 'var(--eco-text)',
                    fontSize: 14,
                  }}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setShowPass(!showPass)}
                  style={{ background: 'transparent', border: 'none' }}
                  aria-label={showPass ? t('hide') : t('show')}
                >
                  {showPass ? (
                    <EyeOff size={15} style={{ color: 'var(--eco-text-tertiary)' }} />
                  ) : (
                    <Eye size={15} style={{ color: 'var(--eco-text-tertiary)' }} />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <span className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                  {fieldErrors.password}
                </span>
              )}
            </div>

            {error && (
              <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2"
              loading={loading}
            >
              <Lock size={15} /> {t('signInToPortal')}
            </Button>
          </form>
        )}

        {stage === 'twoFactor' && challenge && (
          <form
            onSubmit={handleTwoFactorSubmit}
            className="rounded-xl p-6 flex flex-col gap-4"
            style={{
              background: 'var(--eco-surface-raised)',
              border: '1px solid var(--eco-border)',
            }}
          >
            <div
              className="flex items-center gap-2 text-[13px]"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              <Shield size={14} style={{ color: 'var(--eco-primary)' }} />
              {t('twoFactorSentTo', { email: challenge.maskedEmail })}
            </div>
            {expiresLabel && (
              <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('twoFactorExpiresAt', { time: expiresLabel })}
              </div>
            )}

            <Input
              label={t('twoFaCode')}
              placeholder={t('sixDigitCode')}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              hint={t('enterAuthCode')}
              error={fieldErrors.code}
              inputMode="numeric"
              autoComplete="one-time-code"
              required
            />

            {error && (
              <div className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
                {error}
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              <Lock size={15} /> {t('verifyAndSignIn')}
            </Button>

            <div className="flex items-center justify-between text-[12px]">
              <button
                type="button"
                className="flex items-center gap-1 cursor-pointer"
                onClick={handleBackToCredentials}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--eco-text-tertiary)',
                }}
              >
                <ArrowLeft size={12} /> {t('backToSignIn')}
              </button>
              {resendSupported && (
                <button
                  type="button"
                  disabled={resendCooldown > 0}
                  onClick={handleResend}
                  className="cursor-pointer"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--eco-text-tertiary)' : 'var(--eco-primary)',
                  }}
                >
                  {resendCooldown > 0
                    ? t('resendInSeconds', { s: resendCooldown })
                    : t('resendCode')}
                </button>
              )}
            </div>
          </form>
        )}

        <div className="text-center mt-6 text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('copyright')}
        </div>
      </div>
    </div>
  );
}
