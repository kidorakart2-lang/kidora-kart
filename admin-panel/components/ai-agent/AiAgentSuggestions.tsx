"use client";

import { motion } from "motion/react";
import { Plus, Pencil, Globe } from "lucide-react";

interface SuggestionItem {
  label: string;
  prompt: string;
  icon: React.ComponentType<{ className?: string }>;
}

const SUGGESTIONS: SuggestionItem[] = [
  { icon: Plus, label: "Create a product", prompt: "Create a new product for my jewellery store" },
  { icon: Pencil, label: "Write a description", prompt: "Write a product description for a jewellery piece" },
  { icon: Globe, label: "Search my store", prompt: "Search for existing products in my store" },
];

interface AiAgentSuggestionsProps {
  onSuggestion: (prompt: string) => void;
}

export function AiAgentSuggestions({ onSuggestion }: AiAgentSuggestionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.35 }}
      className="flex flex-wrap justify-center gap-3 mt-6"
    >
      {SUGGESTIONS.map((s, i) => (
        <motion.button
          key={s.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
          onClick={() => onSuggestion(s.prompt)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full backdrop-blur-xl bg-card/50 border border-border text-sm text-foreground hover:bg-accent hover:border-border/80 transition-all shadow-lg hover:shadow-xl active:scale-95"
        >
          <s.icon className="h-4 w-4 text-muted-foreground" />
          {s.label}
        </motion.button>
      ))}
    </motion.div>
  );
}
