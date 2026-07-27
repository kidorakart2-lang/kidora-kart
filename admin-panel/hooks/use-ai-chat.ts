"use client";

import { useChat as useVercelChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  generateId,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import type { UIMessage } from "ai";
import { useState, useCallback, useRef } from "react";

export type { UIMessage };

export interface ToolInvocationDisplay {
  toolCallId: string;
  toolName: string;
  state: "call" | "result" | "error";
  args?: unknown;
  result?: unknown;
  error?: string;
}

export function useAiChat(options: {
  api?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  credentials?: RequestCredentials;
  initialMessages?: UIMessage[];
  initialConversationId?: string;
  onError?: (error: Error) => void;
  onFinish?: () => void;
}) {
  const {
    api = "/api/admin/ai-agent/chat",
    headers = {},
    body: extraBody = {},
    credentials = "include",
    initialMessages = [],
    initialConversationId,
    onError,
    onFinish,
  } = options;

  const [conversationId, setConversationIdState] = useState<string | null>(
    initialConversationId || null,
  );
  const idRef = useRef<string>(initialConversationId || generateId());
  const extraBodyRef = useRef(extraBody);
  extraBodyRef.current = extraBody;

  const chat = useVercelChat({
    id: idRef.current,
    transport: new DefaultChatTransport({
      api,
      headers,
      credentials,
      body: () => ({ ...extraBodyRef.current, conversationId: idRef.current }),
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onError: (err) => onError?.(err),
    onFinish,
  });

  const setConversationId = useCallback((id: string | null) => {
    setConversationIdState(id);
    idRef.current = id || generateId();
  }, []);

  const toolInvocations: ToolInvocationDisplay[] = [];
  for (const msg of chat.messages) {
    if (msg.role !== "assistant") continue;
    for (const part of msg.parts ?? []) {
      if (part.type !== "dynamic-tool") continue;
      const p = part as {
        type: "dynamic-tool";
        toolName: string;
        toolCallId: string;
        state: string;
        input?: unknown;
        output?: unknown;
        errorText?: string;
      };
      const isResult = p.state === "output-available";
      const isError = p.state === "output-error";
      toolInvocations.push({
        toolCallId: p.toolCallId,
        toolName: p.toolName,
        state: isError ? "error" : isResult ? "result" : "call",
        args: p.input,
        result: isResult ? p.output : undefined,
        error: p.errorText,
      });
    }
  }

  return {
    ...chat,
    conversationId,
    setConversationId,
    toolInvocations,
    isStreaming: chat.status === "submitted" || chat.status === "streaming",
  };
}
