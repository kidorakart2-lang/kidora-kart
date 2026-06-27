import { Router } from "express";
import { navController } from "../../controller/web/nav.controller.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.get("/", uploadNone, navController);

export default router;
