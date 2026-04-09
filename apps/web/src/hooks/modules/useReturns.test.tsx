import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReturnDetail, useReturnsList } from "@/hooks/modules/useReturns";
import * as returnsService from "@/services/modules/returns.service";

vi.mock("@/services/modules/returns.service", () => ({
  fetchReturns: vi.fn(),
  fetchReturnDetail: vi.fn(),
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

describe("useReturns hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads returns list for filtered query", async () => {
    const query = {
      status: "refunded" as const,
      days: 7,
      page: 1,
      pageSize: 10,
    };
    const response = {
      results: [{ id: 3001 }],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
        hasPrevious: false,
        hasNext: false,
      },
      actions: ["INSERT", "UPDATE", "DELETE"],
      paymentMethods: ["cash"],
    };

    vi.mocked(returnsService.fetchReturns).mockResolvedValue(response as never);

    const { result } = renderHook(() => useReturnsList(query), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(returnsService.fetchReturns).toHaveBeenCalledWith(query);
    expect(result.current.data).toEqual(response);
  });

  it("does not fetch return detail when id is null", async () => {
    const { result } = renderHook(() => useReturnDetail(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(returnsService.fetchReturnDetail).not.toHaveBeenCalled();
  });
});
