"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  icon: LucideIcon;
}

export function StatCard({ title, value, icon: Icon }: StatCardProps) {
  const displayValue = value;

  return (
    <Card
      className="overflow-hidden rounded-xl border-[#c6a875]/20 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c6a875]/50 hover:shadow-lg"
    >
      <CardContent className="p-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            {title}
          </p>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#c6a875]/25 bg-[#c6a875]/10">
            <Icon className="h-4.5 w-4.5 text-[#c6a875]" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="admin-display text-3xl tracking-tight">
            {title.includes("Revenue")
              ? `₹${displayValue.toLocaleString()}`
              : displayValue.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
