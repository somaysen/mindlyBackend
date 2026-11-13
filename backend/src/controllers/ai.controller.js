import AppError from "../utils/error.js";
import aiService from "../services/ai.service.js";
import ideaService from "../services/idea.service.js";
import taskService from "../services/task.service.js";

const getTitleAndDescription = (text) => {
  if (text.length <= 150) {
    return { title: text, description: "" };
  }

  return {
    title: `${text.slice(0, 147).trimEnd()}...`,
    description: text,
  };
};

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

      const authId = req.auth?.id || req.auth?._id;
      if (!authId) {
        throw new AppError("Unauthorized", 401);
      }

      const normalizedText = text.trim();
      const classification = await aiService.classifyTaskOrIdea(normalizedText);
      const { title, description } = getTitleAndDescription(normalizedText);
      const createdItem =
        classification.type === "task"
          ? await taskService.creatingTask({
            auth: authId,
            taskName: title,
            description,
          })
          : await ideaService.createIdea(authId, { title, description });

      return res.status(201).json({
        success: true,
        data: { ...classification, createdItem },
      });
    } catch (error) {
      return next(error);
    }
  };

  createTaskIdeaPlan = async (req, res, next) => {
    try {
      const { task, idea } = req.body;

      if (
        (task !== undefined && typeof task !== "string") ||
        (idea !== undefined && typeof idea !== "string")
      ) {
        throw new AppError("Task and idea must be strings", 400);
      }
      const hasTask = typeof task === "string" && task.trim();
      const hasIdea = typeof idea === "string" && idea.trim();
      if (Boolean(hasTask) === Boolean(hasIdea)) {
        throw new AppError("Provide exactly one of task or idea", 400);
      }
      if (task?.length > 2000 || idea?.length > 2000) {
        throw new AppError(
          "Task and idea must be 2000 characters or fewer",
          400,
        );
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
