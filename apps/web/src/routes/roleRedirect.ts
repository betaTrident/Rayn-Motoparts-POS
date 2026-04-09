import type { UserRole } from "@/types/auth.types";

export function getDefaultAppPath(roles: UserRole[]): string {
  if (roles.includes("superadmin") || roles.includes("admin")) {
    return "/app/admin/dashboard";
  }
  if (roles.includes("staff")) {
    return "/app/staff/dashboard";
  }
  return "/unauthorized";
}
