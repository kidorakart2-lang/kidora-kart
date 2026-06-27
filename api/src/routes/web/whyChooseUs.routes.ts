import { Router } from "express";
import { whyChooseUsController } from "../../controller/web/whyChooseUs.controller.js";

const router = Router();

router.get("/", whyChooseUsController);

export default router;
