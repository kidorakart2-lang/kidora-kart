"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  History,
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
  messages?: Array<{ role: string; content: string }>;
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

function getTitle(item: HistoryItem): string {
  // Try to get the first user message from messages array
  if (item.messages && item.messages.length > 0) {
    const firstUser = item.messages.find((m) => m.role === "user");
    if (firstUser) {
      return firstUser.content.length > 60
        ? firstUser.content.slice(0, 60) + "..."
        : firstUser.content;
    }
  }
  // Fallback to prompt field
  return item.prompt.length > 60 ? item.prompt.slice(0, 60) + "..." : item.prompt;
}

function getSubtitle(item: HistoryItem): string {
  if (item.messages && item.messages.length > 0) {
    // Find the last assistant message for a preview
    const lastAssistant = [...item.messages].reverse().find((m) => m.role === "assistant");
    const preview = lastAssistant
      ? lastAssistant.content.replace(/[*#`>\[\]]/g, "").slice(0, 50)
      : "";
    return preview ? `${preview}...` : `${item.messages.length} message(s)`;
  }
  return item.response.replace(/[*#`>\[\]]/g, "").slice(0, 50) + "...";
}

function HistorySkeleton() {
  return (
    <div className="space-y-1.5 p-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="animate-pulse rounded-xl p-3">
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-700 flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3.5 bg-zinc-200 dark:bg-zinc-700 rounded w-3/4" />
              <div className="h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded w-1/2" />
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded w-1/4" />
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
          className="flex-shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden"
        >
          <div className="w-[300px] h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <History className="h-4 w-4 text-zinc-500" />
                Chat History
                {total !== undefined && (
                  <span className="text-[10px] font-normal text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">
                    {total}
                  </span>
                )}
              </h2>
              <button
                onClick={onClose}
                className="h-7 w-7 flex items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose className="h-4 w-4 text-zinc-500" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-2">
                {isLoading ? (
                  <HistorySkeleton />
                ) : isEmpty ? (
                  <div className="text-center py-16 px-6">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-6 w-6 text-zinc-400" />
                    </div>
                    <p className="text-sm font-medium text-zinc-500 mb-1">No conversations yet</p>
                    <p className="text-xs text-zinc-400">
                      Start chatting and your conversations will appear here.
                    </p>
                  </div>
                ) : (
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
                            "group relative rounded-xl transition-all duration-150",
                            isActive
                              ? "bg-blue-50 dark:bg-blue-950/20 ring-1 ring-blue-200 dark:ring-blue-800"
                              : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                          )}
                        >
                          <button
                            onClick={() => onLoadConversation(item)}
                            className="w-full text-left p-3"
                            disabled={isDeleting}
                          >
                            <div className="flex items-start gap-2.5">
                              {/* Icon */}
                              <div
                                className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors",
                                  isActive
                                    ? "bg-blue-100 dark:bg-blue-900/50"
                                    : "bg-zinc-100 dark:bg-zinc-800 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-700",
                                )}
                              >
                                <MessageSquare
                                  className={cn(
                                    "h-4 w-4",
                                    isActive
                                      ? "text-blue-600 dark:text-blue-400"
                                      : "text-zinc-400",
                                  )}
                                />
                              </div>

                              {/* Content */}
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "text-sm font-medium leading-snug truncate",
                                    isActive
                                      ? "text-blue-700 dark:text-blue-300"
                                      : "text-zinc-800 dark:text-zinc-200",
                                  )}
                                >
                                  {title}
                                </p>
                                <p className="text-xs text-zinc-500 truncate mt-1 leading-relaxed">
                                  {subtitle}
                                </p>
                                <div className="flex items-center gap-1.5 mt-1.5">
                                  <Clock className="h-3 w-3 text-zinc-400" />
                                  <span className="text-[10px] text-zinc-400">
                                    {formatTime(item.createdAt)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>

                          {/* Delete button - always visible on card hover, positioned top-right */}
                          <button
                            onClick={(e) => onDeleteConversation(item._id, e)}
                            disabled={isDeleting}
                            className={cn(
                              "absolute top-2 right-2 h-7 w-7 flex items-center justify-center rounded-lg transition-all",
                              "opacity-0 group-hover:opacity-100 focus:opacity-100",
                              "hover:bg-red-50 dark:hover:bg-red-900/30",
                              "text-zinc-400 hover:text-red-500 dark:hover:text-red-400",
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
                )}
              </div>
            </div>

            {/* Bottom section */}
            <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-9 gap-1.5"
                onClick={onNewChat}
              >
                <Plus className="h-3.5 w-3.5" />
                New Chat
              </Button>
              {total !== undefined && total > 0 && (
                <p className="text-[10px] text-center text-zinc-400">
                  Showing {items.length} of {total} conversations
                </p>
              )}
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
