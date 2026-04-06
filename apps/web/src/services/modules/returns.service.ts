import {
  getTransactionDetail,
  getTransactions,
  type TransactionDetail,
  type TransactionFilterOptions,
  type TransactionListQuery,
  type TransactionPagination,
  type TransactionRow,
} from "@/services/transactionService.service";

export type ReturnStatusFilter = "all_returns" | "refunded" | "partially_refunded";

export interface ReturnListQuery extends Omit<TransactionListQuery, "status"> {
  status?: ReturnStatusFilter;
}

export interface ReturnListResponse extends TransactionFilterOptions {
  results: TransactionRow[];
  pagination: TransactionPagination;
}

const RETURN_STATUSES = new Set(["refunded", "partially_refunded"]);

function toPagination(
  page: number,
  pageSize: number,
  totalCount: number
): TransactionPagination {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return {
    page: safePage,
    pageSize,
    totalCount,
    totalPages,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
  };
}

export async function fetchReturns(query: ReturnListQuery = {}): Promise<ReturnListResponse> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const statusFilter = query.status ?? "all_returns";

  const baseResponse = await getTransactions({
    q: query.q,
    days: query.days,
    startDate: query.startDate,
    endDate: query.endDate,
    paymentMethod: query.paymentMethod,
    page: 1,
    pageSize: 200,
    status: statusFilter === "all_returns" ? undefined : statusFilter,
  });

  const filtered = baseResponse.results.filter((item) => {
    if (!RETURN_STATUSES.has(item.status)) {
      return false;
    }
    if (statusFilter === "all_returns") {
      return true;
    }
    return item.status === statusFilter;
  });

  const pagination = toPagination(page, pageSize, filtered.length);
  const offset = (pagination.page - 1) * pagination.pageSize;

  return {
    results: filtered.slice(offset, offset + pagination.pageSize),
    statusOptions: ["refunded", "partially_refunded"],
    paymentMethodOptions: baseResponse.paymentMethodOptions,
    pagination,
  };
}

export async function fetchReturnDetail(id: number): Promise<TransactionDetail> {
  return getTransactionDetail(id);
}
