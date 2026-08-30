import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import useEmblaCarousel from 'embla-carousel-react';
import AutoScroll from 'embla-carousel-auto-scroll';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clapperboard,
  CreditCard,
  Dumbbell,
  Gamepad2,
  GraduationCap,
  Home,
  KeyRound,
  Lock,
  Music,
  Newspaper,
  PiggyBank,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  type LucideIcon,
} from 'lucide-react';
import { Badge, Button, Card, Select, Skeleton, WaveDivider } from '../ds-primitives';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { ServiceLogo } from './service-logo';
import { formatNumber } from '../../lib/datetime';
import {
  ApiError,
  clearServicesCache,
  getServices,
  getCategories,
  getFeaturedServiceReviews,
  getPublicHomeStats,
  matchRoomForService,
  type CatalogSort,
  type CategoryDto,
  type PublicHomeStatsDto,
  type PublicServiceReviewDto,
  type ServiceAccessType,
  type ServiceDto,
} from '../../lib/api';
import { AccessTypeTag } from '../access-type';

type L = 'ru' | 'kz' | 'en';

const tx = (language: L, ru: string, kz: string, en: string) =>
  language === 'ru' ? ru : language === 'kz' ? kz : en;

function formatPrice(value: number | null | undefined, currency?: string | null): string {
  if (value == null) return '—';
  const n = Math.round(Number(value));
  if (currency === 'USD') return `$${formatNumber(n)}`;
  return `₸${formatNumber(n)}`;
}

const reviewAccentColors = ['#0FA47F', '#2B7DE9', '#FF8C42', '#7C5CFF', '#E8467C', '#E5A100'];

function positiveNumber(value: number | string | null | undefined): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

