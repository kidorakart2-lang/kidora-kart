import { Router } from "express";
import { coupenPopUp, findCoupen } from "../../controller/web/coupen.controller.js";
import protect from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/single/:id", protect, coupenPopUp);

router.get("/find", protect, findCoupen);

export default router;
