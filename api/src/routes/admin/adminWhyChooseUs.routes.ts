import { Router } from "express";
import {
  create,
  view,
  destroy,
  details,
  update,
  changeStatus,
} from "../../controller/admin/adminWhyChooseUs.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/view", protect, adminOnly, uploadNone, view);
router.post("/details/:id", protect, adminOnly, uploadNone, details);
router.post("/create", protect, adminOnly, uploadNone, create);
router.put("/update/:id", protect, adminOnly, uploadNone, update);
router.put("/delete/:id", protect, adminOnly, uploadNone, destroy);
router.put("/change-status/:id", protect, adminOnly, uploadNone, changeStatus);

export default router;
