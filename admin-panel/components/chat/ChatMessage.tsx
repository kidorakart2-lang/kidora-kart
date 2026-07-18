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
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-blue-500/20">
          <Bot className="h-3.5 w-3.5 text-white" />
        </div>
      )}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-3 backdrop-blur-xl",
          isUser
            ? "bg-blue-600/80 text-white rounded-br-sm shadow-lg shadow-blue-600/20"
            : "bg-white/30 dark:bg-zinc-900/50 border border-white/30 dark:border-white/10 rounded-bl-sm shadow-xl",
        )}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        ) : (
          <>
            {streaming && isLastAssistant && !message.content && (
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
                  Generating...
                </span>
              </div>
            )}
            <MarkdownMessage content={message.content} />
            {isLastAssistant && streaming && (
              <span className="inline-block w-1.5 h-4 bg-blue-600 dark:bg-blue-400 ml-0.5 rounded-sm animate-pulse align-text-bottom" />
            )}
            {!streaming && message.content && isLastAssistant && (
              <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/20 dark:border-white/10">
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400">Response complete</span>
              </div>
            )}
          </>
        )}
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-zinc-700/80 backdrop-blur-sm flex items-center justify-center flex-shrink-0 mt-1 shadow-lg">
          <User className="h-3.5 w-3.5 text-white" />
        </div>
      )}
    </div>
  );
}
