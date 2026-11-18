import Joi from "joi";
import { body, email, objectId, params, queries } from "./common.validation.js";

export class CanvasValidation {
  static schemas = {
  canvasId: params({ canvasId: objectId }),
  canvasMemberIds: params({ canvasId: objectId, memberId: objectId }),
  canvasCreate: body(
    Joi.object({
      projectId: Joi.alternatives().try(
        objectId.optional(),
        Joi.valid(null, ""),
      ),
      title: Joi.string().trim().min(1).max(120).optional(),
    }).unknown(false),
  ),
  canvasList: queries({ projectId: objectId.optional() }),
  canvasUpdate: body(
    Joi.object({
      title: Joi.string().trim().max(120).allow("").optional(),
    }).unknown(false),
  ),
  canvasInvite: body(
    Joi.object({
      email,
      role: Joi.string().valid("editor", "viewer").optional(),
    }).unknown(false),
  ),
  canvasRole: body(
    Joi.object({
      role: Joi.string().valid("editor", "viewer").required(),
    }).unknown(false),
  ),
  };
}
