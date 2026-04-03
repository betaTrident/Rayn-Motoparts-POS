import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth.types";

interface RoleGuardProps {
  allowedRoles: UserRole[];
}

export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { hasAnyRole } = useAuth();

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
