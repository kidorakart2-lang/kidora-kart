import { Router } from "express";
import {
  login,
  refreshAdminToken,
  refreshDeliveryToken,
  findAllUser,
  getFullDetails,
  changeRole,
  createUser,
  userDelete,
  delieveryLogin,
} from "../../controller/admin/userAdmin.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import rateLimit from "../../middleware/rateLimit.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/login", uploadNone, login);
router.post("/refresh", rateLimit.refreshToken, uploadNone, refreshAdminToken);
router.post("/refresh-delivery", rateLimit.refreshToken, uploadNone, refreshDeliveryToken);
router.post("/findAllUser", protect, adminOnly, uploadNone, findAllUser);
router.post("/get-full-details/:id", protect, adminOnly, uploadNone, getFullDetails);
router.post("/create", protect, adminOnly, uploadNone, createUser);
router.post("/:id/change-role", protect, adminOnly, uploadNone, changeRole);
router.post("/delete/:id", protect, adminOnly, uploadNone, userDelete);
router.post("/delievery-login", uploadNone, delieveryLogin);

export default router;
