import productFaq from "../../models/productFaq.js";
import { buildCacheListController } from "./_helpers.js";

export const productFaqController = buildCacheListController(productFaq, {
  cacheKey: "productFaqs",
});
