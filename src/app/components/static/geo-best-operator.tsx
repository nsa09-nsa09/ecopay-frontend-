import { useState } from "react";
import { useI18n } from "../i18n-provider";
import { Badge, Button } from "../ds-primitives";
import {
  AlertTriangle, ArrowRight, BarChart3, Check, ChevronDown, ChevronRight,
  Crown, Globe2, Info, Locate, MapPin, Navigation, Radio, Router,
  Search, Shield, Signal, SignalHigh, SignalLow, SignalMedium,
  Smartphone, Star, TrendingUp, Wifi, Zap,
} from "lucide-react";

/* ─── types ─── */
type CoverageLevel = "excellent" | "good" | "fair" | "weak";

interface OperatorGeo {
  name: string;
  color: string;
  coverage4G: CoverageLevel;
  coverage5G: CoverageLevel | null;
  avgSpeed: number;
  shareablePlans: number;
  cheapestPlan: number;
  bestFor: string;
  overallScore: number;
  bars: number;
}

/* ─── mock data per city ─── */
const CITY_DATA: Record<string, { lat: string; lng: string; operators: OperatorGeo[] }> = {
  "Алматы": {
    lat: "43.2380",
    lng: "76.9454",
    operators: [
      { name: "Beeline", color: "#FFB800", coverage4G: "excellent", coverage5G: "good", avgSpeed: 48, shareablePlans: 6, cheapestPlan: 2490, bestFor: "Speed & 5G coverage", overallScore: 92, bars: 5 },
      { name: "Kcell", color: "#6B2D8B", coverage4G: "excellent", coverage5G: "fair", avgSpeed: 42, shareablePlans: 5, cheapestPlan: 2990, bestFor: "Premium plans, large data", overallScore: 88, bars: 4 },
      { name: "Activ", color: "#E4002B", coverage4G: "good", coverage5G: null, avgSpeed: 35, shareablePlans: 4, cheapestPlan: 1990, bestFor: "Budget-friendly", overallScore: 80, bars: 4 },
      { name: "Altel", color: "#00AEEF", coverage4G: "good", coverage5G: "good", avgSpeed: 52, shareablePlans: 3, cheapestPlan: 3200, bestFor: "5G early adopter", overallScore: 85, bars: 4 },
      { name: "Tele2", color: "#1A1A1A", coverage4G: "fair", coverage5G: null, avgSpeed: 28, shareablePlans: 3, cheapestPlan: 1490, bestFor: "Lowest price", overallScore: 72, bars: 3 },
    ],
  },
  "Астана": {
    lat: "51.1694",
    lng: "71.4491",
    operators: [
      { name: "Kcell", color: "#6B2D8B", coverage4G: "excellent", coverage5G: "good", avgSpeed: 45, shareablePlans: 5, cheapestPlan: 2990, bestFor: "Best coverage in capital", overallScore: 94, bars: 5 },
      { name: "Beeline", color: "#FFB800", coverage4G: "excellent", coverage5G: "fair", avgSpeed: 40, shareablePlans: 6, cheapestPlan: 2490, bestFor: "Plan variety", overallScore: 89, bars: 5 },
      { name: "Altel", color: "#00AEEF", coverage4G: "good", coverage5G: "excellent", avgSpeed: 58, shareablePlans: 3, cheapestPlan: 3200, bestFor: "Fastest 5G", overallScore: 87, bars: 4 },
      { name: "Activ", color: "#E4002B", coverage4G: "good", coverage5G: null, avgSpeed: 32, shareablePlans: 4, cheapestPlan: 1990, bestFor: "Budget option", overallScore: 78, bars: 4 },
      { name: "Tele2", color: "#1A1A1A", coverage4G: "good", coverage5G: null, avgSpeed: 30, shareablePlans: 3, cheapestPlan: 1490, bestFor: "Lowest price", overallScore: 74, bars: 3 },
    ],
  },
  "Шымкент": {
    lat: "42.3417",
    lng: "69.5901",
    operators: [
      { name: "Activ", color: "#E4002B", coverage4G: "excellent", coverage5G: null, avgSpeed: 38, shareablePlans: 4, cheapestPlan: 1990, bestFor: "Best coverage here", overallScore: 86, bars: 5 },
      { name: "Beeline", color: "#FFB800", coverage4G: "good", coverage5G: null, avgSpeed: 34, shareablePlans: 5, cheapestPlan: 2490, bestFor: "Good speed + plans", overallScore: 82, bars: 4 },
      { name: "Kcell", color: "#6B2D8B", coverage4G: "good", coverage5G: null, avgSpeed: 30, shareablePlans: 4, cheapestPlan: 2990, bestFor: "Premium data plans", overallScore: 78, bars: 4 },
      { name: "Tele2", color: "#1A1A1A", coverage4G: "fair", coverage5G: null, avgSpeed: 22, shareablePlans: 2, cheapestPlan: 1490, bestFor: "Budget calls + data", overallScore: 68, bars: 3 },
      { name: "Altel", color: "#00AEEF", coverage4G: "fair", coverage5G: null, avgSpeed: 25, shareablePlans: 2, cheapestPlan: 3200, bestFor: "Growing coverage", overallScore: 65, bars: 3 },
    ],
  },
};

