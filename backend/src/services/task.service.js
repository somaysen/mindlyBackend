import AppError from "../utils/error.js";
import logger from "../utils/logger.js";
import TaskModel from "../models/task.model.js";
import Project from "../models/project.model.js";

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

const normalizeChecklist = (checklist) => {
  if (checklist === undefined || checklist === null || checklist === "") {
    return [];
  }

  if (typeof checklist === "string") {
    try {
      checklist = JSON.parse(checklist);
    } catch {
      throw new AppError("Checklist must be a JSON array", 400);
    }
  }

  if (!Array.isArray(checklist)) {
    throw new AppError("Checklist must be an array", 400);
  }

  return checklist;
};

const normalizeDueTime = (dueTime) => {
  if (dueTime === undefined || dueTime === null || dueTime === "") return null;
  if (typeof dueTime !== "string") {
    throw new AppError("Due time must be a time string", 400);
  }

  const value = dueTime.trim();
  const twentyFourHourTime = value.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (twentyFourHourTime) {
    return `${twentyFourHourTime[1].padStart(2, "0")}:${twentyFourHourTime[2]}`;
  }

  const twelveHourTime = value.match(/^(1[0-2]|0?[1-9]):([0-5]\d)\s*(AM|PM)$/i);
  if (twelveHourTime) {
    const hour = Number(twelveHourTime[1]) % 12 + (twelveHourTime[3].toUpperCase() === "PM" ? 12 : 0);
    return `${String(hour).padStart(2, "0")}:${twelveHourTime[2]}`;
  }

  throw new AppError("Due time must be HH:mm or h:mm AM/PM", 400);
};

const normalizeCompletionState = ({ status, completed }) => {
  if (status !== undefined && typeof status !== "string") {
    throw new AppError("Task status must be a string", 400);
  }
  if (completed !== undefined && typeof completed !== "boolean") {
    throw new AppError("Task completed must be a boolean", 400);
  }

  const normalizedStatus = status?.trim().toLowerCase();
  const resolvedStatus = normalizedStatus ?? (completed === true ? "completed" : "todo");
  const resolvedCompleted = completed ?? resolvedStatus === "completed";

  if ((resolvedStatus === "completed") !== resolvedCompleted) {
    throw new AppError("Task status and completed value must match", 400);
  }

  return { status: resolvedStatus, completed: resolvedCompleted };
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
    completed,
    checklist,
    project,
  } = {}) {
    if (!auth) {
      throw new AppError("Auth ID is required", 400);
    }

    if (typeof taskName !== "string" || !taskName.trim()) {
      throw new AppError("Task name is required", 400);
    }

    const normalizedChecklist = normalizeChecklist(checklist);
    const completionState = normalizeCompletionState({ status, completed });

    try {
      if (project) {
        const ownedProject = await Project.exists({ _id: project, user: auth });
        if (!ownedProject) {
          throw new AppError("Project not found", 404);
        }
      }

      return await TaskModel.create({
        user: auth,
        taskName: taskName.trim(),
        description: typeof description === "string" ? description.trim() : "",
        dueDate: dueDate || null,
        dueTime: normalizeDueTime(dueTime),
        priority: priority || "medium",
        ...completionState,
        checklist: normalizedChecklist,
        project: project || null,
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
      return await TaskModel.find({
        user,
        completed: { $ne: true },
        status: { $ne: "completed" },
      }).sort({ createdAt: -1 });
    } catch (error) {
      throw handleTaskError(error, "Get tasks");
    }
  }

  async getCompletedTasks({ user } = {}) {
    if (!user) {
      throw new AppError("User ID is required", 400);
    }

    try {
      return await TaskModel.find({
        user,
        $or: [{ completed: true }, { status: "completed" }],
      }).sort({ updatedAt: -1 });
    } catch (error) {
      throw handleTaskError(error, "Get completed tasks");
    }
  }

  async getTaskById(user, taskId) {
    if (!user) throw new AppError("User ID is required", 400);
    if (!taskId) throw new AppError("Task ID is required", 400);

    try {
      const task = await TaskModel.findOne({ _id: taskId, user });
      if (!task) throw new AppError("Task not found", 404);
      return task;
    } catch (error) {
      throw handleTaskError(error, "Get task");
    }
  }

  async updateTask(user, taskId, data = {}) {
    if (!user) throw new AppError("User ID is required", 400);
    if (!taskId) throw new AppError("Task ID is required", 400);

    const allowedFields = [
      "taskName", "description", "dueDate", "dueTime", "priority", "status", "completed", "checklist", "project",
    ];
    const updates = {};
    for (const field of allowedFields) {
      if (data[field] !== undefined) updates[field] = data[field];
    }

    if (Object.keys(updates).length === 0) {
      throw new AppError(
        "Provide at least one task field to update: taskName, description, dueDate, dueTime, priority, status, completed, checklist, or project",
        400,
      );
    }
    if (updates.taskName !== undefined) {
      if (typeof updates.taskName !== "string" || !updates.taskName.trim()) {
        throw new AppError("Task name cannot be empty", 400);
      }
      updates.taskName = updates.taskName.trim();
    }
    if (updates.description !== undefined && typeof updates.description === "string") {
      updates.description = updates.description.trim();
    }
    if (updates.dueTime !== undefined) {
      updates.dueTime = normalizeDueTime(updates.dueTime);
    }
    if (updates.checklist !== undefined) {
      updates.checklist = normalizeChecklist(updates.checklist);
    }
    if (updates.status !== undefined || updates.completed !== undefined) {
      Object.assign(updates, normalizeCompletionState(updates));
    }

    try {
      if (updates.project) {
        const ownedProject = await Project.exists({ _id: updates.project, user });
        if (!ownedProject) throw new AppError("Project not found", 404);
      }

      const task = await TaskModel.findOneAndUpdate(
        { _id: taskId, user },
        { $set: updates },
        { returnDocument: "after", runValidators: true },
      );
      if (!task) throw new AppError("Task not found", 404);
      return task;
    } catch (error) {
      throw handleTaskError(error, "Update task");
    }
  }

  async completeTask(user, taskId) {
    if (!user) throw new AppError("User ID is required", 400);
    if (!taskId) throw new AppError("Task ID is required", 400);

    try {
      const task = await TaskModel.findOneAndUpdate(
        { _id: taskId, user },
        { $set: { completed: true, status: "completed" } },
        { returnDocument: "after", runValidators: true },
      );
      if (!task) throw new AppError("Task not found", 404);
      return task;
    } catch (error) {
      throw handleTaskError(error, "Complete task");
    }
  }

  async deleteTask(user, taskId) {
    if (!user) throw new AppError("User ID is required", 400);
    if (!taskId) throw new AppError("Task ID is required", 400);

    try {
      const task = await TaskModel.findOneAndDelete({ _id: taskId, user });
      if (!task) throw new AppError("Task not found", 404);
      return task;
    } catch (error) {
      throw handleTaskError(error, "Delete task");
    }
  }
}

export default new TaskService();
