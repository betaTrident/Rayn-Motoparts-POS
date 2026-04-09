export function formatCurrency(amount: number) {
  return `PHP ${amount.toLocaleString("en-PH", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}
