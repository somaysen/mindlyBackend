import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

const config = {
  MONGO_URI: process.env.MONGO_URI,
  REDIS_URL: process.env.REDIS_URL,
  REDIS_PORT: Number(process.env.REDIS_PORT || 6379),
  REDIS_PASSWORD: process.env.REDIS_PASSWORD,
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  SKIP_REDIS: process.env.SKIP_REDIS === "true",
  AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET,
  AUTH_TOKEN_TTL_HOURS: Number(process.env.AUTH_TOKEN_TTL_HOURS || 1),
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET,
  JWT_REFRESH_TTL_DAYS: Number(process.env.JWT_REFRESH_TTL_DAYS || 7),
  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || process.env.CloudName,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || process.env.APIkey,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || process.env.APISecret,
  PORT: Number(process.env.PORT || 3000),
  NODE_ENV: process.env.NODE_ENV || "development",
  ALLOWED_ORIGINS:
    process.env.ALLOWED_ORIGINS ||
    process.env.CORS_ORIGINS ||
    "https://mindly-alpha.vercel.app",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
  RATE_LIMIT_WINDOW_MS: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  AUTH_RATE_LIMIT_MAX_REQUESTS: Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || 20),
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || "1mb",
  TRUST_PROXY: process.env.TRUST_PROXY || "",
};

export function validateConfig() {
  const errors = [];
  const cloudinaryCredentials = [
    config.CLOUDINARY_CLOUD_NAME,
    config.CLOUDINARY_API_KEY,
    config.CLOUDINARY_API_SECRET,
  ];

  if (config.CLOUDINARY_URL) {
    try {
      const cloudinaryUrl = new URL(config.CLOUDINARY_URL);
      if (
        cloudinaryUrl.protocol !== "cloudinary:" ||
        !cloudinaryUrl.hostname ||
        !cloudinaryUrl.username ||
        !cloudinaryUrl.password
      ) {
        errors.push("CLOUDINARY_URL must contain a cloud name, API key, and API secret");
      }
    } catch {
      errors.push("CLOUDINARY_URL must be a valid Cloudinary URL");
    }
  } else if (
    cloudinaryCredentials.some(Boolean) &&
    !cloudinaryCredentials.every(Boolean)
  ) {
    errors.push(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET must be configured together",
    );
  }

  if (!config.MONGO_URI) errors.push("MONGO_URI is required");
  if (!Number.isInteger(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    errors.push("PORT must be an integer between 1 and 65535");
  }
  if (!Number.isFinite(config.RATE_LIMIT_WINDOW_MS) || config.RATE_LIMIT_WINDOW_MS < 1000) {
    errors.push("AUTH_RATE_LIMIT_WINDOW_MS must be at least 1000");
  }
  if (!Number.isInteger(config.AUTH_RATE_LIMIT_MAX_REQUESTS) || config.AUTH_RATE_LIMIT_MAX_REQUESTS < 1) {
    errors.push("AUTH_RATE_LIMIT_MAX_REQUESTS must be a positive integer");
  }
  if (!Number.isFinite(config.AUTH_TOKEN_TTL_HOURS) || config.AUTH_TOKEN_TTL_HOURS <= 0) {
    errors.push("AUTH_TOKEN_TTL_HOURS must be a positive number");
  }
  if (!Number.isFinite(config.JWT_REFRESH_TTL_DAYS) || config.JWT_REFRESH_TTL_DAYS <= 0) {
    errors.push("JWT_REFRESH_TTL_DAYS must be a positive number");
  }

  if (config.NODE_ENV === "production") {
    if (!config.AUTH_TOKEN_SECRET || config.AUTH_TOKEN_SECRET.length < 32) {
      errors.push("AUTH_TOKEN_SECRET must contain at least 32 characters in production");
    }
    if (!config.JWT_REFRESH_SECRET || config.JWT_REFRESH_SECRET.length < 32) {
      errors.push("JWT_REFRESH_SECRET must contain at least 32 characters in production");
    }
    if (config.AUTH_TOKEN_SECRET && config.AUTH_TOKEN_SECRET === config.JWT_REFRESH_SECRET) {
      errors.push("Access and refresh token secrets must be different");
    }
    if (config.SKIP_REDIS) errors.push("SKIP_REDIS cannot be enabled in production");
    if (!config.REDIS_URL && !process.env.REDIS_HOST) {
      errors.push("REDIS_URL or REDIS_HOST is required in production");
    }
    if (!config.GMAIL_USER || !config.GMAIL_APP_PASSWORD) {
      errors.push("GMAIL_USER and GMAIL_APP_PASSWORD are required in production");
    }
    if (!process.env.FRONTEND_URL) errors.push("FRONTEND_URL must be set in production");
    if (!process.env.ALLOWED_ORIGINS && !process.env.CORS_ORIGINS) {
      errors.push("ALLOWED_ORIGINS (or CORS_ORIGINS) must be set in production");
    }
  }

  if (errors.length) {
    throw new Error(`Invalid configuration: ${errors.join("; ")}`);
  }
}

export default config;
