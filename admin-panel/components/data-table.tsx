"use client";

import { useEffect, useState, useCallback, Suspense, lazy, type ReactNode } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
  PackageOpen,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { subMonths } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const CalendarComponent = lazy(() =>
  import("@/components/ui/calendar").then((m) => ({ default: m.Calendar })),
);

export type BaseItem = {
  _id?: number | string;
  status?: string | boolean;
  createdAt?: string;
  date?: string;
  orderDate?: string;
};

export interface Column<T> {
  key: string | keyof T;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface DataTableProps<T extends BaseItem> {
  data: T[];
  columns: Column<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (id: number) => void;
  /** Hide the built-in Edit/Delete actions column */
  hideActions?: boolean;
  selectOption?: { value: string; label: string }[];
  dateOption?: boolean;
  searchPlaceholder?: string;
  /** Show skeleton loading state */
  loading?: boolean;
  /** Custom empty state title */
  emptyTitle?: string;
  /** Custom empty state description */
  emptyDescription?: string;
  /** Custom empty state action */
  emptyAction?: ReactNode;
  /** When provided, use server-side pagination — totalItems overrides data.length for total count */
  externalPagination?: {
    totalItems: number;
    currentPage: number;
    onPageChange: (page: number) => void;
  };
}

function DataTableContent<T extends BaseItem>({
  data,
  columns,
  onEdit,
  onDelete,
  hideActions = false,
  selectOption,
  dateOption,
  searchPlaceholder = "Search...",
  loading = false,
  emptyTitle = "No results found",
  emptyDescription = "No data available yet.",
  emptyAction,
  externalPagination,
}: DataTableProps<T>) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // Get initial page from URL or default to 1
  const initialPage = parseInt(searchParams.get("page") || "1", 10);

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedOption, setSelectedOption] = useState("");
  const [dateFilter, setDateFilter] = useState<{
    type: string;
    month: number;
    year: number;
  }>({
    type: "all",
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [filteredData, setFilteredData] = useState<T[]>(data);
  const itemsPerPage = 10;

  // Update URL when page changes
  const updatePageInUrl = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (page === 1) {
        params.delete("page");
      } else {
        params.set("page", page.toString());
      }
      const queryString = params.toString();
      router.push(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    },
    [searchParams, router, pathname],
  );

  // Handle page change
  const handlePageChange = useCallback(
    (newPage: number) => {
      if (externalPagination) {
        externalPagination.onPageChange(newPage);
      } else {
        setCurrentPage(newPage);
        updatePageInUrl(newPage);
      }
    },
    [externalPagination, updatePageInUrl],
  );

  const totalItems = externalPagination?.totalItems ?? filteredData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = ((externalPagination?.currentPage ?? currentPage) - 1) * itemsPerPage;
  // When using external pagination, data is already the current page from the server
  // When using client-side pagination, slice from the filtered data
  const paginatedData = externalPagination
    ? data
    : filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectChange = (value: string) => {
    setSelectedOption(value);
    handlePageChange(1);
    const filtered = data.filter((item) => item.status === value);
    setFilteredData(filtered);
  };

  useEffect(() => {
    let result = [...data];

    // Apply search filter
    if (searchTerm) {
      result = result.filter((item) =>
        Object.values(item).some((value) =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    // Apply date filter
    if (dateFilter.type === "lastMonth") {
      const lastMonth = subMonths(new Date(), 1);
      result = result.filter((item) => {
        const itemDate = new Date(
          item.createdAt || item.date || item.orderDate || "",
        );
        return (
          itemDate.getMonth() === lastMonth.getMonth() &&
          itemDate.getFullYear() === lastMonth.getFullYear()
        );
      });
    } else if (dateFilter.type === "custom") {
      result = result.filter((item) => {
        const itemDate = new Date(
          item.createdAt || item.date || item.orderDate || "",
        );
        return (
          itemDate.getMonth() === dateFilter.month &&
          itemDate.getFullYear() === dateFilter.year
        );
      });
    }

    setFilteredData(result);
  }, [searchTerm, dateFilter, data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-300">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              handlePageChange(1);
            }}
            className="pl-10 transition-all duration-200 focus:scale-[1.02]"
          />
        </div>
        {selectOption && (
          <div className="w-[200px]">
            <Select value={selectedOption} onValueChange={handleSelectChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                {selectOption?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {dateOption && (
          <div className="flex items-center gap-2">
            <Select
              value={dateFilter.type}
              onValueChange={(value) =>
                setDateFilter((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select date range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="lastMonth">Last Month</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {dateFilter.type === "custom" && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[200px] justify-start text-left font-normal",
                      !dateFilter.month && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {dateFilter.month !== undefined && dateFilter.year
                      ? `${new Date(0, dateFilter.month).toLocaleString("default", { month: "long" })} ${dateFilter.year}`
                      : "Select month"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading calendar...</div>}>
                    <CalendarComponent
                      mode="single"
                      selected={new Date(dateFilter.year, dateFilter.month)}
                      onSelect={(date: Date | undefined) => {
                        if (date) {
                          setDateFilter((prev) => ({
                            ...prev,
                            month: date.getMonth(),
                            year: date.getFullYear(),
                          }));
                        }
                      }}
                      initialFocus
                      defaultMonth={new Date(dateFilter.year, dateFilter.month)}
                      toMonth={new Date()}
                      className="rounded-md border"
                    />
                  </Suspense>
                </PopoverContent>
              </Popover>
            )}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              {columns.map((column, index) => (
                <TableHead
                  key={String(column.key)}
                  className="font-semibold animate-in fade-in slide-in-from-top"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {column.label}
                </TableHead>
              ))}
              {!hideActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                  {!hideActions && (
                    <TableCell>
                      <div className="flex items-center justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length + (hideActions ? 0 : 1)}>
                  <Empty>
                    <EmptyHeader>
                      <EmptyMedia variant="icon">
                        <PackageOpen />
                      </EmptyMedia>
                      <EmptyTitle>{emptyTitle}</EmptyTitle>
                      <EmptyDescription>{emptyDescription}</EmptyDescription>
                    </EmptyHeader>
                    {emptyAction && <EmptyContent>{emptyAction}</EmptyContent>}
                  </Empty>
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <TableRow
                  key={item._id != null ? String(item._id) : `row-${rowIndex}`}
                  className="transition-all duration-200 hover:bg-muted/50 animate-in fade-in slide-in-from-left"
                  style={{ animationDelay: `${rowIndex * 30}ms` }}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render
                        ? column.render(item)
                        : (item[column.key as keyof T] as ReactNode)}
                    </TableCell>
                  ))}
                  {!hideActions && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(item)}
                            aria-label="Edit item"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(item._id as number)}
                            className="text-destructive hover:text-destructive"
                            aria-label="Delete item"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between animate-in fade-in slide-in-from-bottom duration-300">
          <p className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + itemsPerPage, filteredData.length)} of{" "}
            {filteredData.length} results
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="transition-all duration-200 hover:scale-105"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              <span className="text-sm text-muted-foreground">Page</span>
              <Select
                value={currentPage.toString()}
                onValueChange={(value) => handlePageChange(parseInt(value, 10))}
              >
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue placeholder={currentPage} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <SelectItem key={page} value={page.toString()}>
                        {page}
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
              <span className="text-sm text-muted-foreground">
                of {totalPages}
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handlePageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="transition-all duration-200 hover:scale-105"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wrapper component with Suspense to handle useSearchParams
export function DataTable<T extends BaseItem>(props: DataTableProps<T>) {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-full max-w-sm" />
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  {(props.columns || []).map((col) => (
                    <TableHead key={String(col.key)}>{col.label}</TableHead>
                  ))}
                  {!props.hideActions && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={`suspense-${i}`}>
                    {(props.columns || []).map((col) => (
                      <TableCell key={String(col.key)}>
                        <Skeleton className="h-5 w-full" />
                      </TableCell>
                    ))}
                    {!props.hideActions && (
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Skeleton className="h-8 w-8 rounded" />
                          <Skeleton className="h-8 w-8 rounded" />
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      }
    >
      <DataTableContent {...props} />
    </Suspense>
  );
}
