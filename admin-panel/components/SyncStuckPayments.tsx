"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, RefreshCcw, AlertTriangle, CheckCircle, XCircle, Ban } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";

interface SyncResult {
  scanned: number;
  fixed: number;
  failed: number;
  skipped: number;
  errors: Array<{ orderId: string; error: string }>;
  details: Array<{
    orderId: string;
    status: "fixed" | "skipped" | "failed";
    note: string;
  }>;
}

export default function SyncStuckPayments() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const { toast } = useToast();

  const syncStuckPayments = async () => {
    try {
      setLoading(true);
      setResult(null);

      const data = await api.postRaw<{ _status: boolean; _data: SyncResult }>(
        "/api/website/orders/sync-stuck-payments",
      );

      const syncResult = data._data;
      setResult(syncResult);

      if (syncResult.fixed > 0) {
        toast({
          title: "✅ Orders Recovered",
          description: `Fixed ${syncResult.fixed} stuck order(s). ${syncResult.skipped} skipped.`,
        });
      } else if (syncResult.scanned === 0) {
        toast({
          title: "All Good",
          description: "No stuck pending orders found.",
        });
      } else {
        toast({
          title: "No Fixes Needed",
          description: `Scanned ${syncResult.scanned} order(s). ${syncResult.fixed} fixed, ${syncResult.skipped} skipped.`,
        });
      }

      if (syncResult.failed > 0) {
        toast({
          title: "⚠️ Some Errors",
          description: `${syncResult.failed} order(s) failed to sync. Check details below.`,
          variant: "destructive",
        });
      }
    } catch (error: unknown) {
      toast({
        title: "Sync Failed",
        description:
          error instanceof ApiClientError ? error.message : "Could not sync stuck payments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mb-6 border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground flex items-center gap-2">
              <RefreshCcw className="h-5 w-5" />
              Stuck Payment Recovery
            </CardTitle>
            <CardDescription>
              Scan orders stuck on &apos;pending&apos; and check Razorpay to
              recover any that were actually captured.
            </CardDescription>
          </div>
          <Button
            onClick={syncStuckPayments}
            disabled={loading}
            variant="outline"
            className="border-border text-foreground hover:bg-muted"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Sync Now
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      {result && !loading && (
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{result.scanned}</p>
              <p className="text-xs text-muted-foreground">Scanned</p>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-800 p-3 text-center bg-emerald-50/50 dark:bg-emerald-950/20">
              <p className="text-2xl font-bold text-emerald-600">{result.fixed}</p>
              <p className="text-xs text-emerald-600">Recovered</p>
            </div>
            <div className="rounded-lg border border-amber-200 dark:border-amber-800 p-3 text-center bg-amber-50/50 dark:bg-amber-950/20">
              <p className="text-2xl font-bold text-amber-600">{result.skipped}</p>
              <p className="text-xs text-amber-600">Skipped</p>
            </div>
            <div className="rounded-lg border border-red-200 dark:border-red-800 p-3 text-center bg-red-50/50 dark:bg-red-950/20">
              <p className="text-2xl font-bold text-red-600">{result.failed}</p>
              <p className="text-xs text-red-600">Failed</p>
            </div>
          </div>

          {/* Detail Rows */}
          {result.details.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Details
              </p>
              <div className="rounded-md border border-border divide-y divide-border">
                {result.details.map((detail, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm"
                  >
                    {detail.status === "fixed" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : detail.status === "skipped" ? (
                      <Ban className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                    )}
                    <span className="font-mono text-xs text-muted-foreground min-w-[120px]">
                      {detail.orderId}
                    </span>
                    <span className="text-foreground">{detail.note}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw Errors */}
          {result.errors.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" />
                Errors
              </p>
              <div className="rounded-md border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 divide-y divide-red-200 dark:divide-red-800">
                {result.errors.map((err, i) => (
                  <div key={i} className="px-4 py-2 text-xs">
                    <span className="font-mono text-red-700 dark:text-red-400">
                      {err.orderId}:
                    </span>{" "}
                    <span className="text-red-600 dark:text-red-300">{err.error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.scanned === 0 && (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No stuck pending orders found with Razorpay order IDs.
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
