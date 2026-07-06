import type { Request, Response } from "express";
import Product from "../../models/product.js";
import Category from "../../models/category.js";
import SubCategory from "../../models/subCategory.js";
import SubSubCategory from "../../models/subSubCategory.js";
import Material from "../../models/material.js";
import cache from "../../lib/cache.js";
import { success, fail } from "../../utils/responses.js";
import { logger } from "../../lib/logger.js";

const PRODUCT_SELECT =
  "name slug images price image stock discount_price colors material sizes category subCategory subSubCategory";

const POPULATE_CATEGORY = {
  path: "category",
  select: "name slug",
  match: { deletedAt: null, status: true },
} as const;

const POPULATE_SUBCATEGORY = {
  path: "subCategory",
  select: "name slug",
  match: { deletedAt: null, status: true },
} as const;

const POPULATE_SUBSUBCATEGORY = {
  path: "subSubCategory",
  select: "name slug",
  match: { deletedAt: null, status: true },
} as const;

const POPULATE_COLORS = {
  path: "colors",
  select: "name code",
  match: { deletedAt: null, status: true },
  options: { sort: { order: -1 } },
} as const;

const POPULATE_MATERIAL = {
  path: "material",
  select: "name",
  match: { deletedAt: null, status: true },
  options: { sort: { order: -1 } },
} as const;

const POPULATE_SIZES = {
  path: "sizes",
  select: "name",
  match: { deletedAt: null, status: true },
  options: { sort: { order: -1 } },
} as const;

const POPULATE_CATEGORY_GIFT = {
  path: "category",
  match: {
    name: { $regex: "gift items", $options: "i" },
    deletedAt: null,
    status: true,
  },
  select: "name slug",
} as const;

const POPULATE_SUBCATEGORY_GIFT = {
  path: "subCategory",
  match: {
    name: { $regex: "gift items", $options: "i" },
    deletedAt: null,
    status: true,
  },
  select: "name slug",
} as const;

const PRODUCT_POPULATE = [
  POPULATE_CATEGORY,
  POPULATE_SUBCATEGORY,
  POPULATE_SUBSUBCATEGORY,
  POPULATE_COLORS,
  POPULATE_MATERIAL,
  POPULATE_SIZES,
];

export const getOne = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({
      slug,
      status: true,
      deletedAt: null,
    })
      .select("-__v -deletedAt")
      .populate(PRODUCT_POPULATE)
      .lean();

    if (!product) throw new Error("Product not found");

    return success(res, product, "Product fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
    );
  }
};

