import { MoreHorizontal, Package, Pencil, Plus, Tag, Trash2 } from "lucide-react";

import type { Category } from "@/types/product.types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";

interface CatalogCategoriesPanelProps {
  categories: Category[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onCreateCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
}

export default function CatalogCategoriesPanel({
  categories,
  isLoading,
  isError,
  onRetry,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: CatalogCategoriesPanelProps) {
  if (isLoading) {
    return <PageLoadingState label="Loading categories..." />;
  }

  if (isError) {
    return (
      <PageErrorState
        title="Unable to load categories"
        description="Please refresh the data and try again."
        onRetry={onRetry}
      />
    );
  }

  if (categories.length === 0) {
    return (
      <PageEmptyState
        icon={Tag}
        title="No categories yet"
        description="Create categories to organize your motorparts and accessories"
        action={
          <Button
            size="sm"
            onClick={onCreateCategory}
            className="cursor-pointer"
          >
            <Plus className="mr-2 size-4" />
            Add Category
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-muted-foreground text-sm">
          Organize your products into categories. Only active categories appear
          on the POS.
        </p>
      </div>

      <Separator />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className={cn(
              "group relative rounded-lg border p-4 transition-all hover:shadow-md",
              cat.is_active
                ? "hover:border-primary/30 bg-card"
                : "bg-muted/30 opacity-75"
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex size-10 items-center justify-center rounded-md",
                    cat.is_active
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  <Tag className="size-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">{cat.name}</h3>
                  {cat.description ? (
                    <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                      {cat.description}
                    </p>
                  ) : null}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Open actions for category ${cat.name}`}
                    className="size-7 cursor-pointer opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onEditCategory(cat)}
                    className="cursor-pointer"
                  >
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteCategory(cat)}
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
                <Package className="size-3.5" />
                <span>
                  {cat.product_count} product
                  {cat.product_count !== 1 ? "s" : ""}
                </span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs font-normal",
                  cat.is_active
                    ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                    : "text-muted-foreground border-muted-foreground/20"
                )}
              >
                <span
                  className={cn(
                    "mr-1.5 inline-block size-1.5 rounded-full",
                    cat.is_active ? "bg-green-500" : "bg-muted-foreground/50"
                  )}
                />
                {cat.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={onCreateCategory}
          className="text-muted-foreground hover:border-primary/40 hover:text-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 transition-colors"
        >
          <Plus className="size-6" />
          <span className="text-sm font-medium">Add Category</span>
        </button>
      </div>
    </div>
  );
}
