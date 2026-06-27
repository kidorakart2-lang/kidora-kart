import { Router } from "express";
import {
  getDashboardStats,
  getRecentActivity,
} from "../../controller/admin/dashboard.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";

const router = Router();

router.post("/get-dashboard-stats", protect, adminOnly, getDashboardStats);
router.post("/get-recent-activity", protect, adminOnly, getRecentActivity);

export default router;
