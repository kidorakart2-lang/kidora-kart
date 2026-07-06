"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { DataTable, type Column } from "@/components/data-table";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Sparkles, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api, ApiClientError } from "@/lib/api";

interface AiResponse {
  _id: string;
  prompt: string;
  response: string;
  page: string;
  adminId?: { name?: string; email?: string };
  createdAt: string;
}

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
  const [alertOpen, setAlertOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<ListResponse>({
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
      setAlertOpen(false);
      setDeleteId(null);
    },
    onError: (err: Error) => {
      toast({
        title: "Error deleting",
        description: err.message,
        variant: "destructive",
      });
      setAlertOpen(false);
      setDeleteId(null);
    },
  });

  const handleDelete = (id: number) => {
    setDeleteId(String(id));
    setAlertOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId) deleteMutation.mutate(deleteId);
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
        <Button
          variant="destructive"
          size="sm"
          onClick={() => handleDelete(item._id as unknown as number)}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top duration-300">
        <h1 className="text-3xl font-bold tracking-tight">AI Responses</h1>
        <p className="text-muted-foreground">
          History of all AI-generated content across the admin panel
        </p>
      </div>

      <DataTable
        data={data?._data ?? []}
        columns={columns}
        onEdit={() => {}}
        onDelete={() => {}}
        searchPlaceholder="Search responses..."
        externalPagination={
          data?._pagination
            ? {
                totalItems: data._pagination.total,
                currentPage: page,
                onPageChange: (p) => setPage(p),
              }
            : undefined
        }
      />

      <AlertDialogUse
        isOpen={alertOpen}
        onClose={() => setAlertOpen(false)}
        onConfirm={confirmDelete}
        title="Delete AI Response"
        description="Are you sure? This will permanently delete the response. This action cannot be undone."
        confirmText="Delete Permanently"
      />
    </div>
  );
}
