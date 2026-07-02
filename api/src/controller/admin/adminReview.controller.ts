import type { Request, Response } from "express";
import Reviews from "../../models/review.js";

export const getAllReviews = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const isDeletedAt = (req.body?.isDeletedAt ?? req.query?.isDeletedAt) as string | undefined;

    const query: Record<string, unknown> = {};
    if (isDeletedAt === "all") {
      // no deletedAt filter — show everything
    } else if (isDeletedAt === "deleted") {
      query.deletedAt = { $ne: null };
    } else {
      query.deletedAt = null;
    }

    const reviews = await Reviews.find(query)
      .populate("userId")
      .populate("productId")
      .sort("-createdAt");
    res.status(200).json({
      _status: true,
      _message: "All reviews fetched successfully",
      _data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Failed to fetch reviews",
      _data: [],
    });
  }
};

export const getReviewById = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Reviews.findById(id)
      .populate("userId")
      .populate("productId");
    if (!review) {
      res.status(404).json({
        _status: false,
        _message: "Review not found",
        _data: null,
      });
      return;
    }
    res.status(200).json({
      _status: true,
      _message: "Review fetched successfully",
      _data: review,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Failed to fetch review",
      _data: null,
    });
  }
};

export const updateReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const updated = await Reviews.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!updated) {
      res.status(404).json({
        _status: false,
        _message: "Review not found",
        _data: null,
      });
      return;
    }
    res.status(200).json({
      _status: true,
      _message: "Review updated successfully",
      _data: updated,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Failed to update review",
      _data: null,
    });
  }
};

export const deleteReview = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await Reviews.findById(id);
    if (!review) {
      res.status(404).json({
        _status: false,
        _message: "Review not found",
        _data: null,
      });
      return;
    }
    // Already soft-deleted → permanently delete
    if (review.deletedAt) {
      await Reviews.findByIdAndDelete(id);
      res.status(200).json({
        _status: true,
        _message: "Review permanently deleted",
        _data: null,
      });
      return;
    }
    // No user attached → permanently delete (guest review)
    if (!review.userId) {
      await Reviews.findByIdAndDelete(id);
      res.status(200).json({
        _status: true,
        _message: "Review deleted successfully",
        _data: null,
      });
      return;
    }
    // Soft delete for user-attached reviews
    review.deletedAt = new Date();
    await review.save();
    res.status(200).json({
      _status: true,
      _message: "Review marked as deleted successfully",
      _data: null,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: "Failed to delete review",
      _data: null,
    });
  }
};

export const changeStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const result = await Reviews.updateMany(
      { _id: id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    if (result.matchedCount === 0) {
      res.status(404).json({
        _status: false,
        _message: "No Data Found",
        _data: null,
      });
      return;
    }
    res.status(200).json({
      _status: true,
      _message: "Status Changed",
      _data: result,
    });
  } catch {
    // Original swallow; preserved.
  }
};