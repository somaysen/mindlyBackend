import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import { getRedisClient } from "../config/redis.js";
import AppError from "./errors.js";

const verificationLifetimeMs = 15 * 60 * 1000;

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
  console.log("userId",user._id)

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

  await getRedisClient().set(
    `blocked_token:${jti}`,
    "1",
    "EX",
    remainingSeconds
  );

  return true;
};

export const isAccessTokenBlocked = async (token) => {
  const { jti } = getDecodedAccessToken(token);

  const blocked = await getRedisClient().get(
    `blocked_token:${jti}`
  );

  return blocked === "1";
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
