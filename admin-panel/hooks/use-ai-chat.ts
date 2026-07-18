"use client";

import { useState, useRef, useCallback } from "react";

// ── Types ──────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface ToolCallData {
  toolCallId: string;
  toolName: string;
  args: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "done";
}

export type ChatStatus = "ready" | "submitted" | "streaming" | "error";

interface DataStreamChunk {
  type: "text" | "tool-call" | "tool-result" | "error" | "finish" | "continuation";
  text?: string;
  toolCallId?: string;
  toolName?: string;
  args?: Record<string, unknown>;
  result?: unknown;
  message?: string;
  conversationId?: string;
  finishReason?: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
}

interface UseAiChatOptions {
  api?: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  credentials?: RequestCredentials;
  initialMessages?: ChatMessage[];
  initialConversationId?: string;
  onError?: (error: Error) => void;
  onFinish?: () => void;
  onContinuation?: () => void;
}

interface UseAiChatReturn {
  messages: ChatMessage[];
  setMessages: (messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  status: ChatStatus;
  error: Error | null;
  toolCalls: ToolCallData[];
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  sendMessage: (content: string) => Promise<void>;
  stop: () => void;
  reset: () => void;
  regenerate: () => Promise<void>;
  clearError: () => void;
  clearToolCalls: () => void;
  removeToolCall: (toolCallId: string) => void;
  markToolCallDone: (toolCallId: string) => void;
  continuing: boolean;
}

// ── Helpers ────────────────────────────────────────────────────────

let counter = 0;
function generateId(): string {
  counter += 1;
  return `msg_${Date.now()}_${counter}`;
}

// ── Hook ───────────────────────────────────────────────────────────

export function useAiChat(options: UseAiChatOptions = {}): UseAiChatReturn {
  const {
    api = "/api/admin/ai-agent/chat",
    headers = {},
    body: extraBody = {},
    credentials = "include",
    initialMessages = [],
    initialConversationId,
    onError,
    onFinish,
    onContinuation,
  } = options;

  const [messages, setMessagesState] = useState<ChatMessage[]>(initialMessages);
  const [status, setStatus] = useState<ChatStatus>("ready");
  const [error, setErrorState] = useState<Error | null>(null);
  const [toolCalls, setToolCalls] = useState<ToolCallData[]>([]);
  const [continuing, setContinuing] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null,
  );

  const abortRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  messagesRef.current = messages;
  const conversationIdRef = useRef<string | null>(conversationId);
  conversationIdRef.current = conversationId;

