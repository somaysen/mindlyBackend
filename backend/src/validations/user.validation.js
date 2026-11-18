import Joi from "joi";
import { body } from "./common.validation.js";

export class UserValidation {
  static schemas = {
  userProfile: body(
    Joi.object({
      name: Joi.string().trim().min(1).max(60).required(),
      avatar: Joi.string().trim().max(2_048).optional(),
      interests: Joi.array().items(Joi.string().trim().max(80)).max(30).optional(),
      planning: Joi.array().items(Joi.string().trim().max(120)).max(30).optional(),
    }).unknown(false),
  ),
  };
}
