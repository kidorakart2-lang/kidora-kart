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
    success(res, page, "Home page data loaded successfully");
  } catch (err) {
    fail(res, "Failed to load home page. Please try again.", 500);
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const sections = (req.body.sections ?? []) as Record<string, unknown>[];

    const page = await homePage.findOneAndUpdate(
      {},
      { $set: { sections }, $inc: { version: 1 } },
      { new: true, upsert: true },
    );
    cache.del(CACHE_KEY);
    const sectionCount = page?.sections?.length ?? 0;
    success(res, page, `Home page updated successfully with ${sectionCount} section${sectionCount !== 1 ? "s" : ""}`);
  } catch (err) {
    fail(res, "Failed to update home page. Please try again.", 500);
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
    const sectionType = (section.type as string) || "unknown";
    success(res, { section: added, page }, `"${sectionType}" section added successfully`);
  } catch (err) {
    fail(res, "Failed to add section. Please try again.", 500);
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
      fail(res, "Section not found. It may have been deleted.", 404);
      return;
    }
    cache.del(CACHE_KEY);
    success(res, page, "Section updated successfully");
  } catch (err) {
    fail(res, "Failed to update section. Please try again.", 500);
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
      fail(res, "Home page not found", 404);
      return;
    }
    cache.del(CACHE_KEY);
    success(res, page, "Section removed successfully");
  } catch (err) {
    fail(res, "Failed to remove section. Please try again.", 500);
  }
};
