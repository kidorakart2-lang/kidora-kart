"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";
import { useAiChat, type ChatMessage, type ToolCallData } from "@/hooks/use-ai-chat";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { ChatInput } from "@/components/chat/ChatInput";
import { HistorySidebar } from "@/components/chat/HistorySidebar";
import { Check, Bot, RefreshCw, PanelLeftOpen, Sparkles } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────

interface HistoryItem {
  _id: string;
  prompt: string;
  response: string;
  messages?: Array<{ role: string; content: string }>;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────

function getAdminToken(): string | null {
  if (typeof document === "undefined") return null;
  return document.cookie.match(/(?:^|;\s*)adminToken=([^;]*)/)?.[1] ?? null;
}

function getCsrfToken(): string {
  if (typeof document === "undefined") return "";
  return document.cookie.match(/(?:^|;\s*)csrfToken=([^;]*)/)?.[1] ?? "";
}

// ── Welcome message ────────────────────────────────────────────────

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "👋 Hi! I can help you manage your store. Try:\n\n- **Creating** a product draft, category, FAQ, color, size, material, banner, testimonial, or coupon\n- **Searching** existing products or FAQs\n\n> All items I create will be **inactive** by default so you can review them in the admin panel first.\n\nWhat would you like to do?",
};

// ── Page Component ─────────────────────────────────────────────────

