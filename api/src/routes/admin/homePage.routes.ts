import { Router } from "express";
import {
  get,
  update,
  addSection,
  updateSection,
  removeSection,
} from "../../controller/admin/homePage.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.get("/", protect, adminOnly, get);
router.put("/", protect, adminOnly, update);
router.post("/sections", protect, adminOnly, uploadNone, addSection);
router.put("/sections/:sectionId", protect, adminOnly, uploadNone, updateSection);
router.delete("/sections/:sectionId", protect, adminOnly, removeSection);

export default router;
