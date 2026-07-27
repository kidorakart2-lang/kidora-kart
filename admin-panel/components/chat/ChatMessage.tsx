"use client";

import { memo } from "react";
import { Bot, User, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./MarkdownMessage";
import type { UIMessage } from "ai";
import { useState } from "react";

interface ChatMessageProps {
  message: UIMessage;
  isLastAssistant: boolean;
  streaming: boolean;
}

function getTextContent(message: UIMessage): string {
  if (!message.parts) return "";
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => (p as { text: string }).text)
    .join("");
}

export const ChatMessage = memo(function ChatMessage({ message, isLastAssistant, streaming }: ChatMessageProps) {
  const isUser = message.role === "user";
  const textContent = getTextContent(message);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!textContent) return;
    try {
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard not available */ }
  };

  return (
    <div className={cn("flex gap-3 group", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-blue-500/20">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div className="relative max-w-[85%]">
        {!isUser && !streaming && textContent && (
          <button
            onClick={handleCopy}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-zinc-800/80 border border-white/10 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-zinc-700 z-10"
            title={copied ? "Copied!" : "Copy response"}
          >
            {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3 text-zinc-400" />}
          </button>
        )}

        <div
          className={cn(
            "rounded-2xl px-4 py-3 backdrop-blur-xl",
            isUser
              ? "bg-blue-600/80 text-white rounded-br-sm shadow-lg shadow-blue-600/20"
              : "bg-white/30 dark:bg-zinc-900/50 border border-white/30 dark:border-white/10 rounded-bl-sm shadow-xl",
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{textContent}</p>
          ) : (
            <>
              {streaming && isLastAssistant && !textContent && (
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                    Generating...
                  </span>
                </div>
              )}
              <MarkdownMessage content={textContent} />
              {isLastAssistant && streaming && textContent && (
                <span className="inline-block w-1.5 h-4 bg-blue-600 dark:bg-blue-400 ml-0.5 rounded-sm animate-pulse align-text-bottom" />
              )}
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </div>
  );
});
