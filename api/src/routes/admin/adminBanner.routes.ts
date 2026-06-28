import { Router } from "express";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  getAllBanner,
  changeStatus,
  linkOptionsProducts,
  linkOptionsCategories,
  linkOptionsSubCategories,
  linkOptionsSubSubCategories,
} from "../../controller/admin/adminBanner.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadSingle, uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

// create banner — needs multer for image upload
router.post("/create", protect, adminOnly, uploadSingle, createBanner);
// update banner — needs multer for optional image upload
router.put("/update/:id", protect, adminOnly, uploadSingle, updateBanner);
// delete banner — no file needed
router.put("/delete/:id", protect, adminOnly, uploadNone, deleteBanner);
// get all banner — no file needed
router.post("/view", protect, adminOnly, uploadNone, getAllBanner);
// change status — no file needed
router.post("/change-status", protect, adminOnly, uploadNone, changeStatus);

// link-options endpoints (for cascading dropdowns in the admin form)
router.get("/link-options/products", protect, adminOnly, linkOptionsProducts);
router.get("/link-options/categories", protect, adminOnly, linkOptionsCategories);
router.get("/link-options/sub-categories", protect, adminOnly, linkOptionsSubCategories);
router.get("/link-options/sub-sub-categories", protect, adminOnly, linkOptionsSubSubCategories);

export default router;
