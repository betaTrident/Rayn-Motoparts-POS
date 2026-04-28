import { useState, useMemo, useDeferredValue, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive, Loader2, Package, Plus, Tag, Wrench } from "lucide-react";

import type {
  Category,
  CategoryFormData,
  Product,
  ProductFormData,
  ProductSize,
} from "@/types/product.types";
import * as productService from "@/services/productService.service";
import { queryKeys } from "@/services/query/queryKeys";

import { cn } from "@/lib/utils";
import { parseApiError } from "@/lib/api-error";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
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
import { PageEmptyState, PageErrorState } from "@/components/ui/page-state";
import PageHeader from "@/components/layout/PageHeader";
import CatalogCategoriesPanel from "@/components/modules/catalog/CatalogCategoriesPanel";
import CatalogCategoryDialog from "@/components/modules/catalog/CatalogCategoryDialog";
import CatalogProductDialog from "@/components/modules/catalog/CatalogProductDialog";
import CatalogProductsTable from "@/components/modules/catalog/CatalogProductsTable";
import CatalogProductsToolbar from "@/components/modules/catalog/CatalogProductsToolbar";
import { createCatalogProductColumns } from "@/components/modules/catalog/catalog-product-columns";

const DEFAULT_SIZE_OPTIONS: { value: ProductSize; label: string }[] = [
  { value: "solo", label: "Solo" },
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const EMPTY_PRODUCT: ProductFormData = {
  sku: "",
  name: "",
  part_number: "",
  category: 0,
  description: "",
  cost_price: 0,
  selling_price: 0,
  variant_sku: "",
  variant_name: "",
  size: "medium",
  is_active: true,
  is_taxable: true,
  is_serialized: false,
};

const EMPTY_CATEGORY: CategoryFormData = {
  name: "",
  description: "",
  is_active: true,
};

const EMPTY_PRODUCTS: Product[] = [];
const EMPTY_CATEGORIES: Category[] = [];

type ProductFormErrors = Partial<Record<keyof ProductFormData, string>>;
type CategoryFormErrors = Partial<Record<keyof CategoryFormData, string>>;

function formatCurrency(amount: string | number) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(num);
}

