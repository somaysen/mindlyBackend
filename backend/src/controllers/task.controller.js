import taskService from "../services/task.service.js";
import AppError from "../utils/errors.js";

class TaskController {
  creatingTask = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;

      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      const data = await taskService.creatingTask({
        auth: authId,
        taskName: req.body.taskName,
        description: req.body.description,
        dueDate: req.body.dueDate,
        dueTime: req.body.dueTime,
        priority: req.body.priority,
        status: req.body.status,
      });

      return res.status(201).json({
        success: true,
        message: "Task created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getAllTasks = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;

      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      const data = await taskService.getAllTasks({
        user: authId,
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getTaskByUserId = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;

      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      const data = await taskService.getAllTasks({
        user: authId,
      });

      return res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default TaskController;
