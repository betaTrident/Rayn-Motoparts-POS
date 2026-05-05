import {
  Calendar,
  CreditCard,
  Hash,
  Receipt,
  User,
  Users,
} from "lucide-react";
import type { ElementType } from "react";
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
      <DialogContent className="max-h-[90vh] max-w-[calc(100%-1.5rem)] gap-0 overflow-hidden border-border/80 bg-white p-0 shadow-2xl ring-1 ring-black/5 sm:max-w-2xl sm:rounded-md">
        <div className="border-b bg-linear-to-r from-primary/5 via-white to-white px-4 py-3.5 sm:px-5">
          <DialogHeader className="pr-8">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10">
                <Receipt className="size-4.5" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="truncate text-base font-black text-foreground sm:text-lg">
                  {selectedTransaction?.transactionNumber || "Transaction Details"}
                </DialogTitle>
                <DialogDescription className="mt-0.5 text-xs">
                  Reviewing sale record and line items
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        <div className="overflow-y-auto px-4 py-4 sm:px-5">
          {isLoading ? (
            <PageLoadingState label="Loading transaction detail..." className="min-h-32 py-12" />
          ) : isError || !detailData ? (
            <PageErrorState
              title="Unable to load details"
              description="There was a problem retrieving the transaction record."
              onRetry={onRetry}
              className="py-12"
            />
          ) : (
            <div className="space-y-4">
              {/* Transaction Details Cards */}
              <section className="space-y-2.5">
                <SectionTitle title="Transaction Details" />
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <InfoBlock
                    label="Transaction No."
                    value={detailData.transactionNumber}
                    icon={Hash}
                  />
                  <InfoBlock
                    label="Transaction Date"
                    value={formatDateTime(detailData.transactionDate)}
                    icon={Calendar}
                  />
                  <InfoBlock
                    label="Handled By"
                    value={detailData.cashierName}
                    icon={User}
                  />
                  <InfoBlock
                    label="Customer"
                    value={detailData.customerName || "Walk-in Customer"}
                    icon={Users}
                  />
                  <InfoBlock
                    label="Payment Method"
                    value={detailData.payments.map(p => p.method).join(", ") || "N/A"}
                    icon={CreditCard}
                  />
                  <div className="min-w-0 rounded-md border border-border/70 bg-white p-2.5 shadow-md shadow-slate-900/5">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Receipt className="size-3.5 shrink-0" />
                      <p className="text-[10px] font-bold uppercase tracking-wider">Status</p>
                    </div>
                    <div className="mt-1.5 text-foreground">
                      <Badge
                        variant={selectedTransaction?.status === "refunded" ? "destructive" : "secondary"}
                        className="rounded-md px-2 py-0.5 text-[10px] font-bold capitalize tracking-wide shadow-sm"
                      >
                        {selectedTransaction?.status?.replaceAll("_", " ") || "completed"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </section>

              {/* Order Items Table */}
              <section className="space-y-2.5">
                <SectionTitle title="Order Items" />
                <div className="overflow-hidden rounded-md border border-border/70 bg-white shadow-lg shadow-slate-900/5">
                  <Table className="min-w-155">
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="h-8 w-[46%] text-[10px] font-bold uppercase tracking-wider">Item Details</TableHead>
                        <TableHead className="h-8 w-[12%] text-right text-[10px] font-bold uppercase tracking-wider">Qty</TableHead>
                        <TableHead className="h-8 w-[21%] text-right text-[10px] font-bold uppercase tracking-wider">Price</TableHead>
                        <TableHead className="h-8 w-[21%] text-right text-[10px] font-bold uppercase tracking-wider">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {detailData.items.map((item) => (
                        <TableRow key={`${item.variantSku}-${item.productName}`} className="hover:bg-transparent border-border/40">
                          <TableCell className="py-2.5 align-top">
                            <p className="text-[13px] font-bold leading-tight text-foreground">{item.productName}</p>
                            <p className="mt-1 font-mono text-[9px] font-medium text-muted-foreground">{item.variantSku}</p>
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-[13px] tabular-nums align-top font-medium">{item.qty}</TableCell>
                          <TableCell className="py-2.5 text-right text-[13px] tabular-nums text-muted-foreground align-top">
                            {formatCurrency(item.unitPrice)}
                          </TableCell>
                          <TableCell className="py-2.5 text-right text-[13px] font-bold tabular-nums text-foreground align-top">
                            {formatCurrency(item.lineTotal)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </section>

              {/* Financial Summary */}
              <section className="space-y-2.5">
                <SectionTitle title="Financial Summary" />
                <div className="rounded-md border border-border/80 bg-white p-4 text-foreground shadow-lg shadow-slate-900/5">
                  <div className="grid gap-6 sm:grid-cols-2 sm:items-start">
                    <div className="space-y-2 sm:pt-1">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Verification</p>
                      <p className="text-[11px] leading-relaxed text-muted-foreground italic">
                        {selectedTransaction?.status === "refunded" 
                          ? "Refunded sale: items restored to inventory and payment reversed."
                          : "Verified transaction with secure digital audit trail and inventory lock."}
                      </p>
                    </div>
                    <div className="space-y-2.5">
                      <SummaryRow label="Subtotal" value={formatCurrency(detailData.subtotal)} />
                      <SummaryRow label="Tax Amount" value={formatCurrency(detailData.taxAmount)} />
                      <div className="border-t border-dashed border-border/60" />
                      <SummaryRow
                        label="Grand Total"
                        value={formatCurrency(detailData.totalAmount)}
                        isTotal
                      />
                      <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 border-t border-dashed border-border/60 pt-2.5">
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">Tendered</p>
                          <p className="text-sm font-bold tabular-nums">{formatCurrency(detailData.amountTendered)}</p>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <p className="text-[10px] font-bold uppercase tracking-tight text-primary">Change</p>
                          <p className="text-sm font-black tabular-nums text-primary">{formatCurrency(detailData.changeGiven)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoBlock({
  label,
  value,
  icon: Icon,
  className
}: {
  label: string;
  value: string;
  icon: ElementType;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 rounded-md border border-border/70 bg-white p-2.5 shadow-md shadow-slate-900/5", className)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <p className="truncate text-[10px] font-bold tracking-wider uppercase">{label}</p>
      </div>
      <p className="mt-1.5 truncate text-[13px] font-bold leading-snug text-foreground/90">{value}</p>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-3.5 w-1 rounded-full bg-primary shadow-sm shadow-primary/30" />
      <h3 className="text-[12px] font-black uppercase tracking-wider text-foreground/80">{title}</h3>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  isTotal,
  className
}: {
  label: string;
  value: string;
  isTotal?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4 text-[13px]", className)}>
      <span className={cn("font-medium text-muted-foreground", isTotal && "text-sm font-black text-foreground")}>
        {label}
      </span>
      <span className={cn("font-bold tabular-nums text-foreground", isTotal && "text-xl font-black tracking-tight")}>
        {value}
      </span>
    </div>
  );
}
