import taskService from "../services/task.service.js";
import AppError from "../utils/error.js";

class TaskController {
  creatingTask = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;
      const body = req.body ?? {};

      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      const data = await taskService.creatingTask({
        auth: authId,
        taskName: body.taskName,
        description: body.description,
        dueDate: body.dueDate,
        dueTime: body.dueTime,
        priority: body.priority,
        status: body.status,
        completed: body.completed,
        checklist: body.checklist,
        project: body.project,
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

  getCompletedTasks = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;
      if (!authId) throw new AppError("Unauthorized", 401);

      const data = await taskService.getCompletedTasks({ user: authId });
      return res.status(200).json({ success: true, data });
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

      const data = await taskService.updateTask(authId, req.params.taskId, req.body ?? {});
      return res.status(200).json({
        success: true,
        message: "Task updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  completeTask = async (req, res, next) => {
    try {
      const authId = req.auth?.id || req.auth?._id;
      if (!authId) throw new AppError("Unauthorized", 401);

      const data = await taskService.completeTask(authId, req.params.taskId);
      return res.status(200).json({
        success: true,
        message: "Task completed successfully",
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
