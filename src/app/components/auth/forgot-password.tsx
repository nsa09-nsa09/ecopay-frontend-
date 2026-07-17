import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Input, Card } from '../ds-primitives';
import { Mail, ArrowLeft, Info } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from './auth-provider';
import { ApiError } from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

export function ForgotPasswordPage() {
  const { t, language } = useI18n();
  const { requestPasswordReset } = useAuth();
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setFieldErrors({});
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
        setFieldErrors(err.errors);
      } else {
        setError('Unable to send the reset email right now.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
            style={{ background: 'var(--eco-success-100)' }}
          >
            <Mail size={24} style={{ color: 'var(--eco-positive)' }} />
          </div>
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('checkYourEmail')}
          </h1>
          <p className="text-[13px] mt-2 mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('resetLinkSent')}
          </p>
          <Button variant="secondary" size="md" onClick={() => setSent(false)}>
            {t('resendEmail')}
          </Button>
          <div className="mt-4">
            <Link
              to="/login"
              className="text-[13px] inline-flex items-center gap-1"
              style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
            >
              <ArrowLeft size={14} /> {t('backToSignIn')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {t('resetPassword')}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('enterEmailForReset')}
          </p>
        </div>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              label={t('email')}
              type="email"
              placeholder={t('yourEmail')}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              error={fieldErrors.email}
            />
            {error && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {error}
              </p>
            )}
            <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>
              {t('sendResetLink')}
            </Button>
          </form>
        </Card>
        {/* Phone-registered accounts may have no email at all — explain why the
            form can't help them instead of failing silently. */}
        <div
          className="mt-4 rounded-lg px-3 py-2.5 flex items-start gap-2"
          style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
        >
          <Info size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--eco-text-tertiary)' }} />
          <p className="text-[12px] leading-snug" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Сброс пароля работает только через подтверждённый email. Если вы регистрировались по телефону и не добавили почту в профиле, войдите по номеру телефона — или обратитесь в поддержку.',
              'Құпиясөзді қалпына келтіру тек расталған email арқылы жұмыс істейді. Телефон арқылы тіркеліп, профильге пошта қоспаған болсаңыз, телефон нөміріңізбен кіріңіз немесе қолдау қызметіне хабарласыңыз.',
              'Password reset only works through a verified email. If you signed up by phone and never added an email in your profile, sign in with your phone number — or contact support.',
            )}
          </p>
        </div>
        <div className="text-center mt-4">
          <Link
            to="/login"
            className="text-[13px] inline-flex items-center gap-1"
            style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> {t('backToSignIn')}
          </Link>
        </div>
      </div>
    </div>
  );
}
