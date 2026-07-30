import Product from "../models/product.js";

export interface CartItemInput {
  productId: string;
  colorId: string;
  quantity: number;
}

export interface ValidatedItem {
  productId: string;
  colorId: string;
  name: string;
  description: string;
  image: string;
  images: string[];
  sku: string;
  quantity: number;
  isPersonalized: boolean;
  priceAtPurchase: number;
  subtotal: number;
}

export interface ItemError {
  productId: string;
  type: "deleted" | "inactive" | "invalid_color" | "insufficient_stock";
  message: string;
  quantity: number;
  availableStock?: number;
}

export class CartValidationError extends Error {
  public readonly items: ItemError[];
  public readonly validItems: ValidatedItem[];
  public readonly recoverable: boolean;

  constructor(items: ItemError[], validItems: ValidatedItem[]) {
    const isRecoverable = items.every((i) => i.type === "insufficient_stock");
    super(
      isRecoverable
        ? "Some items have limited stock"
        : "Some items in your cart are no longer available",
    );
    this.name = "CartValidationError";
    this.items = items;
    this.validItems = validItems;
    this.recoverable = isRecoverable;
  }
}

export async function validateAndPriceCart(
  items: CartItemInput[],
): Promise<ValidatedItem[]> {
  if (items.length === 0) {
    throw new CartValidationError(
      [{ productId: "", type: "deleted" as const, message: "Cart is empty", quantity: 0 }],
      [],
    );
  }

  const productIds = items.map((i) => i.productId);

  const products = await Product.find({
    _id: { $in: productIds },
  })
    .select(
      "name description image images code stock status isPersonalized price discount_price colors deletedAt",
    )
    .lean();

  const productMap = new Map(
    products.map((p) => [String(p._id), p]),
  );

  const errors: ItemError[] = [];
  const validItems: ValidatedItem[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);

    if (!product) {
      errors.push({
        productId: item.productId,
        type: "deleted",
        message: "Product not found or has been removed",
        quantity: item.quantity,
      });
      continue;
    }

    if (product.deletedAt) {
      errors.push({
        productId: item.productId,
        type: "deleted",
        message: `"${product.name}" is no longer available`,
        quantity: item.quantity,
      });
      continue;
    }

    if (product.status !== "active") {
      errors.push({
        productId: item.productId,
        type: "inactive",
        message: `"${product.name}" is currently unavailable`,
        quantity: item.quantity,
      });
      continue;
    }

    const colorIdStr = item.colorId;

    // Edge case: if colorId is null/undefined/"null" string, treat as invalid
    if (!colorIdStr || colorIdStr === "null" || colorIdStr === "undefined") {
      errors.push({
        productId: item.productId,
        type: "invalid_color",
        message: `A valid color selection is required for "${product.name}"`,
        quantity: item.quantity,
      });
      continue;
    }

    // Safely check colors array — it could be empty or undefined with .lean()
    const productColors = product.colors ?? [];
    if (productColors.length === 0) {
      errors.push({
        productId: item.productId,
        type: "invalid_color",
        message: `"${product.name}" has no colors configured. Please contact support.`,
        quantity: item.quantity,
      });
      continue;
    }

    const isValidColor = productColors.some(
      (c) => String(c).trim() === colorIdStr.trim(),
    );
    if (!isValidColor) {
      errors.push({
        productId: item.productId,
        type: "invalid_color",
        message: `Selected color is not available for "${product.name}". Please remove it from your cart and select a different color.`,
        quantity: item.quantity,
      });
      continue;
    }

    if (product.stock < item.quantity) {
      errors.push({
        productId: item.productId,
        type: "insufficient_stock",
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${item.quantity}`,
        quantity: item.quantity,
        availableStock: product.stock,
      });
      continue;
    }

    const priceAtPurchase = product.discount_price || product.price;
    const subtotal = priceAtPurchase * item.quantity;

    validItems.push({
      productId: String(product._id),
      colorId: item.colorId,
      name: product.name,
      description: product.description ?? "",
      image: product.image,
      images: product.images ?? [],
      sku: product.code,
      quantity: item.quantity,
      isPersonalized: product.isPersonalized ?? false,
      priceAtPurchase,
      subtotal,
    });
  }

  if (errors.length > 0) {
    throw new CartValidationError(errors, validItems);
  }

  return validItems;
}
