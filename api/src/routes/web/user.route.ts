import { Router } from "express";
import {
  registerUser,
  loginUser,
  getProfile,
  updateProfile,
  forgotPassword,
  resetPassword,
  verifyOtp,
  verifyUser,
  completeVerify,
  changePassword,
  googleAuthInit,
  googleAuthCallback,
  googleLogin,
  reLogin,
} from "../../controller/web/user.controller.js";
import protect from "../../middleware/authMiddleware.js";
import rateLimit from "../../middleware/rateLimit.js";
import { uploadAvatar, uploadNone } from "../../middleware/uploadMiddleware.js";

const router = Router();

router.post("/register", rateLimit.register, uploadNone, registerUser);
router.post("/login", rateLimit.login, uploadNone, loginUser);
router.post("/profile", protect, uploadNone, getProfile);

router.put(
  "/update-profile",
  rateLimit.updateProfile,
  protect,
  uploadAvatar,
  updateProfile,
);

router.post(
  "/change-password",
  rateLimit.passwordReset,
  protect,
  uploadNone,
  changePassword,
);

router.post(
  "/forgot-password",
  rateLimit.passwordReset,
  uploadNone,
  forgotPassword,
);

router.post("/verify-otp", uploadNone, verifyOtp);

router.post(
  "/reset-password",
  protect,
  rateLimit.passwordReset,
  uploadNone,
  resetPassword,
);

router.post("/verify-user", protect, rateLimit.sendEmailOTP, uploadNone, verifyUser);

router.post("/complete-verify", protect, rateLimit.verifyEmail, uploadNone, completeVerify);

router.post("/google-auth-init", uploadNone, googleAuthInit);

router.post("/google-login", uploadNone, googleLogin);

router.post("/google-callback", uploadNone, googleAuthCallback);

router.post("/re-login", protect, uploadNone, reLogin);

export default router;
