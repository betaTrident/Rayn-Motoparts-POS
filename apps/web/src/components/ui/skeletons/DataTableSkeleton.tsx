import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableSkeletonProps {
  columnCount?: number;
  rowCount?: number;
  showToolbar?: boolean;
}

export function DataTableSkeleton({
  columnCount = 5,
  rowCount = 10,
  showToolbar = true,
}: DataTableSkeletonProps) {
  return (
    <div className="w-full space-y-4">
      {showToolbar && (
        <div className="flex items-center justify-between py-1">
          <div className="flex flex-1 items-center space-x-2">
            <Skeleton className="h-9 w-[250px]" />
            <Skeleton className="h-9 w-[100px]" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-[120px]" />
          </div>
        </div>
      )}
      
      <div className="rounded-md border border-border bg-white overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow>
              {Array.from({ length: columnCount }).map((_, i) => (
                <TableHead key={i} className="px-6 h-12">
                  <Skeleton className="h-4 w-2/3" />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: rowCount }).map((_, rowIndex) => (
              <TableRow key={rowIndex} className="hover:bg-transparent">
                {Array.from({ length: columnCount }).map((_, colIndex) => (
                  <TableCell key={colIndex} className="px-6 py-4">
                    <Skeleton 
                      className={`h-4 ${
                        colIndex === 0 ? "w-3/4" : colIndex === columnCount - 1 ? "w-1/2" : "w-full"
                      }`} 
                    />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <Skeleton className="h-8 w-[150px]" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </div>
    </div>
  );
}