  const setMessages = useCallback(
    (updater: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
      setMessagesState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        messagesRef.current = next;
        return next;
      });
    },
    [],
  );

  const clearError = useCallback(() => setErrorState(null), []);
  const clearToolCalls = useCallback(() => setToolCalls([]), []);
  const removeToolCall = useCallback((toolCallId: string) => {
    setToolCalls((prev) => prev.filter((tc) => tc.toolCallId !== toolCallId));
  }, []);
  const markToolCallDone = useCallback((toolCallId: string) => {
    setToolCalls((prev) =>
      prev.map((tc) =>
        tc.toolCallId === toolCallId ? { ...tc, status: "done" as const } : tc,
      ),
    );
  }, []);

  const doFetch = useCallback(
    async (currentMessages: ChatMessage[]) => {
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus("submitted");
      setErrorState(null);
      setToolCalls([]);
      setContinuing(false);

      try {
        // Add a 60-second timeout so the request doesn't hang forever
        const timeoutId = setTimeout(() => controller.abort(), 60_000);

        const bodyPayload: Record<string, unknown> = {
          messages: currentMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          ...extraBody,
        };

        // Include conversationId if we have one
        if (conversationIdRef.current) {
          bodyPayload.conversationId = conversationIdRef.current;
        }

        const response = await fetch(api, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...headers,
          },
          credentials,
          body: JSON.stringify(bodyPayload),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          const text = await response.text().catch(() => "");
          let msg = `Request failed (${response.status})`;
          try {
            const json = JSON.parse(text);
            msg = json._message || json.message || msg;
          } catch {
            // ignore
          }
          throw new Error(msg);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        setStatus("streaming");

        const decoder = new TextDecoder();
        let buffer = "";
        let fullContent = "";

        // Add placeholder assistant message for streaming
        const assistantId = generateId();
        setMessages((prev) => [
          ...prev,
          { id: assistantId, role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              const chunk: DataStreamChunk = JSON.parse(line);

              switch (chunk.type) {
                case "text":
                  fullContent += chunk.text || "";
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent }
                        : m,
                    ),
                  );
                  break;

                case "tool-call":
                  setToolCalls((prev) => [
                    ...prev,
                    {
                      toolCallId: chunk.toolCallId || "",
                      toolName: chunk.toolName || "",
                      args: (chunk.args as Record<string, unknown>) || {},
                      status: "done",
                    },
                  ]);
                  break;

                case "tool-result": {
                  const toolResult = chunk.result as Record<string, unknown> | undefined;
                  const isProposal = toolResult?.proposed === true;
                  setToolCalls((prev) =>
                    prev.map((tc) =>
                      tc.toolCallId === chunk.toolCallId
                        ? {
                            ...tc,
                            result: chunk.result,
                            status: isProposal ? "pending" : "done",
                          }
                        : tc,
                    ),
                  );
                  break;
                }

                case "error":
                  throw new Error(chunk.message || "Stream error");

                case "continuation":
                  setContinuing(true);
                  onContinuation?.();
                  break;

                case "finish":
                  setContinuing(false);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantId
                        ? { ...m, content: fullContent || m.content }
                        : m,
                    ),
                  );
                  // Capture conversationId from finish chunk
                  if (chunk.conversationId) {
                    setConversationId(chunk.conversationId);
                    conversationIdRef.current = chunk.conversationId;
                  }
                  break;
              }
            } catch {
              // skip malformed lines
            }
          }
        }

        // If no content was streamed and no tool calls, remove the empty message
        setMessages((prev) =>
          prev.filter(
            (m) => m.id !== assistantId || m.content.trim() !== "" || toolCalls.length > 0,
          ),
        );

        setStatus("ready");
        onFinish?.();
      } catch (err) {
        setContinuing(false);
        if ((err as Error)?.name === "AbortError") {
          setStatus("ready");
          setToolCalls([]);
          return;
        }
        const error =
          err instanceof Error ? err : new Error("Failed to send message");
        setErrorState(error);
        setStatus("error");
        onError?.(error);
      } finally {
        abortRef.current = null;
      }
    },
    [api, headers, credentials, extraBody, onError, onFinish, setMessages],
  );

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || status === "submitted" || status === "streaming") return;

      const userMsg: ChatMessage = { id: generateId(), role: "user", content: content.trim() };
      const updatedMessages = [...messagesRef.current, userMsg];
      setMessages(updatedMessages);

      await doFetch(updatedMessages);
    },
    [status, doFetch, setMessages],
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
    setStatus("ready");
    setToolCalls([]);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setStatus("ready");
    setErrorState(null);
    setToolCalls([]);
    setContinuing(false);
  }, []);

  const regenerate = useCallback(async () => {
    const current = messagesRef.current;

    const lastMsg = current[current.length - 1];
    const filtered =
      lastMsg?.role === "assistant" ? current.slice(0, -1) : current;

    setMessages(filtered);
    setErrorState(null);
    setToolCalls([]);

    await doFetch(filtered);
  }, [doFetch, setMessages]);

  return {
    messages,
    setMessages,
    status,
    error,
    toolCalls,
    continuing,
    conversationId,
    setConversationId,
    sendMessage,
    stop,
    reset,
    regenerate,
    clearError,
    clearToolCalls,
    removeToolCall,
    markToolCallDone,
  };
}
