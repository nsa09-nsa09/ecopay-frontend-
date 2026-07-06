import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router';
import { Button, LanguageSwitcher, WaveDivider } from './ds-primitives';
import { BrandLogo } from './brand-logo';
import { Menu, X, Search } from 'lucide-react';
import { useI18n } from './i18n-provider';
import { useAuth } from './auth/auth-provider';
import { ApiError, searchCatalog, trackVisitRequest, type CatalogSearchHit } from '../lib/api';

interface CatalogSearchBoxProps {
  variant: 'desktop' | 'mobile';
  onPicked?: () => void;
  autoFocus?: boolean;
}

function CatalogSearchBox({ variant, onPicked, autoFocus }: CatalogSearchBoxProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [results, setResults] = useState<CatalogSearchHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [open, setOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(query.trim()), 300);
    return () => window.clearTimeout(id);
  }, [query]);

  useEffect(() => {
    if (debounced.length < 2) {
      setResults(null);
      setHasError(false);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setHasError(false);
    searchCatalog(debounced, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        setResults(data ?? []);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        // Swallow raw server messages; show a quiet "no results" instead.
        if (err instanceof ApiError) {
          setHasError(true);
        } else {
          setHasError(true);
        }
        setResults(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced]);

  // Outside click closes dropdown on desktop.
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

  // Esc closes the dropdown from anywhere.
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

  const handlePick = (hit: CatalogSearchHit) => {
    setOpen(false);
    setQuery('');
    setDebounced('');
    setResults(null);
    navigate(`/browse?service=${encodeURIComponent(hit.serviceId)}`);
    onPicked?.();
  };

  const showPanel = open && debounced.length >= 2;
  const empty = showPanel && !loading && results !== null && results.length === 0;

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
          {t('navbarSearchLoading')}
        </div>
      )}
      {!loading && (empty || hasError) && (
        <div className="px-4 py-3 text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
          {t('navbarSearchEmpty')}
        </div>
      )}
      {!loading && results && results.length > 0 && (
        <div className="flex flex-col">
          {results.map((hit) => (
            <button
              key={`hit-${hit.serviceId}`}
              type="button"
              onClick={() => handlePick(hit)}
              className="flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer transition-colors hover:bg-[var(--eco-surface)]"
              style={{ background: 'transparent', border: 'none' }}
              role="option"
            >
              {hit.logoUrl ? (
                <img
                  src={hit.logoUrl}
                  alt=""
                  width={28}
                  height={28}
                  loading="lazy"
                  decoding="async"
                  className="rounded-lg shrink-0 object-cover"
                  style={{ background: 'var(--eco-surface)' }}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-[12px] shrink-0"
                  style={{
                    background: 'var(--eco-brand-50)',
                    color: 'var(--eco-primary)',
                    fontWeight: 700,
                  }}
                >
                  {(hit.name?.charAt(0) ?? '?').toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[13px] truncate" style={{ color: 'var(--eco-text)' }}>
                  {hit.name}
                </div>
                <div className="text-[11px] truncate" style={{ color: 'var(--eco-text-tertiary)' }}>
                  {hit.categoryName}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  ) : null;

  if (variant === 'desktop') {
    return (
      <div ref={containerRef} className="relative hidden md:flex items-center w-56">
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
          placeholder={t('navbarSearchPlaceholder')}
          aria-label={t('navbarSearchPlaceholder')}
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
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          placeholder={t('navbarSearchPlaceholder')}
          aria-label={t('navbarSearchPlaceholder')}
          className="pl-8 pr-3 py-2 rounded-lg text-[14px] outline-none w-full"
          style={{
            background: 'var(--eco-surface)',
            border: '1px solid var(--eco-border)',
            color: 'var(--eco-text)',
          }}
        />
      </div>
      {open ? panel : null}
    </div>
  );
}

export function AppLayout() {
  const { language, setLanguage, t } = useI18n();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const location = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  // Fire-and-forget analytics ping for every route change. The backend
  // sets a cookie to dedupe unique guests; we just keep the client side
  // cheap and noiseless. We track per pathname (not search/hash) and skip
  // duplicates so React StrictMode double-render in dev doesn't spam.
  useEffect(() => {
    const path = location.pathname;
    if (lastTrackedPath.current === path) return;
    lastTrackedPath.current = path;
    void trackVisitRequest(path).catch(() => {
      // Swallow — analytics must never break the UI.
    });
  }, [location.pathname]);

  // Auto-close the mobile search overlay on navigation.
  useEffect(() => {
    setMobileSearchOpen(false);
    setMobileMenu(false);
  }, [location.pathname]);

  const isAuthRoute =
    location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/register') ||
    location.pathname.startsWith('/forgot') ||
    location.pathname.startsWith('/reset-password');

  const initials = (user?.displayName ?? 'ES')
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .join('')
    .slice(0, 2);

  // /rooms is gated by auth — hide the entry for guests so they don't land on
  // the empty-state screen by accident. /browse is decommissioned; room
  // discovery now happens via service-match on the catalog tiles.
  const navItems = useMemo(() => {
    const items: { label: string; path: string }[] = [
      { label: t('catalog'), path: '/' },
      { label: t('news'), path: '/news' },
    ];
    if (isAuthenticated) {
      items.push({ label: t('myRooms'), path: '/rooms' });
    }
    items.push({ label: t('support'), path: '/support' });
    items.push({ label: t('aboutUs'), path: '/about' });
    return items;
  }, [t, isAuthenticated]);

  const languageLabels = {
    ru: 'Рус',
    kz: 'Қаз',
    en: 'Eng',
  };

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    setMobileMenu(false);
    navigate('/');
  };

  return (
    <div style={{ background: 'var(--eco-bg)', color: 'var(--eco-text)', minHeight: '100vh' }}>
      <nav
        className="sticky top-0 z-40 border-b"
        style={{ background: 'var(--eco-bg)', borderColor: 'var(--eco-border)' }}
      >
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 sm:gap-6 h-16">
          <div className="flex items-center gap-4 lg:gap-8 min-w-0">
            <BrandLogo to="/" size="md" className="shrink-0" />
            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="px-3.5 py-1.5 rounded-lg text-[14px] whitespace-nowrap transition-colors"
                  style={{
                    color:
                      location.pathname === item.path
                        ? 'var(--eco-primary)'
                        : 'var(--eco-text-secondary)',
                    background:
                      location.pathname === item.path ? 'var(--eco-brand-50)' : 'transparent',
                    textDecoration: 'none',
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <CatalogSearchBox variant="desktop" />

            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              className="md:hidden w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer"
              style={{ background: 'var(--eco-surface)', border: 'none' }}
              aria-label={t('navbarSearchPlaceholder')}
            >
              <Search size={16} style={{ color: 'var(--eco-text-secondary)' }} />
            </button>

            <div className="hidden md:block">
              <LanguageSwitcher
                value={language}
                onChange={(value) => setLanguage(value as 'ru' | 'kz' | 'en')}
              />
            </div>

            <div
              className="md:hidden px-2.5 py-1 rounded-md text-[12px] font-medium"
              style={{ background: 'var(--eco-surface)', color: 'var(--eco-text-secondary)' }}
            >
              {languageLabels[language]}
            </div>

            {isAuthenticated && !isAuthRoute ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
                  style={{
                    background: 'var(--eco-surface)',
                    border: '1px solid var(--eco-border)',
                  }}
                >
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.displayName}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-[12px]" style={{ color: 'var(--eco-text-secondary)' }}>
                      {initials}
                    </span>
                  )}
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0" onClick={() => setProfileOpen(false)} />
                    <div
                      className="absolute right-0 top-10 w-56 rounded-xl p-1 shadow-lg z-50"
                      style={{ background: 'var(--eco-bg)', border: '1px solid var(--eco-border)' }}
                    >
                      <div className="px-3 py-2">
                        <div className="text-[13px]" style={{ color: 'var(--eco-text)' }}>
                          {user?.displayName}
                        </div>
                        <div className="text-[11px]" style={{ color: 'var(--eco-text-tertiary)' }}>
                          {user?.email}
                        </div>
                      </div>
                      <div className="border-t my-1" style={{ borderColor: 'var(--eco-border)' }} />
                      {[
                        { label: t('profile'), path: '/profile' },
                        { label: t('myRooms'), path: '/rooms' },
                        { label: t('support'), path: '/support' },
                      ].map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={() => setProfileOpen(false)}
                          className="block px-3 py-2 rounded-lg text-[13px] transition-colors hover:opacity-80"
                          style={{ color: 'var(--eco-text-secondary)', textDecoration: 'none' }}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <div className="border-t my-1" style={{ borderColor: 'var(--eco-border)' }} />
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="block w-full text-left px-3 py-2 rounded-lg text-[13px] cursor-pointer"
                        style={{ color: 'var(--eco-negative)', background: 'transparent' }}
                      >
                        {t('signOut')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login" style={{ textDecoration: 'none' }}>
                  <Button variant="ghost" size="sm">
                    {t('signIn')}
                  </Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                  <Button variant="primary" size="sm">
                    {t('signUp')}
                  </Button>
                </Link>
              </div>
            )}

            <button
              className="md:hidden cursor-pointer p-1"
              onClick={() => setMobileMenu(!mobileMenu)}
            >
              {mobileMenu ? (
                <X size={20} style={{ color: 'var(--eco-text)' }} />
              ) : (
                <Menu size={20} style={{ color: 'var(--eco-text)' }} />
              )}
            </button>
          </div>
        </div>

        {mobileMenu && (
          <div
            className="md:hidden border-t px-4 sm:px-6 py-4 flex flex-col gap-3"
            style={{ borderColor: 'var(--eco-border)' }}
          >
            <div className="pb-3 border-b" style={{ borderColor: 'var(--eco-border)' }}>
              <div className="text-[12px] mb-2" style={{ color: 'var(--eco-text-tertiary)' }}>
                {t('language')}
              </div>
              <div className="flex gap-2">
                {(['ru', 'kz', 'en'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className="flex-1 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors"
                    style={{
                      background: language === lang ? 'var(--eco-primary)' : 'var(--eco-surface)',
                      color: language === lang ? '#fff' : 'var(--eco-text-secondary)',
                    }}
                  >
                    {languageLabels[lang]}
                  </button>
                ))}
              </div>
            </div>

            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenu(false)}
                className="px-3 py-2 rounded-lg text-[14px]"
                style={{
                  color:
                    location.pathname === item.path
                      ? 'var(--eco-primary)'
                      : 'var(--eco-text-secondary)',
                  textDecoration: 'none',
                }}
              >
                {item.label}
              </Link>
            ))}

            {isAuthenticated && !isAuthRoute ? (
              <div className="border-t pt-3" style={{ borderColor: 'var(--eco-border)' }}>
                <Link
                  to="/profile"
                  onClick={() => setMobileMenu(false)}
                  className="block px-3 py-2 rounded-lg text-[14px]"
                  style={{ color: 'var(--eco-text-secondary)', textDecoration: 'none' }}
                >
                  {t('profile')}
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 rounded-lg text-[14px] mt-1 cursor-pointer"
                  style={{ color: 'var(--eco-negative)', background: 'transparent' }}
                >
                  {t('signOut')}
                </button>
              </div>
            ) : (
              <div
                className="flex gap-2 pt-2 border-t"
                style={{ borderColor: 'var(--eco-border)' }}
              >
                <Link
                  to="/login"
                  onClick={() => setMobileMenu(false)}
                  className="flex-1"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="ghost" size="sm" className="w-full">
                    {t('signIn')}
                  </Button>
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenu(false)}
                  className="flex-1"
                  style={{ textDecoration: 'none' }}
                >
                  <Button variant="primary" size="sm" className="w-full">
                    {t('signUp')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile search overlay — sheet anchored to the top so it remains
          usable inside the on-screen keyboard. */}
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
                {t('navbarSearchPlaceholder')}
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
                aria-label={t('navbarSearchClose')}
              >
                <X size={16} />
              </button>
            </div>
            <CatalogSearchBox
              variant="mobile"
              autoFocus
              onPicked={() => setMobileSearchOpen(false)}
            />
          </div>
        </div>
      )}

      <main>
        <Outlet />
      </main>

      <WaveDivider />
      <footer style={{ background: 'var(--eco-surface)' }} className="py-10 sm:py-12 px-4 sm:px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="mb-8">
            <BrandLogo to="/" size="sm" />
          </div>
          <div className="hidden md:grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="text-[14px] mb-3" style={{ color: 'var(--eco-text)' }}>
                {t('product')}
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'f-catalog', label: t('catalog'), path: '/' },
                  { id: 'f-how', label: t('howItWorks'), path: '/how-it-works' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px] hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[14px] mb-3" style={{ color: 'var(--eco-text)' }}>
                {t('company')}
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'f-about', label: t('about'), path: '/about' },
                  { id: 'f-terms', label: t('terms'), path: '/terms' },
                  { id: 'f-privacy', label: t('privacy'), path: '/privacy' },
                  { id: 'f-owners', label: t('forOwners'), path: '/admin-login' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px] hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[14px] mb-3" style={{ color: 'var(--eco-text)' }}>
                {t('support')}
              </h4>
              <div className="flex flex-col gap-2">
                {[
                  { id: 'f-ticket', label: t('createTicket'), path: '/support/new' },
                  { id: 'f-status', label: t('ticketStatus'), path: '/support' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px] hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="md:hidden flex flex-col gap-4 mb-8">
            <div>
              <h4 className="text-[14px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('product')}
              </h4>
              <div className="flex flex-col gap-1.5 pl-3">
                {[
                  { id: 'm-catalog', label: t('catalog'), path: '/' },
                  { id: 'm-how', label: t('howItWorks'), path: '/how-it-works' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px]"
                    style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[14px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('company')}
              </h4>
              <div className="flex flex-col gap-1.5 pl-3">
                {[
                  { id: 'm-about', label: t('about'), path: '/about' },
                  { id: 'm-terms', label: t('terms'), path: '/terms' },
                  { id: 'm-privacy', label: t('privacy'), path: '/privacy' },
                  { id: 'm-owners', label: t('forOwners'), path: '/admin-login' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px]"
                    style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-[14px] mb-2" style={{ color: 'var(--eco-text)' }}>
                {t('support')}
              </h4>
              <div className="flex flex-col gap-1.5 pl-3">
                {[
                  { id: 'm-ticket', label: t('createTicket'), path: '/support/new' },
                  { id: 'm-status', label: t('ticketStatus'), path: '/support' },
                ].map((item) => (
                  <Link
                    key={item.id}
                    to={item.path}
                    className="text-[13px]"
                    style={{ color: 'var(--eco-text-tertiary)', textDecoration: 'none' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div
            className="pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderColor: 'var(--eco-border)' }}
          >
            <span className="text-[13px]" style={{ color: 'var(--eco-text-tertiary)' }}>
              {t('copyright')}
            </span>
            <div className="flex items-center gap-4 text-[13px]">
              <span style={{ color: 'var(--eco-text-tertiary)' }}>{t('developedBy')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
