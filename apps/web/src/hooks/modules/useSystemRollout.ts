import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  fetchSystemRolloutSnapshot,
  type SystemRolloutSnapshot,
} from "@/services/modules/systemRollout.service";

export function useSystemRolloutSnapshot() {
  return useQuery<SystemRolloutSnapshot>({
    queryKey: queryKeys.system.rollout,
    queryFn: fetchSystemRolloutSnapshot,
    refetchInterval: 30_000,
  });
}
