import type { Request, Response } from "express";
import whyChooseUs from "../../models/whyChooseUs.js";
import { uploadToR2 } from "../../lib/cloudflare.js";
import cache from "../../lib/cache.js";

export const create = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = new whyChooseUs(request.body);

    if (request.body.icon) {
      data.image = request.body.icon as string;
    } else if (request.file) {
      const uploadResult = await uploadToR2(request.file, "whyChooseUs");
      if (uploadResult.success) {
        data.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const ress = await data.save();
    cache.del("whyChooseUsData");
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
      if (request.body.title != undefined) {
        const title = new RegExp(request.body.title, "i");
        orCondition.push({ title, description: title });
      }
      if (request.body.status != undefined) {
        andCondition.push({ status: request.body.status });
      }
    }
    if (orCondition.length > 0) filter.$or = orCondition;

    await whyChooseUs.find(filter).countDocuments();
    const ress = await whyChooseUs
      .find(filter)
      .sort({ order: "asc", _id: "desc" });

    response.send({
      _status: ress.length > 0,
      _message: ress.length > 0 ? "Data Found" : "No Data Found",
      _data: ress.length > 0 ? ress : [],
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
    const result = await whyChooseUs.updateMany(
      { _id: request.body.id },
      { $set: { deletedAt: Date.now() } },
    );
    cache.del("whyChooseUsData");
    response.send({
      _status: true,
      _message: "Data Deleted",
      _data: result,
    });
  } catch (err) {
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
    const result = await whyChooseUs.findById({ _id: request.body.id });
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

    if (request.body.icon) {
      updateData.image = request.body.icon;
    } else if (request.file) {
      const uploadResult = await uploadToR2(request.file, "whyChooseUs");
      if (uploadResult.success) {
        updateData.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const ress = await whyChooseUs.updateOne({ _id: id }, { $set: updateData });
    cache.del("whyChooseUsData");
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
    const result = await whyChooseUs.updateMany(
      { _id: request.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    cache.del("whyChooseUsData");
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