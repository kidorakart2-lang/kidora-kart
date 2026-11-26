"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  MessageSquare,
  PanelLeftClose,
  Plus,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryItem {
  _id: string;
  prompt: string;
  response: string;
  messages?: unknown[];
  createdAt: string;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function messageText(m: unknown): string | undefined {
  const msg = m as Record<string, unknown>;
  if (msg.role === "user" && typeof msg.content === "string") return msg.content as string;
  if (msg.role === "user" && Array.isArray(msg.parts)) {
    const textPart = (msg.parts as Array<Record<string, unknown>>).find((p) => p.type === "text");
    if (textPart && typeof textPart.text === "string") return textPart.text as string;
  }
  return undefined;
}

function assistantMessageText(m: unknown): string | undefined {
  const msg = m as Record<string, unknown>;
  if (msg.role === "assistant" && typeof msg.content === "string") return msg.content as string;
  if (msg.role === "assistant" && Array.isArray(msg.parts)) {
    const textParts = (msg.parts as Array<Record<string, unknown>>).filter((p) => p.type === "text").map((p) => p.text as string).join("");
    if (textParts) return textParts;
  }
  return undefined;
}

function getTitle(item: HistoryItem): string {
  if (item.messages && item.messages.length > 0) {
    for (const m of item.messages) {
      const text = messageText(m);
      if (text) {
        return text.length > 60 ? text.slice(0, 60) + "..." : text;
      }
    }
  }
  return item.prompt.length > 60 ? item.prompt.slice(0, 60) + "..." : item.prompt;
}

function getSubtitle(item: HistoryItem): string {
  if (item.messages && item.messages.length > 0) {
    const reversed = [...item.messages].reverse();
    for (const m of reversed) {
      const text = assistantMessageText(m);
      if (text) {
        const cleaned = text.replace(/[*#`>\[\]]/g, "").slice(0, 50);
        return `${cleaned}...`;
      }
    }
    return `${item.messages.length} message(s)`;
  }
  return item.response.replace(/[*#`>\[\]]/g, "").slice(0, 50) + "...";
}

function HistorySkeleton() {
  return (
    <div className="space-y-1.5 p-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-xl p-3">
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sidebar-accent flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-sidebar-accent rounded w-3/4" />
              <div className="h-2.5 bg-sidebar-accent/50 rounded w-1/2" />
              <div className="h-2 bg-sidebar-accent/50 rounded w-1/4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface HistorySidebarProps {
  show: boolean;
  onClose: () => void;
  items: HistoryItem[];
  total?: number;
  isLoading: boolean;
  isEmpty: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  activeKey: string;
  deletingId: string | null;
  onLoadConversation: (item: HistoryItem) => void;
  onDeleteConversation: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}

export function HistorySidebar({
  show,
  onClose,
  items,
  total,
  isLoading,
  isEmpty,
  hasMore,
  isLoadingMore,
  onLoadMore,
  activeKey,
  deletingId,
  onLoadConversation,
  onDeleteConversation,
  onNewChat,
}: HistorySidebarProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.aside
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="flex-shrink-0 overflow-hidden max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50"
        >
          <div className="flex h-full w-[300px] flex-col border-r border-sidebar-border bg-sidebar shadow-2xl backdrop-blur-2xl">
            <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
              <div>
                <p className="admin-eyebrow text-[8px]">Workspace</p>
                <h2 className="admin-display mt-1 flex items-center gap-2 text-[17px] leading-none text-sidebar-foreground">
                  Conversations
                  {total !== undefined && (
                    <span className="rounded-full border border-[#c6a875]/25 bg-[#c6a875]/10 px-1.5 py-0.5 text-[9px] font-normal text-[#8a6428]">
                      {total}
                    </span>
                  )}
                </h2>
              </div>
              <button
                onClick={onClose}
                className="grid size-7 place-items-center rounded-lg text-sidebar-foreground/55 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>

            <div className="px-3 pb-3 pt-3">
              <Button
                size="sm"
                className="h-10 w-full gap-2 rounded-lg bg-[#1c141c] text-[10.5px] uppercase tracking-[0.12em] text-[#f7efe6] shadow-sm hover:bg-[#2e1b29]"
                onClick={onNewChat}
              >
                <Plus className="h-3.5 w-3.5" />
                New conversation
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {isLoading ? (
                <HistorySkeleton />
              ) : isEmpty ? (
                <div className="text-center py-16 px-6">
                  <div className="w-12 h-12 rounded-xl bg-sidebar-accent flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-sidebar-foreground/60" />
                  </div>
                  <p className="text-sm font-medium text-sidebar-foreground mb-1">No conversations yet</p>
                  <p className="text-xs text-sidebar-foreground/60">
                    Start chatting and your conversations will appear here.
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                  {items.map((item) => {
                    const isActive = activeKey === item._id;
                    const isDeleting = deletingId === item._id;
                    const title = getTitle(item);
                    const subtitle = getSubtitle(item);

                    return (
                      <div
                        key={item._id}
                        className={cn(
                          "group relative rounded-lg border-l-2 transition-all duration-150",
                          isActive
                            ? "border-[#c6a875] bg-[#c6a875]/10"
                            : "border-transparent hover:bg-sidebar-accent/60",
                        )}
                      >
                        <button
                          onClick={() => onLoadConversation(item)}
                          className="w-full text-left p-3"
                          disabled={isDeleting}
                        >
                          <div className="flex items-start gap-2.5">
                            <div
                              className={cn(
                                "mt-0.5 flex size-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors",
                                isActive
                                  ? "bg-[#1c141c] text-[#e6d0a2]"
                                  : "bg-sidebar-accent text-sidebar-foreground/60 group-hover:bg-sidebar-accent/80",
                              )}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  "truncate text-[12.5px] font-medium leading-snug",
                                  isActive
                                    ? "text-sidebar-foreground"
                                    : "text-sidebar-foreground/90",
                                )}
                              >
                                {title}
                              </p>
                              <p className="mt-1 truncate text-[10.5px] leading-relaxed text-sidebar-foreground/55">
                                {subtitle}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Clock className="h-3 w-3 text-sidebar-foreground/60" />
                                <span className="text-[10px] text-sidebar-foreground/60">
                                  {formatTime(item.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={(e) => onDeleteConversation(item._id, e)}
                          disabled={isDeleting}
                          className={cn(
                            "absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                            "opacity-0 group-hover:opacity-100 focus:opacity-100",
                            "hover:bg-destructive/20",
                            "text-sidebar-foreground/60 hover:text-destructive",
                            isDeleting && "opacity-100",
                          )}
                          title="Delete conversation"
                        >
                          {isDeleting ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                  </div>
                  {hasMore && (
                    <div className="pt-2 pb-1 px-1">
                      <button
                        onClick={onLoadMore}
                        disabled={isLoadingMore}
                        className="w-full flex items-center justify-center gap-1.5 text-xs text-sidebar-foreground/60 hover:text-sidebar-foreground bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-lg px-3 py-2 transition-colors"
                      >
                        {isLoadingMore ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {isLoadingMore ? "Loading..." : "Load more"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {total !== undefined && total > 0 && (
              <div className="px-4 py-2 border-t border-sidebar-border">
                <p className="text-[10px] text-center text-sidebar-foreground/60">
                  Showing {items.length} of {total} conversations
                </p>
              </div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
