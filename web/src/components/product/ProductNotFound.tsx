"use client";

import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProductNotFound() {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center py-12 px-4 gradient-golden"
    >
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-100 to-brand-200 rounded-full mb-6 shadow-lg"
        >
          <AlertCircle className="w-10 h-10 text-brand-600" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-foreground mb-3"
        >
          Product Not Found
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-muted-foreground mb-8"
        >
          We couldn&apos;t find the product you&apos;re looking for. It might
          have been removed or is temporarily unavailable.
        </motion.p>
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => router.push("/")}
          className="btn-gradient px-8 py-3 rounded-xl fw-cta shadow-sm transition-shadow"
        >
          Back to Home
        </motion.button>
      </div>
    </motion.div>
  );
}
