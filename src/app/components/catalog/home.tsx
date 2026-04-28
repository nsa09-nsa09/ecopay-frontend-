import { Link } from "react-router";
import { Card, Badge, WaveDivider } from "../ds-primitives";
import { Smartphone, Wifi, Tv, Music, Sparkles, Bot, Lock, UserPlus, CreditCard, CheckCircle, Search, Send, ShieldCheck } from "lucide-react";
import { DigitalSubscriptionsAvailable } from "./digital-subscriptions";
import { useI18n } from "../i18n-provider";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { catalogApi } from "../../../lib/api/catalog";

const OPERATOR_COLORS: Record<string, string> = {
  beeline: "#FFB800",
  activ: "#9B59B6",
  altel: "#E74C3C",
  tele2: "#1A1A2E",
  kcell: "#00A651",
};

export function HomePage() {
  const { t } = useI18n();
  const [activeGuide, setActiveGuide] = useState<"owners" | "members">("owners");

  const servicesQuery = useQuery({
    queryKey: ["catalog", "services", "mobile"],
    queryFn: () => catalogApi.services({ categoryId: "mobile" }),
  });

  const operators = useMemo(() => {
    const list = servicesQuery.data ?? [];
    return list.map((s) => {
      const id = s.id;
      const slug = s.operator?.toLowerCase() ?? "";
      return {
        id,
        name: s.name,
        plans: 0,
        rooms: 0,
        color: OPERATOR_COLORS[slug] ?? "var(--eco-primary)",
      };
    });
  }, [servicesQuery.data]);

  const comingSoon = [
    { name: t("videoStreaming"), icon: Tv, desc: "Netflix, IVI, Кинопоиск" },
    { name: t("music"), icon: Music, desc: "Spotify, Яндекс Музыка" },
    { name: t("aiTools"), icon: Bot, desc: "ChatGPT, Midjourney" },
    { name: t("premiumApps"), icon: Sparkles, desc: "Canva, Notion, Figma" },
  ];
  
  return (
    <div>
      {/* Hero */}
      <div className="py-16 px-6" style={{ background: "var(--eco-surface)" }}>
        <div className="max-w-[1200px] mx-auto text-center">
          <h1 className="text-[32px] sm:text-[40px] tracking-tight" style={{ color: "var(--eco-text)" }}>
            {t("heroTitle")} <span style={{ color: "var(--eco-primary)" }}>{t("heroTitleHighlight")}</span>
          </h1>
          <p className="text-[15px] mt-3 max-w-lg mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
            {t("heroSubtitle")}
          </p>
        </div>
      </div>
      <WaveDivider flip />

      {/* Mobile Operators */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Smartphone size={18} style={{ color: "var(--eco-primary)" }} />
          <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("mobileOperators")}</h2>
        </div>
        <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
          {t("familyGroupPlansAvailable")}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((op) => (
            <Link key={op.id} to={`/operator/${op.id}`} style={{ textDecoration: "none" }}>
              <Card className="flex items-center gap-4 hover:shadow-sm transition-shadow cursor-pointer">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center text-[15px] shrink-0"
                  style={{ background: op.color + "18", color: op.color }}
                >
                  {op.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>{op.name}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                    {op.plans > 0 ? `${op.plans} ${t("plan")} · ${op.rooms} ${t("rooms")}` : t("noFamilyPlansAvailable")}
                  </div>
                </div>
                {op.plans === 0 && <Badge variant="default">{t("na")}</Badge>}
              </Card>
            </Link>
          ))}
        </div>

        {/* Home Internet placeholder */}
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

      {/* How to Manage — Step by Step Guide */}
      <div className="max-w-[1200px] mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h2 className="text-[24px] tracking-tight mb-2" style={{ color: "var(--eco-text)" }}>
            {t("howToManage")}
          </h2>
          <p className="text-[14px] max-w-2xl mx-auto" style={{ color: "var(--eco-text-secondary)" }}>
            {t("heroSubtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-3 justify-center mb-8">
          <div className="inline-flex rounded-lg p-1" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <button
              className="px-5 py-2 rounded-md text-[14px] font-medium transition-all"
              style={{
                background: activeGuide === "owners" ? "var(--eco-primary)" : "transparent",
                color: activeGuide === "owners" ? "#fff" : "var(--eco-text-secondary)",
              }}
              onClick={() => setActiveGuide("owners")}
            >
              {t("forOwnersGuide")}
            </button>
            <button
              className="px-5 py-2 rounded-md text-[14px] font-medium transition-all"
              style={{
                background: activeGuide === "members" ? "var(--eco-primary)" : "transparent",
                color: activeGuide === "members" ? "#fff" : "var(--eco-text-secondary)",
              }}
              onClick={() => setActiveGuide("members")}
            >
              {t("forMembersGuide")}
            </button>
          </div>
        </div>

        {/* Owner Steps */}
        <div className={activeGuide === "owners" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "hidden"}>
          {[
            {
              step: "1",
              icon: Search,
              title: t("ownerStep1Title"),
              desc: t("ownerStep1Desc"),
              color: "var(--eco-primary)",
            },
            {
              step: "2",
              icon: UserPlus,
              title: t("ownerStep2Title"),
              desc: t("ownerStep2Desc"),
              color: "var(--eco-brand-600)",
            },
            {
              step: "3",
              icon: CreditCard,
              title: t("ownerStep3Title"),
              desc: t("ownerStep3Desc"),
              color: "var(--eco-brand-700)",
            },
            {
              step: "4",
              icon: ShieldCheck,
              title: t("ownerStep4Title"),
              desc: t("ownerStep4Desc"),
              color: "var(--eco-positive)",
            },
          ].map((item, idx) => (
            <Card key={idx} className="relative overflow-hidden">
              {/* Step number badge */}
              <div
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: item.color + "20", color: item.color }}
              >
                {item.step}
              </div>

              <div className="pt-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: item.color + "18" }}
                >
                  <item.icon size={22} style={{ color: item.color }} />
                </div>
                <h3 className="text-[16px] mb-2 font-medium" style={{ color: "var(--eco-text)" }}>
                  {item.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                  {item.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>

        {/* Member Steps (hidden by default, would show when tab is clicked) */}
        <div className={activeGuide === "members" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" : "hidden"}>
          {[
            {
              step: "1",
              icon: Search,
              title: t("memberStep1Title"),
              desc: t("memberStep1Desc"),
              color: "var(--eco-primary)",
            },
            {
              step: "2",
              icon: Send,
              title: t("memberStep2Title"),
              desc: t("memberStep2Desc"),
              color: "var(--eco-brand-600)",
            },
            {
              step: "3",
              icon: CreditCard,
              title: t("memberStep3Title"),
              desc: t("memberStep3Desc"),
              color: "var(--eco-brand-700)",
            },
            {
              step: "4",
              icon: CheckCircle,
              title: t("memberStep4Title"),
              desc: t("memberStep4Desc"),
              color: "var(--eco-positive)",
            },
          ].map((item, idx) => (
            <Card key={idx} className="relative overflow-hidden">
              <div
                className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold"
                style={{ background: item.color + "20", color: item.color }}
              >
                {item.step}
              </div>

              <div className="pt-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: item.color + "18" }}
                >
                  <item.icon size={22} style={{ color: item.color }} />
                </div>
                <h3 className="text-[16px] mb-2 font-medium" style={{ color: "var(--eco-text)" }}>
                  {item.title}
                </h3>
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--eco-text-secondary)" }}>
                  {item.desc}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <WaveDivider />

      {/* Coming Soon — Digital */}
      <div style={{ background: "var(--eco-surface)" }} className="px-6 py-12">
        <div className="max-w-[1200px] mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>{t("digitalSubscriptions")}</h2>
            <Badge variant="default">{t("comingSoon")}</Badge>
          </div>
          <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            Split streaming, music, AI tools — launching later in 2026
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {comingSoon.map((cat) => (
              <div
                key={cat.name}
                className="rounded-xl p-5 flex flex-col items-center text-center gap-3 opacity-50 cursor-not-allowed"
                style={{ background: "var(--eco-surface-raised)", border: "1px solid var(--eco-border)" }}
              >
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "var(--eco-neutral-100)" }}>
                  <cat.icon size={18} style={{ color: "var(--eco-text-tertiary)" }} />
                </div>
                <div>
                  <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{cat.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{cat.desc}</div>
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

      {/* Digital Subscriptions — Available (Beta) */}
      <DigitalSubscriptionsAvailable />
    </div>
  );
}