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
      className="overflow-hidden transition-all duration-300 hover:shadow-lg"
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-3xl font-bold tracking-tight">
            {title.includes("Revenue")
              ? `₹${displayValue.toLocaleString()}`
              : displayValue.toLocaleString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
