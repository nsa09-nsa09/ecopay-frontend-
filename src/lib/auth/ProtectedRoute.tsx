import { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "./AuthContext";

export function ProtectedRoute({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  if (user && user.phone && !user.phoneVerified && location.pathname !== "/verify-phone") {
    return <Navigate to="/verify-phone" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
