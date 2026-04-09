import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Package,
  Tag,
  MoreHorizontal,
  Loader2,
  Archive,
  ArchiveRestore,
  Wrench,
  Grid3X3,
  LayoutList,
  X,
} from "lucide-react";

import type {
  Product,
  ProductFormData,
  Category,
  CategoryFormData,
  ProductSize,
} from "@/types/product.types";
import * as productService from "@/services/productService.service";
import { queryKeys } from "@/services/query/queryKeys";

import { cn } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import PageHeader from "@/components/layout/PageHeader";

// ── Constants ──────────────────────────────────────────
const SIZE_OPTIONS: { value: ProductSize; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const EMPTY_PRODUCT: ProductFormData = {
  name: "",
  category: 0,
  description: "",
  price: 0,
  size: "medium",
  is_available: true,
};

const EMPTY_CATEGORY: CategoryFormData = {
  name: "",
  description: "",
  is_active: true,
};

type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;
type CategoryFormErrors = Partial<Record<keyof CategoryFormData, string>>;

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₱${num.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
}

function validateProductForm(data: ProductFormData): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Product name is required.";
  }

  if (!data.category) {
    errors.category = "Select a category.";
  }

  if (!Number.isFinite(data.price) || data.price <= 0) {
    errors.price = "Price must be greater than 0.";
  }

  return errors;
}

function validateCategoryForm(data: CategoryFormData): CategoryFormErrors {
  const errors: CategoryFormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Category name is required.";
  }

  return errors;
}

// ════════════════════════════════════════════════════════
// CatalogModulePage
// ════════════════════════════════════════════════════════
interface CatalogModulePageProps {
  embedded?: boolean;
}