const CITIES = Object.keys(CITY_DATA);

const fmt = (n: number) => n.toLocaleString("ru-KZ") + " ₸";

/* ─── shared ─── */
const SC = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`rounded-xl p-6 ${className}`} style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>{children}</div>
);

function CoverageBar({ level }: { level: CoverageLevel | null }) {
  const { t } = useI18n();
  if (!level) return <span className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>—</span>;
  const map: Record<CoverageLevel, { color: string; width: string; key: string }> = {
    excellent: { color: "var(--eco-success-500)", width: "100%", key: "geoExcellent" },
    good: { color: "var(--eco-brand-600)", width: "75%", key: "geoGood" },
    fair: { color: "var(--eco-warning-500)", width: "50%", key: "geoFair" },
    weak: { color: "var(--eco-danger-500)", width: "25%", key: "geoWeak" },
  };
  const m = map[level];
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 rounded-full" style={{ background: "var(--eco-neutral-200)" }}>
        <div className="h-1.5 rounded-full transition-all" style={{ width: m.width, background: m.color }} />
      </div>
      <span className="text-[10px]" style={{ color: m.color }}>{t(m.key)}</span>
    </div>
  );
}

function SignalBars({ bars }: { bars: number }) {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="w-1 rounded-sm transition-colors"
          style={{
            height: `${i * 3 + 2}px`,
            background: i <= bars ? "var(--eco-success-500)" : "var(--eco-neutral-200)",
          }}
        />
      ))}
    </div>
  );
}

/* ═══════ PERMISSION PROMPT ═══════ */
function PermissionPrompt({ onAllow, onSkip }: { onAllow: () => void; onSkip: () => void }) {
  const { t } = useI18n();
  return (
    <div className="max-w-[480px] mx-auto">
      <SC className="text-center">
        {/* Animated pin illustration */}
        <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center" style={{ background: "var(--eco-brand-50)" }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "var(--eco-primary)" }}>
            <MapPin size={28} style={{ color: "var(--eco-text-on-primary)" }} />
          </div>
        </div>

        <h2 className="text-[22px] mb-2" style={{ color: "var(--eco-text)" }}>{t("geoPermTitle")}</h2>
        <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>{t("geoPermDesc")}</p>

        <div className="flex flex-col gap-2 mb-6">
          <Button variant="primary" size="lg" onClick={onAllow} className="w-full">
            <Locate size={16} /> {t("geoPermBtn")}
          </Button>
          <Button variant="ghost" size="md" onClick={onSkip} className="w-full">
            <Search size={14} /> {t("geoPermSkip")}
          </Button>
        </div>

        {/* Privacy note */}
        <div className="rounded-lg px-4 py-3 flex items-start gap-2 text-left" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
          <Shield size={13} className="mt-0.5 shrink-0" style={{ color: "var(--eco-success-500)" }} />
          <span className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{t("geoPermPrivacy")}</span>
        </div>
      </SC>
    </div>
  );
}

