"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="max-w-screen h-screen w-full bg-background p-8 rounded-xl shadow-lg text-center flex items-center justify-center flex-col">
      <div className="flex justify-center mb-6 ">
        <div className="bg-destructive/10 p-3 rounded-full">
          <AlertCircle className="h-10 w-10 text-destructive" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">
        Something went wrong!
      </h1>
      <p className="text-muted-foreground mb-6">
        We&apos;re sorry, but an unexpected error occurred. Please try refreshing the
        page or contact support if the problem persists.
      </p>
      <div className="space-y-3">
        <Button
          onClick={() => window.location.reload()}
          className="w-full"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button
          variant="outline"
          className="w-full border-border text-foreground hover:bg-muted flex items-center justify-center gap-2"
          onClick={() => (window.location.href = "/")}
        >
          <Home className="h-4 w-4" />
          Go to Homepage
        </Button>
      </div>
      <div className="mt-6 p-4 bg-muted rounded-lg text-left">
        <p className="text-xs text-muted-foreground mb-1">Error details:</p>
        <code className="text-xs text-destructive break-words">
          {error.message || "Unknown error occurred"}
        </code>
      </div>
    </div>
  );
}
