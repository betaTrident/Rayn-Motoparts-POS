import { Activity, AlertTriangle, CheckCircle2 } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import { useSystemHealthSnapshot } from "@/hooks/modules/useSystemHealth";

function HealthBadge({ status }: { status: "healthy" | "degraded" }) {
  if (status === "healthy") {
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle2 className="size-3.5" /> Healthy
      </Badge>
    );
  }

  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="size-3.5" /> Degraded
    </Badge>
  );
}

export default function SystemHealthModulePage() {
  const healthQuery = useSystemHealthSnapshot();

  if (healthQuery.isLoading) {
    return <PageLoadingState label="Loading system health..." />;
  }

  if (healthQuery.isError || !healthQuery.data) {
    return (
      <PageErrorState
        title="Unable to load system health"
        description="Please check your connection and try again."
        onRetry={() => healthQuery.refetch()}
      />
    );
  }

  const { status, checks, metrics } = healthQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Health"
        description="Live health checks and operational metrics for superadmin monitoring"
        actions={<HealthBadge status={status} />}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.usersActive}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Open Cash Sessions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.openCashSessions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.pendingTransactions}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Out of Stock Items</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-bold">{metrics.outOfStockItems}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4" /> Health Checks
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {checks.map((check) => (
            <div key={check.name} className="flex items-start justify-between gap-4 rounded-md border p-3">
              <div>
                <p className="text-sm font-medium capitalize">{check.name}</p>
                <p className="text-xs text-muted-foreground">{check.message}</p>
              </div>
              <HealthBadge status={check.status} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Watch</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Low Stock Items</p>
            <p className="mt-1 text-xl font-semibold">{metrics.lowStockItems}</p>
          </div>
          <div className="rounded-md border p-4">
            <p className="text-sm text-muted-foreground">Active Products</p>
            <p className="mt-1 text-xl font-semibold">{metrics.productsActive}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
