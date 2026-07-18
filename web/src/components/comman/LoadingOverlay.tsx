"use client";

import { Loader2 } from "lucide-react";

export default function LoadingOverlay({ hidden }: { hidden: boolean }) {
  return (
    <div
      className={
        !hidden
          ? "hidden"
          : "fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-[1800]"
      }
    >
      <div className="text-center">
        <Loader2 className="w-10 h-10 animate-spin text-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Updating…</p>
      </div>
    </div>
  );
}
