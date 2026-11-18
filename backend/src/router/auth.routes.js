import express from "express";
import authController from "../controllers/auth.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authRateLimit from "../middlewares/authRateLimit.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.post(
  "/register",
  authRateLimit,
  validateRequest(validation.authRegister),
  authController.register,
);
router.post(
  "/login",
  authRateLimit,
  validateRequest(validation.authLogin),
  authController.login,
);
router.post(
  "/google",
  authRateLimit,
  validateRequest(validation.authGoogle),
  authController.googleLogin,
);
router.post(
  "/logout",
  authMiddleware,
  validateRequest(validation.emptyBody),
  authController.logout,
);
router.post(
  "/verify-email",
  authRateLimit,
  validateRequest(validation.authVerifyBody),
  validateRequest(validation.authVerifyPostQuery),
  authController.verifyEmail,
);
router.get(
  "/verify-email",
  authRateLimit,
  validateRequest(validation.authVerifyQuery),
  authController.verifyEmail,
);
router.post(
  "/resend-verification",
  authRateLimit,
  validateRequest(validation.authResend),
  authController.resendVerification,
);
router.post(
  "/refresh",
  authRateLimit,
  validateRequest(validation.emptyBody),
  authController.refreshToken,
);

export default router;
