import { useState } from "react";
import { useI18n, type Language } from "../i18n-provider";
import { Menu, X, Search, Globe, Type, Smartphone, ChevronDown, ChevronRight, Check } from "lucide-react";

const typographyScale = [
  { token: "--text-4xl", size: "36px", rem: "2.25rem", usage: "Hero titles", tag: "—" },
  { token: "--text-3xl", size: "30px", rem: "1.875rem", usage: "H1 headings", tag: "h1" },
  { token: "--text-2xl", size: "24px", rem: "1.5rem", usage: "H2 headings", tag: "h2" },
  { token: "--text-xl", size: "20px", rem: "1.25rem", usage: "H3 headings", tag: "h3" },
  { token: "--text-lg", size: "18px", rem: "1.125rem", usage: "H4 / Large body", tag: "h4" },
  { token: "--text-base", size: "16px", rem: "1rem", usage: "Body text (base)", tag: "p" },
  { token: "--text-sm", size: "14px", rem: "0.875rem", usage: "Secondary / captions", tag: "—" },
  { token: "--text-xs", size: "12px", rem: "0.75rem", usage: "Badges / micro labels", tag: "—" },
];

const i18nKeyMap: { key: string; ru: string; kz: string; en: string; module: string }[] = [
  // Nav
  { key: "catalog", ru: "Каталог", kz: "Каталог", en: "Catalog", module: "Nav" },
  { key: "myRooms", ru: "Мои комнаты", kz: "Менің бөлмелерім", en: "My Rooms", module: "Nav" },
  { key: "support", ru: "Поддержка", kz: "Қолдау", en: "Support", module: "Nav" },
  { key: "signIn", ru: "Войти", kz: "Кіру", en: "Sign In", module: "Auth" },
  { key: "signUp", ru: "Регистрация", kz: "Тіркелу", en: "Sign Up", module: "Auth" },
  { key: "createAccount", ru: "Создать аккаунт", kz: "Тіркелгі жасау", en: "Create Account", module: "Auth" },
  { key: "forgotPassword", ru: "Забыли пароль?", kz: "Құпия сөзді ұмыттыңыз ба?", en: "Forgot password?", module: "Auth" },
  // Catalog
  { key: "heroTitle", ru: "Делитесь тарифами.", kz: "Тарифтерді бөлісіңіз.", en: "Share plans.", module: "Catalog" },
  { key: "mobileOperators", ru: "Мобильные операторы", kz: "Мобильді операторлар", en: "Mobile Operators", module: "Catalog" },
  { key: "availableRooms", ru: "Доступные комнаты", kz: "Қолжетімді бөлмелер", en: "Available Rooms", module: "Catalog" },
  // Rooms
  { key: "createRoom", ru: "Создать комнату", kz: "Бөлме жасау", en: "Create Room", module: "Rooms" },
  { key: "roomDetails", ru: "Детали комнаты", kz: "Бөлме деректері", en: "Room Details", module: "Rooms" },
  { key: "members", ru: "Участники", kz: "Қатысушылар", en: "Members", module: "Rooms" },
  { key: "leaveRoom", ru: "Покинуть комнату", kz: "Бөлмеден шығу", en: "Leave Room", module: "Rooms" },
  // Support
  { key: "createNewTicket", ru: "Создать заявку", kz: "Өтінім жасау", en: "Create New Ticket", module: "Support" },
  { key: "subject", ru: "Тема", kz: "Тақырып", en: "Subject", module: "Support" },
  { key: "priority", ru: "Приоритет", kz: "Басымдық", en: "Priority", module: "Support" },
  // Payments
  { key: "checkout", ru: "Оформление оплаты", kz: "Төлемді рәсімдеу", en: "Checkout", module: "Payments" },
  { key: "payNow", ru: "Оплатить", kz: "Төлеу", en: "Pay Now", module: "Payments" },
  { key: "paymentSuccessful", ru: "Оплата успешна", kz: "Төлем сәтті", en: "Payment Successful", module: "Payments" },
  { key: "refundStatus", ru: "Статус возврата", kz: "Қайтару мәртебесі", en: "Refund Status", module: "Payments" },
  // Reputation
  { key: "reputation", ru: "Репутация", kz: "Беделі", en: "Reputation", module: "Reputation" },
  { key: "leaveReview", ru: "Оставить отзыв", kz: "Пікір қалдыру", en: "Leave a Review", module: "Reputation" },
  { key: "submitReview", ru: "Отправить отзыв", kz: "Пікір жіберу", en: "Submit Review", module: "Reputation" },
  // Common
  { key: "save", ru: "Сохранить", kz: "Сақтау", en: "Save", module: "Common" },
  { key: "cancel", ru: "Отмена", kz: "Болдырмау", en: "Cancel", module: "Common" },
  { key: "confirm", ru: "Подтвердить", kz: "Растау", en: "Confirm", module: "Common" },
  { key: "delete", ru: "Удалить", kz: "Жою", en: "Delete", module: "Common" },
  { key: "search", ru: "Поиск", kz: "Іздеу", en: "Search", module: "Common" },
  { key: "loading", ru: "Загрузка...", kz: "Жүктеу...", en: "Loading...", module: "Common" },
];

