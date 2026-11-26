"use client";

import { motion } from "motion/react";
import { Check } from "lucide-react";

export default function FallbackCheckmark() {
  return (
    <div className="relative w-48 h-48 md:w-56 md:h-56 flex items-center justify-center">
      <div className="absolute inset-0 rounded-full border-4 border-white/30 animate-ping" />
      <div className="absolute inset-2 rounded-full border-4 border-white/20" />
      <div className="absolute inset-4 flex items-center justify-center rounded-full bg-[var(--brand-gold)]/10">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
        >
          <Check className="h-20 w-20 text-[var(--brand-gold)]" strokeWidth={1.8} />
        </motion.div>
      </div>
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute size-2 rounded-full bg-[var(--brand-gold)]/70"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0.5],
            x: [0, Math.cos((i * Math.PI * 2) / 8) * 120],
            y: [0, Math.sin((i * Math.PI * 2) / 8) * 120],
          }}
          transition={{ delay: 0.3 + i * 0.06, duration: 0.8, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
