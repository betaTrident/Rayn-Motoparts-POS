import {
  CheckCircle2,
  CircleDollarSign,
  Printer,
  Minus,
  Plus,
  ShoppingCart,
  Trash2,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { parseApiError } from "@/lib/api-error";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  useCheckout,
  useOpenCashSession,
  usePosBootstrap,
  usePosCatalog,
} from "@/hooks/modules/usePos";
import type { PosCheckoutResponse, PosPaymentMethod } from "@/services/modules/pos.service";
import type { Product } from "@/types/product.types";
import RaynReceiptLogo from "@/assets/RAYN-LOGO.svg";

interface CartLine {
  product: Product;
  qty: number;
}

interface ReceiptLineSnapshot {
  name: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

interface ReceiptDisplayData {
  transactionNumber: string;
  receiptNumber: string;
  customerName: string;
  issuedAt: string;
  cashierName: string;
  lines: ReceiptLineSnapshot[];
  subtotal: number;
  totalAmount: number;
  amountTendered: number;
  changeGiven: number;
  paymentMethodName: string;
  referenceNumber: string | null;
}

function formatCurrency(amount: number): string {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function CheckoutMethodHint({
  paymentMethod,
  amountTendered,
  totalAmount,
}: {
  paymentMethod: PosPaymentMethod | null;
  amountTendered: number;
  totalAmount: number;
}) {
  if (!paymentMethod) {
    return null;
  }

  if (paymentMethod.code.toUpperCase() === "CASH") {
    return (
      <p className="text-xs text-muted-foreground">
        Cash checkout supports overpayment and change.
      </p>
    );
  }

  return (
    <p className="text-xs text-muted-foreground">
      Non-cash checkout must match the exact total.
      {amountTendered !== totalAmount ? " Update the amount to proceed." : ""}
    </p>
  );
}

export default function PosModulePage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [cart, setCart] = useState<Record<number, CartLine>>({});
  const [mobileTab, setMobileTab] = useState<"products" | "cart">("products");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [openSessionDialogOpen, setOpenSessionDialogOpen] = useState(false);
  const [openSessionBalanceInput, setOpenSessionBalanceInput] = useState("0.00");
  const [openSessionError, setOpenSessionError] = useState("");
  const [receiptResult, setReceiptResult] = useState<PosCheckoutResponse | null>(null);
  const [receiptDisplay, setReceiptDisplay] = useState<ReceiptDisplayData | null>(null);
  const [customerName, setCustomerName] = useState("Walk-in Customer");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [amountTenderedInput, setAmountTenderedInput] = useState("");

  const { categoriesQuery, productsQuery } = usePosCatalog({
    categoryId: category === "all" ? undefined : Number(category),
    search,
  });
  const bootstrapQuery = usePosBootstrap();
  const checkoutMutation = useCheckout();
  const openSessionMutation = useOpenCashSession();

  const categories = categoriesQuery.data ?? [];
  const products = productsQuery.data ?? [];
  const cashSession = bootstrapQuery.data?.cashSession ?? null;
  const paymentMethods = bootstrapQuery.data?.paymentMethods ?? [];

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

  const selectedPaymentMethod = useMemo(
    () =>
      paymentMethods.find(
        (method) => String(method.id) === selectedPaymentMethodId,
      ) ?? null,
    [paymentMethods, selectedPaymentMethodId],
  );

  const amountTendered = Number(amountTenderedInput || 0);
  const isCashPayment = selectedPaymentMethod?.code.toUpperCase() === "CASH";
  const changeGiven =
    amountTendered > subtotal && isCashPayment ? amountTendered - subtotal : 0;

  useEffect(() => {
    if (!checkoutOpen) {
      return;
    }

    const defaultMethod = paymentMethods[0];
    setCheckoutError("");
    setReferenceNumber("");
    setAmountTenderedInput(subtotal > 0 ? subtotal.toFixed(2) : "");
    if (defaultMethod && !selectedPaymentMethodId) {
      setSelectedPaymentMethodId(String(defaultMethod.id));
    }
  }, [checkoutOpen, paymentMethods, selectedPaymentMethodId, subtotal]);

  useEffect(() => {
    if (!checkoutOpen || !selectedPaymentMethod || isCashPayment) {
      return;
    }
    setAmountTenderedInput(subtotal > 0 ? subtotal.toFixed(2) : "");
  }, [checkoutOpen, selectedPaymentMethod, isCashPayment, subtotal]);

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

  const resetSale = () => {
    setCart({});
    setCheckoutError("");
    setCustomerName("Walk-in Customer");
    setSelectedPaymentMethodId(paymentMethods[0] ? String(paymentMethods[0].id) : "");
    setAmountTenderedInput("");
    setReferenceNumber("");
    setMobileTab("products");
  };

  const handleCheckoutSubmit = async () => {
    if (!cashSession) {
      setCheckoutError("An open cash session is required before checkout.");
      return;
    }

    if (cartLines.length === 0) {
      setCheckoutError("Add at least one item before checkout.");
      return;
    }

    if (!selectedPaymentMethod) {
      setCheckoutError("Select a payment method.");
      return;
    }

    if (!isCashPayment && !referenceNumber.trim()) {
      setCheckoutError("Reference number is required for non-cash payments.");
      return;
    }

    setCheckoutError("");

    try {
      const result = await checkoutMutation.mutateAsync({
        cash_session_id: cashSession.id,
        customer_name: customerName.trim() || "Walk-in Customer",
        items: cartLines.map((line) => ({
          variant_id: line.product.variant_id ?? 0,
          qty: line.qty,
        })),
        payments: [
          {
            payment_method_id: selectedPaymentMethod.id,
            amount: amountTendered,
            reference_number: referenceNumber.trim() || null,
          },
        ],
        notes: "",
      });

      const receiptNumber =
        result.receipt?.receiptNumber ??
        `TEMP-${result.transaction.transactionNumber}`;
      const preparedCustomerName = customerName.trim() || "Walk-in Customer";
      const currentLines: ReceiptLineSnapshot[] = cartLines.map((line) => ({
        name: line.product.name,
        qty: line.qty,
        unitPrice: Number(line.product.price),
        lineTotal: Number(line.product.price) * line.qty,
      }));

      setReceiptDisplay({
        transactionNumber: result.transaction.transactionNumber,
        receiptNumber,
        customerName: preparedCustomerName,
        issuedAt: new Date().toISOString(),
        cashierName: "POS Cashier",
        lines: currentLines,
        subtotal: result.transaction.subtotal,
        totalAmount: result.transaction.totalAmount,
        amountTendered: result.transaction.amountTendered,
        changeGiven: result.transaction.changeGiven,
        paymentMethodName: selectedPaymentMethod.name,
        referenceNumber:
          !isCashPayment && referenceNumber.trim()
            ? referenceNumber.trim()
            : null,
      });
      setReceiptResult(result);
      setCheckoutOpen(false);
      setReceiptDialogOpen(true);
      resetSale();
      toast.success(`Sale ${result.transaction.transactionNumber} completed.`);
    } catch (error) {
      const parsed = parseApiError(error, "Unable to complete checkout.");
      setCheckoutError(parsed.message);
    }
  };

  const checkoutBlockedReason = !cashSession
    ? "Open a cash session before taking payments."
    : cartLines.length === 0
      ? "Add products to build a sale."
      : null;

  const handleOpenSession = async () => {
    setOpenSessionError("");

    try {
      const result = await openSessionMutation.mutateAsync({
        opening_balance: Number(openSessionBalanceInput || 0),
      });
      setOpenSessionDialogOpen(false);
      setOpenSessionBalanceInput("0.00");
      toast.success(
        result.created
          ? `Cash session ${result.cashSession.sessionCode} opened.`
          : `Using existing session ${result.cashSession.sessionCode}.`,
      );
    } catch (error) {
      const parsed = parseApiError(error, "Unable to open a cash session.");
      setOpenSessionError(parsed.message);
    }
  };

  // Compact session status for header
  const sessionStatus = (
    <div className="flex items-center gap-3">
      {bootstrapQuery.isLoading ? (
        <div className="flex h-12 items-center gap-2 rounded-md border bg-muted/20 px-4 py-2 animate-pulse">
          <div className="h-5 w-28 rounded bg-muted" />
        </div>
      ) : cashSession ? (
        <div className="flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5 shadow-sm">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-widest text-primary">
                Active Session
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="text-base font-bold text-[#1a1c1c] tracking-tight">
                {cashSession.sessionCode}
              </span>
              <span className="text-xs font-medium text-muted-foreground">
                Expected Cash: {formatCurrency(cashSession.expectedCashBalance)}
              </span>
              <span className="hidden text-xs text-muted-foreground/80 lg:inline">
                Opening: {formatCurrency(cashSession.openingBalance)}
              </span>
            </div>
          </div>
          <div className="hidden lg:block h-8 w-px bg-primary/10" />
          <Badge variant="secondary" className="hidden lg:flex rounded-md px-2 py-0.5 text-xs font-semibold border-primary/10">
            Ready for checkout
          </Badge>
        </div>
      ) : (
        <Button
          size="default"
          variant="outline"
          className="border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive h-12 px-5 font-semibold"
          onClick={() => setOpenSessionDialogOpen(true)}
        >
          <CircleDollarSign className="mr-2 size-5" />
          Open Cash Session
        </Button>
      )}
    </div>
  );

  return (
    <>
      <div className="flex flex-col xl:flex-row -mt-4 min-h-[calc(100vh-64px)] sm:-mt-6 sm:-mb-6 sm:-mr-6">
        <div
          className={cn(
            "space-y-4 p-4 sm:p-6 xl:hidden",
            mobileTab === "cart" && "pb-0",
          )}
        >
          <PageHeader
            title="Point of Sale"
            description="Build a cart from available catalog products and complete checkout."
            actions={sessionStatus}
          />
          <div className="flex rounded-lg bg-muted p-1">
            <Button
              variant={mobileTab === "products" ? "secondary" : "ghost"}
              className="h-9 flex-1 rounded-md text-xs shadow-none"
              onClick={() => setMobileTab("products")}
            >
              Products
            </Button>
            <Button
              variant={mobileTab === "cart" ? "secondary" : "ghost"}
              className="h-9 flex-1 rounded-md text-xs shadow-none"
              onClick={() => setMobileTab("cart")}
            >
              Cart ({totalItems})
            </Button>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col",
            mobileTab === "cart" ? "hidden" : "flex",
            "xl:flex",
          )}
        >
          <div className="space-y-6 p-4 sm:p-6 xl:!pl-0 xl:p-6">
            <div className="hidden xl:block">
              <PageHeader
                title="Point of Sale"
                description="Build a cart from available catalog products and complete checkout."
                actions={sessionStatus}
              />
            </div>

