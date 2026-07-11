"use client";

import { useEffect, useState } from "react";

const THEMES = ["brown", "minimal", "monochrome"] as const;

const THEME_LABELS: Record<(typeof THEMES)[number], string> = {
  brown: "Brown",
  minimal: "Minimal",
  monochrome: "Mono",
};

const THEME_COLORS: Record<(typeof THEMES)[number], string> = {
  brown: "#b08968",
  minimal: "#22c55e",
  monochrome: "#0a0a0a",
};

const STORAGE_KEY = "dev-theme";

export default function DevThemeToggle() {
  const [current, setCurrent] = useState<(typeof THEMES)[number]>("brown");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Only in dev
    if (process.env.NODE_ENV !== "development") return;

    const saved = localStorage.getItem(STORAGE_KEY) as (typeof THEMES)[number] | null;
    if (saved && THEMES.includes(saved)) {
      setCurrent(saved);
      applyTheme(saved);
    }
  }, []);

  function applyTheme(theme: (typeof THEMES)[number]) {
    const body = document.body;
    THEMES.forEach((t) => body.classList.remove(t));
    body.classList.add(theme);
  }

  function handleSelect(theme: (typeof THEMES)[number]) {
    setCurrent(theme);
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
    setOpen(false);
  }

  if (process.env.NODE_ENV !== "development") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-xs">
      {/* Collapsed trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground text-background shadow-lg border border-border hover:opacity-90 transition-opacity"
        title="Dev Theme Toggle"
      >
        <span
          className="w-3 h-3 rounded-full border border-background/30"
          style={{ backgroundColor: THEME_COLORS[current] }}
        />
        <span className="hidden sm:inline">{THEME_LABELS[current]}</span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div className="absolute bottom-full right-0 mb-2 p-2 rounded-lg bg-foreground text-background shadow-lg border border-border min-w-[120px]">
          <div className="text-[10px] uppercase tracking-wider opacity-50 mb-1.5 px-1">
            Theme
          </div>
          {THEMES.map((t) => (
            <button
              key={t}
              onClick={() => handleSelect(t)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors ${
                current === t
                  ? "bg-background/20 text-background"
                  : "text-background/70 hover:bg-background/10 hover:text-background"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full border border-background/30 shrink-0"
                style={{ backgroundColor: THEME_COLORS[t] }}
              />
              {THEME_LABELS[t]}
              {current === t && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
