import Joi from "joi";
import { body, objectId, params, queries } from "./common.validation.js";

const fields = {
  title: Joi.string().trim().min(1).max(150).optional(),
  description: Joi.string().max(5_000).optional(),
  category: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(30).optional(),
  project: Joi.alternatives().try(objectId, Joi.valid(null, "")).optional(),
};

export class IdeaValidation {
  static schemas = {
  ideaCreate: body(
    Joi.object({
      ...fields,
      title: fields.title.required(),
    }).unknown(false),
  ),
  ideaUpdate: body(Joi.object(fields).min(1).unknown(false)),
  ideaId: params({ ideaId: objectId }),
  ideaList: queries({ project: objectId.optional() }),
  };
}
