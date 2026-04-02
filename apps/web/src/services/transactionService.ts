import api from "@/services/api";
import { ENDPOINTS } from "@/services/endpoints";

export interface TransactionRow {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  status: string;
  cashierName: string;
  warehouseCode: string;
  totalAmount: number;
  itemsQty: number;
  paymentMethods: Array<"Cash" | "GCash" | "Card">;
}

export interface TransactionFilterOptions {
  statusOptions: string[];
  paymentMethodOptions: Array<{ code: string; name: string }>;
}

export interface TransactionListResponse extends TransactionFilterOptions {
  results: TransactionRow[];
}

export interface TransactionListQuery {
  q?: string;
  status?: string;
  paymentMethod?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  warehouseId?: number;
}

export async function getTransactions(
  query?: TransactionListQuery
): Promise<TransactionListResponse> {
  const params: Record<string, string> = {};
  if (query?.q) params.q = query.q;
  if (query?.status && query.status !== "all") params.status = query.status;
  if (query?.paymentMethod && query.paymentMethod !== "all") {
    params.payment_method = query.paymentMethod;
  }
  if (query?.days) params.days = String(query.days);
  if (query?.startDate && query?.endDate) {
    params.start_date = query.startDate;
    params.end_date = query.endDate;
  }
  if (query?.warehouseId) params.warehouse_id = String(query.warehouseId);

  const { data } = await api.get<TransactionListResponse>(ENDPOINTS.pos.transactions, {
    params,
  });
  return data;
}
