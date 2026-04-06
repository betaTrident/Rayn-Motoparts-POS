import { useQuery } from "@tanstack/react-query";

import {
  fetchReportsSnapshot,
  type ReportsSnapshot,
} from "@/services/modules/reports.service";
import { queryKeys } from "@/services/query/queryKeys";

export function useReportsSnapshot(days: 7 | 30) {
  return useQuery<ReportsSnapshot>({
    queryKey: queryKeys.reports.snapshot({ days }),
    queryFn: () => fetchReportsSnapshot({ days }),
  });
}
