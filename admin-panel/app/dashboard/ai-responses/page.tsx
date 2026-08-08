"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { Sparkles, Trash2, Copy } from "lucide-react";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import type { AiResponseItem } from "@/lib/types";

type AiResponse = AiResponseItem & { page: string; adminId?: { name?: string; email?: string } };

interface ListResponse {
  _data: AiResponse[];
  _pagination: { total: number; page: number; limit: number; totalPages: number };
}

const PAGE_LABELS: Record<string, string> = {
  "product-description": "Product Description",
  faq: "FAQ",
  banner: "Banner",
  seo: "SEO",
  other: "Other",
};

export default function AiResponsesPage() {
  const [page, setPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isError, error } = useQuery<ListResponse>({
    queryKey: ["ai-responses", page],
    queryFn: () =>
      api.post("/api/admin/ai-response/list", { page, limit: 50 }),
    staleTime: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.del(`/api/admin/ai-response/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-responses"] });
      toast({ title: "Response permanently deleted" });
    },
    onError: (err: Error) => {
      toast({
        title: "Error deleting",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: "Response copied to clipboard" });
    });
  };

  const columns: Column<AiResponse>[] = [
    {
      key: "page",
      label: "Page",
      render: (item) => (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
          <Sparkles className="h-3 w-3" />
          {PAGE_LABELS[item.page] || item.page}
        </span>
      ),
    },
    {
      key: "prompt",
      label: "Prompt",
      render: (item) => (
        <p className="text-sm text-muted-foreground max-w-[200px] truncate" title={item.prompt}>
          {item.prompt}
        </p>
      ),
    },
    {
      key: "response",
      label: "Response",
      render: (item) => (
        <p className="text-sm max-w-[300px] truncate" title={item.response}>
          {item.response}
        </p>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (item) => (
        <span className="text-sm text-muted-foreground">
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: "_id" as keyof AiResponse,
      label: "Actions",
      render: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleCopy(item.response)}
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => deleteMutation.mutate(item._id)}
            disabled={deleteMutation.isPending}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load AI responses"
          message={error instanceof Error ? error.message : "Could not fetch AI responses from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["ai-responses"] })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Responses</h1>
        <p className="text-muted-foreground">
          History of all AI-generated content across the admin panel
        </p>
      </div>

      <DataTable
        data={data?._data ?? []}
        columns={columns}
        hideActions
        searchPlaceholder="Search responses..."
        externalPagination={
          data?._pagination
            ? {
                totalItems: data._pagination.total,
                currentPage: page,
                pageSize: 50,
                onPageChange: (p) => setPage(p),
              }
            : undefined
        }
      />
    </div>
  );
}
