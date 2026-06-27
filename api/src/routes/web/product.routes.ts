import { Router } from "express";
import {
  getOne,
  getByCategory,
  getProductByFilter,
  getBySearch,
  getAll,
  relatedProducts,
  tabProducts,
  newArrivals,
  trendingProducts,
  bestSellers,
  featuredForFooter,
} from "../../controller/web/product.controller.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

// Category routes
router.post("/details/:slug", uploadNone, getOne);
router.post(
  "/get-by-category/:categorySlug/:subCategorySlug/:subSubCategorySlug",
  uploadNone,
  getByCategory,
);
router.post("/get-by-filter", uploadNone, getProductByFilter);
router.get("/get-by-search", uploadNone, getBySearch);
router.post("/get-related-products", uploadNone, relatedProducts);
// tab products
router.get("/tab-products", uploadNone, tabProducts);
router.get("/new-arrivals", uploadNone, newArrivals);
router.get("/trending-products", uploadNone, trendingProducts);
router.get("/best-sellers", uploadNone, bestSellers);
router.get("/featured-for-footer", uploadNone, featuredForFooter);

// sitemap products
router.post("/all", uploadNone, getAll);

export default router;
