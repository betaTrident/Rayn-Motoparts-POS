import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export type ReconciliationStatus = "pass" | "warning";

export interface SystemReconciliationSnapshot {
  status: ReconciliationStatus;
  summaryMessage: string;
  reconciliationEnabled: boolean;
  dualWriteEnabled: boolean;
  scannedTransactions: number;
  issueCounts: {
    itemTotalMismatch: number;
    paymentTotalShort: number;
    negativeStockRows: number;
    orphanSaleMovements: number;
    receiptMissing: number;
    receiptTotalMismatch: number;
    receiptPaymentMismatch: number;
    total: number;
  };
  movement: {
    saleMovementCount: number;
    netSaleQtyChange: string;
  };
}

export interface RunSystemReconciliationInput {
  failOnIssues?: boolean;
}

export interface RunSystemReconciliationResult {
  executedAt: string;
  failOnIssues: boolean;
  wouldFail: boolean;
  snapshot: SystemReconciliationSnapshot;
}

export async function fetchSystemReconciliationSnapshot(): Promise<SystemReconciliationSnapshot> {
  const { data } = await api.get<SystemReconciliationSnapshot>(ENDPOINTS.system.reconciliation);
  return data;
}

export async function runSystemReconciliation(
  input: RunSystemReconciliationInput = {}
): Promise<RunSystemReconciliationResult> {
  const { data } = await api.post<RunSystemReconciliationResult>(ENDPOINTS.system.reconciliation, {
    failOnIssues: Boolean(input.failOnIssues),
  });
  return data;
}
