import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getSearchWithSuggestions } from "../../controller/web/suggestion.controller.js";

const router = Router();

// Rate-limited search endpoint (60 requests per minute per IP)
const suggestionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: { _status: false, _message: "Too many search requests, please slow down" },
});

router.get("/suggestion", suggestionLimiter, getSearchWithSuggestions);

export default router;
