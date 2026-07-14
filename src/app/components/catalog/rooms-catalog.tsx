import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Card, Select, RoomStatusBadge, Pill, EmptyState, Button } from '../ds-primitives';
import { Users, Filter, Search, LayoutGrid } from 'lucide-react';
import { useI18n, type Language } from '../i18n-provider';
import { getRooms, type RoomSummaryDto } from '../../lib/api';

const moneyFormatter = new Intl.NumberFormat('ru-RU');
const formatMoney = (v: number | null | undefined) => `₸${moneyFormatter.format(Number(v ?? 0))}`;

const tx = (l: Language, ru: string, kz: string, en: string) =>
  l === 'ru' ? ru : l === 'kz' ? kz : en;

const serviceInitial = (name: string) => (name?.trim()?.[0] ?? '?').toUpperCase();

// Service logo (S3-backed) with a letter fallback when none uploaded.
function ServiceLogo({ url, name }: { url?: string | null; name: string }) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={36}
        height={36}
        loading="lazy"
        decoding="async"
        className="w-9 h-9 rounded-lg shrink-0"
        style={{
          objectFit: 'cover',
          background: 'var(--eco-surface)',
          border: '1px solid var(--eco-border)',
        }}
      />
    );
  }
  return (
    <div
      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-[14px]"
      style={{
        background: 'var(--eco-surface)',
        color: 'var(--eco-text-secondary)',
        fontWeight: 700,
        border: '1px solid var(--eco-border)',
      }}
    >
      {serviceInitial(name)}
    </div>
  );
}

