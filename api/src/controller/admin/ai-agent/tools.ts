import { z } from "zod";
import FaqModel from "../../../models/faq.js";
import MaterialModel from "../../../models/material.js";
import ColorModel from "../../../models/color.js";
import ProductModel from "../../../models/product.js";
import CategoryModel from "../../../models/category.js";
import SubCategoryModel from "../../../models/subCategory.js";
import SubSubCategoryModel from "../../../models/subSubCategory.js";
import BannerModel from "../../../models/banner.js";
import TestimonialModel from "../../../models/testimonial.js";
import WhyChooseUsModel from "../../../models/whyChooseUs.js";
import CoupenModel from "../../../models/coupen.js";
import cache from "../../../lib/cache.js";
import { logger } from "../../../lib/logger.js";
import { isDuplicateError, escapeRegex, generateSlug } from "./helpers.js";
import {
  faqSchema,
  materialSchema,
  colorSchema,
  colorNameToHex,
  productDraftSchema,
  searchProductSchema,
  searchFaqSchema,
  createCategorySchema,
  createSubCategorySchema,
  createSubSubCategorySchema,
  updateProductSchema,
  createBannerSchema,
  createTestimonialSchema,
  createWhyChooseUsSchema,
  searchWhyChooseUsSchema,
  createCouponSchema,
  searchWebSchema,
  fetchUrlSchema,
} from "./schemas.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const agentTools: Record<string, any> = {
  // ── Search / Lookup tools (read-only) ───────────────────────────

  searchProducts: {
    description: "Search products by name or description. Returns matching products with key details.",
    parameters: searchProductSchema,
    execute: async (args: { query: string; limit?: number }) => {
      const products = await ProductModel.find({
        deletedAt: null,
        $or: [
          { name: { $regex: escapeRegex(args.query), $options: "i" } },
          { description: { $regex: escapeRegex(args.query), $options: "i" } },
          { tags: { $regex: escapeRegex(args.query), $options: "i" } },
        ],
      })
        .select("name slug price discount_price stock status category")
        .populate("category", "name")
        .limit(args.limit ?? 10)
        .lean();
      return { found: products.length > 0, results: products };
    },
  },

  searchFaqs: {
    description: "Search FAQs by keyword in question or answer.",
    parameters: searchFaqSchema,
    execute: async (args: { query: string; limit?: number }) => {
      const faqs = await FaqModel.find({
        deletedAt: null,
        $or: [
          { question: { $regex: escapeRegex(args.query), $options: "i" } },
          { answer: { $regex: escapeRegex(args.query), $options: "i" } },
        ],
      })
        .select("question answer status order")
        .limit(args.limit ?? 10)
        .lean();
      return { found: faqs.length > 0, results: faqs };
    },
  },

  lookupMaterials: {
    description: "List or search materials by name. Returns material IDs.",
    parameters: z.object({ query: z.string().optional().default("") }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      const materials = await MaterialModel.find(filter)
        .select("_id name order")
        .sort({ order: 1 }).limit(20).lean();
      return { count: materials.length, results: materials };
    },
  },

  lookupColors: {
    description: "List or search colors by name. Returns color IDs.",
    parameters: z.object({ query: z.string().optional().default("") }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      const colors = await ColorModel.find(filter)
        .select("_id name code order")
        .sort({ order: 1 }).limit(20).lean();
      return { count: colors.length, results: colors };
    },
  },

  lookupCategories: {
    description: "List or search categories by name. Returns category IDs needed to create products.",
    parameters: z.object({ query: z.string().optional().default("") }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      const categories = await CategoryModel.find(filter)
        .select("_id name slug order")
        .sort({ order: 1 }).limit(20).lean();
      return { count: categories.length, results: categories };
    },
  },

  lookupSubCategories: {
    description: "List or search sub-categories by name. Returns sub-category IDs with their parent category reference.",
    parameters: z.object({ query: z.string().optional().default("") }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      const subCategories = await SubCategoryModel.find(filter)
        .select("_id name slug category order")
        .populate("category", "name")
        .sort({ order: 1 }).limit(20).lean();
      return { count: subCategories.length, results: subCategories };
    },
  },

  lookupSubSubCategories: {
    description: "List or search sub-sub-categories by name. Returns sub-sub-category IDs with their parent sub-category reference.",
    parameters: z.object({ query: z.string().optional().default("") }),
    execute: async (args: { query?: string }) => {
      const filter: Record<string, unknown> = { deletedAt: null };
      if (args.query) filter.name = { $regex: escapeRegex(args.query), $options: "i" };
      const subSubCategories = await SubSubCategoryModel.find(filter)
        .select("_id name slug subCategory order")
        .populate("subCategory", "name")
        .sort({ order: 1 }).limit(20).lean();
      return { count: subSubCategories.length, results: subSubCategories };
    },
  },

  lookupWhyChooseUs: {
    description: "Search existing 'Why Choose Us' entries by title or description.",
    parameters: searchWhyChooseUsSchema,
    execute: async (args: { query: string; limit?: number }) => {
      const entries = await WhyChooseUsModel.find({
        deletedAt: null,
        $or: [
          { title: { $regex: escapeRegex(args.query), $options: "i" } },
          { description: { $regex: escapeRegex(args.query), $options: "i" } },
        ],
      })
        .select("title description status")
        .limit(args.limit ?? 10).lean();
      return { count: entries.length, results: entries };
    },
  },

  // ── Create tools (execute directly, status defaults to inactive) ─

  createFaq: {
    description: "Create a new FAQ entry. Status defaults to inactive.",
    parameters: faqSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = faqSchema.parse(args);
      const doc = new FaqModel(parsed);
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `FAQ "${parsed.question}" already exists` };
        throw saveErr;
      }
      cache.del("faqData");
      return { created: true, toolName: "createFaq", id: result._id, name: parsed.question };
    },
  },

  createMaterial: {
    description: "Create a new material option. Status defaults to inactive.",
    parameters: materialSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = materialSchema.parse(args);
      const doc = new MaterialModel(parsed);
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `Material "${parsed.name}" already exists` };
        throw saveErr;
      }
      cache.del("materialData");
      return { created: true, toolName: "createMaterial", id: result._id, name: parsed.name };
    },
  },

  createColor: {
    description: "Create a new color option. Auto-generates hex code from color name if not provided. Status defaults to inactive.",
    parameters: colorSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = colorSchema.parse(args);
      const doc = new ColorModel({
        name: parsed.name, code: parsed.code || colorNameToHex(parsed.name),
        order: parsed.order, status: parsed.status,
      });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `Color "${parsed.name}" already exists` };
        throw saveErr;
      }
      cache.del("colorData");
      return { created: true, toolName: "createColor", id: result._id, name: parsed.name, code: doc.code };
    },
  },

  createProductDraft: {
    description: "Create a new product in INACTIVE status. Requires name, description, price, category IDs, and color IDs.",
    parameters: productDraftSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = productDraftSchema.parse(args);
      if (parsed.discount_price !== undefined && parsed.discount_price > parsed.price)
        return { error: "Discount price must be less than or equal to the original price" };
      if (parsed.minimumAge !== undefined && parsed.maximumAge !== undefined && parsed.minimumAge >= parsed.maximumAge)
        return { error: "Minimum age must be less than maximum age" };
      if (parsed.idealAge !== undefined && parsed.minimumAge !== undefined && parsed.maximumAge !== undefined &&
        (parsed.idealAge < parsed.minimumAge || parsed.idealAge > parsed.maximumAge))
        return { error: "Ideal age must be between minimum age and maximum age" };

      for (const catId of parsed.category) {
        if (!await CategoryModel.findById(catId).select("_id").lean())
          return { error: `Category with ID "${catId}" not found` };
      }
      for (const subCatId of parsed.subCategory) {
        if (!await SubCategoryModel.findById(subCatId).select("_id").lean())
          return { error: `SubCategory with ID "${subCatId}" not found` };
      }
      for (const colorId of parsed.colors) {
        if (!await ColorModel.findById(colorId).select("_id").lean())
          return { error: `Color with ID "${colorId}" not found` };
      }
      for (const sscId of parsed.subSubCategory) {
        if (!await SubSubCategoryModel.findById(sscId).select("_id").lean())
          return { error: `SubSubCategory with ID "${sscId}" not found` };
      }
      for (const matId of parsed.material) {
        if (!await MaterialModel.findById(matId).select("_id").lean())
          return { error: `Material with ID "${matId}" not found` };
      }

      const productData: Record<string, unknown> = {
        ...parsed, status: "inactive",
        code: parsed.code || `DRAFT-${Date.now()}`,
        weight: parsed.weight || "0",
        estimated_delivery_time: parsed.estimated_delivery_time || "3-5 business days",
        slug: await generateSlug(parsed.name),
        image: "https://placehold.co/400x400?text=Draft+Product", images: [],
      };
      const doc = new ProductModel(productData);
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `Product "${parsed.name}" already exists (duplicate slug or name)` };
        throw saveErr;
      }
      cache.del("newArrivals"); cache.del("trendingProducts"); cache.del("bestSellers");
      return { created: true, toolName: "createProductDraft", id: result._id, name: parsed.name, status: "inactive" };
    },
  },

  createCategory: {
    description: "Create a new product category. Status defaults to inactive.",
    parameters: createCategorySchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createCategorySchema.parse(args);
      const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = new CategoryModel({ name: parsed.name, slug, description: parsed.description || "", order: parsed.order, status: parsed.status });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `Category "${parsed.name}" already exists` };
        throw saveErr;
      }
      return { created: true, toolName: "createCategory", id: result._id, name: parsed.name, status: "inactive" };
    },
  },

  createSubCategory: {
    description: "Create a new sub-category under a parent category.",
    parameters: createSubCategorySchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createSubCategorySchema.parse(args);
      for (const catId of parsed.category) {
        if (!await CategoryModel.findById(catId).select("_id").lean())
          return { error: `Category with ID "${catId}" not found` };
      }
      const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = new SubCategoryModel({ name: parsed.name, slug, category: parsed.category, description: parsed.description || "", order: parsed.order, status: parsed.status, image: "https://placehold.co/400x400?text=SubCategory" });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `SubCategory "${parsed.name}" already exists` };
        throw saveErr;
      }
      return { created: true, toolName: "createSubCategory", id: result._id, name: parsed.name };
    },
  },

  createSubSubCategory: {
    description: "Create a new sub-sub-category under a parent sub-category.",
    parameters: createSubSubCategorySchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createSubSubCategorySchema.parse(args);
      for (const subCatId of parsed.subCategory) {
        if (!await SubCategoryModel.findById(subCatId).select("_id").lean())
          return { error: `SubCategory with ID "${subCatId}" not found` };
      }
      const slug = parsed.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const doc = new SubSubCategoryModel({ name: parsed.name, slug, subCategory: parsed.subCategory, description: parsed.description || "", order: parsed.order, status: parsed.status, image: "https://placehold.co/400x400?text=SubSubCategory" });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `SubSubCategory "${parsed.name}" already exists` };
        throw saveErr;
      }
      return { created: true, toolName: "createSubSubCategory", id: result._id, name: parsed.name };
    },
  },

  updateProduct: {
    description: "Update an existing product's fields (status, price, stock, flags). Executes immediately.",
    parameters: updateProductSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = updateProductSchema.parse(args);
      const existing = await ProductModel.findById(parsed.productId);
      if (!existing) return { error: `Product with ID "${parsed.productId}" not found` };
      const updateFields: Record<string, unknown> = {};
      if (parsed.status !== undefined) updateFields.status = parsed.status;
      if (parsed.price !== undefined) updateFields.price = parsed.price;
      if (parsed.discount_price !== undefined) updateFields.discount_price = parsed.discount_price;
      if (parsed.stock !== undefined) updateFields.stock = parsed.stock;
      if (parsed.isFeatured !== undefined) updateFields.isFeatured = parsed.isFeatured;
      if (parsed.isNewArrival !== undefined) updateFields.isNewArrival = parsed.isNewArrival;
      if (parsed.isBestSeller !== undefined) updateFields.isBestSeller = parsed.isBestSeller;
      if (parsed.isOnSale !== undefined) updateFields.isOnSale = parsed.isOnSale;
      if (parsed.isGift !== undefined) updateFields.isGift = parsed.isGift;
      if (parsed.isPersonalized !== undefined) updateFields.isPersonalized = parsed.isPersonalized;
      const updated = await ProductModel.findByIdAndUpdate(parsed.productId, { $set: updateFields }, { new: true, runValidators: true });
      if (!updated) return { error: "Failed to update product" };
      cache.del("newArrivals"); cache.del("trendingProducts"); cache.del("bestSellers");
      return { updated: true, toolName: "updateProduct", id: updated._id, name: updated.name, changes: updateFields };
    },
  },

  createBanner: {
    description: "Create a new banner. Status defaults to inactive.",
    parameters: createBannerSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createBannerSchema.parse(args);
      const doc = new BannerModel({ image: "https://placehold.co/1200x400?text=Banner", description: parsed.description, order: parsed.order, status: parsed.status });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: "Banner with this description already exists" };
        throw saveErr;
      }
      cache.del("bannerData");
      return { created: true, toolName: "createBanner", id: result._id, description: parsed.description.slice(0, 60) };
    },
  },

  createTestimonial: {
    description: "Create a new testimonial. Status defaults to inactive.",
    parameters: createTestimonialSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createTestimonialSchema.parse(args);
      const doc = new TestimonialModel({ title: parsed.title, description: parsed.description, rating: parsed.rating, address: parsed.address, image: parsed.image || "https://placehold.co/100x100?text=Testimonial", status: parsed.status });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: "Testimonial with this title already exists" };
        throw saveErr;
      }
      cache.del("testimonialData");
      return { created: true, toolName: "createTestimonial", id: result._id, title: parsed.title };
    },
  },

  createWhyChooseUs: {
    description: "Create a new 'Why Choose Us' entry. Status defaults to inactive.",
    parameters: createWhyChooseUsSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createWhyChooseUsSchema.parse(args);
      const doc = new WhyChooseUsModel({ title: parsed.title, description: parsed.description, image: parsed.image || "https://placehold.co/100x100?text=WhyChooseUs", status: parsed.status });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `Why Choose Us "${parsed.title}" already exists` };
        throw saveErr;
      }
      cache.del("whyChooseUsData");
      return { created: true, toolName: "createWhyChooseUs", id: result._id, title: parsed.title };
    },
  },

  createCoupon: {
    description: "Create a new discount coupon. Status defaults to inactive.",
    parameters: createCouponSchema,
    execute: async (args: Record<string, unknown>) => {
      const parsed = createCouponSchema.parse(args);
      const doc = new CoupenModel({ name: parsed.name, code: parsed.code.toUpperCase(), discountPercentage: parsed.discountPercentage, minAmount: parsed.minAmount, maxAmount: parsed.maxAmount, description: parsed.description || "", expiryDate: parsed.expiryDate ? new Date(parsed.expiryDate) : null, status: parsed.status, type: parsed.type });
      let result;
      try { result = await doc.save(); } catch (saveErr) {
        if (isDuplicateError(saveErr)) return { error: `Coupon code "${parsed.code.toUpperCase()}" already exists` };
        throw saveErr;
      }
      cache.del("coupenData");
      return { created: true, toolName: "createCoupon", id: result._id, name: parsed.name, code: parsed.code.toUpperCase() };
    },
  },

  // ── General utility tools ──────────────────────────────────────

  searchWeb: {
    description: "Search the web for information using Wikipedia. Works without any API keys.",
    parameters: searchWebSchema,
    execute: async (args: { query: string }) => {
      try {
        const searchUrl = `https://en.wikipedia.org/api/rest_v1/search/page?q=${encodeURIComponent(args.query)}&limit=5`;
        const searchResp = await fetch(searchUrl);
        if (!searchResp.ok) return { error: `Search failed with status ${searchResp.status}` };
        const searchData = (await searchResp.json()) as { pages?: Array<{ id: number; title: string; description?: string; extract?: string }> };
        if (!searchData.pages || searchData.pages.length === 0) return { results: [], note: "No Wikipedia results found." };
        interface WikiResult { title: string; description: string; snippet: string; url: string }
        const settled = await Promise.allSettled(
          searchData.pages.slice(0, 5).map(async (page): Promise<WikiResult> => {
            const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(page.title)}`;
            const summaryResp = await fetch(summaryUrl);
            if (summaryResp.ok) {
              const summary = (await summaryResp.json()) as { extract?: string; content_urls?: { desktop?: { page?: string } } };
              return { title: page.title, description: page.description || "", snippet: (summary.extract || "").slice(0, 1000), url: summary.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}` };
            }
            return { title: page.title, description: page.description || "", snippet: (page.extract || "").slice(0, 500), url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}` };
          }),
        );
        const wikiResults: WikiResult[] = [];
        for (const r of settled) { if (r.status === "fulfilled") wikiResults.push(r.value); }
        return { results: wikiResults, source: "Wikipedia" };
      } catch (err) {
        logger.error({ err }, "Web search failed");
        return { error: err instanceof Error ? err.message : "Search request failed" };
      }
    },
  },

  fetchUrl: {
    description: "Fetch and read content from a URL (public http/https only). Returns plain text with links.",
    parameters: fetchUrlSchema,
    execute: async (args: { url: string; maxChars?: number }) => {
      try {
        let parsedUrl: URL;
        try { parsedUrl = new URL(args.url); } catch { return { error: "Invalid URL format" }; }
        if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:")
          return { error: "Only http and https URLs are allowed" };
        const hostname = parsedUrl.hostname.toLowerCase();
        const blockedPatterns = [/^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])/, /^192\.168\./, /^0\./, /^169\.254\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])/, /^::1$/, /^localhost$/i, /\.local$/i, /\.internal$/i, /^fc00:/i, /^fd00:/i, /^fe80:/i];
        if (blockedPatterns.some((p) => p.test(hostname)))
          return { error: "URL points to a private or internal network, which is not allowed" };
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const resp = await fetch(args.url, { signal: controller.signal, headers: { "User-Agent": "KidoraKart-Admin/1.0 (AI agent; internal use)", Accept: "text/html,text/plain,*/*" } });
        clearTimeout(timeout);
        if (!resp.ok) return { error: `Failed to fetch URL: ${resp.status} ${resp.statusText}` };
        const text = await resp.text();
        const maxLen = args.maxChars ?? 5000;
        const plainText = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").replace(/&[a-z]+;/g, " ").trim().slice(0, maxLen);
        return { url: args.url, content: plainText, truncated: text.length > maxLen, characters: plainText.length };
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return { error: "Request timed out after 10 seconds" };
        logger.error({ err }, "fetchUrl failed");
        return { error: err instanceof Error ? err.message : "Failed to fetch URL" };
      }
    },
  },

  getCurrentTime: {
    description: "Get the current date and time.",
    parameters: z.object({}),
    execute: async () => {
      const now = new Date();
      return { date: now.toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }), time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }), iso: now.toISOString(), timestamp: now.getTime() };
    },
  },
};
