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
export const createAccessToken = (user) => {
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
    },
  );
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

  await getRedisClient().set(`blocked_token:${jti}`, "1", "EX", remainingSeconds);
  return true;
};

export const isAccessTokenBlocked = async (token) => {
  const { jti } = getDecodedAccessToken(token);
  const blocked = await getRedisClient().get(`blocked_token:${jti}`);

  return blocked === "1";
};
