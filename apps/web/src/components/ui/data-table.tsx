"use client"

import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Row,
  type SortingState,
} from "@tanstack/react-table"
import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
  toolbar?: React.ReactNode
  footer?: React.ReactNode
  onRowClick?: (row: Row<TData>) => void
  className?: string
  tableClassName?: string
  pageSize?: number
  pageSizeOptions?: number[]
  enablePagination?: boolean
  mobileCardRenderer?: (row: TData) => React.ReactNode
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  emptyState,
  loadingState,
  toolbar,
  footer,
  onRowClick,
  className,
  tableClassName,
  pageSize = 10,
  pageSizeOptions = [10, 20, 50],
  enablePagination = true,
  mobileCardRenderer,
}: DataTableProps<TData, TValue>) {
  const isMobile = useIsMobile()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize,
  })

  React.useEffect(() => {
    setPagination((current) => {
      if (current.pageSize === pageSize) return current
      return { pageIndex: 0, pageSize }
    })
  }, [pageSize])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
  })

  const rows = table.getRowModel().rows
  const totalRows = table.getSortedRowModel().rows.length
  const pageCount = enablePagination ? table.getPageCount() : 1
  const currentPage = enablePagination ? table.getState().pagination.pageIndex + 1 : 1
  const currentPageSize = table.getState().pagination.pageSize
  const defaultEmptyState = (
    <span className="text-muted-foreground text-sm">No results.</span>
  )
  const defaultLoadingState = (
    <span className="text-muted-foreground text-sm">Loading...</span>
  )

  const paginationItems = buildPaginationItems(currentPage, pageCount)
  const showPagination = enablePagination && !isLoading && totalRows > currentPageSize
  const showMobileCards = Boolean(isMobile && mobileCardRenderer)

  return (
    <div className={cn("space-y-3", className)}>
      {toolbar}
      <div
        className={cn(
          "overflow-hidden rounded-xl border border-border/70 bg-card shadow-sm",
          tableClassName
        )}
      >
        {showMobileCards ? (
          <div className="space-y-3 p-3">
            {isLoading ? (
              <div className="rounded-lg border border-dashed p-6 text-center">
                {loadingState ?? defaultLoadingState}
              </div>
            ) : rows.length ? (
              rows.map((row) => (
                <div key={row.id}>
                  {mobileCardRenderer?.(row.original)}
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-dashed p-6 text-center">
                {emptyState ?? defaultEmptyState}
              </div>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => {
                    const canSort = header.column.getCanSort()
                    const isSorted = header.column.getIsSorted()
                    const meta = header.column.columnDef.meta as
                      | { headerClassName?: string }
                      | undefined

                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          "h-12 bg-muted/10 px-4 text-sm font-semibold tracking-tight text-foreground/90",
                          canSort && "cursor-pointer select-none",
                          meta?.headerClassName
                        )}
                      >
                        {header.isPlaceholder ? null : canSort ? (
                          <button
                            type="button"
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1"
                          >
                            <span>
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                            </span>
                            {isSorted === "asc" ? (
                              <ChevronUp className="size-3.5" />
                            ) : isSorted === "desc" ? (
                              <ChevronDown className="size-3.5" />
                            ) : (
                              <ArrowUpDown className="size-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {loadingState ?? defaultLoadingState}
                  </TableCell>
                </TableRow>
              ) : rows.length ? (
                rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      "odd:bg-card even:bg-muted/10 hover:bg-muted/25",
                      onRowClick && "cursor-pointer"
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const meta = cell.column.columnDef.meta as
                        | { cellClassName?: string }
                        | undefined

                      return (
                        <TableCell
                          key={cell.id}
                          className={cn(
                            "px-4 py-3 align-middle text-[13px]",
                            meta?.cellClassName
                          )}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    {emptyState ?? defaultEmptyState}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      {showPagination ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-background px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground text-xs sm:text-sm">
            Showing{" "}
            <span className="text-foreground font-medium">
              {pagination.pageIndex * currentPageSize + 1}
            </span>{" "}
            to{" "}
            <span className="text-foreground font-medium">
              {Math.min((pagination.pageIndex + 1) * currentPageSize, totalRows)}
            </span>{" "}
            of{" "}
            <span className="text-foreground font-medium">{totalRows}</span>{" "}
            items
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
              Rows per page
              <select
                className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-xs outline-none"
                value={currentPageSize}
                onChange={(event) =>
                  table.setPageSize(Number(event.target.value))
                }
              >
                {pageSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <Pagination className="mx-0 w-full justify-start sm:w-auto sm:justify-end">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      table.previousPage()
                    }}
                    aria-disabled={!table.getCanPreviousPage()}
                    className={cn(
                      !table.getCanPreviousPage() &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
                {paginationItems.map((item, index) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === currentPage}
                        onClick={(event) => {
                          event.preventDefault()
                          table.setPageIndex(item - 1)
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      table.nextPage()
                    }}
                    aria-disabled={!table.getCanNextPage()}
                    className={cn(
                      !table.getCanNextPage() &&
                        "pointer-events-none opacity-50"
                    )}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      ) : null}
      {footer}
    </div>
  )
}

function buildPaginationItems(currentPage: number, pageCount: number) {
  if (pageCount <= 5) {
    return Array.from({ length: pageCount }, (_, index) => index + 1)
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "ellipsis", pageCount] as const
  }

  if (currentPage >= pageCount - 2) {
    return [1, "ellipsis", pageCount - 3, pageCount - 2, pageCount - 1, pageCount] as const
  }

  return [1, "ellipsis", currentPage - 1, currentPage, currentPage + 1, "ellipsis", pageCount] as const
}
