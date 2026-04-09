import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PageErrorState,
  PageLoadingState,
} from "@/components/ui/page-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/components/modules/transactions/formatters";
import type {
  TransactionDetail,
  TransactionRow,
} from "@/services/transactionService.service";

interface TransactionDetailDialogProps {
  selectedTransaction: TransactionRow | null;
  detailData?: TransactionDetail;
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export default function TransactionDetailDialog({
  selectedTransaction,
  detailData,
  isLoading,
  isError,
  onClose,
  onRetry,
}: TransactionDetailDialogProps) {
  return (
    <Dialog
      open={Boolean(selectedTransaction)}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Transaction Details {selectedTransaction ? `- ${selectedTransaction.transactionNumber}` : ""}
          </DialogTitle>
          <DialogDescription>Inspect line items and payment breakdown.</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <PageLoadingState label="Loading transaction detail..." className="min-h-24 py-6" />
        ) : isError || !detailData ? (
          <PageErrorState
            title="Unable to load transaction details"
            description="Please try again."
            onRetry={onRetry}
            className="py-6"
          />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 rounded-md border p-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Date</p>
                <p className="text-sm font-medium">{formatDateTime(detailData.transactionDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Staff</p>
                <p className="text-sm font-medium">{detailData.cashierName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Customer</p>
                <p className="text-sm font-medium">{detailData.customerName || "Walk-in"}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">Items</p>
              <div className="overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>SKU</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right">Line Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detailData.items.map((item) => (
                      <TableRow key={`${item.variantSku}-${item.productName}`}>
                        <TableCell>{item.variantSku}</TableCell>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(item.lineTotal)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-md border p-3">
                <p className="mb-2 text-sm font-semibold">Payments</p>
                <div className="space-y-2">
                  {detailData.payments.map((payment, idx) => (
                    <div key={`${payment.method}-${idx}`} className="flex items-center justify-between text-sm">
                      <span>{payment.method}</span>
                      <span className="font-medium">{formatCurrency(payment.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(detailData.subtotal)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span>{formatCurrency(detailData.taxAmount)}</span>
                </div>
                <div className="mt-2 flex items-center justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatCurrency(detailData.totalAmount)}</span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-muted-foreground">Amount Tendered</span>
                  <span>{formatCurrency(detailData.amountTendered)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground">Change</span>
                  <span>{formatCurrency(detailData.changeGiven)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
