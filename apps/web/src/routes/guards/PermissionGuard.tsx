import { Navigate, Outlet } from "react-router";

interface PermissionGuardProps {
  allowed: boolean;
}

export default function PermissionGuard({ allowed }: PermissionGuardProps) {
  if (!allowed) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