/* ═══════ CITY PICKER ═══════ */
function CityPicker({ onSelect }: { onSelect: (city: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="max-w-[480px] mx-auto">
      <SC>
        <div className="flex items-center gap-2 mb-4">
          <Globe2 size={16} style={{ color: "var(--eco-primary)" }} />
          <span className="text-[16px]" style={{ color: "var(--eco-text)" }}>{t("geoPermSkip")}</span>
        </div>
        <div className="flex flex-col gap-2">
          {CITIES.map((city) => (
            <button
              key={city}
              onClick={() => onSelect(city)}
              className="flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors text-left"
              style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}
            >
              <div className="flex items-center gap-2">
                <MapPin size={14} style={{ color: "var(--eco-primary)" }} />
                <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{city}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{CITY_DATA[city].operators.length} operators</span>
                <ChevronRight size={14} style={{ color: "var(--eco-neutral-300)" }} />
              </div>
            </button>
          ))}
        </div>
      </SC>
    </div>
  );
}

/* ═══════ RESULTS VIEW ═══════ */
function ResultsView({ city }: { city: string }) {
  const { t } = useI18n();
  const [sort, setSort] = useState<"score" | "speed" | "price">("score");
  const data = CITY_DATA[city];

  const sorted = [...data.operators].sort((a, b) => {
    if (sort === "speed") return b.avgSpeed - a.avgSpeed;
    if (sort === "price") return a.cheapestPlan - b.cheapestPlan;
    return b.overallScore - a.overallScore;
  });

  const best = sorted[0];

  return (
    <div>
      {/* Location bar */}
      <div className="rounded-xl px-5 py-3 mb-5 flex items-center justify-between flex-wrap gap-3" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "var(--eco-success-100)" }}>
            <MapPin size={14} style={{ color: "var(--eco-success-500)" }} />
          </div>
          <div>
            <div className="text-[14px]" style={{ color: "var(--eco-text)" }}>{city}</div>
            <div className="text-[11px] tabular-nums" style={{ color: "var(--eco-text-tertiary)" }}>{data.lat}, {data.lng}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("geoSortBy")}:</span>
          {(["score", "speed", "price"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className="px-2.5 py-1 rounded-lg text-[11px] cursor-pointer transition-colors"
              style={{
                background: sort === s ? "var(--eco-primary)" : "var(--eco-neutral-100)",
                color: sort === s ? "var(--eco-text-on-primary)" : "var(--eco-text-secondary)",
              }}
            >
              {s === "score" ? t("geoOverall") : s === "speed" ? t("geoSpeed") : t("geoPrice")}
            </button>
          ))}
        </div>
      </div>

      {/* Winner banner */}
      <div className="rounded-xl px-5 py-4 mb-5 flex items-center gap-4" style={{ background: `${best.color}12`, border: `1px solid ${best.color}40` }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: best.color }}>
          <Crown size={22} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[16px]" style={{ color: "var(--eco-text)" }}>{best.name}</span>
            <Badge variant="success">#{1} {t("geoOverall")}</Badge>
          </div>
          <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>
            {t("geoBestFor")}: {best.bestFor} · {best.overallScore}/100
          </div>
        </div>
        <Button variant="primary" size="sm">
          {t("geoViewPlans")} <ArrowRight size={13} />
        </Button>
      </div>

      {/* Operator cards */}
      <div className="flex flex-col gap-4 mb-6">
        {sorted.map((op, idx) => (
          <SC key={op.name} className="!p-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: op.color }}>
                <Radio size={14} color="#fff" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[14px]" style={{ color: "var(--eco-text)" }}>{op.name}</span>
                  {idx === 0 && <Crown size={12} style={{ color: "var(--eco-warning-500)" }} />}
                </div>
                <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{t("geoBestFor")}: {op.bestFor}</div>
              </div>
              <div className="text-right">
                <div className="text-[20px] tabular-nums" style={{ color: "var(--eco-text)" }}>{op.overallScore}</div>
                <div className="text-[9px]" style={{ color: "var(--eco-text-tertiary)" }}>/100</div>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x" style={{ borderColor: "var(--eco-border)" }}>
              {/* Coverage */}
              <div className="px-4 py-3">
                <div className="text-[10px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>4G {t("geoCoverage")}</div>
                <div className="flex items-center gap-2 mb-1.5">
                  <SignalBars bars={op.bars} />
                </div>
                <CoverageBar level={op.coverage4G} />
                {op.coverage5G && (
                  <div className="mt-2">
                    <div className="text-[10px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>5G</div>
                    <CoverageBar level={op.coverage5G} />
                  </div>
                )}
              </div>

              {/* Speed */}
              <div className="px-4 py-3">
                <div className="text-[10px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>{t("geoSpeed")}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] tabular-nums" style={{ color: "var(--eco-text)" }}>{op.avgSpeed}</span>
                  <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>Mbps</span>
                </div>
                <div className="w-full h-1.5 rounded-full mt-2" style={{ background: "var(--eco-neutral-200)" }}>
                  <div className="h-1.5 rounded-full" style={{ width: `${Math.min(op.avgSpeed / 60 * 100, 100)}%`, background: op.avgSpeed >= 45 ? "var(--eco-success-500)" : op.avgSpeed >= 30 ? "var(--eco-brand-600)" : "var(--eco-warning-500)" }} />
                </div>
              </div>

              {/* Price */}
              <div className="px-4 py-3">
                <div className="text-[10px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>{t("geoPrice")} (min)</div>
                <div className="text-[18px] tabular-nums" style={{ color: "var(--eco-text)" }}>{fmt(op.cheapestPlan)}</div>
                <div className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>/month</div>
              </div>

              {/* Plans */}
              <div className="px-4 py-3">
                <div className="text-[10px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>{t("geoShareable")}</div>
                <div className="text-[22px] tabular-nums" style={{ color: "var(--eco-primary)" }}>{op.shareablePlans}</div>
                <div className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>rooms open</div>
              </div>
            </div>

            {/* CTA */}
            <div className="px-5 py-3 flex items-center justify-between" style={{ background: "var(--eco-bg)", borderTop: "1px solid var(--eco-border)" }}>
              <span className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>#{idx + 1} in {city}</span>
              <Button variant={idx === 0 ? "primary" : "secondary"} size="sm">
                {t("geoViewPlans")} <ChevronRight size={12} />
              </Button>
            </div>
          </SC>
        ))}
      </div>

      {/* Comparison table */}
      <SC className="!p-0 overflow-hidden mb-6">
        <div className="px-5 py-3" style={{ background: "var(--eco-bg)", borderBottom: "1px solid var(--eco-border)" }}>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} style={{ color: "var(--eco-primary)" }} />
            <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>Quick Comparison — {city}</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr style={{ background: "var(--eco-bg)" }}>
                <th className="text-left px-4 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>Operator</th>
                <th className="text-center px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>Score</th>
                <th className="text-center px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>4G</th>
                <th className="text-center px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>5G</th>
                <th className="text-center px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>Speed</th>
                <th className="text-center px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>From</th>
                <th className="text-center px-3 py-2.5" style={{ color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>Plans</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((op, idx) => (
                <tr key={op.name} style={{ borderBottom: "1px solid var(--eco-border)", background: idx === 0 ? "var(--eco-success-100)" : "transparent" }}>
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: op.color }} />
                      <span style={{ color: "var(--eco-text)" }}>{op.name}</span>
                      {idx === 0 && <Crown size={10} style={{ color: "var(--eco-warning-500)" }} />}
                    </div>
                  </td>
                  <td className="text-center px-3 py-2.5 tabular-nums" style={{ color: "var(--eco-text)" }}>{op.overallScore}</td>
                  <td className="text-center px-3 py-2.5"><CoverageBar level={op.coverage4G} /></td>
                  <td className="text-center px-3 py-2.5"><CoverageBar level={op.coverage5G} /></td>
                  <td className="text-center px-3 py-2.5 tabular-nums" style={{ color: "var(--eco-text)" }}>{op.avgSpeed} Mbps</td>
                  <td className="text-center px-3 py-2.5 tabular-nums" style={{ color: "var(--eco-text)" }}>{fmt(op.cheapestPlan)}</td>
                  <td className="text-center px-3 py-2.5 tabular-nums" style={{ color: "var(--eco-primary)" }}>{op.shareablePlans}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SC>

      {/* Disclaimer */}
      <div className="rounded-xl px-5 py-3 flex items-start gap-2" style={{ background: "var(--eco-warning-100)", border: "1px solid var(--eco-warning-300)" }}>
        <AlertTriangle size={14} className="mt-0.5 shrink-0" style={{ color: "var(--eco-warning-500)" }} />
        <span className="text-[12px]" style={{ color: "var(--eco-warning-500)" }}>{t("geoDisclaimer")}</span>
      </div>
    </div>
  );
}

