import { useNavigate } from "react-router";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * NotFoundPage — shown when the user navigates to a URL
 * that doesn't match any defined route (404).
 */
export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4" aria-labelledby="not-found-title">
      <div className="text-center space-y-6 max-w-md">
        {/* Icon */}
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
          <FileQuestion className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">404</h1>
          <h2 id="not-found-title" className="text-xl font-semibold text-muted-foreground">
            Page Not Found
          </h2>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
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
    </main>
  );
}
