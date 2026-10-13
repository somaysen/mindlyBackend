import AppError from "../utils/errors.js";
import logger from "../utils/logger.js";
import TaskModel from "../models/task.model.js";

const handleTaskError = (error, action) => {
  if (error instanceof AppError) return error;

  if (error?.name === "ValidationError") {
    return new AppError(error.message, 400);
  }

  if (error?.name === "CastError") {
    return new AppError(`Invalid ${error.path}`, 400);
  }

  logger.error(`${action} failed: ${error.message}`);
  return new AppError(`Failed to ${action.toLowerCase()}`, 500);
};

class TaskService {
  async creatingTask({
    auth,
    taskName,
    description,
    dueDate,
    dueTime,
    priority,
    status,
  } = {}) {
    if (!auth) {
      throw new AppError("Auth ID is required", 400);
    }

    if (typeof taskName !== "string" || !taskName.trim()) {
      throw new AppError("Task name is required", 400);
    }

    try {
      return await TaskModel.create({
        user: auth,
        taskName: taskName.trim(),
        description: typeof description === "string" ? description.trim() : "",
        dueDate: dueDate || null,
        dueTime: dueTime || null,
        priority: priority || "medium",
        status: status || "todo",
      });
    } catch (error) {
      throw handleTaskError(error, "Create task");
    }
  }

  async getAllTasks({ user } = {}) {
    if (!user) {
      throw new AppError("User ID is required", 400);
    }

    try {
      return await TaskModel.find({ user }).sort({ createdAt: -1 });
    } catch (error) {
      throw handleTaskError(error, "Get tasks");
    }
  }
}

export default new TaskService();
