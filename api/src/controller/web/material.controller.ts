import Material from "../../models/material.js";
import { buildCacheListController } from "./_helpers.js";

export const materialController = buildCacheListController(Material, {
  cacheKey: "materialData",
});