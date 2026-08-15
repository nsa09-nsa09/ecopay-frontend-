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
  KZT: 'в‚ё',
  USD: '$',
  EUR: 'в‚¬',
  CNY: 'ВҐ',
  GBP: 'ВЈ',
  RUB: 'в‚Ѕ',
  UZS: 'СЃСѓРј',
  KGS: 'СЃРѕРј',
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
    tx(language, 'РћРїРµСЂР°С‚РѕСЂ Рё С‚Р°СЂРёС„', 'РћРїРµСЂР°С‚РѕСЂ Р¶У™РЅРµ С‚Р°СЂРёС„', 'Operator & Plan'),
    tx(language, 'РќР°СЃС‚СЂРѕР№РєРё РєРѕРјРЅР°С‚С‹', 'Р‘У©Р»РјРµ Р±Р°РїС‚Р°СѓР»Р°СЂС‹', 'Room Settings'),
    tx(language, 'РџРѕРґС‚РІРµСЂР¶РґРµРЅРёРµ РѕРїРµСЂР°С‚РѕСЂР°', 'РћРїРµСЂР°С‚РѕСЂ СЂР°СЃС‚Р°СѓС‹', 'Operator confirmation'),
    tx(language, 'РџСЂРѕРІРµСЂРєР°', 'РўРµРєСЃРµСЂСѓ', 'Review'),
  ];

  const PERIOD_OPTIONS = [
    { value: 'MONTHLY', label: tx(language, 'Р•Р¶РµРјРµСЃСЏС‡РЅРѕ', 'РђР№Р»С‹Т›', 'Monthly') },
    { value: 'YEARLY', label: tx(language, 'Р•Р¶РµРіРѕРґРЅРѕ', 'Р–С‹Р»РґС‹Т›', 'Yearly') },
    { value: 'OTHER', label: tx(language, 'Р”СЂСѓРіРѕРµ', 'Р‘Р°СЃТ›Р°', 'Other') },
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
              'РќРµ СѓРґР°Р»РѕСЃСЊ Р·Р°РіСЂСѓР·РёС‚СЊ РєР°С‚Р°Р»РѕРі СЃРµСЂРІРёСЃРѕРІ.',
              'РЎРµСЂРІРёСЃС‚РµСЂ РєР°С‚Р°Р»РѕРіС‹РЅ Р¶ТЇРєС‚РµСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹.',
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
        label: tx(language, 'РЎРІСЏР·СЊ', 'Р‘Р°Р№Р»Р°РЅС‹СЃ', 'Telecom'),
        options: telecom.map((s) => ({ value: String(s.id), label: s.name })),
      },
      {
        label: tx(language, 'Р¦РёС„СЂРѕРІС‹Рµ РїРѕРґРїРёСЃРєРё', 'Р¦РёС„СЂР»С‹Т› Р¶Р°Р·С‹Р»С‹РјРґР°СЂ', 'Digital subscriptions'),
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
      // Price, seats, currency and period are owned by the tariff (admin-set) вЂ”
      // we only mirror the plan's connection type and prefill the title here.
      if (tariff.connectionType) {
        setConnectionType(tariff.connectionType);
      }
      if (!title) {
        setTitle(`${selectedService?.name ?? ''} ${tariff.name}`.trim());
      }
    }
  };

  // Pricing fields are derived from the selected tariff вЂ” never editable here.
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
          // Popup blocked вЂ” fall back to a same-tab redirect (room draft will be lost).
          window.location.href = res.paymentUrl;
        }
        return;
      }
      if (tab) tab.close();
      setConnectingCard(false);
      setCardError(
        tx(
          language,
          'РќРµ СѓРґР°Р»РѕСЃСЊ РЅР°С‡Р°С‚СЊ РїРѕРґРєР»СЋС‡РµРЅРёРµ РєР°СЂС‚С‹. РџРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.',
          'РљР°СЂС‚Р°РЅС‹ Т›РѕСЃСѓРґС‹ Р±Р°СЃС‚Р°Сѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹. ТљР°Р№С‚Р° РєУ©СЂС–ТЈС–Р·.',
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
              'РќРµ СѓРґР°Р»РѕСЃСЊ РїРѕРґРєР»СЋС‡РёС‚СЊ РєР°СЂС‚Сѓ. РџРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.',
              'РљР°СЂС‚Р°РЅС‹ Т›РѕСЃСѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹. ТљР°Р№С‚Р° РєУ©СЂС–ТЈС–Р·.',
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
          'РџРѕРґРєР»СЋС‡РёС‚Рµ РєР°СЂС‚Сѓ РґР»СЏ РІС‹РїР»Р°С‚ РїРµСЂРµРґ СЃРѕР·РґР°РЅРёРµРј РєРѕРјРЅР°С‚С‹.',
          'Р‘У©Р»РјРµ Р¶Р°СЃР°РјР°СЃ Р±Т±СЂС‹РЅ С‚У©Р»РµРј РєР°СЂС‚Р°СЃС‹РЅ Т›РѕСЃС‹ТЈС‹Р·.',
          'Connect a payout card before creating a room.',
        ),
      );
      setConnectingCard(true);
      return;
    }
    if (!serviceId || !Number.isFinite(serviceIdNumber)) {
      setSubmitError(
        tx(language, 'Р’С‹Р±РµСЂРёС‚Рµ РѕРїРµСЂР°С‚РѕСЂР°.', 'РћРїРµСЂР°С‚РѕСЂРґС‹ С‚Р°ТЈРґР°ТЈС‹Р·.', 'Please select a service.'),
      );
      setStep(0);
      return;
    }
    if (!tariffPlanId || !Number.isFinite(tariffPlanIdNumber)) {
      setSubmitError(tx(language, 'Р’С‹Р±РµСЂРёС‚Рµ С‚Р°СЂРёС„.', 'РўР°СЂРёС„С‚С– С‚Р°ТЈРґР°ТЈС‹Р·.', 'Please select a plan.'));
      setStep(0);
      return;
    }
    if (!title.trim()) {
      setSubmitError(
        tx(
          language,
          'РЈРєР°Р¶РёС‚Рµ РЅР°Р·РІР°РЅРёРµ РєРѕРјРЅР°С‚С‹.',
          'Р‘У©Р»РјРµ Р°С‚Р°СѓС‹РЅ РєУ©СЂСЃРµС‚С–ТЈС–Р·.',
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
          'РџРѕРґС‚РІРµСЂРґРёС‚Рµ СѓСЃР»РѕРІРёСЏ РѕРїРµСЂР°С‚РѕСЂР°.',
          'РћРїРµСЂР°С‚РѕСЂ С€Р°СЂС‚С‚Р°СЂС‹РЅ СЂР°СЃС‚Р°ТЈС‹Р·.',
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
            'РќРµ СѓРґР°Р»РѕСЃСЊ РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ РєРѕРјРЅР°С‚Сѓ. РџРѕРїСЂРѕР±СѓР№С‚Рµ СЃРЅРѕРІР°.',
            'Р‘У©Р»РјРµРЅС– Р¶Р°СЂРёСЏР»Р°Сѓ РјТЇРјРєС–РЅ Р±РѕР»РјР°РґС‹. ТљР°Р№С‚Р° РєУ©СЂС–ТЈС–Р·.',
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
          {tx(language, 'РљРѕРјРЅР°С‚Р° РѕРїСѓР±Р»РёРєРѕРІР°РЅР°', 'Р‘У©Р»РјРµ Р¶Р°СЂРёСЏР»Р°РЅРґС‹', 'Room Published')}
        </h1>
        <p className="text-[13px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
          {tx(
            language,
            `Р’Р°С€Р° РєРѕРјРЅР°С‚Р° В«${published.title}В» РїРѕСЏРІРёР»Р°СЃСЊ РІ РєР°С‚Р°Р»РѕРіРµ. РЈС‡Р°СЃС‚РЅРёРєРё РјРѕРіСѓС‚ РїРѕРґР°РІР°С‚СЊ Р·Р°СЏРІРєРё.`,
            `РЎС–Р·РґС–ТЈ В«${published.title}В» Р±У©Р»РјРµТЈС–Р· РєР°С‚Р°Р»РѕРіС‚Р° РїР°Р№РґР° Р±РѕР»РґС‹. ТљР°С‚С‹СЃСѓС€С‹Р»Р°СЂ У©С‚С–РЅС–Рј Р±РµСЂРµ Р°Р»Р°РґС‹.`,
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
              {tx(language, 'РЈРїСЂР°РІР»СЏС‚СЊ РєРѕРјРЅР°С‚РѕР№', 'Р‘У©Р»РјРµРЅС– Р±Р°СЃТ›Р°СЂСѓ', 'Manage Room')}
            </Button>
          </Link>
          <Link
            to={`/room/${published.id}`}
            className="w-full sm:w-auto"
            style={{ textDecoration: 'none' }}
          >
            <Button variant="primary" className="w-full sm:w-auto">
              {tx(language, 'РћС‚РєСЂС‹С‚СЊ РІ РєР°С‚Р°Р»РѕРіРµ', 'РљР°С‚Р°Р»РѕРіС‚Р°РЅ РєУ©СЂСѓ', 'View in Catalog')}
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
        <ArrowLeft size={14} /> {tx(language, 'РњРѕРё РєРѕРјРЅР°С‚С‹', 'РњРµРЅС–ТЈ Р±У©Р»РјРµР»РµСЂС–Рј', 'My Rooms')}
      </Link>

      <h1 className="text-[22px] sm:text-[26px] mb-6" style={{ color: 'var(--eco-text)' }}>
        {tx(language, 'РЎРѕР·РґР°С‚СЊ РєРѕРјРЅР°С‚Сѓ', 'Р‘У©Р»РјРµ Р¶Р°СЃР°Сѓ', 'Create Room')}
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
                  'РќСѓР¶РЅР° РєР°СЂС‚Р° РґР»СЏ РІС‹РїР»Р°С‚',
                  'РўУ©Р»РµРј РєР°СЂС‚Р°СЃС‹ Т›Р°Р¶РµС‚',
                  'Payout card required',
                )}
              </div>
              <div className="text-[13px] mt-0.5" style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(
                  language,
                  'РџР»Р°С‚РµР¶Рё СѓС‡Р°СЃС‚РЅРёРєРѕРІ Р·Р°С‡РёСЃР»СЏСЋС‚СЃСЏ РІР»Р°РґРµР»СЊС†Сѓ РµР¶РµРјРµСЃСЏС‡РЅРѕ, РїРѕСЌС‚РѕРјСѓ РґР»СЏ СЃРѕР·РґР°РЅРёСЏ РєРѕРјРЅР°С‚С‹ РЅСѓР¶РЅРѕ РїРѕРґРєР»СЋС‡РёС‚СЊ РєР°СЂС‚Сѓ. Р”РµРЅСЊРіРё СѓРґРµСЂР¶РёРІР°СЋС‚СЃСЏ 30 РґРЅРµР№ РїРѕСЃР»Рµ РѕРїР»Р°С‚С‹, Р·Р°С‚РµРј РїРµСЂРµРІРѕРґСЏС‚СЃСЏ РЅР° СЌС‚Сѓ РєР°СЂС‚Сѓ.',
                  'ТљР°С‚С‹СЃСѓС€С‹Р»Р°СЂРґС‹ТЈ С‚У©Р»РµРјРґРµСЂС– РёРµСЃС–РЅРµ Р°Р№ СЃР°Р№С‹РЅ Р°СѓРґР°СЂС‹Р»Р°РґС‹, СЃРѕРЅРґС‹Т›С‚Р°РЅ Р±У©Р»РјРµ Р¶Р°СЃР°Сѓ ТЇС€С–РЅ РєР°СЂС‚Р° Т›РѕСЃСѓ Т›Р°Р¶РµС‚. РђТ›С€Р° С‚У©Р»РµРјРЅРµРЅ РєРµР№С–РЅ 30 РєТЇРЅ Т±СЃС‚Р°Р»С‹Рї, СЃРѕСЃС‹РЅ РѕСЃС‹ РєР°СЂС‚Р°Т“Р° Р°СѓРґР°СЂС‹Р»Р°РґС‹.',
                  'Member payments are paid out to you monthly, so you need a connected card to create a room. Funds are held for 30 days after payment, then sent to this card.',
                )}
              </div>
              {awaitingCard ? (
                <>
                  <div className="text-[13px] mt-3" style={{ color: 'var(--eco-text)' }}>
                    {tx(
                      language,
                      'Р—Р°РІРµСЂС€РёС‚Рµ РІРІРѕРґ РєР°СЂС‚С‹ РІ РЅРѕРІРѕР№ РІРєР»Р°РґРєРµ, Р·Р°С‚РµРј РЅР°Р¶РјРёС‚Рµ В«РџСЂРѕРІРµСЂРёС‚СЊВ». Р­С‚Р° С„РѕСЂРјР° СЃРѕС…СЂР°РЅРµРЅР°.',
                      'Р–Р°ТЈР° Т›РѕР№С‹РЅРґС‹РґР° РєР°СЂС‚Р°РЅС‹ РµРЅРіС–Р·СѓРґС– Р°СЏТ›С‚Р°Рї, В«РўРµРєСЃРµСЂСѓВ» С‚ТЇР№РјРµСЃС–РЅ Р±Р°СЃС‹ТЈС‹Р·. Р‘Т±Р» С„РѕСЂРјР° СЃР°Т›С‚Р°Р»РґС‹.',
                      'Finish entering your card in the new tab, then click вЂњRe-checkвЂќ. This form is kept.',
                    )}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="primary" size="sm" onClick={() => void recheckPayoutCard()}>
                      {tx(language, 'РџСЂРѕРІРµСЂРёС‚СЊ', 'РўРµРєСЃРµСЂСѓ', 'Re-check')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleConnectCard()}>
                      {tx(language, 'РћС‚РєСЂС‹С‚СЊ СЃРЅРѕРІР°', 'ТљР°Р№С‚Р° Р°С€Сѓ', 'Open again')}
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
                      'РџРѕРґРєР»СЋС‡РёС‚СЊ РєР°СЂС‚Сѓ С‡РµСЂРµР· FreedomPay',
                      'FreedomPay Р°СЂТ›С‹Р»С‹ РєР°СЂС‚Р°РЅС‹ Т›РѕСЃСѓ',
                      'Connect card via FreedomPay',
                    )}
                  </Button>
                  <div className="text-[12px] mt-2" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(
                      language,
                      'РћС‚РєСЂРѕРµС‚СЃСЏ Р·Р°С‰РёС‰С‘РЅРЅР°СЏ СЃС‚СЂР°РЅРёС†Р° FreedomPay РІ РЅРѕРІРѕР№ РІРєР»Р°РґРєРµ. РњС‹ РЅРµ С…СЂР°РЅРёРј РЅРѕРјРµСЂ РєР°СЂС‚С‹.',
                      'Р–Р°ТЈР° Т›РѕР№С‹РЅРґС‹РґР° Т›РѕСЂТ“Р°Р»Т“Р°РЅ FreedomPay Р±РµС‚С– Р°С€С‹Р»Р°РґС‹. Р‘С–Р· РєР°СЂС‚Р° РЅУ©РјС–СЂС–РЅ СЃР°Т›С‚Р°РјР°Р№РјС‹Р·.',
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
              'РЎРІРѕР±РѕРґРЅС‹С… РєРѕРјРЅР°С‚ РїРѕ СЌС‚РѕР№ РїРѕРґРїРёСЃРєРµ РїРѕРєР° РЅРµС‚. РЎРѕР·РґР°Р№С‚Рµ СЃРІРѕСЋ Рё РїСЂРёРіР»Р°СЃРёС‚Рµ СѓС‡Р°СЃС‚РЅРёРєРѕРІ.',
              'Р‘Т±Р» Р¶Р°Р·С‹Р»С‹Рј Р±РѕР№С‹РЅС€Р° Р±РѕСЃ Р±У©Р»РјРµ У™Р·С–СЂРіРµ Р¶РѕТ›. УЁР·С–ТЈС–Р·РґС–РєС–РЅ Р¶Р°СЃР°Рї, Т›Р°С‚С‹СЃСѓС€С‹Р»Р°СЂРґС‹ С€Р°Т›С‹СЂС‹ТЈС‹Р·.',
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
              'РџРѕРґС‚РІРµСЂРґРёС‚Рµ РЅРѕРјРµСЂ С‚РµР»РµС„РѕРЅР° РїРµСЂРµРґ СЃРѕР·РґР°РЅРёРµРј РєРѕРјРЅР°С‚С‹.',
              'Р‘У©Р»РјРµ Р¶Р°СЃР°РјР°СЃ Р±Т±СЂС‹РЅ С‚РµР»РµС„РѕРЅ РЅУ©РјС–СЂС–ТЈС–Р·РґС– СЂР°СЃС‚Р°ТЈС‹Р·.',
              'Verify your phone number before creating a room.',
            )}{' '}
            <Link to="/profile" style={{ color: 'var(--eco-primary)' }}>
              {tx(language, 'РџРµСЂРµР№С‚Рё РІ РїСЂРѕС„РёР»СЊ', 'РџСЂРѕС„РёР»СЊРіРµ У©С‚Сѓ', 'Go to profile')}
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
                'РћРїРµСЂР°С‚РѕСЂ / РџСЂРѕРІР°Р№РґРµСЂ',
                'РћРїРµСЂР°С‚РѕСЂ / РџСЂРѕРІР°Р№РґРµСЂ',
                'Operator / Provider',
              )}
              groups={
                services.length > 0
                  ? serviceGroups
                  : [
                      {
                        label: tx(language, 'Р—Р°РіСЂСѓР·РєР°', 'Р–ТЇРєС‚РµР»СѓРґРµ', 'Loading'),
                        options: [
                          {
                            value: '',
                            label: tx(
                              language,
                              'Р—Р°РіСЂСѓР·РєР° СЃРµСЂРІРёСЃРѕРІ...',
                              'РЎРµСЂРІРёСЃС‚РµСЂ Р¶ТЇРєС‚РµР»СѓРґРµ...',
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
              label={tx(language, 'РўР°СЂРёС„', 'РўР°СЂРёС„', 'Plan')}
              options={[
                {
                  value: '',
                  label:
                    tariffs.length > 0
                      ? tx(language, 'Р’С‹Р±РµСЂРёС‚Рµ С‚Р°СЂРёС„', 'РўР°СЂРёС„С‚С– С‚Р°ТЈРґР°ТЈС‹Р·', 'Select a plan')
                      : tx(language, 'РўР°СЂРёС„РѕРІ РЅРµС‚', 'РўР°СЂРёС„С‚РµСЂ Р¶РѕТ›', 'No plans available'),
                },
                ...tariffs.map((t) => ({
                  value: String(t.id),
                  label: `${t.name} В· ${CURRENCY_SYMBOLS[(t.currency ?? 'KZT') as SupportedCurrency] ?? t.currency}${formatNumber(Number(t.basePriceTotal))} / ${periodLabel(t.periodType)}`,
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
                    'Р¦РµРЅР°, РІР°Р»СЋС‚Р°, РїРµСЂРёРѕРґ Рё С‡РёСЃР»Рѕ РјРµСЃС‚ Р·Р°РґР°РЅС‹ С‚Р°СЂРёС„РѕРј',
                    'Р‘Р°Т“Р°, РІР°Р»СЋС‚Р°, РєРµР·РµТЈ Р¶У™РЅРµ РѕСЂС‹РЅ СЃР°РЅС‹ С‚Р°СЂРёС„РїРµРЅ Р°РЅС‹Т›С‚Р°Р»Р°РґС‹',
                    'Price, currency, period and seats are set by the plan',
                  )}
                </div>
                {[
                  {
                    label: tx(language, 'Р§РёСЃР»Рѕ РјРµСЃС‚', 'РћСЂС‹РЅ СЃР°РЅС‹', 'Seats'),
                    value: String(selectedTariff.maxMembers),
                  },
                  {
                    label: tx(language, 'РћР±С‰Р°СЏ С†РµРЅР°', 'Р–Р°Р»РїС‹ Р±Р°Т“Р°', 'Total price'),
                    value: `${currencySymbol}${moneyFmt(totalNumeric)}`,
                  },
                  {
                    label: tx(language, 'Р—Р° СѓС‡Р°СЃС‚РЅРёРєР°', 'ТљР°С‚С‹СЃСѓС€С‹ ТЇС€С–РЅ', 'Per member'),
                    value: `${currencySymbol}${moneyFmt(perMemberDerived)}`,
                  },
                  {
                    label: tx(language, 'РџРµСЂРёРѕРґ', 'РљРµР·РµТЈ', 'Period'),
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
              {tx(language, 'РџСЂРѕРґРѕР»Р¶РёС‚СЊ', 'Р–Р°Р»Т“Р°СЃС‚С‹СЂСѓ', 'Continue')}
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card className="flex flex-col gap-4">
            <Input
              label={tx(language, 'РќР°Р·РІР°РЅРёРµ РєРѕРјРЅР°С‚С‹', 'Р‘У©Р»РјРµ Р°С‚Р°СѓС‹', 'Room Title')}
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
                {tx(language, 'РЈСЃР»РѕРІРёСЏ С‚Р°СЂРёС„Р°', 'РўР°СЂРёС„ С€Р°СЂС‚С‚Р°СЂС‹', 'Plan terms')} В·{' '}
                {selectedTariff?.name ?? 'вЂ”'}
              </div>
              {[
                {
                  label: tx(language, 'Р§РёСЃР»Рѕ РјРµСЃС‚', 'РћСЂС‹РЅ СЃР°РЅС‹', 'Seats'),
                  value: String(seatCount),
                },
                {
                  label: tx(language, 'РћР±С‰Р°СЏ С†РµРЅР°', 'Р–Р°Р»РїС‹ Р±Р°Т“Р°', 'Total price'),
                  value: `${currencySymbol}${moneyFmt(totalNumeric)}`,
                },
                {
                  label: tx(language, 'Р—Р° СѓС‡Р°СЃС‚РЅРёРєР°', 'ТљР°С‚С‹СЃСѓС€С‹ ТЇС€С–РЅ', 'Per member'),
                  value:
                    `${currencySymbol}${moneyFmt(perMemberDerived)}/${periodLabel(periodType)}` +
                    (currency !== 'KZT' && perMemberKztEquivalent != null
                      ? ` (в‰€ в‚ё${moneyFmt(perMemberKztEquivalent)})`
                      : ''),
                },
                {
                  label: tx(language, 'РџРµСЂРёРѕРґ', 'РљРµР·РµТЈ', 'Period'),
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
                {tx(language, 'РќР°Р·Р°Рґ', 'РђСЂС‚Т›Р°', 'Back')}
              </Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>
                {tx(language, 'РџСЂРѕРґРѕР»Р¶РёС‚СЊ', 'Р–Р°Р»Т“Р°СЃС‚С‹СЂСѓ', 'Continue')}
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
                    'РћРіСЂР°РЅРёС‡РµРЅРёСЏ РѕРїРµСЂР°С‚РѕСЂР° (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ)',
                    'РћРїРµСЂР°С‚РѕСЂ С€РµРєС‚РµСѓР»РµСЂС– (РјС–РЅРґРµС‚С‚С– РµРјРµСЃ)',
                    'Operator Restrictions (optional)',
                  )}
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder={tx(
                    language,
                    'РЅР°РїСЂ. С‚РѕР»СЊРєРѕ РЅРѕРјРµСЂР° KZ',
                    'РјС‹СЃР°Р»С‹ С‚РµРє KZ РЅУ©РјС–СЂР»РµСЂС–',
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
                      'РџРѕРґС‚РІРµСЂР¶РґР°СЋ, С‡С‚Рѕ РѕРїРµСЂР°С‚РѕСЂ РїРѕРґРґРµСЂР¶РёРІР°РµС‚ СЃРµРјРµР№РЅС‹Рµ РёР»Рё РіСЂСѓРїРїРѕРІС‹Рµ С‚Р°СЂРёС„С‹, Рё СЏ СЏРІР»СЏСЋСЃСЊ РІР»Р°РґРµР»СЊС†РµРј Р°РєРєР°СѓРЅС‚Р° Р»РёР±Рѕ РёРјРµСЋ РїСЂР°РІРѕ РґРµР»РёС‚СЊСЃСЏ РёРј.',
                      'РћРїРµСЂР°С‚РѕСЂРґС‹ТЈ РѕС‚Р±Р°СЃС‹Р»С‹Т› РЅРµРјРµСЃРµ С‚РѕРїС‚С‹Т› С‚Р°СЂРёС„С‚РµСЂРґС– Т›РѕР»РґР°Р№С‚С‹РЅС‹РЅ Р¶У™РЅРµ РјРµРЅ С‚С–СЂРєРµР»РіС–РЅС–ТЈ РёРµСЃС– РЅРµРјРµСЃРµ Р±У©Р»С–СЃСѓРіРµ Т›Т±Т›С‹Р»С‹ РµРєРµРЅС–РјРґС– СЂР°СЃС‚Р°Р№РјС‹РЅ.',
                      'I confirm that this operator supports family or group plans and I am the account holder or authorized to share.',
                    )}
                  </span>
                </label>
              </>
            ) : (
              <div className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
                {tx(
                  language,
                  'Р¦РёС„СЂРѕРІС‹Рµ РїРѕРґРїРёСЃРєРё СЂР°СЃС€Р°СЂРёРІР°СЋС‚СЃСЏ РїСЂРёРіР»Р°С€РµРЅРёРµРј РІ Р°РєРєР°СѓРЅС‚ РїРѕСЃР»Рµ РѕРїР»Р°С‚С‹. РРґРµРЅС‚РёС„РёРєР°С‚РѕСЂ СЃРІСЏР·Рё РЅРµ С‚СЂРµР±СѓРµС‚СЃСЏ.',
                  'Р¦РёС„СЂР»С‹Т› Р¶Р°Р·С‹Р»С‹РјРґР°СЂ С‚У©Р»РµРјРЅРµРЅ РєРµР№С–РЅ С‚С–СЂРєРµР»РіС–РіРµ С€Р°Т›С‹СЂСѓ Р°СЂТ›С‹Р»С‹ Р±У©Р»С–СЃС–Р»РµРґС–. Р‘Р°Р№Р»Р°РЅС‹СЃ РёРґРµРЅС‚РёС„РёРєР°С‚РѕСЂС‹ Т›Р°Р¶РµС‚ РµРјРµСЃ.',
                  'Digital subscriptions are shared via an account invite once members join and pay. No telecom identifier required.',
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>
                {tx(language, 'РќР°Р·Р°Рґ', 'РђСЂС‚Т›Р°', 'Back')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isTelecom && !confirmed}
                onClick={() => setStep(3)}
              >
                {tx(language, 'РџСЂРѕРґРѕР»Р¶РёС‚СЊ', 'Р–Р°Р»Т“Р°СЃС‚С‹СЂСѓ', 'Continue')}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'РџСЂРѕРІРµСЂРєР° Рё РїСѓР±Р»РёРєР°С†РёСЏ', 'РўРµРєСЃРµСЂСѓ Р¶У™РЅРµ Р¶Р°СЂРёСЏР»Р°Сѓ', 'Review & Publish')}
            </h3>
            {[
              {
                label: tx(language, 'РўРёРї РєРѕРјРЅР°С‚С‹', 'Р‘У©Р»РјРµ С‚ТЇСЂС–', 'Room type'),
                value: isTelecom
                  ? tx(language, 'РЎРІСЏР·СЊ', 'РўРµР»РµРєРѕРј', 'Telecom')
                  : tx(language, 'Р¦РёС„СЂРѕРІР°СЏ', 'Р¦РёС„СЂР»С‹Т›', 'Digital'),
              },
              {
                label: tx(language, 'РћРїРµСЂР°С‚РѕСЂ', 'РћРїРµСЂР°С‚РѕСЂ', 'Operator'),
                value: selectedService?.name ?? 'вЂ”',
              },
              {
                label: tx(language, 'РўР°СЂРёС„', 'РўР°СЂРёС„', 'Plan'),
                value: selectedTariff?.name ?? tx(language, 'РЎРІРѕР№', 'УЁР·С–РЅРґС–Рє', 'Custom'),
              },
              { label: tx(language, 'РќР°Р·РІР°РЅРёРµ', 'РђС‚Р°СѓС‹', 'Title'), value: title || 'вЂ”' },
              { label: tx(language, 'РњРµСЃС‚Р°', 'РћСЂС‹РЅРґР°СЂ', 'Seats'), value: String(seatCount) },
              {
                label: tx(language, 'Р—Р° СѓС‡Р°СЃС‚РЅРёРєР°', 'ТљР°С‚С‹СЃСѓС€С‹ ТЇС€С–РЅ', 'Per member'),
                value:
                  `${currencySymbol}${moneyFmt(perMemberDerived)}/${periodLabel(periodType)}` +
                  (currency !== 'KZT' && perMemberKztEquivalent != null
                    ? ` (в‰€ в‚ё${moneyFmt(perMemberKztEquivalent)})`
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
                  'РџРѕРґРєР»СЋС‡РёС‚Рµ РєР°СЂС‚Сѓ РґР»СЏ РІС‹РїР»Р°С‚ РІС‹С€Рµ, С‡С‚РѕР±С‹ РѕРїСѓР±Р»РёРєРѕРІР°С‚СЊ.',
                  'Р–Р°СЂРёСЏР»Р°Сѓ ТЇС€С–РЅ Р¶РѕТ“Р°СЂС‹РґР° С‚У©Р»РµРј РєР°СЂС‚Р°СЃС‹РЅ Т›РѕСЃС‹ТЈС‹Р·.',
                  'Connect a payout card above to publish.',
                )}
              </p>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>
                {tx(language, 'РќР°Р·Р°Рґ', 'РђСЂС‚Т›Р°', 'Back')}
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={submitting}
                disabled={hasPayoutCard === false || (!!user && !user.phoneVerified)}
                onClick={handlePublish}
              >
                {tx(language, 'РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ РєРѕРјРЅР°С‚Сѓ', 'Р‘У©Р»РјРµРЅС– Р¶Р°СЂРёСЏР»Р°Сѓ', 'Publish Room')}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

