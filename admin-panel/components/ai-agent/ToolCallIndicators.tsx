import { Loader2, CheckCircle2, XCircle, Search, Plus, RefreshCw } from "lucide-react";
import type { ToolInvocationDisplay } from "@/hooks/use-ai-chat";

interface ToolCallIndicatorsProps {
  toolInvocations: ToolInvocationDisplay[];
}

function getDisplayInfo(tc: ToolInvocationDisplay) {
  const isCreate = tc.toolName.startsWith("create");
  const isUpdate = tc.toolName.startsWith("update");
  const isSearch = tc.toolName.startsWith("search") || tc.toolName.startsWith("lookup");
  const label = tc.toolName
    .replace(/^(create|update|search|lookup)/, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .trim() || tc.toolName;

  if (tc.state === "call") {
    return {
      icon: <Loader2 className="h-3.5 w-3.5 text-amber-400 animate-spin" />,
      text: `Calling ${label}...`,
      className: "bg-amber-500/10 border-amber-500/30",
    };
  }

  if (tc.state === "result") {
    const r = tc.result as { reused?: boolean; error?: string; found?: boolean } | undefined;
    if (r?.error) {
      return {
        icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
        text: r.error.slice(0, 100),
        className: "bg-red-500/10 border-red-500/30",
      };
    }
    if (isCreate || isUpdate) {
      const verb = r?.reused ? "Reusing" : isCreate ? "Created" : "Updated";
      return {
        icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />,
        text: r?.reused ? `${verb} existing ${label}` : `${verb} ${label}`,
        className: "bg-emerald-500/10 border-emerald-500/30",
      };
    }
    return {
      icon: <Search className="h-3.5 w-3.5 text-blue-400" />,
      text: r?.found !== false ? `Found ${label}` : `No ${label} found`,
      className: "bg-blue-500/10 border-blue-500/30",
    };
  }

  if (tc.state === "error") {
    return {
      icon: <XCircle className="h-3.5 w-3.5 text-red-400" />,
      text: tc.error || `${label} failed`,
      className: "bg-red-500/10 border-red-500/30",
    };
  }

  return {
    icon: <Loader2 className="h-3.5 w-3.5 text-zinc-400 animate-spin" />,
    text: `Waiting for ${label}...`,
    className: "bg-zinc-500/10 border-zinc-500/30",
  };
}

export function ToolCallIndicators({ toolInvocations }: ToolCallIndicatorsProps) {
  if (toolInvocations.length === 0) return null;

  return (
    <div className="space-y-1.5 max-w-lg mx-auto w-full">
      {toolInvocations.map((tc) => {
        const { icon, text, className } = getDisplayInfo(tc);
        return (
          <div
            key={tc.toolCallId}
            className={`flex items-center gap-2 backdrop-blur-xl border rounded-xl px-3 py-1.5 shadow-lg text-xs ${className}`}
          >
            {icon}
            <span className="text-zinc-300">{text}</span>
          </div>
        );
      })}
    </div>
  );
}
