import { useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import {
  LayoutDashboard, ShieldCheck, Home, Users, MessageSquare,
  Scale, Undo2, FileText, Search, User, ChevronDown, LogOut, Bell
} from "lucide-react";
import { useI18n } from "../i18n-provider";
import { useAuth } from "../auth/auth-provider";

const NAV_ITEMS = [
  { key: "dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
  { key: "moderationQueue", path: "/admin/moderation", icon: ShieldCheck },
  { key: "rooms", path: "/admin/rooms", icon: Home },
  { key: "users", path: "/admin/users", icon: Users },
  { key: "tickets", path: "/admin/tickets", icon: MessageSquare },
  { key: "disputes", path: "/admin/disputes", icon: Scale },
  { key: "refunds", path: "/admin/refunds", icon: Undo2 },
  { key: "adminLogs", path: "/admin/logs", icon: FileText },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate("/admin-login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen" style={{ background: "var(--eco-bg)" }}>
      {/* Sidebar */}
      <aside
        className="w-56 shrink-0 flex flex-col border-r sticky top-0 h-screen"
        style={{ background: "var(--eco-surface-raised)", borderColor: "var(--eco-border)" }}
      >
        {/* Logo */}
        <div className="px-4 py-4 border-b" style={{ borderColor: "var(--eco-border)" }}>
          <Link to="/admin/dashboard" className="text-[20px] tracking-tight" style={{ color: "var(--eco-text)", textDecoration: "none", fontWeight: 700 }}>
            <span style={{ color: "var(--eco-primary)" }}>Eco</span>Pay
          </Link>
          <div className="text-[11px] mt-0.5" style={{ color: "var(--eco-text-tertiary)" }}>{t("adminPortal")}</div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors"
                style={{
                  color: active ? "var(--eco-primary)" : "var(--eco-text-secondary)",
                  background: active ? "var(--eco-brand-50)" : "transparent",
                  textDecoration: "none",
                }}
              >
                <Icon size={16} />
                {t(item.key)}
                {item.key === "moderationQueue" && (
                  <span className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full" style={{ background: "var(--eco-danger-100)", color: "var(--eco-danger-500)" }}>3</span>
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
          className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 border-b"
          style={{ background: "var(--eco-bg)", borderColor: "var(--eco-border)" }}
        >
          {/* Search */}
          <div className="relative flex items-center">
            <Search size={15} className="absolute left-2.5" style={{ color: "var(--eco-text-tertiary)" }} />
            <input
              placeholder={t("adminSearchPlaceholder")}
              className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] outline-none w-72"
              style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)", color: "var(--eco-text)" }}
            />
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="relative p-2 rounded-lg cursor-pointer" style={{ background: "var(--eco-surface)", border: "none" }}>
              <Bell size={16} style={{ color: "var(--eco-text-secondary)" }} />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: "var(--eco-negative)" }} />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: "var(--eco-surface)", border: "1px solid var(--eco-border)" }}
              >
                <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--eco-primary)" }}>
                  <User size={12} style={{ color: "var(--eco-text-on-primary)" }} />
                </div>
                <span className="text-[13px]" style={{ color: "var(--eco-text)" }}>
                  {user?.displayName ?? t("adminRoleLabel")}
                </span>
                <ChevronDown size={13} style={{ color: "var(--eco-text-tertiary)" }} />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                  <div className="absolute right-0 top-10 w-44 rounded-xl p-1 shadow-lg z-50" style={{ background: "var(--eco-bg)", border: "1px solid var(--eco-border)" }}>
                    <div className="px-3 py-2 text-[12px]" style={{ color: "var(--eco-text-tertiary)" }}>
                      {user?.email ?? ""}
                    </div>
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
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
