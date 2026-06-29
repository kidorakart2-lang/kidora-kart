import { Router } from "express";
import {
  listAuditLogs,
  clearAuditLogs,
} from "../../controller/admin/auditLog.controller.js";
import protect, { adminOnly } from "../../middleware/authMiddleware.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/list", protect, adminOnly, uploadNone, listAuditLogs);
router.post("/clear", protect, adminOnly, uploadNone, clearAuditLogs);

export default router;
