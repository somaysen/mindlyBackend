import { AuthValidation } from "./auth.validation.js";
import { UserValidation } from "./user.validation.js";
import { NotificationValidation } from "./notification.validation.js";
import { TaskValidation } from "./task.validation.js";
import { ProjectValidation } from "./project.validation.js";
import { FileValidation } from "./file.validation.js";
import { AiValidation } from "./ai.validation.js";
import { IdeaValidation } from "./idea.validation.js";
import { ScheduleValidation } from "./schedule.validation.js";
import { CanvasValidation } from "./canvas.validation.js";

// Keep route imports stable while schemas live in domain-specific files.
export const validation = {
  ...AuthValidation.schemas,
  ...UserValidation.schemas,
  ...NotificationValidation.schemas,
  ...TaskValidation.schemas,
  ...ProjectValidation.schemas,
  ...FileValidation.schemas,
  ...AiValidation.schemas,
  ...IdeaValidation.schemas,
  ...ScheduleValidation.schemas,
  ...CanvasValidation.schemas,
};
