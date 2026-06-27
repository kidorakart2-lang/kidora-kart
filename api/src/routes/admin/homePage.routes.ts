import { Router } from "express";
import { get, update } from "../../controller/admin/homePage.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/", protect, adminOnly, get);
router.put("/", protect, adminOnly, update);

export default router;
