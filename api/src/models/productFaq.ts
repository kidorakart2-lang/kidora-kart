import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const productFaqSchema = new Schema(
  {
    question: {
      type: String,
      required: [true, "Question is required"],
    },
    answer: { type: String, required: [true, "Answer is required"] },
    product: {
      type: Schema.Types.ObjectId,
      ref: "products",
      default: null,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Categories",
      default: null,
    },
    status: { type: Boolean, default: true },
    order: {
      type: Number,
      default: 0,
      min: 0,
      max: 1000,
    },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

productFaqSchema.index({ product: 1 });
productFaqSchema.index({ category: 1 });

export type IProductFaq = InferSchemaType<typeof productFaqSchema>;

const ProductFaqModel: Model<IProductFaq> = mongoose.model<IProductFaq>(
  "productfaqs",
  productFaqSchema,
);

export default ProductFaqModel;
