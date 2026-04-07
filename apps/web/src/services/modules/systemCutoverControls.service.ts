import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export interface SystemCutoverSnapshot {
  readOnly: boolean;
  canCutover: boolean;
  blockers: string[];
  requiredConfirmations: {
    cutover: string;
    rollback: string;
  };
  flags: {
    dbV2ReadEnabled: boolean;
    dbV2WriteEnabled: boolean;
    dbV2DualWriteEnabled: boolean;
    dbV2PosReceiptReadEnabled: boolean;
    dbV2ReconciliationEnabled: boolean;
  };
  reconciliation: {
    status: "pass" | "warning";
    issuesTotal: number;
    summaryMessage: string;
  };
}

export interface ExecuteCutoverActionInput {
  action: "cutover" | "rollback";
  confirmationText: string;
}

export interface ExecuteCutoverActionResult {
  executedAt: string;
  action: "cutover" | "rollback";
  readOnly: boolean;
  blocked: boolean;
  message: string;
  snapshot: SystemCutoverSnapshot;
}

export async function fetchSystemCutoverSnapshot(): Promise<SystemCutoverSnapshot> {
  const { data } = await api.get<SystemCutoverSnapshot>(ENDPOINTS.system.cutoverControls);
  return data;
}

export async function executeSystemCutoverAction(
  input: ExecuteCutoverActionInput
): Promise<ExecuteCutoverActionResult> {
  const { data } = await api.post<ExecuteCutoverActionResult>(ENDPOINTS.system.cutoverControls, input);
  return data;
}
