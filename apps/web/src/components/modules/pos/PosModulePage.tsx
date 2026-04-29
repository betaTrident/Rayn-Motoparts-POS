import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import PageHeader from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const { categoriesQuery, productsQuery } = usePosCatalog({
    categoryId: category === "all" ? undefined : Number(category),
    search,
  });

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const totalItems = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines]
  );
  const subtotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + Number(line.product.price) * line.qty, 0),
    [cartLines]
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
    <div className="space-y-6">
      <PageHeader
        title="Point of Sale"
        description="Build a cart from available catalog products"
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,1fr)]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Product Browser</CardTitle>
            <CardDescription>Search and add sellable products to cart</CardDescription>
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
              <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {products.map((product) => (
                  <div key={product.id} className="rounded-lg border p-3">
                    <div className="mb-3 space-y-1">
                      <p className="text-sm font-semibold">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category_name}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{product.size_display}</Badge>
                        <p className="text-sm font-medium">{formatCurrency(Number(product.price))}</p>
                      </div>
                    </div>
                    <Button className="w-full" onClick={() => addToCart(product)}>
                      <Plus className="mr-2 size-4" />
                      Add to cart
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="xl:sticky xl:top-20 xl:self-start">
          <CardHeader className="pb-3">
            <CardTitle>Cart</CardTitle>
            <CardDescription>
              {totalItems} item{totalItems === 1 ? "" : "s"} selected
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {cartLines.length === 0 ? (
              <PageEmptyState
                icon={ShoppingCart}
                title="Cart is empty"
                description="Add products from the browser to start a checkout."
              />
            ) : (
              <div className="space-y-3">
                {cartLines.map((line) => (
                  <div key={line.product.id} className="rounded-lg border p-3">
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">{line.product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(Number(line.product.price))} each
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => removeLine(line.product.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => decrement(line.product.id)}
                        >
                          <Minus className="size-3.5" />
                        </Button>
                        <span className="w-6 text-center text-sm">{line.qty}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-7"
                          onClick={() => increment(line.product.id)}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      <p className="text-sm font-semibold sm:text-right">
                        {formatCurrency(Number(line.product.price) * line.qty)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border p-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <Button className="mt-3 w-full" disabled>
                Complete Checkout (API pending)
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">
                Checkout submission is disabled until POS write endpoints are exposed in backend API.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed inset-x-4 bottom-4 z-30 xl:hidden">
        <div className="rounded-xl border border-border/70 bg-white/95 p-3 shadow-lg backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">Cart Summary</p>
              <p className="truncate text-xs text-muted-foreground">
                {totalItems} item{totalItems === 1 ? "" : "s"} • {formatCurrency(subtotal)}
              </p>
            </div>
            <Button className="shrink-0" disabled>
              Checkout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
