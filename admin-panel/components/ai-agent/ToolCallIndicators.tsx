import { Check, Bot } from "lucide-react";
import type { ToolCallData } from "@/hooks/use-ai-chat";

interface ToolCallIndicatorsProps {
  toolCalls: ToolCallData[];
}

function getToolCallDisplay(tc: ToolCallData) {
  const r = tc.result as
    | { created?: boolean; updated?: boolean; error?: string; name?: string; found?: boolean }
    | undefined;
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
    icon = <Check className="h-4 w-4 text-emerald-600 shrink-0" />;
    title = `✅ Created ${r?.name || toolLabel}`;
    subtitle = "(inactive — review in panel)";
  } else if (isUpdate && ok) {
    icon = <Check className="h-4 w-4 text-emerald-600 shrink-0" />;
    title = `✅ Updated ${r?.name || toolLabel}`;
    subtitle = "";
  } else if (r?.error) {
    icon = (
      <div className="h-4 w-4 rounded-full bg-red-500 flex items-center justify-center shrink-0">
        <span className="text-white text-[8px] font-bold">!</span>
      </div>
    );
    title = `⚠️ ${r.error.slice(0, 80)}`;
    subtitle = "";
  } else if (r?.found === false) {
    icon = (
      <div className="h-4 w-4 rounded-full bg-zinc-500 flex items-center justify-center shrink-0">
        <span className="text-white text-[8px]">?</span>
      </div>
    );
    title = `🔍 Searched ${toolLabel}`;
    subtitle = "(no results found)";
  } else {
    icon = (
      <div className="h-4 w-4 rounded-full bg-zinc-500 flex items-center justify-center shrink-0">
        <span className="text-white text-[8px]">?</span>
      </div>
    );
    title = `🔍 Searched ${toolLabel}`;
    subtitle = "";
  }

  return { icon, title, subtitle };
}

export function ToolCallIndicators({ toolCalls }: ToolCallIndicatorsProps) {
  if (toolCalls.length === 0) return null;

  return (
    <div className="flex justify-start gap-3">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-500/20">
        <Bot className="h-3.5 w-3.5 text-white" />
      </div>
      <div className="space-y-1.5 max-w-[85%]">
        {toolCalls.map((tc) => {
          const { icon, title, subtitle } = getToolCallDisplay(tc);
          return (
            <div
              key={tc.toolCallId}
              className="flex items-center gap-2 backdrop-blur-xl bg-zinc-900/50 border border-white/10 rounded-xl px-4 py-2.5 shadow-lg text-xs"
            >
              {icon}
              <div>
                <span className="font-medium text-zinc-300">{title}</span>
                {subtitle && <span className="text-zinc-400 ml-1.5">{subtitle}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
