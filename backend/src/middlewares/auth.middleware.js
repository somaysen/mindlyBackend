import AppError from "../utils/errors.js";
import { isAccessTokenBlocked, verifyAccessToken } from "../utils/token.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authorization = req.get("authorization");

    const match = authorization?.match(/^Bearer\s+(.+)$/i);

    const tokens = [match?.[1]?.trim(), req.cookies?.accessToken].filter(
      (token, index, candidates) =>
        typeof token === "string" &&
        token.length > 0 &&
        candidates.indexOf(token) === index,
    );

    if (tokens.length === 0) {
      return next(new AppError("Authentication token is required", 401));
    }

    let authenticationError = new AppError(
      "Invalid or expired authentication token",
      401,
    );

    for (const token of tokens) {
      let decoded;

      try {
        decoded = verifyAccessToken(token);
      } catch (error) {
        continue;
      }

      if (!decoded?.sub) {
        authenticationError = new AppError(
          "Invalid authentication token payload",
          401,
        );
        continue;
      }

      const blocked = await isAccessTokenBlocked(token);

      if (blocked) {
        authenticationError = new AppError("Token has been revoked", 401);
        continue;
      }

      req.auth = {
        id: decoded.sub,
      };

      req.accessToken = token;

      return next();
    }

    return next(authenticationError);
  } catch (error) {
    return next(error);
  }
};

export default authMiddleware;
