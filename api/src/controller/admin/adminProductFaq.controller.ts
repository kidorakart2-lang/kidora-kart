import type { Request, Response } from "express";
import type { FilterQuery } from "mongoose";
import productFaq from "../../models/productFaq.js";
import cache from "../../lib/cache.js";
import { success, fail } from "../../utils/responses.js";

const invalidateCache = () => {
  cache.del("productFaqs");
};

export const create = async (req: Request, res: Response): Promise<void> => {
  try {
    const doc = await productFaq.create(req.body);
    invalidateCache();
    success(res, doc, "Product FAQ created", 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Failed to create", 500);
  }
};

export const view = async (req: Request, res: Response): Promise<void> => {
  try {
    const andCondition: Record<string, unknown>[] = [{ deletedAt: null }];
    const orCondition: Record<string, unknown>[] = [];
    const filter: Record<string, unknown> = {};
    if (andCondition.length > 0) filter.$and = andCondition;

    const pageValue = req.body.page ?? 1;
    const limitValue = Math.min(req.body.limit ?? 10, 100);
    const skipValue = (pageValue - 1) * limitValue;

    if (req.body.question) {
      orCondition.push({ question: new RegExp(req.body.question, "i") });
    }
    if (req.body.status !== undefined) {
      andCondition.push({ status: req.body.status });
    }
    if (req.body.product) {
      andCondition.push({ product: req.body.product });
    }
    if (req.body.category) {
      andCondition.push({ category: req.body.category });
    }
    if (orCondition.length > 0) filter.$or = orCondition;

    const totalRecords = await productFaq
      .find(filter as FilterQuery<typeof productFaq>)
      .countDocuments();
    const data = await productFaq
      .find(filter as FilterQuery<typeof productFaq>)
      .sort({ order: "asc", _id: "desc" })
      .limit(limitValue)
      .skip(skipValue)
      .populate("product", "name slug")
      .populate("category", "name slug");

    res.json({
      _status: data.length > 0,
      _message: data.length > 0 ? "FAQs Found" : "No FAQs Found",
      _data: data,
      _total_pages: Math.ceil(totalRecords / limitValue),
      _total_records: totalRecords,
      _current_page: Number(pageValue),
    });
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Server error", 500);
  }
};

export const details = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productFaq
      .findById(req.body.id)
      .populate("product", "name slug")
      .populate("category", "name slug");
    success(res, result, result ? "FAQ Found" : "No FAQ Found");
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Server error", 500);
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productFaq.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true },
    );
    invalidateCache();
    success(res, result, result ? "FAQ Updated" : "FAQ Not Found");
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Failed to update", 500);
  }
};

export const destroy = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productFaq.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true },
    );
    invalidateCache();
    success(res, result, result ? "FAQ Deleted" : "FAQ Not Found");
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Failed to delete", 500);
  }
};

export const bulkCreate = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds, question, answer, order, status } = req.body as {
      productIds: string[];
      question: string;
      answer: string;
      order?: number;
      status?: boolean;
    };

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      fail(res, "At least one product is required", 400);
      return;
    }

    const docs = await productFaq.insertMany(
      productIds.map((productId) => ({
        product: productId,
        question,
        answer,
        order: order ?? 1,
        status: status ?? true,
      })),
    );

    invalidateCache();
    success(res, docs, `${docs.length} FAQs created`, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Failed to create", 500);
  }
};

export const bulkCreateFaqs = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productIds, faqs } = req.body as {
      productIds: string[];
      faqs: { question: string; answer: string; order?: number; status?: boolean }[];
    };

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      fail(res, "At least one product is required", 400);
      return;
    }

    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      fail(res, "At least one FAQ entry is required", 400);
      return;
    }

    // Validate each FAQ entry
    for (const [i, faq] of faqs.entries()) {
      if (!faq.question?.trim() || !faq.answer?.trim()) {
        fail(res, `FAQ entry ${i + 1} has empty question or answer`, 400);
        return;
      }
    }

    // Create the cross-product: each FAQ for each product
    const docs = await productFaq.insertMany(
      productIds.flatMap((productId) =>
        faqs.map((faq) => ({
          product: productId,
          question: faq.question.trim(),
          answer: faq.answer.trim(),
          order: faq.order ?? 1,
          status: faq.status ?? true,
        })),
      ),
    );

    invalidateCache();
    success(res, docs, `${docs.length} FAQs created (${faqs.length} entries × ${productIds.length} products)`, 201);
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Failed to create FAQs", 500);
  }
};

export const changeStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await productFaq.updateMany(
      { _id: req.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    invalidateCache();
    success(res, result, "Status Changed");
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Status Not Changed", 500);
  }
};
