import type { Request, Response } from "express";
import Product from "../../models/product.js";
import mongoose from "mongoose";
import Category from "../../models/category.js";
import SubCategory from "../../models/subCategory.js";
import { logger } from "../../lib/logger.js";
import SubSubCategory from "../../models/subSubCategory.js";
import Size from "../../models/size.js";
import { uploadToR2, deleteFromR2 } from "../../lib/cloudflare.js";
import { generateUniqueSlug } from "../../lib/slugFunc.js";
import cache from "../../lib/cache.js";

const invalidateProductCaches = (): void => {
  cache.del("newArrivals");
  cache.del("trendingProducts");
  cache.del("featuredForFooter");
  cache.del("tabProducts");
};

const collectValidationMessages = (err: unknown): string[] => {
  const errObj = err as Record<string, unknown>;
  if (errObj?.errors) {
    const messages: string[] = [];
    const errors = errObj.errors as Record<string, { message: string }>;
    for (const msg in errors) {
      if (errors[msg]?.message) messages.push(errors[msg].message);
    }
    return messages;
  }
  return [
    errObj?.message as string ?? (err instanceof Error ? err.message : "Something went wrong"),
  ];
};

export const create = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const productDoc = new Product(request.body);
    const updateData: Record<string, unknown> = { ...request.body };

    const files = request.files as Express.Multer.File[] | undefined;
    const filesObj = files as unknown as Record<string, Express.Multer.File[]> | undefined;
    if (filesObj) {
      if (filesObj.image && filesObj.image[0]) {
        const uploadResult = await uploadToR2(filesObj.image[0], "products", 85);
        if (uploadResult.success) {
          updateData.image = uploadResult.url;
        } else {
          throw new Error("Failed to upload main image");
        }
      }

      if (filesObj.images && filesObj.images.length > 0) {
        const imageUrls: string[] = [];
        for (const file of filesObj.images) {
          const uploadResult = await uploadToR2(file, "products");
          if (uploadResult.success) {
            imageUrls.push(uploadResult.url);
          }
        }
        updateData.images = imageUrls;
      }
    }

    const slug = await generateUniqueSlug(Product, updateData.name as string);
    updateData.slug = slug;

    if (updateData.category) {
      const categoryIds = Array.isArray(updateData.category)
        ? updateData.category
        : [updateData.category];
      for (const catId of categoryIds) {
        const categoryExists = await Category.findById(catId as string);
        if (!categoryExists) {
          throw new Error(`Category with ID ${catId} not found`);
        }
      }
    }

    if (updateData.subCategory) {
      const subCategoryIds = Array.isArray(updateData.subCategory)
        ? updateData.subCategory
        : [updateData.subCategory];
      for (const subCatId of subCategoryIds) {
        const subCategoryExists = await SubCategory.findById(subCatId as string);
        if (!subCategoryExists) {
          throw new Error(`SubCategory with ID ${subCatId} not found`);
        }
      }
    }

    if (updateData.subSubCategory) {
      const subSubCategoryIds = Array.isArray(updateData.subSubCategory)
        ? updateData.subSubCategory
        : [updateData.subSubCategory];
      for (const subSubCatId of subSubCategoryIds) {
        const subSubCategoryExists = await SubSubCategory.findById(subSubCatId as string);
        if (!subSubCategoryExists) {
          throw new Error(`SubSubCategory with ID ${subSubCatId} not found`);
        }
      }
    }

    if (updateData.sizes) {
      const sizeIds = Array.isArray(updateData.sizes) ? updateData.sizes : [updateData.sizes];
      for (const sizeId of sizeIds) {
        const sizeExists = await Size.findById(sizeId as string);
        if (!sizeExists) {
          throw new Error(`Size with ID ${sizeId} not found`);
        }
      }
    }

    Object.assign(productDoc, updateData);
    const ress = await productDoc.save();
    invalidateProductCaches();
    response.send({
      _status: true,
      _message: "Product created successfully",
      _data: ress,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: collectValidationMessages(err),
      _data: [],
    });
  }
};

