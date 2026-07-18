"use client";

import { motion } from "motion/react";

interface SpecProduct {
  material?: { name: string }[];
  weight?: string;
  sku?: string;
  type?: string;
  length?: number;
  height?: number;
  breadth?: number;
  minimumAge?: number;
  maximumAge?: number;
  idealAge?: number;
}

interface ProductSpecificationsProps {
  product: SpecProduct;
}

export default function ProductSpecifications({
  product,
}: ProductSpecificationsProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.6 }}
      className="mb-7"
    >
      <h3 className="text-base uppercase tracking-widest text-foreground mb-3 font-[450]">
        Specifications
      </h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {(product.material?.length ?? 0) > 0 && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              Material -
            </div>
            <div className="text-base text-foreground font-[350]">
              {product.material?.map((m) => m.name).join(", ")}
            </div>
          </div>
        )}
        {product.weight && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              Weight -
            </div>
            <div className="text-base text-foreground font-[350]">
              {product.weight}g
            </div>
          </div>
        )}
        {product.sku && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              SKU -
            </div>
            <div className="text-base text-foreground font-[350]">
              {product.sku}
            </div>
          </div>
        )}
        {product.type && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              Type -
            </div>
            <div className="text-base text-foreground font-[350]">
              {product.type}
            </div>
          </div>
        )}
        {(product.length || product.height || product.breadth) && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              Dimensions -
            </div>
            <div className="text-base text-foreground font-[350]">
              {[product.length, product.breadth, product.height]
                .filter(Boolean)
                .join(" × ")}{" "}
              cm
            </div>
          </div>
        )}
        {(product.minimumAge != null || product.maximumAge != null) && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              Age Range -
            </div>
            <div className="text-base text-foreground font-[350]">
              {product.minimumAge != null ? product.minimumAge : "0"} -{" "}
              {product.maximumAge != null ? product.maximumAge : "18"} Years
            </div>
          </div>
        )}
        {product.idealAge != null && (
          <div>
            <div className="text-base text-foreground mb-1 font-[350]">
              Ideal Age -
            </div>
            <div className="text-base text-foreground font-[350]">
              {product.idealAge} Years
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
