import { lazy, memo, Suspense, useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Lock,
  Music,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Tv,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, Select, Skeleton, WaveDivider } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import {
  getCategories,
  getServices,
  type CatalogSort,
  type CategoryDto,
  type ServiceDto,
} from "../../lib/api";

const NewsSection = lazy(() => import("./home-news").then((m) => ({ default: m.NewsSection })));
const FeaturedReviewsSection = lazy(() => import("./home-reviews").then((m) => ({ default: m.FeaturedReviewsSection })));

type L = "ru" | "kz" | "en";

const tx = (language: L, ru: string, kz: string, en: string) =>
  language === "ru" ? ru : language === "kz" ? kz : en;

const fallbackCategoryIcon: LucideIcon = Sparkles;
const categoryIconMap: Record<string, LucideIcon> = {
  video: Tv,
  music: Music,
  cloud: Wifi,
  ai: Bot,
  design: Zap,
  apps: Smartphone,
  services: Smartphone,
  telecom: Smartphone,
};

function iconForCategory(slug: string | undefined): LucideIcon {
  if (!slug) return fallbackCategoryIcon;
  return categoryIconMap[slug.toLowerCase()] ?? fallbackCategoryIcon;
}

function formatServicePrice(value: number | null | undefined, currency: string | null | undefined): string {
  if (value == null) return "—";
  const n = Math.round(Number(value));
  if (currency === "USD") return `$${n.toLocaleString("en-US")}`;
  return `₸${n.toLocaleString("ru-RU")}`;
}

function serviceInitial(name: string): string {
  return (name?.charAt(0) ?? "?").toUpperCase();
}

type StepBase = { icon: LucideIcon; ru: string; kz: string; en: string };
type DisplayStep = StepBase & { title: string };

const ownerSteps: StepBase[] = [
  { icon: Sparkles, ru: "Создайте группу подписки", kz: "Жазылым тобын жасаңыз", en: "Create a subscription group" },
  { icon: Users, ru: "Заполните свободные места", kz: "Бос орындарды толтырыңыз", en: "Fill empty seats" },
  { icon: CheckCircle2, ru: "Выдайте доступ", kz: "Қолжетімділік беріңіз", en: "Grant access" },
  { icon: CreditCard, ru: "Получите выплату после hold", kz: "Hold кейін төлем алыңыз", en: "Get payout after hold" },
];

