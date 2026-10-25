import taskService from "../services/task.service.js";
import AppError from "../utils/error.js";

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
        completed: req.body.completed,
        checklist: req.body.checklist,
        project: req.body.project,
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

  getTasks = async (req, res, next) => {
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

  getTaskById = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;
      if (!authId) throw new AppError("Unauthorized", 401);

      const data = await taskService.getTaskById(authId, req.params.taskId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateTask = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;
      if (!authId) throw new AppError("Unauthorized", 401);

      const data = await taskService.updateTask(authId, req.params.taskId, req.body);
      return res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;
      if (!authId) throw new AppError("Unauthorized", 401);

      const data = await taskService.deleteTask(authId, req.params.taskId);
      return res.status(200).json({
        success: true,
        message: "Task deleted successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

}

export default new TaskController();