export const view = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const {
      categories,
      subCategories,
      subSubCategories,
      minPrice,
      maxPrice,
      search,
      sort = "-createdAt",
      inStock,
    } = request.query as Record<string, string | undefined>;

    const query: Record<string, unknown> = { deletedAt: null };

    if (categories) {
      query.categories = Array.isArray(categories)
        ? { $in: categories }
        : categories;
    }
    if (subCategories) {
      query.subCategories = Array.isArray(subCategories)
        ? { $in: subCategories }
        : subCategories;
    }
    if (subSubCategories) {
      query.subSubCategories = Array.isArray(subSubCategories)
        ? { $in: subSubCategories }
        : subSubCategories;
    }

    const priceQuery: Record<string, unknown> = {};
    if (minPrice || maxPrice) {
      if (minPrice) priceQuery.$gte = Number(minPrice);
      if (maxPrice) priceQuery.$lte = Number(maxPrice);
      query.price = priceQuery;
    }

    if (inStock === "true") {
      query.stock = { $gt: 0 };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    const products = await Product.find(query).sort(sort as string);
    response.send({
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Something went wrong",
      _data: [],
    });
  }
};

export const getOne = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const { id: rawId, slug } = request.params;
    const id = Array.isArray(rawId) ? rawId[0] ?? "" : rawId ?? "";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let product: any;
    const populateFields = [
      { path: "colors", select: "name code" },
      { path: "material", select: "name" },
      { path: "category", select: "name slug" },
      { path: "subCategory", select: "name slug" },
      { path: "subSubCategory", select: "name slug" },
      { path: "sizes", select: "name" },
    ];

    if (mongoose.Types.ObjectId.isValid(id)) {
      product = await Product.findById(id).populate(populateFields);
    } else {
      product = await Product.findOne({ slug }).populate(populateFields);
    }

    if (!product) {
      response.status(404).send({
        _status: false,
        _message: "Product not found",
        _data: null,
      });
      return;
    }

    response.send({
      _status: true,
      _message: "Product fetched successfully",
      _data: product,
    });
  } catch (err) {
    response.status(500).send({
      _status: false,
      _message: "Something went wrong",
      _data: null,
    });
  }
};

