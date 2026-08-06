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
  purity?: string;
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
      transition={{ delay: 0.9 }}
      className="mb-7"
    >
      <h3 className="text-sm uppercase tracking-[0.2em] text-muted-foreground fw-heading mb-3">
        Specifications
      </h3>
      <div className="grid grid-cols-2 gap-x-8 gap-y-6">
        {(product.material?.length ?? 0) > 0 && (
          <div>
            <div className="text-base text-foreground mb-1 fw-body">Material -</div>
            <div className="text-base text-foreground fw-heading">
              {product.material?.map((m) => m.name).join(", ")}
            </div>
          </div>
        )}
        {product.weight && (
          <div>
            <div className="text-base text-foreground mb-1 fw-body">Weight -</div>
            <div className="text-base text-foreground fw-heading">
              {product.weight}g
            </div>
          </div>
        )}
        {product.purity && (
          <div>
            <div className="text-base text-foreground mb-1 fw-body">Purity -</div>
            <div className="text-base text-foreground fw-heading">
              {product.purity}
            </div>
          </div>
        )}
        {product.sku && (
          <div>
            <div className="text-base text-foreground mb-1 fw-body">SKU -</div>
            <div className="text-base text-foreground fw-heading">
              {product.sku}
            </div>
          </div>
        )}
        {product.type && (
          <div>
            <div className="text-base text-foreground mb-1 fw-body">Type -</div>
            <div className="text-base text-foreground fw-heading">
              {product.type}
            </div>
          </div>
        )}
        {(product.length || product.height || product.breadth) && (
          <div>
            <div className="text-base text-foreground mb-1 fw-body">Dimensions -</div>
            <div className="text-base text-foreground fw-heading">
              {[product.length, product.breadth, product.height]
                .filter(Boolean)
                .join(" × ")}{" "}
              cm
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
