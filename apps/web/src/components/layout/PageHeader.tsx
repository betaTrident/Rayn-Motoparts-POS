import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

/**
 * Industrial Atelier — PageHeader
 *
 * Standard page header block following the dashboard.html pattern:
 * - Large extrabold title with tight tracking
 * - Secondary-colored description in sm weight
 * - Right-aligned action buttons (primary + secondary)
 */
export default function PageHeader({
  title,
  description,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6",
        className
      )}
    >
      <div>
        <h2 className="text-2xl font-extrabold text-[#1a1c1c] tracking-tight leading-none">
          {title}
        </h2>
        {description ? (
          <p className="text-[#546067] text-sm font-medium mt-1">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex items-center gap-2 shrink-0">{actions}</div>
      ) : null}
    </header>
  );
}
