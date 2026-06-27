import { Router } from "express";
import {
  create,
  view,
  destroy,
  details,
  update,
  changeStatus,
} from "../../controller/admin/adminSubSubCat.contoller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import {
  uploadSingle,
  uploadNone,
} from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/view", protect, adminOnly, uploadNone, view);
router.post("/details/:id", protect, adminOnly, details);
router.post("/create", protect, adminOnly, uploadSingle, create);
router.put("/update/:id", protect, adminOnly, uploadSingle, update);
router.put("/delete/:id", protect, adminOnly, uploadNone, destroy);
router.put("/change-status/:id", protect, adminOnly, uploadNone, changeStatus);

export default router;
