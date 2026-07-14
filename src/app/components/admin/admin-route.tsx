import { useEffect, type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuth } from '../auth/auth-provider';
import { useI18n } from '../i18n-provider';
import { Button } from '../ds-primitives';
import { defaultLandingForRole, findNavItem, isRoleAllowedFor, type StaffRole } from './admin-nav';
import { prefetchAdminDashboard } from '../../lib/admin-dashboard-cache';

interface AdminRouteProps {
  children?: ReactNode;
  /**
   * Optional explicit override. When omitted, the guard looks up role
   * requirements from the centralized nav config based on the current path,
   * so per-page rules stay in one place.
   */
  allow?: readonly StaffRole[];
}

/**
 * Guards /admin/** routes.
 * - No session  → redirect to /admin-login (preserves the requested path).
 * - Wrong role  → render an access-denied panel rather than bouncing the
 *   user back to a login page they can't pass through.
 *
 * Role requirements come from `ADMIN_NAV_ITEMS` so the sidebar and the
 * guard never disagree.
 */
export function AdminRoute({ children, allow }: AdminRouteProps) {
  const { user, isAuthenticated, isReady, authorizedRequest } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  // Warm up the dashboard caches the moment we know we have an ADMIN
  // session. The cache module dedupes in-flight requests and skips
  // resources that already have data, so this is safe to fire on every
  // mount of the admin shell. SUPPORT users never hit /admin/dashboard,
  // so they don't trigger ADMIN-only endpoints (would 403 noise).
  useEffect(() => {
    if (!isReady || !isAuthenticated || !user || user.role !== 'ADMIN') return;
    void prefetchAdminDashboard(authorizedRequest);
  }, [isReady, isAuthenticated, user, authorizedRequest]);

  if (!isReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--eco-bg)', color: 'var(--eco-text-tertiary)', fontSize: 14 }}
      >
        {t('loading')}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const search = location.pathname + location.search;
    const redirect = search && search !== '/' ? `?redirect=${encodeURIComponent(search)}` : '';
    return <Navigate to={`/admin-login${redirect}`} replace />;
  }

  const role = user.role as StaffRole | 'USER';

  // Per-path rule (from nav config) unless an explicit `allow` override is given.
  const navItem = findNavItem(location.pathname);
  const allowed: readonly StaffRole[] = allow ?? navItem?.roles ?? ['ADMIN', 'SUPPORT'];

  const hasAccess = allowed.includes(role as StaffRole);

  if (!hasAccess) {
    // SUPPORT hitting an ADMIN-only path: bounce them to their default
    // landing page rather than showing a hard "denied" wall if they have
    // anywhere to go.
    if (role === 'SUPPORT' && navItem) {
      return <Navigate to={defaultLandingForRole(role)} replace />;
    }
    // USERs and everything else: explicit access-denied panel.
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: 'var(--eco-bg)' }}
      >
        <div className="max-w-md text-center">
          <h1 className="text-[22px] mb-2" style={{ color: 'var(--eco-text)' }}>
            {t('accessDeniedTitle')}
          </h1>
          <p className="text-[14px] mb-6" style={{ color: 'var(--eco-text-secondary)' }}>
            {t('accessDeniedBody')}
          </p>
          <Button variant="primary" onClick={() => (window.location.href = '/')}>
            {t('backToHome')}
          </Button>
        </div>
      </div>
    );
  }

  // Allow children to be inlined OR use react-router <Outlet/> in nested trees.
  if (children) return <>{children}</>;
  return <Outlet />;
}

export { isRoleAllowedFor };
