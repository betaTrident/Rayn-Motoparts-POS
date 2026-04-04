import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
    <Card>
      <CardContent className="space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          <div className="relative lg:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search transaction no, customer, staff"
              className="pl-9"
            />
          </div>

          <Select value={days} onValueChange={onDaysChange}>
            <SelectTrigger>
              <SelectValue placeholder="Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Today</SelectItem>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={onStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {statusOptions.map((item) => (
                <SelectItem key={item} value={item}>
                  {item.replaceAll("_", " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              {paymentOptions.map((item) => (
                <SelectItem key={item.code} value={item.code}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {activeFilters && (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <Button variant="outline" onClick={onClearFilters}>
              Clear Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
