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
            star <= rating ? "fill-[var(--brand-gold)] text-[var(--brand-gold)]" : "text-[var(--brand-ink)]/20"
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
        <motion.div
          variants={itemVariants}
          className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[var(--brand-gold)]/20 pb-4"
        >
          <div>
            <p className="eyebrow">
              <span className="mr-2">✦</span>
              Real words, real pieces
            </p>
            <h2 className="display-heading mt-2 text-2xl sm:text-3xl">
              Reviews
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[var(--brand-ink)]/45">
            <Award size={14} className="text-[var(--brand-gold-dark)]" />
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </motion.div>

        {/* Main Content Card */}
        <div className="overflow-hidden rounded-2xl border border-[var(--brand-gold)]/20 bg-white">
          {/* Header with Write Review Button */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-8 md:p-10 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-full border border-[var(--brand-gold)]/30 bg-white">
                <Star
                  size={18}
                  className="fill-[var(--brand-gold)] text-[var(--brand-gold)]"
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
className="btn-gold !px-5 !py-2.5 !text-[10px] uppercase tracking-[0.16em]"
          >
            <Edit3 size={16} />
            <span>Write Review</span>
            </motion.button>
          </div>

          {/* Rating Summary */}
          <motion.div
            variants={itemVariants}
            className="bg-[var(--brand-section-bg)]/60 p-6 md:p-8"
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
                className="absolute h-full rounded-full bg-[var(--brand-gold)]"
              />
            </div>
          </motion.div>

          {/* Reviews List */}
          <motion.div
            variants={containerVariants}
            className="space-y-3 p-6 md:p-8"
          >
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                variants={itemVariants}
                className="group relative"
              >
                <motion.div
                  whileHover={{ y: -2 }}
                  className="cursor-pointer rounded-xl border border-[var(--brand-gold)]/15 bg-white p-5 transition-all hover:border-[var(--brand-gold)]/40 md:p-6"
                  onClick={() =>
                    setExpandedReview(expandedReview === i ? null : i)
                  }
                >
                  {/* Verified Badge */}
                  {review.verified && (
                    <div className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-[var(--brand-gold)]/30 bg-[var(--brand-section-bg)] px-2.5 py-0.5">
                      <Shield size={11} className="text-[var(--brand-gold-dark)]" />
                      <span className="text-[9px] uppercase tracking-[0.1em] text-[var(--brand-gold-dark)]">
                        Verified
                      </span>
                    </div>
                  )}

                  <div className="flex items-start gap-4 mb-4">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                      <div className="grid size-10 place-items-center rounded-full bg-[var(--brand-section-bg)] text-sm text-[var(--brand-plum)]">
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
                        <h4 className="display-heading text-base">
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
                        <button className="mt-2 flex items-center gap-1 text-[11px] text-[var(--brand-gold-dark)] transition-colors hover:text-[var(--brand-plum)]">
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
                      className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <Check
                        className="w-10 h-10 text-green-500"
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
