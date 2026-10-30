import logger from "../utils/logger.js";
import AppError from "../utils/error.js";

const isDependencyUnavailable = (err) =>
  [
    "MongoNetworkError",
    "MongoServerSelectionError",
    "MongooseServerSelectionError",
    "MongoNotConnectedError",
    "RedisConnectionError",
    "RedisClientClosedError",
  ].includes(err?.name) ||
  ["ECONNREFUSED", "ECONNRESET", "ETIMEDOUT", "EAI_AGAIN"].includes(err?.code);

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
  } else if (err?.type === "encoding.unsupported") {
    statusCode = 415;
    message = "Request body encoding is not supported";
  } else if (err?.name === "MulterError") {
    statusCode = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    message = err.code === "LIMIT_FILE_SIZE"
      ? "Uploaded file is too large"
      : "Uploaded file is invalid";
  } else if (err?.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  } else if (err?.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err?.code === 11000) {
    statusCode = 409;
    message = "A record with this value already exists";
  } else if (err?.name === "VersionError") {
    statusCode = 409;
    message = "This record changed during the request. Reload it and try again.";
  } else if (err?.message?.startsWith("CORS policy:")) {
    statusCode = 403;
    message = "Origin is not allowed";
  } else if (isDependencyUnavailable(err)) {
    statusCode = 503;
    message = "A required service is temporarily unavailable";
  } else if (["JsonWebTokenError", "TokenExpiredError", "NotBeforeError"].includes(err?.name)) {
    statusCode = 401;
    message = "Authentication token is invalid or expired";
  }

  if (!Number.isInteger(statusCode) || statusCode < 400 || statusCode > 599) {
    statusCode = 500;
  }

  const isKnownOperationalError = err instanceof AppError || err?.isOperational === true;
  if (statusCode >= 500) {
    // Query strings can contain one-time verification tokens. Never log them.
    logger.error(`${req.method} ${req.path}: ${err?.stack || message}`);
    if (!isKnownOperationalError || statusCode === 500) {
      message = "Internal Server Error";
    }
  } else {
    logger.warn(`${req.method} ${req.path}: ${message}`);
  }

  return res.status(statusCode).json({ success: false, message });
};

export default errorMiddleware;
