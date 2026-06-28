import { Router } from "express";
import {
  create,
  bulkCreate,
  bulkCreateFaqs,
  view,
  details,
  update,
  destroy,
  changeStatus,
} from "../../controller/admin/adminProductFaq.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/create", protect, adminOnly, create);
router.post("/bulk-create", protect, adminOnly, uploadNone, bulkCreate);
router.post("/view", protect, adminOnly, view);
router.post("/details", protect, adminOnly, details);
router.put("/update/:id", protect, adminOnly, update);
router.put("/delete/:id", protect, adminOnly, destroy);
router.post("/bulk-create-faqs", protect, adminOnly, uploadNone, bulkCreateFaqs);
router.post("/change-status", protect, adminOnly, changeStatus);

export default router;
