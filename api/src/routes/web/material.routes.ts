import { Router } from "express";
import { materialController } from "../../controller/web/material.controller.js";

const router = Router();

router.get("/", materialController);

export default router;
