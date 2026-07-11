"use client";

import { useEffect, useState } from "react";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { LucideIcon } from "lucide-react";

interface AuditEntry {
  _id: string;
  action: string;
  admin: { _id: string; email: string } | null;
  target: { _id: string; email: string } | null;
  details: string;
  ip: string;
  createdAt: string;
}

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

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    api.post<{ logs: AuditEntry[] }>("/api/admin/audit-log/list").then((res) => {
      setLogs(res.logs ?? []);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleClear = async () => {
    setClearing(true);
    try {
      await api.post("/api/admin/audit-log/clear");
      setLogs([]);
    } finally {
      setClearing(false);
    }
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              disabled={clearing || logs.length === 0}
              className="transition-all duration-200 hover:scale-105"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear All
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear Audit Log</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete all audit log entries. This action
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleClear}>
                {clearing ? "Clearing..." : "Clear All"}
              </AlertDialogAction>
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

      {loading ? (
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
