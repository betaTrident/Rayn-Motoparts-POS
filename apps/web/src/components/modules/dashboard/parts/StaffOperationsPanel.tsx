import { ArrowRight, PackageSearch, ReceiptText, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const staffActions = [
  {
    title: "Open POS",
    description: "Start a new checkout flow for walk-in customers.",
    icon: ShoppingCart,
    path: "/app/staff/dashboard",
    disabled: true,
  },
  {
    title: "Review Transactions",
    description: "Inspect recent sales and verify completed payments.",
    icon: ReceiptText,
    path: "/app/staff/transactions",
    disabled: false,
  },
  {
    title: "Check Stock Alerts",
    description: "Review low-stock items before assisting customers.",
    icon: PackageSearch,
    path: "/app/staff/dashboard",
    disabled: true,
  },
] as const;

export default function StaffOperationsPanel() {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shift Operations</CardTitle>
        <CardDescription>
          Quick links for the most frequent staff actions during store operations.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 md:grid-cols-3">
        {staffActions.map((action) => (
          <div key={action.title} className="rounded-lg border p-3">
            <div className="mb-2 flex items-center gap-2">
              <action.icon className="size-4 text-primary" />
              <p className="text-sm font-semibold">{action.title}</p>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">{action.description}</p>
            <Button
              variant="outline"
              size="sm"
              disabled={action.disabled}
              onClick={() => navigate(action.path)}
              className="w-full justify-between"
            >
              {action.disabled ? "Coming Soon" : "Open"}
              <ArrowRight className="size-3.5" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
