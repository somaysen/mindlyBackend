import dotenv from "dotenv";
import { fileURLToPath } from "node:url";

dotenv.config({ path: fileURLToPath(new URL("../../.env", import.meta.url)) });

export default {
  MONGO_URI: process.env.MONGO_URI,
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
  PORT: process.env.PORT || 3000,
  NODE_ENV: process.env.NODE_ENV || "development",
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "http://localhost:3000",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:3000",
};
