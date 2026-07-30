"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface CascadeReference {
  label: string;
  count: number;
}

interface CascadePreview {
  label: string;
  references: CascadeReference[];
  total: number;
}

interface DeleteStep {
  label: string;
  status: "pending" | "processing" | "done" | "error";
  message?: string;
}

interface CascadeDeleteDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Called when dialog is dismissed (overlay click disabled — fires on cancel/close) */
  onClose: () => void;
  /** The Mongoose model name (colors, materials, Categories, SubCategories, SubSubCategories) */
  model: string;
  /** The ID of the entity to delete */
  id: string;
  /** Display name of the entity (e.g. "Gold", "Category Name") */
  entityName: string;
  /** Called after cascade delete is complete and the entity itself is ready for soft-delete.
   * Receives the entity id as a parameter. */
  onProceedToDelete: (id: string) => void;
  /** Whether the final delete mutation is loading */
  isDeleting?: boolean;
}

type Phase = "preview" | "executing" | "confirm-delete";

export default function CascadeDeleteDialog({
  open,
  onClose,
  model,
  id,
  entityName,
  onProceedToDelete,
  isDeleting = false,
}: CascadeDeleteDialogProps) {
  const [phase, setPhase] = useState<Phase>("preview");
  const [preview, setPreview] = useState<CascadePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<DeleteStep[]>([]);

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setPhase("preview");
      setPreview(null);
      setError(null);
      setSteps([]);
      loadPreview();
    }
  }, [open, model, id]);

  const loadPreview = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.postRaw<{ _data: CascadePreview }>(
        "/api/admin/utils/cascade-delete-preview",
        { model, id },
      );
      setPreview(res._data ?? { label: model, references: [], total: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reference data");
    } finally {
      setLoading(false);
    }
  }, [model, id]);

  const handleExecute = async () => {
    setPhase("executing");

    const references = preview?.references ?? [];
    if (references.length === 0) {
      setPhase("confirm-delete");
      return;
    }

    // Show all steps as "processing" while the single API call runs
    setSteps(
      references.map((r) => ({
        label: r.label,
        status: "processing" as const,
      })),
    );

    try {
      const res = await api.postRaw<{ _data: { removed: { label: string; removed: number }[] } }>(
        "/api/admin/utils/cascade-delete-execute",
        { model, id },
      );

      // Mark all steps as done with actual removed counts from the response
      const removed = res._data?.removed ?? [];
      setSteps(
        references.map((ref, i) => ({
          label: ref.label,
          status: "done" as const,
          message: `Cleaned up ${removed[i]?.removed ?? ref.count} record(s)`,
        })),
      );

      setPhase("confirm-delete");
    } catch (err) {
      setSteps((prev) =>
        prev.map((s) => ({ ...s, status: "error" as const, message: "Failed" })),
      );
      setError(err instanceof Error ? err.message : "Failed to execute cascade delete");
      // Return to preview phase so the user can retry or cancel
      setPhase("preview");
    }
  };

  const handleProceed = () => {
    onProceedToDelete(id);
  };

  return (
    <AlertDialog open={open} onOpenChange={(v) => { if (!v && phase !== "executing") onClose(); }}>
      <AlertDialogContent
        className="max-w-md"
        {...{
          onPointerDownOutside: (e: { preventDefault: () => void }) => {
            // Prevent closing by overlay click at all times
            e.preventDefault();
          },
          onEscapeKeyDown: (e: { preventDefault: () => void }) => {
            if (phase === "executing") e.preventDefault();
          },
        }}
      >
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {phase === "preview" && (
              <>
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Delete &ldquo;{entityName}&rdquo;
              </>
            )}
            {phase === "executing" && (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Cleaning up references...
              </>
            )}
            {phase === "confirm-delete" && (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Ready to delete
              </>
            )}
          </AlertDialogTitle>
          <div className="space-y-4">
              {phase === "preview" && (
                <>
                  {loading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : error ? (
                    <div className="text-sm text-destructive">
                      <p>{error}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={loadPreview}
                      >
                        Retry
                      </Button>
                    </div>
                  ) : preview && preview.total > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        This <strong>{preview.label}</strong> is referenced in{" "}
                        <strong>{preview.total}</strong> place(s). Removing it will
                        also clean up these references:
                      </p>
                      <div className="space-y-2">
                        {preview.references.map((ref, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2 text-sm"
                          >
                            <span className="text-foreground">{ref.label}</span>
                            <span className="font-semibold text-destructive">
                              {ref.count}
                            </span>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The references will be removed automatically. Then you can
                        confirm the soft-delete.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      This <strong>{preview?.label || model}</strong> is not
                      referenced anywhere. You can proceed to delete it directly.
                    </p>
                  )}
                </>
              )}

              {phase === "executing" && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground mb-3">
                    Removing references from related data...
                  </p>
                  {steps.map((step, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                        step.status === "done"
                          ? "bg-green-50 text-green-700"
                          : step.status === "error"
                            ? "bg-red-50 text-red-700"
                            : step.status === "processing"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {step.status === "pending" && (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      {step.status === "processing" && (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      )}
                      {step.status === "done" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                      )}
                      {step.status === "error" && (
                        <XCircle className="h-4 w-4 text-red-600 shrink-0" />
                      )}
                      <span className="flex-1">{step.label}</span>
                      {step.message && (
                        <span className="text-xs opacity-70">{step.message}</span>
                      )}
                    </div>
                  ))}
                  {error && (
                    <p className="text-xs text-destructive mt-2">{error}</p>
                  )}
                </div>
              )}

              {phase === "confirm-delete" && (
                <p className="text-sm text-muted-foreground">
                  All references have been cleaned up. You can now soft-delete{" "}
                  <strong>{entityName}</strong>.
                </p>
              )}
            </div>
        </AlertDialogHeader>

        <AlertDialogFooter>
          {phase === "preview" && (
            <>
              <AlertDialogCancel onClick={onClose}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleExecute}>
                {preview && preview.total > 0
                  ? "Clean Up & Delete"
                  : "Proceed to Delete"}
              </AlertDialogAction>
            </>
          )}
          {phase === "executing" && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Please wait...
            </div>
          )}
          {phase === "confirm-delete" && (
            <>
              {!error && (
                <Button
                  variant="destructive"
                  onClick={handleProceed}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Confirm Soft Delete"
                  )}
                </Button>
              )}
              {error && (
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              )}
            </>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
