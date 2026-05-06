import type { Dispatch, SetStateAction } from "react";

import type {
  Category,
  ProductFormData,
  ProductSize,
} from "@/types/product.types";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

export type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;

interface ProductDetailsTabProps {
  productForm: ProductFormData;
  setProductForm: Dispatch<SetStateAction<ProductFormData>>;
  productFormErrors: ProductFormErrors;
  setProductFormErrors: Dispatch<SetStateAction<ProductFormErrors>>;
  productServerError: string | null;
  categories: Category[];
  sizeOptions: { value: ProductSize; label: string }[];
}

export default function ProductDetailsTab({
  productForm,
  setProductForm,
  productFormErrors,
  setProductFormErrors,
  productServerError,
  categories,
  sizeOptions,
}: ProductDetailsTabProps) {
  return (
    <div className="space-y-4 px-4 py-5 sm:px-6">
      <div className="space-y-1.5">
        <Label htmlFor="product-name" className="text-muted-foreground text-xs font-medium">Product Name <span className="text-destructive">*</span></Label>
        <Input id="product-name" placeholder="e.g. Brake Pad Set" value={productForm.name} onChange={(e) => { setProductForm((f) => ({ ...f, name: e.target.value })); setProductFormErrors((prev) => ({ ...prev, name: undefined })); }} aria-invalid={!!productFormErrors.name} className={cn(productFormErrors.name && "border-destructive")} required />
        {productFormErrors.name ? <p className="text-destructive text-xs">{productFormErrors.name}</p> : null}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="product-sku" className="text-muted-foreground text-xs font-medium">SKU</Label><Input id="product-sku" placeholder="Auto-generated if blank" value={productForm.sku ?? ""} onChange={(e) => { setProductForm((f) => ({ ...f, sku: e.target.value })); setProductFormErrors((prev) => ({ ...prev, sku: undefined })); }} aria-invalid={!!productFormErrors.sku} className={cn(productFormErrors.sku && "border-destructive")} /></div>
        <div className="space-y-1.5"><Label htmlFor="product-part-number" className="text-muted-foreground text-xs font-medium">Part Number</Label><Input id="product-part-number" placeholder="Optional" value={productForm.part_number ?? ""} onChange={(e) => { setProductForm((f) => ({ ...f, part_number: e.target.value })); setProductFormErrors((prev) => ({ ...prev, part_number: undefined })); }} aria-invalid={!!productFormErrors.part_number} className={cn(productFormErrors.part_number && "border-destructive")} /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label className="text-muted-foreground text-xs font-medium">Category <span className="text-destructive">*</span></Label><Select value={productForm.category ? String(productForm.category) : ""} onValueChange={(val) => { setProductForm((f) => ({ ...f, category: Number(val) })); setProductFormErrors((prev) => ({ ...prev, category: undefined })); }}><SelectTrigger className={cn("w-full cursor-pointer", productFormErrors.category && "border-destructive")}><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{categories.filter((c) => c.is_active).map((cat) => <SelectItem key={cat.id} value={String(cat.id)}>{cat.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-1.5"><Label className="text-muted-foreground text-xs font-medium">Size</Label><Select value={productForm.size} onValueChange={(val) => setProductForm((f) => ({ ...f, size: val as ProductSize }))}><SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger><SelectContent>{sizeOptions.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="product-cost-price" className="text-muted-foreground text-xs font-medium">Cost Price (PHP)</Label><Input id="product-cost-price" type="number" min="0" step="0.01" value={productForm.cost_price || ""} onChange={(e) => { setProductForm((f) => ({ ...f, cost_price: parseFloat(e.target.value) || 0 })); setProductFormErrors((prev) => ({ ...prev, cost_price: undefined })); }} aria-invalid={!!productFormErrors.cost_price} className={cn(productFormErrors.cost_price && "border-destructive")} /></div>
        <div className="space-y-1.5"><Label htmlFor="product-selling-price" className="text-muted-foreground text-xs font-medium">Selling Price (PHP) <span className="text-destructive">*</span></Label><Input id="product-selling-price" type="number" min="0" step="0.01" value={productForm.selling_price || ""} onChange={(e) => { setProductForm((f) => ({ ...f, selling_price: parseFloat(e.target.value) || 0 })); setProductFormErrors((prev) => ({ ...prev, selling_price: undefined })); }} aria-invalid={!!productFormErrors.selling_price} className={cn(productFormErrors.selling_price && "border-destructive")} required /></div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="product-variant-sku" className="text-muted-foreground text-xs font-medium">Variant SKU</Label><Input id="product-variant-sku" placeholder="Auto-generated if blank" value={productForm.variant_sku ?? ""} onChange={(e) => { setProductForm((f) => ({ ...f, variant_sku: e.target.value })); setProductFormErrors((prev) => ({ ...prev, variant_sku: undefined })); }} /></div>
        <div className="space-y-1.5"><Label htmlFor="product-variant-name" className="text-muted-foreground text-xs font-medium">Variant Name</Label><Input id="product-variant-name" placeholder="Optional" value={productForm.variant_name ?? ""} onChange={(e) => { setProductForm((f) => ({ ...f, variant_name: e.target.value })); setProductFormErrors((prev) => ({ ...prev, variant_name: undefined })); }} /></div>
      </div>
      <div className="space-y-1.5"><Label htmlFor="product-desc" className="text-muted-foreground text-xs font-medium">Description</Label><Textarea id="product-desc" placeholder="Brief description of this item..." value={productForm.description} onChange={(e) => setProductForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="resize-none" /></div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Active</p><p className="text-muted-foreground text-xs">Visible in catalog/POS</p></div><Switch checked={productForm.is_active} onCheckedChange={(checked) => setProductForm((f) => ({ ...f, is_active: checked }))} /></div>
        <div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Taxable</p><p className="text-muted-foreground text-xs">Apply configured tax rate</p></div><Switch checked={productForm.is_taxable} onCheckedChange={(checked) => setProductForm((f) => ({ ...f, is_taxable: checked }))} /></div>
        <div className="flex items-center justify-between rounded-lg border p-3"><div><p className="text-sm font-medium">Serialized</p><p className="text-muted-foreground text-xs">Track per unique serial</p></div><Switch checked={productForm.is_serialized} onCheckedChange={(checked) => setProductForm((f) => ({ ...f, is_serialized: checked }))} /></div>
      </div>
      {productServerError ? <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">{productServerError}</div> : null}
    </div>
  );
}
