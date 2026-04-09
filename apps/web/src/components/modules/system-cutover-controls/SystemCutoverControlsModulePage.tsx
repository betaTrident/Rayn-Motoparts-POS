import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  useExecuteSystemCutoverAction,
  useSystemCutoverSnapshot,
} from "@/hooks/modules/useSystemCutoverControls";

function CutoverStatusBadge({ canCutover }: { canCutover: boolean }) {
  if (canCutover) {
    return (
      <Badge className="gap-1" variant="default">
        <CheckCircle2 className="size-3.5" /> Ready
      </Badge>
    );
  }

  return (
    <Badge className="gap-1" variant="destructive">
      <AlertTriangle className="size-3.5" /> Blocked
    </Badge>
  );
}

export default function SystemCutoverControlsModulePage() {
  const [confirmationText, setConfirmationText] = useState("");
  const [lastActionAt, setLastActionAt] = useState<string | null>(null);

  const snapshotQuery = useSystemCutoverSnapshot();
  const actionMutation = useExecuteSystemCutoverAction();

  const snapshot = snapshotQuery.data;

  const flags = useMemo(() => {
    if (!snapshot) {
      return [];
    }

    return [
      { key: "DB_V2_READ_ENABLED", value: snapshot.flags.dbV2ReadEnabled },
      { key: "DB_V2_WRITE_ENABLED", value: snapshot.flags.dbV2WriteEnabled },
      { key: "DB_V2_DUAL_WRITE_ENABLED", value: snapshot.flags.dbV2DualWriteEnabled },
      {
        key: "DB_V2_POS_RECEIPT_READ_ENABLED",
        value: snapshot.flags.dbV2PosReceiptReadEnabled,
      },
      {
        key: "DB_V2_RECONCILIATION_ENABLED",
        value: snapshot.flags.dbV2ReconciliationEnabled,
      },
    ];
  }, [snapshot]);

  async function runAction(action: "cutover" | "rollback") {
    if (!snapshot) {
      return;
    }

    const expected =
      action === "cutover"
        ? snapshot.requiredConfirmations.cutover
        : snapshot.requiredConfirmations.rollback;

    if (confirmationText.trim() !== expected) {
      toast.error(`Type exactly: ${expected}`);
      return;
    }

    try {
      const result = await actionMutation.mutateAsync({
        action,
        confirmationText: confirmationText.trim(),
      });

      setLastActionAt(result.executedAt);
      if (result.blocked) {
        toast.error(result.message);
      } else {
        toast.success(result.message);
      }
    } catch {
      toast.error("Failed to execute control action");
    }
  }

  if (snapshotQuery.isLoading) {
    return <PageLoadingState label="Loading cutover controls..." />;
  }

  if (snapshotQuery.isError || !snapshot) {
    return (
      <PageErrorState
        title="Unable to load cutover controls"
        description="Please check your connection and try again."
        onRetry={() => snapshotQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cutover Controls"
        description="Guarded cutover and rollback actions with explicit confirmation"
        actions={<CutoverStatusBadge canCutover={snapshot.canCutover} />}
      />

      <Card>
        <CardHeader>
          <CardTitle>Preflight Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>{snapshot.reconciliation.summaryMessage}</p>
          <p>Reconciliation issues: {snapshot.reconciliation.issuesTotal}</p>
          <p>Mode: {snapshot.readOnly ? "read-only simulation" : "active execution"}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Readiness Blockers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {snapshot.blockers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No blockers detected.</p>
          ) : (
            snapshot.blockers.map((blocker) => (
              <div key={blocker} className="flex items-start gap-2 rounded-md border p-3">
                <ShieldAlert className="mt-0.5 size-4 text-destructive" />
                <p className="text-sm">{blocker}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Flag Snapshot</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {flags.map((flag) => (
            <div key={flag.key} className="flex items-center justify-between rounded-md border p-3">
              <p className="text-sm">{flag.key}</p>
              <Badge variant={flag.value ? "default" : "secondary"}>
                {flag.value ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Action Console</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            value={confirmationText}
            onChange={(event) => setConfirmationText(event.target.value)}
            placeholder={`Type ${snapshot.requiredConfirmations.cutover} or ${snapshot.requiredConfirmations.rollback}`}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => runAction("cutover")}
              disabled={actionMutation.isPending}
            >
              Simulate Cutover
            </Button>
            <Button
              variant="outline"
              onClick={() => runAction("rollback")}
              disabled={actionMutation.isPending}
            >
              Simulate Rollback
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {lastActionAt
              ? `Last action: ${new Date(lastActionAt).toLocaleString()}`
              : "No action executed in this session."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
