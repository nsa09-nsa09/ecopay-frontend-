import { useState } from 'react';
import { Button, Input, Card } from '../ds-primitives';
import { Smartphone } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import { useAuth } from './auth-provider';
import { ApiError, resendPhoneCodeRequest } from '../../lib/api';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/**
 * "Confirm your phone" step shown right after phone registration (and when an
 * unverified phone account tries to sign in). Confirming the 6-digit SMS code
 * verifies the phone and logs the user in, then calls {@link onVerified}.
 */
export function VerifyPhoneStep({
  phone,
  onVerified,
  onBack,
}: {
  phone: string;
  onVerified: () => void;
  onBack: () => void;
}) {
  const { language } = useI18n();
  const { verifyPhoneCode } = useAuth();
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
      await resendPhoneCodeRequest(phone);
      setMessage(
        tx(
          language,
          'Мы отправили новый код по SMS.',
          'Біз SMS арқылы жаңа код жібердік.',
          'We sent a new code by SMS.',
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
      await verifyPhoneCode(phone, code);
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
            <Smartphone size={26} style={{ color: 'var(--eco-brand-600)' }} />
          </div>
          <h1 className="text-[24px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Подтвердите телефон', 'Телефонды растаңыз', 'Confirm your phone')}
          </h1>
          <p className="text-[13px] mt-2" style={{ color: 'var(--eco-text-secondary)' }}>
            {language === 'ru' ? (
              <>
                Мы отправили 6-значный код по SMS на <strong>{phone}</strong>. Введите его, чтобы
                завершить регистрацию.
              </>
            ) : language === 'kz' ? (
              <>
                Біз <strong>{phone}</strong> нөміріне SMS арқылы 6 таңбалы код жібердік. Тіркелуді
                аяқтау үшін оны енгізіңіз.
              </>
            ) : (
              <>
                We sent a 6-digit code by SMS to <strong>{phone}</strong>. Enter it to finish
                registration.
              </>
            )}
          </p>
        </div>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleVerify}>
            <Input
              label={tx(language, 'Код из SMS', 'SMS-тен код', 'SMS code')}
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              hint={tx(language, '6 цифр из сообщения', 'Хабарламадан 6 цифр', '6-digit code from the message')}
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
