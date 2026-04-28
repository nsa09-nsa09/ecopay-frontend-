import { useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router";
import { Button, LanguageSwitcher, WaveDivider } from "./ds-primitives";
import { User, Menu, X, Search } from "lucide-react";
import { useI18n } from "./i18n-provider";
import { useAuth } from "../../lib/auth/AuthContext";

export function AppLayout() {
  const { language, setLanguage, t } = useI18n();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, logout, role } = useAuth();
  const isLoggedIn = isAuthenticated;

  async function handleSignOut() {
    setProfileOpen(false);
    setMobileMenu(false);
    await logout();
    navigate("/login", { replace: true });
  }

  const navItems = [
    { label: t("catalog"), path: "/" },
    { label: t("myRooms"), path: "/rooms" },
    { label: t("support"), path: "/support" },
    { label: t("aboutUs"), path: "/about" },
  ];
  
  const languageLabels = {
    ru: "Рус",
    kz: "Қаз",
    en: "Eng",
  };

  return (
    <div style={{ background: "var(--eco-bg)", color: "var(--eco-text)", minHeight: "100vh" }}>
      {/* Top Nav */}
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link to="/" className="text-[28px] tracking-tight shrink-0" style={{ color: "var(--eco-text)", textDecoration: "none", fontWeight: 700 }}>
              <span style={{ color: "var(--eco-primary)" }}>Eco</span>Pay
            </Link>
            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((n) => (
                <Link
                  key={n.path}
                  to={n.path}
                  className="px-3 py-1.5 rounded-lg text-[13px] transition-colors"
                  style={{
                    color: location.pathname === n.path ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                    background: location.pathname === n.path ? "var(--eco-brand-50)" : "transparent",
                    textDecoration: "none",
                  }}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search (desktop) */}
            <div className="hidden md:flex items-center relative">
              <Search size={15} className="absolute left-2.5" style={{ color: "var(--eco-text-tertiary)" }} />
              <input
                placeholder={t("searchPlans")}
                className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] outline-none w-48"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
              />
            </div>
            
            {/* Search icon (mobile) */}
            <button className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--eco-surface)" }}>
              <Search size={16} style={{ color: "var(--eco-text-secondary)" }} />
            </button>

            {/* Desktop language switcher */}
            <div className="hidden md:block">
              <LanguageSwitcher value={language} onChange={(v) => setLanguage(v as "ru" | "kz" | "en")} />
            </div>
            
            {/* Mobile: Show current language chip */}
            <div className="md:hidden px-2.5 py-1 rounded-md text-[12px] font-medium" style={{ background: "var(--eco-surface)", color: "var(--eco-text-secondary)" }}>
              {languageLabels[language]}
            </div>

            {isLoggedIn ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
                >
                  <User size={16} style={{ color: "var(--eco-text-secondary)" }} />
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                    <div
                      className="absolute right-0 top-10 w-48 rounded-xl p-1 shadow-lg z-50"
                      style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}
                    >
                      {[
                        { label: t("profile"), path: "/profile" },
                        { label: t("myRooms"), path: "/rooms" },
                        { label: t("support"), path: "/support" },
                      ].map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setProfileOpen(false)}
                          className="block px-3 py-2 rounded-lg text-[13px] transition-colors hover:opacity-80"
                          style={{ color: "var(--eco-text-secondary)", textDecoration: "none" }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      {(role === "ADMIN" || role === "STAFF") && (
                        <Link
                          to="/admin/dashboard"
                          onClick={() => setProfileOpen(false)}
                          className="block px-3 py-2 rounded-lg text-[13px]"
                          style={{ color: "var(--eco-text-secondary)", textDecoration: "none" }}
                        >
                          Admin
                        </Link>
                      )}
                      <div className="border-t my-1" style={{ borderColor: "var(--eco-border)" }} />
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-3 py-2 rounded-lg text-[13px] cursor-pointer"
                        style={{ color: "var(--eco-negative)", background: "transparent", border: 0 }}
                      >
                        {t("signOut")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" style={{ textDecoration: "none" }}>
                  <Button variant="ghost" size="sm">{t("signIn")}</Button>
                </Link>
                <Link to="/register" style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="sm">{t("signUp")}</Button>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden cursor-pointer p-1"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? <X size={20} style={{ color: "var(--eco-text)" }} /> : <Menu size={20} style={{ color: "var(--eco-text)" }} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenu && (
          <div className="md:hidden border-t px-6 py-4 flex flex-col gap-3" style={{ borderColor: "var(--eco-border)" }}>
            {/* Language Selector */}
            <div className="pb-3 border-b" style={{ borderColor: "var(--eco-border)" }}>
              <div className="text-[12px] mb-2" style={{ color: "var(--eco-text-tertiary)" }}>{t("language")}</div>
              <div className="flex gap-2">
                {(["ru", "kz", "en"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                    style={{
                      background: language === lang ? "var(--eco-primary)" : "var(--eco-surface)",
                      color: language === lang ? "#fff" : "var(--eco-text-secondary)",
                    }}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Nav Items */}
            {navItems.map((n) => (
              <Link
                key={n.path}
                to={n.path}
                onClick={() => setMobileMenu(false)}
                className="px-3 py-2 rounded-lg text-[14px]"
                style={{
                  color: location.pathname === n.path ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                  textDecoration: "none",
                }}
              >
                {n.label}
              </Link>
            ))}
            
            {isLoggedIn ? (
              <>
                <div className="border-t pt-3" style={{ borderColor: "var(--eco-border)" }}>
                  <Link to="/profile" onClick={() => setMobileMenu(false)} className="block px-3 py-2 rounded-lg text-[14px]" style={{ color: "var(--eco-text-secondary)", textDecoration: "none" }}>
                    {t("profile")}
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="block w-full text-left px-3 py-2 rounded-lg text-[14px] mt-1 cursor-pointer"
                    style={{ color: "var(--eco-negative)", background: "transparent", border: 0 }}
                  >
                    {t("signOut")}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex gap-2 pt-2 border-t" style={{ borderColor: "var(--eco-border)" }}>
                <Link to="/login" onClick={() => setMobileMenu(false)} className="flex-1" style={{ textDecoration: "none" }}>
                  <Button variant="ghost" size="sm" className="w-full">{t("signIn")}</Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenu(false)} className="flex-1" style={{ textDecoration: "none" }}>
                  <Button variant="primary" size="sm" className="w-full">{t("signUp")}</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <WaveDivider />
      <footer style={{ background: "var(--eco-surface)" }} className="py-12 px-6">
        <div className="max-w-[1200px] mx-auto">
          {/* Desktop: 3 columns */}
          <div className="hidden md:grid md:grid-cols-3 gap-8 mb-8">
            {/* Product */}
            <div>
              <h4 className="text-[14px] mb-3" style={{ color: "var(--eco-text)" }}>{t("product")}</h4>
              <div className="flex flex-col gap-2">
                {[
                  { id: "f-catalog", label: t("catalog"), path: "/" },
                  { id: "f-how", label: t("howItWorks"), path: "/how-it-works" },
                  { id: "f-pricing", label: t("pricing"), path: "#" },
                  { id: "f-faq", label: t("faq"), path: "#" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px] hover:opacity-70 transition-opacity"
                    style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[14px] mb-3" style={{ color: "var(--eco-text)" }}>{t("company")}</h4>
              <div className="flex flex-col gap-2">
                {[
                  { id: "f-about", label: t("about"), path: "/about" },
                  { id: "f-terms", label: t("terms"), path: "/terms" },
                  { id: "f-privacy", label: t("privacy"), path: "/privacy" },
                  { id: "f-owners", label: t("forOwners"), path: "/admin-login" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px] hover:opacity-70 transition-opacity"
                    style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[14px] mb-3" style={{ color: "var(--eco-text)" }}>{t("support")}</h4>
              <div className="flex flex-col gap-2">
                {[
                  { id: "f-ticket", label: t("createTicket"), path: "/support/new" },
                  { id: "f-status", label: t("ticketStatus"), path: "#" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px] hover:opacity-70 transition-opacity"
                    style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile: Accordion (simple stacked for now) */}
          <div className="md:hidden flex flex-col gap-4 mb-8">
            <div>
              <h4 className="text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("product")}</h4>
              <div className="flex flex-col gap-1.5 pl-3">
                {[
                  { id: "m-catalog", label: t("catalog"), path: "/" },
                  { id: "m-how", label: t("howItWorks"), path: "/how-it-works" },
                  { id: "m-pricing", label: t("pricing"), path: "#" },
                  { id: "m-faq", label: t("faq"), path: "#" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px]"
                    style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("company")}</h4>
              <div className="flex flex-col gap-1.5 pl-3">
                {[
                  { id: "m-about", label: t("about"), path: "/about" },
                  { id: "m-terms", label: t("terms"), path: "/terms" },
                  { id: "m-privacy", label: t("privacy"), path: "/privacy" },
                  { id: "m-owners", label: t("forOwners"), path: "/admin-login" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px]"
                    style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[14px] mb-2" style={{ color: "var(--eco-text)" }}>{t("support")}</h4>
              <div className="flex flex-col gap-1.5 pl-3">
                {[
                  { id: "m-ticket", label: t("createTicket"), path: "/support/new" },
                  { id: "m-status", label: t("ticketStatus"), path: "#" },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px]"
                    style={{ color: "var(--eco-text-tertiary)", textDecoration: "none" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderColor: "var(--eco-border)" }}>
            <span className="text-[13px]" style={{ color: "var(--eco-text-tertiary)" }}>
              {t("copyright")}
            </span>
            <div className="flex items-center gap-4 text-[13px]">
              <span style={{ color: "var(--eco-text-tertiary)" }}>{t("developedBy")}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}