import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/routes/middleware/ProtectedRoute";
import GuestRoute from "@/routes/GuestRoute";
import MainLayout from "@/components/layout/MainLayout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import NotFoundPage from "@/pages/NotFoundPage";
import UnauthorizedPage from "@/pages/UnauthorizedPage";
import { Toaster } from "sonner";

// ──────────────────────────────────────────────
// React Query Client
// ──────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Guest-only routes (no layout) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Protected routes wrapped in MainLayout */}
            <Route element={<ProtectedRoute requiredRoles={["superadmin", "admin", "staff"]} />}>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route
                  element={
                    <ProtectedRoute
                      requiredRoles={["superadmin", "admin", "staff"]}
                    />
                  }
                >
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/transactions" element={<TransactionsPage />} />
                </Route>
                {/* Future pages go here:
                <Route path="/pos" element={<POSPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/staff" element={<StaffPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                */}
              </Route>
            </Route>

            {/* Public routes */}
            <Route path="/unauthorized" element={<UnauthorizedPage />} />

            {/* 404 catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors closeButton position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
