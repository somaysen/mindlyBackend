import express from "express";
import authController from "../controllers/auth.conterolle.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);
router.post("/login",authController.login)

export default router;
