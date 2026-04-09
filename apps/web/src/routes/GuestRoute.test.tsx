import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import GuestRoute from "@/routes/GuestRoute";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("GuestRoute", () => {
  it("shows loading state while auth is loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      roles: [],
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("renders guest page when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      roles: [],
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("redirects authenticated user to role home", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      roles: ["admin"],
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/app/admin/dashboard" element={<div>Admin Dashboard</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
  });

  it("renders guest page when authenticated user has no recognized role route", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      roles: [],
    });

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<div>Login Page</div>} />
          </Route>
          <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Unauthorized Page")).not.toBeInTheDocument();
  });
});
