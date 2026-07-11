"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Check, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const themes = [
  {
    name: "dark",
    label: "Dark",
    description: "Blue accents on dark backgrounds",
    color: "bg-[oklch(0.15_0_0)]",
    accent: "bg-[oklch(0.55_0.18_250)]",
  },
  {
    name: "minimal",
    label: "Minimal",
    description: "Clean white + green accents",
    color: "bg-[oklch(0.99_0_0)]",
    accent: "bg-[oklch(0.72_0.19_142)]",
  },
  {
    name: "brown",
    label: "Brown",
    description: "Warm caramel tones",
    color: "bg-[oklch(0.98_0.005_70)]",
    accent: "bg-[oklch(0.62_0.08_60)]",
  },
  {
    name: "monochrome",
    label: "Monochrome",
    description: "Pure black & white",
    color: "bg-[oklch(1_0_0)]",
    accent: "bg-[oklch(0.10_0_0)]",
  },
] as const;

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon">
        <Palette className="h-5 w-5" />
      </Button>
    );
  }

  const current = themes.find((t) => t.name === theme) ?? themes[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Switch theme"
        >
          <Palette className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((t) => (
          <DropdownMenuItem
            key={t.name}
            onClick={() => setTheme(t.name)}
            className="flex items-center gap-3 cursor-pointer"
          >
            <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
              <span className={`absolute inset-0 rounded-full ${t.color} ring-1 ring-border`} />
              <span className={`absolute inset-1 rounded-full ${t.accent}`} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{t.label}</div>
              <div className="text-xs text-muted-foreground truncate">{t.description}</div>
            </div>
            {theme === t.name && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
