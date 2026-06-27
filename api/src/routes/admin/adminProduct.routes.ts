import { Router } from "express";
import {
  create,
  view,
  destroy,
  getOne,
  getByCategory,
  getProductByFilter,
  updateStock,
  update,
  changeStatus,
} from "../../controller/admin/adminProduct.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import {
  uploadNone,
  uploadProduct,
} from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/create", protect, adminOnly, uploadProduct, create);
router.post("/view", protect, adminOnly, uploadNone, view);
router.post("/details/:id", protect, adminOnly, getOne);
router.put("/update/:id", protect, adminOnly, uploadProduct, update);
router.put("/delete/:id", protect, adminOnly, uploadNone, destroy);
router.put("/change-status/:id", protect, adminOnly, uploadNone, changeStatus);
router.put("/update-stock/:id", protect, adminOnly, uploadNone, updateStock);
router.post(
  "/get-by-category/:categorySlug/:subCategorySlug/:subSubCategorySlug",
  protect,
  uploadNone,
  getByCategory,
);
router.post("/get-by-filter", protect, adminOnly, uploadNone, getProductByFilter);

export default router;
