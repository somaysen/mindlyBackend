import AppError from "../utils/errors.js";
import TaskModel from "../models/task.model.js";

class TaskService {
  async creatingTask(userData = {}) {
    try {
      const {
        auth,
        TaskName,
        description,
        dueDate,
        dueTime,
        priority,
        status,
      } = userData;

      // Auth validation
      if (!auth) {
        throw new AppError("Auth ID is required", 400);
      }

      // Task name validation
      if (typeof TaskName !== "string" || !TaskName.trim()) {
        throw new AppError("Task name is required", 400);
      }

      // Create task
      const task = await TaskModel.create({
        user: auth,
        taskName: TaskName.trim(),
        description:
          typeof description === "string" ? description.trim() : "",
        dueDate,
        dueTime,
        priority: priority || "medium",
        status: status || "todo",
      });

      return task;
    } catch (error) {
      console.error("Create Task Error:", error);

      // Keep AppError
      if (error instanceof AppError) {
        throw error;
      }

      // Mongoose validation error
      if (error.name === "ValidationError") {
        throw new AppError(error.message, 400);
      }

      throw new AppError("Failed to create task", 500);
    }
  }

  async getAllTasks(userData = {}) {
    try {
      const { user } = userData;

      if (!user) {
        throw new AppError("user ID is required", 400);
      }

      const tasks = await TaskModel.find({ user: user });

      if (!tasks) {
        throw new AppError("No tasks found", 404);
      } else {
        return tasks;
      } if (tasks.length === 0) {
        throw new AppError("No tasks found", 200);
      } else {
        return tasks;
      }
    } catch (error) {
      console.error("Get All Tasks Error:", error);
      throw error;
    }
  }
}

export default new TaskService();