import { Banknote, CreditCard, Smartphone } from "lucide-react";

import type { RecentTransactions } from "@/components/modules/dashboard/types";
import { formatCurrency } from "@/components/modules/dashboard/formatters";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const paymentIcons = {
  Cash: Banknote,
  GCash: Smartphone,
  Card: CreditCard,
};

interface RecentTransactionsTableProps {
  transactions: RecentTransactions;
}

export default function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>Latest orders processed today</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Transaction</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-center">Items</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => {
              const PaymentIcon = paymentIcons[txn.paymentMethod];
              return (
                <TableRow key={txn.id}>
                  <TableCell className="font-medium">{txn.id}</TableCell>
                  <TableCell className="text-muted-foreground">{txn.time}</TableCell>
                  <TableCell className="text-center">{txn.items}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <PaymentIcon className="size-3.5 text-muted-foreground" />
                      <span>{txn.paymentMethod}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={txn.status === "Completed" ? "default" : "destructive"}
                      className="text-xs"
                    >
                      {txn.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(txn.total)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
