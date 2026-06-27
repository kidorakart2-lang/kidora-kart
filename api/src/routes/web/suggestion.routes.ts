import { Router } from "express";
import { getSearchWithSuggestions } from "../../controller/web/suggestion.controller.js";

const router = Router();

// Main search endpoint
router.get("/suggestion", getSearchWithSuggestions);

export default router;
