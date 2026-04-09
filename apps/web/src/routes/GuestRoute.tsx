import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";
import { getDefaultAppPath } from "./roleRedirect";

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
  const { isAuthenticated, isLoading, roles } = useAuth();
  const defaultPath = getDefaultAppPath(roles);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  // Already logged in → send them to the dashboard
  if (isAuthenticated && defaultPath !== "/unauthorized") {
    return <Navigate to={defaultPath} replace />;
  }

  // Not logged in → show login/register pages
  return <Outlet />;
}
