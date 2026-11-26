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
        <div className="mt-0.5 grid size-8 flex-shrink-0 place-items-center rounded-lg bg-[#1c141c] text-[#e6d0a2] shadow-sm">
          <Bot className="h-4 w-4" strokeWidth={1.6} />
        </div>
      )}

      <div className="relative max-w-[88%]">
        {!isUser && !streaming && textContent && (
          <button
            onClick={handleCopy}
            className="absolute -right-2 -top-2 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-[#c6a875]/30 bg-card opacity-0 shadow-sm transition-opacity hover:bg-accent group-hover:opacity-100"
            title={copied ? "Copied!" : "Copy response"}
          >
            {copied ? <Check className="h-3 w-3 text-chart-1" /> : <Copy className="h-3 w-3 text-muted-foreground" />}
          </button>
        )}

        <div
          className={cn(
            "px-4 py-3",
            isUser
              ? "rounded-2xl rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/15"
              : "rounded-2xl rounded-tl-md border border-[#c6a875]/20 bg-card text-card-foreground shadow-sm",
          )}
        >
          {isUser ? (
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{textContent}</p>
          ) : (
            <>
              <MarkdownMessage content={textContent} />
            </>
          )}
        </div>
      </div>

      {isUser && (
        <div className="mt-0.5 grid size-8 flex-shrink-0 place-items-center rounded-lg border border-[#c6a875]/25 bg-[#c6a875]/10 text-[#8a6428]">
          <User className="h-4 w-4" strokeWidth={1.6} />
        </div>
      )}
    </div>
  );
});
