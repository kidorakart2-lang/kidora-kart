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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Calendar,
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
  key: keyof T;
  label: string;
  render?: (item: T) => ReactNode;
}

export interface DataTableProps<T extends BaseItem> {
  data: T[];
  columns: Column<T>[];
  onEdit: (item: T) => void;
  onDelete: (id: number) => void;
  selectOption?: { value: string; label: string }[];
  dateOption?: boolean;
  searchPlaceholder?: string;
}

function DataTableContent<T extends BaseItem>({
  data,
  columns,
  onEdit,
  onDelete,
  selectOption,
  dateOption,
  searchPlaceholder = "Search...",
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
      setCurrentPage(newPage);
      updatePageInUrl(newPage);
    },
    [updatePageInUrl],
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(
    startIndex,
    startIndex + itemsPerPage,
  );

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((item, rowIndex) => (
              <TableRow
                key={String(item._id)}
                className="transition-all duration-200 hover:bg-muted/50 animate-in fade-in slide-in-from-left"
                style={{ animationDelay: `${rowIndex * 30}ms` }}
              >
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render
                      ? column.render(item)
                      : (item[column.key] as ReactNode)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(item)}
                      className="transition-all duration-200 hover:scale-110"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item._id as number)}
                      className="transition-all duration-200 hover:scale-110 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-muted rounded"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      }
    >
      <DataTableContent {...props} />
    </Suspense>
  );
}
