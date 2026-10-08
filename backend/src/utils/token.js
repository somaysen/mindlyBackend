import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { getRedisClient } from "../config/redis.js";
import AppError from "./errors.js";

const verificationLifetimeMs = 15 * 60 * 1000;
const locallyBlockedTokens = new Map();

// Generate a random email verification token
export const createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  const expiresAt = new Date(Date.now() + verificationLifetimeMs);

  return {
    token,
    hashedToken,
    expiresAt,
  };
};

// Hash an existing token
export const hashToken = (token) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

// Create JWT access token
export const  createAccessToken = (user) => {
  if (!config.AUTH_TOKEN_SECRET) {
    throw new AppError("AUTH_TOKEN_SECRET is not configured", 500);
  }
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
      jti: crypto.randomUUID(),
    },
    config.AUTH_TOKEN_SECRET,
    {
      expiresIn: `${config.AUTH_TOKEN_TTL_HOURS}h`,
    }
  );
};

export const createRefreshToken = (user) => {
  if (!config.JWT_REFRESH_SECRET) {
    throw new AppError("JWT_REFRESH_SECRET is not configured", 500);
  }

  return jwt.sign(
    { id: user._id.toString() },
    config.JWT_REFRESH_SECRET,
    { expiresIn: `${config.JWT_REFRESH_TTL_DAYS}d` },
  );
};

// Save access token in HTTP-only cookie
export const setAccessTokenCookie = (res, token) => {
  if (!res || !token) {
    throw new AppError("Response and access token are required", 500);
  }

  res.cookie("accessToken", token, {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    maxAge: config.AUTH_TOKEN_TTL_HOURS * 60 * 60 * 1000,
    path: "/",
  });
};

// Remove access token cookie
export const clearAccessTokenCookie = (res) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: config.NODE_ENV === "production",
    sameSite: config.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
};

// Verify JWT access token
export const verifyAccessToken = (token) => {
  if (!config.AUTH_TOKEN_SECRET) {
    throw new AppError("AUTH_TOKEN_SECRET is not configured", 500);
  }

  return jwt.verify(token, config.AUTH_TOKEN_SECRET);
};

const getDecodedAccessToken = (token) => {
  const decoded = jwt.decode(token);

  if (!decoded || typeof decoded !== "object" || !decoded.jti) {
    throw new AppError("Invalid access token", 401);
  }

  return decoded;
};

export const blockAccessToken = async (token) => {
  const { jti, exp } = getDecodedAccessToken(token);

  const remainingSeconds = Math.floor(exp - Date.now() / 1000);

  if (!Number.isFinite(remainingSeconds) || remainingSeconds <= 0) {
    return false;
  }

  const redis = getAvailableRedisClient();

  if (!redis) {
    const expiresAt = Date.now() + remainingSeconds * 1000;

    for (const [blockedJti, blockedUntil] of locallyBlockedTokens) {
      if (blockedUntil <= Date.now()) locallyBlockedTokens.delete(blockedJti);
    }

    locallyBlockedTokens.set(jti, expiresAt);
    return true;
  }

  try {
    await redis.set(
      `blocked_token:${jti}`,
      "1",
      "EX",
      remainingSeconds
    );
  } catch {
    throw new AppError("Authentication service temporarily unavailable", 503);
  }

  return true;
};

export const isAccessTokenBlocked = async (token) => {
  const { jti } = getDecodedAccessToken(token);
  const redis = getAvailableRedisClient();

  if (!redis) {
    const expiresAt = locallyBlockedTokens.get(jti);

    if (!expiresAt) return false;
    if (expiresAt <= Date.now()) {
      locallyBlockedTokens.delete(jti);
      return false;
    }

    return true;
  }

  try {
    const blocked = await redis.get(`blocked_token:${jti}`);
    return blocked === "1";
  } catch {
    throw new AppError("Authentication service temporarily unavailable", 503);
  }
};

const getAvailableRedisClient = () => {
  const redis = getRedisClient();

  if (config.SKIP_REDIS) {
    return null;
  }

  if (redis.status !== "ready") {
    throw new AppError("Authentication service temporarily unavailable", 503);
  }

  return redis;
};

export const verifyRefreshToken = (token) => {
  if (!config.JWT_REFRESH_SECRET) {
    throw new AppError("JWT_REFRESH_SECRET is not configured", 500);
  }

  try {
    return jwt.verify(token, config.JWT_REFRESH_SECRET);
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      "Invalid or expired refresh token",
      401
    );
  }
};
