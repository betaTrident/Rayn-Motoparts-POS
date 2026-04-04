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
import AdminDashboardPage from "@/app/admin/dashboard/page";
import AdminPosPage from "@/app/admin/pos/page";
import AdminTransactionsPage from "@/app/admin/transactions/page";
import StaffDashboardPage from "@/app/staff/dashboard/page";
import StaffPosPage from "@/app/staff/pos/page";
import StaffTransactionsPage from "@/app/staff/transactions/page";
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
              <Route path="/app/admin/transactions" element={<AdminTransactionsPage />} />
            </Route>

            <Route element={<RoleGuard allowedRoles={["staff"]} />}>
              <Route path="/app/staff/dashboard" element={<StaffDashboardPage />} />
              <Route path="/app/staff/pos" element={<StaffPosPage />} />
              <Route path="/app/staff/transactions" element={<StaffTransactionsPage />} />
            </Route>

            <Route element={<RoleGuard allowedRoles={["superadmin"]} />}>
              <Route path="/app/system/reconciliation" element={<SystemReconciliationPage />} />
            </Route>

            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/pos" element={<Navigate to="/" replace />} />
            <Route path="/products" element={<Navigate to="/" replace />} />
            <Route path="/transactions" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
