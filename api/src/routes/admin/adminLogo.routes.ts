import { Router } from "express";
import {
  create,
  update,
  destroy,
  view,
  changeStatus,
} from "../../controller/admin/adminLogo.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadLogo, uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/create", protect, adminOnly, uploadLogo, create);
router.post("/view", protect, adminOnly, uploadNone, view);
router.put("/destroy/:id", protect, adminOnly, uploadNone, destroy);
router.put("/update/:id", protect, adminOnly, uploadLogo, update);
router.post("/change-status", protect, adminOnly, uploadNone, changeStatus);

export default router;
