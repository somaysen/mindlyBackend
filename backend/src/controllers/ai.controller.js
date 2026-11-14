import AppError from "../utils/error.js";
import aiService from "../services/ai.service.js";
import ideaService from "../services/idea.service.js";
import taskService from "../services/task.service.js";

const MAX_TEXT_LENGTH = 2000;
const VALID_TYPES = ["task", "idea"];

/**
 * Normalize and validate user input.
 */
const validateContent = (content) => {
  if (typeof content !== "string" || !content.trim()) {
    throw new AppError("Text is required", 400);
  }

  const normalizedText = content.trim();

  if (normalizedText.length > MAX_TEXT_LENGTH) {
    throw new AppError(
      `Text must be ${MAX_TEXT_LENGTH} characters or fewer`,
      400,
    );
  }

  return normalizedText;
};

/**
 * Generate title and description from content.
 */
const getTitleAndDescription = (content) => {
  const normalizedText = content.trim();

  if (normalizedText.length <= 150) {
    return {
      title: normalizedText,
      description: "",
    };
  }

  return {
    title: `${normalizedText.slice(0, 147).trimEnd()}...`,
    description: normalizedText,
  };
};

/**
 * Get authenticated user ID.
 */
const getAuthId = (req) => {
  const authId = req.auth?.id || req.auth?._id;

  if (!authId) {
    throw new AppError("Unauthorized", 401);
  }

  return authId;
};

/**
 * Validate AI classification.
 */
const validateClassification = (classification) => {
  if (!classification || !VALID_TYPES.includes(classification.type)) {
    throw new AppError("Unable to classify the content", 502);
  }

  return classification;
};

/**
 * Create task or idea based on type.
 */
const createItem = async ({ authId, type, content }) => {
  const { title, description } = getTitleAndDescription(content);

  if (type === "task") {
    return taskService.creatingTask({
      auth: authId,
      taskName: title,
      description,
    });
  }

  if (type === "idea") {
    return ideaService.createIdea(authId, {
      title,
      description,
    });
  }

  throw new AppError("Invalid item type", 400);
};

/**
 * Extract exactly one input.
 */
const getPlanInput = ({ task, idea, text }) => {
  const values = { task, idea, text };

  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && typeof value !== "string") {
      throw new AppError(`${key} must be a string`, 400);
    }
  }

  const inputs = Object.entries(values).filter(
    ([, value]) => typeof value === "string" && value.trim(),
  );

  if (inputs.length !== 1) {
    throw new AppError(
      "Provide exactly one non-empty task, idea, or text",
      400,
    );
  }

  const [key, value] = inputs[0];

  return {
    inputType: key,
    content: validateContent(value),
  };
};

class AiController {
  /**
   * Classify and create task or idea.
   */
  classifyTaskOrIdea = async (req, res, next) => {
    try {
      const authId = getAuthId(req);
      const content = validateContent(req.body?.text);

      const classification = validateClassification(
        await aiService.classifyTaskOrIdea(content),
      );

      const createdItem = await createItem({
        authId,
        type: classification.type,
        content,
      });

      return res.status(201).json({
        success: true,
        message: `${classification.type} created successfully`,
        data: {
          ...classification,
          createdItem,
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * Generate plan and create task or idea.
   */
  createTaskIdeaPlan = async (req, res, next) => {
    try {
      const authId = getAuthId(req);

      const { inputType, content } = getPlanInput(req.body || {});

      // Classify only when the user provides generic text.
      const classification =
        inputType === "text"
          ? validateClassification(await aiService.classifyTaskOrIdea(content))
          : { type: inputType };

      const itemType = classification.type;

      // Generate plan before creating the database record.
      const planInput =
        itemType === "task" ? { task: content } : { idea: content };

      const plan = await aiService.planTaskAndIdeas(planInput);

      if (!plan || typeof plan !== "object" || Array.isArray(plan)) {
        throw new AppError("Unable to generate a valid plan", 502);
      }

      // Create database record after successful planning.
      const createdItem = await createItem({
        authId,
        type: itemType,
        content,
      });

      return res.status(201).json({
        success: true,
        message: `${itemType} plan created successfully`,
        data: {
          ...plan,
          type: itemType,
          createdItem,
        },
      });
    } catch (error) {
      return next(error);
    }
  };
}

export default new AiController();
