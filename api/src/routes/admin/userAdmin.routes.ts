import { Router } from "express";
import {
  login,
  findAllUser,
  getFullDetails,
  changeRole,
  userDelete,
  delieveryLogin,
} from "../../controller/admin/userAdmin.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/login", uploadNone, login);
router.post("/findAllUser", protect, adminOnly, uploadNone, findAllUser);
router.post("/get-full-details/:id", protect, adminOnly, uploadNone, getFullDetails);
router.post("/:id/change-role", protect, adminOnly, uploadNone, changeRole);
router.post("/delete/:id", protect, adminOnly, uploadNone, userDelete);
router.post("/delievery-login", uploadNone, delieveryLogin);

export default router;
