import { Router } from "express";
import {
  createBanner,
  updateBanner,
  deleteBanner,
  getAllBanner,
  changeStatus,
} from "../../controller/admin/adminBanner.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadSingle } from "../../middleware/uploadMiddleware.js";

const router = Router();

// create banner
router.post("/create", protect, adminOnly, uploadSingle, createBanner);
// update banner
router.put("/update/:id", protect, adminOnly, uploadSingle, updateBanner);
// delete banner
router.put("/delete/:id", protect, adminOnly, uploadSingle, deleteBanner);
// get all banner
router.post("/view", protect, adminOnly, uploadSingle, getAllBanner);
// change status
router.post("/change-status", protect, adminOnly, uploadSingle, changeStatus);

export default router;
