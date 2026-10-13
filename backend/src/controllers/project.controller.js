import AppError from "../utils/errors.js";
import projectService from "../services/project.service.js";

const getAuthId = (req) => req.auth?.id || req.auth?._id;

class ProjectController {
  createProject = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await projectService.createProject(userId, req.body);
      return res.status(201).json({
        success: true,
        message: "Project created successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getProjects = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await projectService.getProjects(userId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getProjectById = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await projectService.getProjectById(userId, req.params.projectId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await projectService.updateProject(
        userId,
        req.params.projectId,
        req.body,
      );
      return res.status(200).json({
        success: true,
        message: "Project updated successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await projectService.deleteProject(userId, req.params.projectId);
      return res.status(200).json({
        success: true,
        message: "Project deleted successfully",
        data,
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new ProjectController();
