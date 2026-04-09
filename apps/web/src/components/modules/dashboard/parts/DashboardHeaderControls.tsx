import PageHeader from "@/components/layout/PageHeader";
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
    <PageHeader
      title={title}
      description={description}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={rangeValue}
            onValueChange={(value) =>
              onRangeChange(value as "1" | "7" | "30" | "custom")
            }
          >
            <SelectTrigger className="w-44 cursor-pointer">
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
            className="w-40"
            disabled={!isCustomRange}
            aria-label="Start date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(event) => onEndDateChange(event.target.value)}
            className="w-40"
            disabled={!isCustomRange}
            aria-label="End date"
          />
        </div>
      }
    />
  );
}