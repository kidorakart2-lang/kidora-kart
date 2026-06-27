import { Router } from "express";
import { testimonialController } from "../../controller/web/testimonial.controller.js";

const router = Router();

router.get("/", testimonialController);

export default router;
