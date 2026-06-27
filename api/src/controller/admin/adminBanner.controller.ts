import type { Request, Response } from "express";
import type { FilterQuery } from "mongoose";
import bannerModal from "../../models/banner.js";
import { uploadToR2 } from "../../lib/cloudflare.js";
import cache from "../../lib/cache.js";

export const createBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data: Record<string, unknown> = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadToR2(req.file, "banners");
      if (uploadResult.success) {
        data.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const banner = await bannerModal.create(data);
    cache.del("bannerData");
    res.status(201).json({
      _status: true,
      _message: "Banner Created Successfully",
      _data: banner,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error instanceof Error ? error.message : "Failed to create banner",
      _data: null,
    });
  }
};

export const getAllBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    let pageValue = 1;
    let limitValue = 10;
    let skipValue: number;

    const andCondition: Record<string, unknown>[] = [{ deletedAt: null }];
    const orCondition: Record<string, unknown>[] = [];

    const filter: Record<string, unknown> = {};
    if (andCondition.length > 0) {
      filter.$and = andCondition;
    }

    if (req.body != undefined) {
      pageValue = req.body.page ?? 1;
      limitValue = Math.min(req.body.limit ?? 10, 100);
      skipValue = (pageValue - 1) * limitValue;

      if (req.body.description != undefined) {
        const description = new RegExp(req.body.description, "i");
        orCondition.push({ description } as Record<string, unknown>);
      }
      if (req.body.status != undefined) {
        andCondition.push({ status: req.body.status });
      }
    } else {
      skipValue = 0;
    }

    if (orCondition.length > 0) {
      filter.$or = orCondition;
    }

    const totalRecords = await bannerModal.find(filter as FilterQuery<typeof bannerModal>).countDocuments();
    const banner = await bannerModal
      .find(filter as FilterQuery<typeof bannerModal>)
      .sort({ order: "asc", _id: "desc" })
      .limit(limitValue)
      .skip(skipValue);

    res.status(200).json({
      _status: banner.length > 0,
      _message: banner.length > 0 ? "Banners Found" : "No Banners Found",
      _data: banner.length > 0 ? banner : [],
      _total_pages: Math.ceil(totalRecords / limitValue),
      _total_records: totalRecords,
      _current_page: Number(pageValue),
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message:
        error instanceof Error ? error.message : "Failed to fetch banners",
      _data: null,
    });
  }
};

export const updateBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data: Record<string, unknown> = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadToR2(req.file, "banners");
      if (uploadResult.success) {
        data.image = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const banner = await bannerModal.findByIdAndUpdate(
      req.params.id,
      { $set: data },
      { new: true },
    );

    cache.del("bannerData");
    res.status(200).json({
      _status: !!banner,
      _message: banner ? "Banner Updated Successfully" : "Banner Not Found",
      _data: banner,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message:
        error instanceof Error ? error.message : "Failed to update banner",
      _data: null,
    });
  }
};

export const deleteBanner = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const banner = await bannerModal.findByIdAndUpdate(
      req.params.id,
      { deletedAt: new Date() },
      { new: true },
    );
    cache.del("bannerData");
    res.status(200).json({
      _status: !!banner,
      _message: banner ? "Banner Deleted Successfully" : "Banner Not Found",
      _data: banner,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message:
        error instanceof Error ? error.message : "Failed to delete banner",
      _data: null,
    });
  }
};

export const changeStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const banner = await bannerModal.updateMany(
      { _id: req.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    cache.del("bannerData");
    res.status(200).json({
      _status: true,
      _message: "Status Changed Successfully",
      _data: banner,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message:
        error instanceof Error ? error.message : "Failed to change status",
      _data: null,
    });
  }
};
