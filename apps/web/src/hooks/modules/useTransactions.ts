import { useQuery } from "@tanstack/react-query";

import {
  fetchTransactionDetail,
  fetchTransactions,
  type TransactionListQuery,
} from "@/services/modules/transactions.service";
import { queryKeys } from "@/services/query/queryKeys";

export function useTransactionsList(query: TransactionListQuery) {
  return useQuery({
    queryKey: queryKeys.transactions.list(query),
    queryFn: () => fetchTransactions(query),
  });
}

export function useTransactionDetail(transactionId: number | null) {
  return useQuery({
    queryKey: queryKeys.transactions.detail(transactionId ?? 0),
    queryFn: () => fetchTransactionDetail(transactionId ?? 0),
    enabled: transactionId != null,
  });
}
