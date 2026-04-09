import {
  getTransactionDetail,
  getTransactions,
  type TransactionDetail,
  type TransactionListQuery,
  type TransactionListResponse,
} from "@/services/transactionService.service";

export type {
  TransactionDetail,
  TransactionListQuery,
  TransactionListResponse,
};

export async function fetchTransactions(
  query?: TransactionListQuery
): Promise<TransactionListResponse> {
  return getTransactions(query);
}

export async function fetchTransactionDetail(id: number): Promise<TransactionDetail> {
  return getTransactionDetail(id);
}
