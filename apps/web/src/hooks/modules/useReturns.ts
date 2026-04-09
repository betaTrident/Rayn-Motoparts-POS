import { useQuery } from "@tanstack/react-query";

import {
  fetchReturnDetail,
  fetchReturns,
  type ReturnListQuery,
} from "@/services/modules/returns.service";
import { queryKeys } from "@/services/query/queryKeys";

export function useReturnsList(query: ReturnListQuery) {
  return useQuery({
    queryKey: queryKeys.returns.list(query),
    queryFn: () => fetchReturns(query),
  });
}

export function useReturnDetail(returnId: number | null) {
  return useQuery({
    queryKey: queryKeys.returns.detail(returnId ?? 0),
    queryFn: () => fetchReturnDetail(returnId ?? 0),
    enabled: returnId != null,
  });
}
