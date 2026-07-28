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
  Package,
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
  color: string;
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
      color: "var(--brand-card-1-icon)",
    });
  }
  if (product.weight) {
    specs.push({
      icon: Weight,
      label: "Weight",
      value: `${product.weight}g`,
      color: "var(--brand-card-2-icon)",
    });
  }
  if (product.sku) {
    specs.push({
      icon: Hash,
      label: "SKU",
      value: product.sku,
      color: "var(--brand-card-3-icon)",
    });
  }
  if (product.type) {
    specs.push({
      icon: Tag,
      label: "Type",
      value: product.type,
      color: "var(--brand-card-4-icon)",
    });
  }
  if (product.length || product.height || product.breadth) {
    specs.push({
      icon: Ruler,
      label: "Dimensions",
      value: `${[product.length, product.breadth, product.height]
        .filter(Boolean)
        .join(" × ")} cm`,
      color: "var(--brand-card-5-icon)",
    });
  }
  if (product.minimumAge != null || product.maximumAge != null) {
    specs.push({
      icon: Users,
      label: "Age Range",
      value: `${product.minimumAge ?? 0} - ${product.maximumAge ?? 18} Years`,
      color: "var(--brand-card-1-icon)",
    });
  }
  if (product.idealAge != null) {
    specs.push({
      icon: Cake,
      label: "Ideal Age",
      value: `${product.idealAge} Years`,
      color: "var(--brand-card-2-icon)",
    });
  }

  if (specs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="mb-9"
    >
      <div className="flex items-center gap-2 mb-4">
        <Package size={16} className="text-muted-foreground" strokeWidth={1.5} />
        <h3 className="text-sm uppercase tracking-[0.2em] text-muted-foreground fw-heading">
          Specifications
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {specs.map((spec, i) => (
          <motion.div
            key={spec.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 + i * 0.06, duration: 0.35 }}
            className="relative group"
          >
            <div
              className="rounded-xl border-2 p-3.5 transition-all duration-300
                         hover:-translate-y-0.5 hover:shadow-md"
              style={{
                borderColor: `color-mix(in srgb, ${spec.color} 30%, transparent)`,
                backgroundColor: `color-mix(in srgb, ${spec.color} 6%, transparent)`,
              }}
            >
              {/* Icon */}
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
                style={{ backgroundColor: `color-mix(in srgb, ${spec.color} 15%, transparent)` }}
              >
                <spec.icon
                  size={15}
                  style={{ color: spec.color }}
                  strokeWidth={2}
                />
              </div>

              {/* Label */}
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5 fw-body">
                {spec.label}
              </p>

              {/* Value */}
              <p className="text-sm fw-heading text-foreground leading-tight">
                {spec.value}
              </p>
            </div>

            {/* Toy-block shadow accent */}
            <div
              className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-b-xl opacity-30 transition-opacity duration-300 group-hover:opacity-60"
              style={{ backgroundColor: spec.color }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