            {bootstrapQuery.isError && (
              <Card>
                <CardContent className="pt-6">
                  <PageErrorState
                    title="Unable to load POS bootstrap"
                    description="Retry after checking API availability."
                    onRetry={() => bootstrapQuery.refetch()}
                  />
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-bold">Product List</CardTitle>
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-3 space-y-1">
                          <p className="text-sm font-semibold">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {product.category_name}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="secondary">{product.size_display}</Badge>
                            <p className="text-sm font-medium">
                              {formatCurrency(Number(product.price))}
                            </p>
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => addToCart(product)}
                          disabled={!product.variant_id}
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

        <div
          className={cn(
            "w-full xl:sticky xl:top-16 xl:h-[calc(100vh-64px)] xl:w-[400px] xl:border-l xl:bg-card xl:shadow-sm",
            mobileTab === "products" ? "hidden" : "block",
            "xl:block",
          )}
        >
          <div className="flex h-full flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between pt-6">
                <CardTitle>Cart</CardTitle>
                <Badge variant="outline" className="rounded-full">
                  {totalItems} item{totalItems === 1 ? "" : "s"}
                </Badge>
              </div>
              <CardDescription>Items ready for checkout</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 space-y-4 overflow-y-auto px-6">
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
                      className="rounded-lg border bg-muted/20 p-3"
                    >
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
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

            <div className="space-y-4 border-t bg-muted/10 p-6">
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

              <Button
                className="h-11 w-full text-base shadow-md"
                disabled={Boolean(checkoutBlockedReason)}
                onClick={() => setCheckoutOpen(true)}
              >
                Complete Checkout
              </Button>
              <p className="text-center text-[10px] leading-tight text-muted-foreground">
                {checkoutBlockedReason ?? "Submit payment and generate a completed sale."}
              </p>
            </div>
          </div>
        </div>

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
                  {totalItems} item{totalItems === 1 ? "" : "s"} | {formatCurrency(subtotal)}
                </p>
              </div>
              <Button className="shrink-0" onClick={() => setMobileTab("cart")}>
                View Cart
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader className="bg-[#ff5722] text-white">
            <SheetTitle className="text-white">Complete Checkout</SheetTitle>
            <SheetDescription className="text-white/80">
              Capture payment for the current draft cart.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 px-6 py-6">
            <div className="rounded-lg border bg-muted/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    Session
                  </p>
                  <p className="text-sm font-semibold">
                    {cashSession?.sessionCode ?? "No active session"}
                  </p>
                </div>
                <Wallet className="size-4 text-primary" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Customer name</label>
              <Input
                value={customerName}
                onChange={(event) => setCustomerName(event.target.value)}
                placeholder="Walk-in Customer"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payment method</label>
              <Select
                value={selectedPaymentMethodId}
                onValueChange={setSelectedPaymentMethodId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={String(method.id)}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amount tendered</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amountTenderedInput}
                onChange={(event) => setAmountTenderedInput(event.target.value)}
                disabled={!isCashPayment && Boolean(selectedPaymentMethod)}
              />
              <CheckoutMethodHint
                paymentMethod={selectedPaymentMethod}
                amountTendered={amountTendered}
                totalAmount={subtotal}
              />
            </div>

            {!isCashPayment && selectedPaymentMethod ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">Reference number</label>
                <Input
                  value={referenceNumber}
                  onChange={(event) => setReferenceNumber(event.target.value)}
                  placeholder="Enter digital payment reference"
                />
              </div>
            ) : null}

