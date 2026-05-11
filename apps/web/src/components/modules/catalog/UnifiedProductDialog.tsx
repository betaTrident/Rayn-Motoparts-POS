import { useEffect, useState, type Dispatch, type SetStateAction } from "react";
import { Loader2, Lock } from "lucide-react";

import type { Category, Product, ProductFormData, ProductSize, TaxRateOption } from "@/types/product.types";
import type { InventoryStockRow } from "@/services/modules/inventory.service";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import ProductDetailsTab, { type ProductFormErrors } from "@/components/modules/catalog/parts/ProductDetailsTab";
import InventorySetupTab, { type StockConfigureFormState } from "@/components/modules/catalog/parts/InventorySetupTab";
import StockAdjustmentTab, { DEFAULT_STOCK_ADJUST_FORM, type StockAdjustFormState } from "@/components/modules/catalog/parts/StockAdjustmentTab";

interface UnifiedProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProduct: Product | null;
  productForm: ProductFormData;
  setProductForm: Dispatch<SetStateAction<ProductFormData>>;
  productFormErrors: ProductFormErrors;
  setProductFormErrors: Dispatch<SetStateAction<ProductFormErrors>>;
  productServerError: string | null;
  categories: Category[];
  sizeOptions: { value: ProductSize; label: string }[];
  taxRateOptions: TaxRateOption[];
  validateProductForm: (data: ProductFormData) => ProductFormErrors;
  onCreateProduct: (payload: ProductFormData) => Promise<Product>;
  onUpdateProduct: (id: number, payload: ProductFormData) => Promise<void>;
  onFetchStockByVariant: (variantId: number) => Promise<InventoryStockRow>;
  onConfigureStock: (stockId: number, form: StockConfigureFormState) => Promise<void>;
  onAdjustStock: (variantId: number, form: StockAdjustFormState) => Promise<void>;
}