export function RoomsCatalogPage() {
  const { language } = useI18n();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomSummaryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [operatorFilter, setOperatorFilter] = useState('ALL');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  const TYPE_OPTIONS = [
    { value: 'ALL', label: tx(language, 'Все типы', 'Барлық түрлері', 'All types') },
    { value: 'TELECOM', label: tx(language, 'Связь', 'Телеком', 'Telecom') },
    { value: 'DIGITAL', label: tx(language, 'Цифровые', 'Цифрлық', 'Digital') },
  ];

  const PRICE_OPTIONS = [
    { value: 'all', label: tx(language, 'Любая цена', 'Кез келген баға', 'All prices') },
    { value: 'low', label: tx(language, 'До ₸3,000', '₸3,000-ға дейін', 'Under ₸3,000') },
    { value: 'mid', label: '₸3,000 – ₸5,000' },
    { value: 'high', label: tx(language, 'Свыше ₸5,000', '₸5,000-нан жоғары', 'Over ₸5,000') },
  ];

  const SORT_OPTIONS = [
    { value: 'newest', label: tx(language, 'Сначала новые', 'Алдымен жаңалары', 'Newest first') },
    {
      value: 'price_asc',
      label: tx(language, 'Цена: по возрастанию', 'Бағасы: өсу бойынша', 'Price: low to high'),
    },
    {
      value: 'price_desc',
      label: tx(language, 'Цена: по убыванию', 'Бағасы: кему бойынша', 'Price: high to low'),
    },
    {
      value: 'start',
      label: tx(language, 'Скоро стартует', 'Жақын арада басталады', 'Starting soonest'),
    },
  ];

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    getRooms({ status: 'OPEN', size: 100 })
      .then((response) => {
        if (!cancelled) setRooms(response.items);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            tx(
              language,
              'Не удалось загрузить открытые комнаты.',
              'Ашық бөлмелерді жүктеу мүмкін болмады.',
              'Unable to load open rooms right now.',
            ),
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [language]);

  const operatorOptions = useMemo(() => {
    const names = new Set<string>();
    rooms.forEach((r) => r.serviceName && names.add(r.serviceName));
    return [
      { value: 'ALL', label: tx(language, 'Все операторы', 'Барлық операторлар', 'All operators') },
      ...[...names].sort().map((n) => ({ value: n, label: n })),
    ];
  }, [rooms, language]);

  const visibleRooms = useMemo(() => {
    const q = query.trim().toLowerCase();

    const filtered = rooms.filter((room) => {
      if (typeFilter !== 'ALL' && room.roomType !== typeFilter) return false;
      if (operatorFilter !== 'ALL' && room.serviceName !== operatorFilter) return false;

      const price = Number(room.pricePerMember ?? 0);
      if (priceFilter === 'low' && !(price < 3000)) return false;
      if (priceFilter === 'mid' && !(price >= 3000 && price <= 5000)) return false;
      if (priceFilter === 'high' && !(price > 5000)) return false;

      if (q) {
        const haystack = `${room.title} ${room.serviceName} ${room.ownerDisplayName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const sorted = [...filtered];
    switch (sort) {
      case 'price_asc':
        sorted.sort((a, b) => Number(a.pricePerMember ?? 0) - Number(b.pricePerMember ?? 0));
        break;
      case 'price_desc':
        sorted.sort((a, b) => Number(b.pricePerMember ?? 0) - Number(a.pricePerMember ?? 0));
        break;
      case 'start':
        sorted.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
        break;
      default:
        // Newest first. Ids are 64-bit numeric strings (roughly time-ordered), so
        // compare them numerically-as-strings — b.id - a.id would corrupt them.
        sorted.sort((a, b) =>
          String(b.id).localeCompare(String(a.id), undefined, { numeric: true }),
        );
    }
    return sorted;
  }, [rooms, query, typeFilter, operatorFilter, priceFilter, sort]);

  const clearFilters = () => {
    setQuery('');
    setTypeFilter('ALL');
    setOperatorFilter('ALL');
    setPriceFilter('all');
    setSort('newest');
  };

  const subtitleStats = loading
    ? ''
    : tx(
        language,
        `Показано ${visibleRooms.length} из ${rooms.length}.`,
        `${rooms.length} ішінен ${visibleRooms.length} көрсетілді.`,
        `${visibleRooms.length} of ${rooms.length} shown.`,
      );

  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <LayoutGrid size={20} style={{ color: 'var(--eco-primary)' }} />
            <h1 className="text-[22px] sm:text-[26px]" style={{ color: 'var(--eco-text)' }}>
              {tx(language, 'Открытые комнаты', 'Ашық бөлмелер', 'Open Rooms')}
            </h1>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--eco-text-secondary)' }}>
            {tx(
              language,
              'Комнаты, которые сейчас принимают участников.',
              'Қазір қатысушыларды қабылдап жатқан бөлмелер.',
              'Browse rooms currently accepting members.',
            )}{' '}
            {subtitleStats}
          </p>
        </div>
        <Link to="/rooms/create" className="w-full sm:w-auto" style={{ textDecoration: 'none' }}>
          <Button variant="primary" size="sm" className="w-full sm:w-auto">
            {tx(language, 'Создать комнату', 'Бөлме жасау', 'Create Room')}
          </Button>
        </Link>
      </div>

      <Card className="mb-6 flex flex-col gap-4">
        <div className="relative">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--eco-text-tertiary)' }}
          />
          <input
            placeholder={tx(
              language,
              'Поиск по комнате, оператору или владельцу',
              'Бөлме, оператор немесе ие бойынша іздеу',
              'Search by room, operator or owner',
            )}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg outline-none text-[14px]"
            style={{
              background: 'var(--eco-surface)',
              border: '1px solid var(--eco-border)',
              color: 'var(--eco-text)',
            }}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Select
            label={tx(language, 'Тип', 'Түрі', 'Type')}
            options={TYPE_OPTIONS}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Select
            label={tx(language, 'Оператор', 'Оператор', 'Operator')}
            options={operatorOptions}
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
          />
          <Select
            label={tx(language, 'Цена / участник', 'Бағасы / қатысушы', 'Price / member')}
            options={PRICE_OPTIONS}
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
          />
          <Select
            label={tx(language, 'Сортировка', 'Сұрыптау', 'Sort by')}
            options={SORT_OPTIONS}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            className="inline-flex items-center gap-1.5 text-[12px]"
            style={{ color: 'var(--eco-text-tertiary)' }}
          >
            <Filter size={13} />{' '}
            {tx(
              language,
              'Фильтры применяются сразу',
              'Сүзгілер бірден қолданылады',
              'Filters apply instantly',
            )}
          </span>
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            {tx(language, 'Сбросить фильтры', 'Сүзгілерді тазалау', 'Clear filters')}
          </Button>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-3">
              <div
                className="h-4 rounded animate-pulse"
                style={{ background: 'var(--eco-surface)' }}
              />
              <div
                className="h-3 rounded w-2/3 animate-pulse"
                style={{ background: 'var(--eco-surface)' }}
              />
              <div
                className="h-3 rounded w-1/2 animate-pulse"
                style={{ background: 'var(--eco-surface)' }}
              />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <span style={{ color: 'var(--eco-negative)' }}>{error}</span>
        </Card>
      ) : visibleRooms.length === 0 ? (
        <EmptyState
          title={
            rooms.length === 0
              ? tx(
                  language,
                  'Открытых комнат пока нет',
                  'Әзірге ашық бөлмелер жоқ',
                  'No open rooms yet',
                )
              : tx(
                  language,
                  'Под фильтры ничего не подходит',
                  'Сүзгілерге сәйкес нәтиже жоқ',
                  'No rooms match your filters',
                )
          }
          description={
            rooms.length === 0
              ? tx(
                  language,
                  'Откройте первую комнату и начните делиться тарифом.',
                  'Алғашқы бөлмені ашып, тарифпен бөлісіңіз.',
                  'Be the first to open a room and start sharing a plan.',
                )
              : tx(
                  language,
                  'Измените фильтры или сбросьте их, чтобы увидеть все открытые комнаты.',
                  'Сүзгілерді өзгертіңіз немесе тазалаңыз, сонда барлық ашық бөлмелерді көресіз.',
                  'Try adjusting the filters or clearing them to see all open rooms.',
                )
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {visibleRooms.map((room) => (
            <Link key={room.id} to={`/room/${room.id}`} style={{ textDecoration: 'none' }}>
              <Card className="flex flex-col gap-3 h-full hover:shadow-sm transition-shadow cursor-pointer">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <ServiceLogo url={room.serviceLogoUrl} name={room.serviceName} />
                    <div className="min-w-0">
                      <div className="text-[15px] truncate" style={{ color: 'var(--eco-text)' }}>
                        {room.title}
                      </div>
                      <div className="text-[12px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                        {room.serviceName}
                      </div>
                    </div>
                  </div>
                  <RoomStatusBadge status={room.status} />
                </div>

                <div className="flex items-center gap-2">
                  <Pill variant="info">{room.roomType}</Pill>
                </div>

                <div className="flex items-center justify-between text-[13px] mt-auto">
                  <span
                    className="inline-flex items-center gap-1.5"
                    style={{ color: 'var(--eco-text-secondary)' }}
                  >
                    <Users size={13} /> {tx(language, 'Макс.', 'Макс.', 'Max')} {room.maxMembers}
                  </span>
                  <span style={{ color: 'var(--eco-primary)' }}>
                    {formatMoney(room.pricePerMember)}
                    {tx(language, '/период', '/кезең', '/period')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[12px]">
                  <span style={{ color: 'var(--eco-text-tertiary)' }}>
                    {tx(language, 'Владелец', 'Иесі', 'Owner')}:{' '}
                    {room.ownerSlug || room.ownerPublicId ? (
                      <span
                        role="link"
                        tabIndex={0}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(`/u/${room.ownerSlug ?? room.ownerPublicId}`);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            navigate(`/u/${room.ownerSlug ?? room.ownerPublicId}`);
                          }
                        }}
                        className="cursor-pointer hover:underline"
                        style={{ color: 'var(--eco-primary)' }}
                      >
                        {room.ownerDisplayName}
                      </span>
                    ) : (
                      room.ownerDisplayName
                    )}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
