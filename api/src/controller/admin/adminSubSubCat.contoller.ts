import type { Request, Response } from "express";
import { generateUniqueSlug } from "../../lib/slugFunc.js";
import subSubCategory from "../../models/subSubCategory.js";
import { uploadToR2 } from "../../lib/cloudflare.js";
import cache from "../../lib/cache.js";

export const create = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const subSubCatDoc = new subSubCategory(request.body);

    if (request.file) {
      const uploadResult = await uploadToR2(request.file, "subsubcategories");
      if (uploadResult.success) {
        subSubCatDoc.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const slug = await generateUniqueSlug(subSubCategory, subSubCatDoc.name);
    subSubCatDoc.slug = slug;

    const ress = await subSubCatDoc.save();
    cache.del("navigationData");
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
    const andCondition: Record<string, unknown>[] = [];
    const orCondition: Record<string, unknown>[] = [];

    const isDeletedAt = request.body?.isDeletedAt ?? request.query?.isDeletedAt;
    if (isDeletedAt === "all") {
      // No deletedAt filter — show all
    } else if (isDeletedAt === "deleted") {
      andCondition.push({ deletedAt: { $ne: null } });
    } else {
      // Default: active (non-deleted) only
      andCondition.push({ deletedAt: null });
    }

    const filter: Record<string, unknown> = {};
    if (andCondition.length > 0) filter.$and = andCondition;

    if (request.body != undefined) {
      if (request.body.name != undefined) {
        const name = new RegExp(request.body.name, "i");
        orCondition.push({ name });
      }
      if (request.body.status != undefined) {
        andCondition.push({ status: request.body.status });
      }
      if (request.body.sub_category_id) {
        andCondition.push({
          subCategory_ids: {
            $in: Array.isArray(request.body.sub_category_id)
              ? request.body.sub_category_id
              : [request.body.sub_category_id],
          },
        });
      }
    }
    if (orCondition.length > 0) filter.$or = orCondition;

    const ress = await subSubCategory
      .find(filter)
      .sort({ order: "asc", _id: "desc" })
      .populate("subCategory")
      .lean();

    response.send({
      _status: true,
      _message: "Data Found",
      _data: ress,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Something Went Wrong",
      _data: null,
    });
  }
};

export const destroy = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const existing = await subSubCategory.findById(request.body.id);
    if (!existing) {
      response.send({ _status: false, _message: "No Data Found", _data: null });
      return;
    }
    if (existing.deletedAt) {
      // Already soft-deleted → permanently delete
      await subSubCategory.findByIdAndDelete(request.body.id);
      cache.del("navigationData");
      response.send({ _status: true, _message: "Data Permanently Deleted", _data: null });
      return;
    }
    await subSubCategory.updateOne(
      { _id: request.body.id },
      { $set: { deletedAt: new Date() } },
    );
    cache.del("navigationData");
    response.send({
      _status: true,
      _message: "Data Deleted",
      _data: null,
    });
  } catch (err) {
    cache.del("navigationData");
    response.send({
      _status: false,
      _message: "No Data Deleted",
      _data: null,
    });
  }
};

export const details = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const result = await subSubCategory
      .findById({ _id: request.body.id })
      .lean();
    response.send({
      _status: !!result,
      _message: result ? "Data Found" : "No Data Found",
      _data: result,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "No Data Found",
      _data: null,
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
      const uploadResult = await uploadToR2(request.file, "subsubcategories");
      if (uploadResult.success) {
        updateData.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    if (updateData.name) {
      const slug = await generateUniqueSlug(subSubCategory, updateData.name as string);
      updateData.slug = slug;
    }

    const ress = await subSubCategory.updateOne({ _id: id }, { $set: updateData });
    cache.del("navigationData");
    response.send({
      _status: true,
      _message: "Data Updated",
      _data: ress,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "No Data Updated",
      _data: null,
    });
  }
};

export const changeStatus = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const result = await subSubCategory.updateMany(
      { _id: request.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    cache.del("navigationData");
    response.send({
      _status: true,
      _message: "Status Changed",
      _data: result,
    });
  } catch (err) {
    response.send({
      _status: false,
      _message: "Status Not Changed",
      _data: null,
    });
  }
};