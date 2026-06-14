import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Headphones,
  Lock,
  Music,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Tv,
  Users,
  Wifi,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { Badge, Button, Card, Select, Skeleton, WaveDivider } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import {
  getServices,
  getCategories,
  getFeaturedServiceReviews,
  type CatalogSort,
  type CategoryDto,
  type PublicServiceReviewDto,
  type ServiceDto,
} from "../../lib/api";

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
  { icon: Star, ru: "Пользуйтесь дешевле", kz: "Арзанырақ қолданыңыз", en: "Use it for less" },
];


const faqs = [
  {
    q: { ru: "Сколько стоит Ecopay?", kz: "Ecopay қанша тұрады?", en: "How much does Ecopay cost?" },
    a: {
      ru: "Создать группу подписки можно бесплатно. Участник видит итоговую цену до оплаты, включая сервисный сбор и защиту платежа.",
      kz: "Бөлмені тегін жасауға болады. Қатысушы төлемге дейін сервис алымы мен төлем қорғауын қоса алғанда толық бағаны көреді.",
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
      ru: "После оплаты деньги остаются в hold 30 дней. Если доступ не выдали, он не работает или вас удалили из подписки, можно открыть спор.",
      kz: "Төлемнен кейін қолжетімділікті растау және SLA бар. Егер қолжетімділік уақытында берілмесе, өтініш немесе дау ашылып, қолдау тобы жағдайды қарайды.",
      en: "After payment, access confirmation and SLA checks apply. If access is late, a ticket or dispute is created and support reviews it.",
    },
  },
];

function CatalogServiceCard({ service, language, t }: { service: ServiceDto; language: L; t: (k: string, p?: Record<string, string | number>) => string }) {
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
}

function MarketplaceSkeletonCard() {
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
}

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

