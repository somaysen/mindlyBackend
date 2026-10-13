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
const mongoUriValue =
  process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGODB;
const mongoURI = mongoUriValue
  ?.trim()
  .replace(/^(['"])(.*)\1$/, "$2")
  .trim();

const config = {
  PORT: Number(process.env.PORT) || 9000,
  NODE_ENV: process.env.NODE_ENV || "development",

  MONGO_URI: mongoURI,
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
  AUTH_RATE_LIMIT_MAX_REQUESTS:
    Number(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 20,
};

export const validateProductionConfig = () => {
  if (config.NODE_ENV !== "production") return;

  const required = [
    ["MONGO_URI", config.MONGO_URI],
    ["AUTH_TOKEN_SECRET", config.AUTH_TOKEN_SECRET],
    ["JWT_REFRESH_SECRET", process.env.JWT_REFRESH_SECRET || process.env.REFRESH_SECRET],
    ["REDIS_URL", process.env.REDIS_URL],
    ["FRONTEND_URL", process.env.FRONTEND_URL],
  ];
  const missing = required.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    throw new Error(`Missing required production configuration: ${missing.join(", ")}`);
  }

  if (!/^mongodb(?:\+srv)?:\/\//i.test(config.MONGO_URI)) {
    throw new Error("MONGO_URI must start with mongodb:// or mongodb+srv://.");
  }

  if (
    config.AUTH_TOKEN_SECRET.length < 32 ||
    config.JWT_REFRESH_SECRET.length < 32 ||
    config.AUTH_TOKEN_SECRET === config.JWT_REFRESH_SECRET
  ) {
    throw new Error(
      "Production access and refresh token secrets must be different values of at least 32 characters.",
    );
  }

  let frontendUrl;
  let redisUrl;
  try {
    frontendUrl = new URL(config.FRONTEND_URL);
    redisUrl = new URL(config.REDIS_URL);
  } catch {
    throw new Error("FRONTEND_URL and REDIS_URL must be valid URLs in production.");
  }

  if (frontendUrl.protocol !== "https:") {
    throw new Error("FRONTEND_URL must use HTTPS in production.");
  }

  if (["localhost", "127.0.0.1", "::1"].includes(redisUrl.hostname)) {
    throw new Error("REDIS_URL must point to a production Redis service.");
  }

  if (config.SKIP_DB || config.SKIP_REDIS) {
    throw new Error("SKIP_DB and SKIP_REDIS cannot be enabled in production.");
  }
};

export default config;
