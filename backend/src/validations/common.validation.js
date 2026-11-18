import Joi from "joi";

export const objectId = Joi.string()
  .pattern(/^[\da-f]{24}$/i)
  .required();
export const email = Joi.string()
  .trim()
  .lowercase()
  .email()
  .max(254)
  .required();
export const emptyObject = Joi.object().max(0).default({});

export const body = (schema) => ({ body: schema });
export const params = (schema) => ({
  params: Joi.object(schema).unknown(false),
});
export const queries = (schema = {}) => ({
  query: Joi.object(schema).unknown(false),
});
