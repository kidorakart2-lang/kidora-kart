import WhyChooseUs from "../../models/whyChooseUs.js";
import { buildCacheListController } from "./_helpers.js";

export const whyChooseUsController = buildCacheListController(WhyChooseUs, {
  cacheKey: "whyChooseUsData",
});