import AppError from "../utils/errors.js";
import { isAccessTokenBlocked, verifyAccessToken } from "../utils/token.js";

const authMiddleware = async (req, res, next) => {
  const authorization = req.get("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);

  const token = match?.[1].trim() || req.cookies?.accessToken;

  if (!token) {
    return next(new AppError("Authentication token is required", 401));
  }

  let decoded;

  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 500) {
      return next(error);
    }

    return next(new AppError("Invalid or expired authentication token", 401));
  }

  try {
    if (await isAccessTokenBlocked(token)) {
      return next(new AppError("Token has been revoked", 401));
    }
  } catch (error) {
    if (error instanceof AppError) {
      return next(error);
    }

    return next(new AppError("Authentication service is unavailable", 503));
  }

  req.user = decoded;
  req.accessToken = token;
  return next();
};

export default authMiddleware;
