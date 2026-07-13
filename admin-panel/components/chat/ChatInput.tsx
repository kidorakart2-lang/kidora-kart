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
  onRegenerate: () => void;
  isStreaming: boolean;
  providers: string[];
  selectedProvider: string;
  onProviderChange: (provider: string) => void;
  messagesLength: number;
  hasError: boolean;
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
}: ChatInputProps, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));
  const [isFocused, setIsFocused] = useState(false);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
    }
  }, [input]);

  const canSend = input.trim().length > 0 && !isStreaming && providers.length > 0;
  const showRegenerate = !isStreaming && messagesLength > 1 && !hasError;

  return (
    <div className="border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm flex-shrink-0">
      <div className="px-4 py-3 max-w-3xl mx-auto">
        {/* Provider selector row */}
        {providers.length > 1 && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI Provider
            </span>
            <Select
              value={selectedProvider}
              onValueChange={onProviderChange}
              disabled={isStreaming}
            >
              <SelectTrigger className="w-auto h-6 text-[10px] gap-1 border-0 bg-transparent hover:bg-zinc-100 dark:hover:bg-zinc-800 px-2">
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
        )}

        {/* Input container */}
        <div
          className={cn(
            "flex gap-2 items-end bg-white dark:bg-zinc-900 border rounded-xl px-3 py-2 transition-all",
            isFocused
              ? "ring-2 ring-blue-500/30 border-blue-500"
              : "border-zinc-300 dark:border-zinc-700",
            isStreaming && "ring-1 ring-amber-500/20 border-amber-300 dark:border-amber-700",
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
                  : "Type a message..."
            }
            disabled={isStreaming || providers.length === 0}
            rows={1}
            className="flex-1 text-sm bg-transparent border-none outline-none resize-none placeholder:text-zinc-400 disabled:opacity-50 max-h-[200px] leading-relaxed"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors flex-shrink-0 animate-pulse"
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
                "h-8 w-8 flex items-center justify-center rounded-lg transition-all flex-shrink-0",
                canSend
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md active:scale-95"
                  : "bg-zinc-300 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 cursor-not-allowed",
              )}
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status message */}
        {providers.length === 0 && (
          <p className="text-[10px] text-zinc-400 text-center mt-2">
            Configure an AI provider API key to use the agent.
          </p>
        )}
        {providers.length > 1 && !isStreaming && !hasError && (
          <p className="text-[10px] text-zinc-400 text-center mt-1.5">
            Press Enter to send · Shift+Enter for new line
          </p>
        )}

        {/* Regenerate button */}
        {showRegenerate && (
          <div className="flex items-center justify-center mt-2">
            <button
              onClick={onRegenerate}
              className="inline-flex items-center gap-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors px-3 py-1 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <RefreshCw className="h-3 w-3" />
              Regenerate response
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
