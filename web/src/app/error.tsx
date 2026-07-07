"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-muted to-muted/80 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 text-destructive mb-6">
            <AlertCircle className="h-24 w-24" />
          </div>

          <h1 className="text-4xl font-bold text-foreground mb-4">
            Something went wrong!
          </h1>

          <p className="text-muted-foreground mb-6 text-lg">
            {"We're sorry, but an unexpected problem appeared. Please try again."}
          </p>

          <p className="text-muted-foreground text-sm mb-8">
            Error code: {error?.digest || "UNKNOWN_ERROR"}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" passHref>
            <Button className="gap-2" size="lg">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>

          <Button
            variant="outline"
            className="gap-2"
            size="lg"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>

        <div className="mt-16 text-muted-foreground/60 text-sm">
          <p>If the problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
