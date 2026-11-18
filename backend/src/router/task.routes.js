import express from "express";

import taskController from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";
import validateRequest from "../validations/middleware.js";
import { validation } from "../validations/schemas.js";

const router = express.Router();

// CREATE TASK

router.post("/create", authMiddleware, validateRequest(validation.taskCreate), taskController.creatingTask);

// GET ALL TASKS

router.get("/", authMiddleware, taskController.getTasks);

// GET TASKS BY USER

router.get("/user", authMiddleware, taskController.getTasks);
router.get("/today", authMiddleware, validateRequest(validation.taskToday), taskController.getTasksCreatedToday);
router.get("/completed", authMiddleware, taskController.getCompletedTasks);

// GET, UPDATE, AND DELETE A TASK BY ID

router.get("/:taskId", authMiddleware, validateRequest(validation.taskId), taskController.getTaskById);
router.patch("/complete/:taskId", authMiddleware, validateRequest(validation.taskId), taskController.completeTask);
router.patch("/update/:taskId", authMiddleware, validateRequest(validation.taskId), validateRequest(validation.taskUpdate), taskController.updateTask);
router.put("/update/:taskId", authMiddleware, validateRequest(validation.taskId), validateRequest(validation.taskUpdate), taskController.updateTask);
router.delete("/:taskId", authMiddleware, validateRequest(validation.taskId), taskController.deleteTask);
router.delete("/delete/:taskId", authMiddleware, validateRequest(validation.taskId), taskController.deleteTask);

export default router;