function validateProductForm(data: ProductFormData): ProductFormErrors {
  const errors: ProductFormErrors = {};

  if (!data.name.trim()) {
    errors.name = "Product name is required.";
  }

  if (data.sku && data.sku.length > 80) {
    errors.sku = "SKU must be 80 characters or fewer.";
  }

  if (!data.category) {
    errors.category = "Select a category.";
  }

  if (!Number.isFinite(data.selling_price) || data.selling_price <= 0) {
    errors.selling_price = "Selling price must be greater than 0.";
  }

  if (!Number.isFinite(data.cost_price) || data.cost_price < 0) {
    errors.cost_price = "Cost price cannot be negative.";
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

export default function CatalogModulePage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<"products" | "categories">(
    "products"
  );

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<string>("all");
  const deferredSearch = useDeferredValue(search);

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

  const categoriesQuery = useQuery({
    queryKey: queryKeys.catalog.categories,
    queryFn: () => productService.getCategories(),
  });

  const productsQuery = useQuery({
    queryKey: queryKeys.catalog.products(),
    queryFn: () => productService.getProducts(),
  });

  const sizesQuery = useQuery({
    queryKey: queryKeys.catalog.sizes,
    queryFn: () => productService.getSizes(),
  });

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
        sku: parsed.fieldErrors.sku ?? prev.sku,
        name: parsed.fieldErrors.name ?? prev.name,
        part_number: parsed.fieldErrors.part_number ?? prev.part_number,
        category: parsed.fieldErrors.category ?? prev.category,
        cost_price: parsed.fieldErrors.cost_price ?? prev.cost_price,
        selling_price:
          parsed.fieldErrors.selling_price ??
          parsed.fieldErrors.price ??
          prev.selling_price,
        variant_sku: parsed.fieldErrors.variant_sku ?? prev.variant_sku,
        variant_name: parsed.fieldErrors.variant_name ?? prev.variant_name,
        is_active:
          parsed.fieldErrors.is_active ??
          parsed.fieldErrors.is_available ??
          prev.is_active,
        is_taxable: parsed.fieldErrors.is_taxable ?? prev.is_taxable,
        is_serialized: parsed.fieldErrors.is_serialized ?? prev.is_serialized,
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
        sku: parsed.fieldErrors.sku ?? prev.sku,
        name: parsed.fieldErrors.name ?? prev.name,
        part_number: parsed.fieldErrors.part_number ?? prev.part_number,
        category: parsed.fieldErrors.category ?? prev.category,
        cost_price: parsed.fieldErrors.cost_price ?? prev.cost_price,
        selling_price:
          parsed.fieldErrors.selling_price ??
          parsed.fieldErrors.price ??
          prev.selling_price,
        variant_sku: parsed.fieldErrors.variant_sku ?? prev.variant_sku,
        variant_name: parsed.fieldErrors.variant_name ?? prev.variant_name,
        is_active:
          parsed.fieldErrors.is_active ??
          parsed.fieldErrors.is_available ??
          prev.is_active,
        is_taxable: parsed.fieldErrors.is_taxable ?? prev.is_taxable,
        is_serialized: parsed.fieldErrors.is_serialized ?? prev.is_serialized,
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
    }) =>
      productService.updateProduct(id, {
        is_active: nextAvailability,
        is_available: nextAvailability,
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.catalog.all });
      toast.success(
        vars.nextAvailability
          ? "Product marked as active."
          : "Product marked as inactive."
      );
    },
    onError: (error) => {
      const parsed = parseApiError(
        error,
        "Unable to update product status. Please try again."
      );
      toast.error(parsed.message);
    },
  });

  const sizeOptions = sizesQuery.data?.length
    ? sizesQuery.data
    : DEFAULT_SIZE_OPTIONS;

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
    mutationFn: (data: CategoryFormData) => productService.createCategory(data),
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

  const categories = categoriesQuery.data ?? EMPTY_CATEGORIES;
  const products = productsQuery.data ?? EMPTY_PRODUCTS;

  const filteredProducts = useMemo(() => {
    const keyword = deferredSearch.trim().toLowerCase();
    return products.filter((p) => {
      if (keyword) {
        const matches =
          p.name.toLowerCase().includes(keyword) ||
          p.sku.toLowerCase().includes(keyword) ||
          p.part_number.toLowerCase().includes(keyword);
        if (!matches) return false;
      }
      if (categoryFilter !== "all" && p.category !== Number(categoryFilter))
        return false;
      if (availabilityFilter === "available" && !p.is_active) return false;
      if (availabilityFilter === "unavailable" && p.is_active) return false;
      return true;
    });
  }, [products, deferredSearch, categoryFilter, availabilityFilter]);

  const stats = useMemo(() => {
    const total = products.length;
    const active = products.filter((p) => p.is_active).length;
    const inactive = total - active;
    const avgSellingPrice =
      total > 0
        ? products.reduce(
            (sum, p) => sum + parseFloat(p.selling_price || "0"),
            0
          ) / total
        : 0;
    return {
      total,
      active,
      inactive,
      categories: categories.length,
      avgSellingPrice,
    };
  }, [products, categories]);

  const hasActiveFilters =
    !!search || categoryFilter !== "all" || availabilityFilter !== "all";

  function clearFilters() {
    setSearch("");
    setCategoryFilter("all");
    setAvailabilityFilter("all");
  }

  const openCreateProduct = useCallback(() => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setProductFormErrors({});
    setProductServerError(null);
    setProductDialogOpen(true);
  }, []);

  const openEditProduct = useCallback((product: Product) => {
    setEditingProduct(product);
    setProductFormErrors({});
    setProductServerError(null);
    setProductForm({
      sku: product.sku,
      name: product.name,
      part_number: product.part_number,
      category: product.category,
      description: product.description,
      cost_price: parseFloat(product.cost_price),
      selling_price: parseFloat(product.selling_price),
      variant_sku: product.variant_sku,
      variant_name: product.variant_name,
      size: product.size,
      is_active: product.is_active,
      is_taxable: product.is_taxable,
      is_serialized: product.is_serialized,
    });
    setProductDialogOpen(true);
  }, []);

  const openDeleteProduct = useCallback((product: Product) => {
    setDeletingProduct(product);
    setDeleteDialogOpen(true);
  }, []);

  const openCreateCategory = useCallback(() => {
    setEditingCategory(null);
    setCategoryForm(EMPTY_CATEGORY);
    setCategoryFormErrors({});
    setCategoryServerError(null);
    setCategoryDialogOpen(true);
  }, []);

  const openEditCategory = useCallback((category: Category) => {
    setEditingCategory(category);
    setCategoryFormErrors({});
    setCategoryServerError(null);
    setCategoryForm({
      name: category.name,
      description: category.description,
      is_active: category.is_active,
    });
    setCategoryDialogOpen(true);
  }, []);

  const openDeleteCategory = useCallback((category: Category) => {
    setDeletingCategory(category);
    setDeleteCategoryDialogOpen(true);
  }, []);

  function handleProductSubmit(e?: React.FormEvent | React.MouseEvent) {
    e?.preventDefault();

    const errors = validateProductForm(productForm);
    setProductFormErrors(errors);
    setProductServerError(null);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the highlighted product fields.");
      return;
    }

    const payload: ProductFormData = {
      ...productForm,
      price: productForm.selling_price,
      is_available: productForm.is_active,
      cost_price: productForm.cost_price || productForm.selling_price,
    };

    if (editingProduct) {
      updateProductMut.mutate({ id: editingProduct.id, data: payload });
    } else {
      createProductMut.mutate(payload);
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

  const toggleProductAvailability = useCallback(
    (product: Product) => {
      toggleAvailabilityMut.mutate({
        id: product.id,
        nextAvailability: !product.is_active,
      });
    },
    [toggleAvailabilityMut]
  );

  const productColumns = useMemo(
    () =>
      createCatalogProductColumns({
        onEdit: openEditProduct,
        onToggleAvailability: toggleProductAvailability,
        onDelete: openDeleteProduct,
      }),
    [openEditProduct, openDeleteProduct, toggleProductAvailability]
  );

  const productsToolbar = (
    <CatalogProductsToolbar
      search={search}
      onSearchChange={setSearch}
      categories={categories}
      categoryFilter={categoryFilter}
      onCategoryChange={setCategoryFilter}
      availabilityFilter={availabilityFilter}
      onAvailabilityChange={setAvailabilityFilter}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={clearFilters}
    />
  );

  const productsEmptyState = (
    <PageEmptyState
      icon={Package}
      title={hasActiveFilters ? "No matching products" : "No products yet"}
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
  );

  const isProductSaving =
    createProductMut.isPending || updateProductMut.isPending;
  const isCategorySaving =
    createCategoryMut.isPending || updateCategoryMut.isPending;

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Products"
          value={stats.total}
          icon={Package}
          accent="primary"
        />
        <StatCard
          label="Active Listings"
          value={stats.active}
          icon={Wrench}
          accent="green"
        />
        <StatCard
          label="Inactive Listings"
          value={stats.inactive}
          icon={Archive}
          accent="amber"
        />
        <StatCard
          label="Avg Sell Price"
          value={formatCurrency(stats.avgSellingPrice)}
          icon={Tag}
          accent="blue"
        />
      </div>

      <Card>
        <Tabs
          value={activeTab}
          onValueChange={(value) =>
            setActiveTab(value as "products" | "categories")
          }
          className="gap-0"
        >
          <div className="border-b px-4 pt-3">
            <TabsList variant="line" className="flex w-fit flex-wrap gap-5">
              <TabsTrigger value="products" className="gap-2.5">
                <Package className="size-4" />
                <span>Products</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[11px]"
                >
                  {stats.total}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="categories" className="gap-2.5">
                <Tag className="size-4" />
                <span>Categories</span>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2 py-0.5 text-[11px]"
                >
                  {stats.categories}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="products" className="p-4 pt-3">
            {productsQuery.isError ? (
              <PageErrorState
                title="Unable to load products"
                description="Please check your connection and try again."
                onRetry={() => productsQuery.refetch()}
              />
            ) : (
              <CatalogProductsTable
                columns={productColumns}
                data={filteredProducts}
                isLoading={productsQuery.isLoading}
                emptyState={productsEmptyState}
                toolbar={productsToolbar}
              />
            )}
          </TabsContent>

          <TabsContent value="categories" className="p-4 pt-3">
            <CatalogCategoriesPanel
              categories={categories}
              isLoading={categoriesQuery.isLoading}
              isError={categoriesQuery.isError}
              onRetry={() => categoriesQuery.refetch()}
              onCreateCategory={openCreateCategory}
              onEditCategory={openEditCategory}
              onDeleteCategory={openDeleteCategory}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <CatalogProductDialog
        open={productDialogOpen}
        onOpenChange={setProductDialogOpen}
        editingProduct={editingProduct}
        productForm={productForm}
        setProductForm={setProductForm}
        productFormErrors={productFormErrors}
        setProductFormErrors={setProductFormErrors}
        productServerError={productServerError}
        categories={categories}
        sizeOptions={sizeOptions}
        isSaving={isProductSaving}
        onSubmit={handleProductSubmit}
      />

      <CatalogCategoryDialog
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        editingCategory={editingCategory}
        categoryForm={categoryForm}
        setCategoryForm={setCategoryForm}
        categoryFormErrors={categoryFormErrors}
        setCategoryFormErrors={setCategoryFormErrors}
        categoryServerError={categoryServerError}
        isSaving={isCategorySaving}
        onSubmit={handleCategorySubmit}
      />

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
              {deleteProductMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              {deleteCategoryMut.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number | string;
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
            "flex size-9 items-center justify-center rounded-md",
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
