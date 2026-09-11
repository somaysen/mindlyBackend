import AppError from "../utils/errors.js";
import {
  isAccessTokenBlocked,
  verifyAccessToken,
} from "../utils/token.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authorization = req.get("authorization");

    // Match: Bearer <token>
    const match = authorization?.match(/^Bearer\s+(.+)$/i);

    // Prefer Authorization header, fallback to cookie
    const token = match?.[1]?.trim() || req.cookies?.accessToken;

    if (!token) {
      return next(
        new AppError("Authentication token is required", 401)
      );
    }

    // Verify JWT
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      return next(
        new AppError(
          "Invalid or expired authentication token",
          401
        )
      );
    }

    // Make sure token contains user ID
    if (!decoded?.sub) {
      return next(
        new AppError("Invalid authentication token payload", 401)
      );
    }

    // Check whether token has been revoked
    try {
      const blocked = await isAccessTokenBlocked(token);

      if (blocked) {
        return next(
          new AppError("Token has been revoked", 401)
        );
      }
    } catch (error) {
      if (error instanceof AppError) {
        return next(error);
      }

      return next(
        new AppError(
          "Authentication service is unavailable",
          503
        )
      );
    }

    // IMPORTANT:
    // decoded.sub contains the MongoDB user ID
    req.user = decoded.sub;

    // Keep the token available if needed later
    req.accessToken = token;

    return next();
  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;