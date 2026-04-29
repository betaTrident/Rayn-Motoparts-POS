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
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <h2 className="text-2xl leading-none font-extrabold tracking-tight text-[#1a1c1c] sm:text-[1.75rem]">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm font-medium text-[#546067]">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:gap-2 [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
