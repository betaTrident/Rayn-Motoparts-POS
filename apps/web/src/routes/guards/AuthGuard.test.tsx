import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it, vi } from "vitest";

import AuthGuard from "@/routes/guards/AuthGuard";

const mockUseAuth = vi.fn();

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={["/protected"]}>
      <Routes>
        <Route element={<AuthGuard />}>
          <Route path="/protected" element={<div>Protected Page</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("AuthGuard", () => {
  it("shows loading state while auth is loading", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
    });

    renderGuard();

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("redirects to login when user is not authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
  });

  it("renders outlet when authenticated", () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
    });

    renderGuard();

    expect(screen.getByText("Protected Page")).toBeInTheDocument();
  });
});
