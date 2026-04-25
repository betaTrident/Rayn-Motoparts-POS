import PageHeader from "@/components/layout/PageHeader";
import { cn } from "@/lib/utils";

type DashboardRange = "1" | "7" | "30" | "custom";

const rangeOptions: { value: DashboardRange; label: string }[] = [
  { value: "1",      label: "Today"        },
  { value: "7",      label: "Last 7 Days"  },
  { value: "30",     label: "Last 30 Days" },
  { value: "custom", label: "Custom Range" },
];

interface DashboardHeaderControlsProps {
  title: string;
  description: string;
  rangeValue: DashboardRange;
  onRangeChange: (value: DashboardRange) => void;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

export default function DashboardHeaderControls({
  title,
  description,
  rangeValue,
  onRangeChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DashboardHeaderControlsProps) {
  const isCustom = rangeValue === "custom";

  return (
    <PageHeader
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {/* Range tab pills */}
          <div className="flex border border-[rgba(228,190,180,0.3)] rounded-md overflow-hidden">
            {rangeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onRangeChange(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-colors duration-150",
                  rangeValue === opt.value
                    ? "bg-[#ff5722] text-white"
                    : "bg-white text-[#546067] hover:bg-[#f3f3f3] hover:text-[#1a1c1c]",
                  opt.value !== "1" && "border-l border-[rgba(228,190,180,0.3)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Custom date range inputs */}
          {isCustom && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                aria-label="Start date"
                className={cn(
                  "px-2 py-1.5 text-xs text-[#1a1c1c] bg-white rounded-md",
                  "border border-[rgba(228,190,180,0.35)]",
                  "focus:outline-none focus:border-[#ff5722] focus:border-2",
                  "transition-all duration-150"
                )}
              />
              <span className="text-[10px] font-bold text-[#546067] uppercase">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                aria-label="End date"
                className={cn(
                  "px-2 py-1.5 text-xs text-[#1a1c1c] bg-white rounded-md",
                  "border border-[rgba(228,190,180,0.35)]",
                  "focus:outline-none focus:border-[#ff5722] focus:border-2",
                  "transition-all duration-150"
                )}
              />
            </div>
          )}

          {/* Export button */}
          <button
            className={cn(
              "px-4 py-2 border border-[rgba(228,190,180,0.4)] text-[#1a1c1c]",
              "text-[10px] font-bold uppercase tracking-widest rounded-md",
              "hover:bg-[#f3f3f3] transition-colors duration-150"
            )}
          >
            Export Report
          </button>
        </div>
      }
    />
  );
}