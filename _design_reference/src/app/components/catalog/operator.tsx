import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { Card, Pill, Select, RoomStatusBadge, EmptyState, Tabs } from "../ds-primitives";
import { ArrowLeft, Users, Filter, Calendar } from "lucide-react";
import { getRooms, getService, getTariffs, type RoomSummaryDto, type ServiceDto, type TariffPlanDto } from "../../lib/api";
import { useI18n, type Language } from "../i18n-provider";

const moneyFormatter = new Intl.NumberFormat("ru-RU");
const tx = (lang: Language, ru: string, kz: string, en: string) => ({ ru, kz, en })[lang];

const operatorColors: Record<string, string> = {
  "beeline-family": "#FFB800",
  "activ-family": "#9B59B6",
  "altel-family": "#E74C3C",
  "tele2-family": "#1A1A2E",
  "kcell-family": "#00A651",
};

function getOperatorColor(service: ServiceDto | null) {
  if (!service) {
    return "var(--eco-primary)";
  }

  return operatorColors[service.slug] ?? "var(--eco-primary)";
}

function formatMoney(value: number | null | undefined) {
  return `₸${moneyFormatter.format(Number(value ?? 0))}`;
}

function formatDate(value: string | undefined, lang: Language) {
  if (!value) {
    return tx(lang, "Позже", "Кейін", "TBD");
  }

  const locale = lang === "en" ? "en-US" : lang === "kz" ? "kk-KZ" : "ru-RU";
  return new Date(value).toLocaleDateString(locale);
}

