import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import PermissionGuard from "@/routes/guards/PermissionGuard";
import RoleGuard from "@/routes/guards/RoleGuard";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("RoleGuard", () => {
  it("renders outlet when role is allowed", () => {
    mockUseAuth.mockReturnValue({
      hasAnyRole: () => true,
    });

    render(
      <MemoryRouter initialEntries={["/role-protected"]}>
        <Routes>
          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route path="/role-protected" element={<div>Role Protected</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Role Protected")).toBeInTheDocument();
  });

  it("redirects to unauthorized when role is not allowed", () => {
    mockUseAuth.mockReturnValue({
      hasAnyRole: () => false,
    });

    render(
      <MemoryRouter initialEntries={["/role-protected"]}>
        <Routes>
          <Route element={<RoleGuard allowedRoles={["admin"]} />}>
            <Route path="/role-protected" element={<div>Role Protected</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });
});

describe("PermissionGuard", () => {
  it("renders outlet when permission is allowed", () => {
    render(
      <MemoryRouter initialEntries={["/permission-protected"]}>
        <Routes>
          <Route element={<PermissionGuard allowed={true} />}>
            <Route path="/permission-protected" element={<div>Permission Protected</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Permission Protected")).toBeInTheDocument();
  });

  it("redirects to unauthorized when permission is denied", () => {
    render(
      <MemoryRouter initialEntries={["/permission-protected"]}>
        <Routes>
          <Route element={<PermissionGuard allowed={false} />}>
            <Route path="/permission-protected" element={<div>Permission Protected</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Unauthorized Page")).toBeInTheDocument();
  });
});
