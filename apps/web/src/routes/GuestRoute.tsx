import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";

/**
 * GuestRoute — only accessible when NOT logged in.
 *
 * If the user IS already authenticated, redirect them to the
 * dashboard (they don't need to see the login page again).
 *
 * USAGE:
 *   <Route element={<GuestRoute />}>
 *     <Route path="/login" element={<LoginPage />} />
 *     <Route path="/register" element={<RegisterPage />} />
 *   </Route>
 */
export default function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  // Already logged in → send them to the dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not logged in → show login/register pages
  return <Outlet />;
}
