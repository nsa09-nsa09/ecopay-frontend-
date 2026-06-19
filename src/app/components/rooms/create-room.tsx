import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Card, Button, Input, Select, Stepper } from "../ds-primitives";
import { AlertTriangle, ArrowLeft, Lock, Check, Shield } from "lucide-react";
import {
  ApiError,
  createRoomRequest,
  getFxRatesRequest,
  getServices,
  getTariffs,
  type FxRatesResponse,
  type RoomResponseDto,
  type ServiceDto,
  type SupportedCurrency,
  type TariffPlanDto,
} from "../../lib/api";
import { useAuth } from "../auth/auth-provider";
import { useI18n, type Language } from "../i18n-provider";

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  KZT: "₸",
  USD: "$",
  EUR: "€",
  CNY: "¥",
  GBP: "£",
  RUB: "₽",
  UZS: "сум",
  KGS: "сом",
};

function defaultStartDate() {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  d.setMinutes(0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface CreateRoomLocationState {
  serviceId?: number;
  reason?: "no-free-rooms" | string;
}

export function CreateRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const navState = (location.state as CreateRoomLocationState | null) ?? null;
  const { isAuthenticated, isReady, authorizedRequest, user } = useAuth();
  const { language, t } = useI18n();

  const stepLabels = [
    tx(language, "Оператор и тариф", "Оператор және тариф", "Operator & Plan"),
    tx(language, "Настройки комнаты", "Бөлме баптаулары", "Room Settings"),
    tx(language, "Способ доступа", "Қатынас тәсілі", "Access Method"),
    tx(language, "Проверка", "Тексеру", "Review"),
  ];

  const CONNECTION_OPTIONS = [
    { value: "ESIM", label: tx(language, "Активация eSIM", "eSIM белсендіру", "eSIM activation") },
    { value: "SIM", label: tx(language, "Физическая SIM-карта", "Физикалық SIM-карта", "Physical SIM card") },
    { value: "ACCOUNT_LINK", label: tx(language, "Приглашение в аккаунт оператора", "Оператор тіркелгісіне шақыру", "Operator account invite") },
    { value: "OTHER", label: tx(language, "Другое", "Басқа", "Other") },
  ];

  const PERIOD_OPTIONS = [
    { value: "MONTHLY", label: tx(language, "Ежемесячно", "Айлық", "Monthly") },
    { value: "YEARLY", label: tx(language, "Ежегодно", "Жылдық", "Yearly") },
    { value: "OTHER", label: tx(language, "Другое", "Басқа", "Other") },
  ];

  const periodLabel = (p: string | null | undefined) =>
    PERIOD_OPTIONS.find((o) => o.value === p)?.label ?? (p ?? "").toLowerCase();

  const [step, setStep] = useState(0);

  const [services, setServices] = useState<ServiceDto[]>([]);
  const [tariffs, setTariffs] = useState<TariffPlanDto[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  const [serviceId, setServiceId] = useState<string>("");
  const [tariffPlanId, setTariffPlanId] = useState<string>("");
  const [roomType, setRoomType] = useState("TELECOM");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState(defaultStartDate());
  const [connectionType, setConnectionType] = useState("ESIM");
  const [restrictions, setRestrictions] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [published, setPublished] = useState<RoomResponseDto | null>(null);

  // FX rates: the tariff's currency is fixed (admin-set); we still fetch live
  // rates so non-KZT plans can show their KZT equivalent in the review step.
  const [fxRates, setFxRates] = useState<FxRatesResponse | null>(null);
  const [fxError, setFxError] = useState<string | null>(null);

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      navigate("/login?redirect=/rooms/create");
    }
  }, [isReady, isAuthenticated, navigate]);

  useEffect(() => {
    let cancelled = false;
    getFxRatesRequest()
      .then((res) => {
        if (cancelled) return;
        setFxRates(res);
        setFxError(null);
      })
      .catch(() => {
        if (!cancelled) setFxError(t("priceFxUnavailable"));
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
            ? list.find((s) => s.id === navState.serviceId)
            : undefined;
        if (preferred) {
          setServiceId(String(preferred.id));
        } else if (list.length > 0) {
          setServiceId(String(list[0].id));
        }
      })
      .catch(() => {
        if (!cancelled) setCatalogError(tx(language, "Не удалось загрузить каталог сервисов.", "Сервистер каталогын жүктеу мүмкін болмады.", "Unable to load the service catalog right now."));
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

  useEffect(() => {
    if (!serviceId) {
      setTariffs([]);
      setTariffPlanId("");
      return;
    }
    let cancelled = false;
    getTariffs(Number(serviceId))
      .then((list) => {
        if (cancelled) return;
        setTariffs(list);
        setTariffPlanId("");
      })
      .catch(() => {
        if (!cancelled) setTariffs([]);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceId]);

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
        setTitle(`${selectedService?.name ?? ""} ${tariff.name}`.trim());
      }
    }
  };

  // Pricing fields are derived from the selected tariff — never editable here.
  const seatCount = selectedTariff?.maxMembers ?? 0;
  const totalNumeric = Number(selectedTariff?.basePriceTotal ?? 0) || 0;
  const perMemberDerived = seatCount > 0 ? Math.round(totalNumeric / seatCount) : 0;
  const periodType = selectedTariff?.periodType ?? "MONTHLY";
  const currency = (selectedTariff?.currency ?? "KZT") as SupportedCurrency;

  const isTelecom = roomType === "TELECOM";

  // FX rates: 1 unit of `code` = N tenge. For KZT (base) the rate is 1.
  const rateToKzt = (code: SupportedCurrency): number | null => {
    if (code === "KZT") return 1;
    const rate = fxRates?.rates?.[code];
    return typeof rate === "number" && rate > 0 ? rate : null;
  };

  const currentRate = rateToKzt(currency);

  const convertToKzt = (amount: number): number | null => {
    if (currentRate == null) return null;
    if (!Number.isFinite(amount)) return null;
    return Math.round(amount * currentRate);
  };

  const perMemberKztEquivalent = convertToKzt(perMemberDerived);

  const moneyFmt = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(n);

  const currencySymbol = CURRENCY_SYMBOLS[currency] ?? currency;

  const handlePublish = async () => {
    setSubmitError(null);

    if (!serviceId) {
      setSubmitError(tx(language, "Выберите оператора.", "Операторды таңдаңыз.", "Please select a service."));
      setStep(0);
      return;
    }
    if (!tariffPlanId) {
      setSubmitError(tx(language, "Выберите тариф.", "Тарифті таңдаңыз.", "Please select a plan."));
      setStep(0);
      return;
    }
    if (!title.trim()) {
      setSubmitError(tx(language, "Укажите название комнаты.", "Бөлме атауын көрсетіңіз.", "Please enter a room title."));
      setStep(1);
      return;
    }
    if (isTelecom && !confirmed) {
      setSubmitError(tx(language, "Подтвердите условия оператора.", "Оператор шарттарын растаңыз.", "You must confirm operator terms for a telecom room."));
      setStep(2);
      return;
    }

    setSubmitting(true);
    try {
      const room = await authorizedRequest((token) =>
        createRoomRequest(
          {
            categoryId: selectedService?.categoryId ?? null,
            serviceId: Number(serviceId),
            tariffPlanId: Number(tariffPlanId),
            roomType,
            title: title.trim(),
            startDate: startDate.length === 16 ? `${startDate}:00` : startDate,
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
        setSubmitError(tx(language, "Не удалось опубликовать комнату. Попробуйте снова.", "Бөлмені жариялау мүмкін болмады. Қайта көріңіз.", "Unable to publish the room right now. Please try again."));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (published) {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16 text-center">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: "var(--eco-success-100)" }}>
          <Check size={24} style={{ color: "var(--eco-positive)" }} />
        </div>
        <h1 className="text-[24px] mb-2" style={{ color: "var(--eco-text)" }}>
          {tx(language, "Комната опубликована", "Бөлме жарияланды", "Room Published")}
        </h1>
        <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
          {tx(
            language,
            `Ваша комната «${published.title}» появилась в каталоге. Участники могут подавать заявки.`,
            `Сіздің «${published.title}» бөлмеңіз каталогта пайда болды. Қатысушылар өтінім бере алады.`,
            `Your room "${published.title}" is now visible in the catalog. Members can apply to join.`,
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={`/rooms/owner/${published.id}`} className="w-full sm:w-auto" style={{ textDecoration: "none" }}>
            <Button variant="secondary" className="w-full sm:w-auto">{tx(language, "Управлять комнатой", "Бөлмені басқару", "Manage Room")}</Button>
          </Link>
          <Link to={`/room/${published.id}`} className="w-full sm:w-auto" style={{ textDecoration: "none" }}>
            <Button variant="primary" className="w-full sm:w-auto">{tx(language, "Открыть в каталоге", "Каталогтан көру", "View in Catalog")}</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <Link to="/rooms" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(language, "Мои комнаты", "Менің бөлмелерім", "My Rooms")}
      </Link>

      <h1 className="text-[22px] sm:text-[26px] mb-6" style={{ color: "var(--eco-text)" }}>
        {tx(language, "Создать комнату", "Бөлме жасау", "Create Room")}
      </h1>

      {catalogError && (
        <div className="p-4 rounded-lg mb-6 text-[13px]" style={{ background: "var(--eco-danger-100, #fde8e8)", color: "var(--eco-negative)" }}>
          {catalogError}
        </div>
      )}

      {navState?.reason === "no-free-rooms" && (
        <div
          className="p-3 rounded-lg mb-4 text-[13px] flex items-start gap-2"
          style={{ background: "var(--eco-brand-50)", color: "var(--eco-text-secondary)", border: "1px solid var(--eco-border)" }}
        >
          <Shield size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-primary)" }} />
          <span>
            {tx(
              language,
              "Сейчас нет свободных комнат по этой подписке — создайте свою.",
              "Бұл жазылым бойынша бос бөлме әзірге жоқ — өзіңіздікін жасаңыз.",
              "There are no open rooms for this subscription right now — create your own.",
            )}
          </span>
        </div>
      )}

      {isAuthenticated && user && !user.phoneVerified && (
        <div
          className="p-3 rounded-lg mb-4 text-[13px] flex items-start gap-2"
          style={{ background: "var(--eco-warning-100)", color: "var(--eco-text-secondary)" }}
        >
          <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
          <span>
            {tx(
              language,
              "Подтвердите номер телефона перед созданием комнаты.",
              "Бөлме жасамас бұрын телефон нөміріңізді растаңыз.",
              "Verify your phone number before creating a room.",
            )}{" "}
            <Link to="/profile" style={{ color: "var(--eco-primary)" }}>
              {tx(language, "Перейти в профиль", "Профильге өту", "Go to profile")}
            </Link>
            .
          </span>
        </div>
      )}

      <div className="p-4 rounded-lg flex items-start gap-3 mb-6" style={{ background: "var(--eco-warning-100)" }}>
        <Lock size={16} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning)" }} />
        <div>
          <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>
            {tx(language, "Критические поля блокируются после старта", "Маңызды өрістер басталу күнінен кейін құлыпталады", "Critical fields lock after start date")}
          </div>
          <div className="text-[13px] mt-0.5" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(
              language,
              "Оператор, тариф, число мест и цена нельзя изменить после даты старта. Чтобы поправить — отмените и создайте комнату заново.",
              "Оператор, тариф, орын саны және баға басталу күнінен кейін өзгертілмейді. Өзгерту үшін бөлмені тоқтатып, қайта жасаңыз.",
              "Operator, plan, seats, and price cannot be changed once the start date has passed. Editing requires cancelling and re-creating the room.",
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-6">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] sm:text-[13px]"
          style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)", border: "1px solid var(--eco-border)" }}
        >
          <Shield size={13} style={{ color: "var(--eco-primary)" }} />
          {tx(language, "Режим верификации: по риску (по умолчанию)", "Растау режимі: тәуекелге қарай (әдепкі)", "Verification mode: Risk-based (default)")}
        </div>
        <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {tx(language, "Задаётся бэкендом", "Бэкенд анықтайды", "Set by backend")}
        </div>
      </div>

      <Stepper steps={stepLabels} current={step} />

      <div className="mt-8">
        {step === 0 && (
          <Card className="flex flex-col gap-4">
            <Select
              label={tx(language, "Тип комнаты", "Бөлме түрі", "Room Type")}
              options={[
                { value: "TELECOM", label: tx(language, "Связь (SIM / eSIM / тариф оператора)", "Байланыс (SIM / eSIM / оператор тарифі)", "Telecom (SIM / eSIM / operator plan)") },
                { value: "DIGITAL", label: tx(language, "Цифровая подписка", "Цифрлық жазылым", "Digital subscription") },
              ]}
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
            />
            <Select
              label={tx(language, "Оператор / Провайдер", "Оператор / Провайдер", "Operator / Provider")}
              options={
                services.length > 0
                  ? services.map((s) => ({ value: String(s.id), label: s.name }))
                  : [{ value: "", label: tx(language, "Загрузка сервисов...", "Сервистер жүктелуде...", "Loading services...") }]
              }
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            />
            <Select
              label={tx(language, "Тариф", "Тариф", "Plan")}
              options={[
                {
                  value: "",
                  label: tariffs.length > 0
                    ? tx(language, "Выберите тариф", "Тарифті таңдаңыз", "Select a plan")
                    : tx(language, "Тарифов нет", "Тарифтер жоқ", "No plans available"),
                },
                ...tariffs.map((t) => ({
                  value: String(t.id),
                  label: `${t.name} — ${CURRENCY_SYMBOLS[(t.currency ?? "KZT") as SupportedCurrency] ?? t.currency}${Number(t.basePriceTotal).toLocaleString()} / ${periodLabel(t.periodType)}`,
                })),
              ]}
              value={tariffPlanId}
              onChange={(e) => applyTariff(e.target.value)}
            />
            {selectedTariff && (
              <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: "var(--eco-brand-50)", border: "1px solid var(--eco-border)" }}>
                <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                  <Lock size={12} style={{ color: "var(--eco-primary)" }} />
                  {tx(language, "Цена, валюта, период и число мест заданы тарифом", "Баға, валюта, кезең және орын саны тарифпен анықталады", "Price, currency, period and seats are set by the plan")}
                </div>
                {[
                  { label: tx(language, "Число мест", "Орын саны", "Seats"), value: String(selectedTariff.maxMembers) },
                  { label: tx(language, "Общая цена", "Жалпы баға", "Total price"), value: `${currencySymbol}${moneyFmt(totalNumeric)}` },
                  { label: tx(language, "За участника", "Қатысушы үшін", "Per member"), value: `${currencySymbol}${moneyFmt(perMemberDerived)}` },
                  { label: tx(language, "Период", "Кезең", "Period"), value: periodLabel(periodType) },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-[13px]">
                    <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                    <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
            <Button variant="primary" className="w-full" disabled={!serviceId || !tariffPlanId} onClick={() => setStep(1)}>
              {tx(language, "Продолжить", "Жалғастыру", "Continue")}
            </Button>
          </Card>
        )}

        {step === 1 && (
          <Card className="flex flex-col gap-4">
            <Input
              label={tx(language, "Название комнаты", "Бөлме атауы", "Room Title")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={tx(language, "напр. Beeline Family 4", "мысалы Beeline Family 4", "e.g. Beeline Family 4")}
            />
            <div className="rounded-lg p-3 flex flex-col gap-2" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
              <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
                <Lock size={12} style={{ color: "var(--eco-primary)" }} />
                {tx(language, "Условия тарифа", "Тариф шарттары", "Plan terms")} · {selectedTariff?.name ?? "—"}
              </div>
              {[
                { label: tx(language, "Число мест", "Орын саны", "Seats"), value: String(seatCount) },
                { label: tx(language, "Общая цена", "Жалпы баға", "Total price"), value: `${currencySymbol}${moneyFmt(totalNumeric)}` },
                {
                  label: tx(language, "За участника", "Қатысушы үшін", "Per member"),
                  value:
                    `${currencySymbol}${moneyFmt(perMemberDerived)}/${periodLabel(periodType)}` +
                    (currency !== "KZT" && perMemberKztEquivalent != null ? ` (≈ ₸${moneyFmt(perMemberKztEquivalent)})` : ""),
                },
                { label: tx(language, "Период", "Кезең", "Period"), value: periodLabel(periodType) },
              ].map((row) => (
                <div key={row.label} className="flex justify-between text-[13px]">
                  <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                  <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
                </div>
              ))}
              {currency !== "KZT" && fxError && (
                <span className="text-[11px] break-words" style={{ color: "var(--eco-warning-500)" }}>{fxError}</span>
              )}
            </div>
            <Input
              label={tx(language, "Дата старта", "Басталу күні", "Start Date")}
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              hint={tx(language, "Должна быть в будущем", "Болашақта болуы керек", "Must be in the future")}
            />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(0)}>{tx(language, "Назад", "Артқа", "Back")}</Button>
              <Button variant="primary" className="flex-1" onClick={() => setStep(2)}>{tx(language, "Продолжить", "Жалғастыру", "Continue")}</Button>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card className="flex flex-col gap-4">
            {isTelecom ? (
              <>
                <Select
                  label={tx(language, "Способ доступа", "Қатынас тәсілі", "Access Method")}
                  options={CONNECTION_OPTIONS}
                  value={connectionType}
                  onChange={(e) => setConnectionType(e.target.value)}
                />
                <Input
                  label={tx(language, "Ограничения оператора (опционально)", "Оператор шектеулері (міндетті емес)", "Operator Restrictions (optional)")}
                  value={restrictions}
                  onChange={(e) => setRestrictions(e.target.value)}
                  placeholder={tx(language, "напр. только номера KZ", "мысалы тек KZ нөмірлері", "e.g. KZ numbers only")}
                />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" className="mt-0.5" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} />
                  <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                    {tx(
                      language,
                      "Подтверждаю, что оператор поддерживает семейные/групповые тарифы и я — владелец аккаунта либо имею право делиться им.",
                      "Оператордың отбасылық/топтық тарифтерді қолдайтынын және мен тіркелгінің иесі немесе бөлісуге құқылы екенімді растаймын.",
                      "I confirm that this operator supports family/group plans and I am the account holder or authorized to share.",
                    )}
                  </span>
                </label>
              </>
            ) : (
              <div className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
                {tx(
                  language,
                  "Цифровые подписки расшариваются приглашением в аккаунт после оплаты. Идентификатор связи не требуется.",
                  "Цифрлық жазылымдар төлемнен кейін тіркелгіге шақыру арқылы бөлісіледі. Байланыс идентификаторы қажет емес.",
                  "Digital subscriptions are shared via an account invite once members join and pay. No telecom identifier required.",
                )}
              </div>
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(1)}>{tx(language, "Назад", "Артқа", "Back")}</Button>
              <Button
                variant="primary"
                className="flex-1"
                disabled={isTelecom && !confirmed}
                onClick={() => setStep(3)}
              >
                {tx(language, "Продолжить", "Жалғастыру", "Continue")}
              </Button>
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="flex flex-col gap-4">
            <h3 className="text-[14px]" style={{ color: "var(--eco-text)" }}>
              {tx(language, "Проверка и публикация", "Тексеру және жариялау", "Review & Publish")}
            </h3>
            {[
              { label: tx(language, "Тип комнаты", "Бөлме түрі", "Room type"), value: isTelecom ? tx(language, "Связь", "Телеком", "Telecom") : tx(language, "Цифровая", "Цифрлық", "Digital") },
              { label: tx(language, "Оператор", "Оператор", "Operator"), value: selectedService?.name ?? "—" },
              { label: tx(language, "Тариф", "Тариф", "Plan"), value: selectedTariff?.name ?? tx(language, "Свой", "Өзіндік", "Custom") },
              { label: tx(language, "Название", "Атауы", "Title"), value: title || "—" },
              { label: tx(language, "Места", "Орындар", "Seats"), value: String(seatCount) },
              {
                label: tx(language, "За участника", "Қатысушы үшін", "Per member"),
                value:
                  `${currencySymbol}${moneyFmt(perMemberDerived)}/${periodLabel(periodType)}` +
                  (currency !== "KZT" && perMemberKztEquivalent != null ? ` (≈ ₸${moneyFmt(perMemberKztEquivalent)})` : ""),
              },
              { label: tx(language, "Дата старта", "Басталу күні", "Start date"), value: startDate.replace("T", " ") },
              ...(isTelecom
                ? [{ label: tx(language, "Доступ", "Қатынас", "Access"), value: CONNECTION_OPTIONS.find((o) => o.value === connectionType)?.label ?? connectionType }]
                : []),
            ].map((row) => (
              <div key={row.label} className="flex justify-between text-[13px]">
                <span style={{ color: "var(--eco-text-secondary)" }}>{row.label}</span>
                <span style={{ color: "var(--eco-text)" }}>{row.value}</span>
              </div>
            ))}
            {submitError && (
              <p className="text-[12px]" style={{ color: "var(--eco-negative)" }}>{submitError}</p>
            )}
            <div className="border-t pt-3" style={{ borderColor: "var(--eco-border)" }} />
            <div className="flex gap-3">
              <Button variant="ghost" onClick={() => setStep(2)}>{tx(language, "Назад", "Артқа", "Back")}</Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={submitting}
                disabled={!!user && !user.phoneVerified}
                onClick={handlePublish}
              >
                {tx(language, "Опубликовать комнату", "Бөлмені жариялау", "Publish Room")}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
