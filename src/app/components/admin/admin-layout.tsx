import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import {
  Search,
  User,
  ChevronDown,
  LogOut,
  Bell,
  Menu,
  X,
  Home as HomeIcon,
  Users as UsersIcon,
  Inbox as InboxIcon,
} from 'lucide-react';
import { useI18n } from '../i18n-provider';
import { useAuth } from '../auth/auth-provider';
import { BrandLogo } from '../brand-logo';
import {
  adminGlobalSearchRequest,
  ApiError,
  getAdminDashboardKpisRequest,
  type AdminDashboardKpisDto,
  type AdminSearchResponse,
} from '../../lib/api';
import type { FriendlyApiErrorCode } from '../../lib/locale';
import { ADMIN_NAV_ITEMS, defaultLandingForRole, isRoleAllowedFor } from './admin-nav';

function translateSearchError(
  code: FriendlyApiErrorCode | null,
  t: (key: string) => string,
): string | null {
  if (!code) return null;
  switch (code) {
    case 'noAccess':
      return t('noStaffAccessError');
    case 'sessionExpired':
      return t('sessionExpiredError');
    case 'serverError':
      return t('serverErrorTitle');
    case 'network':
      return t('networkError');
    case 'notAvailable':
    case 'generic':
    default:
      return t('errLoadCardFailed');
  }
}

interface AdminGlobalSearchProps {
  variant: 'desktop' | 'mobile';
  onResultPicked?: () => void;
}

function AdminGlobalSearch({ variant, onResultPicked }: AdminGlobalSearchProps) {
  const { t } = useI18n();
  const { authorizedRequest } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<AdminSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorCode, setErrorCode] = useState<FriendlyApiErrorCode | null>(null);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Debounce input в†’ 300ms after typing stops we kick off the search.
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  // Fire the API request when debounced query is long enough.
  useEffect(() => {
    if (debounced.length < 2) {
      setResults(null);
      setErrorCode(null);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setErrorCode(null);
    authorizedRequest((token) =>
      adminGlobalSearchRequest(debounced, token, { signal: controller.signal }),
    )
      .then((data) => {
        if (controller.signal.aborted) return;
        setResults(data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof ApiError) setErrorCode(err.code);
        else setErrorCode('network');
        setResults(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, authorizedRequest]);

  // Outside click closes the dropdown on desktop. The mobile overlay handles
  // its own backdrop.
  useEffect(() => {
    if (variant !== 'desktop') return;
    if (!open) return;
    const handle = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, variant]);

  // Esc closes the panel from anywhere.
  useEffect(() => {
    if (!open) return;
    const handle = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handle);
    return () => document.removeEventListener('keydown', handle);
  }, [open]);

  const totalResults = useMemo(() => {
    if (!results) return 0;
    return results.rooms.length + results.users.length + results.feedback.length;
  }, [results]);

  const handlePick = (path: string) => {
    setOpen(false);
    setQuery('');
    setDebounced('');
    setResults(null);
    navigate(path);
    onResultPicked?.();
  };

  const errorMessage = translateSearchError(errorCode, t);
  const showPanel = open && debounced.length >= 2;
  const showEmpty =
    showPanel && !loading && !errorMessage && results !== null && totalResults === 0;

  const panel = showPanel ? (
    <div
      role="listbox"
      className={
        variant === 'desktop'
          ? 'absolute left-0 right-0 top-full mt-2 z-50 rounded-xl shadow-lg max-h-[60vh] overflow-y-auto'
          : 'rounded-xl max-h-[60vh] overflow-y-auto'
      }
      style={{
        background: 'var(--eco-bg)',
        border: '1px solid var(--eco-border)',
        boxShadow: variant === 'desktop' ? '0 12px 32px rgba(0,0,0,0.10)' : undefined,
      }}
    >
      {loading && (
        <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('adminSearchLoading')}
        </div>
      )}
      {errorMessage && !loading && (
        <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--eco-negative)' }}>
          {errorMessage}
        </div>
      )}
      {showEmpty && (
        <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('adminSearchEmpty')}
        </div>
      )}
      {!loading && !errorMessage && results && results.rooms.length > 0 && (
        <SearchGroup title={t('adminSearchGroupRooms')} icon={HomeIcon}>
          {results.rooms.map((r) => (
            <SearchResultRow
              key={`room-${r.id}`}
              primary={r.title || `R-${r.id}`}
              secondary={
                [r.serviceName, r.ownerDisplayName, r.status].filter(Boolean).join(' В· ') ||
                `R-${r.id}`
              }
              onClick={() => handlePick(`/admin/rooms?selected=${r.id}`)}
            />
          ))}
        </SearchGroup>
      )}
      {!loading && !errorMessage && results && results.users.length > 0 && (
        <SearchGroup title={t('adminSearchGroupUsers')} icon={UsersIcon}>
          {results.users.map((u) => (
            <SearchResultRow
              key={`user-${u.id}`}
              primary={u.displayName || u.email || `U-${u.id}`}
              secondary={[u.email, u.role, u.status].filter(Boolean).join(' В· ') || `U-${u.id}`}
              onClick={() => handlePick(`/admin/users?selected=${u.id}`)}
            />
          ))}
        </SearchGroup>
      )}
      {!loading && !errorMessage && results && results.feedback.length > 0 && (
        <SearchGroup title={t('adminSearchGroupFeedback')} icon={InboxIcon}>
          {results.feedback.map((f) => (
            <SearchResultRow
              key={`feedback-${f.id}`}
              primary={f.subject || f.message.slice(0, 60) || `F-${f.id}`}
              secondary={[f.type, f.status].filter(Boolean).join(' В· ') || `F-${f.id}`}
              onClick={() => handlePick(`/admin/feedback?selected=${f.id}`)}
            />
          ))}
        </SearchGroup>
      )}
    </div>
  ) : null;

  if (variant === 'desktop') {
    return (
      <div ref={containerRef} className="relative hidden md:flex items-center min-w-0 w-56 lg:w-72">
        <Search
          size={15}
          className="absolute left-2.5 pointer-events-none"
          style={{ color: 'var(--eco-text-tertiary)' }}
        />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={t('adminSearchPlaceholder')}
          aria-label={t('adminSearchPlaceholder')}
          className="pl-8 pr-3 py-1.5 rounded-lg text-[13px] outline-none w-full"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        />
        {panel}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--eco-text-tertiary)' }}
        />
        <input
          ref={inputRef}
          autoFocus
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={t('adminSearchPlaceholder')}
          aria-label={t('adminSearchPlaceholder')}
          className="pl-8 pr-3 py-2 rounded-lg text-[14px] outline-none w-full"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        />
      </div>
      {panel}
    </div>
  );
}

