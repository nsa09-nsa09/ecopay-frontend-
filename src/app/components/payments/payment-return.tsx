import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Card, Button } from '../ds-primitives';
import {
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  MessageSquare,
  History,
  ShieldAlert,
} from 'lucide-react';
import {
  ApiError,
  confirmPaymentSuccessRequest,
  getPaymentIntentRequest,
  type PaymentIntentResponseDto,
} from '../../lib/api';
import {
  PAYMENT_RETURN_POLL_DELAYS_MS,
  classifyPaymentStatus,
  clearPendingPaymentContext,
  isFinalPaymentState,
  readPendingPaymentContext,
  stripProviderReturnParams,
  type PaymentUiState,
  type PendingPaymentContext,
} from '../../lib/payment-context';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const moneyFormatter = new Intl.NumberFormat('ru-RU');
const formatMoney = (v: number | string | null | undefined, currency = 'KZT') => {
  const formatted = moneyFormatter.format(Number(v ?? 0));
  return currency === 'KZT' ? `₸${formatted}` : `${currency} ${formatted}`;
};
const settlementAmount = (intent: PaymentIntentResponseDto | null) =>
  intent?.payableTotalKzt ?? intent?.amount ?? 0;
const settlementCurrency = (intent: PaymentIntentResponseDto | null) =>
  intent?.settlementCurrency ?? intent?.currency ?? 'KZT';

/** Manual "Refresh status" is rate-limited client side so it cannot hammer reconciliation. */
const MANUAL_REFRESH_COOLDOWN_MS = 5000;

type Phase =
  /** First reconciliation request in flight. */
  | 'loading'
  /** Backend returned an intent (possibly still not final). */
  | 'result'
  /** Backend unreachable / unexpected error — status unknown, never shown as "failed". */
  | 'unreachable'
  /** Not signed in (or the session expired): the user must sign in to see the status. */
  | 'signin'
  /** No payment context in the URL or storage (e.g. the URL was opened by hand). */
  | 'missing';

/**
 * Landing page for the FreedomPay redirect-back (success_url / failure_url).
 *
 * Reaching this page proves nothing about the money: the browser redirect can
 * arrive before or after the provider callback, and either URL can be opened
 * by hand. The page asks the backend to reconcile, polls for a bounded time
 * while the status is not final, then stops and offers a manual refresh. It
 * shows success only when the backend reports SUCCESS.
 */
