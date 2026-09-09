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
      if (
        typeof TaskName !== "string" ||
        !TaskName.trim()
      ) {
        throw new AppError("Task name is required", 400);
      }

      // Description validation
      if (
        description !== undefined &&
        typeof description !== "string"
      ) {
        throw new AppError("Description must be a string", 400);
      }

      // Due date validation
      if (!dueDate) {
        throw new AppError("Due date is required", 400);
      }

      // Due time validation
      if (!dueTime) {
        throw new AppError("Due time is required", 400);
      }

      // Priority validation
      const allowedPriorities = [
        "low",
        "medium",
        "high",
      ];

      if (
        priority &&
        !allowedPriorities.includes(priority)
      ) {
        throw new AppError(
          "Priority must be low, medium, or high",
          400
        );
      }

      // Status validation
      const allowedStatuses = [
        "pending",
        "in-progress",
        "completed",
      ];

      if (
        status &&
        !allowedStatuses.includes(status)
      ) {
        throw new AppError(
          "Invalid task status",
          400
        );
      }

      // Create task
      const task = await TaskModel.create({
        auth,
        TaskName: TaskName.trim(),
        description: description?.trim() || "",
        dueDate,
        dueTime,
        priority: priority || "medium",
        status: status || "pending",
      });

      return task;
    } catch (error) {
        console.log(error.message);
      // Keep your AppError
      if (error instanceof AppError) {
        throw error,(error.message);

      }

      throw new AppError(
        "Failed to create task",
        500
      );
    }
  }
}

export default new TaskService();