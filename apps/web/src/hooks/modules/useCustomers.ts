import { useQuery } from "@tanstack/react-query";

import {
  fetchCustomers,
  type CustomerListQuery,
} from "@/services/modules/customers.service";
import { queryKeys } from "@/services/query/queryKeys";

export function useCustomers(query: CustomerListQuery) {
  return useQuery({
    queryKey: queryKeys.customers.list(query),
    queryFn: () => fetchCustomers(query),
  });
}