export function PaymentReturnPage() {
  const { isReady, isAuthenticated, authorizedRequest } = useAuth();
  const { language } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();

  const context = useMemo<PendingPaymentContext | null>(
    () => readPendingPaymentContext(location.search),
    [location.search],
  );
  const [intent, setIntent] = useState<PaymentIntentResponseDto | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [polling, setPolling] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);
  const startedRef = useRef<string | null>(null);
  const runIdRef = useRef(0);
  const lastManualRefreshRef = useRef(0);

  // Provider parameters (pg_*) are not needed by the page; keep them out of
  // the address bar, browser history and later referrers.
  useEffect(() => {
    const cleaned = stripProviderReturnParams(window.location.search);
    if (cleaned !== window.location.search) {
      window.history.replaceState(
        window.history.state,
        '',
        `${window.location.pathname}${cleaned}${window.location.hash}`,
      );
    }
  }, []);

  const applyResult = useCallback(
    (result: PaymentIntentResponseDto) => {
      setIntent(result);
      setPhase('result');
      if (context && isFinalPaymentState(classifyPaymentStatus(result.status))) {
        clearPendingPaymentContext(context);
      }
    },
    [context],
  );

  const handleError = useCallback((err: unknown) => {
    if (err instanceof ApiError && err.status === 401) {
      setPhase('signin');
      return;
    }
    // Keep a previously received status on screen; otherwise show "unknown".
    setPhase((current) => (current === 'result' ? current : 'unreachable'));
  }, []);

  useEffect(() => {
    if (!isReady) return;
    const contextKey = `${context?.intentId ?? 'missing'}|${isAuthenticated ? 'auth' : 'anon'}`;
    if (startedRef.current === contextKey) return;
    startedRef.current = contextKey;
    runIdRef.current += 1;
    const runId = runIdRef.current;
    setIntent(null);
    setRefreshNote(null);

    if (!context) {
      setPhase('missing');
      return;
    }
    if (!isAuthenticated) {
      setPhase('signin');
      return;
    }

    setPhase('loading');
    const intentId = context.intentId;
    const isCurrent = () => runIdRef.current === runId;
    const timers: number[] = [];
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms));
      });

    async function reconcile() {
      try {
        // Actively reconciles with the gateway and finalizes the intent if paid.
        let result = await authorizedRequest((token) =>
          confirmPaymentSuccessRequest(intentId, token),
        );
        if (!isCurrent()) return;
        applyResult(result);

        // Bounded automatic polling while the status is not final.
        setPolling(true);
        for (const delay of PAYMENT_RETURN_POLL_DELAYS_MS) {
          if (isFinalPaymentState(classifyPaymentStatus(result.status))) break;
          await wait(delay);
          if (!isCurrent()) return;
          result = await authorizedRequest((token) => getPaymentIntentRequest(intentId, token));
          if (!isCurrent()) return;
          applyResult(result);
        }
      } catch (err) {
        if (!isCurrent()) return;
        handleError(err);
      } finally {
        if (isCurrent()) setPolling(false);
      }
    }

    void reconcile();
    return () => {
      // Invalidate this run; pending timers resolve into no-ops.
      if (runIdRef.current === runId) runIdRef.current += 1;
      startedRef.current = null;
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [isReady, isAuthenticated, authorizedRequest, context, applyResult, handleError]);

  const refreshStatus = async () => {
    if (!context || refreshing || polling) return;
    const now = Date.now();
    if (now - lastManualRefreshRef.current < MANUAL_REFRESH_COOLDOWN_MS) {
      setRefreshNote(
        tx(
          language,
          'Статус только что обновлялся. Попробуйте через несколько секунд.',
          'Мәртебе жаңа ғана жаңартылды. Бірнеше секундтан кейін қайталаңыз.',
          'The status was just refreshed. Try again in a few seconds.',
        ),
      );
      return;
    }
    lastManualRefreshRef.current = now;
    setRefreshing(true);
    setRefreshNote(null);
    try {
      const result = await authorizedRequest((token) =>
        confirmPaymentSuccessRequest(context.intentId, token),
      );
      applyResult(result);
      if (!isFinalPaymentState(classifyPaymentStatus(result.status))) {
        setRefreshNote(
          tx(
            language,
            'Статус пока не изменился. Мы продолжаем проверку.',
            'Мәртебе әзірге өзгерген жоқ. Тексеруді жалғастырып жатырмыз.',
            'No change yet. We are still checking.',
          ),
        );
      }
    } catch (err) {
      handleError(err);
      if (!(err instanceof ApiError && err.status === 401)) {
        setRefreshNote(
          tx(
            language,
            'Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.',
            'Сервермен байланысу мүмкін болмады. Қосылымды тексеріп, қайталаңыз.',
            'Could not reach the server. Check your connection and try again.',
          ),
        );
      }
    } finally {
      setRefreshing(false);
    }
  };

  const membershipPath = context?.roomId ? `/rooms/member/${context.roomId}` : '/rooms';
  const goToMembership = () => navigate(membershipPath);
  const returnParams = new URLSearchParams();
  if (context) {
    returnParams.set('intentId', context.intentId);
    if (context.roomId) returnParams.set('roomId', context.roomId);
    if (context.roomMemberId) returnParams.set('roomMemberId', context.roomMemberId);
  }
  const returnQuery = returnParams.toString();
  const returnPath = `${location.pathname}${returnQuery ? `?${returnQuery}` : ''}`;

  const doNotPayAgain = tx(
    language,
    'Мы проверяем статус платежа. Не оплачивайте повторно.',
    'Төлем мәртебесін тексеріп жатырмыз. Қайта төлемеңіз.',
    'We are checking the payment status. Do not pay again.',
  );
  const safeToLeave = tx(
    language,
    'Можно закрыть страницу: результат появится на странице участия и в истории платежей.',
    'Бетті жабуға болады: нәтиже қатысу бетінде және төлем тарихында көрінеді.',
    'You can leave this page: the result will appear on your membership page and in payment history.',
  );

  const historyLink = (
    <Link to="/payments/history" style={{ textDecoration: 'none' }}>
      <Button variant="secondary" size="lg">
        <History size={14} aria-hidden="true" />{' '}
        {tx(language, 'История платежей', 'Төлем тарихы', 'Payment history')}
      </Button>
    </Link>
  );
  const supportLink = (
    <Link to="/support/new" style={{ textDecoration: 'none' }}>
      <Button variant="secondary" size="lg">
        <MessageSquare size={14} aria-hidden="true" />{' '}
        {tx(language, 'Поддержка', 'Қолдау', 'Support')}
      </Button>
    </Link>
  );
  const refreshButton = (
    <Button
      variant="primary"
      size="lg"
      loading={refreshing || polling}
      onClick={() => void refreshStatus()}
    >
      {!(refreshing || polling) && <RefreshCw size={14} aria-hidden="true" />}
      {tx(language, 'Обновить статус', 'Мәртебені жаңарту', 'Refresh status')}
    </Button>
  );

  const shell = (children: ReactNode) => (
    <div className="max-w-[640px] mx-auto px-4 sm:px-6 py-8">
      <Card className="flex flex-col items-center text-center gap-5 py-10">
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-5 w-full">
          {children}
        </div>
      </Card>
    </div>
  );

  if (phase === 'loading') {
    return shell(
      <>
        <Clock size={32} className="animate-pulse" style={{ color: 'var(--eco-primary)' }} />
        <h1 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
          {tx(
            language,
            'Проверяем статус платежа...',
            'Төлем мәртебесін тексеріп жатырмыз...',
            'Checking your payment status...',
          )}
        </h1>
        <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'Это может занять несколько секунд. Не оплачивайте повторно.',
            'Бұл бірнеше секунд алуы мүмкін. Қайта төлемеңіз.',
            'This can take a few seconds. Do not pay again.',
          )}
        </p>
      </>,
    );
  }

  if (phase === 'missing') {
    return shell(
      <>
        <Clock size={32} style={{ color: 'var(--eco-text-tertiary)' }} />
        <h1 className="text-[18px]" style={{ color: 'var(--eco-text)' }}>
          {tx(language, 'Платёж не найден', 'Төлем табылмады', 'No payment to show')}
        </h1>
        <p className="text-[14px] max-w-sm" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'На этой странице нет данных о платеже. Актуальные статусы всех платежей — в истории платежей.',
            'Бұл бетте төлем туралы дерек жоқ. Барлық төлемдердің мәртебесі төлем тарихында.',
            'This page has no payment details. The status of every payment is in your payment history.',
          )}
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          {historyLink}
          <Link to="/rooms" style={{ textDecoration: 'none' }}>
            <Button variant="primary" size="lg">
              {tx(language, 'К моим комнатам', 'Менің бөлмелеріме', 'Go to My Rooms')}
            </Button>
          </Link>
        </div>
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
            'Войдите, чтобы увидеть статус платежа',
            'Төлем мәртебесін көру үшін кіріңіз',
            'Sign in to see your payment status',
          )}
        </h1>
        <p className="text-[14px] max-w-sm" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            'Сессия истекла или вы не вошли. Платёж не потерян — после входа мы покажем его актуальный статус. Не оплачивайте повторно.',
            'Сессия аяқталды немесе сіз кірмегенсіз. Төлем жоғалған жоқ — кіргеннен кейін оның мәртебесін көрсетеміз. Қайта төлемеңіз.',
            'Your session expired or you are signed out. The payment is not lost — after you sign in we will show its current status. Do not pay again.',
          )}
        </p>
        <Link
          to={`/login?redirect=${encodeURIComponent(returnPath)}`}
          style={{ textDecoration: 'none' }}
        >
          <Button variant="primary" size="lg">
            {tx(language, 'Войти', 'Кіру', 'Sign in')}
          </Button>
        </Link>
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
            'Не удалось получить статус платежа',
            'Төлем мәртебесін алу мүмкін болмады',
            "We couldn't get the payment status",
          )}
        </h1>
        <p className="text-[14px] max-w-sm" style={{ color: 'var(--eco-text-secondary)' }}>
          {doNotPayAgain} {safeToLeave}
        </p>
        {refreshNote && (
          <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
            {refreshNote}
          </p>
        )}
        <div className="flex flex-wrap gap-3 justify-center">
          {refreshButton}
          {historyLink}
        </div>
      </>,
    );
  }

  const state: PaymentUiState = classifyPaymentStatus(intent?.status);

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
            {tx(language, 'Платёж успешен', 'Төлем сәтті', 'Payment Successful')}
          </h1>
          <p
            className="text-[14px] mt-2 max-w-sm mx-auto"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {tx(
              language,
              `Ваш платёж ${formatMoney(settlementAmount(intent), settlementCurrency(intent))} получен. EcoPay временно удерживает деньги до выплаты владельцу; спор или возврат может остановить выплату.`,
              `${formatMoney(settlementAmount(intent), settlementCurrency(intent))} төлеміңіз қабылданды. EcoPay ақшаны иесіне аударғанға дейін уақытша ұстайды; дау немесе қайтарым аударымды тоқтатуы мүмкін.`,
              `Your payment of ${formatMoney(settlementAmount(intent), settlementCurrency(intent))} has been received. EcoPay temporarily holds the money until the owner payout; a dispute or refund may stop the payout.`,
            )}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={goToMembership}>
          {tx(language, 'К участию', 'Қатысуға өту', 'Go to Membership')}
        </Button>
      </>,
    );
  }

  if (state === 'failed') {
    return shell(
      <>
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: 'var(--eco-danger-100)' }}
        >
          <XCircle size={32} style={{ color: 'var(--eco-negative)' }} />
        </div>
        <div>
          <h1 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
            {tx(language, 'Платёж не прошёл', 'Төлем өтпеді', 'Payment Failed')}
          </h1>
          <p
            className="text-[14px] mt-2 max-w-sm mx-auto"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {tx(
              language,
              'Платёж не завершён. Можно попробовать ещё раз со страницы участия.',
              'Төлем аяқталмады. Қатысу бетінен қайта көруге болады.',
              'The payment did not complete. You can try again from your membership page.',
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          <Button variant="primary" size="lg" onClick={goToMembership}>
            {tx(language, 'Вернуться к участию', 'Қатысуға оралу', 'Back to Membership')}
          </Button>
          {supportLink}
        </div>
      </>,
    );
  }

  if (state === 'refund' || state === 'refunded') {
    return shell(
      <>
        <Clock size={32} style={{ color: 'var(--eco-warning)' }} />
        <div>
          <h1 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
            {state === 'refunded'
              ? tx(language, 'Платёж возвращён', 'Төлем қайтарылды', 'Payment Refunded')
              : tx(language, 'Возврат запущен', 'Қайтарым басталды', 'Refund Started')}
          </h1>
          <p
            className="text-[14px] mt-2 max-w-sm mx-auto"
            style={{ color: 'var(--eco-text-secondary)' }}
          >
            {tx(
              language,
              'Провайдер подтвердил списание, но место уже недоступно. Доступ не выдан, выплата владельцу не создана; статус возврата доступен в истории платежей.',
              'Провайдер төлемді растады, бірақ орын қолжетімсіз. Қолжетімділік берілмеді, иесіне төлем жасалмады; қайтарым мәртебесі төлем тарихында көрінеді.',
              'The provider confirmed the charge, but the seat is no longer available. No access or owner payout was created; refund status is visible in payment history.',
            )}
          </p>
          {state === 'refund' && (
            <p className="text-[13px] mt-2" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Не оплачивайте повторно.', 'Қайта төлемеңіз.', 'Do not pay again.')}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {historyLink}
          <Button variant="primary" size="lg" onClick={goToMembership}>
            {tx(language, 'К участию', 'Қатысуға өту', 'Go to Membership')}
          </Button>
        </div>
      </>,
    );
  }

  // 'checking' and 'review': not final, never success, never an invitation to pay again.
  const review = state === 'review';
  return shell(
    <>
      <Clock size={32} style={{ color: 'var(--eco-warning)' }} />
      <div>
        <h1 className="text-[22px]" style={{ color: 'var(--eco-text)' }}>
          {review
            ? tx(language, 'Платёж на проверке', 'Төлем тексерілуде', 'Payment Under Review')
            : tx(language, 'Платёж обрабатывается', 'Төлем өңделуде', 'Payment Processing')}
        </h1>
        <p
          className="text-[14px] mt-2 max-w-sm mx-auto"
          style={{ color: 'var(--eco-text-secondary)' }}
        >
          {doNotPayAgain}
        </p>
        <p
          className="text-[13px] mt-2 max-w-sm mx-auto"
          style={{ color: 'var(--eco-text-tertiary)' }}
        >
          {review
            ? tx(
                language,
                'Платёж передан на ручную проверку. Мы сообщим результат; при вопросах напишите в поддержку.',
                'Төлем қолмен тексеруге жіберілді. Нәтижесін хабарлаймыз; сұрақ болса, қолдауға жазыңыз.',
                'The payment was sent for manual review. We will notify you of the result; contact support if you have questions.',
              )
            : polling
              ? tx(
                  language,
                  'Автоматически обновляем статус...',
                  'Мәртебені автоматты түрде жаңартып жатырмыз...',
                  'Updating the status automatically...',
                )
              : safeToLeave}
        </p>
        {refreshNote && (
          <p className="text-[12px] mt-2" style={{ color: 'var(--eco-text-tertiary)' }}>
            {refreshNote}
          </p>
        )}
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {refreshButton}
        {review ? supportLink : historyLink}
        <Button variant="secondary" size="lg" onClick={goToMembership}>
          {tx(language, 'К участию', 'Қатысуға өту', 'Go to Membership')}
        </Button>
      </div>
    </>,
  );
}