export const update = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const { id } = request.params;
    const updateData: Record<string, unknown> = { ...request.body };
    const removeImagesUrl: string[] = (updateData.removeImagesUrl as string[]) ?? [];

    const existingProduct = await Product.findOne({ _id: id, deletedAt: null });
    if (!existingProduct) {
      throw new Error("Product not found");
    }

    // #29: Delete removed images from Cloudflare R2
    const R2_CDN_BASE = "https://cdn.jewellerywalla.com/";
    if (removeImagesUrl.length > 0) {
      for (const imageUrl of removeImagesUrl) {
        if (typeof imageUrl === "string" && imageUrl.startsWith(R2_CDN_BASE)) {
          const fileName = imageUrl.slice(R2_CDN_BASE.length);
          deleteFromR2(fileName).catch((err) =>
            logger.error({ err, fileName }, "Failed to delete R2 image"),
          );
        }
      }
    }

    const filesObj = request.files as unknown as Record<string, Express.Multer.File[]> | undefined;
    if (filesObj) {
      if (filesObj.image && filesObj.image[0]) {
        const uploadResult = await uploadToR2(filesObj.image[0], "products");
        if (uploadResult.success) {
          updateData.image = uploadResult.url;
        } else {
          throw new Error("Failed to upload main image");
        }
      }

      if (filesObj.images && filesObj.images.length > 0) {
        const images: string[] = Array.isArray(existingProduct.images) 
          ? [...existingProduct.images] 
          : [];
        if (removeImagesUrl.length > 0) {
          updateData.images = images.filter(
            (image: string) => !removeImagesUrl.includes(image),
          );
        }

        for (const file of filesObj.images) {
          const uploadResult = await uploadToR2(file, "products");
          if (uploadResult?.success && uploadResult?.url) {
            (updateData.images as string[]).push(uploadResult.url);
          }
        }
      }
    }

    if (updateData.name && updateData.name !== existingProduct.name) {
      const slug = await generateUniqueSlug(Product, updateData.name as string);
      updateData.slug = slug;
    }

    if (updateData.category) {
      const categoryIds = Array.isArray(updateData.category)
        ? updateData.category
        : [updateData.category];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingCategoryIds: string[] = Array.isArray(existingProduct.category)
        ? (existingProduct.category as Array<{ toString(): string }>).map((c) =>
            c.toString(),
          )
        : [(existingProduct.category as { toString(): string }).toString()];

      const categoriesChanged =
        JSON.stringify(categoryIds.sort()) !==
        JSON.stringify(existingCategoryIds.sort());

      if (categoriesChanged) {
        for (const catId of categoryIds) {
          const categoryExists = await Category.findById(catId);
          if (!categoryExists) {
            throw new Error(`Category with ID ${catId} not found`);
          }
        }
      }
    }

    if (updateData.subCategory) {
      const subCategoryIds = Array.isArray(updateData.subCategory)
        ? updateData.subCategory
        : [updateData.subCategory];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingSubCategoryIds: string[] = existingProduct.subCategory
        ? Array.isArray(existingProduct.subCategory)
          ? (existingProduct.subCategory as Array<{ toString(): string }>).map((s) =>
              s.toString(),
            )
          : [(existingProduct.subCategory as { toString(): string }).toString()]
        : [];

      const subCategoriesChanged =
        JSON.stringify(subCategoryIds.sort()) !==
        JSON.stringify(existingSubCategoryIds.sort());

      if (subCategoriesChanged) {
        for (const subCatId of subCategoryIds) {
          const subCategoryExists = await SubCategory.findById(subCatId);
          if (!subCategoryExists) {
            throw new Error(`SubCategory with ID ${subCatId} not found`);
          }
        }
      }
    }

    if (updateData.subSubCategory) {
      const subSubCategoryIds = Array.isArray(updateData.subSubCategory)
        ? updateData.subSubCategory
        : [updateData.subSubCategory];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingSubSubCategoryIds: string[] = existingProduct.subSubCategory
        ? Array.isArray(existingProduct.subSubCategory)
          ? (existingProduct.subSubCategory as Array<{ toString(): string }>).map((s) =>
              s.toString(),
            )
          : [(existingProduct.subSubCategory as { toString(): string }).toString()]
        : [];

      const subSubCategoriesChanged =
        JSON.stringify(subSubCategoryIds.sort()) !==
        JSON.stringify(existingSubSubCategoryIds.sort());

      if (subSubCategoriesChanged) {
        for (const subSubCatId of subSubCategoryIds) {
          const subSubCategoryExists = await SubSubCategory.findById(
            subSubCatId,
          );
          if (!subSubCategoryExists) {
            throw new Error(`SubSubCategory with ID ${subSubCatId} not found`);
          }
        }
      }
    }

    if (updateData.sizes) {
      const sizeIds = Array.isArray(updateData.sizes)
        ? updateData.sizes
        : [updateData.sizes];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const existingSizeIds: string[] = existingProduct.sizes
        ? Array.isArray(existingProduct.sizes)
          ? (existingProduct.sizes as Array<{ toString(): string }>).map((s) =>
              s.toString(),
            )
          : [(existingProduct.sizes as { toString(): string }).toString()]
        : [];

      const sizesChanged =
        JSON.stringify(sizeIds.sort()) !==
        JSON.stringify(existingSizeIds.sort());

      if (sizesChanged) {
        for (const sizeId of sizeIds) {
          const sizeExists = await Size.findById(sizeId);
          if (!sizeExists) {
            throw new Error(`Size with ID ${sizeId} not found`);
          }
        }
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {});
    invalidateProductCaches();
    response.send({
      _status: true,
      _message: "Product updated successfully",
      _data: updatedProduct,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: collectValidationMessages(err),
      _data: null,
    });
  }
};

