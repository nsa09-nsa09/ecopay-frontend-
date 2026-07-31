import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, Button } from '../ds-primitives';
import { CheckCircle2, XCircle, Clock, RefreshCw, MessageSquare } from 'lucide-react';
import {
  ApiError,
  confirmPaymentSuccessRequest,
  getPaymentIntentRequest,
  type PaymentIntentResponseDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';

const PENDING_KEY = 'ecopay.pendingPayment';
const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

interface PendingContext {
  // Strings: both are 64-bit ids serialized as strings by the backend
  // (see PaymentIntentResponseDto.id). member-detail stores them as strings.
  intentId: string;
  roomId: string;
}

function readContext(): PendingContext | null {
  try {
    const raw = window.localStorage.getItem(PENDING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingContext;
    if (typeof parsed.intentId === 'string' && typeof parsed.roomId === 'string') {
      return parsed;
    }
  } catch {
    // ignore malformed context
  }
  return null;
}

const moneyFormatter = new Intl.NumberFormat('ru-RU');
const formatMoney = (v: number | null | undefined) => `₸${moneyFormatter.format(Number(v ?? 0))}`;

/**
 * Landing page for the Freedom Pay redirect-back (success_url / failure_url).
 * It reconciles the payment intent with the gateway via confirm-success, polls
 * briefly while the status is still PENDING, then shows the outcome and routes
 * the user back to their membership.
 */
export function PaymentReturnPage() {
  const { isReady, isAuthenticated, authorizedRequest } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();

  const [context] = useState<PendingContext | null>(() => readContext());
  const [intent, setIntent] = useState<PaymentIntentResponseDto | null>(null);
  const [phase, setPhase] = useState<'loading' | 'done' | 'error'>('loading');
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isReady || startedRef.current) return;
    startedRef.current = true;

    if (!isAuthenticated || !context) {
      setPhase('error');
      setError(
        context
          ? tx(
              language,
              'Войдите, чтобы посмотреть статус платежа.',
              'Төлем мәртебесін көру үшін кіріңіз.',
              'Please sign in to view your payment status.',
            )
          : tx(
              language,
              'Ожидающий платёж не найден.',
              'Күтіліп тұрған төлем табылмады.',
              'No pending payment was found.',
            ),
      );
      return;
    }

    let cancelled = false;
    const MAX_ATTEMPTS = 5;

    const isTerminal = (status: string) =>
      status === 'SUCCESS' || status === 'FAILED' || status === 'EXPIRED';

    async function reconcile() {
      try {
        // First call actively reconciles with the gateway and finalizes if paid.
        let result = await authorizedRequest((token) =>
          confirmPaymentSuccessRequest(context!.intentId, token),
        );

        // If the gateway is still settling, poll the read endpoint a few times.
        for (let attempt = 1; attempt < MAX_ATTEMPTS && !isTerminal(result.status); attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (cancelled) return;
          result = await authorizedRequest((token) =>
            getPaymentIntentRequest(context!.intentId, token),
          );
        }

        if (cancelled) return;
        setIntent(result);
        setPhase('done');
        if (isTerminal(result.status)) {
          window.localStorage.removeItem(PENDING_KEY);
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : tx(
                language,
                'Не удалось подтвердить платёж.',
                'Төлемді растау мүмкін болмады.',
                'Unable to confirm your payment right now.',
              ),
        );
        setPhase('error');
      }
    }

    void reconcile();
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, authorizedRequest, context, language]);

  const goToMembership = () => {
    if (context) navigate(`/rooms/member/${context.roomId}`);
    else navigate('/rooms');
  };

  if (phase === 'loading') {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col items-center text-center gap-4 py-12">
          <Clock size={32} className="animate-pulse" style={{ color: 'var(--eco-primary)' }} />
          <div className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Подтверждаем платёж...', 'Төлемді растап жатырмыз...', 'Confirming your payment...')}
          </div>
          <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Это может занять несколько секунд. Не закрывайте страницу.',
              'Бұл бірнеше секунд алуы мүмкін. Бетті жаппаңыз.',
              "This can take a few seconds. Please don't close this page.",
            )}
          </div>
        </Card>
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
        <Card className="flex flex-col items-center text-center gap-4 py-12">
          <XCircle size={32} style={{ color: 'var(--eco-negative)' }} />
          <div className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
            {error}
          </div>
          <Link to="/rooms" style={{ textDecoration: 'none' }}>
            <Button variant="primary">
              {tx(language, 'К моим комнатам', 'Менің бөлмелеріме', 'Go to My Rooms')}
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const status = intent?.status ?? 'PENDING';
  const success = status === 'SUCCESS';
  const failed = status === 'FAILED' || status === 'EXPIRED';

  return (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Card className="flex flex-col items-center text-center gap-5 py-10">
        {success ? (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--eco-success-100)' }}
            >
              <CheckCircle2 size={32} style={{ color: 'var(--eco-positive)' }} />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Платёж успешен', 'Төлем сәтті', 'Payment Successful')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  language,
                  `Ваш платёж ${formatMoney(intent?.amount)} получен. Средства удерживаются до выдачи доступа владельцем и вашего подтверждения.`,
                  `${formatMoney(intent?.amount)} төлеміңіз қабылданды. Қаражат иесі қолжетімділік беріп, сіз растағанға дейін ұсталады.`,
                  `Your payment of ${formatMoney(intent?.amount)} has been received. Funds are held until the owner grants access and you confirm it.`,
                )}
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={goToMembership}>
              {tx(language, 'К участию', 'Қатысуға өту', 'Go to Membership')}
            </Button>
          </>
        ) : failed ? (
          <>
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: 'var(--eco-danger-100)' }}
            >
              <XCircle size={32} style={{ color: 'var(--eco-negative)' }} />
            </div>
            <div>
              <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Платёж не прошёл', 'Төлем өтпеді', 'Payment Failed')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  language,
                  'Платёж не завершён. Можно безопасно попробовать ещё раз: повторная обработка не приведёт к двойному списанию.',
                  'Төлем аяқталмады. Қауіпсіз түрде қайта көруге болады: қайталау қосарланған төлемге әкелмейді.',
                  'The payment did not complete. You can safely retry: idempotent processing means no double charge.',
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="primary" size="lg" onClick={goToMembership}>
                <RefreshCw size={14} />{' '}
                {tx(language, 'Вернуться к участию', 'Қатысуға оралу', 'Back to Membership')}
              </Button>
              <Link to="/support/new" style={{ textDecoration: 'none' }}>
                <Button variant="secondary" size="lg">
                  <MessageSquare size={14} /> {tx(language, 'Поддержка', 'Қолдау', 'Support')}
                </Button>
              </Link>
            </div>
          </>
        ) : (
          <>
            <Clock size={32} style={{ color: 'var(--eco-warning)' }} />
            <div>
              <h2 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
                {tx(language, 'Платёж обрабатывается', 'Төлем өңделуде', 'Payment Processing')}
              </h2>
              <p
                className="text-[14px] mt-2 max-w-sm mx-auto"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  language,
                  'Платёж ещё подтверждается. Статус можно проверить на странице участия, он обновится автоматически.',
                  'Төлем әлі расталып жатыр. Мәртебесін қатысу бетінде тексеруге болады, ол автоматты түрде жаңарады.',
                  'Your payment is still being confirmed. You can check the status on your membership page; it will update automatically once settled.',
                )}
              </p>
            </div>
            <Button variant="primary" size="lg" onClick={goToMembership}>
              {tx(language, 'К участию', 'Қатысуға өту', 'Go to Membership')}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
