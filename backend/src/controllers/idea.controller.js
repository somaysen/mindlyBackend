import AppError from "../utils/error.js";
import ideaService from "../services/idea.service.js";

const getAuthId = (req) => req.auth?.id || req.auth?._id;

class IdeaController {
  createIdea = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await ideaService.createIdea(userId, req.body);
      return res.status(201).json({ success: true, message: "Idea created successfully", data });
    } catch (error) {
      next(error);
    }
  };

  getIdeas = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await ideaService.getIdeas(userId, { project: req.query.project });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  getIdeaById = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await ideaService.getIdeaById(userId, req.params.ideaId);
      return res.status(200).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  };

  updateIdea = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await ideaService.updateIdea(userId, req.params.ideaId, req.body);
      return res.status(200).json({ success: true, message: "Idea updated successfully", data });
    } catch (error) {
      next(error);
    }
  };

  deleteIdea = async (req, res, next) => {
    try {
      const userId = getAuthId(req);
      if (!userId) throw new AppError("Unauthorized", 401);

      const data = await ideaService.deleteIdea(userId, req.params.ideaId);
      return res.status(200).json({ success: true, message: "Idea deleted successfully", data });
    } catch (error) {
      next(error);
    }
  };
}

export default new IdeaController();
