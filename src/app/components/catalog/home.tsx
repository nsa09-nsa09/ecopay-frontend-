import { memo, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Search } from "lucide-react";
import { Badge, Button, Card, Select, Skeleton } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import {
  ApiError,
  getCategories,
  getServices,
  matchRoomForService,
  type CatalogSort,
  type CategoryDto,
  type ServiceDto,
} from "../../lib/api";

type L = "ru" | "kz" | "en";

const tx = (language: L, ru: string, kz: string, en: string) =>
  language === "ru" ? ru : language === "kz" ? kz : en;

function formatServicePrice(value: number | null | undefined, currency: string | null | undefined): string {
  if (value == null) return "—";
  const n = Math.round(Number(value));
  if (currency === "USD") return `$${n.toLocaleString("en-US")}`;
  return `₸${n.toLocaleString("ru-RU")}`;
}

function serviceInitial(name: string): string {
  return (name?.charAt(0) ?? "?").toUpperCase();
}

const faqs: { q: { ru: string; kz: string; en: string }; a: { ru: string; kz: string; en: string } }[] = [
  {
    q: { ru: "Сколько стоит Ecopay?", kz: "Ecopay қанша тұрады?", en: "How much does Ecopay cost?" },
    a: {
      ru: "Создать группу подписки можно бесплатно. Участник видит итоговую цену до оплаты, включая сервисный сбор и защиту платежа.",
      kz: "Топ жасау тегін. Қатысушы төлемге дейін сервис алымы мен төлем қорғауын қоса алғанда толық бағаны көреді.",
      en: "Creating a room is free. Members see the final price before payment, including service fees and payment protection.",
    },
  },
  {
    q: { ru: "Что если доступ не выдали?", kz: "Қолжетімділік берілмесе не болады?", en: "What if access is not provided?" },
    a: {
      ru: "После оплаты деньги остаются в hold 30 дней. Если доступ не выдали, он не работает или вас удалили из подписки, можно открыть спор — модератор проверит и при необходимости вернёт деньги.",
      kz: "Төлемнен кейін ақша 30 күн hold-та болады. Егер қолжетімділік берілмесе, жұмыс істемесе немесе сізді жазылымнан шығарса, дау ашуға болады — модератор тексеріп, қажет болса ақшаны қайтарады.",
      en: "After payment, the money stays on a 30-day hold. If access isn't granted, doesn't work, or you're removed, you can open a dispute — a moderator will review and refund if needed.",
    },
  },
  {
    q: { ru: "Как работает 30-дневный hold?", kz: "30 күндік hold қалай жұмыс істейді?", en: "How does the 30-day hold work?" },
    a: {
      ru: "Деньги участника замораживаются на стороне EcoPay 30 дней. Владелец получает выплату только после успешного периода без споров.",
      kz: "Қатысушының ақшасы EcoPay жағында 30 күн ұсталады. Иесі дау-дамайсыз сәтті кезеңнен кейін ғана төлемді алады.",
      en: "Member's funds are held by EcoPay for 30 days. The owner only receives the payout after a clean period with no disputes.",
    },
  },
  {
    q: { ru: "Как делится оплата между участниками?", kz: "Төлем қатысушылар арасында қалай бөлінеді?", en: "How is the payment split between members?" },
    a: {
      ru: "Каждый участник платит свою долю отдельно, прямо EcoPay. Владелец не собирает деньги вручную — мы сами разводим транзакции и держим их под защитой.",
      kz: "Әр қатысушы өз үлесін бөлек, тікелей EcoPay-ге төлейді. Иесі ақшаны қолмен жинамайды — біз транзакцияларды бөліп, қорғауда ұстаймыз.",
      en: "Each member pays their share separately, directly to EcoPay. The owner doesn't collect money manually — we route the transactions and keep them protected.",
    },
  },
  {
    q: { ru: "Что с возвратами и спорами?", kz: "Қайтарулар мен даулар не туралы?", en: "What about refunds and disputes?" },
    a: {
      ru: "Если что-то пошло не так — кнопка «Открыть спор» в комнате. Возврат может быть полным или частичным (пропорционально оставшемуся периоду). Решение принимает администратор и логирует его.",
      kz: "Бір нәрсе дұрыс болмаса — бөлмедегі «Дау ашу» түймесін басыңыз. Қайтару толық немесе ішінара болуы мүмкін (қалған кезеңге сай). Шешімді әкімші қабылдайды және оны журналға жазады.",
      en: "If something goes wrong, use the Open Dispute button inside the room. Refunds can be full or partial (pro-rated to the remaining period). An admin reviews the decision and logs it.",
    },
  },
  {
    q: { ru: "Безопасно ли передавать данные владельцу?", kz: "Иесіне деректерді беру қауіпсіз бе?", en: "Is it safe to share data with the owner?" },
    a: {
      ru: "Личные данные внутри EcoPay шифруются. Идентификаторы (например, номер) видны только после оплаты и только владельцу, и каждый доступ логируется в аудит.",
      kz: "EcoPay ішіндегі дербес деректер шифрланады. Идентификаторлар (мысалы, нөмір) тек төлемнен кейін және тек иесіне ғана көрінеді, әр қатынау аудитке жазылады.",
      en: "Personal data inside EcoPay is encrypted. Identifiers (such as phone numbers) are revealed only after payment and only to the owner, and every access is written to an audit log.",
    },
  },
  {
    q: { ru: "Поддерживаются ли другие валюты?", kz: "Басқа валюталар қолдау таба ма?", en: "Are other currencies supported?" },
    a: {
      ru: "Цены можно задавать в KZT, USD и других ключевых валютах: при создании комнаты EcoPay показывает курс к тенге, чтобы участник понимал итог.",
      kz: "Бағаларды KZT, USD және басқа негізгі валюталарда көрсетуге болады: бөлме жасағанда EcoPay теңгеге деген бағамды көрсетеді, қатысушы қорытындыны түсінеді.",
      en: "You can price rooms in KZT, USD, and other key currencies. When you create a room, EcoPay shows the conversion to KZT so members understand the total.",
    },
  },
  {
    q: { ru: "Можно ли отменить комнату до старта?", kz: "Бөлмені басталғанға дейін болдырмауға бола ма?", en: "Can I cancel a room before it starts?" },
    a: {
      ru: "Да: пока статус OPEN и дата старта не наступила, владелец и участники могут отменять заявки без штрафа. После старта работают правила hold и споров.",
      kz: "Иә: статус OPEN болғанша және басталу күні келмегенше иесі мен қатысушылар өтінімдерді айыппұлсыз болдырмай алады. Басталғаннан кейін hold пен дау ережелері қолданылады.",
      en: "Yes — while the status is OPEN and the start date hasn't passed, the owner and members can cancel without penalty. After it starts, hold and dispute rules apply.",
    },
  },
];

