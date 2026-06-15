import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  Search, User, ChevronDown, LogOut, Bell, Menu, X,
} from "lucide-react";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";
import { BrandLogo } from "../brand-logo";
import { ApiError, getAdminDashboardKpisRequest, type AdminDashboardKpisDto } from "../../lib/api";
import { ADMIN_NAV_ITEMS, defaultLandingForRole, isRoleAllowedFor } from "./admin-nav";

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, logout, authorizedRequest } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kpis, setKpis] = useState<AdminDashboardKpisDto | null>(null);

  const role = user?.role;

  // KPI badges are admin-only data; SUPPORT must not hit the ADMIN-only endpoint.
  useEffect(() => {
    if (role !== "ADMIN") {
      setKpis(null);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const data = await authorizedRequest((token) => getAdminDashboardKpisRequest(token));
        if (!cancelled) setKpis(data);
      } catch (err) {
        if (cancelled) return;
        // Silently ignore — badges are nice-to-have and shouldn't surface as toasts here.
        if (!(err instanceof ApiError)) {
          // network errors etc — drop
        }
        setKpis(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [role, authorizedRequest]);

  // Auto-close mobile drawer on route change so navigating from the drawer
  // doesn't leave it hovering over the new page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate("/admin-login", { replace: true });
    }
  };

  const navItems = ADMIN_NAV_ITEMS.filter((item) => isRoleAllowedFor(item, role));

  const landingPath = defaultLandingForRole(role);

  return (
    <div className="flex min-h-screen" style={{ background: "var(--eco-bg)" }}>
      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar — fixed/drawer on mobile, sticky column on lg+ */}
      <aside
        className={`fixed lg:sticky inset-y-0 left-0 z-50 lg:z-auto w-64 lg:w-56 shrink-0 flex flex-col border-r h-screen lg:top-0 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ background: "var(--eco-surface-raised)", borderColor: "var(--eco-border)" }}
      >
        {/* Logo + mobile close */}
        <div
          className="px-4 py-4 border-b flex items-center justify-between gap-2"
          style={{ borderColor: "var(--eco-border)" }}
        >
          <BrandLogo to={landingPath} size="sm" sublabel={t("adminPortal")} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg cursor-pointer"
            style={{ background: "transparent", border: "none", color: "var(--eco-text-secondary)" }}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
            const Icon = item.icon;
            const badgeValue = item.badgeKpi && kpis ? Number(kpis[item.badgeKpi] ?? 0) : 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors"
                style={{
                  color: active ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                  background: active ? "var(--eco-brand-50)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={16} />
                {t(item.labelKey)}
                {badgeValue > 0 && (
                  <span
                    className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}
                  >
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t text-[12px]" style={{ borderColor: "var(--eco-border)", color: "var(--eco-text-tertiary)" }}>
          v1.0.0 · Apex Digital
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 lg:px-6 py-3 border-b"
          style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Hamburger — mobile/tablet only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg cursor-pointer shrink-0"
              style={{ background: "var(--eco-surface)", border: "none", color: "var(--eco-text-secondary)" }}
              aria-label="Open menu"
            >
              <Menu size={18} />
            </button>

            {/* Search — icon-only on mobile, full input on md+. Disabled placeholder
                for now; per-section search lives on each list page. */}
            <button
              className="md:hidden p-2 rounded-lg shrink-0"
              style={{ background: "var(--eco-surface)", border: "none", color: "var(--eco-text-tertiary)", cursor: "not-allowed", opacity: 0.6 }}
              disabled
              aria-disabled
              aria-label={t("adminSearchPlaceholder")}
              title={t("adminSearchPlaceholder")}
            >
              <Search size={16} />
            </button>
            <div className="relative hidden md:flex items-center min-w-0" title={t("adminSearchPlaceholder")}>
              <Search size={15} className="absolute left-2.5" style={{ color: "var(--eco-text-tertiary)" }} />
              <input
                placeholder={t("adminSearchPlaceholder")}
                className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] outline-none w-56 lg:w-72"
                style={{
                  background: "var(--eco-surface)",
                  border: "1px solid var(--eco-border)",
                  color: "var(--eco-text-tertiary)",
                  cursor: "not-allowed",
                  opacity: 0.6,
                }}
                disabled
                aria-disabled
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Notifications: no fake red dot — surfaced only via real data later */}
            <button
              className="relative p-2 rounded-lg cursor-pointer"
              style={{ background: "var(--eco-surface)", border: "none" }}
              aria-label={t("notifications")}
              title={t("noNewNotifications")}
            >
              <Bell size={16} style={{ color: "var(--eco-text-secondary)" }} />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: "var(--eco-primary)" }}>
                  <User size={12} style={{ color: "var(--eco-text-on-primary)" }} />
                </div>
                <span className="hidden sm:inline text-[13px] truncate max-w-[140px]" style={{ color: "var(--eco-text)" }}>
                  {user?.displayName ?? t("adminRoleLabel")}
                </span>
                <ChevronDown size={13} style={{ color: "var(--eco-text-tertiary)" }} />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-10 w-48 rounded-xl p-1 shadow-lg z-50" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                    <div className="px-3 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                      {user?.email ?? ""}
                    </div>
                    {role && (
                      <div className="px-3 pb-2 text-[11px]" style={{ color: "var(--eco-text-tertiary)" }}>
                        {role}
                      </div>
                    )}
                    <div className="border-t my-1" style={{ borderColor: "var(--eco-border)" }} />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        void handleSignOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[13px] cursor-pointer"
                      style={{ color: "var(--eco-negative)", background: "transparent", border: "none", textAlign: "left" }}
                    >
                      <LogOut size={13} /> {t("signOut")}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
