import { Router } from "express";
import {
  login,
  logout,
  refreshAdminToken,
  refreshDeliveryToken,
  findAllUser,
  getFullDetails,
  changeRole,
  createUser,
  userDelete,
  delieveryLogin,
  verifyPassword,
} from "../../controller/admin/userAdmin.controller.js";
import protect, { adminOnly, csrfProtection } from "../../middleware/authMiddleware.js";
import rateLimit from "../../middleware/rateLimit.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/login", uploadNone, login);
router.post("/refresh", rateLimit.refreshToken, uploadNone, refreshAdminToken);
router.post("/refresh-delivery", rateLimit.refreshToken, uploadNone, refreshDeliveryToken);
router.post("/findAllUser", protect, adminOnly, csrfProtection, uploadNone, findAllUser);
router.post("/get-full-details/:id", protect, adminOnly, csrfProtection, uploadNone, getFullDetails);
router.post("/create", protect, adminOnly, csrfProtection, uploadNone, createUser);
router.post("/:id/change-role", protect, adminOnly, csrfProtection, uploadNone, changeRole);
router.post("/delete/:id", protect, adminOnly, csrfProtection, uploadNone, userDelete);
router.post("/delievery-login", uploadNone, delieveryLogin);
router.post("/verify-password", protect, adminOnly, csrfProtection, uploadNone, verifyPassword);
router.post("/logout", uploadNone, logout);

export default router;
