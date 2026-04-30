import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentOption {
  code: string;
  name: string;
}

interface TransactionsFiltersProps {
  q: string;
  days: string;
  status: string;
  paymentMethod: string;
  statusOptions: string[];
  paymentOptions: PaymentOption[];
  activeFilters: boolean;
  onQueryChange: (value: string) => void;
  onDaysChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onPaymentMethodChange: (value: string) => void;
  onClearFilters: () => void;
}

export default function TransactionsFilters({
  q,
  days,
  status,
  paymentMethod,
  statusOptions,
  paymentOptions,
  activeFilters,
  onQueryChange,
  onDaysChange,
  onStatusChange,
  onPaymentMethodChange,
  onClearFilters,
}: TransactionsFiltersProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            value={q}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search transaction no, customer, or cashier..."
            className="h-9 rounded-md border-border/70 bg-card pl-10 pr-10 text-xs shadow-xs"
          />
          {q ? (
            <button
              type="button"
              onClick={() => onQueryChange("")}
              aria-label="Clear transaction search"
              className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={days} onValueChange={onDaysChange}>
            <SelectTrigger className="h-10 w-40 rounded-lg border-border/70 bg-card text-sm shadow-xs">
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger className="h-10 w-40 rounded-lg border-border/70 bg-card text-sm shadow-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger className="h-10 w-44 rounded-lg border-border/70 bg-card text-sm shadow-xs">
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Payments</SelectItem>
              {paymentOptions.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {activeFilters ? (
            <Button
              variant="outline"
              onClick={onClearFilters}
              className="h-10 rounded-lg border-border/70 bg-card px-3 text-sm"
            >
              <X className="mr-1.5 size-3.5" />
              Clear filters
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
