import {
  fetchDashboardSnapshot,
  type DashboardSnapshot,
} from "@/services/modules/dashboard.service";
import { fetchCustomers } from "@/services/modules/customers.service";
import { fetchReturns } from "@/services/modules/returns.service";
import { getTransactions } from "@/services/transactionService.service";

export interface ReportsSnapshotQuery {
  days?: 7 | 30;
}

export interface ReportsSnapshot {
  dashboard: DashboardSnapshot;
  totals: {
    transactions: number;
    returns: number;
    customers: number;
  };
}

export async function fetchReportsSnapshot(
  query: ReportsSnapshotQuery = {}
): Promise<ReportsSnapshot> {
  const days = query.days ?? 30;

  const [dashboard, transactions, returnsData, customers] = await Promise.all([
    fetchDashboardSnapshot({ days }),
    getTransactions({ days, page: 1, pageSize: 1 }),
    fetchReturns({ days, status: "all_returns", page: 1, pageSize: 1 }),
    fetchCustomers({ page: 1, pageSize: 1, active: "all" }),
  ]);

  return {
    dashboard,
    totals: {
      transactions: transactions.pagination.totalCount,
      returns: returnsData.pagination.totalCount,
      customers: customers.pagination.totalCount,
    },
  };
}
