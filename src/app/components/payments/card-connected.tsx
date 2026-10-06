import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { Card, Button } from '../ds-primitives';
import { CheckCircle2, XCircle, Clock, CreditCard, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  ApiError,
  confirmPayoutCardBindingRequest,
  type PayoutCardBindingConfirmDto,
} from '../../lib/api';
import { isSafeId } from '../../lib/payment-context';
import {
  classifyBindingResult,
  clearPendingBinding,
  readPendingBinding,
  startPayoutCardBinding,
  type BindingUiState,
} from '../../lib/payout-binding';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

/** Automatic confirmation checks (~25 s), then a manual refresh. Never polls forever. */
const BINDING_POLL_DELAYS_MS = [2000, 3000, 5000, 6000, 8000] as const;

type Phase = 'loading' | 'result' | 'unreachable' | 'signin' | 'missing';

/**
 * Landing page after the owner returns from the provider's hosted page when
 * connecting a payout card. The card counts as connected only when the backend
 * confirms it; the provider's success/failure redirect is a hint, not proof.
 */
export function CardConnectedPage() {
  const { isReady, isAuthenticated, authorizedRequest } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  // Prefer the query param, but fall back to storage — the provider redirect
  // does not reliably preserve our query string. Ids stay strings (64-bit).
  // Resolved once per URL: the stored id is cleared when the outcome is final,
  // which must not turn this page into the "no connection" state.
  const paramBinding = params.get('binding');
  const bindingId = useMemo(
    () => (isSafeId(paramBinding) ? paramBinding : readPendingBinding()),
    [paramBinding],
  );

  const [phase, setPhase] = useState<Phase>('loading');
  const [state, setState] = useState<BindingUiState>('pending');
  const [polling, setPolling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [restartError, setRestartError] = useState<string | null>(null);
  const runIdRef = useRef(0);
  const startedRef = useRef<string | null>(null);

  const applyResult = useCallback((result: PayoutCardBindingConfirmDto) => {
    const next = classifyBindingResult(result);
    setState(next);
    setPhase('result');
    // Stop reusing this binding id once it reached a final outcome.
    if (next !== 'pending') clearPendingBinding();
    return next;
  }, []);

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      setPhase('signin');
      return;
    }
    setPhase((current) => (current === 'result' ? current : 'unreachable'));
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const key = `${bindingId ?? 'missing'}|${isAuthenticated ? 'auth' : 'anon'}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
    runIdRef.current += 1;
    const runId = runIdRef.current;

    if (!bindingId) {
      setPhase('missing');
      return;
    }
    if (!isAuthenticated) {
      setPhase('signin');
      return;
    }
    setPhase('loading');
    const isCurrent = () => runIdRef.current === runId;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    async function finalize() {
      try {
        let result = await authorizedRequest((token) =>
          confirmPayoutCardBindingRequest(bindingId!, token),
        );
        if (!isCurrent()) return;
        let next = applyResult(result);
        setPolling(true);
        for (const delay of BINDING_POLL_DELAYS_MS) {
          if (next !== 'pending') break;
          await wait(delay);
          if (!isCurrent()) return;
          result = await authorizedRequest((token) =>
            confirmPayoutCardBindingRequest(bindingId!, token),
          );
          if (!isCurrent()) return;
          next = applyResult(result);
        }
      } catch (err) {
        if (!isCurrent()) return;
        handleError(err);
      } finally {
        if (isCurrent()) setPolling(false);
      }
    }

    void finalize();
    return () => {
      if (runIdRef.current === runId) runIdRef.current += 1;
      startedRef.current = null;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isReady, isAuthenticated, authorizedRequest, bindingId, applyResult, handleError]);

  const refresh = async () => {
    if (!bindingId || refreshing || polling) return;
    setRefreshing(true);
    try {
      const result = await authorizedRequest((token) =>
        confirmPayoutCardBindingRequest(bindingId, token),
      );
      applyResult(result);
    } catch (err) {
      handleError(err);
    } finally {
      setRefreshing(false);
    }
  };

  const restart = async () => {
    if (restarting) return;
    setRestarting(true);
    setRestartError(null);
    try {
      const url = await startPayoutCardBinding(authorizedRequest);
      window.location.assign(url);
    } catch (err) {
      setRestarting(false);
      setRestartError(
        err instanceof ApiError && err.status !== 0 && err.status < 500
          ? err.message
          : tx(
              language,
              'Не удалось начать подключение карты. Попробуйте ещё раз чуть позже.',
              'Картаны қосуды бастау мүмкін болмады. Сәл кейін қайталаңыз.',
              "Couldn't start the card connection. Please try again shortly.",
            ),
      );
    }
  };

  const shell = (children: ReactNode) => (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Card className="flex flex-col items-center text-center gap-5 py-10">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 w-full">
          {children}
        </div>
      </Card>
    </div>
  );

  const restartButton = (label: string) => (
    <Button variant="primary" size="lg" loading={restarting} onClick={() => void restart()}>
      {!restarting && <CreditCard size={14} aria-hidden="true" />} {label}
    </Button>
  );
  const payoutsLink = (
    <Link to="/payment/payout" style={{ textDecoration: 'none' }}>
      <Button variant="secondary" size="lg">
        {tx(language, 'Мои выплаты', 'Менің төлемдерім', 'My Payouts')}
      </Button>
    </Link>
  );
  const restartErrorNote = restartError ? (
    <p className="text-[13px]" role="alert" style={{ color: 'var(--eco-negative)' }}>
      {restartError}
    </p>
  ) : null;

  if (phase === 'loading') {
    return shell(
      <>
        <Clock size={32} className="animate-pulse" style={{ color: 'var(--eco-primary)' }} />
        <h1 className="text-[16px]" style={{ color: 'var(--eco-text)' }}>
          {tx(
            language,
            'Проверяем подключение карты…',
            'Карта қосылымын тексеріп жатырмыз…',
            'Checking your card connection…',
          )}
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'Это займёт несколько секунд.',
            'Бұл бірнеше секунд алады.',
            'This takes a few seconds.',
          )}
        </p>
      </>,
    );
  }

  if (phase === 'signin') {
    return shell(
      <>
        <ShieldAlert size={32} style={{ color: 'var(--eco-warning)' }} />
        <h1 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
          {tx(
            language,
            'Войдите, чтобы завершить подключение карты',
            'Картаны қосуды аяқтау үшін кіріңіз',
            'Sign in to finish connecting your card',
          )}
        </h1>
        <Link
          to={`/login?redirect=${encodeURIComponent(
            bindingId ? `/payment/card-connected?binding=${bindingId}` : '/payment/payout',
          )}`}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="primary" size="lg">
            {tx(language, 'Войти', 'Кіру', 'Sign in')}
          </Button>
        </Link>
      </>,
    );
  }

  if (phase === 'missing') {
    return shell(
      <>
        <CreditCard size={32} style={{ color: 'var(--eco-text-tertiary)' }} />
        <h1 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
          {tx(
            language,
            'Нет данных о подключении карты',
            'Карта қосылымы туралы дерек жоқ',
            'No card connection to check',
          )}
        </h1>
        <p className="text-[14px] max-w-sm" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'Статус карты для выплат виден на странице выплат.',
            'Төлем картасының мәртебесі аударымдар бетінде көрінеді.',
            'Your payout card status is shown on the payouts page.',
          )}
        </p>
        {payoutsLink}
      </>,
    );
  }

  if (phase === 'unreachable') {
    return shell(
      <>
        <Clock size={32} style={{ color: 'var(--eco-warning)' }} />
        <h1 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
          {tx(
            language,
            'Не удалось проверить подключение карты',
            'Карта қосылымын тексеру мүмкін болмады',
            "We couldn't check the card connection",
          )}
        </h1>
        <p className="text-[14px] max-w-sm" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'Проверьте подключение к интернету и обновите статус. Повторно вводить карту пока не нужно.',
            'Интернет қосылымын тексеріп, мәртебені жаңартыңыз. Картаны қайта енгізудің әзірге қажеті жоқ.',
            'Check your connection and refresh the status. There is no need to enter the card again yet.',
          )}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="primary" size="lg" loading={refreshing} onClick={() => void refresh()}>
            {!refreshing && <RefreshCw size={14} aria-hidden="true" />}
            {tx(language, 'Обновить статус', 'Мәртебені жаңарту', 'Refresh status')}
          </Button>
          {payoutsLink}
        </div>
      </>,
    );
  }

  if (state === 'success') {
    return shell(
      <>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--eco-success-100)' }}
        >
          <CheckCircle2 size={32} style={{ color: 'var(--eco-positive)' }} />
        </div>
        <div>
          <h1 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Карта подключена', 'Карта қосылды', 'Card Connected')}
          </h1>
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
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="primary" size="lg" onClick={() => navigate('/rooms/create')}>
            {tx(language, 'Создать комнату', 'Бөлме жасау', 'Create Room')}
          </Button>
          {payoutsLink}
        </div>
      </>,
    );
  }

  if (state === 'pending') {
    return shell(
      <>
        <Clock size={32} style={{ color: 'var(--eco-warning)' }} />
        <h1 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
          {tx(
            language,
            'Карта ещё подтверждается',
            'Карта әлі расталуда',
            'Card Still Being Confirmed',
          )}
        </h1>
        <p className="text-[14px] max-w-sm" style={{ color: 'var(--eco-text-secondary)' }}>
          {polling
            ? tx(
                language,
                'Автоматически обновляем статус...',
                'Мәртебені автоматты түрде жаңартып жатырмыз...',
                'Updating the status automatically...',
              )
            : tx(
                language,
                'Подтверждение занимает больше обычного. Обновите статус через минуту — повторно вводить карту не нужно.',
                'Растау әдеттегіден ұзаққа созылды. Бір минуттан кейін мәртебені жаңартыңыз — картаны қайта енгізудің қажеті жоқ.',
                'Confirmation is taking longer than usual. Refresh in a minute — there is no need to enter the card again.',
              )}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="primary"
            size="lg"
            loading={refreshing || polling}
            onClick={() => void refresh()}
          >
            {!(refreshing || polling) && <RefreshCw size={14} aria-hidden="true" />}
            {tx(language, 'Обновить статус', 'Мәртебені жаңарту', 'Refresh status')}
          </Button>
          {payoutsLink}
        </div>
      </>,
    );
  }

  const rebind = state === 'rebind';
  return shell(
    <>
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ background: rebind ? 'var(--eco-warning-100)' : 'var(--eco-danger-100)' }}
      >
        <XCircle
          size={32}
          style={{ color: rebind ? 'var(--eco-warning)' : 'var(--eco-negative)' }}
        />
      </div>
      <div>
        <h1 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
          {rebind
            ? tx(
                language,
                'Карту нужно подключить заново',
                'Картаны қайта қосу қажет',
                'Card Needs Reconnecting',
              )
            : tx(
                language,
                'Не удалось подключить карту',
                'Картаны қосу мүмкін болмады',
                'Card Not Connected',
              )}
        </h1>
        <p
          className="text-[14px] mt-2 max-w-sm mx-auto"
          style={{ color: 'var(--eco-text-secondary)' }}
        >
          {rebind
            ? tx(
                language,
                'Платёжный провайдер не подтвердил карту для выплат. Подключите её ещё раз, чтобы получать выплаты.',
                'Төлем провайдері картаны аударымдар үшін растамады. Аударым алу үшін оны қайта қосыңыз.',
                'The payment provider did not confirm this card for payouts. Connect it again to receive payouts.',
              )
            : tx(
                language,
                'Подключение было отменено или карта не подошла. Попробуйте ещё раз или используйте другую карту.',
                'Қосу тоқтатылды немесе карта сәйкес келмеді. Қайталаңыз немесе басқа картаны қолданыңыз.',
                'The connection was cancelled or the card was not accepted. Try again or use another card.',
              )}
        </p>
      </div>
      {restartErrorNote}
      <div className="flex flex-wrap gap-3 justify-center">
        {restartButton(
          rebind
            ? tx(language, 'Подключить заново', 'Қайта қосу', 'Reconnect card')
            : tx(language, 'Подключить карту снова', 'Картаны қайта қосу', 'Connect card again'),
        )}
        {payoutsLink}
      </div>
    </>,
  );
}
