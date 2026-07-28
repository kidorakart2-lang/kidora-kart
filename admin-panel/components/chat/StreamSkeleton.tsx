"use client";

import { Bot } from "lucide-react";

const SKELETON_LINES = [
  "w-3/4",
  "w-full",
  "w-5/6",
  "w-2/3",
  "w-11/12",
  "w-1/2",
] as const;

/**
 * A polished loading placeholder shown while the AI agent is connecting
 * or thinking (before any tool calls or text content arrives).
 *
 * Design:
 * - Matches the assistant message layout (bot avatar + bubble)
 * - "Thinking…" label with animated dot ellipsis
 * - Shimmer skeleton lines that pulse, simulating content being generated
 * - The avatar gets a soft glow to indicate active processing
 */
export function StreamSkeleton() {
  return (
    <div className="flex gap-3 group">
      {/* Bot avatar with static glow */}
      <div className="relative shrink-0 mt-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-chart-4 flex items-center justify-center shadow-lg shadow-primary/30">
          <Bot className="h-3.5 w-3.5 text-primary-foreground" />
        </div>
      </div>

      {/* Skeleton bubble */}
      <div className="relative max-w-[85%] min-w-[200px]">
        <div className="bg-card border-border rounded-2xl rounded-bl-sm shadow-xl px-4 py-3.5 space-y-3">
          {/* "Thinking" label */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-muted-foreground/80">
              Thinking
            </span>
            <span className="flex gap-0.5">
              <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "0ms", animationDuration: "1.2s" }} />
              <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "200ms", animationDuration: "1.2s" }} />
              <span className="w-1 h-1 rounded-full bg-muted-foreground/60 animate-bounce" style={{ animationDelay: "400ms", animationDuration: "1.2s" }} />
            </span>
          </div>

          {/* Skeleton content lines with shimmer */}
          <div className="space-y-2.5">
            {SKELETON_LINES.map((width, i) => (
              <div
                key={i}
                className={`h-3 rounded-md bg-muted-foreground/10 animate-shimmer ${width}`}
                style={{
                  animationDelay: `${i * 150}ms`,
                  animationDuration: "2.5s",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
