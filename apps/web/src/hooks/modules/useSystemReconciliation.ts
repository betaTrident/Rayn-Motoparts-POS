import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  fetchSystemReconciliationSnapshot,
  runSystemReconciliation,
  type RunSystemReconciliationInput,
  type RunSystemReconciliationResult,
  type SystemReconciliationSnapshot,
} from "@/services/modules/systemReconciliation.service";

export function useSystemReconciliationSnapshot() {
  return useQuery<SystemReconciliationSnapshot>({
    queryKey: queryKeys.system.reconciliation,
    queryFn: fetchSystemReconciliationSnapshot,
    refetchInterval: 30_000,
  });
}

export function useRunSystemReconciliation() {
  const queryClient = useQueryClient();

  return useMutation<RunSystemReconciliationResult, Error, RunSystemReconciliationInput>({
    mutationFn: runSystemReconciliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.reconciliation });
    },
  });
}
