import { ClipboardCheck, ShieldCheck } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StaffFocusNote() {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Shift Focus</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        <div className="flex items-start gap-2 rounded-md bg-background/70 p-3">
          <ClipboardCheck className="mt-0.5 size-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Transaction Accuracy</p>
            <p className="text-xs text-muted-foreground">
              Verify payment method and item quantities before finalizing checkout.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-md bg-background/70 p-3">
          <ShieldCheck className="mt-0.5 size-4 text-primary" />
          <div>
            <p className="text-sm font-medium">Stock Awareness</p>
            <p className="text-xs text-muted-foreground">
              Prioritize low-stock alerts while recommending alternative products.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
