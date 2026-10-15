import AppError from "../utils/error.js";
import logger from "../utils/logger.js";
import Project from "../models/project.model.js";

const handleProjectError = (error, action) => {
  if (error instanceof AppError) return error;

  if (error?.code === 11000) {
    return new AppError("A project with this name already exists", 409);
  }

  if (error?.name === "ValidationError") {
    return new AppError(error.message, 400);
  }

  if (error?.name === "CastError") {
    return new AppError(`Invalid ${error.path}`, 400);
  }

  logger.error(`${action} failed: ${error.message}`);
  return new AppError(`Failed to ${action.toLowerCase()}`, 500);
};

const requireUserId = (userId) => {
  if (!userId) throw new AppError("User ID is required", 400);
};

class ProjectService {
  async createProject(userId, data = {}) {
    requireUserId(userId);

    const projectName = data.projectName;
    if (typeof projectName !== "string" || !projectName.trim()) {
      throw new AppError("Project name is required", 400);
    }

    try {
      return await Project.create({
        user: userId,
        projectName: projectName.trim(),
        description: data.description,
        fileList: data.fileList,
        thoughtSpaces: data.thoughtSpaces,
        taskList: data.taskList,
      });
    } catch (error) {
      throw handleProjectError(error, "Create project");
    }
  }

  async getProjects(userId) {
    requireUserId(userId);

    try {
      return await Project.find({ user: userId }).sort({ updatedAt: -1 });
    } catch (error) {
      throw handleProjectError(error, "Get projects");
    }
  }

  async getProjectById(userId, projectId) {
    requireUserId(userId);
    if (!projectId) throw new AppError("Project ID is required", 400);

    try {
      const project = await Project.findOne({ _id: projectId, user: userId });
      if (!project) throw new AppError("Project not found", 404);
      return project;
    } catch (error) {
      throw handleProjectError(error, "Get project");
    }
  }

  async updateProject(userId, projectId, data = {}) {
    requireUserId(userId);
    if (!projectId) throw new AppError("Project ID is required", 400);

    const updates = {};
    const projectName = data.projectName;
    const description = data.description;
    const fileList = data.fileList;

    if (projectName !== undefined) updates.projectName = projectName;
    if (description !== undefined) updates.description = description;
    if (fileList !== undefined) updates.fileList = fileList;
    if (data.thoughtSpaces !== undefined) updates.thoughtSpaces = data.thoughtSpaces;
    if (data.taskList !== undefined) updates.taskList = data.taskList;

    if (Object.keys(updates).length === 0) {
      throw new AppError("At least one project field is required", 400);
    }

    try {
      const project = await Project.findOneAndUpdate(
        { _id: projectId, user: userId },
        { $set: updates },
        { new: true, runValidators: true },
      );
      if (!project) throw new AppError("Project not found", 404);
      return project;
    } catch (error) {
      throw handleProjectError(error, "Update project");
    }
  }

  async deleteProject(userId, projectId) {
    requireUserId(userId);
    if (!projectId) throw new AppError("Project ID is required", 400);

    try {
      const project = await Project.findOneAndDelete({ _id: projectId, user: userId });
      if (!project) throw new AppError("Project not found", 404);
      return project;
    } catch (error) {
      throw handleProjectError(error, "Delete project");
    }
  }
}

export default new ProjectService();
