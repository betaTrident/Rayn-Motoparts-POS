import { useNavigate } from "react-router";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * UnauthorizedPage — shown when a user tries to access
 * a resource they don't have permission for (403 Forbidden).
 *
 * This is different from "not logged in" (which redirects to /login).
 * This is for logged-in users who lack the required role/permission.
 * Example: a regular user trying to access an admin-only page.
 */
export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
          <ShieldX className="h-10 w-10 text-destructive" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">403</h1>
          <h2 className="text-xl font-semibold text-muted-foreground">
            Access Denied
          </h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          You don't have permission to access this page. If you believe this is
          an error, please contact your administrator.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
          <Button onClick={() => navigate("/dashboard")}>
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
