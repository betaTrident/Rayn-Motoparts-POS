import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DashboardHeaderControlsProps {
  title: string;
  description: string;
  rangeValue: "1" | "7" | "30" | "custom";
  onRangeChange: (value: "1" | "7" | "30" | "custom") => void;
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
  const isCustomRange = rangeValue === "custom";

  return (
    <section className="rounded-2xl border border-slate-100 bg-gradient-to-br from-white to-slate-50/50 px-6 py-6 shadow-sm">
      <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Select
            value={rangeValue}
            onValueChange={(value) =>
              onRangeChange(value as "1" | "7" | "30" | "custom")
            }
          >
            <SelectTrigger className="h-10 w-44 cursor-pointer rounded-xl border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 focus:ring-primary/20">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="custom">Custom range</SelectItem>
            </SelectContent>
          </Select>

          <Input
            type="date"
            value={startDate}
            onChange={(event) => onStartDateChange(event.target.value)}
            className="h-10 w-40 rounded-xl border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 focus:ring-primary/20"
            disabled={!isCustomRange}
            aria-label="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-10 w-40 rounded-xl border-slate-200 bg-white text-slate-700 transition-colors hover:border-slate-300 focus:ring-primary/20"
            disabled={!isCustomRange}
            aria-label="End date"
          />
        </div>
      </div>
    </section>
  );
}
