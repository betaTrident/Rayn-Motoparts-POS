import { useQuery } from "@tanstack/react-query";

import { queryKeys } from "@/services/query/queryKeys";
import {
  fetchSystemHealthSnapshot,
  type SystemHealthSnapshot,
} from "@/services/modules/systemHealth.service";

export function useSystemHealthSnapshot() {
  return useQuery<SystemHealthSnapshot>({
    queryKey: queryKeys.system.health,
    queryFn: fetchSystemHealthSnapshot,
    refetchInterval: 30_000,
  });
}
