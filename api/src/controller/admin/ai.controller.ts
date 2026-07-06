import type { Request, Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env.js";
import { logger } from "../../lib/logger.js";
import AiResponse from "../../models/aiResponse.js";
/// <reference path="../../types/express.d.ts" />

/**
 * POST /api/admin/ai/generate-description
 * Body: { name, category, material, purity, price, page? }
 * Returns: { _status: true, _data: { text: "..." } }
 *
 * Saves every generated response to the aiResponse collection for history.
 * ponytail: no streaming, no SSE, no cache — single fetch + return + save.
 */
export const generateProductDescription = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { name, category, material, purity, price, page } = req.body as {
      name?: string;
      category?: string;
      material?: string;
      purity?: string;
      price?: string;
      page?: string;
    };

    if (!name) {
      return res.status(400).json({
        _status: false,
        _message: "Product name is required",
      });
    }

    if (!env.GEMINI_API_KEY) {
      return res.status(503).json({
        _status: false,
        _message: "AI is not configured on the server",
      });
    }

    const prompt = `You are a senior e-commerce copywriter for a jewellery store. Write a 3-paragraph product description (120-180 words total) for:

Product name: ${name}
Category: ${category || "N/A"}
Material: ${material || "N/A"}
Purity: ${purity || "N/A"}
Price: ₹${price || "N/A"}

Write in plain language. No emojis. No bullet points. Focus on: (1) occasion and wearer, (2) design details, (3) care and styling.`;

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: env.GEMINI_MODEL || "gemini-2.0-flash",
    });

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Save to history — non-blocking, don't fail if save errors
    try {
      await AiResponse.create({
        prompt,
        response: text,
        page: page || "product-description",
        adminId: req.user?._id,
      });
    } catch (saveErr) {
      logger.error({ err: saveErr }, "Failed to save AI response to history");
    }

    return res.status(200).json({
      _status: true,
      _message: "Description generated",
      _data: { text },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to generate description. Please try again.";
    logger.error({ err }, "Error generating product description");
    return res.status(500).json({
      _status: false,
      _message: message,
    });
  }
};
