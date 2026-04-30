import { useDeferredValue, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, PackageSearch, SlidersHorizontal } from "lucide-react";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageErrorState } from "@/components/ui/page-state";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseApiError } from "@/lib/api-error";
import {
  useInventoryStock,
  useInventorySummary,
  useStockAdjust,
  useStockConfigure,
  useStockMovements,
} from "@/hooks/modules/useInventory";
import type {
  InventoryStockRow,
  StockStatus,
  StockAdjustPayload,
  StockConfigurePayload,
} from "@/services/modules/inventory.service";
import InventoryStatsStrip from "./parts/InventoryStatsStrip";
import InventoryStockTable from "./parts/InventoryStockTable";
import StockAdjustSheet from "./parts/StockAdjustSheet";
import StockConfigureSheet from "./parts/StockConfigureSheet";
import StockMovementTable from "./parts/StockMovementTable";

export default function InventoryModulePage() {
  const [activeTab, setActiveTab] = useState<"stock" | "movements">("stock");
  const [stockSearch, setStockSearch] = useState("");
  const [stockStatus, setStockStatus] = useState<StockStatus | "all">("all");
  const [stockCategory, setStockCategory] = useState("all");
  const [movementSku, setMovementSku] = useState("");
  const [movementType, setMovementType] = useState("all");
  const deferredStockSearch = useDeferredValue(stockSearch);
  const deferredMovementSku = useDeferredValue(movementSku);

  const [adjustOpen, setAdjustOpen] = useState(false);
  const [configureOpen, setConfigureOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState<InventoryStockRow | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [configureError, setConfigureError] = useState<string | null>(null);

  const summaryQuery = useInventorySummary();
  const stockQuery = useInventoryStock({
    search: deferredStockSearch,
    status: stockStatus,
    category: stockCategory,
    pageSize: 500,
  });
  const stockSelectorQuery = useInventoryStock({ pageSize: 500 });
  const movementQuery = useStockMovements({
    variant_sku: deferredMovementSku,
    movement_type: movementType,
    pageSize: 500,
  });
  const adjustMutation = useStockAdjust();
  const configureMutation = useStockConfigure();

  const stockRows = stockQuery.data?.results ?? [];
  const stockSelectorRows = stockSelectorQuery.data?.results ?? [];
  const categories = stockQuery.data?.categories ?? [];
  const movementRows = movementQuery.data?.results ?? [];
  const movementTypes = movementQuery.data?.movementTypes ?? [];

  function clearStockFilters() {
    setStockSearch("");
    setStockStatus("all");
    setStockCategory("all");
  }

  function clearMovementFilters() {
    setMovementSku("");
    setMovementType("all");
  }

  function openAdjust(row?: InventoryStockRow) {
    setSelectedStock(row ?? null);
    setAdjustError(null);
    setAdjustOpen(true);
  }

  function openConfigure(row: InventoryStockRow) {
    setSelectedStock(row);
    setConfigureError(null);
    setConfigureOpen(true);
  }

  function submitAdjustment(payload: StockAdjustPayload) {
    setAdjustError(null);
    adjustMutation.mutate(payload, {
      onSuccess: () => {
        setAdjustOpen(false);
        toast.success("Stock adjustment saved.");
      },
      onError: (error) => {
        const parsed = parseApiError(error, "Unable to save adjustment.");
        setAdjustError(parsed.message);
        toast.error(parsed.message);
      },
    });
  }

  function submitConfigure(id: number, payload: StockConfigurePayload) {
    setConfigureError(null);
    configureMutation.mutate(
      { id, payload },
      {
        onSuccess: () => {
          setConfigureOpen(false);
          toast.success("Reorder settings updated.");
        },
        onError: (error) => {
          const parsed = parseApiError(error, "Unable to update reorder settings.");
          setConfigureError(parsed.message);
          toast.error(parsed.message);
        },
      }
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory Control"
        description="Monitor stock levels, adjust inventory, and review movement history"
        actions={
          <Button onClick={() => openAdjust()} className="cursor-pointer">
            <SlidersHorizontal className="mr-2 size-4" />
            Adjust Stock
          </Button>
        }
      />

      {summaryQuery.isError ? (
        <PageErrorState
          title="Unable to load inventory summary"
          description="Please check your connection and try again."
          onRetry={() => summaryQuery.refetch()}
        />
      ) : (
        <InventoryStatsStrip summary={summaryQuery.data} />
      )}

      <Card className="pt-0 pb-0">
        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as "stock" | "movements")}
          className="gap-0"
        >
          <div className="border-b px-4 pt-3">
            <TabsList variant="line" className="flex w-fit flex-wrap gap-5">
              <TabsTrigger value="stock" className="gap-2.5">
                <PackageSearch className="size-4" />
                <span>Stock Levels</span>
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                  {stockQuery.data?.pagination.totalCount ?? stockRows.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="movements" className="gap-2.5">
                <ClipboardList className="size-4" />
                <span>Stock Movements</span>
                <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[11px]">
                  {movementQuery.data?.pagination.totalCount ?? movementRows.length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="stock" className="p-4 pt-3">
            {stockQuery.isError ? (
              <PageErrorState
                title="Unable to load stock levels"
                description="Please check your connection and try again."
                onRetry={() => stockQuery.refetch()}
              />
            ) : (
              <InventoryStockTable
                data={stockRows}
                categories={categories}
                search={stockSearch}
                status={stockStatus}
                category={stockCategory}
                isLoading={stockQuery.isLoading}
                onSearchChange={setStockSearch}
                onStatusChange={(value) => setStockStatus(value as StockStatus | "all")}
                onCategoryChange={setStockCategory}
                onClearFilters={clearStockFilters}
                onConfigure={openConfigure}
                onAdjust={openAdjust}
              />
            )}
          </TabsContent>

          <TabsContent value="movements" className="p-4 pt-3">
            {movementQuery.isError ? (
              <PageErrorState
                title="Unable to load movement log"
                description="Please check your connection and try again."
                onRetry={() => movementQuery.refetch()}
              />
            ) : (
              <StockMovementTable
                data={movementRows}
                movementTypes={movementTypes}
                variantSku={movementSku}
                movementType={movementType}
                isLoading={movementQuery.isLoading}
                onVariantSkuChange={setMovementSku}
                onMovementTypeChange={setMovementType}
                onClearFilters={clearMovementFilters}
              />
            )}
          </TabsContent>
        </Tabs>
      </Card>

      <StockAdjustSheet
        open={adjustOpen}
        onOpenChange={setAdjustOpen}
        stockRows={stockSelectorRows}
        selectedStock={selectedStock}
        isSaving={adjustMutation.isPending}
        error={adjustError}
        onSubmit={submitAdjustment}
      />

      <StockConfigureSheet
        open={configureOpen}
        onOpenChange={setConfigureOpen}
        stock={selectedStock}
        isSaving={configureMutation.isPending}
        error={configureError}
        onSubmit={submitConfigure}
      />
    </div>
  );
}