const modules = ["All", "Nav", "Auth", "Catalog", "Rooms", "Support", "Payments", "Reputation", "Common"];

export function I18nTypographyFixPage() {
  const { t, language } = useI18n();
  const [activeSection, setActiveSection] = useState<"typo" | "i18n" | "mobile">("typo");
  const [filterModule, setFilterModule] = useState("All");

  const filtered = filterModule === "All" ? i18nKeyMap : i18nKeyMap.filter((k) => k.module === filterModule);

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-10">
      {/* Page Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>
            Page 07
          </span>
        </div>
        <h1 className="text-[30px] mb-2" style={{ color: "var(--eco-text)" }}>
          i18n & Typography Fix
        </h1>
        <p className="text-[16px]" style={{ color: "var(--eco-text-secondary)" }}>
          Typography scale update, localization coverage audit, and mobile navbar compact mode.
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 mb-8 p-1 rounded-xl" style={{ background: "var(--eco-surface)" }}>
        {([
          { id: "typo" as const, label: "A) Typography Scale", icon: Type },
          { id: "i18n" as const, label: "B) i18n Key Map", icon: Globe },
          { id: "mobile" as const, label: "C) Mobile Navbar", icon: Smartphone },
        ]).map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-[13px] transition-all cursor-pointer"
            style={{
              background: activeSection === id ? "var(--eco-bg)" : "transparent",
              color: activeSection === id ? "var(--eco-text)" : "var(--eco-text-tertiary)",
              boxShadow: activeSection === id ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(") ")[0]})</span>
          </button>
        ))}
      </div>

      {/* A) Typography Scale */}
      {activeSection === "typo" && (
        <div>
          <div className="rounded-xl p-6 mb-6" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>Typography Scale — 16px Base</h2>
            <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
              Updated from smaller base to 16px for improved readability. All headings scale proportionally via CSS custom properties.
            </p>

            {/* Design Decisions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              {[
                { label: "Base Font", value: "16px", detail: "Body text, inputs, labels" },
                { label: "Secondary", value: "14px", detail: "Captions, helper text" },
                { label: "Heading Scale", value: "18→36px", detail: "H4→H1, proportional" },
              ].map((item) => (
                <div key={item.label} className="rounded-lg p-4" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                  <div className="text-[12px] mb-1" style={{ color: "var(--eco-text-tertiary)" }}>{item.label}</div>
                  <div className="text-[24px] mb-1" style={{ color: "var(--eco-primary)" }}>{item.value}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-secondary)" }}>{item.detail}</div>
                </div>
              ))}
            </div>

            {/* Scale Table */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
              <div className="grid grid-cols-[1fr_70px_80px_1fr_60px] gap-0 text-[12px] px-4 py-2" style={{ background: "var(--eco-bg)", color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>
                <span>Token</span><span>Size</span><span>Rem</span><span>Usage</span><span>Tag</span>
              </div>
              {typographyScale.map((row) => (
                <div key={row.token} className="grid grid-cols-[1fr_70px_80px_1fr_60px] gap-0 text-[13px] px-4 py-3 items-center" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                  <code className="text-[12px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-surface)", color: "var(--eco-primary)" }}>{row.token}</code>
                  <span style={{ color: "var(--eco-text)" }}>{row.size}</span>
                  <span style={{ color: "var(--eco-text-secondary)" }}>{row.rem}</span>
                  <span style={{ color: "var(--eco-text-secondary)" }}>{row.usage}</span>
                  <code className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{row.tag}</code>
                </div>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="rounded-xl p-6" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <h3 className="text-[16px] mb-4" style={{ color: "var(--eco-text)" }}>Live Preview</h3>
            <div className="flex flex-col gap-3">
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>36px</span>
                <span style={{ fontSize: "36px", color: "var(--eco-text)", lineHeight: 1.2 }}>Hero Title</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>30px</span>
                <span style={{ fontSize: "30px", color: "var(--eco-text)", lineHeight: 1.2 }}>H1 Heading</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>24px</span>
                <span style={{ fontSize: "24px", color: "var(--eco-text)", lineHeight: 1.3 }}>H2 Heading</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>20px</span>
                <span style={{ fontSize: "20px", color: "var(--eco-text)", lineHeight: 1.4 }}>H3 Heading</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>18px</span>
                <span style={{ fontSize: "18px", color: "var(--eco-text)", lineHeight: 1.5 }}>H4 / Large Body</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>16px</span>
                <span style={{ fontSize: "16px", color: "var(--eco-text)", lineHeight: 1.6 }}>Body text — base reading size for EcoSplit</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>14px</span>
                <span style={{ fontSize: "14px", color: "var(--eco-text-secondary)", lineHeight: 1.5 }}>Secondary text, captions, helper labels</span>
              </div>
              <div className="flex items-baseline gap-3">
                <span className="text-[12px] w-16 shrink-0" style={{ color: "var(--eco-text-tertiary)" }}>12px</span>
                <span style={{ fontSize: "12px", color: "var(--eco-text-tertiary)", lineHeight: 1.4 }}>Micro labels, badges, timestamps</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B) i18n Key Map */}
      {activeSection === "i18n" && (
        <div>
          <div className="rounded-xl p-6 mb-6" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>i18n Key Map</h2>
            <p className="text-[14px] mb-4" style={{ color: "var(--eco-text-secondary)" }}>
              Reference map of translation keys → RU / KZ / EN strings. Total: 250+ keys across all modules.
            </p>

            {/* Coverage Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {[
                { label: "Total Keys", value: "367+" },
                { label: "Languages", value: "3 (RU/KZ/EN)" },
                { label: "Modules", value: "8" },
                { label: "Coverage", value: "100%" },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                  <div className="text-[20px] mb-0.5" style={{ color: "var(--eco-primary)" }}>{s.value}</div>
                  <div className="text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Module Filter */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {modules.map((m) => (
                <button
                  key={m}
                  onClick={() => setFilterModule(m)}
                  className="px-3 py-1.5 rounded-lg text-[12px] cursor-pointer transition-colors"
                  style={{
                    background: filterModule === m ? "var(--eco-primary)" : "var(--eco-bg)",
                    color: filterModule === m ? "#fff" : "var(--eco-text-secondary)",
                    border: `1px solid ${filterModule === m ? "var(--eco-primary)" : "var(--eco-border)"}`,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Key Table */}
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
              <div className="hidden sm:grid grid-cols-[120px_60px_1fr_1fr_1fr] gap-0 text-[11px] px-4 py-2" style={{ background: "var(--eco-bg)", color: "var(--eco-text-tertiary)", borderBottom: "1px solid var(--eco-border)" }}>
                <span>Key</span><span>Module</span><span>RU</span><span>KZ</span><span>EN</span>
              </div>
              <div className="max-h-[480px] overflow-y-auto">
                {filtered.map((row) => (
                  <div key={row.key}>
                    {/* Desktop */}
                    <div className="hidden sm:grid grid-cols-[120px_60px_1fr_1fr_1fr] gap-0 text-[13px] px-4 py-2.5 items-center" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                      <code className="text-[11px] truncate" style={{ color: "var(--eco-primary)" }}>{row.key}</code>
                      <span className="text-[11px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{row.module}</span>
                      <span style={{ color: "var(--eco-text)" }}>{row.ru}</span>
                      <span style={{ color: "var(--eco-text)" }}>{row.kz}</span>
                      <span style={{ color: "var(--eco-text-secondary)" }}>{row.en}</span>
                    </div>
                    {/* Mobile */}
                    <div className="sm:hidden px-4 py-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <code className="text-[11px]" style={{ color: "var(--eco-primary)" }}>{row.key}</code>
                        <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-brand-50)", color: "var(--eco-primary)" }}>{row.module}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-[12px]">
                        <div><span style={{ color: "var(--eco-text-tertiary)" }}>RU: </span><span style={{ color: "var(--eco-text)" }}>{row.ru}</span></div>
                        <div><span style={{ color: "var(--eco-text-tertiary)" }}>KZ: </span><span style={{ color: "var(--eco-text)" }}>{row.kz}</span></div>
                        <div><span style={{ color: "var(--eco-text-tertiary)" }}>EN: </span><span style={{ color: "var(--eco-text-secondary)" }}>{row.en}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[12px] mt-3" style={{ color: "var(--eco-text-tertiary)" }}>
              Showing {filtered.length} of {i18nKeyMap.length} sample keys. Full dictionary contains 367+ entries in i18n-provider.tsx.
            </p>
          </div>

          {/* Module Coverage */}
          <div className="rounded-xl p-6" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <h3 className="text-[16px] mb-4" style={{ color: "var(--eco-text)" }}>Module Coverage Checklist</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { page: "01 — MVP Web (Catalog, Auth)", keys: "~80 keys", done: true },
                { page: "02 — App Shell & Static Pages", keys: "~45 keys", done: true },
                { page: "03 — Rooms Experience (Deep)", keys: "~65 keys", done: true },
                { page: "04 — Support (Tickets)", keys: "~30 keys", done: true },
                { page: "05 — Admin Portal", keys: "~40 keys", done: true },
                { page: "06 — Payments", keys: "~35 keys", done: true },
                { page: "Reputation & Reviews", keys: "~50 keys", done: true },
                { page: "Common UI Elements", keys: "~30 keys", done: true },
              ].map((item) => (
                <div key={item.page} className="flex items-center gap-3 rounded-lg p-3" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: item.done ? "var(--eco-positive)" : "var(--eco-border)" }}>
                    <Check size={12} color="#fff" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] truncate" style={{ color: "var(--eco-text)" }}>{item.page}</div>
                    <div className="text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>{item.keys}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* C) Mobile Navbar Fix */}
      {activeSection === "mobile" && (
        <div>
          <div className="rounded-xl p-6 mb-6" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <h2 className="text-[20px] mb-1" style={{ color: "var(--eco-text)" }}>Mobile Navbar — Compact Mode</h2>
            <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
              On mobile (&lt;768px), the header shows only: Logo + Search icon + Language chip + Menu icon. Full language switching moves into the menu sheet.
            </p>

            {/* Before / After */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
              {/* Before */}
              <div>
                <div className="text-[12px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>BEFORE (overflow risk)</div>
                <div className="rounded-xl overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
                  <div className="p-3 flex items-center justify-between" style={{ background: "var(--eco-bg)", borderBottom: "1px solid var(--eco-border)" }}>
                    <span className="text-[18px]" style={{ color: "var(--eco-text)" }}><span style={{ color: "var(--eco-primary)" }}>Eco</span>Split</span>
                    <div className="flex items-center gap-1.5">
                      <div className="flex gap-0.5">
                        {["Рус", "Қаз", "Eng"].map((l) => (
                          <span key={l} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: "var(--eco-surface)", color: "var(--eco-text-tertiary)" }}>{l}</span>
                        ))}
                      </div>
                      <Search size={14} style={{ color: "var(--eco-text-tertiary)" }} />
                      <Menu size={16} style={{ color: "var(--eco-text-tertiary)" }} />
                    </div>
                  </div>
                  <div className="p-2 text-[11px] text-center" style={{ color: "var(--eco-negative)", background: "rgba(239,68,68,0.05)" }}>
                    ⚠ Language pills overflow on small screens
                  </div>
                </div>
              </div>

              {/* After */}
              <div>
                <div className="text-[12px] mb-2" style={{ color: "var(--eco-positive)" }}>AFTER (compact, no overflow)</div>
                <div className="rounded-xl overflow-hidden" style={{ border: "2px solid var(--eco-positive)" }}>
                  <div className="p-3 flex items-center justify-between" style={{ background: "var(--eco-bg)", borderBottom: "1px solid var(--eco-border)" }}>
                    <span className="text-[24px]" style={{ color: "var(--eco-text)", fontWeight: 700 }}><span style={{ color: "var(--eco-primary)" }}>Eco</span>Split</span>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-surface)" }}>
                        <Search size={16} style={{ color: "var(--eco-text-secondary)" }} />
                      </div>
                      <span className="text-[12px] px-2.5 py-1 rounded-md" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>Рус</span>
                      <Menu size={20} style={{ color: "var(--eco-text)" }} />
                    </div>
                  </div>
                  <div className="p-2 text-[11px] text-center" style={{ color: "var(--eco-positive)", background: "rgba(16,185,129,0.05)" }}>
                    ✓ Clean, tappable, no overflow
                  </div>
                </div>
              </div>
            </div>

            {/* Menu Sheet Preview */}
            <div>
              <div className="text-[12px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>MENU SHEET — Language Switcher Inside</div>
              <div className="max-w-[320px] rounded-xl overflow-hidden" style={{ border: "1px solid var(--eco-border)" }}>
                <div className="p-4" style={{ background: "var(--eco-bg)" }}>
                  {/* Language selector */}
                  <div className="pb-3 mb-3" style={{ borderBottom: "1px solid var(--eco-border)" }}>
                    <div className="text-[12px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>Язык</div>
                    <div className="flex gap-2">
                      {([
                        { code: "ru", label: "Рус" },
                        { code: "kz", label: "Қаз" },
                        { code: "en", label: "Eng" },
                      ]).map((l) => (
                        <button
                          key={l.code}
                          className="flex-1 px-3 py-2 rounded-lg text-[13px] transition-colors"
                          style={{
                            background: l.code === "ru" ? "var(--eco-primary)" : "var(--eco-surface)",
                            color: l.code === "ru" ? "#fff" : "var(--eco-text-secondary)",
                          }}
                        >
                          {l.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Nav items */}
                  {["Каталог", "Мои комнаты", "Поддержка", "О нас"].map((item) => (
                    <div key={item} className="px-3 py-2 text-[14px] rounded-lg" style={{ color: "var(--eco-text-secondary)" }}>
                      {item}
                    </div>
                  ))}
                  <div className="mt-3 pt-3 flex gap-2" style={{ borderTop: "1px solid var(--eco-border)" }}>
                    <button className="flex-1 px-3 py-2 rounded-lg text-[13px]" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>Войти</button>
                    <button className="flex-1 px-3 py-2 rounded-lg text-[13px]" style={{ background: "var(--eco-primary)", color: "#fff" }}>Регистрация</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Notes */}
          <div className="rounded-xl p-6" style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}>
            <h3 className="text-[16px] mb-4" style={{ color: "var(--eco-text)" }}>Implementation Checklist</h3>
            <div className="flex flex-col gap-2.5">
              {[
                "Logo enlarged to 28px bold on all breakpoints",
                "Desktop: full LanguageSwitcher component (Рус/Қаз/Eng pills)",
                "Mobile: compact chip shows current language (e.g. \"Рус\")",
                "Mobile menu sheet contains full 3-button language switcher",
                "Search icon button on mobile (no text input in header)",
                "All nav items remain tappable with min 44px touch targets",
                "No header overflow on screens ≥320px wide",
                "Language persists across navigation via React context",
              ].map((note, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: "var(--eco-positive)" }}>
                    <Check size={12} color="#fff" />
                  </div>
                  <span className="text-[14px]" style={{ color: "var(--eco-text-secondary)" }}>{note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
