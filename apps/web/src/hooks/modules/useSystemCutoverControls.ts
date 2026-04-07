import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  executeSystemCutoverAction,
  fetchSystemCutoverSnapshot,
  type ExecuteCutoverActionInput,
  type ExecuteCutoverActionResult,
  type SystemCutoverSnapshot,
} from "@/services/modules/systemCutoverControls.service";

export function useSystemCutoverSnapshot() {
  return useQuery<SystemCutoverSnapshot>({
    queryKey: queryKeys.system.cutoverControls,
    queryFn: fetchSystemCutoverSnapshot,
    refetchInterval: 30_000,
  });
}

export function useExecuteSystemCutoverAction() {
  const queryClient = useQueryClient();

  return useMutation<ExecuteCutoverActionResult, Error, ExecuteCutoverActionInput>({
    mutationFn: executeSystemCutoverAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.system.cutoverControls });
      queryClient.invalidateQueries({ queryKey: queryKeys.system.audit({ page: 1, pageSize: 20 }) });
    },
  });
}
