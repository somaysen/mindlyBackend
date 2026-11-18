import Joi from "joi";
import { body, objectId, params } from "./common.validation.js";

export class FileValidation {
  static schemas = {
  fileProjectId: params({ projectId: objectId }),
  fileIds: params({ projectId: objectId, fileId: objectId }),
  fileUpload: body(
    Joi.object({
      title: Joi.string().trim().max(200).optional(),
      fileData: Joi.string().trim().min(1).max(1_000_000).required(),
      mimeType: Joi.string().trim().max(127).optional(),
    }).unknown(false),
  ),
  };
}
