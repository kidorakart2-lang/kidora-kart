"use client";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AlertDialogUseProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  confirmDisabled?: boolean;
}

export function AlertDialogUse({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Delete",
  confirmDisabled = false,
}: AlertDialogUseProps) {
  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-w-md">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </div>
          <div className="flex-1 space-y-2">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription>{description}</AlertDialogDescription>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={confirmDisabled}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {confirmText}
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
