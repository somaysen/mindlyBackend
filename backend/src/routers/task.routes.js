import express from "express";

import TaskController from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middlewar.js";

const router = express.Router();

const taskController = new TaskController();

router.post(
  "/create",
  authMiddleware,
  taskController.creatingTask.bind(taskController)
);

export default router;