import { describe, expect, it } from "vitest";

import { getDefaultAppPath } from "@/routes/roleRedirect";

describe("getDefaultAppPath", () => {
  it("returns admin dashboard for superadmin", () => {
    expect(getDefaultAppPath(["superadmin"])).toBe("/app/admin/dashboard");
  });

  it("returns admin dashboard for admin", () => {
    expect(getDefaultAppPath(["admin"])).toBe("/app/admin/dashboard");
  });

  it("returns staff dashboard for staff", () => {
    expect(getDefaultAppPath(["staff"])).toBe("/app/staff/dashboard");
  });

  it("prioritizes admin path when multiple roles include admin", () => {
    expect(getDefaultAppPath(["staff", "admin"])).toBe("/app/admin/dashboard");
  });

  it("falls back to unauthorized when roles are empty", () => {
    expect(getDefaultAppPath([])).toBe("/unauthorized");
  });
});
