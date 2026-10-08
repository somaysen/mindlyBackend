import logger from "../utils/logger.js";

const errorMiddleware = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err?.statusCode || err?.status || 500;
  let message = err?.message || "Internal Server Error";

  if (
    err?.type === "entity.parse.failed" ||
    (err instanceof SyntaxError && "body" in err)
  ) {
    statusCode = 400;
    message = "Request body contains invalid JSON";
  } else if (err?.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large";
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
  } else if (err?.message?.startsWith("CORS policy:")) {
    statusCode = 403;
    message = "Origin is not allowed";
  }

  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}: ${err?.stack || message}`);
    if (!(err?.statusCode || err?.status)) message = "Internal Server Error";
  } else {
    logger.warn(`${req.method} ${req.originalUrl}: ${message}`);
  }

  return res.status(statusCode).json({ success: false, message });
};

export default errorMiddleware;
