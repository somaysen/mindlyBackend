import express from "express";
import UserController from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middlewar.js";

const router = express.Router();


router.post("/info-user",authMiddleware, UserController.postUserInfo);

export default router;
