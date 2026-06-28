"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      {/*
       * Static fallback that works without JavaScript.
       * Framer Motion animations are applied as progressive enhancement via JS only.
       */}
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 text-red-500 mb-6">
            <AlertCircle className="h-24 w-24" />
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Something went wrong!
          </h1>

          <p className="text-gray-600 mb-6 text-lg">
            {"We're sorry, but an unexpected problem appeared. Please try again."}
          </p>

          <p className="text-gray-500 text-sm mb-8">
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
            onClick={() => reset()}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </div>

        <div className="mt-16 text-gray-400 text-sm">
          <p>If the problem persists, please contact support.</p>
        </div>
      </div>
    </div>
  );
}
