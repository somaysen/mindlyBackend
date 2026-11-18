import Joi from "joi";
import { body, objectId, params, queries } from "./common.validation.js";

const dateValue = Joi.alternatives()
  .try(Joi.date().iso(), Joi.valid(null, ""))
  .optional();
const dueTime = Joi.alternatives()
  .try(
    Joi.string()
      .trim()
      .pattern(
        /^(?:([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?|(1[0-2]|0?[1-9]):[0-5]\d\s*(?:AM|PM))$/i,
      ),
    Joi.valid(null, ""),
  )
  .optional();
const checklistItem = Joi.object({
  title: Joi.string().trim().min(1).max(200).required(),
  completed: Joi.boolean(),
}).unknown(false);
const checklist = Joi.alternatives()
  .try(
    Joi.array().items(checklistItem).max(100),
    Joi.string().max(20_000),
    Joi.valid(null, ""),
  )
  .optional();
const fields = {
  taskName: Joi.string().trim().min(1).max(150).optional(),
  description: Joi.string().max(2_000).optional(),
  dueDate: dateValue,
  dueTime,
  priority: Joi.string()
    .trim()
    .lowercase()
    .valid("low", "medium", "high")
    .optional(),
  status: Joi.string()
    .trim()
    .lowercase()
    .valid("todo", "pending", "in-progress", "completed")
    .optional(),
  completed: Joi.boolean().optional(),
  checklist,
  project: Joi.alternatives().try(objectId, Joi.valid(null, "")).optional(),
};
const updateSchema = Joi.object()
  .custom((payload, helpers) => {
    let current = payload;
    for (let depth = 0; depth < 3; depth += 1) {
      const wrappers = ["updates", "task", "data"].filter((key) =>
        Object.hasOwn(current, key),
      );
      if (wrappers.length === 0) break;
      if (wrappers.length !== 1 || Object.keys(current).length !== 1) {
        return helpers.error("object.unknown");
      }
      current = current[wrappers[0]];
      if (!current || typeof current !== "object" || Array.isArray(current)) {
        return helpers.error("object.base");
      }
    }
    const { error } = Joi.object(fields)
      .min(1)
      .unknown(false)
      .validate(current);
    if (error)
      return helpers.error("any.custom", { message: error.details[0].message });
    return payload;
  })
  .messages({ "any.custom": "{{#message}}" });

export class TaskValidation {
  static schemas = {
  taskCreate: body(
    Joi.object({
      taskName: fields.taskName.required(),
      description: fields.description.optional(),
      dueDate: fields.dueDate.optional(),
      dueTime: fields.dueTime.optional(),
      priority: fields.priority.optional(),
      status: fields.status.optional(),
      completed: fields.completed.optional(),
      checklist: fields.checklist.optional(),
      project: fields.project.optional(),
    }).unknown(false),
  ),
  taskId: params({ taskId: objectId }),
  taskUpdate: body(updateSchema),
  taskToday: queries({
    timezone: Joi.string().trim().min(1).max(100).optional(),
  }),
  };
}
