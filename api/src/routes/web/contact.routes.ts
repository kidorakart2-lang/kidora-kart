import { Router } from "express";
import { contact } from "../../controller/web/contact.controller.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/", uploadNone, contact);

export default router;
