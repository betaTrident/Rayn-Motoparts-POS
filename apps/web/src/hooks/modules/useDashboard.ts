import { useQuery } from "@tanstack/react-query";

import {
  fetchDashboardSnapshot,
  type DashboardSnapshot,
} from "@/services/modules/dashboard.service";
import { queryKeys } from "@/services/query/queryKeys";

export function useDashboardSnapshot(days: number) {
  return useQuery<DashboardSnapshot>({
    queryKey: queryKeys.dashboard.snapshot({ days }),
    queryFn: () => fetchDashboardSnapshot({ days }),
  });
}
