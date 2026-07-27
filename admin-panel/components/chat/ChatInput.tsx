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
      {centered && (
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Provider
        </span>
      )}
      {!centered && (
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          AI Provider
        </span>
      )}
      <Select
        value={selectedProvider}
        onValueChange={onProviderChange}
        disabled={isStreaming}
      >
        <SelectTrigger className="w-auto h-6 text-[10px] gap-1 border-0 bg-white/5 hover:bg-white/10 px-2 text-zinc-300">
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
    <p className="text-[10px] text-zinc-400 text-center mt-2">
      Press Enter to send · Shift+Enter for new line
    </p>
  ) : providers.length === 0 ? (
    <p className="text-[10px] text-zinc-400 text-center mt-2">
      Configure an AI provider API key to use the agent.
    </p>
  ) : providers.length > 1 && !isStreaming && !hasError ? (
    <p className="text-[10px] text-zinc-400 text-center mt-1.5">
      Press Enter to send · Shift+Enter for new line
    </p>
  ) : null;

  // Regenerate button (only in bottom mode)
  const regenerateBtn = !centered && onRegenerate && showRegenerate ? (
    <div className="flex items-center justify-center mt-2">
      <button
        onClick={onRegenerate}
        className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors px-3 py-1 rounded-full hover:bg-white/10"
      >
        <RefreshCw className="h-3 w-3" />
        Regenerate response
      </button>
    </div>
  ) : null;

  return (
    <div className={cn(
      "flex-shrink-0",
      centered
        ? "backdrop-blur-2xl bg-zinc-900/40 border border-white/10 rounded-2xl shadow-2xl"
        : "backdrop-blur-2xl bg-zinc-950/30 border-t border-white/10",
    )}>
      <div className={cn(
        "px-4 py-3",
        centered ? "max-w-2xl mx-auto" : "max-w-3xl mx-auto",
      )}>
        {providerSelector}

        <div
          className={cn(
            "flex gap-2 items-end backdrop-blur-xl border rounded-xl px-3 py-2 transition-all shadow-lg",
            centered
              ? "bg-zinc-800/60 border-white/10"
              : "bg-zinc-900/60 border-white/10",
            isFocused
              ? "ring-2 ring-blue-500/40 border-blue-400/50"
              : "",
            isStreaming && "ring-1 ring-amber-500/30 border-amber-400/40",
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
              "flex-1 bg-transparent border-none outline-none resize-none placeholder:text-zinc-400 disabled:opacity-50 max-h-[200px] leading-relaxed text-zinc-200",
              centered ? "text-base py-1" : "text-sm",
            )}
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500/80 hover:bg-red-600 text-white transition-colors flex-shrink-0 animate-pulse backdrop-blur-sm"
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
                "h-8 w-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0 backdrop-blur-sm",
                canSend
                  ? "bg-blue-600/80 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-xl active:scale-95"
                  : "bg-white/5 text-zinc-500 cursor-not-allowed",
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
