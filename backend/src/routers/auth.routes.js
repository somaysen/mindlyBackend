import express from "express";
import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authRateLimit from "../middlewares/authRateLimit.middleware.js";

const router = express.Router();

router.post("/register", authRateLimit, authController.register);
router.post("/login", authRateLimit, authController.login);
router.post("/logout", authMiddleware, authController.logout);

router.post("/verify-email", authRateLimit, authController.verifyEmail);
router.get("/get-verify-email", authRateLimit, authController.verifyEmail);
router.post("/resend-verification", authRateLimit, authController.resendVerification);

router.post("/refresh", authRateLimit, authController.refreshToken);

export default router;