interface ServiceCardProps {
  service: ServiceDto;
  language: L;
  t: (k: string, p?: Record<string, string | number>) => string;
  onPick: (service: ServiceDto) => void;
  pending: boolean;
}

const CatalogServiceCard = memo(function CatalogServiceCard({ service, language, t, onPick, pending }: ServiceCardProps) {
  const tariffs = service.tariffCount ?? 0;
  const hasPrice = service.minPricePerMember != null;
  return (
    <button
      type="button"
      onClick={() => onPick(service)}
      disabled={pending}
      className="text-left w-full h-full focus:outline-none"
      style={{ background: "transparent", border: "none" }}
    >
      <Card
        className="h-full flex flex-col gap-4 cursor-pointer transition-shadow"
        // Subtle elevation on hover for a polished feel.
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <ServiceLogo url={service.logoUrl} name={service.name} />
            <div className="min-w-0">
              <div className="text-[15px] truncate" style={{ color: "var(--eco-text)" }}>{service.name}</div>
              <div className="text-[12px] truncate" style={{ color: "var(--eco-text-tertiary)" }}>
                {service.categoryName}
              </div>
            </div>
          </div>
          {tariffs > 0 && (
            <Badge variant="info">{t("marketplaceTariffsCount", { count: tariffs })}</Badge>
          )}
        </div>

        <div className="mt-auto">
          {hasPrice ? (
            <div className="flex items-baseline gap-2">
              <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("marketplaceFromPrice")}</span>
              <span className="text-[24px]" style={{ color: "var(--eco-primary)", fontWeight: 700 }}>
                {formatServicePrice(service.minPricePerMember, service.currency)}
              </span>
            </div>
          ) : (
            <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {t("marketplaceNoTariffs")}
            </span>
          )}
          <div className="mt-3 text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(language, "за участника / месяц", "қатысушыға / ай", "per member / month")}
          </div>
        </div>
      </Card>
    </button>
  );
});

function ServiceLogo({ url, name }: { url?: string | null; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={48}
        height={48}
        loading="lazy"
        decoding="async"
        className="w-12 h-12 rounded-xl shrink-0"
        style={{
          objectFit: "cover",
          background: "var(--eco-surface)",
          border: "1px solid var(--eco-border)",
        }}
      />
    );
  }
  return (
    <div
      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
      style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)", fontWeight: 700, border: "1px solid var(--eco-border)" }}
    >
      {serviceInitial(name)}
    </div>
  );
}

