"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";
import type { ColorItem } from "@/types";

interface ColorPickerProps {
  colors: ColorItem[];
  selectedColor: string;
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
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="mb-10"
    >
      <h3 className="text-base uppercase tracking-widest text-foreground mb-3 font-[450]">
        Color
      </h3>
      <div className="flex gap-3">
        {colors.map((color) => (
          <motion.button
            key={color._id}
            type="button"
            onClick={() => onSelect(color._id)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-12 h-12 rounded-full transition-all ${
              selectedColor === color._id
                ? "ring-2 ring-brand-600 ring-offset-2"
                : "ring-1 ring-gray-200"
            }`}
            aria-label={`Select color ${color.code}`}
          >
            <div
              className="w-full h-full rounded-full"
              style={{ backgroundColor: color.code }}
            />
            {selectedColor === color._id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="w-4 h-4 bg-background rounded-full flex items-center justify-center">
                  <Check size={12} className="text-brand-600" />
                </div>
              </motion.div>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
