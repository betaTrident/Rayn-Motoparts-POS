import type { Dispatch, FormEvent, MouseEvent, SetStateAction } from "react";

import type {
  Category,
  Product,
  ProductFormData,
  ProductSize,
} from "@/types/product.types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;

interface CatalogProductDialogProps {
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
  isSaving: boolean;
  onSubmit: (
    event?: FormEvent<HTMLFormElement> | MouseEvent<HTMLButtonElement>
  ) => void;
}

export default function CatalogProductDialog({
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
  isSaving,
  onSubmit,
}: CatalogProductDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="px-6 pb-4 pt-6">
          <DialogTitle className="text-lg">
            {editingProduct ? "Edit Product" : "New Product"}
          </DialogTitle>
          <DialogDescription>
            {editingProduct
              ? "Update the product details below."
              : "Add a new motorpart or accessory."}
          </DialogDescription>
        </DialogHeader>

        <Separator />

        <form onSubmit={onSubmit} className="max-h-[70vh] space-y-4 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="space-y-1.5">
            <Label
              htmlFor="product-name"
              className="text-muted-foreground text-xs font-medium"
            >
              Product Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product-name"
              placeholder="e.g. Brake Pad Set"
              value={productForm.name}
              onChange={(e) => {
                setProductForm((f) => ({ ...f, name: e.target.value }));
                setProductFormErrors((prev) => ({
                  ...prev,
                  name: undefined,
                }));
              }}
              aria-invalid={!!productFormErrors.name}
              aria-describedby="product-name-hint product-name-error"
              className={cn(productFormErrors.name && "border-destructive")}
              required
            />
            <p id="product-name-hint" className="text-muted-foreground text-xs">
              Use a clear, customer-facing name.
            </p>
            {productFormErrors.name ? (
              <p id="product-name-error" className="text-destructive text-xs">
                {productFormErrors.name}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="product-sku"
                className="text-muted-foreground text-xs font-medium"
              >
                SKU
              </Label>
              <Input
                id="product-sku"
                placeholder="Auto-generated if blank"
                value={productForm.sku ?? ""}
                onChange={(e) => {
                  setProductForm((f) => ({ ...f, sku: e.target.value }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    sku: undefined,
                  }));
                }}
                aria-invalid={!!productFormErrors.sku}
                className={cn(productFormErrors.sku && "border-destructive")}
              />
              {productFormErrors.sku ? (
                <p className="text-destructive text-xs">
                  {productFormErrors.sku}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="product-part-number"
                className="text-muted-foreground text-xs font-medium"
              >
                Part Number
              </Label>
              <Input
                id="product-part-number"
                placeholder="Optional"
                value={productForm.part_number ?? ""}
                onChange={(e) => {
                  setProductForm((f) => ({ ...f, part_number: e.target.value }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    part_number: undefined,
                  }));
                }}
                aria-invalid={!!productFormErrors.part_number}
                className={cn(
                  productFormErrors.part_number && "border-destructive"
                )}
              />
              {productFormErrors.part_number ? (
                <p className="text-destructive text-xs">
                  {productFormErrors.part_number}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium">
                Category <span className="text-destructive">*</span>
              </Label>
              <Select
                value={productForm.category ? String(productForm.category) : ""}
                onValueChange={(val) => {
                  setProductForm((f) => ({ ...f, category: Number(val) }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    category: undefined,
                  }));
                }}
              >
                <SelectTrigger
                  className={cn(
                    "w-full cursor-pointer",
                    productFormErrors.category && "border-destructive"
                  )}
                  aria-invalid={!!productFormErrors.category}
                >
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.is_active)
                    .map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {productFormErrors.category ? (
                <p className="text-destructive text-xs">
                  {productFormErrors.category}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label className="text-muted-foreground text-xs font-medium">
                Size
              </Label>
              <Select
                value={productForm.size}
                onValueChange={(val) =>
                  setProductForm((f) => ({
                    ...f,
                    size: val as ProductSize,
                  }))
                }
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizeOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="product-cost-price"
                className="text-muted-foreground text-xs font-medium"
              >
                Cost Price (PHP)
              </Label>
              <Input
                id="product-cost-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={productForm.cost_price || ""}
                onChange={(e) => {
                  setProductForm((f) => ({
                    ...f,
                    cost_price: parseFloat(e.target.value) || 0,
                  }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    cost_price: undefined,
                  }));
                }}
                aria-invalid={!!productFormErrors.cost_price}
                className={cn(productFormErrors.cost_price && "border-destructive")}
              />
              {productFormErrors.cost_price ? (
                <p className="text-destructive text-xs">
                  {productFormErrors.cost_price}
                </p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="product-selling-price"
                className="text-muted-foreground text-xs font-medium"
              >
                Selling Price (PHP) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product-selling-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={productForm.selling_price || ""}
                onChange={(e) => {
                  setProductForm((f) => ({
                    ...f,
                    selling_price: parseFloat(e.target.value) || 0,
                  }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    selling_price: undefined,
                  }));
                }}
                aria-invalid={!!productFormErrors.selling_price}
                className={cn(productFormErrors.selling_price && "border-destructive")}
                required
              />
              {productFormErrors.selling_price ? (
                <p className="text-destructive text-xs">
                  {productFormErrors.selling_price}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label
                htmlFor="product-variant-sku"
                className="text-muted-foreground text-xs font-medium"
              >
                Variant SKU
              </Label>
              <Input
                id="product-variant-sku"
                placeholder="Auto-generated if blank"
                value={productForm.variant_sku ?? ""}
                onChange={(e) => {
                  setProductForm((f) => ({ ...f, variant_sku: e.target.value }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    variant_sku: undefined,
                  }));
                }}
                aria-invalid={!!productFormErrors.variant_sku}
                className={cn(productFormErrors.variant_sku && "border-destructive")}
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="product-variant-name"
                className="text-muted-foreground text-xs font-medium"
              >
                Variant Name
              </Label>
              <Input
                id="product-variant-name"
                placeholder="Optional"
                value={productForm.variant_name ?? ""}
                onChange={(e) => {
                  setProductForm((f) => ({ ...f, variant_name: e.target.value }));
                  setProductFormErrors((prev) => ({
                    ...prev,
                    variant_name: undefined,
                  }));
                }}
                aria-invalid={!!productFormErrors.variant_name}
                className={cn(productFormErrors.variant_name && "border-destructive")}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="product-desc"
              className="text-muted-foreground text-xs font-medium"
            >
              Description <span className="text-muted-foreground/50">(optional)</span>
            </Label>
            <Textarea
              id="product-desc"
              placeholder="Brief description of this item..."
              value={productForm.description}
              onChange={(e) =>
                setProductForm((f) => ({
                  ...f,
                  description: e.target.value,
                }))
              }
              rows={2}
              className="resize-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-muted-foreground text-xs">
                  Visible in catalog/POS
                </p>
              </div>
              <Switch
                checked={productForm.is_active}
                onCheckedChange={(checked) =>
                  setProductForm((f) => ({ ...f, is_active: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Taxable</p>
                <p className="text-muted-foreground text-xs">
                  Apply configured tax rate
                </p>
              </div>
              <Switch
                checked={productForm.is_taxable}
                onCheckedChange={(checked) =>
                  setProductForm((f) => ({ ...f, is_taxable: checked }))
                }
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Serialized</p>
                <p className="text-muted-foreground text-xs">
                  Track per unique serial
                </p>
              </div>
              <Switch
                checked={productForm.is_serialized}
                onCheckedChange={(checked) =>
                  setProductForm((f) => ({ ...f, is_serialized: checked }))
                }
              />
            </div>
          </div>

          {productServerError ? (
            <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
              {productServerError}
            </div>
          ) : null}
        </form>

        <Separator />

        <div className="flex flex-col-reverse gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full cursor-pointer sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={isSaving}
            className="w-full cursor-pointer sm:w-auto"
          >
            {isSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
            {editingProduct ? "Save Changes" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
