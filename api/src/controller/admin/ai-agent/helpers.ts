import ProductModel from "../../../models/product.js";

/**
 * Check if an error is a MongoDB duplicate-key error (code 11000).
 */
export function isDuplicateError(err: unknown): boolean {
  return (err as { code?: number })?.code === 11000;
}

/**
 * Escape special regex characters in a string.
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Generate a unique slug from text by appending a counter if needed.
 */
export async function generateSlug(text: string): Promise<string> {
  const base = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  const count = await ProductModel.countDocuments({
    slug: new RegExp(`^${escapeRegex(base)}`),
  });
  return count === 0 ? base : `${base}-${count}`;
}
