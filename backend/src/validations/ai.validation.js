import Joi from "joi";
import { body } from "./common.validation.js";

const content = Joi.string().trim().min(1).max(2_000);

export class AiValidation {
  static schemas = {
  aiClassify: body(Joi.object({ text: content.required() }).unknown(false)),
  aiPlan: body(Joi.object({
    task: content,
    idea: content,
    text: content,
  }).xor("task", "idea", "text").unknown(false)),
  };
}
