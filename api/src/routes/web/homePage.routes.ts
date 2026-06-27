import { Router } from "express";
import { homePageController } from "../../controller/web/homePage.controller.js";

const router = Router();

router.get("/", homePageController);

export default router;
