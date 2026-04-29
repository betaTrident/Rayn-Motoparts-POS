import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  PageEmptyState,
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePosCatalog } from "@/hooks/modules/usePos";
import type { Product } from "@/types/product.types";

interface CartLine {
  product: Product;
  qty: number;
}

function formatCurrency(amount: number): string {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function PosModulePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");

  const { categoriesQuery, productsQuery } = usePosCatalog({
    categoryId: category === "all" ? undefined : Number(category),
    search,
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const totalItems = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines],
  );
  const subtotal = useMemo(
    () =>
      cartLines.reduce(
        (sum, line) => sum + Number(line.product.price) * line.qty,
        0,
      ),
    [cartLines],
  );

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev[product.id];
      return {
        ...prev,
        [product.id]: {
          product,
          qty: existing ? existing.qty + 1 : 1,
        },
      };
    });
  };

  const decrement = (productId: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) {
        return prev;
      }
      if (existing.qty <= 1) {
        const next = { ...prev };
        delete next[productId];
        return next;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          qty: existing.qty - 1,
        },
      };
    });
  };

  const increment = (productId: number) => {
    setCart((prev) => {
      const existing = prev[productId];
      if (!existing) {
        return prev;
      }
      return {
        ...prev,
        [productId]: {
          ...existing,
          qty: existing.qty + 1,
        },
      };
    });
  };

  const removeLine = (productId: number) => {
    setCart((prev) => {
      const next = { ...prev };
      delete next[productId];
      return next;
    });
  };

  return (
    <div className="flex flex-col xl:flex-row xl:mx-0 xl:-mr-6 xl:-mt-6 xl:-mb-6 min-h-[calc(100vh-64px)]">
      {/* Mobile-only Persistent Header & Tabs */}
      <div
        className={cn(
          "p-4 sm:p-6 space-y-4 xl:hidden",
          mobileTab === "cart" && "pb-0", // Less padding when showing cart
        )}
      >
        <PageHeader
          title="Point of Sale"
          description="Build a cart from available catalog products"
        />
        <div className="flex rounded-lg bg-muted p-1">
          <Button
            variant={mobileTab === "products" ? "secondary" : "ghost"}
            className="flex-1 rounded-md text-xs h-9 shadow-none"
            onClick={() => setMobileTab("products")}
          >
            Products
          </Button>
          <Button
            variant={mobileTab === "cart" ? "secondary" : "ghost"}
            className="flex-1 rounded-md text-xs h-9 shadow-none"
            onClick={() => setMobileTab("cart")}
          >
            Cart ({totalItems})
          </Button>
        </div>
      </div>

      {/* Left Column: Product Browser */}
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0",
          mobileTab === "cart" ? "hidden" : "flex",
          "xl:flex",
        )}
      >
        <div className="p-4 sm:p-6 xl:p-6 xl:!pl-0 space-y-6">
          <div className="hidden xl:block">
            <PageHeader
              title="Point of Sale"
              description="Build a cart from available catalog products"
            />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Product Browser</CardTitle>
              <CardDescription>
                Search and add sellable products to cart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search product name"
                />
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categories.map((item) => (
                      <SelectItem key={item.id} value={String(item.id)}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {productsQuery.isLoading ? (
                <PageLoadingState label="Loading products for POS..." />
              ) : productsQuery.isError ? (
                <PageErrorState
                  title="Unable to load POS products"
                  description="Please retry and check API availability."
                  onRetry={() => productsQuery.refetch()}
                />
              ) : products.length === 0 ? (
                <PageEmptyState
                  icon={ShoppingCart}
                  title="No sellable products found"
                  description="Adjust search/category filters or activate products in catalog."
                />
              ) : (
                <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3">
                  {products.map((product) => (
                    <div key={product.id} className="rounded-lg border p-3">
                      <div className="mb-3 space-y-1">
                        <p className="text-sm font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.category_name}
                        </p>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary">
                            {product.size_display}
                          </Badge>
                          <p className="text-sm font-medium">
                            {formatCurrency(Number(product.price))}
                          </p>
                        </div>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => addToCart(product)}
                      >
                        <Plus className="mr-2 size-4" />
                        Add to cart
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Right Column: Sticky Cart Sidebar */}
      <div
        className={cn(
          "w-full xl:w-[400px] xl:sticky xl:top-16 xl:h-[calc(100vh-64px)] xl:border-l xl:bg-card xl:shadow-sm",
          mobileTab === "products" ? "hidden" : "block",
          "xl:block",
        )}
      >
        <div className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between pt-6">
              <CardTitle>Cart</CardTitle>
              <Badge variant="outline" className="rounded-full">
                {totalItems} item{totalItems === 1 ? "" : "s"}
              </Badge>
            </div>
            <CardDescription>Items ready for checkout</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-4 px-6">
            {cartLines.length === 0 ? (
              <div className="py-12">
                <PageEmptyState
                  icon={ShoppingCart}
                  title="Cart is empty"
                  description="Add products to start."
                />
              </div>
            ) : (
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div
                    key={line.product.id}
                    className="rounded-lg border p-3 bg-muted/20"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {line.product.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(line.product.price))} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeLine(line.product.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => decrement(line.product.id)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm font-medium">
                          {line.qty}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => increment(line.product.id)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold">
                        {formatCurrency(Number(line.product.price) * line.qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>

          <div className="p-6 border-t bg-muted/10 space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-bold">
                <span>Total Amount</span>
                <span className="text-primary">{formatCurrency(subtotal)}</span>
              </div>
            </div>

            <Button className="w-full h-11 text-base shadow-md" disabled>
              Complete Checkout
            </Button>
            <p className="text-[10px] text-center text-muted-foreground leading-tight">
              Checkout submission is disabled until POS write endpoints are
              exposed in backend API.
            </p>
          </div>
        </div>
      </div>

      {/* Floating Mobile Summary (Hidden when on Cart tab) */}
      <div
        className={cn(
          "fixed inset-x-4 bottom-4 z-30 xl:hidden",
          mobileTab === "cart" ? "hidden" : "block",
        )}
      >
        <div className="rounded-xl border border-border/70 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Cart Summary</p>
              <p className="truncate text-xs text-muted-foreground">
                {totalItems} item{totalItems === 1 ? "" : "s"} •{" "}
                {formatCurrency(subtotal)}
              </p>
            </div>
            <Button className="shrink-0" onClick={() => setMobileTab("cart")}>
              View Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
