import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Resolve the backend .env from this file so startup works from any cwd.
const envPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../.env");
dotenv.config({ path: envPath });

const asBoolean = (value) => {
    return String(value).toLowerCase() === "true";
};

const config = {
    // Server
    PORT: Number(process.env.PORT) || 3000,
    NODE_ENV: process.env.NODE_ENV || "development",

    // MongoDB
    MONGODB:
        process.env.MONGO_URI ||
        process.env.MONGODB ||
        "mongodb://localhost:27017/mindly",

    SKIP_DB: asBoolean(process.env.SKIP_DB),

    // Redis
    REDIS_HOST: process.env.REDIS_HOST || "localhost",
    REDIS_PORT: Number(process.env.REDIS_PORT) || 6379,
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || "",
    SKIP_REDIS: asBoolean(process.env.SKIP_REDIS),

    // Optional Redis URL
    REDIS_URL:
        process.env.REDIS_URL ||
        `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`,

    // Authentication
    AUTH_TOKEN_SECRET: process.env.AUTH_TOKEN_SECRET,
    AUTH_TOKEN_TTL_HOURS:
        Number(process.env.AUTH_TOKEN_TTL_HOURS) || 24,
    JWT_REFRESH_SECRET:
        process.env.JWT_REFRESH_SECRET || process.env.AUTH_TOKEN_SECRET,
    JWT_REFRESH_TTL_DAYS: Number(process.env.JWT_REFRESH_TTL_DAYS) || 30,

    // Gmail
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,

    // Frontend
    FRONTEND_URL:
        process.env.FRONTEND_URL || "http://localhost:3000",

    // Rate limiting
    RATE_LIMIT_WINDOW_MS:
        Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,

    RATE_LIMIT_MAX_REQUESTS:
        Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

export default config;
