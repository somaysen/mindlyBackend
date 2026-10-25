import AppError from "../utils/error.js";
import aiService from "../services/ai.service.js";

class AiController {
  classifyTaskOrIdea = async (req, res, next) => {
    try {
      const { text } = req.body;
      if (typeof text !== "string" || !text.trim()) {
        throw new AppError("Text is required", 400);
      }
      if (text.length > 2000) {
        throw new AppError("Text must be 2000 characters or fewer", 400);
      }

      const data = await aiService.classifyTaskOrIdea(text.trim());
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  };

  createTaskIdeaPlan = async (req, res, next) => {
    try {
      const { task, idea } = req.body;
      const hasTask = typeof task === "string" && task.trim();
      const hasIdea = typeof idea === "string" && idea.trim();

      if (!hasTask && !hasIdea) {
        throw new AppError("Provide a task, an idea, or both", 400);
      }
      if ((task !== undefined && typeof task !== "string") ||
          (idea !== undefined && typeof idea !== "string")) {
        throw new AppError("Task and idea must be strings", 400);
      }
      if (task?.length > 2000 || idea?.length > 2000) {
        throw new AppError("Task and idea must be 2000 characters or fewer", 400);
      }

      const data = await aiService.planTaskAndIdeas({
        task: task?.trim(),
        idea: idea?.trim(),
      });
      return res.status(200).json({ success: true, data });
    } catch (error) {
      return next(error);
    }
  };
}

export default new AiController();