            {checkoutError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {checkoutError}
              </div>
            ) : null}

            <div className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-semibold">Sale Summary</p>
                <Badge variant="outline">{totalItems} items</Badge>
              </div>
              <div className="space-y-2">
                {cartLines.map((line) => (
                  <div
                    key={`checkout-${line.product.id}`}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate">
                      {line.product.name} x {line.qty}
                    </span>
                    <span className="font-medium">
                      {formatCurrency(Number(line.product.price) * line.qty)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t pt-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total due</span>
                  <span className="font-semibold">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tendered</span>
                  <span>{formatCurrency(amountTendered)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <span>{formatCurrency(changeGiven)}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setCheckoutOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleCheckoutSubmit}
                disabled={checkoutMutation.isPending || !cashSession}
              >
                {checkoutMutation.isPending ? "Processing..." : "Confirm Sale"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={receiptDialogOpen} onOpenChange={setReceiptDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="size-5 text-primary" />
              Checkout completed
            </DialogTitle>
            <DialogDescription>
              Receipt is ready for review and printing.
            </DialogDescription>
          </DialogHeader>

          {receiptResult && receiptDisplay ? (
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm">
                <div className="mb-4 border-b pb-3">
                  <img
                    src={RaynReceiptLogo}
                    alt="Rayn Motoparts"
                    className="mx-auto h-14 w-auto object-contain"
                  />
                  <p className="mt-2 text-center text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Official Sales Receipt
                  </p>
                </div>

                <div className="grid gap-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Receipt No.</span>
                    <span className="font-semibold">{receiptDisplay.receiptNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Transaction</span>
                    <span className="font-medium">{receiptDisplay.transactionNumber}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium">
                      {new Date(receiptDisplay.issuedAt).toLocaleString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Customer</span>
                    <span className="font-medium">{receiptDisplay.customerName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Cashier</span>
                    <span className="font-medium">{receiptDisplay.cashierName}</span>
                  </div>
                </div>

                <div className="my-4 border-t border-dashed" />

                <div className="space-y-2">
                  {receiptDisplay.lines.map((line) => (
                    <div
                      key={`${line.name}-${line.qty}-${line.unitPrice}`}
                      className="flex items-start justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{line.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {line.qty} x {formatCurrency(line.unitPrice)}
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(line.lineTotal)}</p>
                    </div>
                  ))}
                </div>

                <div className="my-4 border-t border-dashed" />

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(receiptDisplay.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold">{formatCurrency(receiptDisplay.totalAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Payment</span>
                    <span>{receiptDisplay.paymentMethodName}</span>
                  </div>
                  {receiptDisplay.referenceNumber ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Reference</span>
                      <span>{receiptDisplay.referenceNumber}</span>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Amount tendered</span>
                    <span>{formatCurrency(receiptDisplay.amountTendered)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Change</span>
                    <span className="font-semibold">{formatCurrency(receiptDisplay.changeGiven)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                {receiptResult.receipt
                  ? "Receipt snapshot saved to backend."
                  : receiptResult.receiptSnapshotEnabled
                    ? "Backend receipt snapshots are enabled, but this sale returned no snapshot. Using POS preview."
                    : "Receipt preview mode: backend receipt snapshots are currently disabled in rollout flags."}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Button variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 size-4" />
                  Print Receipt
                </Button>
                <Button className="w-full" onClick={() => setReceiptDialogOpen(false)}>
                  New Sale
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={openSessionDialogOpen} onOpenChange={setOpenSessionDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Open Cash Session</DialogTitle>
            <DialogDescription>
              Start today&apos;s cashier session for this single-store POS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/20 p-4 text-sm">
              <p className="font-medium">Store location</p>
              <p className="text-muted-foreground">Auto-assigned to the default main store.</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Opening balance</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={openSessionBalanceInput}
                onChange={(event) => setOpenSessionBalanceInput(event.target.value)}
              />
            </div>

            {openSessionError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {openSessionError}
              </div>
            ) : null}

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setOpenSessionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleOpenSession}
                disabled={openSessionMutation.isPending}
              >
                {openSessionMutation.isPending ? "Opening..." : "Open Session"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
