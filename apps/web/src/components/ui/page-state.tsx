import { cn } from "@/lib/utils";

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
      <div className="flex flex-col items-center gap-4">
        {/* Industrial spinner: 3 concentric rings */}
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 border-2 border-[rgba(0,0,0,0.1)] rounded-full" />
          <div className="absolute inset-0 border-2 border-transparent border-t-[#ff5722] rounded-full animate-spin" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#546067]">
          {label}
        </span>
      </div>
    </div>
  );
}

type PageEmptyStateProps = {
  icon?: string | React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export function PageEmptyState({
  icon = "inbox",
  title,
  description,
  action,
  className,
}: PageEmptyStateProps) {
  const IconComponent = typeof icon === "string" ? null : icon;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="w-16 h-16 bg-[#f3f3f3] border border-[rgba(0,0,0,0.08)] flex items-center justify-center mb-4 rounded-md">
        {typeof icon === "string" ? (
          <span
            className="material-symbols-outlined text-[#546067]"
            style={{ fontSize: "28px" }}
          >
            {icon}
          </span>
        ) : (
          IconComponent && <IconComponent className="w-7 h-7 text-[#546067]" />
        )}
      </div>
      <h3 className="text-sm font-bold text-[#1a1c1c] mb-1">{title}</h3>
      <p className="text-xs text-[#546067] font-medium max-w-xs leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
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
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 text-center",
        className
      )}
    >
      <div className="w-16 h-16 bg-[#ffdad6]/30 border-l-4 border-[#ba1a1a] flex items-center justify-center mb-4">
        <span
          className="material-symbols-outlined text-[#ba1a1a]"
          style={{
            fontSize: "28px",
            fontVariationSettings: "'FILL' 1, 'wght' 500, 'GRAD' 0, 'opsz' 28",
          }}
        >
          error
        </span>
      </div>
      <h3 className="text-sm font-bold text-[#1a1c1c] mb-1">{title}</h3>
      <p className="text-xs text-[#546067] font-medium max-w-xs leading-relaxed">
        {description}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-2 border border-[rgba(84,96,103,0.4)] text-[#1a1c1c] text-[10px] font-bold uppercase tracking-widest hover:bg-[#f3f3f3] transition-colors"
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}
