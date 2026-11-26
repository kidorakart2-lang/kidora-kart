"use client";

import { motion } from "motion/react";
import { Plus, Pencil, Globe, ArrowUpRight } from "lucide-react";

interface SuggestionItem {
  label: string;
  description: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SUGGESTIONS: SuggestionItem[] = [
  {
    icon: Plus,
    label: "Create a product",
    description: "Add a new piece to your catalogue",
    prompt: "Create a new product for my jewellery store",
  },
  {
    icon: Pencil,
    label: "Write a description",
    description: "Craft considered copy for a piece",
    prompt: "Write a product description for a piece of jewellery",
  },
  {
    icon: Globe,
    label: "Search my store",
    description: "Find products, orders or settings",
    prompt: "Search for existing products in my store",
  },
];

interface AiAgentSuggestionsProps {
  onSuggestion: (prompt: string) => void;
}

export function AiAgentSuggestions({ onSuggestion }: AiAgentSuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.26 }}
      className="mt-9"
    >
      <div className="mb-4 flex items-end justify-between gap-4 border-b border-[#c6a875]/20 pb-3">
        <div>
          <p className="admin-eyebrow">Quick start</p>
          <h3 className="admin-display mt-1.5 text-xl text-foreground">
            Start with a task
          </h3>
        </div>
        <span className="pb-0.5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/70">
          3 curated prompts
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.32 + i * 0.07 }}
            onClick={() => onSuggestion(s.prompt)}
            className="group relative flex flex-col items-start rounded-xl border border-[#c6a875]/20 bg-card/75 p-4 text-left shadow-[0_18px_40px_-34px_rgba(28,20,28,0.5)] transition-all hover:-translate-y-0.5 hover:border-[#c6a875]/55 hover:bg-card hover:shadow-[0_22px_45px_-30px_rgba(28,20,28,0.45)] active:scale-[0.99]"
          >
            <span className="mb-3 grid size-8 place-items-center rounded-lg border border-[#c6a875]/25 bg-[#c6a875]/10 text-[#8a6428] transition-colors group-hover:bg-[#1c141c] group-hover:text-[#e6d0a2]">
              <s.icon className="h-3.5 w-3.5" />
            </span>
            <span className="text-[12.5px] font-medium leading-tight text-foreground">
              {s.label}
            </span>
            <span className="mt-1 text-[10.5px] leading-snug text-muted-foreground">
              {s.description}
            </span>
            <ArrowUpRight className="absolute right-3.5 top-3.5 h-3.5 w-3.5 text-muted-foreground/50 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#8a6428]" />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
