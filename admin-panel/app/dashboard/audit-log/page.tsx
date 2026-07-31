"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api";
import { ErrorState } from "@/components/ui/error-state";
import {
  Search,
  Trash2,
  Loader2,
  History,
  ShieldAlert,
  UserPlus,
  UserMinus,
  UserCog,
  LogIn,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { LucideIcon } from "lucide-react";
import type { AuditEntry } from "@/lib/types";

const actionConfig: Record<
  string,
  { icon: LucideIcon; variant: "default" | "destructive" | "outline" | "secondary" }
> = {
  login: { icon: LogIn, variant: "outline" },
  create_user: { icon: UserPlus, variant: "default" },
  change_role: { icon: UserCog, variant: "secondary" },
  delete_user: { icon: UserMinus, variant: "destructive" },
  security: { icon: ShieldAlert, variant: "destructive" },
  error: { icon: AlertTriangle, variant: "destructive" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

interface AuditListResponse {
  logs: AuditEntry[];
}

export default function AuditLogPage() {
  const [search, setSearch] = useState("");
  const [clearOpen, setClearOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: auditData, isLoading, isError, error } = useQuery<AuditListResponse>({
    queryKey: ["audit-log"],
    queryFn: () => api.post<AuditListResponse>("/api/admin/audit-log/list"),
    staleTime: 30_000,
  });

  const logs = auditData?.logs ?? [];

  const clearMutation = useMutation({
    mutationFn: () => api.post("/api/admin/audit-log/clear"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audit-log"] });
      setClearOpen(false);
    },
    onError: () => {
      // Keep the dialog open so the admin can retry or cancel
      setClearOpen(true);
    },
  });

  const handleClear = () => {
    clearMutation.mutate();
  };

  const filtered = logs.filter((entry) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      entry.action.toLowerCase().includes(q) ||
      (entry.admin?.email ?? "").toLowerCase().includes(q) ||
      (entry.target?.email ?? "").toLowerCase().includes(q) ||
      entry.details.toLowerCase().includes(q) ||
      entry.ip.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
          <p className="text-muted-foreground">
            Track administrative actions and security events
          </p>
        </div>
        <Button
          variant="destructive"
          disabled={clearMutation.isPending || logs.length === 0}
          onClick={() => setClearOpen(true)}
          className="transition-all duration-200 hover:scale-105"
        >
          {clearMutation.isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4 mr-2" />
          )}
          Clear All
        </Button>

        <AlertDialog open={clearOpen} onOpenChange={(open) => { if (!open && !clearMutation.isPending) setClearOpen(false); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Audit Log</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all audit log entries. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={clearMutation.isPending} onClick={() => setClearOpen(false)}>
                Cancel
              </AlertDialogCancel>
              {/* Plain Button (NOT AlertDialogAction) so the dialog stays open
                  while the async clear runs. Radix AlertDialogAction auto-closes
                  the dialog on click, which hid the loading/error state. */}
              <Button
                type="button"
                variant="destructive"
                onClick={handleClear}
                disabled={clearMutation.isPending}
              >
                {clearMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Clearing...
                  </>
                ) : (
                  "Clear All"
                )}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search audit log..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isError ? (
        <div className="p-6">
          <ErrorState
            title="Failed to load audit log"
            message={error instanceof Error ? error.message : "Could not fetch audit log from the server."}
            onRetry={() => queryClient.invalidateQueries({ queryKey: ["audit-log"] })}
          />
        </div>
      ) : isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="h-96 bg-muted rounded-lg"></div>
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium">No audit entries found</p>
          <p className="text-sm text-muted-foreground">
            {search ? "Try a different search term" : "No actions have been logged yet"}
          </p>
        </Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Action</TableHead>
                <TableHead className="font-semibold">Admin</TableHead>
                <TableHead className="font-semibold">Target</TableHead>
                <TableHead className="font-semibold">Details</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold">IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => {
                const config = actionConfig[entry.action] ?? {
                  icon: Info,
                  variant: "outline" as const,
                };
                const Icon = config.icon;
                return (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <Badge variant={config.variant} className="capitalize gap-1">
                        <Icon className="h-3 w-3" />
                        {entry.action.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.admin?.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {entry.target?.email ?? "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                      {entry.details}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {formatDate(entry.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-mono">
                      {entry.ip}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <div className="p-3 text-sm text-muted-foreground border-t border-border">
            Showing {filtered.length} of {logs.length} entries
          </div>
        </div>
      )}
    </div>
  );
}