/* ═══════ MAIN PAGE ═══════ */
export function GeoBestOperatorPage() {
  const { t } = useI18n();
  const [step, setStep] = useState<"prompt" | "manual" | "results">("prompt");
  const [city, setCity] = useState("Алматы");

  const handleAllow = () => {
    // Simulate geolocation → defaults to Almaty
    setCity("Алматы");
    setStep("results");
  };

  const handleCitySelect = (c: string) => {
    setCity(c);
    setStep("results");
  };

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>Page 23</span>
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-success-100)", color: "var(--eco-success-500)" }}>Geo MVP</span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>{t("geoTitle")}</h1>
        <p className="text-[16px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>{t("geoSubtitle")}</p>

        {/* Flow indicator */}
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { id: "prompt", label: t("geoPermTitle"), icon: Locate },
            { id: "results", label: t("geoResults"), icon: BarChart3 },
          ].map((s, i, arr) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg" style={{
                background: step === s.id || (s.id === "prompt" && step === "manual") ? "var(--eco-primary)" : step === "results" ? "var(--eco-success-100)" : "var(--eco-neutral-100)",
                color: step === s.id || (s.id === "prompt" && step === "manual") ? "var(--eco-text-on-primary)" : step === "results" ? "var(--eco-success-500)" : "var(--eco-text-tertiary)",
              }}>
                <s.icon size={12} />
                <span className="text-[11px]">{s.label}</span>
              </div>
              {i < arr.length - 1 && <ArrowRight size={14} style={{ color: "var(--eco-neutral-300)" }} />}
            </div>
          ))}
          {step === "results" && (
            <button onClick={() => setStep("manual")} className="text-[11px] px-2 py-1 rounded cursor-pointer" style={{ color: "var(--eco-primary)", background: "var(--eco-brand-50)" }}>
              Change city
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      {step === "results" && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {[
            { n: "5", label: "Operators compared" },
            { n: city, label: t("geoYourLocation") },
            { n: `${CITY_DATA[city].operators.reduce((s, o) => s + o.shareablePlans, 0)}`, label: "Shareable plans" },
            { n: `${fmt(Math.min(...CITY_DATA[city].operators.map((o) => o.cheapestPlan)))}`, label: "From" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
              <div className="text-[18px]" style={{ color: "var(--eco-text)" }}>{s.n}</div>
              <div className="text-[10px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {step === "prompt" && <PermissionPrompt onAllow={handleAllow} onSkip={() => setStep("manual")} />}
      {step === "manual" && <CityPicker onSelect={handleCitySelect} />}
      {step === "results" && <ResultsView city={city} />}
    </div>
  );
}
