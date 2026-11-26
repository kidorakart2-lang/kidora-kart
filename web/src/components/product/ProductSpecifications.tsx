"use client";

import { motion } from "motion/react";
import {
  Ruler,
  Weight,
  Hash,
  Tag,
  Box,
  Cake,
  Users,
} from "lucide-react";

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

type SpecEntry = {
  icon: typeof Ruler;
  label: string;
  value: string;
};

export default function ProductSpecifications({
  product,
}: ProductSpecificationsProps) {
  const specs: SpecEntry[] = [];

  if ((product.material?.length ?? 0) > 0) {
    specs.push({
      icon: Box,
      label: "Material",
      value: product.material!.map((m) => m.name).join(", "),
    });
  }
  if (product.weight) {
    specs.push({ icon: Weight, label: "Weight", value: `${product.weight}g` });
  }
  if (product.sku) {
    specs.push({ icon: Hash, label: "SKU", value: product.sku });
  }
  if (product.type) {
    specs.push({ icon: Tag, label: "Type", value: product.type });
  }
  if (product.length || product.height || product.breadth) {
    specs.push({
      icon: Ruler,
      label: "Dimensions",
      value: `${[product.length, product.breadth, product.height]
        .filter(Boolean)
        .join(" × ")} cm`,
    });
  }
  if (product.minimumAge != null || product.maximumAge != null) {
    specs.push({
      icon: Users,
      label: "Age range",
      value: `${product.minimumAge ?? 0} – ${product.maximumAge ?? 18} years`,
    });
  }
  if (product.idealAge != null) {
    specs.push({
      icon: Cake,
      label: "Ideal age",
      value: `${product.idealAge} years`,
    });
  }

  if (specs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mt-6"
    >
      <dl className="grid grid-cols-1 gap-x-8 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {specs.map((spec, i) => (
          <motion.div
            key={spec.label}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.55 + i * 0.05 }}
            className="flex items-start gap-2.5 border-b border-[var(--brand-gold)]/15 py-2.5"
          >
            <spec.icon
              size={13}
              className="mt-0.5 shrink-0 text-[var(--brand-gold-dark)]"
              strokeWidth={1.5}
            />
            <div className="min-w-0">
              <dt className="text-[9px] uppercase tracking-[0.14em] text-[var(--brand-ink)]/65">
                {spec.label}
              </dt>
              <dd className="mt-0.5 text-[12.5px] leading-snug text-[var(--brand-ink)]/80">
                {spec.value}
              </dd>
            </div>
          </motion.div>
        ))}
      </dl>
    </motion.div>
  );
}
