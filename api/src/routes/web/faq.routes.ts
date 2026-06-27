import { Router } from "express";
import { faqController } from "../../controller/web/faq.controller.js";

const router = Router();

router.get("/", faqController);

export default router;
