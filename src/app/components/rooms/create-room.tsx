import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Card, Button, Input, Select, Stepper } from '../ds-primitives';
import { AlertTriangle, ArrowLeft, Lock, Check, CreditCard, Users } from 'lucide-react';
import {
  ApiError,
  createRoomRequest,
  getFxRatesRequest,
  getPayoutMethodsRequest,
  getServices,
  getTariffs,
  initPayoutCardBindingRequest,
  type FxRatesResponse,
  type RoomResponseDto,
  type ServiceDto,
  type SupportedCurrency,
  type TariffPlanDto,
} from '../../lib/api';
import { useAuth } from '../auth/auth-provider';
import { useI18n, type Language } from '../i18n-provider';
import { formatNumber } from '../../lib/datetime';

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
  CNY: '¥',
  GBP: '£',
  RUB: '₽',
  UZS: 'сум',
  KGS: 'сом',
};

interface CreateRoomLocationState {
  serviceId?: number;
  reason?: 'no-free-rooms' | string;
}

export function CreateRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as CreateRoomLocationState | null) ?? null;
  const { isAuthenticated, isReady, authorizedRequest, user } = useAuth();
  const { language, t } = useI18n();

  const stepLabels = [
    tx(language, 'Оператор и тариф', 'Оператор және тариф', 'Operator & Plan'),
    tx(language, 'Настройки комнаты', 'Бөлме баптаулары', 'Room Settings'),
    tx(language, 'Подтверждение оператора', 'Оператор растауы', 'Operator confirmation'),
    tx(language, 'Проверка', 'Тексеру', 'Review'),
  ];

  const PERIOD_OPTIONS = [
    { value: 'MONTHLY', label: tx(language, 'Ежемесячно', 'Айлық', 'Monthly') },
    { value: 'YEARLY', label: tx(language, 'Ежегодно', 'Жылдық', 'Yearly') },
    { value: 'OTHER', label: tx(language, 'Другое', 'Басқа', 'Other') },
  ];

  const periodLabel = (p: string | null | undefined) =>
    PERIOD_OPTIONS.find((o) => o.value === p)?.label ?? (p ?? '').toLowerCase();

  const [step, setStep] = useState(0);

  const [services, setServices] = useState<ServiceDto[]>([]);
  const [tariffs, setTariffs] = useState<TariffPlanDto[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState<string>('');
  const [tariffPlanId, setTariffPlanId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [connectionType, setConnectionType] = useState('ESIM');
  const [restrictions, setRestrictions] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [published, setPublished] = useState<RoomResponseDto | null>(null);

  // FX rates: the tariff's currency is fixed (admin-set); we still fetch live
  // rates so non-KZT plans can show their KZT equivalent in the review step.
  const [fxRates, setFxRates] = useState<FxRatesResponse | null>(null);
  const [fxError, setFxError] = useState<string | null>(null);

  // Owners are paid out monthly to a connected card, so the backend rejects room
  // creation without one. null = still checking; false = no active default card yet.
  const [hasPayoutCard, setHasPayoutCard] = useState<boolean | null>(null);
  const [connectingCard, setConnectingCard] = useState(false);
  const [awaitingCard, setAwaitingCard] = useState(false);
  const [cardError, setCardError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate('/login?redirect=/rooms/create');
    }
  }, [isReady, isAuthenticated, navigate]);

  // Mirror the backend gate (an active default payout method must exist).
  useEffect(() => {
    if (!isReady || !isAuthenticated) return;
    let cancelled = false;
    authorizedRequest((token) => getPayoutMethodsRequest(token))
      .then((methods) => {
        if (cancelled) return;
        setHasPayoutCard((methods ?? []).some((m) => m.isDefault && m.status === 'ACTIVE'));
      })
      .catch(() => {
        if (!cancelled) setHasPayoutCard(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isReady, isAuthenticated, authorizedRequest]);

  useEffect(() => {
    let cancelled = false;
    getFxRatesRequest()
      .then((res) => {
        if (cancelled) return;
        setFxRates(res);
        setFxError(null);
      })
      .catch(() => {
        if (!cancelled) setFxError(t('priceFxUnavailable'));
      });
    return () => {
      cancelled = true;
    };
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    getServices()
      .then((list) => {
        if (cancelled) return;
        setServices(list);
        const preferred =
          navState?.serviceId != null
            ? list.find((s) => String(s.id) === String(navState.serviceId))
            : undefined;
        if (preferred) {
          setServiceId(String(preferred.id));
        } else if (list.length > 0) {
          setServiceId(String(list[0].id));
        }
      })
      .catch(() => {
        if (!cancelled)
          setCatalogError(
            tx(
              language,
              'Не удалось загрузить каталог сервисов.',
              'Сервистер каталогын жүктеу мүмкін болмады.',
              'Unable to load the service catalog right now.',
            ),
          );
      });
    return () => {
      cancelled = true;
    };
    // navState.serviceId is read once at mount; further changes don't reseed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const selectedService = useMemo(
    () => services.find((s) => String(s.id) === serviceId) ?? null,
    [services, serviceId],
  );
  const serviceIdNumber = Number(serviceId);
  const tariffPlanIdNumber = Number(tariffPlanId);

  // Room type is derived from the selected service, not chosen by the owner.
  const isTelecom = selectedService ? selectedService.providerType !== 'DIGITAL' : false;
  const roomType = isTelecom ? 'TELECOM' : 'DIGITAL';

  const serviceGroups = useMemo(() => {
    const telecom = services.filter(
      (s) => s.providerType === 'OPERATOR' || s.providerType === 'ISP',
    );
    const digital = services.filter((s) => s.providerType === 'DIGITAL');
    return [
      {
        label: tx(language, 'Связь', 'Байланыс', 'Telecom'),
        options: telecom.map((s) => ({ value: String(s.id), label: s.name })),
      },
      {
        label: tx(language, 'Цифровые подписки', 'Цифрлық жазылымдар', 'Digital subscriptions'),
        options: digital.map((s) => ({ value: String(s.id), label: s.name })),
      },
    ];
  }, [services, language]);

  useEffect(() => {
    if (!serviceId) {
      setTariffs([]);
      setTariffPlanId('');
      return;
    }
    let cancelled = false;
    getTariffs(serviceIdNumber)
      .then((list) => {
        if (cancelled) return;
        setTariffs(list);
        setTariffPlanId('');
      })
      .catch(() => {
        if (!cancelled) setTariffs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId, serviceIdNumber]);

  const selectedTariff = useMemo(
    () => tariffs.find((t) => String(t.id) === tariffPlanId) ?? null,
    [tariffs, tariffPlanId],
  );

  const applyTariff = (id: string) => {
    setTariffPlanId(id);
    const tariff = tariffs.find((t) => String(t.id) === id);
    if (tariff) {
      // Price, seats, currency and period are owned by the tariff (admin-set) —
      // we only mirror the plan's connection type and prefill the title here.
      if (tariff.connectionType) {
        setConnectionType(tariff.connectionType);
      }
      if (!title) {
        setTitle(`${selectedService?.name ?? ''} ${tariff.name}`.trim());
      }
    }
  };

  // Pricing fields are derived from the selected tariff — never editable here.
  const seatCount = selectedTariff?.maxMembers ?? 0;
  const totalNumeric = Number(selectedTariff?.basePriceTotal ?? 0) || 0;
  const perMemberDerived = seatCount > 0 ? Math.round(totalNumeric / seatCount) : 0;
  const periodType = selectedTariff?.periodType ?? 'MONTHLY';
  const currency = (selectedTariff?.currency ?? 'KZT') as SupportedCurrency;

  // FX rates: 1 unit of `code` = N tenge. For KZT (base) the rate is 1.
  const rateToKzt = (code: SupportedCurrency): number | null => {
    if (code === 'KZT') return 1;
    const rate = fxRates?.rates?.[code];
    return typeof rate === 'number' && rate > 0 ? rate : null;
  };

  const currentRate = rateToKzt(currency);

  const convertToKzt = (amount: number): number | null => {
    if (currentRate == null) return null;
    if (!Number.isFinite(amount)) return null;
    return Math.round(amount * currentRate);
  };

  const perMemberKztEquivalent = convertToKzt(perMemberDerived);

  const moneyFmt = (n: number) =>
    new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 }).format(n);

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  // Re-check whether a payout card is now connected (used after the owner finishes in the
  // FreedomPay tab). Returns true once an active default method exists.
  const recheckPayoutCard = async (): Promise<boolean> => {
    try {
      const methods = await authorizedRequest((token) => getPayoutMethodsRequest(token));
      const ok = (methods ?? []).some((m) => m.isDefault && m.status === 'ACTIVE');
      if (ok) {
        setHasPayoutCard(true);
        setAwaitingCard(false);
      }
      return ok;
    } catch {
      return false;
    }
  };

  // Connect a payout card through the FreedomPay hosted page. We open it in a NEW TAB so this
  // half-filled room form is preserved, then poll for the card to appear once the owner finishes.
  const handleConnectCard = async () => {
    setConnectingCard(true);
    setCardError(null);
    // Must open the tab synchronously inside the click to avoid the popup blocker; we set its
    // URL after the binding is created.
    const tab = window.open('', '_blank');
    try {
      const res = await authorizedRequest((token) =>
        initPayoutCardBindingRequest(
          { returnUrl: `${window.location.origin}/payment/card-connected` },
          token,
        ),
      );
      if (res.paymentUrl) {
        window.localStorage.setItem('ecopay.pendingCardBinding', String(res.bindingId));
        if (tab) {
          tab.location.href = res.paymentUrl;
          setConnectingCard(false);
          setAwaitingCard(true);
          // Auto-poll for ~2 min so the banner clears itself once the card is connected.
          let attempts = 0;
          const poll = async () => {
            attempts += 1;
            const done = await recheckPayoutCard();
            if (!done && attempts < 30) setTimeout(() => void poll(), 4000);
          };
          setTimeout(() => void poll(), 4000);
        } else {
          // Popup blocked — fall back to a same-tab redirect (room draft will be lost).
          window.location.href = res.paymentUrl;
        }
        return;
      }
      if (tab) tab.close();
      setConnectingCard(false);
      setCardError(
        tx(
          language,
          'Не удалось начать подключение карты. Попробуйте снова.',
          'Картаны қосуды бастау мүмкін болмады. Қайта көріңіз.',
          "Couldn't start the card connection. Please try again.",
        ),
      );
    } catch (err) {
      if (tab) tab.close();
      setConnectingCard(false);
      setCardError(
        err instanceof ApiError
          ? err.message
          : tx(
              language,
              'Не удалось подключить карту. Попробуйте снова.',
              'Картаны қосу мүмкін болмады. Қайта көріңіз.',
              "Couldn't connect the card. Please try again.",
            ),
      );
    }
  };

  const handlePublish = async () => {
    setSubmitError(null);

    if (hasPayoutCard === false) {
      setSubmitError(
        tx(
          language,
          'Подключите карту для выплат перед созданием комнаты.',
          'Бөлме жасамас бұрын төлем картасын қосыңыз.',
          'Connect a payout card before creating a room.',
        ),
      );
      setConnectingCard(true);
      return;
    }
    if (!serviceId || !Number.isFinite(serviceIdNumber)) {
      setSubmitError(
        tx(language, 'Выберите оператора.', 'Операторды таңдаңыз.', 'Please select a service.'),
      );
      setStep(0);
      return;
    }
    if (!tariffPlanId || !Number.isFinite(tariffPlanIdNumber)) {
      setSubmitError(tx(language, 'Выберите тариф.', 'Тарифті таңдаңыз.', 'Please select a plan.'));
      setStep(0);
      return;
    }
    if (!title.trim()) {
      setSubmitError(
        tx(
          language,
          'Укажите название комнаты.',
          'Бөлме атауын көрсетіңіз.',
          'Please enter a room title.',
        ),
      );
      setStep(1);
      return;
    }
    if (isTelecom && !confirmed) {
      setSubmitError(
        tx(
          language,
          'Подтвердите условия оператора.',
          'Оператор шарттарын растаңыз.',
          'You must confirm operator terms for a telecom room.',
        ),
      );
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const room = await authorizedRequest((token) =>
        createRoomRequest(
          {
            categoryId: selectedService?.categoryId ?? null,
            serviceId: serviceIdNumber,
            tariffPlanId: tariffPlanIdNumber,
            roomType,
            title: title.trim(),
            providerName: selectedService?.name ?? null,
            tariffNameSnapshot: selectedTariff?.name ?? null,
            connectionType: isTelecom ? connectionType : null,
            operatorRestrictions: restrictions.trim() || null,
            operatorTermsConfirmed: isTelecom ? confirmed : null,
          },
          token,
        ),
      );
      setPublished(room);
    } catch (err) {
      if (err instanceof ApiError) {
        setSubmitError(err.message);
      } else {
        setSubmitError(
          tx(
            language,
            'Не удалось опубликовать комнату. Попробуйте снова.',
            'Бөлмені жариялау мүмкін болмады. Қайта көріңіз.',
            'Unable to publish the room right now. Please try again.',
          ),
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'var(--eco-success-100)' }}
        >
          <Check size={24} style={{ color: 'var(--eco-positive)' }} />
        </div>
        <h1 className="text-[24px] mb-2" style={{ color: 'var(--eco-text)' }}>
          {tx(language, 'Комната опубликована', 'Бөлме жарияланды', 'Room Published')}
        </h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            `Ваша комната «${published.title}» появилась в каталоге. Участники могут подавать заявки.`,
            `Сіздің «${published.title}» бөлмеңіз каталогта пайда болды. Қатысушылар өтінім бере алады.`,
            `Your room "${published.title}" is now visible in the catalog. Members can apply to join.`,
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to={`/rooms/owner/${published.id}`}
            className="w-full sm:w-auto"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="secondary" className="w-full sm:w-auto">
              {tx(language, 'Управлять комнатой', 'Бөлмені басқару', 'Manage Room')}
            </Button>
          </Link>
          <Link
            to={`/room/${published.id}`}
            className="w-full sm:w-auto"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="primary" className="w-full sm:w-auto">
              {tx(language, 'Открыть в каталоге', 'Каталогтан көру', 'View in Catalog')}
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link
        to="/rooms"
        className="inline-flex items-center gap-1 text-[13px] mb-6"
        style={{ color: 'var(--eco-primary)', textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> {tx(language, 'Мои комнаты', 'Менің бөлмелерім', 'My Rooms')}
      </Link>

      <h1 className="text-[22px] sm:text-[26px] mb-6" style={{ color: 'var(--eco-text)' }}>
        {tx(language, 'Создать комнату', 'Бөлме жасау', 'Create Room')}
      </h1>

      {catalogError && (
        <div
          className="p-4 rounded-lg mb-6 text-[13px]"
          style={{ background: 'var(--eco-danger-100, #fde8e8)', color: 'var(--eco-negative)' }}
        >
          {catalogError}
        </div>
      )}

      {hasPayoutCard === false && (
        <div className="p-4 rounded-lg mb-6" style={{ background: 'var(--eco-warning-100)' }}>
          <div className="flex items-start gap-3">
            <CreditCard
              size={16}
              className="mt-0.5 shrink-0"
              style={{ color: 'var(--eco-warning)' }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
                {tx(
                  language,
                  'Нужна карта для выплат',
                  'Төлем картасы қажет',
                  'Payout card required',
                )}
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(
                  language,
                  'Платежи участников зачисляются владельцу ежемесячно, поэтому для создания комнаты нужно подключить карту. EcoPay временно удерживает деньги до выплаты владельцу, затем переводит их на эту карту.',
                  'Қатысушылардың төлемдері иесіне ай сайын аударылады, сондықтан бөлме жасау үшін карта қосу қажет. EcoPay ақшаны иесіне аударғанға дейін уақытша ұстап, кейін осы картаға аударады.',
                  'Member payments are paid out to you monthly, so you need a connected card to create a room. EcoPay temporarily holds the money until owner payout, then sends it to this card.',
                )}
              </div>
              {awaitingCard ? (
                <>
                  <div className="text-[13px] mt-3" style={{ color: 'var(--eco-text)' }}>
                    {tx(
                      language,
                      'Завершите ввод карты в новой вкладке, затем нажмите «Проверить». Эта форма сохранена.',
                      'Жаңа қойындыда картаны енгізуді аяқтап, «Тексеру» түймесін басыңыз. Бұл форма сақталды.',
                      'Finish entering your card in the new tab, then click “Re-check”. This form is kept.',
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={() => void recheckPayoutCard()}>
                      {tx(language, 'Проверить', 'Тексеру', 'Re-check')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleConnectCard()}>
                      {tx(language, 'Открыть снова', 'Қайта ашу', 'Open again')}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    loading={connectingCard}
                    onClick={() => void handleConnectCard()}
                  >
                    <CreditCard size={13} />{' '}
                    {tx(
                      language,
                      'Подключить карту через FreedomPay',
                      'FreedomPay арқылы картаны қосу',
                      'Connect card via FreedomPay',
                    )}
                  </Button>
                  <div className="text-[12px] mt-2" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(
                      language,
                      'Откроется защищённая страница FreedomPay в новой вкладке. Мы не храним номер карты.',
                      'Жаңа қойындыда қорғалған FreedomPay беті ашылады. Біз карта нөмірін сақтамаймыз.',
                      "FreedomPay's secure page opens in a new tab. We never store the card number.",
                    )}
                  </div>
                </>
              )}
              {cardError && (
                <div className="text-[12px] mt-2" style={{ color: 'var(--eco-negative)' }}>
                  {cardError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {navState?.reason === 'no-free-rooms' && (
        <div
          className="p-3 rounded-lg mb-4 text-[13px] flex items-start gap-2"
          style={{
            background: 'var(--eco-brand-50)',
            color: 'var(--eco-text-secondary)',
            border: '1px solid var(--eco-border)',
          }}
        >
          <Users size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--eco-primary)' }} />
          <span>
            {tx(
              language,
              'Свободных комнат по этой подписке пока нет. Создайте свою и пригласите участников.',
              'Бұл жазылым бойынша бос бөлме әзірге жоқ. Өзіңіздікін жасап, қатысушыларды шақырыңыз.',
              'No open rooms for this subscription yet. Create one and invite members.',
            )}
          </span>
        </div>
      )}

      {isAuthenticated && user && !user.phoneVerified && (
        <div
          className="p-3 rounded-lg mb-4 text-[13px] flex items-start gap-2"
          style={{ background: 'var(--eco-warning-100)', color: 'var(--eco-text-secondary)' }}
        >
          <AlertTriangle
            size={14}
            className="mt-0.5 shrink-0"
            style={{ color: 'var(--eco-warning)' }}
          />
          <span>
            {tx(
              language,
              'Подтвердите номер телефона перед созданием комнаты.',
              'Бөлме жасамас бұрын телефон нөміріңізді растаңыз.',
              'Verify your phone number before creating a room.',
            )}{' '}
            <Link to="/profile" style={{ color: 'var(--eco-primary)' }}>
              {tx(language, 'Перейти в профиль', 'Профильге өту', 'Go to profile')}
            </Link>
            .
          </span>
        </div>
      )}

      <Stepper steps={stepLabels} current={step} />

      <div className="mt-8">
        {step === 0 && (
          <Card className="flex flex-col gap-4">
            <Select
              label={tx(
                language,
                'Оператор / Провайдер',
                'Оператор / Провайдер',
                'Operator / Provider',
              )}
              groups={
                services.length > 0
                  ? serviceGroups
                  : [
                      {
                        label: tx(language, 'Загрузка', 'Жүктелуде', 'Loading'),
                        options: [
                          {
                            value: '',
                            label: tx(
                              language,
                              'Загрузка сервисов...',
                              'Сервистер жүктелуде...',
                              'Loading services...',
                            ),
                          },
                        ],
                      },
                    ]
              }
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            />
            <Select
              label={tx(language, 'Тариф', 'Тариф', 'Plan')}
              options={[
                {
                  value: '',
                  label:
                    tariffs.length > 0
                      ? tx(language, 'Выберите тариф', 'Тарифті таңдаңыз', 'Select a plan')
                      : tx(language, 'Тарифов нет', 'Тарифтер жоқ', 'No plans available'),
                },
                ...tariffs.map((t) => ({
                  value: String(t.id),
                  label: `${t.name} · ${CURRENCY_SYMBOLS[(t.currency ?? 'KZT') as SupportedCurrency] ?? t.currency}${formatNumber(Number(t.basePriceTotal))} / ${periodLabel(t.periodType)}`,
                })),
              ]}
              value={tariffPlanId}
              onChange={(e) => applyTariff(e.target.value)}
            />
            {selectedTariff && (
              <div
                className="rounded-lg p-3 flex flex-col gap-2"
                style={{ background: 'var(--eco-brand-50)', border: '1px solid var(--eco-border)' }}
              >
                <div
                  className="flex items-center gap-1.5 text-[12px]"
                  style={{ color: 'var(--eco-text-secondary)' }}
                >
                  <Lock size={12} style={{ color: 'var(--eco-primary)' }} />
                  {tx(
                    language,
                    'Цена, валюта, период и число мест заданы тарифом',
                    'Баға, валюта, кезең және орын саны тарифпен анықталады',
                    'Price, currency, period and seats are set by the plan',
                  )}
                </div>
                {[
                  {
                    label: tx(language, 'Число мест', 'Орын саны', 'Seats'),
                    value: String(selectedTariff.maxMembers),
                  },
                  {
                    label: tx(language, 'Общая цена', 'Жалпы баға', 'Total price'),
                    value: `${currencySymbol}${moneyFmt(totalNumeric)}`,
                  },
                  {
                    label: tx(language, 'За участника', 'Қатысушы үшін', 'Per member'),
                    value: `${currencySymbol}${moneyFmt(perMemberDerived)}`,
                  },
                  {
                    label: tx(language, 'Период', 'Кезең', 'Period'),
                    value: periodLabel(periodType),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-[13px]">
                    <span style={{ color: 'var(--eco-text-secondary)' }}>{row.label}</span>
                    <span style={{ color: 'var(--eco-text)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
            <Button
              variant="primary"
              className="w-full"
              disabled={!serviceId || !tariffPlanId}
              onClick={() => setStep(1)}
            >
              {tx(language, 'Продолжить', 'Жалғастыру', 'Continue')}
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card className="flex flex-col gap-4">
            <Input
              label={tx(language, 'Название комнаты', 'Бөлме атауы', 'Room Title')}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tx(
                language,
                'Shared room',
                'Shared room',
                'e.g. Shared room',
              )}
            />
            <div
              className="rounded-lg p-3 flex flex-col gap-2"
              style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
            >
              <div
                className="flex items-center gap-1.5 text-[12px]"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                <Lock size={12} style={{ color: 'var(--eco-primary)' }} />
                {tx(language, 'Условия тарифа', 'Тариф шарттары', 'Plan terms')} ·{' '}
                {selectedTariff?.name ?? '—'}
              </div>
              {[
                {
                  label: tx(language, 'Число мест', 'Орын саны', 'Seats'),
                  value: String(seatCount),
                },
                {
                  label: tx(language, 'Общая цена', 'Жалпы баға', 'Total price'),
                  value: `${currencySymbol}${moneyFmt(totalNumeric)}`,
                },
                {
                  label: tx(language, 'За участника', 'Қатысушы үшін', 'Per member'),
                  value:
                    `${currencySymbol}${moneyFmt(perMemberDerived)}/${periodLabel(periodType)}` +
                    (currency !== 'KZT' && perMemberKztEquivalent != null
                      ? ` (≈ ₸${moneyFmt(perMemberKztEquivalent)})`
                      : ''),
                },
                {
                  label: tx(language, 'Период', 'Кезең', 'Period'),
                  value: periodLabel(periodType),
                },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-[13px]">
                  <span style={{ color: 'var(--eco-text-secondary)' }}>{row.label}</span>
                  <span style={{ color: 'var(--eco-text)' }}>{row.value}</span>
                </div>
              ))}
              {currency !== 'KZT' && fxError && (
                <span
                  className="text-[11px] break-words"
                  style={{ color: 'var(--eco-warning-500)' }}
                >
                  {fxError}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>
                {tx(language, 'Назад', 'Артқа', 'Back')}
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>
                {tx(language, 'Продолжить', 'Жалғастыру', 'Continue')}
              </Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="flex flex-col gap-4">
            {isTelecom ? (
              <>
                <Input
                  label={tx(
                    language,
                    'Ограничения оператора (опционально)',
                    'Оператор шектеулері (міндетті емес)',
                    'Operator Restrictions (optional)',
                  )}
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder={tx(
                    language,
                    'напр. только номера KZ',
                    'мысалы тек KZ нөмірлері',
                    'e.g. KZ numbers only',
                  )}
                />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={confirmed}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  <span className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                    {tx(
                      language,
                      'Подтверждаю, что оператор поддерживает семейные или групповые тарифы, и я являюсь владельцем аккаунта либо имею право делиться им.',
                      'Оператордың отбасылық немесе топтық тарифтерді қолдайтынын және мен тіркелгінің иесі немесе бөлісуге құқылы екенімді растаймын.',
                      'I confirm that this operator supports family or group plans and I am the account holder or authorized to share.',
                    )}
                  </span>
                </label>
              </>
            ) : (
              <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(
                  language,
                  'Цифровые подписки расшариваются приглашением в аккаунт после оплаты. Идентификатор связи не требуется.',
                  'Цифрлық жазылымдар төлемнен кейін тіркелгіге шақыру арқылы бөлісіледі. Байланыс идентификаторы қажет емес.',
                  'Digital subscriptions are shared via an account invite once members join and pay. No telecom identifier required.',
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                {tx(language, 'Назад', 'Артқа', 'Back')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isTelecom && !confirmed}
                onClick={() => setStep(3)}
              >
                {tx(language, 'Продолжить', 'Жалғастыру', 'Continue')}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Проверка и публикация', 'Тексеру және жариялау', 'Review & Publish')}
            </h3>
            {[
              {
                label: tx(language, 'Тип комнаты', 'Бөлме түрі', 'Room type'),
                value: isTelecom
                  ? tx(language, 'Связь', 'Телеком', 'Telecom')
                  : tx(language, 'Цифровая', 'Цифрлық', 'Digital'),
              },
              {
                label: tx(language, 'Оператор', 'Оператор', 'Operator'),
                value: selectedService?.name ?? '—',
              },
              {
                label: tx(language, 'Тариф', 'Тариф', 'Plan'),
                value: selectedTariff?.name ?? tx(language, 'Свой', 'Өзіндік', 'Custom'),
              },
              { label: tx(language, 'Название', 'Атауы', 'Title'), value: title || '—' },
              { label: tx(language, 'Места', 'Орындар', 'Seats'), value: String(seatCount) },
              {
                label: tx(language, 'За участника', 'Қатысушы үшін', 'Per member'),
                value:
                  `${currencySymbol}${moneyFmt(perMemberDerived)}/${periodLabel(periodType)}` +
                  (currency !== 'KZT' && perMemberKztEquivalent != null
                    ? ` (≈ ₸${moneyFmt(perMemberKztEquivalent)})`
                    : ''),
              },
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: 'var(--eco-text-secondary)' }}>{row.label}</span>
                <span style={{ color: 'var(--eco-text)' }}>{row.value}</span>
              </div>
            ))}
            {submitError && (
              <p className="text-[12px]" style={{ color: 'var(--eco-negative)' }}>
                {submitError}
              </p>
            )}
            <div className="border-t pt-3" style={{ borderColor: 'var(--eco-border)' }} />
            {hasPayoutCard === false && (
              <p className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {tx(
                  language,
                  'Подключите карту для выплат выше, чтобы опубликовать.',
                  'Жариялау үшін жоғарыда төлем картасын қосыңыз.',
                  'Connect a payout card above to publish.',
                )}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>
                {tx(language, 'Назад', 'Артқа', 'Back')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={submitting}
                disabled={hasPayoutCard === false || (!!user && !user.phoneVerified)}
                onClick={handlePublish}
              >
                {tx(language, 'Опубликовать комнату', 'Бөлмені жариялау', 'Publish Room')}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

