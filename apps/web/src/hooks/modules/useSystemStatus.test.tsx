import { type ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useSystemAuditLogs } from "@/hooks/modules/useSystemAudit";
import { useSystemHealthSnapshot } from "@/hooks/modules/useSystemHealth";
import { useSystemRolloutSnapshot } from "@/hooks/modules/useSystemRollout";
import * as systemAuditService from "@/services/modules/systemAudit.service";
import * as systemHealthService from "@/services/modules/systemHealth.service";
import * as systemRolloutService from "@/services/modules/systemRollout.service";

vi.mock("@/services/modules/systemHealth.service", () => ({
  fetchSystemHealthSnapshot: vi.fn(),
}));

vi.mock("@/services/modules/systemRollout.service", () => ({
  fetchSystemRolloutSnapshot: vi.fn(),
}));

vi.mock("@/services/modules/systemAudit.service", () => ({
  fetchSystemAuditLogs: vi.fn(),
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

describe("system status query hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads system health snapshot", async () => {
    const response = {
      status: "healthy",
      checks: [],
      metrics: {
        usersTotal: 1,
        usersActive: 1,
        productsActive: 1,
        customersActive: 1,
        openCashSessions: 0,
        pendingTransactions: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
      },
    };

    vi.mocked(systemHealthService.fetchSystemHealthSnapshot).mockResolvedValue(response as never);

    const { result } = renderHook(() => useSystemHealthSnapshot(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(systemHealthService.fetchSystemHealthSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(response);
  });

  it("loads system rollout snapshot", async () => {
    const response = {
      summary: {
        recommendedPhase: "phase_1",
        readOnly: false,
        message: "ok",
      },
      flags: [],
    };

    vi.mocked(systemRolloutService.fetchSystemRolloutSnapshot).mockResolvedValue(response as never);

    const { result } = renderHook(() => useSystemRolloutSnapshot(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(systemRolloutService.fetchSystemRolloutSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(response);
  });

  it("loads system audit logs with query input", async () => {
    const input = { q: "users", page: 1, pageSize: 20 };
    const response = {
      results: [],
      pagination: {
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrevious: false,
      },
      filters: {
        actions: ["INSERT", "UPDATE", "DELETE"],
        tables: [],
      },
    };

    vi.mocked(systemAuditService.fetchSystemAuditLogs).mockResolvedValue(response as never);

    const { result } = renderHook(() => useSystemAuditLogs(input), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(systemAuditService.fetchSystemAuditLogs).toHaveBeenCalledWith(input);
    expect(result.current.data).toEqual(response);
  });
});
