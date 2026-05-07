import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatsStripSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-${count}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-none shadow-sm ring-1 ring-border">
          <CardContent className="p-4 flex items-center gap-4">
            {/* Icon Placeholder */}
            <Skeleton className="size-10 shrink-0 rounded-xl" />
            
            <div className="flex-1 space-y-2 min-w-0">
              {/* Value Placeholder */}
              <Skeleton className="h-6 w-12" />
              {/* Label Placeholder */}
              <Skeleton className="h-3 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
