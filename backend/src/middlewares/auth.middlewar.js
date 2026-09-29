import AppError from "../utils/errors.js";
import {
  isAccessTokenBlocked,
  verifyAccessToken,
} from "../utils/token.js";

const authMiddleware = async (req, res, next) => {
  try {
    // Get Authorization header
    const authorization = req.get("authorization");

    // Extract Bearer token
    const match = authorization?.match(/^Bearer\s+(.+)$/i);

    // Authorization header first, cookie fallback
    const token =
      match?.[1]?.trim() || req.cookies?.accessToken;

    if (!token) {
      return next(
        new AppError("Authentication token is required", 401)
      );
    }

    // Verify token
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

    console.log("Decoded JWT:", decoded);

    // JWT must contain sub
    if (!decoded?.sub) {
      return next(
        new AppError(
          "Invalid authentication token payload",
          401
        )
      );
    }

    // Check revoked token
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

    // --------------------------------
    // IMPORTANT
    // Store auth user in req.user
    // --------------------------------
    req.user = {
      id: decoded.sub,
    };

    console.log("Auth ID:", req.user.id);

    // Keep token available
    req.accessToken = token;

    return next();
  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;