export default function AiAgentPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // UI state
  const [selectedProvider, setSelectedProvider] = useState<string>(
    () => typeof window !== "undefined" ? localStorage.getItem("ai-agent-provider") || "" : ""
  );
  const [showHistory, setShowHistory] = useState(true);
  const [input, setInput] = useState("");
  const [conversationKey, setConversationKey] = useState<string>("new");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pastToolCalls, setPastToolCalls] = useState<ToolCallData[]>([]);

  // Refs
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);
  const inputRef = useRef<{ focus: () => void }>(null);

  // Auth headers
  const authHeaders: Record<string, string> = {};
  const adminToken = getAdminToken();
  const csrfToken = getCsrfToken();
  if (csrfToken) authHeaders["x-csrf-token"] = csrfToken;
  if (adminToken) authHeaders["Authorization"] = `Bearer ${adminToken}`;

  // ── AI Chat Hook ─────────────────────────────────────────────────
  const {
    messages,
    setMessages,
    status,
    error,
    toolCalls,
    continuing,
    conversationId,
    setConversationId,
    sendMessage: sendChatMessage,
    stop,
    regenerate,
    clearError,
    clearToolCalls,
  } = useAiChat({
    api: "/api/admin/ai-agent/chat",
    headers: authHeaders,
    body: { provider: selectedProvider || undefined },
    credentials: "include",
    initialMessages: [WELCOME_MESSAGE],
    onError: (err) => {
      toast({ title: "AI Agent Error", description: err.message, variant: "destructive" });
    },
    onFinish: () => {
      queryClient.invalidateQueries({ queryKey: ["ai-agent-history"] });
    },
    onContinuation: () => {
      toast({
        title: "🔄 Still working...",
        description: "The AI needs an extra moment to complete the task.",
      });
    },
  });

  const isStreaming = status === "submitted" || status === "streaming";

  // ── Scroll Management ────────────────────────────────────────────
  const scrollToBottom = useCallback((smooth = true) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    });
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
    };
    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (isAtBottomRef.current) {
      const timer = setTimeout(() => scrollToBottom(!isStreaming), 50);
      return () => clearTimeout(timer);
    }
  }, [messages, status, scrollToBottom, isStreaming]);

  useEffect(() => {
    requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (container) container.scrollTo({ top: container.scrollHeight, behavior: "instant" });
    });
  }, [conversationKey]);

  useEffect(() => { isAtBottomRef.current = true; }, [conversationKey]);

  // ── Data Fetching ────────────────────────────────────────────────
  const { data: providers = [] } = useQuery<string[]>({
    queryKey: ["ai-agent-providers"],
    queryFn: () => api.get("/api/admin/ai-agent/providers"),
    staleTime: 60_000,
  });

  const {
    data: historyData,
    isLoading: historyLoading,
  } = useQuery<{
    items: HistoryItem[];
    pagination: { total: number; page: number; totalPages: number };
  }>({
    queryKey: ["ai-agent-history"],
    queryFn: () => api.get("/api/admin/ai-agent/history"),
    staleTime: 30_000,
  });

  // Persist provider selection to localStorage
  useEffect(() => {
    if (selectedProvider) {
      localStorage.setItem("ai-agent-provider", selectedProvider);
    }
  }, [selectedProvider]);

  // Auto-set provider from localStorage → openrouter → first available
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

  // Accumulate completed tool calls across messages so they don't disappear
  useEffect(() => {
    if (!isStreaming && toolCalls.length > 0) {
      setPastToolCalls((prev) => {
        const existing = new Set(prev.map((tc) => tc.toolCallId));
        const newCalls = toolCalls.filter((tc) => !existing.has(tc.toolCallId));
        return newCalls.length > 0 ? [...prev, ...newCalls] : prev;
      });
    }
  }, [isStreaming, toolCalls]);

  // ── Handlers ─────────────────────────────────────────────────────
  const handleSend = () => {
    if (!input.trim() || isStreaming) return;
    isAtBottomRef.current = true;
    sendChatMessage(input.trim());
    setInput("");
  };

  const loadHistoryConversation = (item: HistoryItem) => {
    setConversationKey(item._id);
    setConversationId(item._id);

    // Restore tool call indicators from enriched response text
    const restoredTools: ToolCallData[] = [];
    const toolLines = item.response.match(/✅\s+(Created|Updated)\s+.+/g);
    if (toolLines) {
      toolLines.forEach((line, i) => {
        const isCreate = line.includes("Created");
        const isUpdate = line.includes("Updated");
        const name = line.replace(/✅\s+(Created|Updated)\s+/, "").trim();
        restoredTools.push({
          toolCallId: `hist-tc-${item._id}-${i}`,
          toolName: isCreate ? "createTool" : isUpdate ? "updateTool" : "tool",
          args: {},
          result: isCreate ? { created: true, name } : { updated: true, name },
          status: "done",
        });
      });
    }
    setPastToolCalls(restoredTools);

    if (item.messages && item.messages.length > 0) {
      setMessages(item.messages.map((m, i) => ({
        id: `hist-${item._id}-${i}`,
        role: m.role as "user" | "assistant",
        content: m.content,
      })));
    } else {
      setMessages([{
        id: `hist-summary-${item._id}`,
        role: "assistant",
        content: `📝 **Past conversation**\n\n---\n**You asked:** ${item.prompt.slice(0, 200)}\n\n**I replied:** ${item.response.slice(0, 500)}\n\n---\n*This is a summary. Start a new message to continue.*`,
      }]);
    }
    toast({ title: "Conversation loaded from history" });
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Delete this conversation permanently? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await api.del(`/api/admin/ai-agent/history/${id}`);
      queryClient.invalidateQueries({ queryKey: ["ai-agent-history"] });
      if (conversationId === id) startNewChat();
      toast({ title: "Conversation deleted" });
    } catch (err) {
      toast({ title: "Delete failed", description: err instanceof Error ? err.message : "Failed to delete", variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const startNewChat = () => {
    setConversationKey(`new-${Date.now()}`);
    setMessages([WELCOME_MESSAGE]);
    clearToolCalls();
    setPastToolCalls([]);
    clearError();
    setConversationId(null);
    isAtBottomRef.current = true;
    inputRef.current?.focus();
  };

  // ── Derived ──────────────────────────────────────────────────────
  const historyItems = historyData?.items ?? [];
  const isHistoryEmpty = historyItems.length === 0;
  const allCompletedTools = [...pastToolCalls, ...toolCalls.filter((tc) => tc.status === "done")]
    .filter((tc, i, arr) => arr.findIndex((t) => t.toolCallId === tc.toolCallId) === i);
  const showLoadingDots = isStreaming && (messages.length === 0 || messages[messages.length - 1]?.role !== "assistant" || !messages[messages.length - 1]?.content);

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex">
      {/* History Sidebar */}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm z-10 flex-shrink-0">
          <div className="flex items-center gap-3">
            {!showHistory && (
              <button
                onClick={() => setShowHistory(true)}
                className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <PanelLeftOpen className="h-4 w-4 text-zinc-500" />
              </button>
            )}
            <h1 className="text-base font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              AI Agent
              {/* Status indicator */}
              {isStreaming && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {status === "submitted" ? "Connecting..." : "Streaming"}
                </span>
              )}
              {status === "error" && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  Error
                </span>
              )}
              {status === "ready" && messages.length > 1 && (
                <span className="ml-2 inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Ready
                </span>
              )}
            </h1>
          </div>
        </header>

        {/* Messages Area */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto overscroll-contain">
          <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
            {/* Conversation indicator */}
            {conversationId && messages.length > 2 && (
              <div className="flex justify-center">
                <span className="text-[10px] text-zinc-400 bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded-full">
                  Continuing conversation
                </span>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg, i) => (
              <ChatMessageComponent
                key={msg.id || i}
                message={msg}
                isLastAssistant={!msg.role.includes("user") && i === messages.length - 1}
                streaming={isStreaming}
              />
            ))}

            {/* Tool created indicators — persists across messages */}
            {allCompletedTools.length > 0 && (
              <div className="flex justify-start gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="space-y-1.5 max-w-[85%]">
                  {allCompletedTools.map((tc) => {
                    const r = tc.result as { created?: boolean; updated?: boolean; error?: string; name?: string; found?: boolean } | undefined;
                    const isCreate = tc.toolName.startsWith("create");
                    const isUpdate = tc.toolName.startsWith("update");
                    const ok = r?.created || r?.updated;
                    const toolLabel = tc.toolName
                      .replace(/^(create|update|search|lookup|fetch)/, "")
                      .replace(/([a-z])([A-Z])/g, "$1 $2")
                      .toLowerCase()
                      .trim() || tc.toolName;

                    let icon: React.ReactNode;
                    let title: string;
                    let subtitle: string;

                    if (isCreate && ok) {
                      icon = <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />;
                      title = `✅ Created ${r?.name || toolLabel}`;
                      subtitle = "(inactive — review in panel)";
                    } else if (isUpdate && ok) {
                      icon = <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />;
                      title = `✅ Updated ${r?.name || toolLabel}`;
                      subtitle = "";
                    } else if (r?.error) {
                      icon = (
                        <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[8px] font-bold">!</span>
                        </div>
                      );
                      title = `⚠️ ${r.error.slice(0, 80)}`;
                      subtitle = "";
                    } else if (r?.found === false) {
                      // Search/lookup with no results
                      icon = (
                        <div className="h-4 w-4 rounded-full bg-zinc-400 dark:bg-zinc-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[8px]">?</span>
                        </div>
                      );
                      title = `🔍 Searched ${toolLabel}`;
                      subtitle = "(no results found)";
                    } else {
                      // Everything else: lookups, utility tools, non-creation results
                      icon = (
                        <div className="h-4 w-4 rounded-full bg-zinc-400 dark:bg-zinc-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[8px]">?</span>
                        </div>
                      );
                      title = `🔍 Searched ${toolLabel}`;
                      subtitle = "";
                    }

                    return (
                      <div key={tc.toolCallId} className="flex items-center gap-2 bg-white/80 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2.5 shadow-sm text-xs">
                        {icon}
                        <div>
                          <span className="font-medium text-zinc-700 dark:text-zinc-300">
                            {title}
                          </span>
                          {subtitle && (
                            <span className="text-zinc-400 dark:text-zinc-500 ml-1.5">{subtitle}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Auto-continuing indicator */}
            {continuing && (
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-full px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">
                    Continuing to complete the task…
                  </span>
                </div>
              </div>
            )}

            {/* Loading dots */}
            {showLoadingDots && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-zinc-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="flex justify-center">
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 text-center max-w-md">
                  <p className="text-xs text-red-600 dark:text-red-400 mb-2">{error.message}</p>
                  <button onClick={() => { clearError(); regenerate(); }} className="inline-flex items-center gap-1 text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded transition-colors">
                    <RefreshCw className="h-3 w-3" />
                    Retry
                  </button>
                </div>
              </div>
            )}

            {/* Scroll anchor */}
            <div className="h-2" />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput
          ref={inputRef}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
          onStop={stop}
          onRegenerate={() => regenerate()}
          isStreaming={isStreaming}
          providers={providers}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          messagesLength={messages.length}
          hasError={!!error}
        />
      </div>
    </div>
  );
}
