import AppError from "../utils/errors.js";
import logger from "../utils/logger.js";
import Project from "../models/project.model.js";

const handleProjectError = (error, action) => {
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

const requireUserId = (userId) => {
  if (!userId) throw new AppError("User ID is required", 400);
};

class ProjectService {
  async createProject(userId, data = {}) {
    requireUserId(userId);

    const projectName = data.projectName ?? data.ProjectName;
    if (typeof projectName !== "string" || !projectName.trim()) {
      throw new AppError("Project name is required", 400);
    }

    try {
      return await Project.create({
        user: userId,
        ProjectName: projectName.trim(),
        desciption: data.description ?? data.desciption ?? "",
        FileList: data.fileList ?? data.FileList ?? [],
        thoughtSpaces: data.thoughtSpaces ?? [],
        tasklist: data.tasklist ?? [],
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
    const projectName = data.projectName ?? data.ProjectName;
    const description = data.description ?? data.desciption;
    const fileList = data.fileList ?? data.FileList;

    if (projectName !== undefined) updates.ProjectName = projectName;
    if (description !== undefined) updates.desciption = description;
    if (fileList !== undefined) updates.FileList = fileList;
    if (data.thoughtSpaces !== undefined) updates.thoughtSpaces = data.thoughtSpaces;
    if (data.tasklist !== undefined) updates.tasklist = data.tasklist;

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
