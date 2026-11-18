import Joi from "joi";
import { body, email, emptyObject, queries } from "./common.validation.js";

export class AuthValidation {
  static schemas = {
  authRegister: body(
    Joi.object({
      email,
      password: Joi.string().min(8).max(72).required(),
    }).unknown(false),
  ),
  authLogin: body(
    Joi.object({
      email,
      password: Joi.string().min(8).max(72).required(),
    }).unknown(false),
  ),
  authGoogle: body(
    Joi.object({
      credential: Joi.string().trim().min(1).max(10_000).required(),
    }).unknown(false),
  ),
  authVerifyBody: body(
    Joi.object({
      token: Joi.string().min(1).max(512).optional(),
    }).unknown(false),
  ),
  authVerifyPostQuery: queries({
    token: Joi.string().min(1).max(512).optional(),
  }),
  authVerifyQuery: queries({ token: Joi.string().min(1).max(512).required() }),
  authResend: body(Joi.object({ email }).unknown(false)),
  emptyBody: body(emptyObject),
  };
}
