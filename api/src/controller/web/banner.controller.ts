import Banner from "../../models/banner.js";
import { buildCacheListController } from "./_helpers.js";

export const bannerController = buildCacheListController(Banner, {
  cacheKey: "bannerData",
});