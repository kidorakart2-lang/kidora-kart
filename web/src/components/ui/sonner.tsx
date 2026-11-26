"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner";

const Toaster = ({
  ...props
}: React.ComponentProps<typeof Sonner>) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as "dark" | "light" | "system"}
      className="toaster group"
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "var(--brand-heading)",
          "--normal-border":
            "color-mix(in srgb, var(--brand-gold) 38%, transparent)",
        } as React.CSSProperties
      }
      {...props} />
  );
}

export { Toaster }
