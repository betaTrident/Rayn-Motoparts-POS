import {
  getTransactionDetail,
  getTransactions,
  type TransactionDetail,
} from "@/services/transactionService.service";

export interface CustomerListQuery {
  q?: string;
  days?: number;
  page?: number;
  pageSize?: number;
}

export interface CustomerRow {
  key: string;
  name: string;
  visits: number;
  totalSpent: number;
  averageOrderValue: number;
  lastPurchaseAt: string;
  lastCashier: string;
  lastTransactionNumber: string;
}

export interface CustomerListResponse {
  results: CustomerRow[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasPrevious: boolean;
    hasNext: boolean;
  };
  meta: {
    sampledTransactions: number;
    sampledDays: number;
  };
}

interface CustomerAggregate {
  key: string;
  name: string;
  visits: number;
  totalSpent: number;
  lastPurchaseAt: string;
  lastCashier: string;
  lastTransactionNumber: string;
}

const MAX_TRANSACTION_PAGES = 4;
const TRANSACTION_PAGE_SIZE = 40;

function normalizeName(value: string | null | undefined): string {
  if (!value || !value.trim()) {
    return "Walk-in";
  }
  return value.trim();
}

function buildPagination(page: number, pageSize: number, totalCount: number) {
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

function toRow(aggregate: CustomerAggregate): CustomerRow {
  return {
    key: aggregate.key,
    name: aggregate.name,
    visits: aggregate.visits,
    totalSpent: aggregate.totalSpent,
    averageOrderValue: aggregate.visits ? aggregate.totalSpent / aggregate.visits : 0,
    lastPurchaseAt: aggregate.lastPurchaseAt,
    lastCashier: aggregate.lastCashier,
    lastTransactionNumber: aggregate.lastTransactionNumber,
  };
}

function reduceDetails(details: TransactionDetail[]): CustomerRow[] {
  const map = new Map<string, CustomerAggregate>();

  for (const detail of details) {
    const name = normalizeName(detail.customerName);
    const key = name.toLowerCase();
    const existing = map.get(key);

    if (!existing) {
      map.set(key, {
        key,
        name,
        visits: 1,
        totalSpent: detail.totalAmount,
        lastPurchaseAt: detail.transactionDate,
        lastCashier: detail.cashierName,
        lastTransactionNumber: detail.transactionNumber,
      });
      continue;
    }

    existing.visits += 1;
    existing.totalSpent += detail.totalAmount;

    if (new Date(detail.transactionDate).getTime() > new Date(existing.lastPurchaseAt).getTime()) {
      existing.lastPurchaseAt = detail.transactionDate;
      existing.lastCashier = detail.cashierName;
      existing.lastTransactionNumber = detail.transactionNumber;
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map(toRow);
}

export async function fetchCustomers(query: CustomerListQuery = {}): Promise<CustomerListResponse> {
  const page = query.page ?? 1;
  const pageSize = query.pageSize ?? 20;
  const days = Math.max(1, Math.min(query.days ?? 30, 30));

  const transactionRows = [] as Array<{ id: number }>;

  for (let current = 1; current <= MAX_TRANSACTION_PAGES; current += 1) {
    const response = await getTransactions({
      q: query.q,
      days,
      page: current,
      pageSize: TRANSACTION_PAGE_SIZE,
    });

    transactionRows.push(...response.results.map((item) => ({ id: item.id })));

    if (!response.pagination.hasNext) {
      break;
    }
  }

  const details = await Promise.all(
    transactionRows.map((item) => getTransactionDetail(item.id))
  );

  const aggregated = reduceDetails(details);
  const pagination = buildPagination(page, pageSize, aggregated.length);
  const offset = (pagination.page - 1) * pagination.pageSize;

  return {
    results: aggregated.slice(offset, offset + pagination.pageSize),
    pagination,
    meta: {
      sampledTransactions: transactionRows.length,
      sampledDays: days,
    },
  };
}
