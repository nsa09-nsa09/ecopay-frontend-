import { useState, useRef, useEffect, type ReactNode } from "react";
import { Link } from "react-router";
import { Card, Badge, Button } from "../ds-primitives";
import { useI18n } from "../i18n-provider";
import { ChevronDown, ChevronUp, X, Users, Info, ArrowRight } from "lucide-react";

// ─── i18n helpers ───
type L = "ru" | "kz" | "en";
const t = (l: L, ru: string, kz: string, en: string) =>
  l === "ru" ? ru : l === "kz" ? kz : en;

// ─── Popover ───
function Popover({ trigger, children, wide }: { trigger: ReactNode; children: ReactNode; wide?: boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative inline-block">
      <div onClick={() => setOpen(!open)} className="cursor-pointer">{trigger}</div>
      {open && (
        <div
          className="absolute z-50 mt-2 left-0 rounded-xl shadow-lg p-4 overflow-auto"
          style={{
            background: "var(--eco-bg)",
            border: "1px solid var(--eco-border)",
            width: wide ? 520 : 340,
            maxWidth: "calc(100vw - 32px)",
            maxHeight: 420,
          }}
        >
          <button
            className="absolute top-2 right-2 p-1 rounded cursor-pointer"
            style={{ background: "transparent", border: "none" }}
            onClick={() => setOpen(false)}
          >
            <X size={14} style={{ color: "var(--eco-text-tertiary)" }} />
          </button>
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Chip ───
function Chip({ children, variant = "default" }: { children: ReactNode; variant?: "default" | "success" | "info" | "warning" }) {
  const colors = {
    default: { bg: "var(--eco-neutral-100)", text: "var(--eco-text-secondary)" },
    success: { bg: "var(--eco-success-100)", text: "var(--eco-success-500)" },
    info: { bg: "var(--eco-brand-50)", text: "var(--eco-brand-600)" },
    warning: { bg: "var(--eco-warning-100)", text: "var(--eco-warning-500)" },
  };
  const c = colors[variant];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px]" style={{ background: c.bg, color: c.text }}>
      {children}
    </span>
  );
}

// ─── Per-person breakdown table ───
function PerPersonTable({ price, members }: { price: number; members: number[] }) {
  return (
    <div className="flex flex-col gap-1 mt-2">
      <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Per person / month:</div>
      <div className="flex gap-2 flex-wrap">
        {members.map((m) => (
          <span key={m} className="text-[12px] px-2 py-0.5 rounded" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
            {m}p → <strong style={{ color: "var(--eco-text)" }}>₸{Math.round(price / m).toLocaleString()}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Google One ───
function GoogleOneCard({ lang }: { lang: L }) {
  const [selectedPlan, setSelectedPlan] = useState(0);
  const plans = [
    { name: "Standard 200GB", price: 1490 },
    { name: "AI Plus 200GB", price: 2690 },
    { name: "Premium 2TB", price: 4990 },
    { name: "AI Pro 2TB", price: 9990 },
    { name: "Premium 5TB", price: 12490 },
    { name: "Premium 10TB", price: 24990 },
    { name: "Premium 30TB", price: 49990 },
    { name: "Premium 50TB", price: 74990 },
    { name: "AI Ultra 30TB", price: 124990 },
  ];
  const selected = plans[selectedPlan];
  const members = [2, 3, 4, 6];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-[15px]" style={{ background: "#4285F418", color: "#4285F4" }}>G</div>
          <div>
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Google One Family</div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {t(lang, "До 6 участников", "6 қатысушыға дейін", "Up to 6 members")}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <Chip variant="success">{t(lang, "Доступно", "Қолжетімді", "Available")}</Chip>
          <Chip variant="info"><Users size={10} /> {t(lang, "Семейная группа", "Отбасы тобы", "Family group required")}</Chip>
        </div>
      </div>

      {/* Plan pills */}
      <div className="flex flex-wrap gap-1.5">
        {plans.map((p, i) => (
          <button
            key={p.name}
            onClick={() => setSelectedPlan(i)}
            className="px-2.5 py-1 rounded-lg text-[12px] cursor-pointer transition-colors"
            style={{
              background: selectedPlan === i ? "var(--eco-primary)" : "var(--eco-surface)",
              color: selectedPlan === i ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
              border: selectedPlan === i ? "none" : "1px solid var(--eco-border)",
            }}
          >
            {p.name}
          </button>
        ))}
      </div>

      {/* Selected plan detail */}
      <div className="p-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
        <div className="flex items-center justify-between mb-1">
          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{selected.name}</span>
          <span className="text-[15px]" style={{ color: "var(--eco-primary)" }}>₸{selected.price.toLocaleString()}<span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}> /{t(lang, "мес", "ай", "mo")}</span></span>
        </div>
        <PerPersonTable price={selected.price} members={members} />
      </div>

      {/* Breakdown popover */}
      <Popover
        wide
        trigger={
          <span className="inline-flex items-center gap-1 text-[12px]" style={{ color: "var(--eco-primary)" }}>
            <Info size={12} /> {t(lang, "Полная таблица разбивки", "Толық бөлу кестесі", "Full breakdown table")}
          </span>
        }
      >
        <div className="text-[13px] mb-3" style={{ color: "var(--eco-text)" }}>
          {t(lang, "Стоимость на человека, ₸/мес", "Адам басына құны, ₸/ай", "Per person cost, ₸/mo")}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--eco-border)" }}>
                <th className="text-left py-1.5 pr-3" style={{ color: "var(--eco-text-tertiary)" }}>{t(lang, "План", "Жоспар", "Plan")}</th>
                <th className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-tertiary)" }}>{t(lang, "Цена", "Бағасы", "Price")}</th>
                {members.map((m) => (
                  <th key={m} className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-tertiary)" }}>{m}p</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.name} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                  <td className="py-1.5 pr-3" style={{ color: "var(--eco-text)" }}>{p.name}</td>
                  <td className="text-right py-1.5 px-2" style={{ color: "var(--eco-primary)" }}>₸{p.price.toLocaleString()}</td>
                  {members.map((m) => (
                    <td key={m} className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-secondary)" }}>₸{Math.round(p.price / m).toLocaleString()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Popover>

      <Link to="/rooms/create" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="sm" className="w-full">
          {t(lang, "Создать комнату", "Бөлме жасау", "Create Room")} <ArrowRight size={13} />
        </Button>
      </Link>
    </Card>
  );
}

// ─── Apple One ───
function AppleOneCard({ lang }: { lang: L }) {
  const applePlans = [
    { name: "Individual", price: "$19.95", sharing: t(lang, "Без шеринга", "Бөліссіз", "No sharing"), seats: 1 },
    { name: "Family", price: "$25.95", sharing: t(lang, "До 5", "5-ке дейін", "Up to 5"), seats: 5 },
    { name: "Premier", price: "$37.95", sharing: t(lang, "До 5", "5-ке дейін", "Up to 5"), seats: 5 },
  ];
  const icloudPlans = [
    { name: "iCloud+ 200GB", price: "$2.99", seats: 5 },
    { name: "iCloud+ 2TB", price: "$9.99", seats: 5 },
  ];

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-[15px]" style={{ background: "#00000010", color: "#333" }}>A</div>
          <div>
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Apple One</div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {t(lang, "Цены в USD", "USD бағалар", "Prices in USD")}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <Chip variant="success">{t(lang, "Доступно", "Қолжетімді", "Available")}</Chip>
          <Chip variant="info"><Users size={10} /> Family Sharing</Chip>
        </div>
      </div>

      {/* Apple One plans */}
      <div className="flex flex-col gap-1.5">
        {applePlans.map((p) => (
          <div key={p.name} className="flex items-center justify-between px-3 py-2 rounded-lg" style={{ background: "var(--eco-surface)" }}>
            <div>
              <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{p.name}</span>
              <span className="text-[11px] ml-2" style={{ color: "var(--eco-text-tertiary)" }}>{p.sharing}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: "var(--eco-primary)" }}>{p.price}<span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>/mo</span></span>
              <Badge variant="info">USD</Badge>
            </div>
          </div>
        ))}
      </div>

      {/* iCloud+ */}
      <div className="pt-2 border-t" style={{ borderColor: "var(--eco-border)" }}>
        <div className="text-[12px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>iCloud+ Family {t(lang, "тарифы", "тарифтері", "tiers")}</div>
        {icloudPlans.map((p) => (
          <div key={p.name} className="flex items-center justify-between px-3 py-1.5 rounded-lg mb-1" style={{ background: "var(--eco-surface)" }}>
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>{p.name}</span>
              <Chip variant="default">{t(lang, "до", "дейін", "up to")} {p.seats}</Chip>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px]" style={{ color: "var(--eco-primary)" }}>{p.price}<span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>/mo</span></span>
              <Badge variant="info">USD</Badge>
            </div>
          </div>
        ))}
      </div>

      <Link to="/rooms/create" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="sm" className="w-full">
          {t(lang, "Создать комнату", "Бөлме жасау", "Create Room")} <ArrowRight size={13} />
        </Button>
      </Link>
    </Card>
  );
}

// ─── Yandex Plus ───
function YandexPlusCard({ lang }: { lang: L }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-[15px]" style={{ background: "#FC3F1D18", color: "#FC3F1D" }}>Я</div>
          <div>
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Yandex Plus</div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {t(lang, "Музыка, Кинопоиск, Диск и др.", "Музыка, Кинопоиск, Диск т.б.", "Music, Kinopoisk, Disk & more")}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <Chip variant="success">{t(lang, "Доступно", "Қолжетімді", "Available")}</Chip>
          <Chip variant="warning">+3 {t(lang, "близких", "жақындар", "close ones")}</Chip>
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-3 rounded-lg" style={{ background: "var(--eco-surface)" }}>
        <div>
          <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>
            {t(lang, "Пакет сервисов", "Сервис бумасы", "Service bundle")}
          </span>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>
            {t(lang, "Добавьте до 3 близких", "3 жақынға дейін қосыңыз", "Add up to 3 close ones")}
          </div>
        </div>
        <span className="text-[16px]" style={{ color: "var(--eco-primary)" }}>₸1,999<span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}> /{t(lang, "мес", "ай", "mo")}</span></span>
      </div>

      <PerPersonTable price={1999} members={[2, 3, 4]} />

      <Link to="/rooms/create" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="sm" className="w-full">
          {t(lang, "Создать комнату", "Бөлме жасау", "Create Room")} <ArrowRight size={13} />
        </Button>
      </Link>
    </Card>
  );
}

// ─── Yandex Disk / 360 ───
function YandexDiskCard({ lang }: { lang: L }) {
  const [tab, setTab] = useState<"personal" | "family" | "work">("personal");

  const allPlans = {
    personal: [
      { name: "200GB", monthly: 2055, yearly: 1070 },
      { name: "1TB", monthly: 3219, yearly: 1600 },
      { name: "2TB", monthly: 4509, yearly: 2145 },
    ],
    family: [
      { name: "200GB", monthly: 2445, yearly: 1285 },
      { name: "1TB", monthly: 3865, yearly: 1930 },
      { name: "2TB", monthly: 5409, yearly: 2575 },
    ],
    work: [
      { name: "3TB", monthly: 8560, yearly: 6530 },
      { name: "5TB", monthly: 19920, yearly: 11156 },
      { name: "10TB", monthly: 39840, yearly: 39760 },
      { name: "20TB", monthly: 79680, yearly: 79520 },
      { name: "30TB", monthly: 119520, yearly: 119280 },
    ],
  };

  const plans = allPlans[tab];
  const tabLabels: Record<string, Record<L, string>> = {
    personal: { ru: "Личный", kz: "Жеке", en: "Personal" },
    family: { ru: "Семейный", kz: "Отбасылық", en: "Family" },
    work: { ru: "Рабочий", kz: "Жұмыс", en: "Work" },
  };

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 text-[15px]" style={{ background: "#5B57D518", color: "#5B57D5" }}>Д</div>
          <div>
            <div className="text-[15px]" style={{ color: "var(--eco-text)" }}>Yandex Disk <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>(360)</span></div>
            <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {t(lang, "Облачное хранилище", "Бұлттық сақтау", "Cloud storage")}
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap justify-end">
          <Chip variant="success">{t(lang, "Доступно", "Қолжетімді", "Available")}</Chip>
          <Chip variant="default">{t(lang, "Лимит мест", "Орын лимиті", "Seats limit")}</Chip>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: "var(--eco-border)" }}>
        {(["personal", "family", "work"] as const).map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className="px-3 py-1.5 text-[12px] cursor-pointer"
            style={{
              color: tab === tb ? "var(--eco-primary)" : "var(--eco-text-secondary)",
              borderBottom: tab === tb ? "2px solid var(--eco-primary)" : "2px solid transparent",
              marginBottom: -1,
              background: "transparent",
              border: "none",
              borderBottomStyle: "solid",
              borderBottomWidth: 2,
              borderBottomColor: tab === tb ? "var(--eco-primary)" : "transparent",
            }}
          >
            {tabLabels[tb][lang]}
          </button>
        ))}
      </div>

      {/* Mini table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <th className="text-left py-1.5 pr-3" style={{ color: "var(--eco-text-tertiary)" }}>{t(lang, "План", "Жоспар", "Plan")}</th>
              <th className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-tertiary)" }}>{t(lang, "Мес", "Ай", "Mo")}</th>
              <th className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-tertiary)" }}>{t(lang, "Год (мес)", "Жыл (ай)", "Year (mo)")}</th>
              <th className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-tertiary)" }}>{t(lang, "Эконом", "Үнемдеу", "Save")}</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => {
              const savings = Math.round(((p.monthly - p.yearly) / p.monthly) * 100);
              return (
                <tr key={p.name} style={{ borderBottom: "1px solid var(--eco-border)" }}>
                  <td className="py-1.5 pr-3" style={{ color: "var(--eco-text)" }}>{p.name}</td>
                  <td className="text-right py-1.5 px-2" style={{ color: "var(--eco-text-secondary)" }}>₸{p.monthly.toLocaleString()}</td>
                  <td className="text-right py-1.5 px-2" style={{ color: "var(--eco-primary)" }}>₸{p.yearly.toLocaleString()}</td>
                  <td className="text-right py-1.5 px-2" style={{ color: "var(--eco-positive)" }}>-{savings}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Link to="/rooms/create" style={{ textDecoration: "none" }}>
        <Button variant="primary" size="sm" className="w-full">
          {t(lang, "Создать комнату", "Бөлме жасау", "Create Room")} <ArrowRight size={13} />
        </Button>
      </Link>
    </Card>
  );
}

// ─── Main Section ───
export function DigitalSubscriptionsAvailable() {
  const { language } = useI18n();
  const lang = language as L;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-12">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-[20px]" style={{ color: "var(--eco-text)" }}>
          {t(lang, "Цифровые подписки — Доступно", "Цифрлық жазылымдар — Қолжетімді", "Digital Subscriptions — Available")}
        </h2>
        <Badge variant="info">Beta</Badge>
      </div>
      <p className="text-[13px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
        {t(lang,
          "Создавайте комнаты для совместного использования облачных и мультимедийных подписок",
          "Бұлттық және мультимедиа жазылымдарын ортақ пайдалану бөлмелерін жасаңыз",
          "Create rooms to share cloud and media subscriptions together"
        )}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GoogleOneCard lang={lang} />
        <AppleOneCard lang={lang} />
        <YandexPlusCard lang={lang} />
        <YandexDiskCard lang={lang} />
      </div>

      {/* Disclaimer */}
      <div className="mt-6 flex items-start gap-2 px-4 py-3 rounded-lg" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
        <Info size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-text-tertiary)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
          {t(lang,
            "Создавайте комнаты только в соответствии с правилами семейных/групповых тарифов каждого провайдера.",
            "Тек әр провайдердің отбасылық/топтық тариф ережелеріне сәйкес бөлмелер жасаңыз.",
            "Only create rooms that comply with each provider's family/group rules."
          )}
        </span>
      </div>
    </div>
  );
}
