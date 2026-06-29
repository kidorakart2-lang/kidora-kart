import type { Request, Response } from "express";
import faqs from "../../models/faq.js";
import cache from "../../lib/cache.js";

export const create = async (
  request: Request,
  response: Response,
): Promise<void> => {
  try {
    const data = new faqs({ ...request.body });
    const ress = await data.save();
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
    cache.del("faqData");
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
      if (request.body.search != undefined) {
        const name = new RegExp(request.body.search, "i");
        orCondition.push({ question: name }, { answer: name });
      }
    }
    if (orCondition.length > 0) filter.$or = orCondition;

    await faqs.find(filter).countDocuments();
    const ress = await faqs
      .find(filter)
      .select("_id question answer status order")
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
    const result = await faqs.updateMany(
      { _id: request.body.id },
      { deletedAt: new Date() },
    );
    cache.del("faqData");
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
    const result = await faqs.findById({ _id: request.body.id });
    response.send({
      _status: !!result,
      _message: result ? "Data Found" : "Data Not Found",
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
    const ress = await faqs.updateOne(
      { _id: id },
      { $set: { ...request.body, updated_at: new Date() } },
    );
    cache.del("faqData");
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
    const result = await faqs.updateMany(
      { _id: request.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    cache.del("faqData");
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
