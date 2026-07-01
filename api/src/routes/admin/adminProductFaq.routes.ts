import { Router } from "express";
import {
  create,
  view,
  details,
  update,
  destroy,
  changeStatus,
} from "../../controller/admin/adminProductFaq.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";

const router = Router();

router.post("/create", protect, adminOnly, create);
router.post("/view", protect, adminOnly, view);
router.post("/details", protect, adminOnly, details);
router.put("/update/:id", protect, adminOnly, update);
router.put("/delete/:id", protect, adminOnly, destroy);
router.post("/change-status", protect, adminOnly, changeStatus);

export default router;
