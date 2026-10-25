import AppError from "../utils/error.js";
import logger from "../utils/logger.js";
import Idea from "../models/idea.model.js";
import Project from "../models/project.model.js";

const handleIdeaError = (error, action) => {
  if (error instanceof AppError) return error;
  if (error?.name === "ValidationError") return new AppError(error.message, 400);
  if (error?.name === "CastError") return new AppError(`Invalid ${error.path}`, 400);

  logger.error(`${action} failed: ${error.message}`);
  return new AppError(`Failed to ${action.toLowerCase()}`, 500);
};

const requireUserId = (userId) => {
  if (!userId) throw new AppError("User ID is required", 400);
};

const normalizeTags = (tags) => {
  if (tags === undefined || tags === null) return [];
  if (!Array.isArray(tags) || tags.some((tag) => typeof tag !== "string")) {
    throw new AppError("Tags must be an array of strings", 400);
  }
  return tags.map((tag) => tag.trim()).filter(Boolean);
};

class IdeaService {
  async createIdea(userId, data = {}) {
    requireUserId(userId);
    if (typeof data.title !== "string" || !data.title.trim()) {
      throw new AppError("Idea title is required", 400);
    }

    const tags = normalizeTags(data.tags);

    try {
      if (data.project) {
        const project = await Project.exists({ _id: data.project, user: userId });
        if (!project) throw new AppError("Project not found", 404);
      }

      return await Idea.create({
        title: data.title.trim(),
        description: data.description,
        category: data.category,
        tags,
        user: userId,
        project: data.project || null,
      });
    } catch (error) {
      throw handleIdeaError(error, "Create idea");
    }
  }

  async getIdeas(userId, filters = {}) {
    requireUserId(userId);

    try {
      const query = { user: userId };
      if (filters.project) query.project = filters.project;
      return await Idea.find(query).sort({ updatedAt: -1 });
    } catch (error) {
      throw handleIdeaError(error, "Get ideas");
    }
  }

  async getIdeaById(userId, ideaId) {
    requireUserId(userId);
    if (!ideaId) throw new AppError("Idea ID is required", 400);

    try {
      const idea = await Idea.findOne({ _id: ideaId, user: userId });
      if (!idea) throw new AppError("Idea not found", 404);
      return idea;
    } catch (error) {
      throw handleIdeaError(error, "Get idea");
    }
  }

  async updateIdea(userId, ideaId, data = {}) {
    requireUserId(userId);
    if (!ideaId) throw new AppError("Idea ID is required", 400);

    const updates = {};
    for (const field of ["title", "description", "category", "tags", "project"]) {
      if (data[field] !== undefined) updates[field] = data[field];
    }
    if (Object.keys(updates).length === 0) {
      throw new AppError("At least one idea field is required", 400);
    }
    if (updates.title !== undefined) {
      if (typeof updates.title !== "string" || !updates.title.trim()) {
        throw new AppError("Idea title cannot be empty", 400);
      }
      updates.title = updates.title.trim();
    }
    if (updates.tags !== undefined) updates.tags = normalizeTags(updates.tags);

    try {
      if (updates.project) {
        const project = await Project.exists({ _id: updates.project, user: userId });
        if (!project) throw new AppError("Project not found", 404);
      }

      const idea = await Idea.findOneAndUpdate(
        { _id: ideaId, user: userId },
        { $set: updates },
        { returnDocument: "after", runValidators: true },
      );
      if (!idea) throw new AppError("Idea not found", 404);
      return idea;
    } catch (error) {
      throw handleIdeaError(error, "Update idea");
    }
  }

  async deleteIdea(userId, ideaId) {
    requireUserId(userId);
    if (!ideaId) throw new AppError("Idea ID is required", 400);

    try {
      const idea = await Idea.findOneAndDelete({ _id: ideaId, user: userId });
      if (!idea) throw new AppError("Idea not found", 404);
      return idea;
    } catch (error) {
      throw handleIdeaError(error, "Delete idea");
    }
  }
}

export default new IdeaService();
