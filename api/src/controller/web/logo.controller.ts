import Logo from "../../models/logo.js";
import { buildCacheListController } from "./_helpers.js";

export const logoController = buildCacheListController(Logo, {
  cacheKey: "logoData",
});