export const getByCategory = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { categorySlug, subCategorySlug, subSubCategorySlug } = req.params;
    const {
      page = "1",
      limit = "20",
      sort = { order: -1, createdAt: -1 },
    } = req.query as {
      page?: string;
      limit?: string;
      sort?: Record<string, 1 | -1>;
    };

    const cappedLimit = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * cappedLimit;

    const [category, subCategory, subSubCategory] = await Promise.all([
      categorySlug
        ? Category.findOne({ slug: categorySlug }).select("_id").lean()
        : Promise.resolve(null),
      subCategorySlug
        ? SubCategory.findOne({ slug: subCategorySlug }).select("_id").lean()
        : Promise.resolve(null),
      subSubCategorySlug
        ? SubSubCategory.findOne({ slug: subSubCategorySlug }).select("_id").lean()
        : Promise.resolve(null),
    ]);

    const filters: Record<string, unknown>[] = [];
    if (category) filters.push({ category: { $in: [category._id] } });
    if (subCategory)
      filters.push({ subCategory: { $in: [subCategory._id] } });
    if (subSubCategory)
      filters.push({ subSubCategory: { $in: [subSubCategory._id] } });

    if (filters.length === 0) {
      return success(res, [], "No Products Found", 200, {
        _pagination: { total: 0, page: 1, limit: 0, totalPages: 0 },
      });
    }

    const query = { $or: filters, deletedAt: null, status: true };

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate(POPULATE_CATEGORY)
        .populate(POPULATE_SUBCATEGORY)
        .populate(POPULATE_SUBSUBCATEGORY)
        .select(PRODUCT_SELECT)
        .sort(sort)
        .limit(cappedLimit)
        .skip(skip)
        .lean(),
      Product.countDocuments(query),
    ]);

    return success(res, products, "Products fetched successfully", 200, {
      _pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const getProductByFilter = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const q = req.query;

    const isFeatured = q.isFeatured === "true" ? true : undefined;
    const isNewArrival = q.isNewArrival === "true" ? true : undefined;
    const isBestSeller = q.isBestSeller === "true" ? true : undefined;
    const isTopRated = q.isTopRated === "true" ? true : undefined;
    const isUpsell = q.isUpsell === "true" ? true : undefined;
    const isOnSale = q.isOnSale === "true" ? true : undefined;

    const colorIds = typeof q.colorIds === "string" ? q.colorIds.split(",").filter(Boolean) : undefined;
    const materialIds = typeof q.materialIds === "string" ? q.materialIds.split(",").filter(Boolean) : undefined;

    const categorySlug = q.categorySlug as string | undefined;
    const subCategorySlug = q.subCategorySlug as string | undefined;
    const subSubCategorySlug = q.subSubCategorySlug as string | undefined;

    const priceFrom = q.priceFrom ? Number(q.priceFrom) : undefined;
    const priceTo = q.priceTo ? Number(q.priceTo) : undefined;
    const searchQuery = q.searchQuery as string | undefined;
    const limit = q.limit ? Number(q.limit) : 20;
    const page = q.page ? Number(q.page) : 1;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, unknown> = { deletedAt: null, status: true };

    if (searchQuery && searchQuery.trim() !== "") {
      const trimmedSearch = searchQuery.trim();

      const genderKeywords = {
        men: ["men", "man", "mans", "mens"],
        women: ["women", "woman", "womans", "womens"],
      };
      const stopWords = new Set([
        "for", "the", "a", "an", "and", "or", "of", "to", "in", "on", "with",
        "him", "her", "is", "it", "by", "men", "women", "man", "mans", "mens",
        "womans", "womens", "woman",
      ]);
      const allSearchWords = trimmedSearch.split(/\s+/);

      let genderSubCategoryIds: string[] = [];
      for (const word of allSearchWords) {
        const lowerWord = word.toLowerCase();
        if (genderKeywords.men.includes(lowerWord)) {
          const cacheKey = "subCategory_men";
          if (cache.has(cacheKey)) {
            const cachedIds = cache.get<string[]>(cacheKey);
            if (cachedIds) genderSubCategoryIds.push(...cachedIds);
          } else {
            const menSubCategories = await SubCategory.find({
              name: { $regex: "\\bmens\\b", $options: "i" },
              status: true,
              deletedAt: null,
            })
              .select("_id")
              .lean();
            const ids = menSubCategories.map((sc) => String(sc._id));
            cache.set(cacheKey, ids);
            genderSubCategoryIds.push(...ids);
          }
        }
        if (genderKeywords.women.includes(lowerWord)) {
          const cacheKey = "subCategory_women";
          if (cache.has(cacheKey)) {
            const cachedIds = cache.get<string[]>(cacheKey);
            if (cachedIds) genderSubCategoryIds.push(...cachedIds);
          } else {
            const womenSubCategories = await SubCategory.find({
              name: { $regex: "\\bwomens\\b", $options: "i" },
              status: true,
              deletedAt: null,
            })
              .select("_id")
              .lean();
            const ids = womenSubCategories.map((sc) => String(sc._id));
            cache.set(cacheKey, ids);
            genderSubCategoryIds.push(...ids);
          }
        }
      }

      if (genderSubCategoryIds.length > 0) {
        query.subCategory = { $in: genderSubCategoryIds };
      }

      const searchWords = allSearchWords.filter(
        (word) => word.length > 1 && !stopWords.has(word.toLowerCase()),
      );
      const effectiveSearchWords =
        searchWords.length > 0 ? searchWords : [trimmedSearch];

      const regexPatterns = effectiveSearchWords.map((word) => ({
        $or: [
          { name: { $regex: word, $options: "i" } },
          { slug: { $regex: word, $options: "i" } },
          { description: { $regex: word, $options: "i" } },
        ],
      }));

      query.$or = regexPatterns.flatMap((p) => p.$or);
    }

    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (isNewArrival !== undefined) query.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) query.isBestSeller = isBestSeller;
    if (isTopRated !== undefined) query.isTopRated = isTopRated;
    if (isUpsell !== undefined) query.isUpsell = isUpsell;
    if (isOnSale !== undefined) query.isOnSale = isOnSale;

    if (categorySlug || subCategorySlug || subSubCategorySlug) {
      const [cats, subCats, subSubCats] = await Promise.all([
        categorySlug
          ? Category.find({
              slug: Array.isArray(categorySlug)
                ? { $in: categorySlug }
                : categorySlug,
            })
              .select("_id")
              .lean()
          : Promise.resolve([]),
        subCategorySlug
          ? SubCategory.find({
              slug: Array.isArray(subCategorySlug)
                ? { $in: subCategorySlug }
                : subCategorySlug,
            })
              .select("_id")
              .lean()
          : Promise.resolve([]),
        subSubCategorySlug
          ? SubSubCategory.find({
              slug: Array.isArray(subSubCategorySlug)
                ? { $in: subSubCategorySlug }
                : subSubCategorySlug,
            })
              .select("_id")
              .lean()
          : Promise.resolve([]),
      ]);
      if (cats.length > 0) {
        query.category = { $in: cats.map((c) => c._id) };
      }
      if (subCats.length > 0) {
        query.subCategory = { $in: subCats.map((c) => c._id) };
      }
      if (subSubCats.length > 0) {
        query.subSubCategory = { $in: subSubCats.map((c) => c._id) };
      }
    }
    if (colorIds && colorIds.length > 0) query.colors = { $in: colorIds };
    if (materialIds && materialIds.length > 0) {
      query.material = { $in: materialIds };
    }
    if (priceFrom !== undefined && priceTo !== undefined) {
      query.discount_price = {
        $gte: Number(priceFrom),
        $lte: Number(priceTo),
      };
    } else if (priceFrom !== undefined) {
      query.discount_price = { $gte: Number(priceFrom) };
    } else if (priceTo !== undefined) {
      query.discount_price = { $lte: Number(priceTo) };
    }

    const cappedLimit = Math.min(Number(limit), 100);
    const skip = Math.max(0, (Number(page) - 1) * cappedLimit);

    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .populate(PRODUCT_POPULATE)
        .select(PRODUCT_SELECT)
        .limit(cappedLimit)
        .skip(skip)
        .sort({ order: -1, createdAt: -1 })
        .lean(),
    ]);

    return success(res, products, "Products Found", 200, {
      _pagination: {
        total,
        page: Number(page),
        limit: cappedLimit,
        totalPages: Math.ceil(total / cappedLimit),
      },
    });
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const getAll = async (_req: Request, res: Response): Promise<Response> => {
  try {
    const products = await Product.find({ deletedAt: null, status: true })
      .populate(PRODUCT_POPULATE)
      .select(PRODUCT_SELECT)
      .sort({ order: -1, createdAt: -1 })
      .lean();
    return success(res, products, "Products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const relatedProducts = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const subCategoryIdsRaw = typeof req.query.subCategoryIds === "string" ? (req.query.subCategoryIds as string).split(",").filter(Boolean) : undefined;
    const subCategoryIds = subCategoryIdsRaw?.slice(0, 20);
    const subSubCategoryIdsRaw = typeof req.query.subSubCategoryIds === "string" ? (req.query.subSubCategoryIds as string).split(",").filter(Boolean) : undefined;
    const subSubCategoryIds = subSubCategoryIdsRaw?.slice(0, 20);

    let products: unknown[] = [];

    if (subSubCategoryIds && subSubCategoryIds.length > 0) {
      products = await Product.find({
        deletedAt: null,
        status: true,
        subSubCategory: { $in: subSubCategoryIds },
      })
        .limit(10)
        .populate(PRODUCT_POPULATE)
        .select(PRODUCT_SELECT)
        .sort({ order: -1, createdAt: -1 })
        .lean();
    }

    if (
      products.length < 10 &&
      subCategoryIds &&
      subCategoryIds.length > 0
    ) {
      const remainingLimit = 10 - products.length;
      const existingProductIds = (
        products as { _id: unknown }[]
      ).map((p) => p._id);

      const subCategoryProducts = await Product.find({
        subCategory: { $in: subCategoryIds },
        _id: { $nin: existingProductIds },
      })
        .limit(remainingLimit)
        .populate(PRODUCT_POPULATE)
        .select(PRODUCT_SELECT)
        .lean();

      products.push(...subCategoryProducts);
    }

    return success(res, products, "Related products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

const fetchFeaturedList = async (filter: Record<string, unknown>, limit: number) => {
  filter.deletedAt = null;
  filter.status = true;
  return Product.find(filter)
    .populate(PRODUCT_POPULATE)
    .select(PRODUCT_SELECT)
    .sort({ order: -1, createdAt: -1 })
    .limit(limit)
    .lean();
};

export const newArrivals = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (cache.has("newArrivals")) {
      return success(res, cache.get("newArrivals"), "Products fetched successfully");
    }
    const products = await fetchFeaturedList({ isNewArrival: true }, 20);
    cache.set("newArrivals", products);
    return success(res, products, "Products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const trendingProducts = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (cache.has("trendingProducts")) {
      return success(res, cache.get("trendingProducts"), "Products fetched successfully");
    }
    const products = await fetchFeaturedList({ isUpsell: true }, 20);
    cache.set("trendingProducts", products);
    return success(res, products, "Products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const bestSellers = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (cache.has("bestSellers")) {
      return success(res, cache.get("bestSellers"), "Products fetched successfully");
    }
    const products = await fetchFeaturedList({ isBestSeller: true }, 20);
    cache.set("bestSellers", products);
    return success(res, products, "Products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const featuredForFooter = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (cache.has("featuredForFooter")) {
      return success(res, cache.get("featuredForFooter"), "Products fetched successfully");
    }
    const products = await Product.find({
      isFeatured: true,
      deletedAt: null,
      status: true,
    })
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate(POPULATE_COLORS)
      .populate(POPULATE_MATERIAL)
      .select(
        "name slug images price image stock discount_price colors material category subCategory subSubCategory",
      )
      .sort({ order: -1, createdAt: -1 })
      .limit(2)
      .lean();

    cache.set("featuredForFooter", products);
    return success(res, products, "Products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const tabProducts = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    if (cache.has("tabProducts")) {
      return success(
        res,
        cache.get("tabProducts"),
        "Tab products fetched successfully",
      );
    }
    const [goldMat, silverMat] = await Promise.all([
      Material.findOne({
        name: { $regex: "gold", $options: "i" },
        status: true,
        deletedAt: null,
      }).select("_id"),
      Material.findOne({
        name: { $regex: "silver", $options: "i" },
        status: true,
        deletedAt: null,
      }).select("_id"),
    ]);

    if (!goldMat || !silverMat) {
      throw new Error("Gold or silver material not found");
    }

    const [goldProducts, silverProducts, giftProducts] = await Promise.all([
      Product.find({ deletedAt: null, status: true, material: goldMat._id })
        .populate(POPULATE_MATERIAL)
        .populate(POPULATE_CATEGORY)
        .populate(POPULATE_SUBCATEGORY)
        .populate(POPULATE_SUBSUBCATEGORY)
        .populate(POPULATE_COLORS)
        .populate(POPULATE_SIZES)
        .select(PRODUCT_SELECT)
        .sort({ order: -1, createdAt: -1 })
        .limit(4)
        .lean(),

      Product.find({ deletedAt: null, status: true, material: silverMat._id })
        .populate(POPULATE_MATERIAL)
        .populate(POPULATE_CATEGORY)
        .populate(POPULATE_SUBCATEGORY)
        .populate(POPULATE_SUBSUBCATEGORY)
        .populate(POPULATE_COLORS)
        .populate(POPULATE_SIZES)
        .sort({ order: -1, createdAt: -1 })
        .limit(4)
        .lean(),

      Product.find({ deletedAt: null, status: true, isGift: true })
        .populate(POPULATE_CATEGORY_GIFT)
        .populate(POPULATE_SUBCATEGORY_GIFT)
        .populate(POPULATE_SUBSUBCATEGORY)
        .populate(POPULATE_COLORS)
        .populate(POPULATE_MATERIAL)
        .populate(POPULATE_SIZES)
        .sort({ order: -1, createdAt: -1 })
        .limit(4)
        .lean(),
    ]);

    const goldFiltered = (goldProducts as { material?: unknown }[]).filter(
      (p) => p.material,
    );
    const silverFiltered = (silverProducts as { material?: unknown }[]).filter(
      (p) => p.material,
    );
    const giftFiltered = (giftProducts as { category?: unknown }[]).filter(
      (p) => p.category,
    );

    const data = { gold: goldFiltered, silver: silverFiltered, gift: giftFiltered };
    cache.set("tabProducts", data);

    return success(res, data, "Tab products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      { gold: [], silver: [], gift: [] },
    );
  }
};

/**
 * POST /api/website/product/batch
 * Accepts { ids: string[] } and returns matching products.
 * Useful for guest cart/wishlist — fetch multiple products in one request.
 */
export const getByIds = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { ids } = req.body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return success(res, [], "No product IDs provided");
    }

    // Cap to 50 IDs to prevent abuse
    const cappedIds = ids.slice(0, 50);

    const products = await Product.find({
      _id: { $in: cappedIds },
      deletedAt: null,
      status: true,
    })
      .populate(PRODUCT_POPULATE)
      .select(PRODUCT_SELECT)
      .lean();

    return success(res, products, "Products fetched successfully");
  } catch (err) {
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};

