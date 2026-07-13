"use client";

import { Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { MarkdownMessage } from "./MarkdownMessage";
import type { ChatMessage as ChatMessageType } from "@/hooks/use-ai-chat";

interface ChatMessageProps {
  message: ChatMessageType;
  isLastAssistant: boolean;
  streaming: boolean;
}

export function ChatMessage({ message, isLastAssistant, streaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-bl-sm shadow-sm",
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <>
            {/* Status badge for streaming */}
            {streaming && isLastAssistant && !message.content && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">                    Generating...
                </span>
              </div>
            )}
            <MarkdownMessage content={message.content} />
            {isLastAssistant && streaming && (
              <span className="inline-block w-1.5 h-4 bg-blue-600 dark:bg-blue-400 ml-0.5 rounded-sm animate-pulse align-text-bottom" />
            )}
            {/* Done badge */}
            {!streaming && message.content && isLastAssistant && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-zinc-400">Response complete</span>
              </div>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700 flex items-center justify-center flex-shrink-0 mt-1">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </div>
  );
}
