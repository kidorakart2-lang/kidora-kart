"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2 } from "lucide-react";
import { api, ApiClientError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface AiAssistButtonProps {
  /** Context object sent to the AI endpoint */
  context: Record<string, string>;
  /** Called when AI returns valid text */
  onResult: (text: string) => void;
  /** Label for the button */
  label?: string;
  /** API endpoint to call */
  endpoint?: string;
  /** Page identifier for history tracking */
  page?: string;
}

export default function AiAssistButton({
  context,
  onResult,
  label = "Write with AI",
  endpoint = "/api/admin/ai/generate-description",
  page = "product-description",
}: AiAssistButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await api.post<{ text: string }>(endpoint, { ...context, page });
      if (data?.text) {
        try {
          onResult(data.text);
          toast({ title: "AI: Description generated" });
        } catch {
          // onResult failed — put generated text to clipboard as fallback
          await navigator.clipboard.writeText(data.text);
          toast({ title: "AI: Description copied to clipboard" });
        }
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Failed to generate description. Please try again.";
      toast({ title: `AI: ${message}`, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleGenerate}
      disabled={loading}
      className="gap-2 transition-all duration-200 hover:scale-105"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Sparkles className="h-4 w-4" />
      )}
      {loading ? "Generating..." : label}
    </Button>
  );
}
