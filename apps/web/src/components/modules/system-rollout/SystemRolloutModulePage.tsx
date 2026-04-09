import { Rocket, ShieldAlert, ShieldCheck } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import { useSystemRolloutSnapshot } from "@/hooks/modules/useSystemRollout";

function phaseLabel(phase: string): string {
  switch (phase) {
    case "phase_1":
      return "Phase 1 - Readiness";
    case "phase_2":
      return "Phase 2 - Dual Write";
    case "phase_3":
      return "Phase 3 - Reconciliation";
    case "phase_4":
      return "Phase 4 - Cutover";
    default:
      return phase;
  }
}

export default function SystemRolloutModulePage() {
  const rolloutQuery = useSystemRolloutSnapshot();

  if (rolloutQuery.isLoading) {
    return <PageLoadingState label="Loading rollout status..." />;
  }

  if (rolloutQuery.isError || !rolloutQuery.data) {
    return (
      <PageErrorState
        title="Unable to load rollout status"
        description="Please check your connection and try again."
        onRetry={() => rolloutQuery.refetch()}
      />
    );
  }

  const { summary, flags } = rolloutQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Rollout"
        description="Observe rollout flag progression across migration phases"
        actions={
          <Badge variant="outline" className="gap-1">
            <Rocket className="size-3.5" /> {phaseLabel(summary.recommendedPhase)}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Rollout Overview</CardTitle>
          <CardDescription>{summary.message}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          {summary.readOnly
            ? "This environment exposes rollout flags as read-only observability controls."
            : "This environment allows rollout actions."}
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {flags.map((flag) => (
          <Card key={flag.key}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-3 text-base">
                <span>{flag.label}</span>
                {flag.enabled ? (
                  <Badge variant="default" className="gap-1">
                    <ShieldCheck className="size-3.5" /> Enabled
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="gap-1">
                    <ShieldAlert className="size-3.5" /> Disabled
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>{flag.key}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{flag.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