// ─── Reveal-on-scroll wrapper ───
function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`eco-reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}

// ─── Catalog card model (live API) ───
type DisplayService = {
  key: string;
  serviceId: number;
  name: string;
  categoryName: string;
  /** Kept for the presentational card; live catalog does not synthesize these values. */
  description?: string;
  price: number | null;
  currency?: string | null;
  discount?: number;
  fullPrice?: number;
  tariffs?: number;
  logoUrl?: string | null;
  accessType?: ServiceAccessType | null;
};

// Prefer the logo uploaded in the admin catalog. If an old/deleted image URL
// cannot be loaded, preserve a useful brand/monogram fallback instead of a
// blank square.
function CardLogo({ url, name, size = 52 }: { url?: string | null; name: string; size?: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  if (url && !imageFailed) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className="rounded-xl shrink-0"
        style={{
          width: size,
          height: size,
          objectFit: 'cover',
          background: 'var(--eco-surface)',
          border: '1px solid var(--eco-border)',
        }}
        onError={() => setImageFailed(true)}
      />
    );
  }
  return <ServiceLogo name={name} size={size} className="shrink-0" />;
}

function fromApi(service: ServiceDto): DisplayService {
  return {
    key: `api-${service.id}`,
    serviceId: service.id,
    logoUrl: service.logoUrl,
    name: service.name,
    categoryName: service.categoryName,
    price: service.minPricePerMember ?? null,
    currency: service.currency,
    tariffs: service.tariffCount,
    accessType: service.accessType,
  };
}

// ─── Static home content ───
const displayCategories: Array<{
  icon: LucideIcon;
  ru: string;
  kz: string;
  en: string;
  match: string[];
}> = [
  { icon: Music, ru: 'Музыка', kz: 'Музыка', en: 'Music', match: ['music', 'музык'] },
  {
    icon: Clapperboard,
    ru: 'Видео и кино',
    kz: 'Видео және кино',
    en: 'Video & Movies',
    match: ['video', 'видео', 'кино'],
  },
  { icon: Gamepad2, ru: 'Игры', kz: 'Ойындар', en: 'Games', match: ['game', 'игр', 'ойын'] },
  {
    icon: Smartphone,
    ru: 'Приложения',
    kz: 'Қосымшалар',
    en: 'Apps',
    match: ['app', 'прилож', 'serv', 'telecom'],
  },
  { icon: Newspaper, ru: 'Новости', kz: 'Жаңалықтар', en: 'News', match: ['news', 'новост'] },
  {
    icon: ShieldCheck,
    ru: 'Безопасность',
    kz: 'Қауіпсіздік',
    en: 'Security',
    match: ['secur', 'vpn', 'безопас'],
  },
  {
    icon: GraduationCap,
    ru: 'Обучение',
    kz: 'Оқыту',
    en: 'Education',
    match: ['educ', 'learn', 'обуч', 'ai'],
  },
  { icon: Home, ru: 'Дом', kz: 'Үй', en: 'Home', match: ['home', 'дом', 'cloud'] },
  {
    icon: Dumbbell,
    ru: 'Фитнес',
    kz: 'Фитнес',
    en: 'Fitness',
    match: ['fitness', 'фитнес', 'sport', 'спорт', 'health'],
  },
];

const howItWorksSteps: Array<{
  icon: LucideIcon;
  title: { ru: string; kz: string; en: string };
  body: { ru: string; kz: string; en: string };
}> = [
  {
    icon: Search,
    title: { ru: 'Я выбираю', kz: 'Мен таңдаймын', en: 'I choose' },
    body: {
      ru: 'Выберите сервис из каталога и подходящую комнату.',
      kz: 'Каталогтан сервис пен қолайлы бөлмені таңдаңыз.',
      en: 'Pick a service from the catalog and a room that fits.',
    },
  },
  {
    icon: CreditCard,
    title: { ru: 'Я плачу', kz: 'Мен төлеймін', en: 'I pay' },
    body: {
      ru: 'Внесите платёж безопасно — деньги временно удерживаются EcoPay до выплаты владельцу.',
      kz: 'Қауіпсіз төлеңіз — ақшаны EcoPay иесіне аударғанға дейін уақытша ұстайды.',
      en: 'Pay securely — EcoPay temporarily holds the money until the owner payout.',
    },
  },
  {
    icon: KeyRound,
    title: { ru: 'Я получаю доступ', kz: 'Мен қолжетімділік аламын', en: 'I get access' },
    body: {
      ru: 'Получите приватный доступ к подписке от владельца.',
      kz: 'Иесінен жазылымға жеке қолжетімділік алыңыз.',
      en: 'Get private access to the subscription from the owner.',
    },
  },
  {
    icon: PiggyBank,
    title: { ru: 'Я экономлю', kz: 'Мен үнемдеймін', en: 'I save' },
    body: {
      ru: 'Платите в 2–6 раз меньше, чем за личную подписку.',
      kz: 'Жеке жазылымнан 2–6 есе аз төлеңіз.',
      en: 'Pay 2–6× less than the solo subscription price.',
    },
  },
];

const faqs = [
  {
    q: {
      ru: 'Сколько стоит EcoPay?',
      kz: 'EcoPay қанша тұрады?',
      en: 'How much does EcoPay cost?',
    },
    a: {
      ru: 'Создать группу подписки можно бесплатно. Участник видит итоговую цену до оплаты, включая сервисный сбор и защиту платежа.',
      kz: 'Бөлмені тегін жасауға болады. Қатысушы төлемге дейін сервис алымы мен төлем қорғауын қоса алғанда толық бағаны көреді.',
      en: 'Creating a room is free. Members see the final price before payment, including service fees and payment protection.',
    },
  },
  {
    q: {
      ru: 'Можно ли делиться подписками легально?',
      kz: 'Жазылымдарды заңды түрде бөлісуге бола ма?',
      en: 'Is subscription sharing legal?',
    },
    a: {
      ru: 'EcoPay рассчитан на семейные и групповые тарифы, где провайдер разрешает совместный доступ. Владелец подтверждает условия при создании группы.',
      kz: 'EcoPay провайдер ортақ пайдалануға рұқсат беретін отбасылық және топтық тарифтерге арналған. Иесі бөлме жасағанда шарттарды растайды.',
      en: 'EcoPay is designed for family and group plans where the provider allows shared access. Owners confirm provider terms when creating a room.',
    },
  },
  {
    q: {
      ru: 'Что если доступ не выдали?',
      kz: 'Қолжетімділік берілмесе не болады?',
      en: 'What if access is not provided?',
    },
    a: {
      ru: 'После оплаты деньги временно удерживаются EcoPay до выплаты владельцу. Если доступ не выдали, он не работает или вас удалили из подписки, можно открыть спор.',
      kz: 'Төлемнен кейін EcoPay ақшаны иесіне аударғанға дейін уақытша ұстайды. Қолжетімділік берілмесе немесе жұмыс істемесе, дау аша аласыз.',
      en: 'After payment, EcoPay temporarily holds the money until the owner payout. If access is missing, broken, or revoked, you can open a dispute.',
    },
  },
];

// ─── Catalog card ───
// Clicking a service first checks the backend for an open matching room.
function CatalogServiceCard({
  service,
  language,
  index,
  onPick,
  pending,
}: {
  service: DisplayService;
  language: L;
  index: number;
  onPick: (service: DisplayService) => void;
  pending: boolean;
}) {
  const hasTariffs = (service.tariffs ?? 0) > 0 && service.price != null;

  return (
    <Reveal delay={Math.min(index, 8) * 100} className="h-full">
      <button
        type="button"
        onClick={() => onPick(service)}
        disabled={pending || !hasTariffs}
        className="block w-full h-full text-left p-0 disabled:opacity-60"
        style={{ background: 'transparent', border: 'none' }}
      >
        <Card className="eco-lift relative h-full flex flex-col gap-4 cursor-pointer overflow-hidden">
          {service.discount != null && (
            <span
              className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[12px]"
              style={{ background: 'var(--eco-primary)', color: '#fff', fontWeight: 700 }}
            >
              −{service.discount}%
            </span>
          )}
          <div className="flex items-start gap-3">
            <CardLogo url={service.logoUrl} name={service.name} size={52} />
            <div className="min-w-0">
              <div
                className="text-[16px] truncate"
                style={{ color: 'var(--eco-text)', fontWeight: 600 }}
              >
                {service.name}
              </div>
              <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {service.categoryName}
              </div>
              {service.accessType && (
                <div className="mt-1.5">
                  <AccessTypeTag accessType={service.accessType} />
                </div>
              )}
            </div>
          </div>

          {service.description && (
            <p
              className="text-[13px] leading-relaxed m-0"
              style={{ color: 'var(--eco-text-secondary)' }}
            >
              {service.description}
            </p>
          )}

          <div className="mt-auto pt-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-[24px]" style={{ color: 'var(--eco-text)', fontWeight: 700 }}>
                {formatPrice(service.price, service.currency)}
              </span>
              <span className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {tx(language, '/мес за участника', '/ай қатысушыға', '/mo per member')}
              </span>
              {service.fullPrice != null && (
                <span
                  className="text-[13px] line-through"
                  style={{ color: 'var(--eco-text-tertiary)' }}
                >
                  {formatPrice(service.fullPrice)}
                </span>
              )}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-[13px] transition-colors"
                style={{ background: 'var(--eco-primary)', color: '#fff', fontWeight: 600 }}
              >
                {!hasTariffs
                  ? tx(language, 'Нет тарифов', 'Тарифтар жоқ', 'No plans')
                  : pending
                  ? tx(language, 'Подбираем комнату…', 'Бөлме іздеудеміз…', 'Matching a room…')
                  : tx(language, 'Присоединиться', 'Қосылу', 'Join')}
                {hasTariffs && !pending && <ArrowRight size={14} />}
              </span>
              {service.tariffs != null && service.tariffs > 0 && (
                <Badge variant="info">{service.tariffs}</Badge>
              )}
            </div>
          </div>
        </Card>
      </button>
    </Reveal>
  );
}

function MarketplaceSkeletonCard() {
  return (
    <Card className="h-full flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton width={52} height={52} rounded={12} />
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={12} />
        </div>
      </div>
      <Skeleton height={30} />
      <Skeleton height={13} />
      <Skeleton height={38} rounded={8} />
    </Card>
  );
}

// ─── Categories carousel (one row under the hero search, Sharesub-style) ───
function CategoriesCarousel({
  language,
  onSelect,
}: {
  language: L;
  onSelect: (match: string[], label: string) => void;
}) {
  // Same always-on drift as the popular-services carousel, just slower so the
  // tiles stay easy to click. Pauses on hover, resumes after drag.
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start', dragFree: true }, [
    AutoScroll({
      speed: 0.6,
      startDelay: 0,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: false,
    }),
  ]);

  return (
    <div className="relative">
      <div className="overflow-hidden cursor-grab active:cursor-grabbing" ref={emblaRef}>
        {/* spacing via slide padding (not flex gap): embla's loop clones miscalculate with gap */}
        <div className="flex -ml-3 py-2">
          {displayCategories.map((category) => {
            const label = tx(language, category.ru, category.kz, category.en);
            return (
              <div
                key={category.en}
                className="shrink-0 min-w-0 pl-3 basis-1/3 sm:basis-1/4 lg:basis-[16.7%]"
              >
                <button
                  type="button"
                  onClick={() => onSelect(category.match, label)}
                  className="eco-scale-hover w-full flex flex-col items-center gap-2 rounded-xl py-4 px-2 cursor-pointer"
                  style={{
                    background: 'var(--eco-surface-raised)',
                    border: '1px solid var(--eco-border)',
                  }}
                >
                  <span
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--eco-brand-50)' }}
                  >
                    <category.icon size={19} style={{ color: 'var(--eco-primary)' }} />
                  </span>
                  <span
                    className="text-[13px] whitespace-nowrap"
                    style={{ color: 'var(--eco-text)', fontWeight: 500 }}
                  >
                    {label}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </div>
      <button
        type="button"
        aria-label={tx(language, 'Назад', 'Артқа', 'Previous')}
        onClick={() => emblaApi?.scrollPrev()}
        className="flex absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 z-10"
        style={{
          background: 'var(--eco-surface-raised)',
          border: '1px solid var(--eco-border)',
          color: 'var(--eco-text)',
        }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        type="button"
        aria-label={tx(language, 'Вперёд', 'Алға', 'Next')}
        onClick={() => emblaApi?.scrollNext()}
        className="flex absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 z-10"
        style={{
          background: 'var(--eco-surface-raised)',
          border: '1px solid var(--eco-border)',
          color: 'var(--eco-text)',
        }}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}

// ─── Popular services carousel ───
// Continuous marquee-style glide: the track always drifts, pauses on hover,
// and resumes after the user drags. Owner explicitly wants motion always on,
// so this carousel intentionally ignores prefers-reduced-motion.
function PopularCarousel({
  language,
  services,
  onPick,
}: {
  language: L;
  services: DisplayService[];
  onPick: (service: DisplayService) => void;
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' }, [
    AutoScroll({
      speed: 0.9,
      startDelay: 0,
      stopOnInteraction: false,
      stopOnMouseEnter: true,
      stopOnFocusIn: false,
    }),
  ]);

  return (
    <div className="relative">
      <div className="overflow-hidden" ref={emblaRef}>
        {/* spacing via slide padding (not flex gap): embla's loop clones miscalculate with gap */}
        <div className="flex -ml-4">
          {services.slice(0, 10).map((service) => (
            <button
              key={service.key}
              type="button"
              onClick={() => onPick(service)}
              style={{ background: 'transparent', border: 'none' }}
              className="shrink-0 min-w-0 pl-4 basis-[256px] cursor-pointer text-left p-0"
            >
              <Card className="eco-lift flex flex-col items-center text-center gap-3 py-6">
                <CardLogo url={service.logoUrl} name={service.name} size={56} />
                <div className="text-[14px]" style={{ color: 'var(--eco-text)', fontWeight: 600 }}>
                  {service.name}
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className="text-[18px]"
                    style={{ color: 'var(--eco-primary)', fontWeight: 700 }}
                  >
                    {formatPrice(service.price, service.currency)}
                  </span>
                  <span className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(language, '/мес', '/ай', '/mo')}
                  </span>
                </div>
                <span
                  className="px-2 py-0.5 rounded-full text-[11px]"
                  style={{
                    background: 'var(--eco-brand-50)',
                    color: 'var(--eco-brand-700)',
                    fontWeight: 600,
                  }}
                >
                  {service.discount == null ? tx(language, 'Тарифы', 'Тарифтар', 'Plans') : tx(
                    language,
                    `экономия ${service.discount}%`,
                    `${service.discount}% үнем`,
                    `save ${service.discount}%`,
                  )}
                </span>
              </Card>
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        aria-label={tx(language, 'Назад', 'Артқа', 'Previous')}
        onClick={() => emblaApi?.scrollPrev()}
        className="flex absolute left-1 sm:-left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 z-10"
        style={{
          background: 'var(--eco-surface-raised)',
          border: '1px solid var(--eco-border)',
          color: 'var(--eco-text)',
        }}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        type="button"
        aria-label={tx(language, 'Вперёд', 'Алға', 'Next')}
        onClick={() => emblaApi?.scrollNext()}
        className="flex absolute right-1 sm:-right-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center cursor-pointer shadow-md transition-transform hover:scale-110 z-10"
        style={{
          background: 'var(--eco-surface-raised)',
          border: '1px solid var(--eco-border)',
          color: 'var(--eco-text)',
        }}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  );
}

// ─── Stars ───
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating}/5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={15}
          fill={i < rating ? '#FFC107' : 'none'}
          style={{ color: i < rating ? '#FFC107' : 'var(--eco-border)' }}
        />
      ))}
    </div>
  );
}

export function HomePage() {
  const { language, t } = useI18n();
  const lang = language as L;
  const navigate = useNavigate();
  const { isAuthenticated, authorizedRequest } = useAuth();
  const [activeCategoryId, setActiveCategoryId] = useState<number | 'all'>('all');
  const [query, setQuery] = useState('');
  const [openFaq, setOpenFaq] = useState(0);
  const [sort, setSort] = useState<CatalogSort>('name_asc');

  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [services, setServices] = useState<ServiceDto[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [catalogLoadFailed, setCatalogLoadFailed] = useState(false);
  const [catalogRefresh, setCatalogRefresh] = useState(0);

  const [matchingKey, setMatchingKey] = useState<string | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  const [featuredReviews, setFeaturedReviews] = useState<PublicServiceReviewDto[]>([]);
  const [homeStats, setHomeStats] = useState<PublicHomeStatsDto | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getCategories()
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .catch(() => {
        /* silent — UI gracefully degrades to "all" */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const handle = window.setTimeout(() => {
      setServicesLoading(true);
      void getServices(activeCategoryId === 'all' ? undefined : activeCategoryId, sort)
        .then((data) => {
          if (!cancelled) {
            setServices(data);
            setCatalogLoadFailed(false);
          }
        })
        .catch(() => {
          // The page shows an explicit retry state instead of stale local data.
          if (!cancelled) {
            setServices([]);
            setCatalogLoadFailed(true);
          }
        })
        .finally(() => {
          if (!cancelled) setServicesLoading(false);
        });
    }, 150);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [activeCategoryId, sort, catalogRefresh]);

  useEffect(() => {
    let cancelled = false;
    void getFeaturedServiceReviews()
      .then((data) => {
        if (!cancelled) setFeaturedReviews(data ?? []);
      })
      .catch(() => {
        if (!cancelled) setFeaturedReviews([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getPublicHomeStats()
      .then((data) => {
        if (!cancelled) setHomeStats(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setHomeStats(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sortOptions = useMemo(
    () => [
      { value: 'name_asc', label: t('sortNameAsc') },
      { value: 'name_desc', label: t('sortNameDesc') },
      { value: 'price_asc', label: t('sortPriceAsc') },
      { value: 'price_desc', label: t('sortPriceDesc') },
      { value: 'newest', label: t('sortNewest') },
    ],
    [t],
  );

  // The catalog has a single source of truth: active services returned by the
  // backend. Local showcase cards and local prices are never mixed in.
  const displayServices = useMemo<DisplayService[]>(() => {
    const combined = services.map(fromApi);
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return combined;
    return combined.filter(
      (s) =>
        s.name.toLowerCase().includes(normalizedQuery) ||
        s.categoryName.toLowerCase().includes(normalizedQuery),
    );
  }, [services, query]);

  const scrollToMarketplace = () => {
    document.getElementById('marketplace')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const retryCatalog = () => {
    clearServicesCache();
    setCatalogRefresh((version) => version + 1);
  };

  const handleCategoryTile = (match: string[], label: string) => {
    const found = categories.find((c) =>
      match.some((m) => c.slug.toLowerCase().includes(m) || c.name.toLowerCase().includes(m)),
    );
    if (found) {
      setActiveCategoryId(found.id);
      setQuery('');
    } else {
      setActiveCategoryId('all');
      setQuery(label);
    }
    scrollToMarketplace();
  };

  // A selected service matches an open room first, then opens room creation
  // with the same backend service preselected when no room is available.
  const handlePickService = async (service: DisplayService) => {
    setMatchError(null);
    if (!isAuthenticated) {
      navigate(`/login?redirect=${encodeURIComponent('/')}`);
      return;
    }
    const serviceId = service.serviceId;
    setMatchingKey(service.key);
    try {
      const result = await authorizedRequest((token) => matchRoomForService(serviceId, token));
      if (result.action === 'JOIN' && result.roomId != null) {
        navigate(`/room/${result.roomId}`);
      } else {
        navigate('/rooms/create', { state: { serviceId, reason: 'no-free-rooms' } });
      }
    } catch (err) {
      // Fall back to the create flow — owners can always start a new room when
      // match cannot resolve, and we never want raw server text here.
      if (err instanceof ApiError && err.code !== 'network') {
        navigate('/rooms/create', { state: { serviceId, reason: 'no-free-rooms' } });
      } else {
        setMatchError(t('marketplaceLoadFailed'));
      }
    } finally {
      setMatchingKey(null);
    }
  };

  const homeStatItems = useMemo(() => {
    if (!homeStats) return [];

    const totalUsers = positiveNumber(homeStats.totalUsers);
    const averageRating = positiveNumber(homeStats.averageVerifiedRating);
    const reviewCount = positiveNumber(homeStats.verifiedReviewCount);
    const completedOrActiveMemberships = positiveNumber(homeStats.completedOrActiveMemberships);
    const activeRooms = positiveNumber(homeStats.activeRooms);

    const stats: Array<{ value: string; label: string }> = [];
    if (totalUsers) {
      stats.push({
        value: formatNumber(Math.round(totalUsers)),
        label: tx(lang, 'EcoPay users', 'EcoPay users', 'EcoPay users'),
      });
    }
    if (averageRating && reviewCount) {
      const formattedCount = formatNumber(Math.round(reviewCount));
      stats.push({
        value: `${averageRating.toFixed(averageRating % 1 ? 1 : 0)}/5`,
        label: tx(
          lang,
          `${formattedCount} verified reviews`,
          `${formattedCount} verified reviews`,
          `${formattedCount} verified reviews`,
        ),
      });
    }
    if (completedOrActiveMemberships) {
      stats.push({
        value: formatNumber(Math.round(completedOrActiveMemberships)),
        label: tx(lang, 'memberships', 'memberships', 'memberships'),
      });
    }
    if (activeRooms) {
      stats.push({
        value: formatNumber(Math.round(activeRooms)),
        label: tx(lang, 'active rooms', 'active rooms', 'active rooms'),
      });
    }

    return stats;
  }, [homeStats, lang]);

  const gridReviews = useMemo(
    () =>
      featuredReviews.slice(0, 6).map((review, i) => ({
        id: review.id,
        name: review.authorDisplayName,
        rating: Math.min(5, Math.max(1, review.rating)),
        text: review.text,
        color: reviewAccentColors[i % reviewAccentColors.length],
        link: `/u/${review.authorPublicId}`,
        verifiedExperience: review.verifiedExperience === true,
      })),
    [featuredReviews],
  );

  return (
    <div>
      {/* ─── Hero ─── */}
      <section
        className="relative overflow-hidden px-4 sm:px-6 pt-14 sm:pt-20 pb-12 sm:pb-16"
        style={{
          background: 'linear-gradient(180deg, var(--eco-brand-50) 0%, var(--eco-bg) 100%)',
        }}
      >
        <div className="eco-hero-blobs" aria-hidden="true">
          <span className="eco-blob eco-blob-1" />
          <span className="eco-blob eco-blob-2" />
          <span className="eco-blob eco-blob-3" />
        </div>
        <div className="relative max-w-[860px] mx-auto text-center">

          <h1
            className="animate-eco-fade-in text-[32px] sm:text-[44px] lg:text-[56px] leading-[1.1] tracking-tight m-0"
            style={{ color: 'var(--eco-text)', fontWeight: 700, animationDelay: '80ms' }}
          >
            {tx(lang, 'Платите меньше за', 'Отбасылық жазылымдарға', 'Pay less for')}{' '}
            <span style={{ color: 'var(--eco-primary)' }}>
              {tx(lang, 'семейные подписки', 'аз төлеңіз', 'family subscriptions')}
            </span>
          </h1>

          <p
            className="animate-eco-fade-in text-[16px] sm:text-[18px] mt-5 mx-auto max-w-[560px]"
            style={{ color: 'var(--eco-text-secondary)', animationDelay: '160ms' }}
          >
            {tx(
              lang,
              'Выберите сервис - мы подберём комнату или предложим создать свою.',
              'Сервисті таңдаңыз - біз бөлме табамыз немесе өзіңіздікін жасауды ұсынамыз.',
              "Pick a service - we'll find you a room or help you create your own.",
            )}
          </p>

          <div
            className="animate-eco-fade-in mt-8 max-w-[560px] mx-auto"
            style={{ animationDelay: '240ms' }}
          >
            <div
              className="flex items-center gap-2 pl-5 pr-2 py-2 rounded-full shadow-lg transition-shadow focus-within:shadow-xl"
              style={{
                background: 'var(--eco-surface-raised)',
                border: '1px solid var(--eco-border)',
              }}
            >
              <Search
                size={19}
                className="shrink-0"
                style={{ color: 'var(--eco-text-tertiary)' }}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') scrollToMarketplace();
                }}
                placeholder={tx(
                  lang,
                  'Найдите сервис...',
                  'Сервис іздеңіз...',
                  'Find a service...',
                )}
                className="flex-1 min-w-0 py-1.5 text-[15px] outline-none bg-transparent"
                style={{ color: 'var(--eco-text)' }}
              />
              <button
                type="button"
                onClick={scrollToMarketplace}
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
                style={{ background: 'var(--eco-primary)', color: '#fff', border: 'none' }}
                aria-label={tx(lang, 'Искать', 'Іздеу', 'Search')}
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </div>

          <div
            className="animate-eco-fade-in mt-7 max-w-[760px] mx-auto"
            style={{ animationDelay: '300ms' }}
          >
            <CategoriesCarousel language={lang} onSelect={handleCategoryTile} />
          </div>

          {homeStatItems.length > 0 && (
            <div
              className="animate-eco-fade-in flex flex-wrap items-center justify-center gap-x-10 gap-y-4 mt-8"
              style={{ animationDelay: '380ms' }}
            >
              {homeStatItems.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div
                    className="text-[26px]"
                    style={{ color: 'var(--eco-primary)', fontWeight: 700 }}
                  >
                    {stat.value}
                  </div>
                  <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── Catalog ─── */}
      <section
        id="marketplace"
        className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16 scroll-mt-20"
      >
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 mb-6">
          <div>
            <h2
              className="text-[24px] sm:text-[32px] m-0"
              style={{ color: 'var(--eco-text)', fontWeight: 700 }}
            >
              {tx(lang, 'Каталог подписок', 'Жазылымдар каталогы', 'Subscription catalog')}
            </h2>
            <p className="text-[14px] mt-2 m-0" style={{ color: 'var(--eco-text-secondary)' }}>
              {tx(
                lang,
                'Выбирайте свободное место, проверяйте владельца, цену и условия доступа.',
                'Бос орынды таңдап, иесін, бағасын және қолжетімділік шарттарын тексеріңіз.',
                'Choose an open seat, check the owner, price, and access terms.',
              )}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
            <div className="relative flex-1 lg:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--eco-text-tertiary)' }}
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={tx(
                  lang,
                  'Поиск: YouTube, Netflix, Canva...',
                  'Іздеу: YouTube, Netflix, Canva...',
                  'Search: YouTube, Netflix, Canva...',
                )}
                className="w-full pl-9 pr-3 py-2 rounded-lg text-[13px] outline-none"
                style={{
                  background: 'var(--eco-surface)',
                  border: '1px solid var(--eco-border)',
                  color: 'var(--eco-text)',
                }}
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                aria-label={t('sortByLabel')}
                value={sort}
                onChange={(e) => setSort(e.target.value as CatalogSort)}
                options={sortOptions}
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3 mb-5">
          {[
            { id: 'all' as const, name: tx(lang, 'Все', 'Барлығы', 'All') },
            ...categories.map((c) => ({ id: c.id, name: c.name })),
          ].map((category) => {
            const active = activeCategoryId === category.id;
            return (
              <button
                key={`cat-${category.id}`}
                type="button"
                onClick={() => setActiveCategoryId(category.id)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] shrink-0 cursor-pointer transition-colors"
                style={{
                  background: active ? 'var(--eco-primary)' : 'var(--eco-surface-raised)',
                  color: active ? '#fff' : 'var(--eco-text-secondary)',
                  border: `1px solid ${active ? 'var(--eco-primary)' : 'var(--eco-border)'}`,
                  fontWeight: active ? 600 : 400,
                }}
              >
                {category.name}
              </button>
            );
          })}
        </div>

        {matchError && (
          <Card className="mb-4">
            <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
              {matchError}
            </span>
          </Card>
        )}

        {servicesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <MarketplaceSkeletonCard key={i} />
            ))}
          </div>
        ) : catalogLoadFailed ? (
          <Card className="py-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <span className="text-[13px]" style={{ color: 'var(--eco-negative)' }}>
                {t('marketplaceLoadFailed')}
              </span>
              <Button variant="secondary" size="sm" onClick={retryCatalog}>
                {t('retry')}
              </Button>
            </div>
          </Card>
        ) : displayServices.length === 0 ? (
          <Card
            className="text-center py-10 text-[13px]"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            {t('marketplaceNoServices')}
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayServices.map((service, index) => (
              <CatalogServiceCard
                key={service.key}
                service={service}
                language={lang}
                index={index}
                onPick={handlePickService}
                pending={matchingKey === service.key}
              />
            ))}
          </div>
        )}
      </section>

      {/* ─── Popular services carousel (full width, autoplay) ─── */}
      {displayServices.length > 0 && (
      <section
        style={{ background: 'var(--eco-surface)' }}
        className="py-12 sm:py-16 overflow-hidden"
      >
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
          <Reveal>
            <div className="flex items-end justify-between gap-4 mb-8">
              <h2
                className="text-[24px] sm:text-[32px] m-0"
                style={{ color: 'var(--eco-text)', fontWeight: 700 }}
              >
                {tx(lang, 'Популярные сервисы', 'Танымал сервистер', 'Popular services')}
              </h2>
              <button
                type="button"
                onClick={scrollToMarketplace}
                className="text-[14px] inline-flex items-center gap-1 shrink-0 cursor-pointer"
                style={{
                  color: 'var(--eco-primary)',
                  background: 'transparent',
                  border: 'none',
                  fontWeight: 500,
                }}
              >
                {tx(lang, 'Весь каталог', 'Толық каталог', 'Full catalog')} <ArrowRight size={14} />
              </button>
            </div>
          </Reveal>
        </div>
        <Reveal delay={100}>
          <div className="px-4 sm:px-10">
            <PopularCarousel language={lang} services={displayServices} onPick={handlePickService} />
          </div>
        </Reveal>
      </section>
      )}

      {/* ─── How it works ─── */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <Reveal>
          <div className="text-center mb-10">
            <div
              className="text-[13px] mb-2"
              style={{ color: 'var(--eco-primary)', fontWeight: 600 }}
            >
              {tx(lang, '4 простых шага', '4 қарапайым қадам', '4 simple steps')}
            </div>
            <h2
              className="text-[24px] sm:text-[32px] m-0"
              style={{ color: 'var(--eco-text)', fontWeight: 700 }}
            >
              {tx(lang, 'Как это работает', 'Бұл қалай жұмыс істейді', 'How it works')}
            </h2>
          </div>
        </Reveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {howItWorksSteps.map((step, index) => (
            <Reveal key={step.title.en} delay={index * 90} className="relative">
              <Card className="eco-lift h-full flex flex-col items-center text-center gap-4 py-8">
                <div className="relative">
                  <span
                    className="w-14 h-14 rounded-2xl flex items-center justify-center"
                    style={{ background: 'var(--eco-brand-50)', display: 'flex' }}
                  >
                    <step.icon size={24} style={{ color: 'var(--eco-primary)' }} />
                  </span>
                  <span
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-[12px]"
                    style={{ background: 'var(--eco-primary)', color: '#fff', fontWeight: 700 }}
                  >
                    {index + 1}
                  </span>
                </div>
                <div className="text-[16px]" style={{ color: 'var(--eco-text)', fontWeight: 600 }}>
                  {tx(lang, step.title.ru, step.title.kz, step.title.en)}
                </div>
                <p className="text-[13px] m-0" style={{ color: 'var(--eco-text-secondary)' }}>
                  {tx(lang, step.body.ru, step.body.kz, step.body.en)}
                </p>
              </Card>
              {index < howItWorksSteps.length - 1 && (
                <span
                  className="hidden lg:flex absolute top-1/2 -right-6 -translate-y-1/2 z-10 w-8 h-8 rounded-full items-center justify-center"
                  style={{ background: 'var(--eco-brand-50)', color: 'var(--eco-primary)' }}
                >
                  <ArrowRight size={15} />
                </span>
              )}
            </Reveal>
          ))}
        </div>
        <Reveal delay={200}>
          <div className="text-center mt-8">
            <Link
              to="/how-it-works"
              className="text-[14px] inline-flex items-center gap-1"
              style={{ color: 'var(--eco-primary)', textDecoration: 'none', fontWeight: 500 }}
            >
              {tx(
                lang,
                'Подробнее о процессе',
                'Процесс туралы толығырақ',
                'Learn more about the process',
              )}{' '}
              <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ─── Security ─── */}
      <section style={{ background: 'var(--eco-surface)' }} className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-[1200px] mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <h2
                className="text-[24px] sm:text-[32px] m-0"
                style={{ color: 'var(--eco-text)', fontWeight: 700 }}
              >
                {tx(
                  lang,
                  'Ваши данные и деньги под защитой',
                  'Деректеріңіз бен ақшаңыз қорғауда',
                  'Your data and money are protected',
                )}
              </h2>
              <p
                className="text-[14px] mt-3 m-0 mx-auto max-w-[520px]"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  lang,
                  'Деньги не переводятся владельцу сразу — EcoPay временно удерживает их до выплаты, а споры замораживают выплату.',
                  'Ақша иесіне бірден аударылмайды — EcoPay оны аударымға дейін уақытша ұстайды, даулар төлемді тоқтатады.',
                  'Funds are not released immediately — EcoPay temporarily holds them until owner payout, and disputes freeze payouts.',
                )}
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                icon: ShieldCheck,
                title: tx(lang, 'Данные защищены', 'Деректер қорғалған', 'Data protected'),
                points: [
                  tx(lang, 'Шифрование AES-256', 'AES-256 шифрлауы', 'AES-256 encryption'),
                  tx(lang, 'SSL-сертификат', 'SSL сертификаты', 'SSL certificate'),
                  tx(lang, 'Соответствие DSP2', 'DSP2 сәйкестігі', 'DSP2 compliant'),
                ],
              },
              {
                icon: Lock,
                title: tx(lang, 'Платежи безопасны', 'Төлемдер қауіпсіз', 'Payments secure'),
                points: [
                  tx(lang, 'PCI DSS compliance', 'PCI DSS сәйкестігі', 'PCI DSS compliance'),
                  tx(
                    lang,
                    'Проверенные платёжные системы',
                    'Тексерілген төлем жүйелері',
                    'Trusted payment providers',
                  ),
                  tx(lang, 'Защита 3D Secure', '3D Secure қорғауы', '3D Secure protection'),
                ],
              },
              {
                icon: BadgeCheck,
                title: tx(
                  lang,
                  'Защита покупателей',
                  'Сатып алушыларды қорғау',
                  'Buyer protection',
                ),
                points: [
                  tx(lang, 'Гарантия возврата', 'Қайтару кепілдігі', 'Money-back guarantee'),
                  tx(lang, 'Поддержка 24/7', '24/7 қолдау', '24/7 support'),
                  tx(
                    lang,
                    'Ваши права защищены',
                    'Құқықтарыңыз қорғалған',
                    'Your rights protected',
                  ),
                ],
              },
            ].map((block, index) => (
              <Reveal key={block.title} delay={index * 90}>
                <Card className="eco-lift h-full flex flex-col gap-4 py-6">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--eco-brand-50)' }}
                  >
                    <block.icon size={20} style={{ color: 'var(--eco-primary)' }} />
                  </span>
                  <div
                    className="text-[16px]"
                    style={{ color: 'var(--eco-text)', fontWeight: 600 }}
                  >
                    {block.title}
                  </div>
                  <ul className="m-0 p-0 flex flex-col gap-2" style={{ listStyle: 'none' }}>
                    {block.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-center gap-2 text-[13px]"
                        style={{ color: 'var(--eco-text-secondary)' }}
                      >
                        <BadgeCheck
                          size={15}
                          className="shrink-0"
                          style={{ color: 'var(--eco-positive)' }}
                        />
                        {point}
                      </li>
                    ))}
                  </ul>
                </Card>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="text-center mt-8">
              <Link
                to="/security"
                className="text-[14px] inline-flex items-center gap-1"
                style={{ color: 'var(--eco-primary)', textDecoration: 'none', fontWeight: 500 }}
              >
                {tx(
                  lang,
                  'Подробнее о безопасности',
                  'Қауіпсіздік туралы толығырақ',
                  'More about security',
                )}{' '}
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Reviews */}
      {gridReviews.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <Reveal>
            <div className="text-center mb-10">
              <h2
                className="text-[24px] sm:text-[32px] m-0"
                style={{ color: 'var(--eco-text)', fontWeight: 700 }}
              >
                {tx(lang, 'Verified EcoPay reviews', 'Verified EcoPay reviews', 'Verified EcoPay reviews')}
              </h2>
              <p
                className="text-[14px] mt-3 m-0 mx-auto max-w-[560px]"
                style={{ color: 'var(--eco-text-secondary)' }}
              >
                {tx(
                  lang,
                  'Selected by EcoPay moderators from real member reviews.',
                  'Selected by EcoPay moderators from real member reviews.',
                  'Selected by EcoPay moderators from real member reviews.',
                )}
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridReviews.map((review, index) => (
              <Reveal key={review.id} delay={(index % 3) * 90}>
                <Card className="eco-lift h-full flex flex-col gap-3">
                  <div className="flex items-center gap-3">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-[14px] shrink-0"
                      style={{
                        background: `${review.color}22`,
                        color: review.color,
                        fontWeight: 700,
                      }}
                    >
                      {review.name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Link
                          to={review.link}
                          className="text-[14px] block truncate"
                          style={{
                            color: 'var(--eco-text)',
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          {review.name}
                        </Link>
                        {review.verifiedExperience && (
                          <Badge variant="success">
                            <BadgeCheck size={12} /> Verified
                          </Badge>
                        )}
                      </div>
                      <Stars rating={review.rating} />
                    </div>
                  </div>
                  <p
                    className="text-[13px] leading-relaxed m-0 flex-1"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    {review.text}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <WaveDivider flip />

      {/* ─── FAQ ─── */}
      <section style={{ background: 'var(--eco-surface)' }} className="px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-[900px] mx-auto">
          <Reveal>
            <h2
              className="text-[24px] sm:text-[32px] text-center mb-8 m-0"
              style={{ color: 'var(--eco-text)', fontWeight: 700 }}
            >
              {tx(lang, 'Частые вопросы', 'Жиі сұрақтар', 'FAQ')}
            </h2>
          </Reveal>
          <div className="flex flex-col gap-3">
            {faqs.map((faq, index) => (
              <Reveal key={faq.q.en} delay={index * 70}>
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                  className="w-full text-left rounded-xl p-4 cursor-pointer transition-shadow hover:shadow-sm"
                  style={{
                    background: 'var(--eco-surface-raised)',
                    border: '1px solid var(--eco-border)',
                  }}
                >
                  <span className="flex items-center justify-between gap-4">
                    <span
                      className="text-[15px]"
                      style={{ color: 'var(--eco-text)', fontWeight: 500 }}
                    >
                      {tx(lang, faq.q.ru, faq.q.kz, faq.q.en)}
                    </span>
                    <ChevronDown
                      size={16}
                      className="shrink-0 transition-transform duration-300"
                      style={{
                        color: 'var(--eco-text-tertiary)',
                        transform: openFaq === index ? 'rotate(180deg)' : undefined,
                      }}
                    />
                  </span>
                  {openFaq === index && (
                    <span
                      className="block text-[13px] mt-3 animate-eco-fade-in"
                      style={{ color: 'var(--eco-text-secondary)' }}
                    >
                      {tx(lang, faq.a.ru, faq.a.kz, faq.a.en)}
                    </span>
                  )}
                </button>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="px-4 sm:px-6 py-14" style={{ background: 'var(--eco-surface)' }}>
        <Reveal>
          <div
            className="max-w-[1200px] mx-auto rounded-2xl p-6 sm:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5"
            style={{
              background: 'linear-gradient(120deg, var(--eco-primary), var(--eco-brand-600))',
              color: '#fff',
            }}
          >
            <div>
              <div
                className="text-[22px] sm:text-[28px]"
                style={{ fontWeight: 700, fontFamily: 'var(--font-display)' }}
              >
                {tx(
                  lang,
                  'Готовы экономить с EcoPay?',
                  'EcoPay арқылы үнемдеуге дайынсыз ба?',
                  'Ready to save with EcoPay?',
                )}
              </div>
              <div className="text-[14px] mt-2" style={{ opacity: 0.85 }}>
                {tx(
                  lang,
                  'Создайте аккаунт и соберите первую комнату за несколько минут.',
                  'Аккаунт жасап, алғашқы бөлмені бірнеше минутта жинаңыз.',
                  'Create an account and set up your first room in minutes.',
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link to="/register" className="w-full sm:w-auto" style={{ textDecoration: 'none' }}>
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[15px] cursor-pointer transition-transform hover:scale-[1.03]"
                  style={{
                    background: '#fff',
                    color: 'var(--eco-brand-700)',
                    fontWeight: 600,
                    border: 'none',
                  }}
                >
                  {tx(lang, 'Начать', 'Бастау', 'Get started')} <ArrowRight size={16} />
                </button>
              </Link>
              <Link
                to="/rooms/create"
                className="w-full sm:w-auto"
                style={{ textDecoration: 'none' }}
              >
                <button
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-[15px] cursor-pointer transition-colors"
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    fontWeight: 600,
                    border: '1px solid rgba(255,255,255,0.5)',
                  }}
                >
                  <Sparkles size={16} />{' '}
                  {tx(lang, 'Создать комнату', 'Бөлме жасау', 'Create a room')}
                </button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
