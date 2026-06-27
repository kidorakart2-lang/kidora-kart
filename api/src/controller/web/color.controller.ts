import Color from "../../models/color.js";
import { buildCacheListController } from "./_helpers.js";

export const colorController = buildCacheListController(Color, {
  cacheKey: "colorData",
});