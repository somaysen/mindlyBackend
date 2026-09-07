import crypto from "crypto";
import jwt from "jsonwebtoken";
import config from "../config/env.js";

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
    throw new Error("AUTH_TOKEN_SECRET is not configured");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
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
    throw new Error("AUTH_TOKEN_SECRET is not configured");
  }

  return jwt.verify(token, config.AUTH_TOKEN_SECRET);
};