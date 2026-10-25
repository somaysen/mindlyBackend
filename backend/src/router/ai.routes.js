import express from "express";
import aiController from "../controllers/ai.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/task-idea-plan", authMiddleware, aiController.createTaskIdeaPlan);
router.post("/classify-task-idea", authMiddleware, aiController.classifyTaskOrIdea);

export default router;