function SearchGroup({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Search;
  children: ReactNode;
}) {
  return (
    <div className="border-b last:border-b-0" style={{ borderColor: 'var(--eco-border)' }}>
      <div
        className="flex items-center gap-1.5 px-4 pt-3 pb-1 text-[11px] uppercase tracking-wide"
        style={{ color: 'var(--eco-text-tertiary)' }}
      >
        <Icon size={12} /> {title}
      </div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SearchResultRow({
  primary,
  secondary,
  onClick,
}: {
  primary: string;
  secondary: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      role="option"
      className="text-left px-4 py-2.5 cursor-pointer transition-colors hover:bg-[var(--eco-surface)]"
      style={{ background: 'transparent', border: 'none' }}
    >
      <div className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
        {primary}
      </div>
      <div className="text-[11px] truncate" style={{ color: 'var(--eco-text-tertiary)' }}>
        {secondary}
      </div>
    </button>
  );
}

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, logout, authorizedRequest } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [kpis, setKpis] = useState<AdminDashboardKpisDto | null>(null);

  const role = user?.role;

  // KPI badges are admin-only data; SUPPORT must not hit the ADMIN-only endpoint.
  useEffect(() => {
    if (role !== 'ADMIN') {
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
        // Silently ignore вЂ” badges are nice-to-have and shouldn't surface as toasts here.
        if (!(err instanceof ApiError)) {
          // network errors etc вЂ” drop
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
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    try {
      await logout();
    } finally {
      navigate('/admin-login', { replace: true });
    }
  };

  const navItems = ADMIN_NAV_ITEMS.filter((item) => isRoleAllowedFor(item, role));

  const landingPath = defaultLandingForRole(role);

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--eco-bg)' }}>
      {/* Mobile drawer backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar вЂ” fixed/drawer on mobile, sticky column on lg+ */}
      <aside
        className={`fixed lg:sticky inset-y-0 left-0 z-50 lg:z-auto w-64 lg:w-56 shrink-0 flex flex-col border-r h-screen lg:top-0 transform transition-transform duration-200 lg:transform-none ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ background: 'var(--eco-surface-raised)', borderColor: 'var(--eco-border)' }}
      >
        {/* Logo + mobile close */}
        <div
          className="px-4 py-4 border-b flex items-center justify-between gap-2"
          style={{ borderColor: 'var(--eco-border)' }}
        >
          <BrandLogo to={landingPath} size="sm" sublabel={t('adminPortal')} />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg cursor-pointer"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--eco-text-secondary)',
            }}
            aria-label={t('closeMenu')}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const active =
              location.pathname === item.path || location.pathname.startsWith(item.path + '/');
            const Icon = item.icon;
            const badgeValue = item.badgeKpi && kpis ? Number(kpis[item.badgeKpi] ?? 0) : 0;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors"
                style={{
                  color: active ? 'var(--eco-primary)' : 'var(--eco-text-secondary)',
                  background: active ? 'var(--eco-brand-50)' : 'transparent',
                  textDecoration: 'none',
                }}
              >
                <Icon size={16} />
                {t(item.labelKey)}
                {badgeValue > 0 && (
                  <span
                    className="ml-auto text-[11px] px-1.5 py-0.5 rounded-full"
                    style={{ background: 'var(--eco-danger-100)', color: 'var(--eco-danger-500)' }}
                  >
                    {badgeValue}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div
          className="px-3 py-3 border-t text-[12px]"
          style={{ borderColor: 'var(--eco-border)', color: 'var(--eco-text-tertiary)' }}
        >
          v1.0.0
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center justify-between gap-2 px-4 lg:px-6 py-3 border-b"
          style={{ background: 'var(--eco-bg)', borderColor: 'var(--eco-border)' }}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Hamburger вЂ” mobile/tablet only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg cursor-pointer shrink-0"
              style={{
                background: 'var(--eco-surface)',
                border: 'none',
                color: 'var(--eco-text-secondary)',
              }}
              aria-label={t('openMenu')}
            >
              <Menu size={18} />
            </button>

            {/* Search вЂ” icon button on mobile (opens overlay), full input on md+. */}
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden p-2 rounded-lg shrink-0 cursor-pointer"
              style={{
                background: 'var(--eco-surface)',
                border: 'none',
                color: 'var(--eco-text-secondary)',
              }}
              aria-label={t('adminSearchPlaceholder')}
              title={t('adminSearchPlaceholder')}
            >
              <Search size={16} />
            </button>
            <AdminGlobalSearch variant="desktop" />
          </div>

          <div className="flex items-center gap-2 lg:gap-3 shrink-0">
            {/* Notifications: no fake red dot вЂ” surfaced only via real data later */}
            <button
              className="relative p-2 rounded-lg cursor-pointer"
              style={{ background: 'var(--eco-surface)', border: 'none' }}
              aria-label={t('notifications')}
              title={t('noNewNotifications')}
            >
              <Bell size={16} style={{ color: 'var(--eco-text-secondary)' }} />
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg cursor-pointer"
                style={{ background: 'var(--eco-surface)', border: '1px solid var(--eco-border)' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--eco-primary)' }}
                >
                  <User size={12} style={{ color: 'var(--eco-text-on-primary)' }} />
                </div>
                <span
                  className="hidden sm:inline text-[13px] truncate max-w-[140px]"
                  style={{ color: 'var(--eco-text)' }}
                >
                  {user?.displayName ?? t('adminRoleLabel')}
                </span>
                <ChevronDown size={13} style={{ color: 'var(--eco-text-tertiary)' }} />
              </button>
              {profileOpen && (
                <>
                  <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                  <div
                    className="absolute right-0 top-10 w-48 rounded-xl p-1 shadow-lg z-50"
                    style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
                  >
                    <div
                      className="px-3 py-2 text-[12px]"
                      style={{ color: 'var(--eco-text-tertiary)' }}
                    >
                      {user?.email ?? ''}
                    </div>
                    {role && (
                      <div
                        className="px-3 pb-2 text-[11px]"
                        style={{ color: 'var(--eco-text-tertiary)' }}
                      >
                        {role}
                      </div>
                    )}
                    <div className="border-t my-1" style={{ borderColor: 'var(--eco-border)' }} />
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        void handleSignOut();
                      }}
                      className="flex w-full items-center gap-2 px-3 py-2 rounded-lg text-[13px] cursor-pointer"
                      style={{
                        color: 'var(--eco-negative)',
                        background: 'transparent',
                        border: 'none',
                        textAlign: 'left',
                      }}
                    >
                      <LogOut size={13} /> {t('signOut')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      {/* Mobile search overlay вЂ” full-width sheet anchored to the top so it
          stays usable inside the on-screen keyboard layout. */}
      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-[60] md:hidden flex flex-col"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => setMobileSearchOpen(false)}
        >
          <div
            className="m-3 mt-4 p-3 rounded-2xl shadow-xl"
            style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('adminSearchPlaceholder')}
              </div>
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                className="p-1 rounded-md cursor-pointer"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--eco-text-secondary)',
                }}
                aria-label={t('close')}
              >
                <X size={16} />
              </button>
            </div>
            <AdminGlobalSearch variant="mobile" onResultPicked={() => setMobileSearchOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

