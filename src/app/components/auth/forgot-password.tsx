import { useState } from 'react';
import { Link } from 'react-router';
import { Button, Input, Card } from '../ds-primitives';
import { Mail, ArrowLeft } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from './auth-provider';
import { ApiError } from '../../lib/api';
import { localizeFieldErrors } from '../../lib/field-errors';

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
        setFieldErrors(localizeFieldErrors(err.errors, language));
      } else {
        setError(
          tx(
            language,
            'Не удалось отправить письмо для сброса пароля.',
            'Құпия сөзді қалпына келтіру хатын жіберу мүмкін болмады.',
            'Unable to send the reset email right now.',
          ),
        );
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
