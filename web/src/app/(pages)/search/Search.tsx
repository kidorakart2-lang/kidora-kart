"use client";

import ProductCard from "@/components/comman/ProductCard";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search as SearchIcon, Sparkles, Package } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProductData } from "@/types";

interface SearchProps {
  products: ProductData[] | null;
  q: string | undefined;
}

export default function Search({ products, q }: SearchProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
      }
    },
  };

  if (!products || products.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6 px-4"
        >
          <div className="relative inline-block">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-yellow-600 blur-3xl opacity-20 animate-pulse" />
            <Card className="relative p-12 border-2 border-brand-200/50 bg-gradient-to-br from-white to-brand-50/30">
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              >
                <SearchIcon
                  className="w-20 h-20 mx-auto text-brand-600/40 mb-6"
                  strokeWidth={1.5}
                />
              </motion.div>

              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-brand-700 via-yellow-600 to-brand-700 bg-clip-text text-transparent mb-3">
                No Products Found
              </h1>

              <p className="text-muted-foreground text-lg mb-6">
                We couldn't find any matches for{" "}
                <span className="font-semibold text-brand-700">"{q}"</span>
              </p>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">
                  Try searching for:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {["Watches", "Jewelry", "Accessories"].map((suggestion) => (
                    <Badge
                      key={suggestion}
                      variant="outline"
                      className="border-brand-300 text-brand-700 hover:bg-brand-50 cursor-pointer transition-colors"
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-3 space-y-8 py-8">
      {/* Header Section */}
      <motion.div
        key={`header-${q}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-yellow-600 blur-xl opacity-30" />
            <div className="relative bg-gradient-to-br from-brand-500 to-yellow-600 p-3 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-800 via-yellow-700 to-brand-800 bg-clip-text text-transparent">
              Search Results for{" "}
              <span className="font-semibold text-brand-700">"{q}"</span>
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              Found{" "}
              <span className="font-semibold text-brand-700">
                {products.length}
              </span>{" "}
              product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="relative h-px bg-gradient-to-r from-transparent via-brand-300 to-transparent">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-brand-400 to-yellow-600"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          />
        </div>

        {/* Results count badge */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Badge
            variant="outline"
            className="border-brand-300 bg-brand-50/50 text-brand-800 px-4 py-1.5 text-sm font-medium"
          >
            <Package className="w-4 h-4 mr-2" />
            {products.length} Result{products.length !== 1 ? "s" : ""}
          </Badge>
        </motion.div>
      </motion.div>

      {/* Products Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`grid-${q}`}
          variants={container}
          initial="hidden"
          animate="show"
          exit="hidden"
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
        >
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              variants={item}
              whileHover={{ y: -8 }}
              className="relative group"
            >
              {/* Golden shimmer effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-400 via-yellow-500 to-brand-400 rounded-xl opacity-0 group-hover:opacity-20 blur transition-opacity duration-500" />
              <div className="relative">
                <ProductCard data={product} />
              </div>

              {/* Index badge for first 3 items */}
              {index < 3 && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3 + index * 0.1, type: "spring" }}
                  className="absolute -top-2 -right-2 z-10"
                >
                  <div className="bg-gradient-to-br from-brand-500 to-yellow-600 text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white">
                    {index + 1}
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
