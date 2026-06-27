"use client";

import type { Variants } from "framer-motion";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, RefreshCw } from "lucide-react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 10,
      },
    },
  };

  const iconVariants: Variants = {
    hidden: { scale: 0, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 10,
      },
    },
    hover: {
      rotate: 360,
      transition: { duration: 1 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-2xl w-full text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div variants={itemVariants} className="mb-8">
          <motion.div
            className="mx-auto flex items-center justify-center h-24 w-24 text-red-500 mb-6"
            variants={iconVariants}
            whileHover="hover"
          >
            <AlertCircle className="h-24 w-24" />
          </motion.div>

          <motion.h1
            className="text-4xl font-bold text-gray-900 mb-4"
            variants={itemVariants}
          >
            Something went wrong!
          </motion.h1>

          <motion.p
            className="text-gray-600 mb-6 text-lg"
            variants={itemVariants}
          >
            {"We're sorry, but an unexpected problem appeared please wait."}
          </motion.p>

          <motion.p
            className="text-gray-500 text-sm mb-8"
            variants={itemVariants}
          >
            Error code: {error?.digest || "UNKNOWN_ERROR"}
          </motion.p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={itemVariants}
        >
          <Link href="/" passHref>
            <Button className="gap-2" size="lg">
              <Home className="h-4 w-4" />
              Go to Homepage
            </Button>
          </Link>

          <Button
            variant="outline"
            className="gap-2"
            size="lg"
            onClick={() => reset()}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </motion.div>

        <motion.div
          className="mt-16 text-gray-400 text-sm"
          variants={itemVariants}
        >
          <p>If the problem persists, please contact support.</p>
        </motion.div>
      </motion.div>
    </div>
  );
}
