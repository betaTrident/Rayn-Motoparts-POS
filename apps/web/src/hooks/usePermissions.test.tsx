import { describe, expect, it, vi } from "vitest";
import { renderHook } from "@testing-library/react";

import { usePermissions } from "@/hooks/usePermissions";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("usePermissions", () => {
  it("resolves superadmin as highest role", () => {
    mockUseAuth.mockReturnValue({
      roles: ["staff", "admin", "superadmin"],
      permissions: ["users:read"],
      hasAnyRole: (requiredRoles: string[]) =>
        requiredRoles.some((role) => ["staff", "admin", "superadmin"].includes(role)),
      hasPermission: (permission: string) => permission === "users:read",
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.highestRole).toBe("superadmin");
    expect(result.current.canAccessAdmin).toBe(true);
    expect(result.current.canAccessCatalog).toBe(true);
    expect(result.current.canAccessPos).toBe(true);
  });

  it("resolves staff permissions correctly", () => {
    mockUseAuth.mockReturnValue({
      roles: ["staff"],
      permissions: [],
      hasAnyRole: (requiredRoles: string[]) => requiredRoles.includes("staff"),
      hasPermission: () => false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.highestRole).toBe("staff");
    expect(result.current.canAccessAdmin).toBe(false);
    expect(result.current.canAccessCatalog).toBe(true);
    expect(result.current.canAccessPos).toBe(true);
  });

  it("returns null highestRole for unknown role set", () => {
    mockUseAuth.mockReturnValue({
      roles: [],
      permissions: [],
      hasAnyRole: () => false,
      hasPermission: () => false,
    });

    const { result } = renderHook(() => usePermissions());

    expect(result.current.highestRole).toBeNull();
    expect(result.current.canAccessAdmin).toBe(false);
  });
});
