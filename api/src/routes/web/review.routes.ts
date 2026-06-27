import { Router } from "express";
import { createReview, getReviewsByProduct } from "../../controller/web/review.controller.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";
import protect from "../../middleware/authMiddleware.js";

const router = Router();

router.post("/create", uploadNone, protect, createReview);
router.post("/get/:productId", uploadNone, getReviewsByProduct);

export default router;
