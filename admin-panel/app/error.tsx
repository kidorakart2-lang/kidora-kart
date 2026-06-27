"use client";

import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";

export default function GlobalError({
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
    <div className="max-w-screen h-screen w-full bg-white p-8 rounded-xl shadow-lg text-center flex items-center justify-center flex-col">
      <div className="flex justify-center mb-6">
        <div className="bg-red-100 p-3 rounded-full">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Something went wrong!
      </h1>
      <p className="text-gray-600 mb-6">
        We&apos;re sorry, but an unexpected error occurred. Please try refreshing the
        page or contact support if the problem persists.
      </p>
      <div className="space-y-3">
        <Button
          onClick={() => reset()}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Try again
        </Button>
        <Button
          variant="outline"
          className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
          onClick={() => (window.location.href = "/")}
        >
          <Home className="h-4 w-4" />
          Go to Homepage
        </Button>
      </div>
      <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
        <p className="text-xs text-gray-500 mb-1">Error details:</p>
        <code className="text-xs text-red-600 break-words">
          {error.message || "Unknown error occurred"}
        </code>
      </div>
    </div>
  );
}