export const getBySearch = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const { search, limit = "20" } = req.query as {
      search?: string;
      limit?: string;
    };
    const parsedLimit = Math.min(parseInt(limit, 10) || 20, 100);

    if (!search || search.trim() === "") {
      return success(res, [], "Search term is required");
    }

    const trimmedSearch = search.trim();
    const stopWords = new Set([
      "for", "the", "a", "an", "and", "or", "of", "to", "in", "on", "with",
      "him", "her", "is", "it", "by",
    ]);
    const searchWords = trimmedSearch
      .split(/\s+/)
      .filter((word) => word.length > 1 && !stopWords.has(word.toLowerCase()));

    const effectiveSearchWords =
      searchWords.length > 0 ? searchWords : [trimmedSearch];

    const regexPatterns = effectiveSearchWords.map((word) => ({
      $or: [
        { name: { $regex: word, $options: "i" } },
        { slug: { $regex: word, $options: "i" } },
      ],
    }));

    const query = {
      $and: [
        { $or: regexPatterns.flatMap((pattern) => pattern.$or) },
        { deletedAt: null },
        { status: true },
      ],
    };

    const products = await Product.find(query)
      .populate(PRODUCT_POPULATE)
      .select(PRODUCT_SELECT)
      .sort({ order: -1, createdAt: -1 })
      .limit(parsedLimit)
      .lean();

    return success(res, products, "Products fetched successfully");
  } catch (err) {
    logger.error({ err }, "Search error");
    return fail(
      res,
      err instanceof Error ? err.message : "Something went wrong",
      500,
      [],
    );
  }
};