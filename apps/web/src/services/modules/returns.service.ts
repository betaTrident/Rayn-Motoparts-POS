import {
  type TransactionDetail,
  type TransactionFilterOptions,
  type TransactionListQuery,
  type TransactionPagination,
  type TransactionRow,
} from "@/services/transactionService.service";
import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

export type ReturnStatusFilter = "all_returns" | "refunded" | "partially_refunded";

export interface ReturnListQuery extends Omit<TransactionListQuery, "status"> {
  status?: ReturnStatusFilter;
}

export interface ReturnListResponse extends TransactionFilterOptions {
  results: TransactionRow[];
  pagination: TransactionPagination;
}

export async function fetchReturns(query: ReturnListQuery = {}): Promise<ReturnListResponse> {
  const params: Record<string, string> = {};

  if (query.q) {
    params.q = query.q;
  }
  if (query.status && query.status !== "all_returns") {
    params.status = query.status;
  }
  if (query.paymentMethod && query.paymentMethod !== "all") {
    params.payment_method = query.paymentMethod;
  }
  if (query.days) {
    params.days = String(query.days);
  }
  if (query.startDate && query.endDate) {
    params.start_date = query.startDate;
    params.end_date = query.endDate;
  }
  if (query.page) {
    params.page = String(query.page);
  }
  if (query.pageSize) {
    params.page_size = String(query.pageSize);
  }

  const { data } = await api.get<ReturnListResponse>(ENDPOINTS.returns.list, {
    params,
  });
  return data;
}

export async function fetchReturnDetail(id: number): Promise<TransactionDetail> {
  const { data } = await api.get<TransactionDetail>(ENDPOINTS.returns.byId(id));
  return data;
}
