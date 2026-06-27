import { Router } from "express";
import { bannerController } from "../../controller/web/banner.controller.js";

const router = Router();

router.get("/", bannerController);

export default router;
