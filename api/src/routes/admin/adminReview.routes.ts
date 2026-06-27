import { Router } from "express";
import {
  getAllReviews,
  getReviewById,
  updateReview,
  deleteReview,
  changeStatus,
} from "../../controller/admin/adminReview.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";

const router = Router();

router.post("/view", protect, adminOnly, getAllReviews);
router.post("/details/:id", protect, adminOnly, getReviewById);
router.put("/update/:id", protect, adminOnly, updateReview);
router.put("/status/:id", protect, adminOnly, changeStatus);
router.put("/delete/:id", protect, adminOnly, deleteReview);

export default router;
