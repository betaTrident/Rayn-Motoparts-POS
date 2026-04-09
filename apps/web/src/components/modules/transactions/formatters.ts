import type { TransactionRow } from "@/services/transactionService.service";

export function formatCurrency(value: number): string {
  return `PHP ${value.toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function exportTransactionsCsv(results: TransactionRow[]): void {
  if (!results.length) {
    return;
  }

  const header = [
    "TransactionNumber",
    "TransactionDate",
    "Status",
    "Staff",
    "PaymentMethods",
    "ItemsQty",
    "TotalAmount",
  ];

  const escape = (value: string | number) => {
    const stringValue = String(value);
    if (stringValue.includes(",") || stringValue.includes("\"") || stringValue.includes("\n")) {
      return `\"${stringValue.replaceAll("\"", "\"\"")}\"`;
    }
    return stringValue;
  };

  const rows = results.map((row) => [
    row.transactionNumber,
    formatDateTime(row.transactionDate),
    row.status,
    row.cashierName,
    row.paymentMethods.join("|") || "-",
    row.itemsQty,
    row.totalAmount,
  ]);

  const csv = [header, ...rows]
    .map((line) => line.map((cell) => escape(cell)).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const datePart = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute("download", `transactions-${datePart}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
