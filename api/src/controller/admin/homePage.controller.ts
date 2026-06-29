import type { Request, Response } from "express";
import homePage from "../../models/homePage.js";
import cache from "../../lib/cache.js";
import { success, fail } from "../../utils/responses.js";

const CACHE_KEY = "homePage";

export const get = async (_req: Request, res: Response): Promise<void> => {
  try {
    let page = await homePage.findOne();
    if (!page) {
      page = await homePage.create({ sections: [], version: 1 });
    }
    success(res, page, "Home page fetched");
  } catch (err) {
    fail(res, "Internal Server Error", 500);
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = (req.body.sections ?? []) as Record<string, unknown>[];

    // Ensure banner is always first
    const bannerIdx = sections.findIndex((s) => s.type === "banner");
    if (bannerIdx > 0) {
      const [banner] = sections.splice(bannerIdx, 1);
      sections.unshift(banner!);
    }

    const page = await homePage.findOneAndUpdate(
      {},
      { $set: { sections }, $inc: { version: 1 } },
      { new: true, upsert: true },
    );
    cache.del(CACHE_KEY);
    success(res, page, "Home page updated");
  } catch (err) {
    fail(res, "Failed to update home page", 500);
  }
};

export const addSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const section = {
      type: req.body.type as string,
      config: (req.body.config ?? {}) as Record<string, unknown>,
      order: (req.body.order ?? 0) as number,
      schemaVersion: 1,
    };

    const page = await homePage.findOneAndUpdate(
      {},
      { $push: { sections: section }, $inc: { version: 1 } },
      { new: true, upsert: true },
    );
    cache.del(CACHE_KEY);

    const added = page!.sections[page!.sections.length - 1];
    success(res, { section: added, page }, "Section added");
  } catch (err) {
    fail(res, "Failed to add section", 500);
  }
};

export const updateSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const updateData: Record<string, unknown> = {};
    if (req.body.type !== undefined) updateData["sections.$.type"] = req.body.type;
    if (req.body.config !== undefined) updateData["sections.$.config"] = req.body.config;
    if (req.body.order !== undefined) updateData["sections.$.order"] = req.body.order;

    const page = await homePage.findOneAndUpdate(
      { "sections._id": sectionId },
      { $set: updateData, $inc: { version: 1 } },
      { new: true },
    );
    if (!page) {
      fail(res, "Section not found", 404);
      return;
    }
    cache.del(CACHE_KEY);
    success(res, page, "Section updated");
  } catch (err) {
    fail(res, "Failed to update section", 500);
  }
};

export const removeSection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { sectionId } = req.params;
    const page = await homePage.findOneAndUpdate(
      {},
      { $pull: { sections: { _id: sectionId } }, $inc: { version: 1 } },
      { new: true },
    );
    if (!page) {
      fail(res, "Page not found", 404);
      return;
    }
    cache.del(CACHE_KEY);
    success(res, page, "Section removed");
  } catch (err) {
    fail(res, "Failed to remove section", 500);
  }
};
