import type { Request, Response } from "express";
import logoModal from "../../models/logo.js";
import { uploadToR2 } from "../../lib/cloudflare.js";
import cache from "../../lib/cache.js";

export const create = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data: Record<string, unknown> = { ...req.body };

    if (req.file) {
      const uploadResult = await uploadToR2(req.file, "logos");
      if (uploadResult.success) {
        data.logo = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const logo = await logoModal.create(data);
    cache.del("logoData");
    res.status(201).json({
      _status: true,
      _message: "Logo Created Successfully",
      _data: logo,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error instanceof Error ? error.message : "Failed to create logo",
      _data: null,
    });
  }
};

export const view = async (_req: Request, res: Response): Promise<void> => {
  try {
    const logos = await logoModal
      .find({ deletedAt: null })
      .sort({ createdAt: "desc" });
    res.status(200).json({
      _status: logos.length > 0,
      _message: logos.length > 0 ? "Logos Found" : "No Logos Found",
      _data: logos.length > 0 ? logos : [],
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error instanceof Error ? error.message : "Failed to fetch logos",
      _data: null,
    });
  }
};

export const update = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const data: Record<string, unknown> = { ...req.body };

    const existingLogo = await logoModal.findById(req.params.id);
    if (!existingLogo) {
      res.status(404).json({
        _status: false,
        _message: "Logo Not Found",
        _data: null,
      });
      return;
    }

    if (req.file) {
      const uploadResult = await uploadToR2(req.file, "logos");
      if (uploadResult.success) {
        data.logo = uploadResult.url;
      } else {
        throw new Error("Failed to upload image");
      }
    }

    const logo = await logoModal.findByIdAndUpdate(req.params.id, {
      $set: data,
    });
    cache.del("logoData");
    res.status(200).json({
      _status: true,
      _message: "Logo Updated Successfully",
      _data: logo,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error instanceof Error ? error.message : "Failed to update logo",
      _data: null,
    });
  }
};

export const destroy = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const logo = await logoModal.findById(req.params.id);
    if (!logo) {
      res.status(404).json({
        _status: false,
        _message: "Logo Not Found",
        _data: null,
      });
      return;
    }
    logo.deletedAt = new Date();
    await logo.save();
    cache.del("logoData");
    res.status(200).json({
      _status: true,
      _message: "Logo Deleted Permanently",
      _data: logo,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error instanceof Error ? error.message : "Failed to delete logo",
      _data: null,
    });
  }
};

export const changeStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const logo = await logoModal.updateMany(
      { _id: req.body.id },
      [{ $set: { status: { $not: "$status" } } }],
    );
    cache.del("logoData");
    res.status(200).json({
      _status: true,
      _message: "Status Changed Successfully",
      _data: logo,
    });
  } catch (error) {
    res.status(500).json({
      _status: false,
      _message: error instanceof Error ? error.message : "Failed to change status",
      _data: null,
    });
  }
};
