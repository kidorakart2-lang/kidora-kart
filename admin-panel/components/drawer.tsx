"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
  side?: "left" | "right";
}

export function Drawer({ isOpen, onClose, title, children, className, side = "right" }: DrawerProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetDescription className="sr-only">{title}</SheetDescription>
      <SheetContent
        side={side}
        className={cn(
          "w-full max-w-md bg-card border-l border-border shadow-2xl p-0 [&>button]:hidden",
          className,
        )}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="flex flex-row items-center justify-between p-6 border-b border-border">
            <SheetTitle className="text-xl font-semibold">{title}</SheetTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="transition-opacity opacity-50 hover:opacity-100"
            >
              <X className="h-5 w-5" />
            </Button>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6 pb-20">{children}</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
