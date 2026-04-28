import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuth } from "./AuthContext";
import type { Role } from "../api/types";

export function RoleRoute({
  roles,
  children,
}: {
  roles: Role[];
  children?: ReactNode;
}) {
  const { isAuthenticated, isLoading, role } = useAuth();

  if (isLoading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  }
  if (!isAuthenticated) return <Navigate to="/admin-login" replace />;
  if (!role || !roles.includes(role)) return <Navigate to="/" replace />;

  return children ? <>{children}</> : <Outlet />;
}
