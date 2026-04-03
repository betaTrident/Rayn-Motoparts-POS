import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth.types";

const ROLE_PRIORITY: UserRole[] = [
  "superadmin",
  "admin",
  "staff",
];

export function usePermissions() {
  const { roles, hasAnyRole } = useAuth();

  const highestRole = useMemo(() => {
    for (const role of ROLE_PRIORITY) {
      if (roles.includes(role)) {
        return role;
      }
    }
    return null;
  }, [roles]);

  return {
    roles,
    highestRole,
    canAccessAdmin: hasAnyRole(["superadmin", "admin"]),
    canAccessCatalog: hasAnyRole(["superadmin", "admin", "staff"]),
    canAccessPos: hasAnyRole(["superadmin", "admin", "staff"]),
    canAccessProcurement: false,
    hasAnyRole,
  };
}
