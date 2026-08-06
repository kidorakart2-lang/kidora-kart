"use client";
import React, { useState, type FormEvent } from "react";
import { Award, Check, Edit3, Star, ChevronUp, ChevronDown, Shield } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { getAuthToken } from "@/lib/cookies";
import type { Review } from "@/lib/useReviews";
import { useProductReviews, useSubmitReview } from "@/lib/useReviews";
import { openLoginModal } from "@/redux/features/uiSlice";
import { useDispatch } from "react-redux";

interface FormErrors {
  comment?: string;
  rating?: string;
}

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readOnly?: boolean;
}

interface ProductReviewsProps {
  productId: string;
}

const StarRating = ({ rating, onRatingChange, readOnly = false }: StarRatingProps) => (
  <div className="flex">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        aria-label={`${star} star${star > 1 ? 's' : ''}`}
        onClick={() => { if (!readOnly && onRatingChange) onRatingChange(star); }}
        className={`${!readOnly ? "cursor-pointer" : ""}`}
        disabled={readOnly}
      >
        <Star
          size={20}
          className={`${
            star <= rating ? "fill-brand-400 text-brand-400" : "text-muted-foreground"
          }`}
        />
      </button>
    ))}
  </div>
);

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const [expandedReview, setExpandedReview] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    comment: "",
    rating: 0,
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();

  const { data: reviewData, isLoading } = useProductReviews(productId);
  const reviews: Review[] = reviewData?.reviews ?? [];
  const averageRating = reviewData?.averageRating ?? 0;

  const submitReviewMutation = useSubmitReview();

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

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    if (!formData.comment.trim()) errors.comment = "Comment is required";
    if (formData.rating === 0) errors.rating = "Please select a rating";
    return errors;
  };

  const dispatch = useDispatch();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!getAuthToken()) {
      dispatch(openLoginModal());
      return;
    }

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      await submitReviewMutation.mutateAsync({
        productId,
        comment: formData.comment,
        rating: formData.rating,
      });
      setSubmitSuccess(true);
      setFormData({ name: "", comment: "", rating: 0 });
      setFormErrors({});
      // Close modal after 2 seconds
      setTimeout(() => {
        setIsModalOpen(false);
        setSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setSubmitSuccess(false);
    setFormData({ name: "", comment: "", rating: 0 });
    setFormErrors({});
  };

  if (isLoading) {
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
      >
        {/* Section Header */}
        <div className="text-center mb-12">
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-brand-300" />
            <Award size={20} className="text-brand-600" strokeWidth={1.5} />
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-brand-300" />
          </motion.div>

          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl fw-heading text-foreground tracking-tight mb-3"
          >
            Customer Reviews
          </motion.h2>

          <motion.p
            variants={itemVariants}
            className="text-sm text-muted-foreground fw-body uppercase tracking-[0.2em]"
          >
            What Our Clients Say
          </motion.p>
        </div>

        {/* Main Content Card */}
        <div className="bg-background/60 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/80 overflow-hidden">
          {/* Header with Write Review Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-8 md:p-10 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                <Star
                  size={20}
                  className="text-brand-600 fill-brand-600"
                  strokeWidth={1.5}
                />
              </div>
              <div>
                <div className="text-sm text-muted-foreground fw-body">
                  Overall Rating
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl fw-body text-foreground">
                    {averageRating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground text-sm">/ 5.0</span>
                </div>
              </div>
            </div>

            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsModalOpen(true)}
className="px-6 py-3 btn-gradient rounded-full fw-cta text-sm uppercase tracking-wider shadow-sm transition-all flex items-center gap-2"
          >
            <Edit3 size={16} />
            <span>Write Review</span>
            </motion.button>
          </div>

          {/* Rating Summary */}
          <motion.div
            variants={itemVariants}
            className="p-8 md:p-10 bg-gradient-to-br from-brand-50/30 to-brand-100/30"
          >
            <div className="flex items-center gap-6 mb-4">
              <StarRating rating={Math.round(averageRating)} readOnly={true} />
              <span className="text-muted-foreground fw-body text-sm">
                Based on {reviews.length}{" "}
                {reviews.length === 1 ? "review" : "reviews"}
              </span>
            </div>

            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${(averageRating / 5) * 100}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="absolute h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
              />
            </div>
          </motion.div>

          {/* Reviews List */}
          <motion.div
            variants={containerVariants}
            className="p-8 md:p-10 space-y-4"
          >
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group relative"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  className="p-6 md:p-8 bg-background rounded-2xl border border-border hover:border-brand-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
                  onClick={() =>
                    setExpandedReview(expandedReview === i ? null : i)
                  }
                >
                  {/* Verified Badge */}
                  {review.verified && (
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
                      <Shield size={12} className="text-amber-600" />
                      <span className="text-xs text-amber-700 fw-body">
                        Verified
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center text-brand-700 fw-body text-lg">
                        {review.userId?.avatar ? (
                          <img
                            src={review.userId.avatar}
                            alt={review.userId.name || "User"}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          (review.userId?.name || "U").charAt(0).toUpperCase()
                        )}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="fw-heading text-foreground text-lg">
                          {review.userId?.name || "Anonymous User"}
                        </h4>
                        <span className="text-xs text-muted-foreground fw-body">
                          {new Date(review.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <StarRating rating={review.rating} readOnly={true} />
                        <span className="text-sm text-muted-foreground">|</span>
                        <span className="text-sm text-muted-foreground fw-body">
                          {review.rating}.0
                        </span>
                      </div>

                      {/* Review Text */}
                      <p
                        className={`text-muted-foreground fw-body leading-relaxed ${
                          expandedReview === i ? "" : "line-clamp-2"
                        }`}
                      >
                        {review.comment}
                      </p>

                      {/* Expand Button */}
                      {review.comment.length > 150 && (
                        <button className="mt-3 flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700 fw-cta transition-colors">
                          <span>
                            {expandedReview === i ? "Show less" : "Read more"}
                          </span>
                          {expandedReview === i ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submitSuccess && setIsModalOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[1000]"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-[1001]"
            >
              <div className="bg-background rounded-3xl shadow-2xl p-8 m-4">
                {submitSuccess ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Check
                        className="w-10 h-10 text-amber-500"
                        strokeWidth={2}
                      />
                    </motion.div>
                    <h3 className="text-2xl fw-heading text-foreground mb-2">
                      Thank You!
                    </h3>
                    <p className="text-muted-foreground fw-body">
                      Your review has been submitted successfully
                    </p>
                  </motion.div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h3 className="text-3xl fw-heading text-foreground mb-2">
                        Write a Review
                      </h3>
                      <p className="text-sm text-muted-foreground fw-body">
                        Share your experience with us
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <label id="rating-label" className="block text-sm fw-body text-muted-foreground mb-3 uppercase tracking-wider">
                          Your Rating
                        </label>
                        <div role="radiogroup" aria-labelledby="rating-label">
                          <StarRating
                            rating={formData.rating}
                            onRatingChange={handleRatingChange}
                          />
                        </div>
                        {formErrors.rating && (
                          <p className="mt-2 text-sm text-destructive fw-body">
                            {formErrors.rating}
                          </p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="comment" className="block text-sm fw-body text-muted-foreground mb-3 uppercase tracking-wider">
                          Your Review <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          id="comment"
                          name="comment"
                          value={formData.comment}
                          onChange={handleInputChange}
                          rows={5}
                          className="w-full px-4 py-3 border border-border rounded-2xl focus:border-brand-300 focus:ring focus:ring-brand-200 focus:ring-opacity-50 transition-all fw-body text-muted-foreground resize-none"
                          placeholder="Share your thoughts about this piece..."
                          aria-required={true}
                        />
                        {formErrors.comment && (
                          <p className="mt-2 text-sm text-destructive fw-body">
                            {formErrors.comment}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <motion.button
                          type="button"
                          onClick={() => setIsModalOpen(false)}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-3 border border-border text-muted-foreground rounded-full fw-cta text-sm uppercase tracking-wider hover:bg-muted transition-all"
                        >
                          Cancel
                        </motion.button>
                        <motion.button
                          type="button"
                          onClick={handleSubmit}
                          disabled={submitReviewMutation.isPending}
                          whileHover={{ y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          className="flex-1 px-6 py-3 btn-gradient rounded-full fw-cta text-sm uppercase tracking-wider shadow-sm transition-all disabled:opacity-50"
                        >
                          {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </motion.button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