const MarketplaceSkeletonCard = memo(function MarketplaceSkeletonCard() {
  return (
    <Card className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton width={48} height={48} rounded={12} />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={32} />
      <Skeleton width="50%" height={12} />
    </Card>
  );
});

interface FaqItemProps {
  id: number;
  open: boolean;
  question: string;
  answer: string;
  onToggle: (id: number) => void;
}

const FaqItem = memo(function FaqItem({ id, open, question, answer, onToggle }: FaqItemProps) {
  const panelId = `faq-panel-${id}`;
  const btnId = `faq-button-${id}`;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)" }}
    >
      <button
        id={btnId}
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        aria-controls={panelId}
        className="w-full text-left p-4 cursor-pointer flex items-center justify-between gap-4"
        style={{ background: "transparent", border: "none" }}
      >
        <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{question}</span>
        <ChevronDown
          size={16}
          style={{
            color: "var(--eco-text-tertiary)",
            transform: open ? "rotate(180deg)" : undefined,
            transition: "transform 200ms",
            flexShrink: 0,
          }}
        />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={btnId}
        hidden={!open}
        className="px-4 pb-4 text-[13px]"
        style={{ color: "var(--eco-text-secondary)" }}
      >
        {answer}
      </div>
    </div>
  );
});

interface CategoryIconProps {
  active: boolean;
}

// Simple geometric dot — avoids the "AI vibes" of cute lucide icons
// previously used as category decoration.
function CategoryDot({ active }: CategoryIconProps) {
  return (
    <span
      aria-hidden
      className="w-1.5 h-1.5 rounded-full inline-block"
      style={{ background: active ? "var(--eco-text-on-primary)" : "var(--eco-text-tertiary)" }}
    />
  );
}

