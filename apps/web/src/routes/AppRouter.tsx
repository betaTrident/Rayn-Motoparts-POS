import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import GuestRoute from "./GuestRoute";
import AuthGuard from "./guards/AuthGuard";
import RoleGuard from "./guards/RoleGuard";
import { getDefaultAppPath } from "./roleRedirect";

import AdminCatalogPage from "@/app/admin/catalog/page";
import AdminCustomersPage from "@/app/admin/customers/page";
import AdminDashboardPage from "@/app/admin/dashboard/page";
import AdminInventoryPage from "@/app/admin/inventory/page";
import AdminPosPage from "@/app/admin/pos/page";
import AdminReportsPage from "@/app/admin/reports/page";
import AdminReturnsPage from "@/app/admin/returns/page";
import AdminSettingsPage from "@/app/admin/settings/page";
import AdminTransactionsPage from "@/app/admin/transactions/page";
import StaffCustomersPage from "@/app/staff/customers/page";
import StaffDashboardPage from "@/app/staff/dashboard/page";
import StaffInventoryPage from "@/app/staff/inventory/page";
import StaffPosPage from "@/app/staff/pos/page";
import StaffReturnsPage from "@/app/staff/returns/page";
import StaffTransactionsPage from "@/app/staff/transactions/page";
import SystemAuditPage from "@/app/system/audit/page";
import SystemCutoverControlsPage from "@/app/system/cutover-controls/page";
import SystemHealthPage from "@/app/system/health/page";
import SystemRolloutPage from "@/app/system/rollout/page";
import SystemReconciliationPage from "@/app/system/reconciliation/page";

function RoleHomeRedirect() {
  const { roles } = useAuth();
  return <Navigate to={getDefaultAppPath(roles)} replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
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
              <Route path="/app/admin/catalog" element={<AdminCatalogPage />} />
              <Route path="/app/admin/customers" element={<AdminCustomersPage />} />
              <Route path="/app/admin/inventory" element={<AdminInventoryPage />} />
              <Route path="/app/admin/transactions" element={<AdminTransactionsPage />} />
              <Route path="/app/admin/returns" element={<AdminReturnsPage />} />
              <Route path="/app/admin/reports" element={<AdminReportsPage />} />
              <Route path="/app/admin/settings" element={<AdminSettingsPage />} />
            </Route>

            <Route element={<RoleGuard allowedRoles={["staff"]} />}>
              <Route path="/app/staff/dashboard" element={<StaffDashboardPage />} />
              <Route path="/app/staff/pos" element={<StaffPosPage />} />
              <Route path="/app/staff/customers" element={<StaffCustomersPage />} />
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
            <Route path="/products" element={<Navigate to="/" replace />} />
            <Route path="/customers" element={<Navigate to="/" replace />} />
            <Route path="/inventory" element={<Navigate to="/" replace />} />
            <Route path="/transactions" element={<Navigate to="/" replace />} />
            <Route path="/returns" element={<Navigate to="/" replace />} />
            <Route path="/reports" element={<Navigate to="/" replace />} />
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
    </BrowserRouter>
  );
}
