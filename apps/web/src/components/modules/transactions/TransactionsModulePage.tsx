import { Download } from "lucide-react";
import { useMemo, useState } from "react";

import PageHeader from "@/components/layout/PageHeader";
import { exportTransactionsCsv } from "@/components/modules/transactions/formatters";
import TransactionDetailDialog from "@/components/modules/transactions/parts/TransactionDetailDialog";
import TransactionsFilters from "@/components/modules/transactions/parts/TransactionsFilters";
import TransactionsTable from "@/components/modules/transactions/parts/TransactionsTable";
import { Button } from "@/components/ui/button";
import {
  useTransactionDetail,
  useTransactionsList,
} from "@/hooks/modules/useTransactions";
import type { TransactionRow } from "@/services/transactionService.service";

export default function TransactionsModulePage() {
  const [q, setQ] = useState("");
  const [days, setDays] = useState("7");
  const [status, setStatus] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedTransaction, setSelectedTransaction] = useState<TransactionRow | null>(null);
  const pageSize = 20;

  const transactionsQuery = useTransactionsList({
    q,
    days: Number(days),
    status,
    paymentMethod,
    page,
    pageSize,
  });

  const detailQuery = useTransactionDetail(selectedTransaction?.id ?? null);

  const results = transactionsQuery.data?.results ?? [];
  const statusOptions = transactionsQuery.data?.statusOptions ?? [];
  const paymentOptions = transactionsQuery.data?.paymentMethodOptions ?? [];
  const pagination = transactionsQuery.data?.pagination;

  const activeFilters = useMemo(() => {
    return Boolean(q) || days !== "7" || status !== "all" || paymentMethod !== "all";
  }, [q, days, status, paymentMethod]);

  const clearFilters = () => {
    setQ("");
    setDays("7");
    setStatus("all");
    setPaymentMethod("all");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="Review completed and refunded sales transactions"
        actions={
          <Button
            variant="outline"
            onClick={() => exportTransactionsCsv(results)}
            disabled={!results.length}
          >
            <Download className="mr-2 size-4" />
            Export CSV
          </Button>
        }
      />

      <TransactionsFilters
        q={q}
        days={days}
        status={status}
        paymentMethod={paymentMethod}
        statusOptions={statusOptions}
        paymentOptions={paymentOptions}
        activeFilters={activeFilters}
        onQueryChange={(value) => {
          setQ(value);
          setPage(1);
        }}
        onDaysChange={(value) => {
          setDays(value);
          setPage(1);
        }}
        onStatusChange={(value) => {
          setStatus(value);
          setPage(1);
        }}
        onPaymentMethodChange={(value) => {
          setPaymentMethod(value);
          setPage(1);
        }}
        onClearFilters={clearFilters}
      />

      <TransactionsTable
        isLoading={transactionsQuery.isLoading}
        isError={transactionsQuery.isError}
        results={results}
        pagination={pagination}
        onRetry={() => transactionsQuery.refetch()}
        onViewDetail={setSelectedTransaction}
        onPreviousPage={() => setPage((prev) => Math.max(1, prev - 1))}
        onNextPage={() => setPage((prev) => prev + 1)}
      />

      <TransactionDetailDialog
        selectedTransaction={selectedTransaction}
        detailData={detailQuery.data}
        isLoading={detailQuery.isLoading}
        isError={detailQuery.isError}
        onClose={() => setSelectedTransaction(null)}
        onRetry={() => detailQuery.refetch()}
      />
    </div>
  );
}