export function HomePage() {
  const { language, t } = useI18n();
  const lang = language as L;
  const navigate = useNavigate();
  const { isAuthenticated, authorizedRequest } = useAuth();

  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number>(-1);
  const [sort, setSort] = useState<CatalogSort>("name_asc");

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [matchingServiceId, setMatchingServiceId] = useState<number | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCategories()
      .then((data) => { if (!cancelled) setCategories(data); })
      .catch(() => { /* silent — UI gracefully degrades to "all" */ });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setServicesError(null);
    const handle = window.setTimeout(() => {
      setServicesLoading(true);
      void getServices(activeCategoryId === "all" ? undefined : activeCategoryId, sort)
        .then((data) => {
          if (!cancelled) setServices(data);
        })
        .catch(() => {
          if (!cancelled) setServicesError(t("marketplaceLoadFailed"));
        })
        .finally(() => {
          if (!cancelled) setServicesLoading(false);
        });
    }, 150);
    return () => { cancelled = true; window.clearTimeout(handle); };
  }, [activeCategoryId, sort, t]);

  const sortOptions = useMemo(() => [
    { value: "name_asc", label: t("sortNameAsc") },
    { value: "name_desc", label: t("sortNameDesc") },
    { value: "price_asc", label: t("sortPriceAsc") },
    { value: "price_desc", label: t("sortPriceDesc") },
    { value: "newest", label: t("sortNewest") },
  ], [t]);

  const filteredServices = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return services;
    return services.filter((service) =>
      service.name.toLowerCase().includes(normalizedQuery)
      || service.categoryName.toLowerCase().includes(normalizedQuery),
    );
  }, [services, query]);

  const localizedFaqs = useMemo(
    () =>
      faqs.map((faq, index) => ({
        id: index,
        question: tx(lang, faq.q.ru, faq.q.kz, faq.q.en),
        answer: tx(lang, faq.a.ru, faq.a.kz, faq.a.en),
      })),
    [lang],
  );

  const handlePickService = async (service: ServiceDto) => {
    setMatchError(null);
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent("/")}`);
      return;
    }
    setMatchingServiceId(service.id);
    try {
      const result = await authorizedRequest((token) => matchRoomForService(service.id, token));
      if (result.action === "JOIN" && result.roomId != null) {
        navigate(`/room/${result.roomId}`);
      } else {
        navigate("/rooms/create", { state: { serviceId: service.id, reason: "no-free-rooms" } });
      }
    } catch (err) {
      // Silently fall back to the create flow — owners can always start a new
      // room when match cannot resolve, and we never want raw server text here.
      if (err instanceof ApiError && err.code !== "network") {
        navigate("/rooms/create", { state: { serviceId: service.id, reason: "no-free-rooms" } });
      } else {
        setMatchError(t("marketplaceLoadFailed"));
      }
    } finally {
      setMatchingServiceId(null);
    }
  };

  const categoryItems: { id: number | "all"; name: string }[] = useMemo(
    () => [
      { id: "all", name: tx(lang, "Все", "Барлығы", "All") },
      ...categories.map((c) => ({ id: c.id, name: c.name })),
    ],
    [categories, lang],
  );

  return (
    <div style={{ background: "var(--eco-bg)" }}>
      {/* Marketplace — first thing the user sees */}
      <section id="marketplace" className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-10 sm:pb-14">
        <header className="mb-8 sm:mb-10">
          <h1
            className="text-[28px] sm:text-[36px] lg:text-[40px] leading-tight tracking-tight"
            style={{ color: "var(--eco-text)", fontWeight: 700 }}
          >
            {tx(lang, "Платите меньше за семейные подписки", "Отбасылық жазылымдарға аз төлеңіз", "Pay less for family subscriptions")}
          </h1>
          <p className="text-[14px] sm:text-[15px] mt-3 max-w-2xl" style={{ color: "var(--eco-text-secondary)" }}>
            {tx(
              lang,
              "Выберите сервис — мы подберём комнату или предложим создать свою.",
              "Сервисті таңдаңыз — біз бөлме табамыз немесе өзіңіздікін жасауды ұсынамыз.",
              "Pick a service — we'll match a room or help you create one.",
            )}
          </p>
        </header>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div className="relative flex-1 sm:max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--eco-text-tertiary)" }} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={tx(lang, "Поиск: YouTube, Netflix, Canva…", "Іздеу: YouTube, Netflix, Canva…", "Search: YouTube, Netflix, Canva…")}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] outline-none"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              aria-label={tx(lang, "Поиск", "Іздеу", "Search")}
            />
          </div>
          <div className="w-full sm:w-56">
            <Select
              aria-label={t("sortByLabel")}
              value={sort}
              onChange={(e) => setSort(e.target.value as CatalogSort)}
              options={sortOptions}
            />
          </div>
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1">
          {categoryItems.map((category) => {
            const active = activeCategoryId === category.id;
            return (
              <button
                key={`cat-${category.id}`}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-[13px] shrink-0 cursor-pointer transition-colors"
                style={{
                  background: active ? "var(--eco-primary)" : "var(--eco-surface)",
                  color: active ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
                  border: `1px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
                }}
              >
                <CategoryDot active={active} />
                {category.name}
              </button>
            );
          })}
        </div>

        {servicesError && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{servicesError}</span>
          </Card>
        )}

        {matchError && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: "var(--eco-negative)" }}>{matchError}</span>
          </Card>
        )}

        {servicesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => <MarketplaceSkeletonCard key={i} />)}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="text-center py-12 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {t("marketplaceNoServices")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredServices.map((service) => (
              <CatalogServiceCard
                key={service.id}
                service={service}
                language={lang}
                t={t}
                onPick={handlePickService}
                pending={matchingServiceId === service.id}
              />
            ))}
          </div>
        )}
      </section>

      {/* FAQ — kept below the fold for context */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 sm:py-12" style={{ borderTop: "1px solid var(--eco-border)" }}>
        <h2 className="text-[22px] sm:text-[24px] text-center mb-6" style={{ color: "var(--eco-text)" }}>{t("faqSectionTitle")}</h2>
        <div className="flex flex-col gap-3">
          {localizedFaqs.map((faq) => (
            <FaqItem
              key={faq.id}
              id={faq.id}
              question={faq.question}
              answer={faq.answer}
              open={openFaq === faq.id}
              onToggle={(id) => setOpenFaq((prev) => (prev === id ? -1 : id))}
            />
          ))}
        </div>
      </section>

      <section className="px-4 sm:px-6 pb-14">
        <div className="max-w-[1200px] mx-auto rounded-xl p-5 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5" style={{ background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" }}>
          <div>
            <div className="text-[20px] sm:text-[24px]" style={{ fontWeight: 700 }}>
              {tx(lang, "Готовы экономить с EcoPay?", "EcoPay арқылы үнемдеуге дайынсыз ба?", "Ready to save with EcoPay?")}
            </div>
            <div className="text-[13px] mt-1" style={{ opacity: 0.85 }}>
              {tx(lang, "Создайте аккаунт и подключитесь к свободной группе.", "Аккаунт жасап, бос топқа қосылыңыз.", "Create an account and join an open group.")}
            </div>
          </div>
          <Button
            variant="secondary"
            size="lg"
            className="w-full md:w-auto"
            onClick={() => navigate(isAuthenticated ? "/rooms" : "/register")}
          >
            {tx(lang, "Начать", "Бастау", "Get started")}
          </Button>
        </div>
      </section>
    </div>
  );
}
