import { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthProvider, useAuth } from "@/context/AuthContext";
import * as authService from "@/services/authService.service";

vi.mock("@/services/authService.service", () => ({
  isAuthenticated: vi.fn(),
  getProfile: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  logout: vi.fn(),
  getAuthClaims: vi.fn(),
}));

const initialUser = {
  id: 1,
  email: "admin@example.com",
  username: "admin",
  first_name: "Admin",
  last_name: "User",
  is_active: true,
  is_staff: true,
  date_joined: "2024-01-01T00:00:00Z",
};

const loggedInUser = {
  ...initialUser,
  id: 2,
  email: "next@example.com",
  username: "next-user",
};

let isAuthed = true;

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthProvider>{children}</AuthProvider>
      </QueryClientProvider>
    );
  };
}

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    isAuthed = true;

    vi.mocked(authService.isAuthenticated).mockImplementation(() => isAuthed);
    vi.mocked(authService.getProfile).mockResolvedValue(initialUser);
    vi.mocked(authService.getAuthClaims).mockReturnValue({ roles: ["admin"] });
    vi.mocked(authService.login).mockResolvedValue({
      user: loggedInUser,
      tokens: { access: "access", refresh: "refresh" },
    });
    vi.mocked(authService.register).mockResolvedValue({
      user: loggedInUser,
      tokens: { access: "access", refresh: "refresh" },
    });
    vi.mocked(authService.logout).mockResolvedValue();
  });

  it("hydrates authenticated user and handles login/logout mutations", async () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.id).toBe(1);
    });

    expect(result.current.hasAnyRole(["admin"])).toBe(true);

    await act(async () => {
      await result.current.login({
        email: "next@example.com",
        password: "secret",
      });
    });

    await waitFor(() => {
      expect(result.current.user?.id).toBe(2);
    });

    isAuthed = false;

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it("stays unauthenticated when auth is disabled", async () => {
    vi.mocked(authService.isAuthenticated).mockReturnValue(false);
    vi.mocked(authService.getAuthClaims).mockReturnValue(null);

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });

    expect(authService.getProfile).not.toHaveBeenCalled();
  });
});
