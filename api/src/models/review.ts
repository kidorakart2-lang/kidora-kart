import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const reviewSchema = new Schema(
  {
    comment: { type: String, required: [true, "Comment is required"] },
    rating: { type: Number, required: [true, "Rating is required"] },
    productId: {
      type: Schema.Types.ObjectId,
      required: [true, "Product ID is required"],
      ref: "products",
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, "User ID is required"],
      ref: "users",
    },
    status: {
      type: Boolean,
      default: true,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export type IReview = InferSchemaType<typeof reviewSchema>;

const Review: Model<IReview> = mongoose.model<IReview>("Reviews", reviewSchema);
export default Review;