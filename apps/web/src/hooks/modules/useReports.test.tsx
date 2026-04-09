import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useReportsSnapshot } from "@/hooks/modules/useReports";
import * as reportsService from "@/services/modules/reports.service";

vi.mock("@/services/modules/reports.service", () => ({
  fetchReportsSnapshot: vi.fn(),
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

describe("useReportsSnapshot", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches reports snapshot with selected day range", async () => {
    const response = {
      dashboard: {
        period: { days: 7 },
      },
      totals: {
        transactions: 9,
        returns: 2,
        customers: 4,
      },
    };

    vi.mocked(reportsService.fetchReportsSnapshot).mockResolvedValue(response as never);

    const { result } = renderHook(() => useReportsSnapshot(7), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(reportsService.fetchReportsSnapshot).toHaveBeenCalledWith({ days: 7 });
    expect(result.current.data).toEqual(response);
  });
});
