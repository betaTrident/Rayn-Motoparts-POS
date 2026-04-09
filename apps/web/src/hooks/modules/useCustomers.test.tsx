import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useCustomers } from "@/hooks/modules/useCustomers";
import * as customersService from "@/services/modules/customers.service";

vi.mock("@/services/modules/customers.service", () => ({
  fetchCustomers: vi.fn(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useCustomers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches customer list with active filter and pagination", async () => {
    const query = { q: "jo", active: "active" as const, page: 2, pageSize: 20 };
    const response = {
      results: [{ id: 1, fullName: "John Doe" }],
      pagination: {
        page: 2,
        pageSize: 20,
        totalCount: 1,
        totalPages: 1,
        hasPrevious: true,
        hasNext: false,
      },
    };

    vi.mocked(customersService.fetchCustomers).mockResolvedValue(response as never);

    const { result } = renderHook(() => useCustomers(query), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(customersService.fetchCustomers).toHaveBeenCalledWith(query);
    expect(result.current.data).toEqual(response);
  });
});
