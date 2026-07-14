import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Card, Button } from '../ds-primitives';
import { CheckCircle2, XCircle, Clock, CreditCard } from 'lucide-react';
import {
  ApiError,
  confirmPayoutCardBindingRequest,
  type PayoutCardBindingConfirmDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/**
 * Landing page after the owner returns from the FreedomPay hosted page when connecting a
 * payout card. Finalizes the binding (saves the card token + registers the payout method),
 * polling briefly while the provider is still settling.
 */
export function CardConnectedPage() {
  const { isReady, isAuthenticated, authorizedRequest } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Prefer the query param, but fall back to localStorage — Freedom Pay's redirect does not
  // reliably preserve our query string, and localStorage is shared across the original tab.
  // Keep the id as a string: binding ids are 64-bit and Number() would corrupt them.
  const bindingId =
    params.get('binding') || window.localStorage.getItem('ecopay.pendingCardBinding') || '';
  const returnedStatus = params.get('status'); // success | failure (from the provider redirect)

  const [phase, setPhase] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;

    if (!isAuthenticated || !bindingId) {
      setPhase('failed');
      setMessage(
        tx(
          language,
          'Не удалось определить подключение карты.',
          'Карта қосылымын анықтау мүмкін болмады.',
          "Couldn't identify the card connection.",
        ),
      );
      return;
    }

    if (returnedStatus === 'failure') {
      setPhase('failed');
      setMessage(
        tx(
          language,
          'Подключение карты было отменено или не удалось.',
          'Карта қосу тоқтатылды немесе сәтсіз аяқталды.',
          'Card connection was cancelled or failed.',
        ),
      );
      return;
    }

    let cancelled = false;
    const MAX_ATTEMPTS = 5;

    async function finalize() {
      try {
        let result: PayoutCardBindingConfirmDto = await authorizedRequest((token) =>
          confirmPayoutCardBindingRequest(bindingId, token),
        );
        for (let attempt = 1; attempt < MAX_ATTEMPTS && result.status === 'PENDING'; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (cancelled) return;
          result = await authorizedRequest((token) =>
            confirmPayoutCardBindingRequest(bindingId, token),
          );
        }
        if (cancelled) return;

        // Stop reusing this binding id once it reaches a terminal outcome.
        if (result.status === 'SUCCESS' || result.status === 'FAILED') {
          window.localStorage.removeItem('ecopay.pendingCardBinding');
        }

        if (result.status === 'SUCCESS') {
          setPhase('success');
        } else if (result.status === 'FAILED') {
          setPhase('failed');
          setMessage(result.message ?? null);
        } else {
          // still pending after polling — treat as not-yet-confirmed
          setPhase('failed');
          setMessage(
            tx(
              language,
              'Карта ещё подтверждается. Попробуйте обновить страницу через минуту.',
              'Карта әлі расталуда. Бір минуттан кейін бетті жаңартып көріңіз.',
              'The card is still being confirmed. Try refreshing in a minute.',
            ),
          );
        }
      } catch (err) {
        if (cancelled) return;
        setPhase('failed');
        setMessage(
          err instanceof ApiError
            ? err.message
            : tx(
                language,
                'Не удалось подтвердить подключение карты.',
                'Карта қосылымын растау мүмкін болмады.',
                "Couldn't confirm the card connection.",
              ),
        );
      }
    }

    void finalize();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, authorizedRequest, bindingId, returnedStatus, language]);

  if (phase === 'loading') {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col items-center text-center gap-4 py-12">
          <Clock size={32} className="animate-pulse" style={{ color: 'var(--eco-primary)' }} />
          <div className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
            {tx(
              language,
              'Подключаем вашу карту…',
              'Картаңызды қосудамыз…',
              'Connecting your card…',
            )}
          </div>
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Это займёт несколько секунд. Не закрывайте страницу.',
              'Бұл бірнеше секунд алады. Бетті жаппаңыз.',
              "This takes a few seconds. Please don't close this page.",
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col items-center text-center gap-5 py-10">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'var(--eco-success-100)' }}
          >
            <CheckCircle2 size={32} style={{ color: 'var(--eco-positive)' }} />
          </div>
          <div>
            <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Карта подключена', 'Карта қосылды', 'Card Connected')}
            </h2>
            <p
              className="text-[14px] mt-2 max-w-sm mx-auto"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {tx(
                language,
                'Ваша карта для выплат сохранена. Теперь вы можете создавать комнаты: выплаты будут приходить на эту карту.',
                'Төлем картаңыз сақталды. Енді бөлме жасай аласыз: төлемдер осы картаға түседі.',
                'Your payout card is saved. You can now create rooms: payouts will be sent to this card.',
              )}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="primary" size="lg" onClick={() => navigate('/rooms/create')}>
              {tx(language, 'Создать комнату', 'Бөлме жасау', 'Create Room')}
            </Button>
            <Link to="/payment/payout" style={{ textDecoration: 'none' }}>
              <Button variant="secondary" size="lg">
                {tx(language, 'Мои выплаты', 'Менің төлемдерім', 'My Payouts')}
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Card className="flex flex-col items-center text-center gap-5 py-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--eco-danger-100)' }}
        >
          <XCircle size={32} style={{ color: 'var(--eco-negative)' }} />
        </div>
        <div>
          <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
            {tx(
              language,
              'Не удалось подключить карту',
              'Картаны қосу мүмкін болмады',
              'Card Not Connected',
            )}
          </h2>
          <p
            className="text-[14px] mt-2 max-w-sm mx-auto"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {message ??
              tx(language, 'Попробуйте ещё раз.', 'Қайталап көріңіз.', 'Please try again.')}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => navigate('/rooms/create')}>
          <CreditCard size={14} /> {tx(language, 'Попробовать снова', 'Қайталау', 'Try Again')}
        </Button>
      </Card>
    </div>
  );
}
