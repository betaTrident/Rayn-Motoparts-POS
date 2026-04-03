import api from "@/services/api.service";
import { ENDPOINTS } from "@/services/endpoints.service";

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

export interface TransactionPagination {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface TransactionListResponse extends TransactionFilterOptions {
  results: TransactionRow[];
  pagination: TransactionPagination;
}

export interface TransactionDetail {
  id: number;
  transactionNumber: string;
  transactionDate: string;
  status: string;
  cashierName: string;
  warehouseCode: string;
  terminalCode: string;
  customerName: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  amountTendered: number;
  changeGiven: number;
  items: Array<{
    variantSku: string;
    productName: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  payments: Array<{
    method: "Cash" | "GCash" | "Card";
    amount: number;
    referenceNumber: string | null;
  }>;
}

export interface TransactionListQuery {
  q?: string;
  status?: string;
  paymentMethod?: string;
  days?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
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
  if (query?.page) params.page = String(query.page);
  if (query?.pageSize) params.page_size = String(query.pageSize);

  const { data } = await api.get<TransactionListResponse>(ENDPOINTS.pos.transactions, {
    params,
  });
  return data;
}

export async function getTransactionDetail(id: number): Promise<TransactionDetail> {
  const { data } = await api.get<TransactionDetail>(ENDPOINTS.pos.transactionById(id));
  return data;
}