export default function CatalogModulePage({ embedded = false }: CatalogModulePageProps) {
  const queryClient = useQueryClient();

  // ── View & Tab state ──
  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products"
  );
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // ── Filter state ──
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");

  // ── Dialog state ──
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] =
    useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null
  );
  const [productForm, setProductForm] =
    useState<ProductFormData>(EMPTY_PRODUCT);
  const [categoryForm, setCategoryForm] =
    useState<CategoryFormData>(EMPTY_CATEGORY);
  const [productFormErrors, setProductFormErrors] =
    useState<ProductFormErrors>({});
  const [categoryFormErrors, setCategoryFormErrors] =
    useState<CategoryFormErrors>({});
  const [productServerError, setProductServerError] = useState<string | null>(
    null
  );
  const [categoryServerError, setCategoryServerError] =
    useState<string | null>(null);

  // ── Queries ──
  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => productService.getCategories(),
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.products(),
    queryFn: () => productService.getProducts(),
  });

  // ── Mutations ──
  const createProductMut = useMutation({
    mutationFn: (data: ProductFormData) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      setProductDialogOpen(false);
      setProductServerError(null);
      setProductFormErrors({});
      toast.success("Product created successfully.");
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to create product. Please try again."
      );
      setProductServerError(parsed.message);
      setProductFormErrors((prev) => ({
        ...prev,
        name: parsed.fieldErrors.name ?? prev.name,
        category: parsed.fieldErrors.category ?? prev.category,
        price: parsed.fieldErrors.price ?? prev.price,
        size: parsed.fieldErrors.size ?? prev.size,
        description: parsed.fieldErrors.description ?? prev.description,
      }));
      toast.error(parsed.message);
    },
  });

  const updateProductMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<ProductFormData>;
    }) => productService.updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      setProductDialogOpen(false);
      setProductServerError(null);
      setProductFormErrors({});
      toast.success("Product updated successfully.");
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to update product. Please try again."
      );
      setProductServerError(parsed.message);
      setProductFormErrors((prev) => ({
        ...prev,
        name: parsed.fieldErrors.name ?? prev.name,
        category: parsed.fieldErrors.category ?? prev.category,
        price: parsed.fieldErrors.price ?? prev.price,
        size: parsed.fieldErrors.size ?? prev.size,
        description: parsed.fieldErrors.description ?? prev.description,
      }));
      toast.error(parsed.message);
    },
  });

  const toggleAvailabilityMut = useMutation({
    mutationFn: ({
      id,
      nextAvailability,
    }: {
      id: number;
      nextAvailability: boolean;
    }) => productService.updateProduct(id, { is_available: nextAvailability }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      toast.success(
        vars.nextAvailability
          ? "Product marked as available."
          : "Product marked as unavailable."
      );
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to update availability. Please try again."
      );
      toast.error(parsed.message);
    },
  });

  const deleteProductMut = useMutation({
    mutationFn: (id: number) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      setDeleteDialogOpen(false);
      toast.success("Product deleted successfully.");
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to delete product. Please try again."
      );
      toast.error(parsed.message);
    },
  });

  const createCategoryMut = useMutation({
    mutationFn: (data: CategoryFormData) =>
      productService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      setCategoryDialogOpen(false);
      setCategoryServerError(null);
      setCategoryFormErrors({});
      toast.success("Category created successfully.");
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to create category. Please try again."
      );
      setCategoryServerError(parsed.message);
      setCategoryFormErrors((prev) => ({
        ...prev,
        name: parsed.fieldErrors.name ?? prev.name,
        description: parsed.fieldErrors.description ?? prev.description,
      }));
      toast.error(parsed.message);
    },
  });

  const updateCategoryMut = useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CategoryFormData>;
    }) => productService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      setCategoryDialogOpen(false);
      setCategoryServerError(null);
      setCategoryFormErrors({});
      toast.success("Category updated successfully.");
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to update category. Please try again."
      );
      setCategoryServerError(parsed.message);
      setCategoryFormErrors((prev) => ({
        ...prev,
        name: parsed.fieldErrors.name ?? prev.name,
        description: parsed.fieldErrors.description ?? prev.description,
      }));
      toast.error(parsed.message);
    },
  });

  const deleteCategoryMut = useMutation({
    mutationFn: (id: number) => productService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      setDeleteCategoryDialogOpen(false);
      toast.success("Category deleted successfully.");
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to delete category. Please try again."
      );
      toast.error(parsed.message);
    },
  });

  // ── Derived data ──
  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()))
        return false;
      if (categoryFilter !== "all" && p.category !== Number(categoryFilter))
        return false;
      if (availabilityFilter === "available" && !p.is_available) return false;
      if (availabilityFilter === "unavailable" && p.is_available) return false;
      return true;
    });
  }, [products, search, categoryFilter, availabilityFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const available = products.filter((p) => p.is_available).length;
    const unavailable = total - available;
    return { total, available, unavailable, categories: categories.length };
  }, [products, categories]);

  const hasActiveFilters =
    search || categoryFilter !== "all" || availabilityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setAvailabilityFilter("all");
  }

  // ── Handlers ──
  function openCreateProduct() {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductFormErrors({});
    setProductServerError(null);
    setProductDialogOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setProductFormErrors({});
    setProductServerError(null);
    setProductForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: parseFloat(product.price),
      size: product.size,
      is_available: product.is_available,
    });
    setProductDialogOpen(true);
  }

  function openDeleteProduct(product: Product) {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  }

  function openCreateCategory() {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY);
    setCategoryFormErrors({});
    setCategoryServerError(null);
    setCategoryDialogOpen(true);
  }

  function openEditCategory(category: Category) {
    setEditingCategory(category);
    setCategoryFormErrors({});
    setCategoryServerError(null);
    setCategoryForm({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
    });
    setCategoryDialogOpen(true);
  }

  function openDeleteCategory(category: Category) {
    setDeletingCategory(category);
    setDeleteCategoryDialogOpen(true);
  }

  function handleProductSubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();

    const errors = validateProductForm(productForm);
    setProductFormErrors(errors);
    setProductServerError(null);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted product fields.");
      return;
    }

    if (editingProduct) {
      updateProductMut.mutate({ id: editingProduct.id, data: productForm });
    } else {
      createProductMut.mutate(productForm);
    }
  }

  function handleCategorySubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();

    const errors = validateCategoryForm(categoryForm);
    setCategoryFormErrors(errors);
    setCategoryServerError(null);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted category fields.");
      return;
    }

    if (editingCategory) {
      updateCategoryMut.mutate({
        id: editingCategory.id,
        data: categoryForm,
      });
    } else {
      createCategoryMut.mutate(categoryForm);
    }
  }

  function handleDeleteProduct() {
    if (deletingProduct) deleteProductMut.mutate(deletingProduct.id);
  }

  function handleDeleteCategory() {
    if (deletingCategory) deleteCategoryMut.mutate(deletingCategory.id);
  }

  function toggleProductAvailability(product: Product) {
    toggleAvailabilityMut.mutate({
      id: product.id,
      nextAvailability: !product.is_available,
    });
  }

  const isProductSaving =
    createProductMut.isPending || updateProductMut.isPending;
  const isCategorySaving =
    createCategoryMut.isPending || updateCategoryMut.isPending;

  // ════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {!embedded && (
        <PageHeader
          title="Products"
          description="Manage your motorparts and accessory categories"
          actions={
            activeTab === "categories" ? (
              <Button onClick={openCreateCategory} className="cursor-pointer">
                <Plus className="mr-2 size-4" />
                New Category
              </Button>
            ) : (
              <Button onClick={openCreateProduct} className="cursor-pointer">
                <Plus className="mr-2 size-4" />
                New Product
              </Button>
            )
          }
        />
      )}

      {embedded && (
        <div className="flex justify-end">
          {activeTab === "categories" ? (
            <Button onClick={openCreateCategory} className="cursor-pointer">
              <Plus className="mr-2 size-4" />
              New Category
            </Button>
          ) : (
            <Button onClick={openCreateProduct} className="cursor-pointer">
              <Plus className="mr-2 size-4" />
              New Product
            </Button>
          )}
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={stats.total}
          icon={Package}
          accent="primary"
        />
        <StatCard
          label="Available"
          value={stats.available}
          icon={Wrench}
          accent="green"
        />
        <StatCard
          label="Unavailable"
          value={stats.unavailable}
          icon={Archive}
          accent="amber"
        />
        <StatCard
          label="Categories"
          value={stats.categories}
          icon={Tag}
          accent="blue"
        />
      </div>

      {/* ── Tab Switcher + Toolbar ── */}
      <Card>
        {/* Tab Bar */}
        <div className="flex items-center justify-between border-b px-4">
          <div className="flex">
            <TabButton
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              icon={Package}
              label="Products"
              count={stats.total}
            />
            <TabButton
              active={activeTab === "categories"}
              onClick={() => setActiveTab("categories")}
              icon={Tag}
              label="Categories"
              count={stats.categories}
            />
          </div>

          {/* View toggle (products only) */}
          {activeTab === "products" && (
            <div className="hidden items-center gap-1 rounded-lg border p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Switch to table view"
                aria-pressed={viewMode === "table"}
                className={cn(
                  "cursor-pointer rounded-md p-1.5 transition-colors",
                  viewMode === "table"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <LayoutList className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Switch to grid view"
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "cursor-pointer rounded-md p-1.5 transition-colors",
                  viewMode === "grid"
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Grid3X3 className="size-4" />
              </button>
            </div>
          )}
        </div>

        {/* ══════════ PRODUCTS TAB ══════════ */}
        {activeTab === "products" && (
          <>
            {/* Toolbar */}
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 pl-9 pr-9"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Clear product search"
                    className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Select
                  value={categoryFilter}
                  onValueChange={setCategoryFilter}
                >
                  <SelectTrigger className="h-9 w-40 cursor-pointer text-xs">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
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
                  onValueChange={setAvailabilityFilter}
                >
                  <SelectTrigger className="h-9 w-36 cursor-pointer text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="unavailable">Unavailable</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground h-9 cursor-pointer text-xs"
                  >
                    <X className="mr-1 size-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Results count */}
            {hasActiveFilters && (
              <div className="px-4 pb-2">
                <p className="text-muted-foreground text-xs">
                  Showing {filteredProducts.length} of {products.length}{" "}
                  products
                </p>
              </div>
            )}

            <Separator />

            {/* Content */}
            {productsQuery.isLoading ? (
              <PageLoadingState label="Loading products..." />
            ) : productsQuery.isError ? (
              <PageErrorState
                title="Unable to load products"
                description="Please check your connection and try again."
                onRetry={() => productsQuery.refetch()}
              />
            ) : filteredProducts.length === 0 ? (
              <PageEmptyState
                icon={Package}
                title={
                  hasActiveFilters ? "No matching products" : "No products yet"
                }
                description={
                  hasActiveFilters
                    ? "Try adjusting your search or filters"
                    : "Create your first product to get started"
                }
                action={
                  hasActiveFilters ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearFilters}
                      className="cursor-pointer"
                    >
                      Clear Filters
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={openCreateProduct}
                      className="cursor-pointer"
                    >
                      <Plus className="mr-2 size-4" />
                      Add Product
                    </Button>
                  )
                }
              />
            ) : viewMode === "grid" ? (
              /* ── Grid View ── */
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onEdit={openEditProduct}
                    onDelete={openDeleteProduct}
                    onToggle={toggleProductAvailability}
                  />
                ))}
              </div>
            ) : (
              /* ── Table View ── */
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-4">Product</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="w-10 pr-4" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id} className="group">
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/8 text-primary flex size-9 items-center justify-center rounded-lg">
                              <Wrench className="size-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {product.name}
                              </p>
                              {product.description && (
                                <p className="text-muted-foreground max-w-48 truncate text-xs">
                                  {product.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal"
                          >
                            {product.category_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-muted-foreground text-sm">
                            {product.size_display}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="text-sm font-semibold">
                            {formatCurrency(product.price)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs font-normal",
                              product.is_available
                                ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
                                : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
                            )}
                          >
                            <span
                              className={cn(
                                "mr-1.5 inline-block size-1.5 rounded-full",
                                product.is_available
                                  ? "bg-green-500"
                                  : "bg-amber-500"
                              )}
                            />
                            {product.is_available ? "Available" : "Unavailable"}
                          </Badge>
                        </TableCell>
                        <TableCell className="pr-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Open actions for ${product.name}`}
                                className="size-8 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              <DropdownMenuItem
                                onClick={() => openEditProduct(product)}
                                className="cursor-pointer"
                              >
                                <Pencil className="mr-2 size-4" />
                                Edit Product
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  toggleProductAvailability(product)
                                }
                                className="cursor-pointer"
                              >
                                {product.is_available ? (
                                  <>
                                    <Archive className="mr-2 size-4" />
                                    Mark Unavailable
                                  </>
                                ) : (
                                  <>
                                    <ArchiveRestore className="mr-2 size-4" />
                                    Mark Available
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteProduct(product)}
                                variant="destructive"
                                className="cursor-pointer"
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer */}
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <p className="text-muted-foreground text-xs">
                  {filteredProducts.length} product
                  {filteredProducts.length !== 1 ? "s" : ""}
                </p>
              </div>
            )}
          </>
        )}

        {/* ══════════ CATEGORIES TAB ══════════ */}
        {activeTab === "categories" && (
          <>
            <div className="p-4">
              <p className="text-muted-foreground text-sm">
                Organize your products into categories. Only active categories
                appear on the POS.
              </p>
            </div>

            <Separator />

            {categoriesQuery.isLoading ? (
              <PageLoadingState label="Loading categories..." />
            ) : categoriesQuery.isError ? (
              <PageErrorState
                title="Unable to load categories"
                description="Please refresh the data and try again."
                onRetry={() => categoriesQuery.refetch()}
              />
            ) : categories.length === 0 ? (
              <PageEmptyState
                icon={Tag}
                title="No categories yet"
                description="Create categories to organize your motorparts and accessories"
                action={
                  <Button
                    size="sm"
                    onClick={openCreateCategory}
                    className="cursor-pointer"
                  >
                    <Plus className="mr-2 size-4" />
                    Add Category
                  </Button>
                }
              />
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className={cn(
                      "group relative rounded-xl border p-4 transition-all hover:shadow-md",
                      cat.is_active
                        ? "hover:border-primary/30 bg-card"
                        : "bg-muted/30 opacity-75"
                    )}
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex size-10 items-center justify-center rounded-lg",
                            cat.is_active
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <Tag className="size-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold">{cat.name}</h3>
                          {cat.description && (
                            <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
                              {cat.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Open actions for category ${cat.name}`}
                            className="size-7 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => openEditCategory(cat)}
                            className="cursor-pointer"
                          >
                            <Pencil className="mr-2 size-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => openDeleteCategory(cat)}
                            variant="destructive"
                            className="cursor-pointer"
                          >
                            <Trash2 className="mr-2 size-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    {/* Footer */}
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
                            cat.is_active
                              ? "bg-green-500"
                              : "bg-muted-foreground/50"
                          )}
                        />
                        {cat.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}

                {/* Add category card */}
                <button
                  type="button"
                  onClick={openCreateCategory}
                  className="text-muted-foreground hover:border-primary/40 hover:text-primary flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 transition-colors"
                >
                  <Plus className="size-6" />
                  <span className="text-sm font-medium">Add Category</span>
                </button>
              </div>
            )}
          </>
        )}
      </Card>

      {/* ══════════ PRODUCT DIALOG ══════════ */}
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="px-6 pt-6 pb-4">
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

          <form onSubmit={handleProductSubmit} className="space-y-4 px-6 py-5">
            {/* Name */}
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
                  setProductFormErrors((prev) => ({ ...prev, name: undefined }));
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

            {/* Category + Size */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-muted-foreground text-xs font-medium">
                  Category <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={
                    productForm.category ? String(productForm.category) : ""
                  }
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
                    {SIZE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price */}
            <div className="space-y-1.5">
              <Label
                htmlFor="product-price"
                className="text-muted-foreground text-xs font-medium"
              >
                Price (₱) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="product-price"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={productForm.price || ""}
                onChange={(e) => {
                  setProductForm((f) => ({
                    ...f,
                    price: parseFloat(e.target.value) || 0,
                  }));
                  setProductFormErrors((prev) => ({ ...prev, price: undefined }));
                }}
                aria-invalid={!!productFormErrors.price}
                aria-describedby="product-price-hint product-price-error"
                className={cn(productFormErrors.price && "border-destructive")}
                required
              />
              <p id="product-price-hint" className="text-muted-foreground text-xs">
                Enter the final selling price.
              </p>
              {productFormErrors.price ? (
                <p id="product-price-error" className="text-destructive text-xs">
                  {productFormErrors.price}
                </p>
              ) : null}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label
                htmlFor="product-desc"
                className="text-muted-foreground text-xs font-medium"
              >
                Description{" "}
                <span className="text-muted-foreground/50">(optional)</span>
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

            {/* Availability */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Available for sale</p>
                <p className="text-muted-foreground text-xs">
                  Show on the POS screen
                </p>
              </div>
              <Switch
                checked={productForm.is_available}
                onCheckedChange={(checked) =>
                  setProductForm((f) => ({ ...f, is_available: checked }))
                }
              />
            </div>

            {/* Error */}
            {productServerError && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                {productServerError}
              </div>
            )}
          </form>

          <Separator />

          <div className="flex items-center justify-end gap-2 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setProductDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleProductSubmit}
              disabled={isProductSaving}
              className="cursor-pointer"
            >
              {isProductSaving && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {editingProduct ? "Save Changes" : "Add Product"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════ CATEGORY DIALOG ══════════ */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-sm">
          <DialogHeader className="px-6 pt-6 pb-4">
            <DialogTitle className="text-lg">
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the category details."
                : "Create a new product category."}
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <form
            onSubmit={handleCategorySubmit}
            className="space-y-4 px-6 py-5"
          >
            <div className="space-y-1.5">
              <Label
                htmlFor="cat-name"
                className="text-muted-foreground text-xs font-medium"
              >
                Category Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cat-name"
                placeholder="e.g. Engine Parts"
                value={categoryForm.name}
                onChange={(e) => {
                  setCategoryForm((f) => ({ ...f, name: e.target.value }));
                  setCategoryFormErrors((prev) => ({ ...prev, name: undefined }));
                }}
                aria-invalid={!!categoryFormErrors.name}
                aria-describedby="cat-name-hint cat-name-error"
                className={cn(categoryFormErrors.name && "border-destructive")}
                required
              />
              <p id="cat-name-hint" className="text-muted-foreground text-xs">
                Keep it short and easy to scan.
              </p>
              {categoryFormErrors.name ? (
                <p id="cat-name-error" className="text-destructive text-xs">
                  {categoryFormErrors.name}
                </p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="cat-desc"
                className="text-muted-foreground text-xs font-medium"
              >
                Description{" "}
                <span className="text-muted-foreground/50">(optional)</span>
              </Label>
              <Textarea
                id="cat-desc"
                placeholder="Brief description..."
                value={categoryForm.description}
                onChange={(e) =>
                  setCategoryForm((f) => ({
                    ...f,
                    description: e.target.value,
                  }))
                }
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Active</p>
                <p className="text-muted-foreground text-xs">
                  Inactive categories are hidden from POS
                </p>
              </div>
              <Switch
                checked={categoryForm.is_active}
                onCheckedChange={(checked) =>
                  setCategoryForm((f) => ({ ...f, is_active: checked }))
                }
              />
            </div>

            {categoryServerError && (
              <div className="bg-destructive/10 text-destructive rounded-lg p-3 text-sm">
                {categoryServerError}
              </div>
            )}
          </form>

          <Separator />

          <div className="flex items-center justify-end gap-2 px-6 py-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoryDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCategorySubmit}
              disabled={isCategorySaving}
              className="cursor-pointer"
            >
              {isCategorySaving && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {editingCategory ? "Save Changes" : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════ DELETE PRODUCT DIALOG ══════════ */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="text-foreground font-semibold">
                {deletingProduct?.name}
              </span>
              ? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white"
            >
              {deleteProductMut.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ══════════ DELETE CATEGORY DIALOG ══════════ */}
      <AlertDialog
        open={deleteCategoryDialogOpen}
        onOpenChange={setDeleteCategoryDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the{" "}
              <span className="text-foreground font-semibold">
                {deletingCategory?.name}
              </span>{" "}
              category? Products using this category cannot be deleted if they
              still reference it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive hover:bg-destructive/90 cursor-pointer text-white"
            >
              {deleteCategoryMut.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Sub‑components
// ════════════════════════════════════════════════════════

/** Mini stat card for the top row */
function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  accent: "primary" | "green" | "amber" | "blue";
}) {
  const colors = {
    primary: "bg-primary/10 text-primary",
    green:
      "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  };

  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-3 pb-0">
        <div
          className={cn(
            "flex size-9 items-center justify-center rounded-lg",
            colors[accent]
          )}
        >
          <Icon className="size-4" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">{value}</p>
          <p className="text-muted-foreground mt-1 text-xs">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Custom tab button (underline style) */
function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium transition-colors",
        active
          ? "text-primary after:bg-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className="size-4" />
      {label}
      <span
        className={cn(
          "ml-0.5 rounded-full px-1.5 py-0.5 text-xs",
          active
            ? "bg-primary/10 text-primary"
            : "bg-muted text-muted-foreground"
        )}
      >
        {count}
      </span>
    </button>
  );
}

/** Product grid card */
function ProductCard({
  product,
  onEdit,
  onDelete,
  onToggle,
}: {
  product: Product;
  onEdit: (p: Product) => void;
  onDelete: (p: Product) => void;
  onToggle: (p: Product) => void;
}) {
  return (
    <div className="hover:border-primary/20 group relative rounded-xl border bg-card p-4 transition-all hover:shadow-md">
      {/* Top row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary/8 text-primary flex size-10 items-center justify-center rounded-lg">
            <Wrench className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{product.name}</p>
            <p className="text-muted-foreground text-xs">
              {product.category_name}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Open actions for ${product.name}`}
              className="size-7 cursor-pointer opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => onEdit(product)}
              className="cursor-pointer"
            >
              <Pencil className="mr-2 size-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onToggle(product)}
              className="cursor-pointer"
            >
              {product.is_available ? (
                <>
                  <Archive className="mr-2 size-4" />
                  Mark Unavailable
                </>
              ) : (
                <>
                  <ArchiveRestore className="mr-2 size-4" />
                  Mark Available
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(product)}
              variant="destructive"
              className="cursor-pointer"
            >
              <Trash2 className="mr-2 size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      {product.description && (
        <p className="text-muted-foreground mt-3 line-clamp-2 text-xs">
          {product.description}
        </p>
      )}

      {/* Footer */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base font-bold">
            {formatCurrency(product.price)}
          </span>
          <span className="text-muted-foreground text-xs">
            / {product.size_display}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-xs font-normal",
            product.is_available
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
              : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400"
          )}
        >
          <span
            className={cn(
              "mr-1 inline-block size-1.5 rounded-full",
              product.is_available ? "bg-green-500" : "bg-amber-500"
            )}
          />
          {product.is_available ? "Available" : "Unavailable"}
        </Badge>
      </div>
    </div>
  );
}

