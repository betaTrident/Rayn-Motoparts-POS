import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SystemReconciliationPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Reconciliation"
        description="Superadmin tooling for reconciliation runs and cutover readiness checks."
      />
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Console</CardTitle>
          <CardDescription>
            This page is scaffolded in the routing foundation phase and will be implemented in
            feat/system-reconciliation.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Next step: wire API actions and results viewer for reconciliation command runs.
        </CardContent>
      </Card>
    </div>
  );
}
