import express from "express";
import authController from "../controllers/auth.conterolle.js";
import authMiddleware from "../middlewares/auth.middlewar.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authMiddleware, authController.logout);

router.post("/verify-email", authController.verifyEmail);
router.get("/get-verify-email", authController.verifyEmail);
router.post("/resend-verification", authController.resendVerification);

export default router;