export function OperatorPage() {
  const { language: lang } = useI18n();
  const { id } = useParams<{ id: string }>();
  const serviceId = Number(id);

  const [service, setService] = useState<ServiceDto | null>(null);
  const [plans, setPlans] = useState<TariffPlanDto[]>([]);
  const [rooms, setRooms] = useState<RoomSummaryDto[]>([]);
  const [tab, setTab] = useState("plans");
  const [priceFilter, setPriceFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function loadOperator() {
      if (!serviceId) {
        setError(tx(lang, "Оператор не найден.", "Оператор табылмады.", "Operator not found."));
        setLoading(false);
        return;
      }

      try {
        const [serviceResponse, tariffResponse, roomResponse] = await Promise.all([
          getService(serviceId),
          getTariffs(serviceId),
          getRooms({ status: "OPEN", size: 100 }),
        ]);

        if (!isCancelled) {
          setService(serviceResponse);
          setPlans(tariffResponse);
          setRooms(roomResponse.items.filter((room) => room.serviceId === serviceId));
        }
      } catch {
        if (!isCancelled) {
          setError(tx(lang, "Сейчас не удалось загрузить данные оператора.", "Қазір оператор деректерін жүктеу мүмкін болмады.", "Unable to load operator details right now."));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadOperator();

    return () => {
      isCancelled = true;
    };
  }, [serviceId, lang]);

  const filteredRooms = rooms.filter((room) => {
    const monthlyPrice = Number(room.pricePerMember ?? 0);

    if (priceFilter === "low") {
      return monthlyPrice < 3000;
    }

    if (priceFilter === "mid") {
      return monthlyPrice >= 3000 && monthlyPrice <= 5000;
    }

    if (priceFilter === "high") {
      return monthlyPrice > 5000;
    }

    return true;
  });

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Card>{tx(lang, "Загружаем данные оператора...", "Оператор деректері жүктелуде...", "Loading operator details...")}</Card>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <Link to="/" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
          <ArrowLeft size={14} /> {tx(lang, "Каталог", "Каталог", "Catalog")}
        </Link>
        <EmptyState
          title={tx(lang, "Оператор недоступен", "Оператор қолжетімсіз", "Operator unavailable")}
          description={error ?? tx(lang, "Не удалось загрузить этого оператора.", "Бұл операторды жүктеу мүмкін болмады.", "This operator could not be loaded.")}
        />
      </div>
    );
  }

  const noPlans = plans.length === 0;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      <Link to="/" className="inline-flex items-center gap-1 text-[13px] mb-6" style={{ color: "var(--eco-primary)", textDecoration: "none" }}>
        <ArrowLeft size={14} /> {tx(lang, "Каталог", "Каталог", "Catalog")}
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-[18px]"
          style={{ background: `${getOperatorColor(service)}18`, color: getOperatorColor(service) }}
        >
          {service.name.charAt(0)}
        </div>
        <div>
          <h1 className="text-[24px]" style={{ color: "var(--eco-text)" }}>{service.name}</h1>
          <p className="text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>
            {noPlans
              ? tx(lang, "Нет семейных или групповых тарифов", "Отбасылық немесе топтық тарифтер жоқ", "No family/group plans available")
              : tx(lang, `${plans.length} тарифов · ${rooms.length} открытых комнат`, `${plans.length} тариф · ${rooms.length} ашық бөлме`, `${plans.length} plans · ${rooms.length} open rooms`)}
          </p>
        </div>
      </div>

      {noPlans ? (
        <EmptyState
          title={tx(lang, "Семейные тарифы недоступны", "Отбасылық тарифтер қолжетімсіз", "No Family Plans Available")}
          description={tx(lang, `${service.name} пока не показывает тарифы для совместного использования в каталоге.`, `${service.name} әзірге каталогта бөлісуге болатын тарифтерді көрсетпейді.`, `${service.name} doesn't currently expose any shareable tariffs in the backend catalog.`)}
        />
      ) : (
        <>
          <Tabs
            tabs={[
              { id: "plans", label: tx(lang, "Тарифы", "Тарифтер", "Plans") },
              { id: "rooms", label: tx(lang, "Доступные комнаты", "Қолжетімді бөлмелер", "Available Rooms") },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === "plans" && (
            <div className="mt-6">
              <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--eco-border)" }}>
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: "1px solid var(--eco-border)" }}>
                      {[
                        tx(lang, "Тариф", "Тариф", "Plan"),
                        tx(lang, "Участники", "Қатысушылар", "Members"),
                        tx(lang, "Всего / период", "Барлығы / кезең", "Total / period"),
                        tx(lang, "За участника", "Қатысушыға", "Per member"),
                        tx(lang, "Подключение", "Қосылу", "Connection"),
                      ].map((heading) => (
                        <th key={heading} className="px-4 py-3 text-left text-[12px]" style={{ color: "var(--eco-text-tertiary)", background: "var(--eco-surface)" }}>
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {plans.map((plan) => (
                      <tr key={plan.id} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text)" }}>{plan.name}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text-secondary)" }}>{plan.maxMembers}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-text)" }}>{formatMoney(plan.basePriceTotal)}</td>
                        <td className="px-4 py-3 text-[13px]" style={{ color: "var(--eco-primary)" }}>
                          {formatMoney(Number(plan.basePriceTotal ?? 0) / Math.max(plan.maxMembers ?? 1, 1))}
                        </td>
                        <td className="px-4 py-3">
                          <Pill variant="info">{plan.connectionType}</Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === "rooms" && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-3 mb-4">
                <Filter size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                <Select
                  options={[
                    { value: "all", label: tx(lang, "Все цены", "Барлық бағалар", "All prices") },
                    { value: "low", label: tx(lang, "До ₸3 000", "₸3 000 дейін", "Under ₸3,000") },
                    { value: "mid", label: "₸3 000-₸5 000" },
                    { value: "high", label: tx(lang, "Выше ₸5 000", "₸5 000 жоғары", "Over ₸5,000") },
                  ]}
                  value={priceFilter}
                  onChange={(event) => setPriceFilter(event.target.value)}
                />
              </div>

              {filteredRooms.length === 0 ? (
                <EmptyState
                  title={tx(lang, "Комнаты не найдены", "Бөлмелер табылмады", "No matching rooms")}
                  description={tx(lang, "Попробуйте другой фильтр цены или создайте комнату позже.", "Басқа баға сүзгісін таңдаңыз немесе кейін бөлме жасаңыз.", "Try another price filter or create a new room later.")}
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredRooms.map((room) => (
                    <Link key={room.id} to={`/room/${room.id}`} style={{ textDecoration: "none" }}>
                      <Card className="flex flex-col gap-3 hover:shadow-sm transition-shadow cursor-pointer">
                        <div className="flex items-center justify-between">
                          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{room.title}</span>
                          <RoomStatusBadge status={room.status} />
                        </div>
                        <div className="flex items-center justify-between text-[13px]">
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--eco-text-secondary)" }}>
                            <Users size={13} /> {tx(lang, `До ${room.maxMembers} участников`, `${room.maxMembers} қатысушыға дейін`, `Max ${room.maxMembers} members`)}
                          </span>
                          <span style={{ color: "var(--eco-primary)" }}>{formatMoney(room.pricePerMember)}{tx(lang, "/мес", "/ай", "/mo")}</span>
                        </div>
                        <div className="flex items-center justify-between text-[12px]">
                          <span style={{ color: "var(--eco-text-tertiary)" }}>{tx(lang, "Владелец", "Иесі", "Owner")}: {room.ownerDisplayName}</span>
                          <span className="inline-flex items-center gap-1" style={{ color: "var(--eco-text-tertiary)" }}>
                            <Calendar size={12} /> {formatDate(room.startDate, lang)}
                          </span>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
