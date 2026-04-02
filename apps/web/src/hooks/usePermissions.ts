import { useMemo } from "react";

import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";

const ROLE_PRIORITY: UserRole[] = [
  "admin",
  "cashier",
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
    canAccessAdmin: hasAnyRole(["admin"]),
    canAccessCatalog: hasAnyRole(["admin", "cashier"]),
    canAccessPos: hasAnyRole(["admin", "cashier"]),
    canAccessProcurement: hasAnyRole(["admin"]),
    hasAnyRole,
  };
}
