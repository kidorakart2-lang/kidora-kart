import { Router } from "express";
import { productFaqController } from "../../controller/web/productFaq.controller.js";

const router = Router();

router.get("/", productFaqController);

export default router;
