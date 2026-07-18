import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please Enter A Name"],
      minlength: 3,
    },
    slug: {
      type: String,
      required: [true, "Please Enter A Slug"],
    },
    image: {
      type: String,
      required: [true, "Please Enter A Image"],
    },
    images: [
      {
        type: String,
        default: "",
        required: [true, "Please Enter A Image"],
      },
    ],
    colors: [
      {
        type: Schema.Types.ObjectId,
        ref: "colors",
        required: [true, "Please Enter A Color"],
      },
    ],
    material: [
      {
        type: Schema.Types.ObjectId,
        ref: "materials",
        required: [true, "Please Enter A Material"],
      },
    ],
    category: [
      {
        type: Schema.Types.ObjectId,
        ref: "Categories",
        required: [true, "Category is required"],
      },
    ],
    subCategory: [
      {
        type: Schema.Types.ObjectId,
        ref: "SubCategories",
        required: [true, " Sub Category is required"],
      },
    ],
    subSubCategory: [
      {
        type: Schema.Types.ObjectId,
        ref: "SubSubCategories",
      },
    ],
    description: {
      type: String,
      required: [true, "Please enter a description"],
    },
    shortDescription: {
      type: String,
      default: "",
    },
    weight: {
      type: String,
      required: [true, "Please enter a weight greater than or equal to 10 grams"],
    },
    length: {
      type: Number,
      default: null,
    },
    height: {
      type: Number,
      default: null,
    },
    breadth: {
      type: Number,
      default: null,
    },
    minimumAge: {
      type: Number,
      default: null,
    },
    idealAge: {
      type: Number,
      default: null,
      validate: {
        validator: function (this: any, value: number) {
          // Skip validation if any age field is null/undefined
          if (value == null || this.minimumAge == null || this.maximumAge == null) return true;
          return value >= this.minimumAge && value <= this.maximumAge;
        },
        message: "Ideal age must be between minimum age and maximum age",
      },
    },
    maximumAge: {
      type: Number,
      default: null,
    },
    type: {
      type: String,
    },
    sku: {
      type: String,
    },
    tags: {
      type: [String],
      default: [],
    },
    videoUrl: {
      type: String,
    },
    code: {
      type: String,
      required: [true, "Please enter a code"],
    },
    price: {
      type: Number,
      required: [true, "Please enter a price"],
      validate: {
        validator: (v: number) => v > 0,
        message: "Price must be greater than 0",
      },
    },
    discount_price: {
      type: Number,
      required: [true, "Please enter a discount price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter a stock"],
      min: [0, "Stock cannot be negative"],
    },
    estimated_delivery_time: {
      type: String,
      required: [true, "Please enter a estimated delivery time"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "draft"],
      default: "draft",
      required: [true, "Please enter a status"],
    },
    isPersonalized: { type: Boolean, default: false },
    isGift: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isTopRated: { type: Boolean, default: false },
    isUpsell: { type: Boolean, default: false },
    isOnSale: { type: Boolean, default: false },
    rating: { type: Number, default: null },
    reviewCount: { type: Number, default: 0 },
    order: {
      type: Number,
      default: 0,
      min: 0,
      max: 100000,
      match: /^[0-9]+$/,
    },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  },
);

// Primary query indexes
productSchema.index({ slug: 1, status: 1, deletedAt: 1 });
productSchema.index({ deletedAt: 1, status: 1, order: -1, createdAt: -1 });

// Category hierarchy indexes
productSchema.index({ category: 1, status: 1, deletedAt: 1, order: -1, createdAt: -1 });
productSchema.index({ subCategory: 1, status: 1, deletedAt: 1, order: -1, createdAt: -1 });
productSchema.index({ subSubCategory: 1, status: 1, deletedAt: 1, order: -1, createdAt: -1 });

// Filter indexes
productSchema.index({ colors: 1, status: 1, deletedAt: 1 });
productSchema.index({ material: 1, status: 1, deletedAt: 1 });

// Feature flag indexes
productSchema.index({ deletedAt: 1, status: 1, isNewArrival: 1, order: -1, createdAt: -1 });
productSchema.index({ deletedAt: 1, status: 1, isBestSeller: 1, order: -1, createdAt: -1 });
productSchema.index({ deletedAt: 1, status: 1, isFeatured: 1, order: -1, createdAt: -1 });
productSchema.index({ deletedAt: 1, status: 1, isUpsell: 1, order: -1, createdAt: -1 });
productSchema.index({ deletedAt: 1, status: 1, isOnSale: 1, order: -1, createdAt: -1 });

// Price filter index
productSchema.index({ deletedAt: 1, status: 1, discount_price: 1, order: -1, createdAt: -1 });

// Common indexes
productSchema.index({ name: 1 });
productSchema.index({ code: 1 });
productSchema.index({ order: -1, createdAt: -1 });

export type IProduct = InferSchemaType<typeof productSchema>;

const productModel: Model<IProduct> = mongoose.model<IProduct>(
  "products",
  productSchema,
);

export default productModel;