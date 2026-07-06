import { Router } from "express";
import { generateProductDescription } from "../../controller/admin/ai.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post(
  "/generate-description",
  protect,
  adminOnly,
  uploadNone,
  generateProductDescription,
);

export default router;
