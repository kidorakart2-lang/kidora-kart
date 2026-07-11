"use client";
import React, { useEffect, useState } from "react";
import { Star } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api, ApiClientError } from "@/lib/api";

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

const StarRating = ({ rating, onRatingChange, readOnly = false }: StarRatingProps) => (
  <div className="flex">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => !readOnly && onRatingChange?.(star)}
        className={`${!readOnly ? "cursor-pointer" : ""}`}
        disabled={readOnly}
      >
        <Star
          size={20}
          className={`${
            star <= rating ? "fill-amber-400 text-amber-400" : "text-muted"
          }`}
        />
      </button>
    ))}
  </div>
);

interface Review {
  _id: string;
  userId?: { name?: string; avatar?: string };
  rating: number;
  comment: string;
  status: boolean;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    comment: "",
    rating: 0,
  });
  interface FormErrors { comment?: string; rating?: string; }
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const data = await api.postRaw<{ _data?: Review[]; _rating?: number }>("/api/website/review/get/" + productId, { productId });
        setReviews(data._data || []);
        setAverageRating(data._rating || 0);
    } catch (error) {
      console.error("Error fetching reviews:", error instanceof Error ? error.message : error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, [productId]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRatingChange = (rating: number) => {
    setFormData((prev) => ({
      ...prev,
      rating,
    }));
  };

  const validateForm = () => {
    const errors: FormErrors = {};
    if (!formData.comment.trim()) errors.comment = "Comment is required";
    if (formData.rating === 0) errors.rating = "Please select a rating";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post("/api/website/review/create", {
        productId,
        comment: formData.comment,
        rating: formData.rating,
      });
      setSubmitSuccess(true);
      router.refresh();
      setFormData({ comment: "", rating: 0 });
      setFormErrors({});
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      const errMsg = error instanceof Error && "response" in error ? (error as { response: { data: { _message: string } } }).response.data._message : "Failed to submit review";
      toast.error(errMsg);
      console.error("Error submitting review:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    setLoading(true);
    try {
      await api.put("/api/admin/review/delete/" + reviewId);
      toast.success("Review deleted successfully");
      router.refresh();
    } catch (error) {
      const errMsg = error instanceof Error && "response" in error ? (error as { response: { data: { _message: string } } }).response.data._message : "Failed to delete review";
      toast.error(errMsg);
      console.error("Error deleting review:", error);
    }
    setLoading(false);
  };

  const handleStatusChange = async (reviewId: string) => {
    setLoading(true);
    try {
      await api.put("/api/admin/review/status/" + reviewId);
      toast.success("Review status changed successfully");
      router.refresh();
    } catch (error) {
      const errMsg = error instanceof Error && "response" in error ? (error as { response: { data: { _message: string } } }).response.data._message : "Failed to change review status";
      toast.error(errMsg);
      console.error("Error changing review status:", error);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="mb-16"
      >
        <div className="bg-gradient-to-br from-white via-amber-50/30 to-white rounded-3xl shadow-xl p-8 md:p-12 mt-8 border border-amber-100/50 glass-effect">
          <div className="flex justify-between items-center mb-8">
            <motion.h2
              variants={itemVariants}
              className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent"
            >
              Customer Reviews
            </motion.h2>
            <Dialog
              modal={false}
              open={isModalOpen}
              onOpenChange={setIsModalOpen}
            >
              <DialogTrigger asChild>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90">
                    Write a Review
                  </Button>
                </motion.div>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md w-full z-[1500]">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-foreground">
                    Write a Review
                  </DialogTitle>
                </DialogHeader>
                {submitSuccess ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg
                        className="w-8 h-8 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <p className="text-lg font-medium text-foreground">
                      Thank you for your review!
                    </p>
                    <p className="text-muted-foreground mt-1">
                      Your review has been submitted successfully.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        Your Rating <span className="text-destructive">*</span>
                      </label>
                      <StarRating
                        rating={formData.rating}
                        onRatingChange={handleRatingChange}
                      />
                      {formErrors.rating && (
                        <p className="mt-1 text-sm text-destructive">
                          {formErrors.rating}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="comment"
                        className="block text-sm font-medium text-foreground mb-1"
                      >
                        Your Review <span className="text-destructive">*</span>
                      </label>
                      <Textarea
                        id="comment"
                        name="comment"
                        value={formData.comment}
                        onChange={handleInputChange}
                         rows={4}
                        className={`${
                          formErrors.comment ? "border-red-500" : ""
                        }`}
                        placeholder="Share your experience with this product..."
                      />
                      {formErrors.comment && (
                        <p className="mt-1 text-sm text-destructive">
                          {formErrors.comment}
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-90 transition-opacity disabled:opacity-70"
                      >
                        {isSubmitting ? "Submitting..." : "Submit Review"}
                      </Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>

          <motion.div
            variants={itemVariants}
            className="mb-8 p-6 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl border border-amber-100"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <StarRating
                  rating={Math.round(averageRating)}
                  readOnly={true}
                />
                <span className="text-2xl font-bold text-amber-600">
                  {averageRating.toFixed(1)}
                </span>
              </div>
              <span className="text-muted-foreground">
                ({reviews.length} {reviews.length === 1 ? "review" : "reviews"})
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(averageRating / 5) * 100}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full"
              />
            </div>
          </motion.div>

          <motion.div variants={containerVariants} className="space-y-4">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                whileHover={{ x: 8 }}
                className="p-6 bg-background/60 backdrop-blur-sm rounded-2xl border border-amber-100/50 hover:border-amber-200 transition-all cursor-pointer"
                onClick={() =>
                  setExpandedReview(expandedReview === i ? null : i)
                }
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                   <Image src={review?.userId?.avatar ||"placeholder.svg"} alt={review?.userId?.name ?? "Customer"} width={50} height={50} className="rounded-full" />
                    <h4 className="font-semibold text-foreground">
                      Customer {review?.userId?.name}
                    </h4>
                    <div className="flex items-center gap-1 mt-1">
                      <StarRating rating={review.rating} readOnly />
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review?.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-foreground line-clamp-2">{review?.comment}</p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleStatusChange(review._id)}
                  >
                    Change Status to {review.status ? "Inactive" : "Active"}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-2"
                    onClick={() => handleDeleteReview(review._id)}
                  >
                    Delete
                  </Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
