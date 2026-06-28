import { Router } from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  checkInWishlist,
} from "../../controller/web/wishlist.controller.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";
import protect from "../../middleware/authMiddleware.js";

const router = Router();

router.get("/view", protect, getWishlist);

router.post("/add", protect, uploadNone, addToWishlist);

router.put("/remove/:productId", protect, removeFromWishlist);

router.post("/check/:productId", protect, checkInWishlist);

export default router;
