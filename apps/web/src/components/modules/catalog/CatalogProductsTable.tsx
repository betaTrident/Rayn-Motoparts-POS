import type { ReactNode } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Loader2 } from "lucide-react";

import type { Product } from "@/types/product.types";
import { DataTable } from "@/components/ui/data-table";

interface CatalogProductsTableProps {
  columns: ColumnDef<Product, unknown>[];
  data: Product[];
  isLoading: boolean;
  emptyState: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
}

export default function CatalogProductsTable({
  columns,
  data,
  isLoading,
  emptyState,
  toolbar,
  footer,
}: CatalogProductsTableProps) {
  const loadingState = (
    <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
      <Loader2 className="size-4 animate-spin" />
      Loading products...
    </div>
  );

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyState={emptyState}
      loadingState={loadingState}
      toolbar={toolbar}
      footer={footer}
      pageSize={10}
      pageSizeOptions={[10, 20, 30, 40]}
    />
  );
}