export default function UnifiedProductDialog(props: UnifiedProductDialogProps) {
  const {
    open,
    onOpenChange,
    editingProduct,
    productForm,
    setProductForm,
    productFormErrors,
    setProductFormErrors,
    productServerError,
    categories,
    sizeOptions,
    taxRateOptions,
    validateProductForm,
    onCreateProduct,
    onUpdateProduct,
    onFetchStockByVariant,
    onConfigureStock,
    onAdjustStock,
  } = props;

  const [activeTab, setActiveTab] = useState<"details" | "adjustment" | "inventory">("details");
  const [createStage, setCreateStage] = useState<
    "details_pending_create" | "created_pending_adjustment" | "adjustment_saved_pending_inventory" | "completed"
  >("details_pending_create");
  const [createdVariantId, setCreatedVariantId] = useState<number | null>(null);
  const [stockRow, setStockRow] = useState<InventoryStockRow | null>(null);
  const [inventoryForm, setInventoryForm] = useState<StockConfigureFormState>({ reorder_point: "0", reorder_qty: "0", max_stock_level: "" });
  const [adjustmentForm, setAdjustmentForm] = useState<StockAdjustFormState>(DEFAULT_STOCK_ADJUST_FORM);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [adjustmentError, setAdjustmentError] = useState<string | null>(null);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingInventory, setIsSavingInventory] = useState(false);
  const [isSavingAdjustment, setIsSavingAdjustment] = useState(false);
  const [stockLoadError, setStockLoadError] = useState<string | null>(null);

  const mode = editingProduct ? "edit" : "create";
  const showGlobalFooter = mode === "edit" || createStage === "details_pending_create";

  useEffect(() => {
    if (!open) return;
    setActiveTab("details");
    setCreateStage("details_pending_create");
    setCreatedVariantId(null);
    setStockRow(null);
    setInventoryError(null);
    setAdjustmentError(null);
    setStockLoadError(null);
    setInventoryForm({ reorder_point: "0", reorder_qty: "0", max_stock_level: "" });
    setAdjustmentForm(DEFAULT_STOCK_ADJUST_FORM);
  }, [open, editingProduct]);

  useEffect(() => {
    if (stockRow) {
      setInventoryForm({
        reorder_point: String(stockRow.reorder_point),
        reorder_qty: String(stockRow.reorder_qty),
        max_stock_level: stockRow.max_stock_level == null ? "" : String(stockRow.max_stock_level),
      });
    }
  }, [stockRow]);

  useEffect(() => {
    if (!open || !editingProduct?.variant_id) return;
    onFetchStockByVariant(editingProduct.variant_id).then((row) => {
      setStockRow(row);
      setStockLoadError(null);
    }).catch(() => {
      setStockRow(null);
      setStockLoadError("Unable to load stock context for this variant.");
    });
  }, [open, editingProduct, onFetchStockByVariant]);

  function getLockHint(tab: "details" | "adjustment" | "inventory") {
    if (mode === "edit") return "";
    if (tab === "adjustment" && createStage === "details_pending_create") {
      return "Create product first to unlock stock adjustment.";
    }
    if (tab === "inventory" && createStage === "details_pending_create") {
      return "Create product first to unlock inventory setup.";
    }
    if (tab === "inventory" && createStage === "created_pending_adjustment") {
      return "Save stock adjustment first to continue.";
    }
    return "";
  }

  function canAccessTab(tab: "details" | "adjustment" | "inventory") {
    if (mode === "edit") return true;
    if (tab === "details") return createStage === "details_pending_create";
    if (tab === "adjustment") return createStage === "created_pending_adjustment";
    return createStage === "adjustment_saved_pending_inventory";
  }

  async function loadStockForVariant(variantId: number) {
    const delays = [200, 400, 800];
    let lastError: unknown = null;
    for (let index = 0; index < delays.length; index += 1) {
      try {
        const row = await onFetchStockByVariant(variantId);
        if (row.variant_id !== variantId) {
          throw new Error("Stock context mismatch detected for created variant.");
        }
        setStockLoadError(null);
        return row;
      } catch (error) {
        lastError = error;
        if (index < delays.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, delays[index]));
        }
      }
    }
    throw lastError instanceof Error ? lastError : new Error("Unable to load stock row for the created product.");
  }

  async function handlePrimaryProductAction() {
    const errors = validateProductForm(productForm);
    setProductFormErrors(errors);
    if (Object.keys(errors).length) return;

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, productForm);
      } else {
        const created = await onCreateProduct(productForm);
        if (created.variant_id) {
          setCreatedVariantId(created.variant_id);
          const row = await loadStockForVariant(created.variant_id);
          setStockRow(row);
          setCreateStage("created_pending_adjustment");
          setActiveTab("adjustment");
        }
      }
    } catch {
      // Errors are surfaced by parent mutation handlers and local error state.
    } finally {
      setIsSavingProduct(false);
    }
  }

  async function handleInventorySave() {
    if (!stockRow) return;
    setIsSavingInventory(true);
    setInventoryError(null);
    try {
      await onConfigureStock(stockRow.id, inventoryForm);
      if (mode === "create") onOpenChange(false);
      setCreateStage("completed");
    } catch (error) {
      setInventoryError(error instanceof Error ? error.message : "Failed to save reorder settings.");
    } finally {
      setIsSavingInventory(false);
    }
  }

  async function handleAdjustmentSave() {
    if (!stockRow) return;
    setIsSavingAdjustment(true);
    setAdjustmentError(null);
    try {
      await onAdjustStock(stockRow.variant_id, adjustmentForm);
      const refreshed = await loadStockForVariant(stockRow.variant_id);
      setStockRow(refreshed);
      if (mode === "create") {
        setCreateStage("adjustment_saved_pending_inventory");
        setActiveTab("inventory");
      }
    } catch (error) {
      setAdjustmentError(error instanceof Error ? error.message : "Failed to record stock adjustment.");
    } finally {
      setIsSavingAdjustment(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden bg-white p-0 sm:max-w-2xl">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="text-lg">{editingProduct ? `Edit: ${editingProduct.name}` : "Add Product"}</DialogTitle>
          <DialogDescription>{editingProduct ? "Manage details and inventory in one place." : "Create product details, then configure inventory."}</DialogDescription>
        </DialogHeader>

        <Separator />

        <Tabs value={activeTab} onValueChange={(tab) => setActiveTab(tab as "details" | "adjustment" | "inventory")} className="gap-0">
          <div className="border-b px-6 pt-2">
            <TabsList variant="line" className="flex w-fit gap-6">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TabsTrigger value="details" disabled={!canAccessTab("details")} className="gap-1.5">
                        {!canAccessTab("details") ? <Lock className="size-3" /> : null}
                        Details
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  {!canAccessTab("details") ? <TooltipContent>{getLockHint("details")}</TooltipContent> : null}
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TabsTrigger value="adjustment" disabled={!canAccessTab("adjustment")} className="gap-1.5">
                        {!canAccessTab("adjustment") ? <Lock className="size-3" /> : null}
                        Stock Adjustment
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  {!canAccessTab("adjustment") ? <TooltipContent>{getLockHint("adjustment")}</TooltipContent> : null}
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <TabsTrigger value="inventory" disabled={!canAccessTab("inventory")} className="gap-1.5">
                        {!canAccessTab("inventory") ? <Lock className="size-3" /> : null}
                        Inventory Setup
                      </TabsTrigger>
                    </div>
                  </TooltipTrigger>
                  {!canAccessTab("inventory") ? <TooltipContent>{getLockHint("inventory")}</TooltipContent> : null}
                </Tooltip>
              </TooltipProvider>
            </TabsList>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            <TabsContent value="details" className="m-0">
              <ProductDetailsTab
                productForm={productForm}
                setProductForm={setProductForm}
                productFormErrors={productFormErrors}
                setProductFormErrors={setProductFormErrors}
                productServerError={productServerError}
                categories={categories}
                sizeOptions={sizeOptions}
                taxRateOptions={taxRateOptions}
              />
            </TabsContent>
            <TabsContent value="adjustment" className="m-0">
              <StockAdjustmentTab
                stockRow={stockRow}
                form={adjustmentForm}
                isSaving={isSavingAdjustment}
                error={adjustmentError}
                helperText={mode === "create" ? "Set opening quantity for this new product." : undefined}
                submitLabel={mode === "create" ? "Save & Continue" : "Confirm Stock Adjustment"}
                onChange={setAdjustmentForm}
                onSubmit={handleAdjustmentSave}
              />
            </TabsContent>
            <TabsContent value="inventory" className="m-0">
              <InventorySetupTab
                stockRow={stockRow}
                form={inventoryForm}
                isSaving={isSavingInventory}
                error={inventoryError}
                onChange={setInventoryForm}
                onSubmit={handleInventorySave}
              />
            </TabsContent>
          </div>
        </Tabs>
        {stockLoadError ? (
          <>
            <Separator />
            <div className="px-6 py-3">
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                <p>{stockLoadError}</p>
                {createdVariantId ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={async () => {
                      try {
                        const row = await loadStockForVariant(createdVariantId);
                        setStockRow(row);
                        if (createStage === "details_pending_create") {
                          setCreateStage("created_pending_adjustment");
                          setActiveTab("adjustment");
                        }
                      } catch {
                        // keep existing error
                      }
                    }}
                  >
                    Retry Load Stock Context
                  </Button>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
        {showGlobalFooter ? (
          <>
            <Separator />
            <div className="flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full cursor-pointer sm:w-auto">Cancel</Button>
              <Button type="button" onClick={handlePrimaryProductAction} disabled={isSavingProduct} className="w-full cursor-pointer sm:w-auto">
                {isSavingProduct ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {editingProduct ? "Save Product Details" : "Create Product & Continue"}
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
