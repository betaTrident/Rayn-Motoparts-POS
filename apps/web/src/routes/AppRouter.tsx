import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import GuestRoute from "./GuestRoute";
import AuthGuard from "./guards/AuthGuard";
import RoleGuard from "./guards/RoleGuard";
import { getDefaultAppPath } from "./roleRedirect";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const NotFoundPage = lazy(() => import("@/pages/NotFoundPage"));
const UnauthorizedPage = lazy(() => import("@/pages/UnauthorizedPage"));

const AdminDashboardPage = lazy(() => import("@/app/admin/dashboard/page"));
const AdminInventoryPage = lazy(() => import("@/app/admin/inventory/page"));
const AdminPosPage = lazy(() => import("@/app/admin/pos/page"));
const AdminReturnsPage = lazy(() => import("@/app/admin/returns/page"));
const AdminSettingsPage = lazy(() => import("@/app/admin/settings/page"));
const AdminTransactionsPage = lazy(() => import("@/app/admin/transactions/page"));

const StaffDashboardPage = lazy(() => import("@/app/staff/dashboard/page"));
const StaffInventoryPage = lazy(() => import("@/app/staff/inventory/page"));
const StaffPosPage = lazy(() => import("@/app/staff/pos/page"));
const StaffReturnsPage = lazy(() => import("@/app/staff/returns/page"));
const StaffTransactionsPage = lazy(() => import("@/app/staff/transactions/page"));

const SystemAuditPage = lazy(() => import("@/app/system/audit/page"));
const SystemCutoverControlsPage = lazy(() => import("@/app/system/cutover-controls/page"));
const SystemHealthPage = lazy(() => import("@/app/system/health/page"));
const SystemRolloutPage = lazy(() => import("@/app/system/rollout/page"));
const SystemReconciliationPage = lazy(() => import("@/app/system/reconciliation/page"));

type LegacyDestination = "products" | "customers" | "reports";

function RoleHomeRedirect() {
  const { roles } = useAuth();
  return <Navigate to={getDefaultAppPath(roles)} replace />;
}

function LegacyConsolidationRedirect({ destination }: { destination: LegacyDestination }) {
  const { roles } = useAuth();
  const roleHome = getDefaultAppPath(roles);

  if (!roleHome.startsWith("/app/")) {
    return <Navigate to="/login" replace />;
  }

  const appBasePath = roleHome.startsWith("/app/staff") ? "/app/staff" : "/app/admin";

  if (destination === "products") {
    return <Navigate to={`${appBasePath}/inventory?tab=products`} replace />;
  }

  if (destination === "customers") {
    return <Navigate to={`${appBasePath}/transactions?tab=customers`} replace />;
  }

  if (appBasePath === "/app/staff") {
    return <Navigate to={`${appBasePath}/dashboard`} replace />;
  }

  return <Navigate to="/app/admin/dashboard?panel=reports" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense
        fallback={(
          <main className="flex h-screen items-center justify-center text-muted-foreground" aria-labelledby="app-loading-title">
            <h1 id="app-loading-title" className="sr-only">Application Loading</h1>
            <p>Loading...</p>
          </main>
        )}
      >
        <Routes>
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route element={<AuthGuard />}>
            <Route element={<MainLayout />}>
              <Route path="/" element={<RoleHomeRedirect />} />

              <Route element={<RoleGuard allowedRoles={["superadmin", "admin"]} />}>
                <Route path="/app/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/app/admin/pos" element={<AdminPosPage />} />
                <Route path="/app/admin/catalog" element={<Navigate to="/app/admin/inventory?tab=products" replace />} />
                <Route path="/app/admin/customers" element={<Navigate to="/app/admin/transactions?tab=customers" replace />} />
                <Route path="/app/admin/inventory" element={<AdminInventoryPage />} />
                <Route path="/app/admin/transactions" element={<AdminTransactionsPage />} />
                <Route path="/app/admin/returns" element={<AdminReturnsPage />} />
                <Route path="/app/admin/reports" element={<Navigate to="/app/admin/dashboard?panel=reports" replace />} />
                <Route path="/app/admin/settings" element={<AdminSettingsPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={["staff"]} />}>
                <Route path="/app/staff/dashboard" element={<StaffDashboardPage />} />
                <Route path="/app/staff/pos" element={<StaffPosPage />} />
                <Route path="/app/staff/customers" element={<Navigate to="/app/staff/transactions?tab=customers" replace />} />
                <Route path="/app/staff/inventory" element={<StaffInventoryPage />} />
                <Route path="/app/staff/transactions" element={<StaffTransactionsPage />} />
                <Route path="/app/staff/returns" element={<StaffReturnsPage />} />
              </Route>

              <Route element={<RoleGuard allowedRoles={["superadmin"]} />}>
                <Route path="/app/system/audit" element={<SystemAuditPage />} />
                <Route path="/app/system/cutover-controls" element={<SystemCutoverControlsPage />} />
                <Route path="/app/system/health" element={<SystemHealthPage />} />
                <Route path="/app/system/rollout" element={<SystemRolloutPage />} />
                <Route path="/app/system/reconciliation" element={<SystemReconciliationPage />} />
              </Route>

              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/pos" element={<Navigate to="/" replace />} />
              <Route path="/products" element={<LegacyConsolidationRedirect destination="products" />} />
              <Route path="/customers" element={<LegacyConsolidationRedirect destination="customers" />} />
              <Route path="/inventory" element={<Navigate to="/" replace />} />
              <Route path="/transactions" element={<Navigate to="/" replace />} />
              <Route path="/returns" element={<Navigate to="/" replace />} />
              <Route path="/reports" element={<LegacyConsolidationRedirect destination="reports" />} />
              <Route path="/settings" element={<Navigate to="/" replace />} />
              <Route path="/system-health" element={<Navigate to="/" replace />} />
              <Route path="/system-rollout" element={<Navigate to="/" replace />} />
              <Route path="/system-audit" element={<Navigate to="/" replace />} />
              <Route path="/system-cutover-controls" element={<Navigate to="/" replace />} />
            </Route>
          </Route>

          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
