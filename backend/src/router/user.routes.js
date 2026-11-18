import express from "express";
import UserController from "../controllers/user.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.post("/info-user", authMiddleware, validateRequest(validation.userProfile), UserController.postUserInfo);
router.get("/get-info", authMiddleware, UserController.getUserById);
router.get("/get-info/authID", authMiddleware, UserController.getUserByAuthId);

export default router;
