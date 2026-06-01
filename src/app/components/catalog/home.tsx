import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Card, Badge, WaveDivider } from "../ds-primitives";
import { Smartphone, Wifi, Tv, Music, Sparkles, Bot, Lock } from "lucide-react";
import { DigitalSubscriptionsAvailable } from "./digital-subscriptions";
import { useI18n } from "../i18n-provider";
import { getRooms, getServices, getTariffs, type ServiceDto } from "../../lib/api";

interface OperatorCard {
  id: number;
  name: string;
  plans: number;
  rooms: number;
  color: string;
}

const operatorColors: Record<string, string> = {
  "beeline-family": "#FFB800",
  "activ-family": "#9B59B6",
  "altel-family": "#E74C3C",
  "tele2-family": "#1A1A2E",
  "kcell-family": "#00A651",
};

function getOperatorColor(service: ServiceDto) {
  return operatorColors[service.slug] ?? "var(--eco-primary)";
}

export function HomePage() {
  const { t } = useI18n();
  const [operators, setOperators] = useState<OperatorCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const comingSoon = [
    { name: t("videoStreaming"), icon: Tv, desc: "Netflix, IVI, Кинопоиск" },
    { name: t("music"), icon: Music, desc: "Spotify, Яндекс Музыка" },
    { name: t("aiTools"), icon: Bot, desc: "ChatGPT, Midjourney" },
    { name: t("premiumApps"), icon: Sparkles, desc: "Canva, Notion, Figma" },
  ];

  useEffect(() => {
    let isCancelled = false;

    async function loadCatalog() {
      try {
        const [services, roomResponse] = await Promise.all([
          getServices(),
          getRooms({ status: "OPEN", size: 100 }),
        ]);

        const telecomServices = services.filter((service) => service.providerType === "OPERATOR");
        const tariffCounts = await Promise.all(
          telecomServices.map(async (service) => ({
            serviceId: service.id,
            count: (await getTariffs(service.id)).length,
          })),
        );

        const roomCounts = roomResponse.items.reduce<Record<number, number>>((accumulator, room) => {
          accumulator[room.serviceId] = (accumulator[room.serviceId] ?? 0) + 1;
          return accumulator;
        }, {});

        const cards = telecomServices
          .map((service) => ({
            id: service.id,
            name: service.name,
            plans: tariffCounts.find((item) => item.serviceId === service.id)?.count ?? 0,
            rooms: roomCounts[service.id] ?? 0,
            color: getOperatorColor(service),
          }))
          .sort((left, right) => left.name.localeCompare(right.name));

        if (!isCancelled) {
          setOperators(cards);
        }
      } catch {
        if (!isCancelled) {
          setError("Unable to load the live catalog right now.");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }

    void loadCatalog();

    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <div>
      <div className="py-16 px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[1200px] mx-auto text-center">
          <h1 className="text-[32px] sm:text-[40px] tracking-tight" style={{ color: "var(--eco-text)" }}>
            {t("heroTitle")} <span style={{ color: "var(--eco-primary)" }}>{t("heroTitleHighlight")}</span>
          </h1>
          <p className="text-[15px] mt-3 max-w-lg mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
            {t("heroSubtitle")}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link
              to="/browse"
              className="px-5 py-2.5 rounded-lg text-[14px]"
              style={{ background: "var(--eco-primary)", color: "#fff", textDecoration: "none" }}
            >
              {t("browseRooms")}
            </Link>
            <Link
              to="/rooms/create"
              className="px-5 py-2.5 rounded-lg text-[14px]"
              style={{ background: "var(--eco-surface)", color: "var(--eco-text)", border: "1px solid var(--eco-border)", textDecoration: "none" }}
            >
              {t("createRoom")}
            </Link>
          </div>
        </div>
      </div>
      <WaveDivider flip />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone size={18} style={{ color: "var(--eco-primary)" }} />
          <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("mobileOperators")}</h2>
        </div>
        <p className="text-[13px] mb-2" style={{ color: "var(--eco-text-secondary)" }}>
          {t("familyGroupPlansAvailable")}
        </p>
        {error && (
          <p className="text-[12px] mb-4" style={{ color: "var(--eco-negative)" }}>
            {error}
          </p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading
            ? Array.from({ length: 3 }).map((_, index) => (
                <Card key={index} className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg animate-pulse" style={{ background: "var(--eco-surface)" }} />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-4 rounded animate-pulse" style={{ background: "var(--eco-surface)" }} />
                    <div className="h-3 rounded w-2/3 animate-pulse" style={{ background: "var(--eco-surface)" }} />
                  </div>
                </Card>
              ))
            : operators.map((operator) => (
                <Link key={operator.id} to={`/operator/${operator.id}`} style={{ textDecoration: "none" }}>
                  <Card className="flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer">
                    <div
                      className="w-11 h-11 rounded-lg flex items-center justify-center text-[15px] shrink-0"
                      style={{ background: `${operator.color}18`, color: operator.color }}
                    >
                      {operator.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{operator.name}</div>
                      <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {operator.plans > 0 ? `${operator.plans} ${t("plan")} · ${operator.rooms} ${t("rooms")}` : t("noFamilyPlansAvailable")}
                      </div>
                    </div>
                    {operator.plans === 0 && <Badge variant="default">{t("na")}</Badge>}
                  </Card>
                </Link>
              ))}
        </div>

        <div className="mt-10">
          <div className="flex items-center gap-3 mb-2">
            <Wifi size={18} style={{ color: "var(--eco-primary)" }} />
            <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("homeInternet")}</h2>
          </div>
          <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            {t("bundledInternetPlans")}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["Beeline Home", "iD Net", "Kazakhtelecom"].map((name) => (
              <Card key={name} className="flex items-center gap-4 opacity-60">
                <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--eco-neutral-100)" }}>
                  <Wifi size={18} style={{ color: "var(--eco-text-tertiary)" }} />
                </div>
                <div>
                  <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{name}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("comingQ3")}</div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <WaveDivider />

      <div style={{ background: "var(--eco-surface)" }} className="px-6 py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("digitalSubscriptions")}</h2>
            <Badge variant="default">{t("comingSoon")}</Badge>
          </div>
          <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            Split streaming, music, AI tools - launching later in 2026
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {comingSoon.map((category) => (
              <div
                key={category.name}
                className="rounded-xl p-5 flex flex-col items-center text-center gap-3 opacity-50 cursor-not-allowed"
                style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-neutral-100)" }}>
                  <category.icon size={18} style={{ color: "var(--eco-text-tertiary)" }} />
                </div>
                <div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{category.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{category.desc}</div>
                </div>
                <Lock size={14} style={{ color: "var(--eco-text-tertiary)" }} />
              </div>
            ))}
          </div>
          <div className="flex gap-4 mt-6 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--eco-brand-500)" }} />
              Bundle includes home internet
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: "var(--eco-warning-500)" }} />
              Promo price first month
            </span>
          </div>
        </div>
      </div>

      <DigitalSubscriptionsAvailable />
    </div>
  );
}
