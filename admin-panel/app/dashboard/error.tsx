"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="p-8 rounded-xl text-center flex items-center justify-center flex-col min-h-[400px]">
      <div className="flex justify-center mb-6">
        <div className="bg-destructive/10 p-3 rounded-full">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Something went wrong!
      </h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        An unexpected error occurred in this section. Try refreshing or go back
        to the dashboard home.
      </p>
      <div className="space-y-3">
        <Button
          onClick={() => reset()}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button
          variant="outline"
          className="w-full border-border text-foreground hover:bg-muted flex items-center justify-center gap-2"
          asChild
        >
          <Link href="/dashboard">
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Link>
        </Button>
      </div>
      <div className="mt-6 p-4 bg-muted rounded-lg text-left max-w-md w-full">
        <p className="text-xs text-muted-foreground mb-1">Error details:</p>
        <code className="text-xs text-destructive break-words">
          {error.message || "Unknown error occurred"}
        </code>
      </div>
    </div>
  );
}