export function HomePage() {
  const { language, t } = useI18n();
  const lang = language as L;
  const [activeCategoryId, setActiveCategoryId] = useState<number | "all">("all");
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(0);
  const [sort, setSort] = useState<CatalogSort>("name_asc");

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState<string | null>(null);

  const [featuredReviews, setFeaturedReviews] = useState<PublicServiceReviewDto[]>([]);

  const localizedOwnerSteps = ownerSteps.map((step) => ({ ...step, title: tx(lang, step.ru, step.kz, step.en) }));
  const localizedMemberSteps = memberSteps.map((step) => ({ ...step, title: tx(lang, step.ru, step.kz, step.en) }));

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

  useEffect(() => {
    let cancelled = false;
    void getFeaturedServiceReviews()
      .then((data) => { if (!cancelled) setFeaturedReviews(data ?? []); })
      .catch(() => { /* silent — section hides when empty */ });
    return () => { cancelled = true; };
  }, []);

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

  return (
    <div>
      <section className="px-6 pt-12 pb-10" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[1200px] mx-auto grid lg:grid-cols-[1fr_420px] gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] mb-5" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>
              <ShieldCheck size={14} />
              {tx(lang, "Защищённое совместное использование подписок", "Қорғалған ортақ жазылымдар", "Protected subscription sharing")}
            </div>
            <h1 className="text-[34px] sm:text-[44px] leading-tight tracking-normal" style={{ color: "var(--eco-text)", fontWeight: 700 }}>
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
              <Badge variant="info">RISK_BASED</Badge>
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

      <section id="marketplace" className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div>
            <h2 className="text-[24px]" style={{ color: "var(--eco-text)" }}>
              {tx(lang, "Маркетплейс семейных подписок", "Отбасылық жазылымдар маркетплейсі", "Family subscription marketplace")}
            </h2>
            <p className="text-[13px] mt-1" style={{ color: "var(--eco-text-secondary)" }}>
              {tx(lang, "Выбирайте свободное место, проверяйте владельца, цену и условия доступа.", "Бос орынды таңдап, иесін, бағасын және қолжетімділік шарттарын тексеріңіз.", "Choose an open seat, check the owner, price, and access terms.")}
            </p>
          </div>
          <div className="flex items-center gap-2 w-full lg:w-auto">
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
            <div className="w-48">
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

      <section style={{ background: "var(--eco-surface)" }} className="px-6 py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-8">
            <div className="text-[12px] mb-2" style={{ color: "var(--eco-primary)" }}>
              {tx(lang, "4 простых шага", "4 қарапайым қадам", "4 simple steps")}
            </div>
            <h2 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{tx(lang, "Как это работает", "Бұл қалай жұмыс істейді", "How it works")}</h2>
          </div>
          <div className="grid lg:grid-cols-2 gap-4">
            <StepRail title={tx(lang, "Если вы владелец подписки", "Егер жазылым иесі болсаңыз", "If you own a subscription")} steps={localizedOwnerSteps} />
            <StepRail title={tx(lang, "Если вы присоединяетесь", "Егер қосылсаңыз", "If you join")} steps={localizedMemberSteps} />
          </div>
        </div>
      </section>

      <section className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[0.8fr_1.2fr] gap-8 items-start">
          <div>
            <h2 className="text-[24px]" style={{ color: "var(--eco-text)" }}>
              {tx(lang, "Больше безопасности, чем обычный чат", "Қарапайым чаттан қауіпсіз", "Safer than a casual chat")}
            </h2>
            <p className="text-[14px] mt-3" style={{ color: "var(--eco-text-secondary)" }}>
              {tx(lang, "После оплаты деньги не переводятся владельцу сразу. EcoPay удерживает средства 30 дней. Если доступ не работает или вас удалили из подписки, вы можете открыть спор.", "Төлемнен кейін ақша иесіне бірден аударылмайды. EcoPay қаражатты 30 күн ұстайды. Қолжетімділік жұмыс істемесе немесе сізді жазылымнан шығарса, дау аша аласыз.", "After payment, funds are not transferred to the owner immediately. EcoPay holds them for 30 days. If access fails or you are removed, you can open a dispute.")}
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              [
                ShieldCheck,
                tx(lang, "Защищённая оплата", "Қорғалған төлем", "Protected payment"),
                tx(lang, "Деньги под защитой весь 30-дневный hold", "Ақша 30 күндік hold бойы қорғалады", "Funds stay protected during the 30-day hold"),
              ],
              [
                Lock,
                tx(lang, "30-дневная гарантия доступа", "30 күндік қолжетімділік кепілдігі", "30-day access guarantee"),
                tx(lang, "Спор замораживает выплату до решения администратора", "Дау әкімші шешіміне дейін төлемді тоқтатады", "A dispute freezes payout until admin decision"),
              ],
              [
                Headphones,
                tx(lang, "Поддержка внутри продукта", "Өнім ішіндегі қолдау", "Support workflow"),
                tx(lang, "Заявки и споры встроены в основной путь", "Өтініштер мен даулар негізгі жолға енгізілген", "Tickets and disputes are first-class flows"),
              ],
              [
                Zap,
                tx(lang, "Проверка владельцев", "Иелерді тексеру", "Owner checks"),
                tx(lang, "Риск-флаги и споры уходят в модерацию", "Тәуекел белгілері мен даулар модерацияға кетеді", "Risk flags and disputes go to moderation"),
              ],
            ].map(([Icon, title, body]) => (
              <Card key={String(title)} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-brand-50)" }}>
                  <Icon size={18} style={{ color: "var(--eco-primary)" }} />
                </div>
                <div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{title}</div>
                  <div className="text-[12px] mt-1" style={{ color: "var(--eco-text-tertiary)" }}>{body}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {featuredReviews.length > 0 && (
        <section style={{ background: "var(--eco-surface)" }} className="px-6 py-12 overflow-hidden">
          <div className="max-w-[1200px] mx-auto mb-6 text-center">
            <h2 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{t("serviceReviewsTitle")}</h2>
          </div>
          <div className="ecopay-reviews-marquee" aria-label={t("serviceReviewsTitle")}>
            <div className="ecopay-reviews-track">
              {[...featuredReviews, ...featuredReviews].map((review, index) => (
                <Card key={`${review.id}-${index}`} className="ecopay-review-card flex flex-col gap-4">
                  <div className="flex gap-1" aria-label={`${review.rating}/5`}>
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        size={15}
                        fill={starIndex < review.rating ? "var(--eco-warning-500)" : "none"}
                        style={{ color: starIndex < review.rating ? "var(--eco-warning-500)" : "var(--eco-border)" }}
                      />
                    ))}
                  </div>
                  <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--eco-text-secondary)" }}>{review.text}</p>
                  <Link
                    to={`/u/${review.authorPublicId}`}
                    className="text-[13px] mt-auto"
                    style={{ color: "var(--eco-text)", textDecoration: "none" }}
                  >
                    {review.authorDisplayName}
                  </Link>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="max-w-[900px] mx-auto px-6 py-12">
        <h2 className="text-[24px] text-center mb-6" style={{ color: "var(--eco-text)" }}>{tx(lang, "Частые вопросы", "Жиі сұрақтар", "FAQ")}</h2>
        <div className="flex flex-col gap-3">
          {faqs.map((faq, index) => (
            <button
              key={faq.q.en}
              type="button"
              onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
              className="text-left rounded-xl p-4 cursor-pointer"
              style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)" }}
            >
              <span className="flex items-center justify-between gap-4">
                <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{tx(lang, faq.q.ru, faq.q.kz, faq.q.en)}</span>
                <ChevronDown size={16} style={{ color: "var(--eco-text-tertiary)", transform: openFaq === index ? "rotate(180deg)" : undefined }} />
              </span>
              {openFaq === index && (
                <span className="block text-[13px] mt-3" style={{ color: "var(--eco-text-secondary)" }}>{tx(lang, faq.a.ru, faq.a.kz, faq.a.en)}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="max-w-[1200px] mx-auto rounded-xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5" style={{ background: "var(--eco-primary)", color: "var(--eco-text-on-primary)" }}>
          <div>
            <div className="text-[24px]" style={{ fontWeight: 700 }}>
              {tx(lang, "Готовы экономить с EcoPay?", "EcoPay арқылы үнемдеуге дайынсыз ба?", "Ready to save with EcoPay?")}
            </div>
            <div className="text-[13px] mt-1" style={{ opacity: 0.8 }}>
              {tx(lang, "Создайте аккаунт и соберите первую комнату за несколько минут.", "Аккаунт жасап, алғашқы бөлмені бірнеше минутта жинаңыз.", "Create an account and set up your first room in minutes.")}
            </div>
          </div>
          <Link to="/register" style={{ textDecoration: "none" }}>
            <Button variant="secondary" size="lg">
              {tx(lang, "Начать", "Бастау", "Get started")} <ArrowRight size={17} />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
