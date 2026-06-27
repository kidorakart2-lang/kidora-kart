import { Router } from "express";
import { colorController } from "../../controller/web/color.controller.js";

const router = Router();

router.get("/", colorController);

export default router;
