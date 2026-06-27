import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../controller/web/cart.controller.js";
import { uploadNone } from "../../middleware/uploadMiddleware.js";
import protect from "../../middleware/authMiddleware.js";

const router = Router();

router.post("/view", protect, getCart);

router.post("/add", protect, uploadNone, addToCart);

router.put("/items/update/:itemId", protect, uploadNone, updateCartItem);

router.put("/items/remove/:itemId", protect, removeFromCart);

router.put("/destroy", protect, clearCart);

export default router;
