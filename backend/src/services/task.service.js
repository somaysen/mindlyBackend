import AppError from "../utils/errors.js";
import TaskModel from "../models/task.model.js";

class TaskService {
  // ==========================================
  // CREATE TASK
  // ==========================================

  async creatingTask(userData = {}) {
    try {
      const {
        auth,
        taskName,
        description,
        dueDate,
        dueTime,
        priority,
        status,
      } = userData;

      // ==========================================
      // AUTH VALIDATION
      // ==========================================

      if (!auth) {
        throw new AppError("Auth ID is required", 400);
      }

      // ==========================================
      // TASK NAME VALIDATION
      // ==========================================

      if (typeof taskName !== "string" || !taskName.trim()) {
        throw new AppError("Task name is required", 400);
      }

      // ==========================================
      // CREATE TASK
      // ==========================================

      const task = await TaskModel.create({
        user: auth,

        taskName: taskName.trim(),

        description: typeof description === "string" ? description.trim() : "",

        dueDate: dueDate || null,

        dueTime: dueTime || null,

        priority: priority || "medium",

        status: status || "todo",
      });

      return task;
    } catch (error) {
      console.error("❌ Create Task Error:", error);

      // Already AppError
      if (error instanceof AppError) {
        throw error;
      }

      // Mongoose validation error
      if (error.name === "ValidationError") {
        throw new AppError(error.message, 400);
      }

      // Mongoose CastError
      if (error.name === "CastError") {
        throw new AppError(`Invalid ${error.path}`, 400);
      }

      throw new AppError("Failed to create task", 500);
    }
  }

  // ==========================================
  // GET ALL TASKS
  // ==========================================

  async getAllTasks(userData = {}) {
    try {
      const { user } = userData;

      // ==========================================
      // USER VALIDATION
      // ==========================================

      if (!user) {
        throw new AppError("User ID is required", 400);
      }

      // ==========================================
      // GET TASKS
      // ==========================================

      const tasks = await TaskModel.find({
        user: user,
      }).sort({
        createdAt: -1,
      });

      return tasks;
    } catch (error) {
      console.error("❌ Get All Tasks Error:", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError("Failed to get tasks", 500);
    }
  }
}

export default new TaskService();
