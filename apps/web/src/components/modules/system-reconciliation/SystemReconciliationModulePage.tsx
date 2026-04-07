import { useState } from "react";
import { AlertTriangle, CheckCircle2, PlayCircle } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  useRunSystemReconciliation,
  useSystemReconciliationSnapshot,
} from "@/hooks/modules/useSystemReconciliation";

function StatusBadge({ status }: { status: "pass" | "warning" }) {
  if (status === "pass") {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2 className="size-3.5" /> Pass
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="destructive">
      <AlertTriangle className="size-3.5" /> Issues Detected
    </Badge>
  );
}

export default function SystemReconciliationModulePage() {
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const snapshotQuery = useSystemReconciliationSnapshot();
  const runMutation = useRunSystemReconciliation();

  async function runNow(failOnIssues: boolean) {
    try {
      const result = await runMutation.mutateAsync({ failOnIssues });
      setLastRunAt(result.executedAt);

      if (result.snapshot.issueCounts.total === 0) {
        toast.success("Reconciliation completed with zero issues");
        return;
      }

      if (result.wouldFail) {
        toast.error("Reconciliation run marked as failed due to detected issues");
        return;
      }

      toast.warning("Reconciliation completed with detected issues");
    } catch {
      toast.error("Failed to run reconciliation");
    }
  }

  if (snapshotQuery.isLoading) {
    return <PageLoadingState label="Loading reconciliation metrics..." />;
  }

  if (snapshotQuery.isError || !snapshotQuery.data) {
    return (
      <PageErrorState
        title="Unable to load reconciliation data"
        description="Please check your connection and try again."
        onRetry={() => snapshotQuery.refetch()}
      />
    );
  }

  const snapshot = snapshotQuery.data;
  const issueRows: Array<{ label: string; value: number }> = [
    { label: "Item total mismatches", value: snapshot.issueCounts.itemTotalMismatch },
    { label: "Payment shortfalls", value: snapshot.issueCounts.paymentTotalShort },
    { label: "Negative stock rows", value: snapshot.issueCounts.negativeStockRows },
    { label: "Orphan sale movements", value: snapshot.issueCounts.orphanSaleMovements },
    { label: "Missing receipt snapshots", value: snapshot.issueCounts.receiptMissing },
    { label: "Receipt total mismatches", value: snapshot.issueCounts.receiptTotalMismatch },
    {
      label: "Receipt payment mismatches",
      value: snapshot.issueCounts.receiptPaymentMismatch,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation"
        description="Run parity checks before and during cutover"
        actions={<StatusBadge status={snapshot.status} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Run Controls</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => runNow(false)}
            disabled={runMutation.isPending}
            className="gap-1"
          >
            <PlayCircle className="size-4" /> Run Reconciliation
          </Button>
          <Button
            variant="outline"
            onClick={() => runNow(true)}
            disabled={runMutation.isPending}
          >
            Run With Fail-on-Issues
          </Button>
          <p className="text-xs text-muted-foreground">
            {lastRunAt
              ? `Last run: ${new Date(lastRunAt).toLocaleString()}`
              : "No run triggered in this session."}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Scanned Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{snapshot.scannedTransactions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Issues</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{snapshot.issueCounts.total}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Sale Movement Rows</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{snapshot.movement.saleMovementCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Net Sale Qty Change</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{snapshot.movement.netSaleQtyChange}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Issue Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {issueRows.map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm">{row.label}</p>
              <p className="text-sm font-semibold">{row.value}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            Reconciliation feature flag: {snapshot.reconciliationEnabled ? "enabled" : "disabled"}
          </p>
          <p>POS dual write: {snapshot.dualWriteEnabled ? "enabled" : "disabled"}</p>
          <p>{snapshot.summaryMessage}</p>
        </CardContent>
      </Card>
    </div>
  );
}
