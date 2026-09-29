import express from "express";

import TaskController from "../controllers/task.controller.js";
import authMiddleware from "../middlewares/auth.middlewar.js";
import userMiddleware from "../middlewares/user.middlewer.js"

const router = express.Router();

const taskController = new TaskController();

router.post(
  "/create",
  authMiddleware,
  taskController.creatingTask.bind(taskController)
);


router.get(
  "/getTaskBy-UserId",
  authMiddleware,userMiddleware,
  taskController.getAllTasks.bind(taskController)
);
export default router;