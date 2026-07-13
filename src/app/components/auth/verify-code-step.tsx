import { useEffect, useRef, useState } from 'react';
import { Button, Input, Card } from '../ds-primitives';
import { Mail } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from './auth-provider';
import { ApiError, resendVerificationEmailRequest } from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/**
 * Shared "confirm your email" step used both right after registration and when
 * an unverified account tries to sign in. Confirming the 6-digit code verifies
 * the email and logs the user in (tokens issued), then calls {@link onVerified}.
 *
 * When {@link autoResendOnMount} is set (the sign-in path, where the original
 * code may have expired), a fresh code is requested as soon as the step opens.
 */
export function VerifyCodeStep({
  email,
  onVerified,
  onBack,
  autoResendOnMount = false,
}: {
  email: string;
  onVerified: () => void;
  onBack: () => void;
  autoResendOnMount?: boolean;
}) {
  const { language } = useI18n();
  const { verifyEmailCode } = useAuth();
  const [code, setCode] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const sendCode = async () => {
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      await resendVerificationEmailRequest(email);
      setMessage(
        tx(
          language,
          'Мы отправили новый код на вашу почту.',
          'Біз поштаңызға жаңа код жібердік.',
          'We sent a new code to your email.',
        ),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось отправить код повторно.',
              'Кодты қайта жіберу мүмкін болмады.',
              'Unable to resend the code right now.',
            ),
      );
    } finally {
      setResending(false);
    }
  };

  // On the sign-in path we can't trust the age of the original code, so push a
  // fresh one the moment the step opens (guarded so React StrictMode's double
  // mount doesn't fire two emails).
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoResendOnMount && !autoSentRef.current) {
      autoSentRef.current = true;
      void sendCode();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoResendOnMount]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (code.length !== 6) {
      setError(
        tx(language, 'Введите 6-значный код.', '6 таңбалы кодты енгізіңіз.', 'Enter the 6-digit code.'),
      );
      return;
    }
    setVerifying(true);
    try {
      await verifyEmailCode(email, code);
      onVerified();
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
      setVerifying(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--eco-brand-50)' }}
          >
            <Mail size={26} style={{ color: 'var(--eco-brand-600)' }} />
          </div>
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Подтвердите email', 'Email растаңыз', 'Confirm your email')}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--eco-text-secondary)' }}>
            {language === 'ru' ? (
              <>
                Мы отправили 6-значный код на <strong>{email}</strong>. Введите его, чтобы завершить
                регистрацию.
              </>
            ) : language === 'kz' ? (
              <>
                Біз <strong>{email}</strong> мекенжайына 6 таңбалы код жібердік. Тіркелуді аяқтау
                үшін оны енгізіңіз.
              </>
            ) : (
              <>
                We sent a 6-digit code to <strong>{email}</strong>. Enter it to finish registration.
              </>
            )}
          </p>
        </div>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleVerify}>
            <Input
              label={tx(language, 'Код подтверждения', 'Растау коды', 'Verification code')}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              hint={tx(language, '6 цифр из письма', 'Хаттан 6 цифр', '6-digit code from the email')}
              inputMode="numeric"
              placeholder="123456"
            />
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
              variant="primary"
              size="lg"
              className="w-full"
              loading={verifying}
              disabled={code.length !== 6}
            >
              {tx(language, 'Подтвердить и войти', 'Растау және кіру', 'Confirm & sign in')}
            </Button>
            <div className="flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={onBack}>
                {tx(language, 'Назад', 'Артқа', 'Back')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                loading={resending}
                onClick={() => void sendCode()}
              >
                {tx(language, 'Отправить код ещё раз', 'Кодты қайта жіберу', 'Resend code')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
