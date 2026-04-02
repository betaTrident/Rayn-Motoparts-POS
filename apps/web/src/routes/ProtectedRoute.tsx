import { useEffect } from "react";
import { Navigate, Outlet, useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";

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
interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
}

function ForceLogoutRedirect() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    void logout().finally(() => {
      navigate("/login", { replace: true });
    });
  }, [logout, navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-muted-foreground text-lg">Signing out...</div>
    </div>
  );
}

export default function ProtectedRoute({ requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, hasAnyRole } = useAuth();

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

  if (!hasAnyRole(requiredRoles)) {
    return <ForceLogoutRedirect />;
  }

  // Authenticated → render the child routes
  return <Outlet />;
}
