import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

type PageLoadingStateProps = {
  label?: string;
  className?: string;
};

export function PageLoadingState({
  label = "Loading data...",
  className,
}: PageLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-44 items-center justify-center py-14",
        className
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="text-muted-foreground flex items-center gap-2 text-sm">
        <Loader2 className="text-primary size-5 animate-spin" />
        <span>{label}</span>
      </div>
    </div>
  );
}

type PageEmptyStateProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageEmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: PageEmptyStateProps) {
  return (
    <Empty className={cn("border-0 rounded-none py-14", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon className="size-5" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}

type PageErrorStateProps = {
  title?: string;
  description?: string;
  retryLabel?: string;
  onRetry?: () => void;
  className?: string;
};

export function PageErrorState({
  title = "Something went wrong",
  description = "The data could not be loaded. Please try again.",
  retryLabel = "Try again",
  onRetry,
  className,
}: PageErrorStateProps) {
  return (
    <Empty className={cn("border-0 rounded-none py-14", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <span className="text-destructive text-lg font-semibold">!</span>
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onRetry ? (
        <EmptyContent>
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {retryLabel}
          </Button>
        </EmptyContent>
      ) : null}
    </Empty>
  );
}
