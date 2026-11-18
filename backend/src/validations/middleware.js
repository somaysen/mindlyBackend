import AppError from "../utils/error.js";

/** Validate selected Express request sections before a route handler runs. */
export default function validateRequest(schemas = {}) {
  return (req, _res, next) => {
    for (const section of ["body", "params", "query"]) {
      const schema = schemas[section];
      if (!schema) continue;

      const { error, value } = schema.validate(req[section], {
        abortEarly: false,
        convert: true,
        allowUnknown: false,
      });

      if (error) {
        const message = error.details
          .map(({ message: detail }) => detail)
          .join("; ");
        return next(new AppError(`Invalid request ${section}: ${message}`, 400));
      }

      if (section === "query") {
        // Express 5 exposes req.query through a getter, so keep the validated
        // and normalized value on a dedicated property.
        req.validatedQuery = value;
      } else {
        req[section] = value;
      }
    }

    return next();
  };
}
