"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAiChat } from "@/hooks/use-ai-chat";
import type { UIMessage } from "ai";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { HistorySidebar } from "@/components/chat/HistorySidebar";
import { AiAgentSuggestions } from "@/components/ai-agent/AiAgentSuggestions";
import { ToolCallIndicators } from "@/components/ai-agent/ToolCallIndicators";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Sparkles, PanelLeftOpen, Bot } from "lucide-react";
import type { AiHistoryItem } from "@/lib/types";
import { cn } from "@/lib/utils";

function getAdminToken(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/(?:^|;\s*)adminToken=([^;]*)/)?.[1] ?? null;
}

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  return document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/)?.[1] ?? "";
}

export default function AiAgentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedProvider, setSelectedProvider] = useState<string>(() =>
    typeof window !== "undefined" ? localStorage.getItem("ai-agent-provider") || "" : "",
  );
  const [showHistory, setShowHistory] = useState(true);
  const [input, setInput] = useState("");
  const [conversationKey, setConversationKey] = useState<string>("new");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<{ focus: () => void }>(null);
  const rafRef = useRef<number | null>(null);

  const authHeaders: Record<string, string> = {};
  const adminToken = getAdminToken();
  const csrfToken = getCsrfToken();
  if (csrfToken) authHeaders["x-csrf-token"] = csrfToken;
  if (adminToken) authHeaders["Authorization"] = `Bearer ${adminToken}`;

  const {
    messages,
    setMessages,
    status,
    error,
    toolInvocations,
    conversationId,
    setConversationId,
    sendMessage: sendChatMessage,
    stop,
    clearError,
    isStreaming,
  } = useAiChat({
    api: "/api/admin/ai-agent/chat",
    headers: authHeaders,
    body: { provider: selectedProvider || undefined },
    credentials: "include",
    onError: (err) => {
      toast({ title: "AI Agent Error", description: err.message, variant: "destructive" });
    },
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-history"] });
    },
  });

  const isLanding = messages.length === 0;

  const scrollToBottom = useCallback((smooth = true) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) return;
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
      rafRef.current = null;
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isAtBottomRef.current = atBottom;
    setShowScrollBtn(!atBottom);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (isAtBottomRef.current) {
      scrollToBottom(!isStreaming);
    }
  }, [messages, status, scrollToBottom, isStreaming]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
  }, [conversationKey]);

  useEffect(() => { isAtBottomRef.current = true; }, [conversationKey]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const { data: providers = [] } = useQuery<string[]>({
    queryKey: ["ai-agent-providers"],
    queryFn: () => api.get("/api/admin/ai-agent/providers"),
    staleTime: 60_000,
  });

  const { data: historyData, isLoading: historyLoading } = useQuery<{
    items: AiHistoryItem[];
    pagination: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ["ai-agent-history"],
    queryFn: () => api.get("/api/admin/ai-agent/history"),
    staleTime: 30_000,
  });

  useEffect(() => {
    if (selectedProvider) localStorage.setItem("ai-agent-provider", selectedProvider);
  }, [selectedProvider]);

  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      const stored = localStorage.getItem("ai-agent-provider");
      if (stored && providers.includes(stored)) {
        setSelectedProvider(stored);
      } else {
        setSelectedProvider(providers.includes("openrouter") ? "openrouter" : providers[0]);
      }
    }
  }, [providers, selectedProvider]);

  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    isAtBottomRef.current = true;
    sendChatMessage({ text: input.trim() });
    setInput("");
  };

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
    setTimeout(() => {
      isAtBottomRef.current = true;
      sendChatMessage({ text: prompt });
      setInput("");
    }, 50);
  };

  const loadHistoryConversation = (item: AiHistoryItem) => {
    setConversationKey(item._id);
    setConversationId(item._id);

    if (item.messages && item.messages.length > 0) {
      const first = item.messages[0] as Record<string, unknown>;
      if (first.role && typeof first.content === "string" && !first.parts) {
        const restoredMessages: UIMessage[] = item.messages.map((m, i) => ({
          id: `hist-${item._id}-${i}`,
          role: (m as Record<string, unknown>).role as "user" | "assistant",
          content: (m as Record<string, unknown>).content as string,
          parts: [{ type: "text" as const, text: (m as Record<string, unknown>).content as string }],
        }));
        setMessages(restoredMessages);
      } else {
        setMessages(item.messages as UIMessage[]);
      }
    }
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    setDeletingId(pendingDeleteId);
    try {
      await api.del(`/api/admin/ai-agent/history/${pendingDeleteId}`);
      queryClient.invalidateQueries({ queryKey: ["ai-agent-history"] });
      if (conversationId === pendingDeleteId) startNewChat();
      toast({ title: "Conversation deleted" });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  };

  const startNewChat = () => {
    setConversationKey(`new-${Date.now()}`);
    setMessages([]);
    setConversationId(null);
    clearError();
    isAtBottomRef.current = true;
    inputRef.current?.focus();
  };

  const historyItems = historyData?.items ?? [];
  const isHistoryEmpty = historyItems.length === 0;

  return (
    <div className="h-dvh w-screen overflow-hidden bg-[#0F172A]">
      <div className="h-full w-full flex">
        <HistorySidebar
          show={showHistory}
          onClose={() => setShowHistory(false)}
          items={historyItems}
          total={historyData?.pagination.total}
          isLoading={historyLoading}
          isEmpty={isHistoryEmpty}
          activeKey={conversationKey}
          deletingId={deletingId}
          onLoadConversation={loadHistoryConversation}
          onDeleteConversation={deleteConversation}
          onNewChat={startNewChat}
        />

        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 backdrop-blur-2xl bg-zinc-950/30 z-10 shrink-0 shadow-lg">
            <div className="flex items-center gap-3">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors text-zinc-400"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
              <h1 className="text-base font-semibold flex items-center gap-2 text-zinc-200">
                <Sparkles className="h-4 w-4 text-blue-500" />
                AI Agent
                {isStreaming && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/15 backdrop-blur-sm px-2 py-0.5 rounded-full border border-amber-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {status === "submitted" ? "Connecting..." : "Streaming"}
                  </span>
                )}
                {status === "error" && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-red-300 bg-red-500/15 backdrop-blur-sm px-2 py-0.5 rounded-full border border-red-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    Error
                  </span>
                )}
                {status === "ready" && messages.length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/15 backdrop-blur-sm px-2 py-0.5 rounded-full border border-emerald-400/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Ready
                  </span>
                )}
              </h1>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {isLanding ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col items-center justify-center px-4 overflow-hidden"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl font-semibold text-zinc-100 mb-2">
                    Where should we begin?
                  </h2>
                  <p className="text-sm text-zinc-400">
                    I can help you manage your store — create products, FAQs, and more.
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="w-full max-w-2xl"
                >
                  <ChatInput
                    ref={inputRef}
                    input={input}
                    onInputChange={setInput}
                    onSend={handleSend}
                    onStop={stop}
                    isStreaming={isStreaming}
                    providers={providers}
                    selectedProvider={selectedProvider}
                    onProviderChange={setSelectedProvider}
                    messagesLength={messages.length}
                    hasError={!!error}
                    centered
                  />
                </motion.div>

                <AiAgentSuggestions onSuggestion={handleSuggestion} />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden relative"
              >
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto overscroll-contain min-h-0"
                >
                  <div className="px-4 pt-6 max-w-3xl mx-auto space-y-6 pb-4">
                    {messages.map((msg, i) => (
                      <ChatMessageComponent
                        key={msg.id || i}
                        message={msg}
                        isLastAssistant={!msg.role.includes("user") && i === messages.length - 1}
                        streaming={isStreaming}
                      />
                    ))}

                    <ToolCallIndicators toolInvocations={toolInvocations} />

                    {isStreaming && toolInvocations.length === 0 && (
                      <div className="flex gap-3">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-500/20">
                          <Bot className="h-3.5 w-3.5 text-white" />
                        </div>
                        <div className="backdrop-blur-xl bg-zinc-900/50 border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-lg">
                          <div className="flex gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                            <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                          </div>
                        </div>
                      </div>
                    )}

                    {error && (
                      <div className="flex justify-center">
                        <div className="backdrop-blur-xl bg-red-500/15 border border-red-400/30 rounded-lg px-4 py-3 text-center max-w-md">
                          <p className="text-xs text-red-300 mb-2">{error.message}</p>
                          <button
                            onClick={() => { clearError(); }}
                            className="inline-flex items-center gap-1 text-xs bg-red-600/80 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors backdrop-blur-sm"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Scroll to bottom button */}
                  {showScrollBtn && (
                    <button
                      onClick={() => scrollToBottom(true)}
                      className="absolute bottom-20 right-6 h-8 w-8 rounded-full bg-zinc-800/80 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-lg hover:bg-zinc-700 transition-all z-10"
                      title="Scroll to bottom"
                    >
                      <span className="text-zinc-400 text-lg leading-none">↓</span>
                    </button>
                  )}
                </div>

                <ChatInput
                  ref={inputRef}
                  input={input}
                  onInputChange={setInput}
                  onSend={handleSend}
                  onStop={stop}
                  isStreaming={isStreaming}
                  providers={providers}
                  selectedProvider={selectedProvider}
                  onProviderChange={setSelectedProvider}
                  messagesLength={messages.length}
                  hasError={!!error}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <AlertDialogUse
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onConfirm={confirmDelete}
          title="Delete conversation?"
          description="This action cannot be undone. The conversation will be permanently removed."
          confirmText="Delete"
        />
      </div>
    </div>
  );
}
