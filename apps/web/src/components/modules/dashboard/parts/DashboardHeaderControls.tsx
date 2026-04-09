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
    <section className="rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            Dashboard
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={rangeValue}
            onValueChange={(value) =>
              onRangeChange(value as "1" | "7" | "30" | "custom")
            }
          >
            <SelectTrigger className="h-10 w-44 cursor-pointer rounded-xl border-slate-200 bg-white">
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
            className="h-10 w-40 rounded-xl border-slate-200 bg-white"
            disabled={!isCustomRange}
            aria-label="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="h-10 w-40 rounded-xl border-slate-200 bg-white"
            disabled={!isCustomRange}
            aria-label="End date"
          />
        </div>
      </div>
    </section>
  );
}