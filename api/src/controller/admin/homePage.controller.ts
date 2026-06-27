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
    fail(res, err instanceof Error ? err.message : "Server error", 500);
  }
};

export const update = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = await homePage.findOneAndUpdate(
      {},
      { $set: { sections: req.body.sections }, $inc: { version: 1 } },
      { new: true, upsert: true },
    );
    cache.del(CACHE_KEY);
    success(res, page, "Home page updated");
  } catch (err) {
    fail(res, err instanceof Error ? err.message : "Failed to update", 500);
  }
};