const memberSteps: StepBase[] = [
  { icon: Search, ru: "Выберите сервис", kz: "Сервис таңдаңыз", en: "Choose a service" },
  { icon: ShieldCheck, ru: "Оплатите с защитой", kz: "Қорғаумен төлеңіз", en: "Pay with protection" },
  { icon: Lock, ru: "Получите доступ", kz: "Қолжетімділік алыңыз", en: "Get access" },
  { icon: Sparkles, ru: "Пользуйтесь дешевле", kz: "Арзанырақ қолданыңыз", en: "Use it for less" },
];

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
    q: { ru: "Можно ли делиться подписками легально?", kz: "Жазылымдарды заңды түрде бөлісуге бола ма?", en: "Is subscription sharing legal?" },
    a: {
      ru: "EcoPay рассчитан на семейные и групповые тарифы, где провайдер разрешает совместный доступ. Владелец подтверждает условия при создании группы.",
      kz: "Ecopay провайдер ортақ пайдалануға рұқсат беретін отбасылық және топтық тарифтерге арналған. Иесі бөлме жасағанда шарттарды растайды.",
      en: "Ecopay is designed for family and group plans where the provider allows shared access. Owners confirm provider terms when creating a room.",
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
    q: { ru: "Как создать группу подписки?", kz: "Жазылым тобын қалай жасауға болады?", en: "How do I create a subscription group?" },
    a: {
      ru: "На странице «Создать группу» выберите сервис и тариф, укажите количество мест, цену участника и дату начала. Условия провайдера нужно подтвердить вручную.",
      kz: "«Топ жасау» бетінде сервис пен тарифті таңдап, орын санын, қатысушы бағасын және басталу күнін көрсетіңіз. Провайдер шарттарын қолмен растау қажет.",
      en: "On the Create Group page, pick a service and plan, set the number of seats, the per-member price, and the start date. You must confirm the provider's terms manually.",
    },
  },
  {
    q: { ru: "Как найти подходящую группу?", kz: "Сәйкес топты қалай табуға болады?", en: "How do I find a suitable group?" },
    a: {
      ru: "Откройте каталог сервисов или раздел «Открытые комнаты». Используйте поиск в шапке: можно набирать YouTube, Netflix, Canva — мы покажем подходящие сервисы.",
      kz: "Сервистер каталогын немесе «Ашық бөлмелер» бөлімін ашыңыз. Жоғарғы жақтағы іздеуді пайдаланыңыз — YouTube, Netflix, Canva жазсаңыз болғаны, сәйкес сервистер шығады.",
      en: "Open the service catalog or the Open Rooms section. Use the search in the top bar — type YouTube, Netflix, Canva and we'll surface matching services.",
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
  {
    q: { ru: "Что такое «защита по риску»?", kz: "«Тәуекелге қарай қорғау» дегеніміз не?", en: "What is risk-based protection?" },
    a: {
      ru: "EcoPay автоматически оценивает риск конкретной комнаты. Чистые комнаты проходят без вмешательства, подозрительные — попадают в очередь модерации.",
      kz: "EcoPay әр бөлменің тәуекелін автоматты бағалайды. Таза бөлмелер кедергісіз өтеді, күмәнділер модерация кезегіне түседі.",
      en: "EcoPay automatically scores each room's risk. Clean rooms go through without intervention, suspicious ones land in the moderation queue.",
    },
  },
];

const verificationModeI18nKey: Record<string, string> = {
  RISK_BASED: "verificationModeRiskBased",
  AUTO: "verificationModeAuto",
  ADMIN_REQUIRED: "verificationModeAdminRequired",
};

function localizeVerificationMode(mode: string, t: (k: string) => string): string {
  const key = verificationModeI18nKey[mode];
  return key ? t(key) : mode;
}

const CatalogServiceCard = memo(function CatalogServiceCard({
  service,
  language,
  t,
}: {
  service: ServiceDto;
  language: L;
  t: (k: string, p?: Record<string, string | number>) => string;
}) {
  const tariffs = service.tariffCount ?? 0;
  const hasPrice = service.minPricePerMember != null;
  return (
    <Link to="/browse" style={{ textDecoration: "none" }}>
      <Card className="h-full flex flex-col gap-4 hover:shadow-sm transition-shadow cursor-pointer">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[18px]"
              style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)", fontWeight: 700 }}
            >
              {serviceInitial(service.name)}
            </div>
            <div className="min-w-0">
              <div className="text-[15px] truncate" style={{ color: "var(--eco-text)" }}>{service.name}</div>
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
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
          <div className="mt-3 flex items-center justify-between text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
            <span>{tx(language, "за участника / месяц", "қатысушыға / ай", "per member / month")}</span>
            <span className="inline-flex items-center gap-1" style={{ color: "var(--eco-primary)" }}>
              {tx(language, "Смотреть", "Көру", "View")} <ArrowRight size={13} />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
});

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

function StepRail({ title, steps }: { title: string; steps: DisplayStep[] }) {
  return (
    <Card className="flex flex-col gap-4">
      <h3 className="text-[16px]" style={{ color: "var(--eco-text)" }}>{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {steps.map((step, index) => (
          <div key={step.en} className="flex items-center gap-3 rounded-lg p-3" style={{ background: "var(--eco-surface)" }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
              <step.icon size={17} style={{ color: "var(--eco-primary)" }} />
            </div>
            <div>
              <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>0{index + 1}</div>
              <div className="text-[13px]" style={{ color: "var(--eco-text)" }}>{step.title}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

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

export function HomePage() {
  const { language, t } = useI18n();
  const lang = language as L;
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number>(0);
  const [sort, setSort] = useState<CatalogSort>("name_asc");

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const localizedOwnerSteps = useMemo(
    () => ownerSteps.map((step) => ({ ...step, title: tx(lang, step.ru, step.kz, step.en) })),
    [lang],
  );
  const localizedMemberSteps = useMemo(
    () => memberSteps.map((step) => ({ ...step, title: tx(lang, step.ru, step.kz, step.en) })),
    [lang],
  );

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

  return (
    <div>
      <section className="px-4 sm:px-6 pt-10 sm:pt-12 pb-10" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] mb-5" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>
              <ShieldCheck size={14} />
              {tx(lang, "Защищённое совместное использование подписок", "Қорғалған ортақ жазылымдар", "Protected subscription sharing")}
            </div>
            <h1 className="text-[28px] sm:text-[36px] lg:text-[44px] leading-tight tracking-normal" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
              {tx(lang, "Платите меньше за семейные подписки", "Отбасылық жазылымдарға аз төлеңіз", "Pay less for family subscriptions")}
            </h1>
            <p className="text-[15px] mt-4 max-w-2xl" style={{ color: "var(--eco-text-secondary)" }}>
              {tx(
                lang,
                "EcoPay помогает находить свободные места в семейных тарифах, делить оплату между участниками и защищает деньги через 30-дневный hold.",
                "EcoPay отбасылық тарифтердегі бос орындарды табуға, төлемді қатысушылар арасында бөлуге және ақшаны 30 күндік hold арқылы қорғауға көмектеседі.",
                "EcoPay helps you find open seats in family plans, split the cost, and protect funds with a 30-day hold."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-7">
              <Link to="/rooms/create" style={{ textDecoration: "none" }}>
                <Button size="lg" className="w-full sm:w-auto">
                  <Sparkles size={17} />
                  {tx(lang, "Создать группу", "Топ жасау", "Create group")}
                </Button>
              </Link>
              <Link to="/browse" style={{ textDecoration: "none" }}>
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  <Search size={17} />
                  {tx(lang, "Найти подписку", "Жазылым табу", "Find a subscription")}
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-xl">
              {[
                ["120+", tx(lang, "групп подписок", "жазылым тобы", "subscription groups")],
                [tx(lang, "до 80%", "80% дейін", "up to 80%"), tx(lang, "экономии", "үнем", "savings")],
                ["30", tx(lang, "дней hold", "күн hold", "hold days")],
              ].map(([value, label]) => (
                <div key={value}>
                  <div className="text-[24px]" style={{ color: "var(--eco-primary)", fontWeight: 700 }}>{value}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{label}</div>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <Link
                to="/how-it-works"
                className="text-[13px] inline-flex items-center gap-1"
                style={{ color: "var(--eco-primary)", textDecoration: "none" }}
              >
                {tx(lang, "Как это работает", "Бұл қалай жұмыс істейді", "How it works")} <ArrowRight size={13} />
              </Link>
            </div>
          </div>

          <Card className="hidden lg:flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{tx(lang, "Популярная группа", "Танымал топ", "Popular group")}</div>
                <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>YouTube Premium · {tx(lang, "Открыта", "Ашық", "Open")}</div>
              </div>
              <Badge variant="info">{localizeVerificationMode("RISK_BASED", t)}</Badge>
            </div>
            <div className="rounded-xl p-4" style={{ background: "var(--eco-surface)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{tx(lang, "Места", "Орындар", "Slots")}</span>
                <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>4 / 5</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--eco-neutral-200)" }}>
                <div className="h-full rounded-full" style={{ width: "60%", background: "var(--eco-primary)" }} />
              </div>
              <div className="mt-5 flex items-end justify-between">
                <div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{tx(lang, "Цена участника", "Қатысушы бағасы", "Member price")}</div>
                  <div className="text-[28px]" style={{ color: "var(--eco-primary)", fontWeight: 700 }}>₸790</div>
                </div>
                <Link to="/browse" style={{ textDecoration: "none" }}>
                  <Button size="sm">{tx(lang, "Открыть", "Ашу", "Open")}</Button>
                </Link>
              </div>
            </div>
            <div className="flex items-start gap-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              <Lock size={14} className="mt-0.5 shrink-0" />
              {tx(lang, "После оплаты деньги не уходят владельцу сразу: EcoPay удерживает средства 30 дней.", "Төлемнен кейін ақша иесіне бірден жіберілмейді: EcoPay қаражатты 30 күн ұстайды.", "After payment, funds are not released immediately: EcoPay holds them for 30 days.")}
            </div>
          </Card>
        </div>
      </section>

      <WaveDivider flip />

      <section id="marketplace" className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div>
            <h2 className="text-[22px] sm:text-[24px]" style={{ color: "var(--eco-text)" }}>
              {tx(lang, "Маркетплейс семейных подписок", "Отбасылық жазылымдар маркетплейсі", "Family subscription marketplace")}
            </h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>
              {tx(lang, "Выбирайте свободное место, проверяйте владельца, цену и условия доступа.", "Бос орынды таңдап, иесін, бағасын және қолжетімділік шарттарын тексеріңіз.", "Choose an open seat, check the owner, price, and access terms.")}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--eco-text-tertiary)" }} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tx(lang, "Поиск: YouTube, Netflix, Canva...", "Іздеу: YouTube, Netflix, Canva...", "Search: YouTube, Netflix, Canva...")}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                aria-label={t("sortByLabel")}
                value={sort}
                onChange={(e) => setSort(e.target.value as CatalogSort)}
                options={sortOptions}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
          {[{ id: "all" as const, name: tx(lang, "Все", "Барлығы", "All"), slug: "all" }, ...categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))].map((category) => {
            const Icon = iconForCategory(category.slug);
            const active = activeCategoryId === category.id;
            return (
              <button
                key={`cat-${category.id}`}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] shrink-0 cursor-pointer"
                style={{
                  background: active ? "var(--eco-primary)" : "var(--eco-surface-raised)",
                  color: active ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
                  border: `1px solid ${active ? "var(--eco-primary)" : "var(--eco-border)"}`,
                }}
              >
                <Icon size={15} />
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

        {servicesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <MarketplaceSkeletonCard key={i} />)}
          </div>
        ) : filteredServices.length === 0 ? (
          <Card className="text-center py-10 text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
            {t("marketplaceNoServices")}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredServices.map((service) => (
              <CatalogServiceCard key={service.id} service={service} language={lang} t={t} />
            ))}
          </div>
        )}
      </section>

      {/* News — lazy chunk, fetches its own data progressively below the first fold */}
      <Suspense fallback={null}>
        <NewsSection language={lang} t={t} />
      </Suspense>

      <section style={{ background: "var(--eco-surface)" }} className="px-4 sm:px-6 py-10 sm:py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <div className="text-[12px] mb-2" style={{ color: "var(--eco-primary)" }}>
              {tx(lang, "4 простых шага", "4 қарапайым қадам", "4 simple steps")}
            </div>
            <h2 className="text-[22px] sm:text-[24px]" style={{ color: "var(--eco-text)" }}>{tx(lang, "Как это работает", "Бұл қалай жұмыс істейді", "How it works")}</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <StepRail title={tx(lang, "Если вы владелец подписки", "Егер жазылым иесі болсаңыз", "If you own a subscription")} steps={localizedOwnerSteps} />
            <StepRail title={tx(lang, "Если вы присоединяетесь", "Егер қосылсаңыз", "If you join")} steps={localizedMemberSteps} />
          </div>
        </div>
      </section>

      {/* Featured reviews — also lazy */}
      <Suspense fallback={null}>
        <FeaturedReviewsSection />
      </Suspense>

      <section className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 sm:py-12">
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
            <div className="text-[13px] mt-1" style={{ opacity: 0.8 }}>
              {tx(lang, "Создайте аккаунт и соберите первую комнату за несколько минут.", "Аккаунт жасап, алғашқы бөлмені бірнеше минутта жинаңыз.", "Create an account and set up your first room in minutes.")}
            </div>
          </div>
          <Link to="/register" className="w-full md:w-auto" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg" className="w-full md:w-auto">
              {tx(lang, "Начать", "Бастау", "Get started")} <ArrowRight size={17} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
