import type { Request, Response } from "express";
import mongoose from "mongoose";
import Category from "../../models/category.js";
import SubCategory from "../../models/subCategory.js";
import SubSubCategory from "../../models/subSubCategory.js";
import cache from "../../lib/cache.js";
import { success, fail } from "../../utils/responses.js";

export const navController = async (
  _req: Request,
  res: Response,
): Promise<Response> => {
  try {
    const cacheKey = "navigationData";
    const cached = cache.get(cacheKey);
    if (cached) {
      return success(res, cached, "Data fetched successfully");
    }

    const categories = await Category.find({
      deletedAt: null,
      status: true,
    }).lean();
    const subCategories = await SubCategory.find({
      deletedAt: null,
      status: true,
    }).lean();
    const subSubCategories = await SubSubCategory.find({
      deletedAt: null,
      status: true,
    }).lean();

    const navigationData = categories.map((category) => {
      const categorySubCategories = subCategories
        .filter((subCat) => {
          if (Array.isArray(subCat.category)) {
            return (subCat.category as mongoose.Types.ObjectId[]).some(
              (catId) => catId.toString() === category._id.toString(),
            );
          }
          return (subCat.category as mongoose.Types.ObjectId).toString() === category._id.toString();
        })
        .map((subCat) => {
          const subCatSubSubCategories = subSubCategories.filter((subSubCat) => {
            if (Array.isArray(subSubCat.subCategory)) {
              return (subSubCat.subCategory as mongoose.Types.ObjectId[]).some(
                (subCatId) => subCatId.toString() === subCat._id.toString(),
              );
            }
            return (
              (subSubCat.subCategory as mongoose.Types.ObjectId | undefined)?.toString() === subCat._id.toString()
            );
          });

          return {
            ...subCat,
            subSubCategories: subCatSubSubCategories,
          };
        });

      return {
        ...category,
        subCategories: categorySubCategories,
      };
    });

    cache.set(cacheKey, navigationData);
    return success(res, navigationData, "Data fetched successfully");
  } catch (error) {
    return fail(
      res,
      error instanceof Error ? error.message : "Server error",
      500,
    );
  }
};