import express from "express";
import aiController from "../controllers/ai.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import authRateLimit from "../middlewares/authRateLimit.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

router.post(
  "/task-idea-plan",
  authRateLimit,
  authMiddleware,
  validateRequest(validation.aiPlan),
  aiController.createTaskIdeaPlan,
);
router.post(
  "/classify-task-idea",
  authRateLimit,
  authMiddleware,
  validateRequest(validation.aiClassify),
  aiController.classifyTaskOrIdea,
);

export default router;
