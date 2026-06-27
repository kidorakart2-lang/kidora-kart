import { Router } from "express";
import {
  getProducts,
  getCategories,
  getSubCategories,
  getSubSubCategories,
} from "../../controller/admin/adminBannerLinkOptions.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/products", protect, adminOnly, getProducts);
router.get("/categories", protect, adminOnly, getCategories);
router.get("/subcategories", protect, adminOnly, getSubCategories);
router.get("/subsubcategories", protect, adminOnly, getSubSubCategories);

export default router;
