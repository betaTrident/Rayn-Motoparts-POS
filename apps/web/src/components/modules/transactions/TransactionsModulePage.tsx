import { Download, Receipt, Banknote, Undo2, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

import PageHeader from "@/components/layout/PageHeader";
import { exportTransactionsCsv } from "@/components/modules/transactions/formatters";
import TransactionDetailDialog from "@/components/modules/transactions/parts/TransactionDetailDialog";
import TransactionsFilters from "@/components/modules/transactions/parts/TransactionsFilters";
import TransactionsTable from "@/components/modules/transactions/parts/TransactionsTable";
import { Card, CardContent } from "@/components/ui/card";
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
  const [selectedTransaction, setSelectedTransaction] =
    useState<TransactionRow | null>(null);
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
    return (
      Boolean(q) || days !== "7" || status !== "all" || paymentMethod !== "all"
    );
  }, [q, days, status, paymentMethod]);

  const pageGross = results.reduce((sum, row) => sum + row.totalAmount, 0);
  const refundedCount = results.filter(
    (row) => row.status === "refunded",
  ).length;
  const avgTicket = results.length ? pageGross / results.length : 0;

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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Matched Records"
          value={pagination?.totalCount ?? 0}
          icon={Receipt}
          accent="primary"
        />
        <StatCard
          label="Current Page Gross"
          value={formatPhp(pageGross)}
          icon={Banknote}
          accent="green"
        />
        <StatCard
          label="Refunded on Page"
          value={refundedCount}
          icon={Undo2}
          accent="amber"
        />
        <StatCard
          label="Page Avg Ticket"
          value={formatPhp(avgTicket)}
          icon={TrendingUp}
          accent="blue"
        />
      </div>

      <Card className="py-0">
        <CardContent className="p-4 pt-3">
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
        </CardContent>
      </Card>

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

function formatPhp(value: number) {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: "primary" | "green" | "amber" | "blue";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  };

  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3 pb-0">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-md",
            colors[accent],
          )}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
