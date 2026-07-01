import type { Request, Response } from "express";
import productFaq from "../../models/productFaq.js";
import { success, fail } from "../../utils/responses.js";

export const productFaqController = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const productId = req.query.product as string | undefined;

    const query: Record<string, unknown> = { deletedAt: null, status: true };
    if (productId) {
      // Query by products array containing the product ID
      query.products = productId;
    }

    const data = await productFaq.find(query).sort({ createdAt: -1 }).lean();
    return success(res, data, "Product FAQs fetched successfully");
  } catch (error) {
    return fail(res, "Server error", 500);
  }
};
