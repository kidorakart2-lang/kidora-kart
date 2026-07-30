"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Review } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExportButtons } from "@/components/export-buttons";
import { AlertDialogUse } from "@/components/alert-dialog";
import {
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Star,
  MessageSquare,
  User,
  CalendarDays,
  Package,
  Search,
  RefreshCw,
} from "lucide-react";
import { api } from "@/lib/api";
import { invalidateCache } from "@/lib/invalidate-cache";
import { ErrorState } from "@/components/ui/error-state";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

function fetchReviews(isDeletedAt?: string): Promise<Review[]> {
  return api.post<Review[]>("/api/admin/review/view", { isDeletedAt });
}

function deleteReview(id: string) {
  return api.put(`/api/admin/review/delete/${id}`, { id });
}

function changeReviewStatus(id: string) {
  return api.put(`/api/admin/review/status/${id}`, { id });
}

export default function ReviewsPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | null>(null);
  const [reviewToDeleteIsDeleted, setReviewToDeleteIsDeleted] = useState(false);
  const [deletedFilter, setDeletedFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading, isError, error } = useQuery({
    queryKey: ["reviews", deletedFilter],
    queryFn: () => fetchReviews(deletedFilter === "active" ? undefined : deletedFilter),
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      invalidateCache(["reviews", "product"]);
      toast({ title: reviewToDeleteIsDeleted ? "Review permanently deleted" : "Review deleted successfully" });
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      setReviewToDeleteIsDeleted(false);
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
      setDeleteDialogOpen(false);
      setReviewToDelete(null);
      setReviewToDeleteIsDeleted(false);
    },
  });

  const statusMutation = useMutation({
    mutationFn: changeReviewStatus,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      invalidateCache(["reviews", "product"]);
      toast({ title: "Review status updated" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const isPending = deleteMutation.isPending || statusMutation.isPending;

  const handleDelete = (id: string, isAlreadyDeleted: boolean) => {
    setReviewToDelete(id);
    setReviewToDeleteIsDeleted(isAlreadyDeleted);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (reviewToDelete) deleteMutation.mutate(reviewToDelete);
  };

  const filteredReviews = searchQuery
    ? reviews.filter(
        (r) =>
          r.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.userId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.productId?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : reviews;

  if (isError) {
    return (
      <div className="p-6">
        <ErrorState
          title="Failed to load reviews"
          message={error instanceof Error ? error.message : "Could not fetch reviews from the server."}
          onRetry={() => queryClient.invalidateQueries({ queryKey: ["reviews"] })}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-muted rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-72 bg-muted rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-300">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reviews</h1>
          <p className="text-muted-foreground">
            Manage customer product reviews
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={deletedFilter} onValueChange={setDeletedFilter}>
            <SelectTrigger className="w-[150px] h-8 text-xs">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="all">All (incl. deleted)</SelectItem>
              <SelectItem value="deleted">Deleted Only</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search reviews..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 text-xs"
            />
          </div>
          <ExportButtons data={filteredReviews} filename="reviews" />
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["reviews"] })}
            className="h-8"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom duration-300">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{reviews.length}</p>
              <p className="text-xs text-muted-foreground">Total Reviews</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Star className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reviews.length > 0
                  ? (
                      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                      reviews.length
                    ).toFixed(1)
                  : "0.0"}
              </p>
              <p className="text-xs text-muted-foreground">Avg Rating</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <Eye className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reviews.filter((r) => r.status).length}
              </p>
              <p className="text-xs text-muted-foreground">Visible</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10">
              <Trash2 className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {reviews.filter((r) => r.deletedAt).length}
              </p>
              <p className="text-xs text-muted-foreground">Deleted</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Review cards grid */}
      {filteredReviews.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground">
            No reviews found
          </h3>
          <p className="text-sm text-muted-foreground/60 mt-1">
            {searchQuery
              ? "Try adjusting your search query"
              : deletedFilter === "deleted"
                ? "No deleted reviews"
                : "No reviews yet"}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReviews.map((review, index) => {
            const isDeleted = !!review.deletedAt;
            return (
              <Card
                key={review._id}
                className={`p-5 group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom ${
                  isDeleted ? "opacity-60 border-dashed" : ""
                }`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="space-y-4">
                  {/* Header: User + Status */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 ring-2 ring-primary/10 shrink-0">
                        <AvatarImage
                          src={`https://ui-avatars.com/api/?name=${encodeURIComponent(review.userId?.name || "U")}&background=random`}
                          alt={review.userId?.name || "User"}
                        />
                        <AvatarFallback>
                          {review.userId?.name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">
                          {review.userId?.name || "Unknown User"}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {review.userId?.email || ""}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        isDeleted
                          ? "destructive"
                          : review.status
                            ? "default"
                            : "secondary"
                      }
                      className="shrink-0 text-[10px]"
                    >
                      {isDeleted
                        ? "Deleted"
                        : review.status
                          ? "Active"
                          : "Hidden"}
                    </Badge>
                  </div>

                  {/* Product info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">
                      {review.productId?.name || "Unknown Product"}
                    </span>
                  </div>

                  {/* Star rating */}
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 transition-all duration-300 ${
                          star <= (review.rating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted"
                        }`}
                      />
                    ))}
                    <span className="text-xs text-muted-foreground ml-2 mt-0.5">
                      {review.rating}/5
                    </span>
                  </div>

                  {/* Comment */}
                  <p className="text-sm text-foreground/80 leading-relaxed line-clamp-4 min-h-[3.5rem]">
                    {review.comment || "No comment"}
                  </p>

                  {/* Date */}
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <CalendarDays className="h-3 w-3" />
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "Unknown date"}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border">
                    <TooltipProvider>
                      {!isDeleted && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                review._id && statusMutation.mutate(review._id)
                              }
                              className="flex-1 transition-all duration-200 hover:scale-105 h-8 text-xs"
                              disabled={isPending}
                            >
                              {statusMutation.isPending ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : review.status ? (
                                <EyeOff className="h-3 w-3 mr-1" />
                              ) : (
                                <Eye className="h-3 w-3 mr-1" />
                              )}
                              {review.status ? "Hide" : "Show"}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {review.status
                              ? "Hide from website"
                              : "Show on website"}
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => review._id && handleDelete(review._id, isDeleted)}
                            className="flex-1 transition-all duration-200 hover:scale-105 h-8 text-xs"
                            disabled={isPending}
                          >
                            {deleteMutation.isPending &&
                            reviewToDelete === review._id ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3 mr-1" />
                            )}
                            {isDeleted ? "Delete Permanently" : "Delete"}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {isDeleted ? "Permanently delete this review (irreversible)" : "Soft delete review"}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialogUse
        isOpen={deleteDialogOpen}
        onClose={() => {
          if (!deleteMutation.isPending) {
            setDeleteDialogOpen(false);
            setReviewToDelete(null);
            setReviewToDeleteIsDeleted(false);
          }
        }}
        onConfirm={confirmDelete}
        title={reviewToDeleteIsDeleted ? "Permanently Delete Review" : "Delete Review"}
        description={reviewToDeleteIsDeleted
          ? "This will permanently delete this review from the database. This action cannot be undone. The user will not be able to submit a new review for this product."
          : "Are you sure you want to delete this review? The user will be notified via email about this action. You can restore it later from the 'All' filter."
        }
        confirmText={reviewToDeleteIsDeleted ? "Permanently Delete" : "Soft Delete"}
      />
    </div>
  );
}
