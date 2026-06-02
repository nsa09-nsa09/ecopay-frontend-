import { type ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../auth/auth-provider";
import { useI18n } from "../i18n-provider";
import { Button } from "../ds-primitives";

type AllowedRole = "ADMIN" | "SUPPORT";

interface AdminRouteProps {
  children?: ReactNode;
  allow?: AllowedRole[];
}

/**
 * Guards /admin/** routes.
 * - No session  → redirect to /admin-login (preserves the requested path).
 * - Wrong role  → render an access-denied panel rather than bouncing the user
 *   to a login page they can't use.
 * - Allowed     → render children (or <Outlet/> for nested route trees).
 */
export function AdminRoute({ children, allow = ["ADMIN", "SUPPORT"] }: AdminRouteProps) {
  const { user, isAuthenticated, isReady } = useAuth();
  const location = useLocation();
  const { t } = useI18n();

  if (!isReady) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--eco-bg)", color: "var(--eco-text-tertiary)", fontSize: 14 }}
      >
        {t("loading")}
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    const search = location.pathname + location.search;
    const redirect = search && search !== "/" ? `?redirect=${encodeURIComponent(search)}` : "";
    return <Navigate to={`/admin-login${redirect}`} replace />;
  }

  const role = user.role as AllowedRole | "USER";
  if (!allow.includes(role as AllowedRole)) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-6"
        style={{ background: "var(--eco-bg)" }}
      >
        <div className="max-w-md text-center">
          <h1 className="text-[22px] mb-2" style={{ color: "var(--eco-text)" }}>
            {t("accessDeniedTitle")}
          </h1>
          <p className="text-[14px] mb-6" style={{ color: "var(--eco-text-secondary)" }}>
            {t("accessDeniedBody")}
          </p>
          <Button variant="primary" onClick={() => (window.location.href = "/")}>
            {t("backToHome")}
          </Button>
        </div>
      </div>
    );
  }

  return <>{children ?? <Outlet />}</>;
}
