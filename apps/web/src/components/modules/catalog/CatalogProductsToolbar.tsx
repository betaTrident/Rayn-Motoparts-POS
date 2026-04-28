import { Search, X } from "lucide-react";

import type { Category } from "@/types/product.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CatalogProductsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  categories: Category[];
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  availabilityFilter: string;
  onAvailabilityChange: (value: string) => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

export default function CatalogProductsToolbar({
  search,
  onSearchChange,
  categories,
  categoryFilter,
  onCategoryChange,
  availabilityFilter,
  onAvailabilityChange,
  hasActiveFilters,
  onClearFilters,
}: CatalogProductsToolbarProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3.5 top-1/2 size-4 -translate-y-1/2" />
          <Input
            placeholder="Search by name, SKU, or part number..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 rounded-lg border-border/70 bg-card pl-10 pr-10 text-sm shadow-xs placeholder:text-muted-foreground/80"
          />
          {search ? (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label="Clear product search"
              className="text-muted-foreground hover:text-foreground absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer transition-colors"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger
              className="h-10 min-w-44 rounded-lg border-border/70 bg-card text-sm shadow-xs"
            >
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={String(cat.id)}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={availabilityFilter}
            onValueChange={onAvailabilityChange}
          >
            <SelectTrigger
              className="h-10 min-w-40 rounded-lg border-border/70 bg-card text-sm shadow-xs"
            >
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-lg">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Active</SelectItem>
              <SelectItem value="unavailable">Inactive</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters ? (
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
