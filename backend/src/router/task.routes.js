import express from "express";

import taskController from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middleware.js";

const router = express.Router();

// CREATE TASK

router.post("/create", authMiddleware, taskController.creatingTask);

// GET ALL TASKS

router.get("/", authMiddleware, taskController.getTasks);

// GET TASKS BY USER

router.get("/user", authMiddleware, taskController.getTasks);

// GET, UPDATE, AND DELETE A TASK BY ID

router.get("/:taskId", authMiddleware, taskController.getTaskById);
router.patch("/update/:taskId", authMiddleware, taskController.updateTask);
router.delete("/:taskId", authMiddleware, taskController.deleteTask);
router.delete("/delete/:taskId", authMiddleware, taskController.deleteTask);

export default router;
