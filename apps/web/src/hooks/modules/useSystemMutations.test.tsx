import { type ReactNode } from "react";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  useRunSystemReconciliation,
  useSystemReconciliationSnapshot,
} from "@/hooks/modules/useSystemReconciliation";
import {
  useExecuteSystemCutoverAction,
  useSystemCutoverSnapshot,
} from "@/hooks/modules/useSystemCutoverControls";
import { queryKeys } from "@/services/query/queryKeys";
import * as systemCutoverService from "@/services/modules/systemCutoverControls.service";
import * as systemReconciliationService from "@/services/modules/systemReconciliation.service";

vi.mock("@/services/modules/systemReconciliation.service", () => ({
  fetchSystemReconciliationSnapshot: vi.fn(),
  runSystemReconciliation: vi.fn(),
}));

vi.mock("@/services/modules/systemCutoverControls.service", () => ({
  fetchSystemCutoverSnapshot: vi.fn(),
  executeSystemCutoverAction: vi.fn(),
}));

function createWrapperWithClient() {
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

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { queryClient, wrapper };
}

describe("system mutation hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads reconciliation snapshot", async () => {
    const snapshot = {
      status: "pass",
      summaryMessage: "ok",
      reconciliationEnabled: true,
      dualWriteEnabled: true,
      scannedTransactions: 10,
      issueCounts: {
        itemTotalMismatch: 0,
        paymentTotalShort: 0,
        negativeStockRows: 0,
        orphanSaleMovements: 0,
        receiptMissing: 0,
        receiptTotalMismatch: 0,
        receiptPaymentMismatch: 0,
        total: 0,
      },
      movement: {
        saleMovementCount: 1,
        netSaleQtyChange: "1",
      },
    };

    vi.mocked(systemReconciliationService.fetchSystemReconciliationSnapshot).mockResolvedValue(snapshot as never);

    const { wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useSystemReconciliationSnapshot(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(systemReconciliationService.fetchSystemReconciliationSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(snapshot);
  });

  it("invalidates reconciliation query after run mutation", async () => {
    const runResult = {
      executedAt: "2026-04-09T00:00:00Z",
      failOnIssues: false,
      wouldFail: false,
      snapshot: {
        status: "pass",
      },
    };

    vi.mocked(systemReconciliationService.runSystemReconciliation).mockResolvedValue(runResult as never);

    const { queryClient, wrapper } = createWrapperWithClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useRunSystemReconciliation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({ failOnIssues: false });
    });

    expect(systemReconciliationService.runSystemReconciliation).toHaveBeenCalledWith(
      { failOnIssues: false },
      expect.objectContaining({ client: expect.any(Object) })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.system.reconciliation });
  });

  it("loads cutover snapshot", async () => {
    const snapshot = {
      readOnly: false,
      canCutover: true,
      blockers: [],
      requiredConfirmations: {
        cutover: "CUTOVER",
        rollback: "ROLLBACK",
      },
      flags: {
        dbV2ReadEnabled: false,
        dbV2WriteEnabled: false,
        dbV2DualWriteEnabled: false,
        dbV2PosReceiptReadEnabled: false,
        dbV2ReconciliationEnabled: false,
      },
      reconciliation: {
        status: "pass",
        issuesTotal: 0,
        summaryMessage: "ok",
      },
    };

    vi.mocked(systemCutoverService.fetchSystemCutoverSnapshot).mockResolvedValue(snapshot as never);

    const { wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useSystemCutoverSnapshot(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(systemCutoverService.fetchSystemCutoverSnapshot).toHaveBeenCalledTimes(1);
    expect(result.current.data).toEqual(snapshot);
  });

  it("invalidates cutover and audit queries after cutover action", async () => {
    const actionPayload = {
      action: "cutover" as const,
      confirmationText: "CUTOVER",
    };

    const actionResult = {
      executedAt: "2026-04-09T00:00:00Z",
      action: "cutover",
      readOnly: false,
      blocked: false,
      message: "ok",
      snapshot: {
        readOnly: false,
      },
    };

    vi.mocked(systemCutoverService.executeSystemCutoverAction).mockResolvedValue(actionResult as never);

    const { queryClient, wrapper } = createWrapperWithClient();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useExecuteSystemCutoverAction(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(actionPayload);
    });

    expect(systemCutoverService.executeSystemCutoverAction).toHaveBeenCalledWith(
      actionPayload,
      expect.objectContaining({ client: expect.any(Object) })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: queryKeys.system.cutoverControls });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.system.audit({ page: 1, pageSize: 20 }),
    });
  });
});
