"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { ColorItem } from "@/types";

interface ColorPickerProps {
  colors: ColorItem[];
  selectedColor: string | null;
  onSelect: (id: string) => void;
}

export default function ColorPicker({
  colors,
  selectedColor,
  onSelect,
}: ColorPickerProps) {
  if (!colors.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.65, duration: 0.4 }}
      className="mb-8"
    >
      <div className="flex items-center gap-2 mb-3.5">
        <div className="w-1 h-4 rounded-full bg-brand-500" />
        <h3 className="text-sm uppercase tracking-[0.2em] text-muted-foreground fw-heading">
          Color
        </h3>
      </div>

      <div className="flex flex-wrap gap-3">
        {colors.map((color, i) => {
          const isSelected = selectedColor === color._id;
          return (
            <motion.button
              key={color._id}
              type="button"
              onClick={() => onSelect(color._id)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + i * 0.04, duration: 0.3 }}
              whileHover={{ scale: 1.12, y: -2 }}
              whileTap={{ scale: 0.92 }}
              className={`relative w-11 h-11 rounded-full transition-all duration-300 group ${
                isSelected
                  ? "ring-2 ring-offset-2 shadow-lg"
                  : "ring-1 ring-border hover:ring-muted-foreground/40 hover:shadow-md"
              }`}
              style={{
                boxShadow: isSelected ? `0 0 0 2px var(--brand-primary), 0 0 0 4px var(--background)` : undefined,
              }}
              aria-label={`Select color ${color.name || color.code}`}
            >
              <div
                className="w-full h-full rounded-full"
                style={{ backgroundColor: color.code || "#ccc" }}
              />
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className="w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: `color-mix(in srgb, ${color.code} 40%, black)`,
                    }}
                  >
                    <Check size={10} className="text-white" strokeWidth={3} />
                  </div>
                </motion.div>
              )}

              {/* Tooltip on hover */}
              {color.name && (
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  {color.name}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