export const destroy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      res.send({
        _status: false,
        _message: "Product not found",
        _data: null,
      });
      return;
    }
    await Product.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true },
    );
    invalidateProductCaches();
    res.send({
      _status: true,
      _message: "Product deleted successfully",
      _data: product,
    });
  } catch (err) {
    res.send({
      _status: false,
      _message: "Something went wrong",
      _data: null,
    });
  }
};

export const changeStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);
    if (!product) {
      res.status(404).json({
        _status: false,
        _message: "Product not found",
        _data: null,
      });
      return;
    }

    // Toggle the boolean status field
    product.status = !product.status;
    await product.save();

    invalidateProductCaches();
    res.status(200).json({
      _status: true,
      _message: "Product status changed successfully",
      _data: product,
    });
  } catch (err) {
    res.status(500).json({
      _status: false,
      _message: "Internal Server Error",
      _data: null,
    });
  }
};

export const getByCategory = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const { categoryId, subCategoryId, subSubCategoryId } = request.params;
    const {
      page = "1",
      limit = "20",
      sort = "-createdAt",
    } = request.query as Record<string, string>;

    const cappedLimit = Math.min(Number(limit), 100);

    const categoryIds = Array.isArray(categoryId) ? categoryId : [categoryId];
    const subCategoryIds = Array.isArray(subCategoryId)
      ? subCategoryId
      : [subCategoryId];
    const subSubCategoryIds = Array.isArray(subSubCategoryId)
      ? subSubCategoryId
      : [subSubCategoryId];

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({
      $or: [
        { category: { $in: categoryIds } },
        { subCategory: { $in: subCategoryIds } },
        { subSubCategory: { $in: subSubCategoryIds } },
      ],
    })
      .populate("colors", "name code")
      .populate("material", "name")
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("sizes", "name")
      .sort(sort)
      .limit(cappedLimit)
      .skip(skip);

    const total = await Product.countDocuments({
      category: { $in: categoryIds },
    });

    response.send({
      _status: true,
      _message: "Products fetched successfully",
      _data: products,
      _pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Something went wrong",
      _data: [],
    });
  }
};

export const getProductByFilter = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const {
      limit = 10,
      isFeatured,
      isNewArrival,
      isBestSeller,
      isTopRated,
      isUpsell,
      isOnSale,
      category,
      subCategory,
      subSubCategory,
    } = request.body as Record<string, unknown>;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, unknown> = {};

    if (isFeatured !== undefined) query.isFeatured = isFeatured;
    if (isNewArrival !== undefined) query.isNewArrival = isNewArrival;
    if (isBestSeller !== undefined) query.isBestSeller = isBestSeller;
    if (isTopRated !== undefined) query.isTopRated = isTopRated;
    if (isUpsell !== undefined) query.isUpsell = isUpsell;
    if (isOnSale !== undefined) query.isOnSale = isOnSale;

    if (category) {
      query.category = Array.isArray(category) ? { $in: category } : category;
    }
    if (subCategory) {
      query.subCategory = Array.isArray(subCategory)
        ? { $in: subCategory }
        : subCategory;
    }
    if (subSubCategory) {
      query.subSubCategory = Array.isArray(subSubCategory)
        ? { $in: subSubCategory }
        : subSubCategory;
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .populate("subCategory", "name slug")
      .populate("subSubCategory", "name slug")
      .populate("sizes", "name")
      .limit(Math.min(Number(limit), 100))
      .sort("-createdAt");

    response.send({
      _status: true,
      _message: "Filtered products fetched successfully",
      _data: products,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Something went wrong",
      _data: [],
    });
  }
};

export const updateStock = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const { id, stock } = request.body as { id?: string; stock?: number };
    if (stock === undefined || stock < 0) {
      throw new Error("Invalid stock value");
    }
    const product = await Product.findByIdAndUpdate(
      id,
      { stock: Number(stock) },
      { new: true, runValidators: true },
    );
    if (!product) {
      throw new Error("Product not found");
    }
    response.send({
      _status: true,
      _message: "Stock updated successfully",
      _data: product,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Something went wrong",
      _data: null,
    });
  }
};