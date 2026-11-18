import Joi from "joi";
import { body, objectId, params } from "./common.validation.js";

const fields = {
  projectName: Joi.string().trim().min(1).max(120).optional(),
  description: Joi.string().max(2_000).optional(),
  thoughtSpaces: Joi.array().max(500).optional(),
  taskList: Joi.array().max(500).optional(),
};

export class ProjectValidation {
  static schemas = {
  projectCreate: body(
    Joi.object({
      projectName: fields.projectName,
      name: fields.projectName,
      project_name: fields.projectName,
      description: fields.description,
      thoughtSpaces: fields.thoughtSpaces,
      taskList: fields.taskList,
    })
      .or("projectName", "name", "project_name")
      .unknown(false),
  ),
  projectUpdate: body(Joi.object(fields).min(1).unknown(false)),
  projectId: params({ projectId: objectId }),
  };
}
