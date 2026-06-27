import { Router } from "express";
import { logoController } from "../../controller/web/logo.controller.js";

const router = Router();

router.post("/", logoController);

export default router;
