import { Navigate, Outlet } from "react-router";
import { useAuth } from "@/context/AuthContext";

/**
 * ProtectedRoute — a route wrapper that checks authentication.
 *
 * HOW IT WORKS:
 * 1. It reads `isAuthenticated` and `isLoading` from AuthContext.
 * 2. While loading (checking if token is valid), it shows a spinner.
 * 3. If the user IS authenticated → render the child route (<Outlet />).
 * 4. If the user is NOT authenticated → redirect to /login.
 *
 * USAGE in your router:
 *   <Route element={<ProtectedRoute />}>
 *     <Route path="/dashboard" element={<Dashboard />} />
 *     <Route path="/settings" element={<Settings />} />
 *   </Route>
 *
 * All child routes inside will require authentication.
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  // Still checking if the user's token is valid
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  // Not authenticated → redirect to login
  // `replace` prevents the login page from appearing in browser history
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated → render the child routes
  return <Outlet />;
}
