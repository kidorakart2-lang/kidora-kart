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
router.get("/details/:slug", getOne);
router.post(
  "/get-by-category/:categorySlug/:subCategorySlug/:subSubCategorySlug",
  uploadNone,
  getByCategory,
);
router.get("/get-by-filter", getProductByFilter);
router.get("/get-by-search", getBySearch);
router.get("/get-related-products", relatedProducts);
// tab products
router.get("/tab-products", tabProducts);
router.get("/new-arrivals", newArrivals);
router.get("/trending-products", trendingProducts);
router.get("/best-sellers", bestSellers);
router.get("/featured-for-footer", featuredForFooter);

// sitemap products
router.get("/all", getAll);

export default router;
