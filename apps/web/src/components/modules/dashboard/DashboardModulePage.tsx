import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { useAuth } from "@/context/AuthContext";
import { useDashboardSnapshot } from "@/hooks/modules/useDashboard";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import ReportsModulePage from "@/components/modules/reports/ReportsModulePage";
import type { DashboardVariant } from "@/components/modules/dashboard/types";
import DashboardHeaderControls from "@/components/modules/dashboard/parts/DashboardHeaderControls";
import KpiSummaryCards from "@/components/modules/dashboard/parts/KpiSummaryCards";
import OperationalInsightsSection from "@/components/modules/dashboard/parts/OperationalInsightsSection";
import RecentTransactionsTable from "@/components/modules/dashboard/parts/RecentTransactionsTable";
import SalesPerformanceSection from "@/components/modules/dashboard/parts/SalesPerformanceSection";
import StaffFocusNote from "@/components/modules/dashboard/parts/StaffFocusNote";
import StaffOperationsPanel from "@/components/modules/dashboard/parts/StaffOperationsPanel";

interface DashboardModulePageProps {
  variant?: DashboardVariant;
}

type DashboardRange = "1" | "7" | "30" | "custom";

function toValidRange(value: string | null): DashboardRange {
  if (value === "1" || value === "7" || value === "30" || value === "custom") {
    return value;
  }
  return "1";
}

function toQueryDays(range: DashboardRange, startDate: string, endDate: string): number {
  if (range !== "custom") {
    return Number(range);
  }

  if (!startDate || !endDate) {
    return 7;
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return 7;
  }

  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const diff = Math.floor((end.getTime() - start.getTime()) / millisecondsPerDay) + 1;
  return Math.max(1, Math.min(diff, 90));
}

export default function DashboardModulePage({
  variant = "admin",
}: DashboardModulePageProps) {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const range = toValidRange(searchParams.get("range"));
  const startDate = searchParams.get("start_date") ?? "";
  const endDate = searchParams.get("end_date") ?? "";

  const rangeDays = useMemo(
    () => toQueryDays(range, startDate, endDate),
    [range, startDate, endDate]
  );

  const dashboardQuery = useDashboardSnapshot(rangeDays);

  const setRange = (value: DashboardRange) => {
    const next = new URLSearchParams(searchParams);
    next.set("range", value);

    if (value !== "custom") {
      next.delete("start_date");
      next.delete("end_date");
    }

    setSearchParams(next, { replace: true });
  };

  const setStartDate = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("range", "custom");
    if (value) {
      next.set("start_date", value);
    } else {
      next.delete("start_date");
    }
    setSearchParams(next, { replace: true });
  };

  const setEndDate = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("range", "custom");
    if (value) {
      next.set("end_date", value);
    } else {
      next.delete("end_date");
    }
    setSearchParams(next, { replace: true });
  };

  if (dashboardQuery.isLoading) {
    return <PageLoadingState label="Loading dashboard..." />;
  }

  if (dashboardQuery.isError || !dashboardQuery.data) {
    return (
      <PageErrorState
        title="Unable to load dashboard"
        description="Please check your connection and try again."
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  const {
    summary,
    weeklySales,
    topProducts,
    recentTransactions,
    categorySales,
    hourlySales,
    inventoryAlerts,
    movementInsights,
    topCashiers,
    paymentMix,
  } = dashboardQuery.data;

  const rangeLabel =
    range === "custom" && startDate && endDate
      ? `${startDate} to ${endDate}`
      : rangeDays === 1
        ? "today"
        : `the last ${rangeDays} days`;

  const isStaffVariant = variant === "staff";

  return (
    <div className="space-y-6 pb-2">
      <DashboardHeaderControls
        title={`Operational Velocity${user?.first_name ? `, ${user.first_name}` : ""}`}
        description={`Real-time status of Rayn Motorparts for ${rangeLabel}.`}
        rangeValue={range}
        onRangeChange={setRange}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
      />

      <KpiSummaryCards summary={summary} />

      {isStaffVariant && (
        <div className="grid gap-4 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <StaffOperationsPanel />
          </div>
          <div className="lg:col-span-3">
            <StaffFocusNote />
          </div>
        </div>
      )}

      <SalesPerformanceSection
        weeklySales={weeklySales}
        categorySales={categorySales}
        hourlySales={hourlySales}
        topProducts={topProducts}
      />

      <OperationalInsightsSection
        inventoryAlerts={inventoryAlerts}
        movementInsights={movementInsights}
        topCashiers={topCashiers}
        paymentMix={paymentMix}
        showManagementInsights={!isStaffVariant}
      />

      <RecentTransactionsTable transactions={recentTransactions} />

      {!isStaffVariant && (
        <div className="border-t pt-6">
          <ReportsModulePage embedded />
        </div>
      )}
    </div>
  );
}