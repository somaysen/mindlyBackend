import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const currentDir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(currentDir, "../../.env");

dotenv.config({ path: envPath });

const asBoolean = (value) => String(value).toLowerCase() === "true";
const redisHost = process.env.REDIS_HOST || "localhost";
const redisPort = Number(process.env.REDIS_PORT) || 6379;
const authTokenSecret = process.env.AUTH_TOKEN_SECRET || process.env.JWT_SECRET;
const corsOrigins = (process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const config = {
  PORT: Number(process.env.PORT) || 9000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: (process.env.MONGO_URI || process.env.MONGODB)?.trim(),
  SKIP_DB: asBoolean(process.env.SKIP_DB),

  REDIS_HOST: redisHost,
  REDIS_PORT: redisPort,
  REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
  REDIS_URL: process.env.REDIS_URL || `redis://${redisHost}:${redisPort}`,
  SKIP_REDIS: asBoolean(process.env.SKIP_REDIS),

  AUTH_TOKEN_SECRET: authTokenSecret,
  AUTH_TOKEN_TTL_HOURS: Number(process.env.AUTH_TOKEN_TTL_HOURS) || 24,
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET || authTokenSecret,
  JWT_REFRESH_TTL_DAYS: Number(process.env.JWT_REFRESH_TTL_DAYS) || 30,

  GMAIL_USER: process.env.GMAIL_USER,
  GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,

  FRONTEND_URL:
    process.env.FRONTEND_URL || "http://localhost:3000",

  CORS_ORIGINS: corsOrigins,
  ALLOWED_ORIGINS: corsOrigins,

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

export default config;
