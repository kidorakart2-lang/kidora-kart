import type { Request, Response } from "express";
import { generateUniqueSlug } from "../../lib/slugFunc.js";
import subCategory from "../../models/subCategory.js";
import { uploadToR2 } from "../../lib/cloudflare.js";
import cache from "../../lib/cache.js";

export const create = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const subCatDoc = new subCategory(request.body);

    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "subcategories");
      if (uploadResult.success) {
        subCatDoc.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const slug = await generateUniqueSlug(subCategory, subCatDoc.name);
    subCatDoc.slug = slug;

    const ress = await subCatDoc.save();
    cache.del("navigationData");
    cache.del("subCategory_men");
    cache.del("subCategory_women");
    response.send({
      _status: true,
      _message: "Data Inserted",
      _data: ress,
    });
  } catch (err) {
    const messages: string[] = [];
    if (err instanceof Error && "errors" in err) {
      const errors = (err as Record<string, unknown>).errors as Record<string, { message: string }> | undefined;
      if (errors) {
        for (const msg in errors) {
          if (errors[msg]?.message) {
            messages.push(errors[msg].message);
          }
        }
      }
    } else if (err instanceof Error) {
      messages.push(err.message);
    } else {
      messages.push("Something went wrong");
    }
    response.send({ _status: false, _message: messages, _data: [] });
  }
};

export const view = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const andCondition: Record<string, unknown>[] = [{ deletedAt: null }];
    const orCondition: Record<string, unknown>[] = [];

    const filter: Record<string, unknown> = {};
    if (andCondition.length > 0) filter.$and = andCondition;

    if (request.body != undefined) {
      if (request.body.name != undefined) {
        const name = new RegExp(request.body.name, "i");
        orCondition.push({ name });
      }
      if (request.body.parent_category_id) {
        andCondition.push({
          parent_category_ids: {
            $in: Array.isArray(request.body.parent_category_id)
              ? request.body.parent_category_id
              : [request.body.parent_category_id],
          },
        });
      }
    }
    if (orCondition.length > 0) filter.$or = orCondition;

    await subCategory.find(filter).countDocuments();
    const ress = await subCategory
      .find(filter)
      .sort({ order: "asc", _id: "desc" })
      .populate("category");

    response.send({
      _status: ress.length > 0,
      _message: ress.length > 0 ? "Data Found" : "No Data Found",
      _data: ress.length > 0 ? ress : [],
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Something Went Wrong",
      _data: err instanceof Error ? err.message : err,
    });
  }
};

export const destroy = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const result = await subCategory.updateMany(
      { _id: request.body.id },
      { $set: { deletedAt: Date.now() } },
    );
    cache.del("navigationData");
    cache.del("subCategory_men");
    cache.del("subCategory_women");
    response.send({
      _status: true,
      _message: "Data Deleted",
      _data: result,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "No Data Deleted",
      _data: err instanceof Error ? err.message : null,
    });
  }
};

export const details = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const result = await subCategory.findById({ _id: request.body.id });
    response.send({
      _status: !!result,
      _message: result ? "Data Found" : "No Data Found",
      _data: result,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "No Data Found",
      _data: err instanceof Error ? err.message : null,
    });
  }
};

export const update = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const id = request.params.id;
    const updateData: Record<string, unknown> = { ...request.body };

    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "subcategories");
      if (uploadResult.success) {
        updateData.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    if (updateData.name) {
      const slug = await generateUniqueSlug(subCategory, updateData.name as string);
      updateData.slug = slug;
    }

    const ress = await subCategory.updateOne({ _id: id }, { $set: updateData });

    cache.del("navigationData");
    cache.del("subCategory_men");
    cache.del("subCategory_women");
    response.send({
      _status: true,
      _message: "Data Updated",
      _data: ress,
    });
  } catch (err) {
    cache.del("navigationData");
    response.send({
      _status: false,
      _message: "No Data Updated",
      _data: err instanceof Error ? err.message : null,
    });
  }
};

export const changeStatus = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const result = await subCategory.updateMany(
      { _id: request.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );

    cache.del("navigationData");
    cache.del("subCategory_men");
    cache.del("subCategory_women");
    response.send({
      _status: true,
      _message: "Status Changed",
      _data: result,
    });
  } catch (err) {
    cache.del("navigationData");
    response.send({
      _status: false,
      _message: "Status Not Changed",
      _data: err instanceof Error ? err.message : null,
    });
  }
};