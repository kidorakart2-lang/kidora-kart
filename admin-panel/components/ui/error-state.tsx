"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error description or message */
  message?: string;
  /** Icon to display (defaults to AlertTriangle) */
  icon?: React.ReactNode;
  /** Retry callback — if provided, a retry button is shown */
  onRetry?: () => void;
  /** Custom action button */
  action?: React.ReactNode;
  /** Additional classes */
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message,
  icon,
  onRetry,
  action,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-12 px-6 text-center",
        className
      )}
    >
      <div className="p-3 rounded-full bg-destructive/10">
        {icon ?? <AlertTriangle className="h-8 w-8 text-destructive" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-lg font-semibold">{title}</h3>
        {message && (
          <p className="text-sm text-muted-foreground max-w-md">{message}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        {action}
      </div>
    </div>
  );
}
