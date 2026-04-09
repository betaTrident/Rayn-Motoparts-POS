import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useTransactionDetail,
  useTransactionsList,
} from "@/hooks/modules/useTransactions";
import * as transactionsService from "@/services/modules/transactions.service";

vi.mock("@/services/modules/transactions.service", () => ({
  fetchTransactions: vi.fn(),
  fetchTransactionDetail: vi.fn(),
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

describe("useTransactions hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads transactions list with the provided query", async () => {
    const query = { q: "INV", page: 1, pageSize: 10 };
    const response = {
      results: [{ id: 101 }],
      pagination: {
        page: 1,
        pageSize: 10,
        totalCount: 1,
        totalPages: 1,
      },
    };

    vi.mocked(transactionsService.fetchTransactions).mockResolvedValue(response as never);

    const { result } = renderHook(() => useTransactionsList(query), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(transactionsService.fetchTransactions).toHaveBeenCalledWith(query);
    expect(result.current.data).toEqual(response);
  });

  it("does not fetch detail when transaction id is null", async () => {
    const { result } = renderHook(() => useTransactionDetail(null), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.fetchStatus).toBe("idle");
    });

    expect(transactionsService.fetchTransactionDetail).not.toHaveBeenCalled();
  });
});
