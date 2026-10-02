import express from "express";

import TaskController from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middlewar.js";

const router = express.Router();

const taskController = new TaskController();

// ==========================================
// CREATE TASK
// ==========================================

router.post("/create", authMiddleware, taskController.creatingTask);

// ==========================================
// GET ALL TASKS
// ==========================================

router.get("/", authMiddleware, taskController.getAllTasks);

// ==========================================
// GET TASKS BY USER
// ==========================================

router.get("/user", authMiddleware, taskController.getTaskByUserId);

export default router;
