"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, StopCircle, RefreshCw, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onStop: () => void;
  onRegenerate?: () => void;
  isStreaming: boolean;
  providers: string[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  messagesLength: number;
  hasError: boolean;
  centered?: boolean;
}

export const ChatInput = forwardRef<{ focus: () => void }, ChatInputProps>(function ChatInput({
  input,
  onInputChange,
  onSend,
  onStop,
  onRegenerate,
  isStreaming,
  providers,
  selectedProvider,
  onProviderChange,
  messagesLength,
  hasError,
  centered = false,
}: ChatInputProps, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  }, [input]);

  const canSend = input.trim().length > 0 && !isStreaming && providers.length > 0;
  const showRegenerate = !isStreaming && messagesLength > 1 && !hasError;

  // Provider selector (shown above input when multiple providers)
  const providerSelector = providers.length > 1 ? (
    <div className={cn(
      "flex items-center justify-between mb-2 px-1",
      centered && "justify-center gap-3 mb-3",
    )}>
      <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground flex items-center gap-1.5">
        <Sparkles className="h-3 w-3 text-[#c6a875]" />
        Model
      </span>
      <Select
        value={selectedProvider}
        onValueChange={onProviderChange}
        disabled={isStreaming}
      >
        <SelectTrigger className="h-7 w-auto gap-1 rounded-full border border-[#c6a875]/30 bg-[#c6a875]/10 px-2.5 text-[10px] text-[#8a6428] hover:bg-[#c6a875]/15">
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {providers.map((p) => (
            <SelectItem key={p} value={p} className="text-xs">
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null;

  // Help text below input
  const helpText = centered ? (
    <p className="text-[10px] text-muted-foreground text-center mt-2">
      Press Enter to send · Shift+Enter for new line
    </p>
  ) : providers.length === 0 ? (
    <p className="text-[10px] text-muted-foreground text-center mt-2">
      Configure an AI provider API key to use the agent.
    </p>
  ) : providers.length > 1 && !isStreaming && !hasError ? (
    <p className="text-[10px] text-muted-foreground text-center mt-1.5">
      Press Enter to send · Shift+Enter for new line
    </p>
  ) : null;

  // Regenerate button (only in bottom mode)
  const regenerateBtn = !centered && onRegenerate && showRegenerate ? (
    <div className="flex items-center justify-center mt-2">
      <button
        onClick={onRegenerate}
        className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-full hover:bg-accent"
      >
        <RefreshCw className="h-3 w-3" />
        Regenerate response
      </button>
    </div>
  ) : null;

  return (
    <div className={cn(
      "shrink-0",
      centered
        ? "rounded-2xl border border-[#c6a875]/30 bg-card/90 shadow-[0_28px_70px_-45px_rgba(28,20,28,0.65)] backdrop-blur-xl"
        : "border-t border-[#c6a875]/20 bg-card/80 backdrop-blur-xl",
    )}>
      <div className={cn(
        "px-3 py-3 sm:px-4",
        centered ? "mx-auto max-w-2xl" : "mx-auto max-w-3xl",
      )}>
        {providerSelector}

        <div
          className={cn(
            "flex items-end gap-2 rounded-xl border px-3.5 py-2.5 transition-all",
            "border-[#c6a875]/25 bg-background/65",
            isFocused
              ? "border-[#c6a875]/60 ring-2 ring-[#c6a875]/20"
              : "",
            isStreaming && "border-chart-3/40 ring-1 ring-chart-3/25",
          )}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={
              providers.length === 0
                ? "No AI providers configured..."
                : isStreaming
                  ? "Waiting for response..."
                  : centered
                    ? "Ask anything..."
                    : "Type a message..."
            }
            disabled={isStreaming || providers.length === 0}
            rows={1}
            className={cn(
              "max-h-[200px] flex-1 resize-none border-none bg-transparent py-1 leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-50",
              centered ? "text-[15px]" : "text-sm",
            )}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive text-destructive-foreground transition-colors hover:bg-destructive/90"
              title="Stop generating"
            >
              <StopCircle className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              className={cn(
                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
                canSend
                  ? "bg-[#1c141c] text-[#f7efe6] shadow-md shadow-[#1c141c]/20 hover:bg-[#2e1b29] active:scale-95"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        {helpText}
        {regenerateBtn}
      </div>
    </div>
  );
});
