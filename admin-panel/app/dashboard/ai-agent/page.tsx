"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAiChat } from "@/hooks/use-ai-chat";
import type { UIMessage } from "ai";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { HistorySidebar } from "@/components/chat/HistorySidebar";
import { AiAgentSuggestions } from "@/components/ai-agent/AiAgentSuggestions";
import { ToolCallIndicators } from "@/components/ai-agent/ToolCallIndicators";
import { StreamSkeleton } from "@/components/chat/StreamSkeleton";
import { AlertDialogUse } from "@/components/alert-dialog";
import { Sparkles, PanelLeftOpen, Plus, ShieldCheck, Database } from "lucide-react";
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
    regenerate,
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

  useEffect(() => {
    if (window.innerWidth < 1024) setShowHistory(false);
  }, []);

  const { data: providers = [] } = useQuery<string[]>({
    queryKey: ["ai-agent-providers"],
    queryFn: () => api.get("/api/admin/ai-agent/providers"),
    staleTime: 60_000,
  });

  const {
    data: historyPages,
    isLoading: historyLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<{
    items: AiHistoryItem[];
    pagination: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ["ai-agent-history"],
    queryFn: ({ pageParam }) =>
      api.get(`/api/admin/ai-agent/history?page=${pageParam}&limit=20`),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: 30_000,
  });

  const historyItems = historyPages?.pages.flatMap((p) => p.items) ?? [];
  const historyTotal = historyPages?.pages[0]?.pagination.total;
  const isHistoryEmpty = historyItems.length === 0;

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
    if (isStreaming) return; // Guard: already streaming
    setInput(prompt);
    setTimeout(() => {
      if (isStreaming) return; // Re-check: stream may have started since the guard
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

  const agentStatus = isStreaming
    ? status === "submitted"
      ? "Connecting"
      : "Working"
    : status === "error"
      ? "Needs attention"
      : messages.length > 0
        ? "Ready"
        : "Idle";

  return (
    <div className="h-dvh w-screen overflow-hidden bg-background">
      <div className="flex h-full w-full">
        <HistorySidebar
          show={showHistory}
          onClose={() => setShowHistory(false)}
          items={historyItems}
          total={historyTotal}
          isLoading={historyLoading}
          isEmpty={isHistoryEmpty}
          hasMore={hasNextPage}
          isLoadingMore={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          activeKey={conversationKey}
          deletingId={deletingId}
          onLoadConversation={loadHistoryConversation}
          onDeleteConversation={deleteConversation}
          onNewChat={startNewChat}
        />

        <div className="relative isolate flex min-h-0 min-w-0 flex-1 flex-col">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(75%_48%_at_80%_0%,rgba(198,168,117,0.13),transparent_62%),radial-gradient(60%_45%_at_8%_100%,rgba(74,37,66,0.06),transparent_60%)]"
          />

          <header className="z-10 flex h-16 shrink-0 items-center justify-between gap-3 border-b border-[#c6a875]/20 bg-card/75 px-4 backdrop-blur-xl sm:px-5">
            <div className="flex min-w-0 items-center gap-2.5">
              {!showHistory && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  title="Show chat history"
                >
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              )}
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#1c141c] text-[#e6d0a2] shadow-sm">
                <Sparkles className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="admin-display truncate text-[17px] leading-none text-foreground">
                    Ratnavya Studio
                  </h1>
                  <span className="rounded-full border border-[#c6a875]/35 bg-[#c6a875]/10 px-1.5 py-0.5 text-[8px] font-medium uppercase tracking-[0.18em] text-[#8a6428]">
                    AI
                  </span>
                </div>
                <p className="mt-1 truncate text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
                  Store operations copilot
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium sm:inline-flex",
                  isStreaming && "border-[#c6a875]/40 bg-[#c6a875]/10 text-[#8a6428]",
                  status === "error" && "border-destructive/30 bg-destructive/10 text-destructive",
                  !isStreaming && status !== "error" && "border-border bg-card/70 text-muted-foreground",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    isStreaming && "animate-pulse bg-[#c6a875]",
                    status === "error" && "bg-destructive",
                    !isStreaming && status !== "error" && "bg-emerald-500",
                  )}
                />
                {agentStatus}
              </span>
              <button
                onClick={startNewChat}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#c6a875]/35 bg-card px-2.5 text-[11px] font-medium text-foreground shadow-sm transition-colors hover:border-[#c6a875]/60 hover:bg-accent"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">New chat</span>
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {isLanding ? (
              <motion.div
                key="landing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3 }}
                className="relative flex-1 overflow-y-auto"
              >
                <div className="mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-5 py-10 sm:px-8">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.05 }}
                    className="text-center"
                  >
                    <div className="relative mx-auto mb-5 grid size-14 place-items-center rounded-2xl border border-[#c6a875]/35 bg-[#1c141c] text-[#e6d0a2] shadow-[0_18px_45px_-26px_rgba(28,20,28,0.9)]">
                      <Sparkles className="h-6 w-6" strokeWidth={1.4} />
                      <span className="absolute -right-1 -top-1 size-2.5 rounded-full bg-[#c6a875] ring-4 ring-background" />
                    </div>
                    <p className="admin-eyebrow">Ratnavya intelligence</p>
                    <h2 className="admin-display mx-auto mt-3 max-w-2xl text-[2.15rem] leading-[1.06] text-foreground sm:text-5xl">
                      What shall we take care of?
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-[13px] leading-relaxed text-muted-foreground">
                      Draft products, organise your catalogue, and find answers across your store — in plain language.
                    </p>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.14 }}
                    className="mt-8"
                  >
                    <ChatInput
                      ref={inputRef}
                      input={input}
                      onInputChange={setInput}
                      onSend={handleSend}
                      onStop={stop}
                      onRegenerate={regenerate}
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

                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.35 }}
                    className="mt-9 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[9.5px] uppercase tracking-[0.16em] text-muted-foreground/70"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-3 w-3" /> Admin-only workspace
                    </span>
                    <span className="size-1 rounded-full bg-[#c6a875]/60" />
                    <span className="inline-flex items-center gap-1.5">
                      <Database className="h-3 w-3" /> Connected to live catalogue
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative flex min-h-0 flex-1 flex-col overflow-hidden"
              >
                <div
                  ref={scrollContainerRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                >
                  <div className="mx-auto max-w-3xl space-y-7 px-4 pb-8 pt-7 sm:px-8">
                    <div className="flex items-center gap-3">
                      <span className="h-px flex-1 bg-[#c6a875]/20" />
                      <span className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground/60">
                        {conversationKey.startsWith("new") ? "New conversation" : "Conversation"}
                      </span>
                      <span className="h-px flex-1 bg-[#c6a875]/20" />
                    </div>

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
                      <StreamSkeleton />
                    )}

                    {error && (
                      <div className="flex justify-center">
                        <div className="max-w-md rounded-xl border border-destructive/25 bg-destructive/10 px-4 py-3 text-center backdrop-blur-xl">
                          <p className="mb-2 text-xs text-destructive">{error.message}</p>
                          <button
                            onClick={() => { clearError(); regenerate(); }}
                            className="inline-flex items-center gap-1 rounded-full bg-destructive px-3 py-1.5 text-[10px] font-medium text-destructive-foreground transition-colors hover:bg-destructive/90"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {showScrollBtn && (
                  <button
                    onClick={() => scrollToBottom(true)}
                    className="absolute bottom-24 right-5 z-20 grid size-8 place-items-center rounded-full border border-[#c6a875]/35 bg-card text-muted-foreground shadow-lg transition-colors hover:bg-accent hover:text-foreground"
                    title="Scroll to bottom"
                  >
                    <span className="text-base leading-none">↓</span>
                  </button>
                )}

                <ChatInput
                  ref={inputRef}
                  input={input}
                  onInputChange={setInput}
                  onSend={handleSend}
                  onStop={stop}
                  onRegenerate={regenerate}
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
