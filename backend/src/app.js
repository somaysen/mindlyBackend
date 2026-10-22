import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import config, { validateConfig } from "./config/environment.js";
import { corsOptions } from "./config/corsOption.js";
import { connectDB } from "./config/database.js";
import { connectRedis, redisClient } from "./config/redis.js";
import AppError from "./utils/error.js";
import logger from "./utils/logger.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import authRouter from "./router/auth.routes.js";
import userRouter from "./router/user.routes.js";
import NotificationRouter from "./router/notification.routes.js";
import taskRouter from "./router/task.routes.js"
import projectRouter from "./router/project.routes.js"
import fileRouter from "./router/file.routes.js";

validateConfig();

const app = express();

async function connectRequiredServices() {
  try {
    await connectDB();
  } catch (error) {
    const details = String(error?.message || "").replace(
      /(?:mongodb(?:\+srv)?|rediss?):\/\/[^\s"')]+/gi,
      "[connection URI redacted]",
    );
    logger.error(`MongoDB connection failed (${error?.name || "Error"}): ${details}`);
    throw new AppError("Service temporarily unavailable", 503);
  }

  try {
    await connectRedis();
  } catch (error) {
    const details = String(error?.message || "").replace(
      /(?:redis|rediss?):\/\/[^\s"')]+/gi,
      "[connection URI redacted]",
    );
    logger.error(`Redis connection failed (${error?.name || "Error"}): ${details}`);
    throw new AppError("Service temporarily unavailable", 503);
  }
}

app.disable("x-powered-by");
if (config.TRUST_PROXY) {
  const trustProxy = /^(true|false)$/i.test(config.TRUST_PROXY)
    ? config.TRUST_PROXY.toLowerCase() === "true"
    : /^\d+$/.test(config.TRUST_PROXY)
      ? Number(config.TRUST_PROXY)
      : config.TRUST_PROXY.split(",").map((value) => value.trim());
  app.set("trust proxy", trustProxy);
}

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Cache-Control", "no-store");
  next();
});

app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: false, limit: config.JSON_BODY_LIMIT }));
app.use(express.json({ limit: config.JSON_BODY_LIMIT }));

const cookieMutationOrigins = new Set([
  ...config.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean),
]);
try {
  cookieMutationOrigins.add(new URL(config.FRONTEND_URL).origin);
} catch {
  // Invalid production URLs are rejected by deployment configuration checks.
}
app.use((req, res, next) => {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const usesCookieAuth = req.cookies?.accessToken || req.cookies?.refreshToken;
  const origin = req.get("origin");

  if (
    isMutation &&
    usesCookieAuth &&
    origin &&
    !cookieMutationOrigins.has(origin)
  ) {
    return next(new AppError("Request origin is not allowed", 403));
  }

  return next();
});

app.use((req, res, next) => {
  if (
    req.body !== undefined &&
    (req.body === null || typeof req.body !== "object" || Array.isArray(req.body))
  ) {
    return next(new AppError("Request body must be a JSON object", 400));
  }
  return next();
});

// Connect lazily for serverless deployments and reuse the cached connections
// across warm invocations. The same middleware is a no-op after server.js boots.
app.use("/api", async (_req, _res, next) => {
  try {
    await connectRequiredServices();
    return next();
  } catch (error) {
    return next(error);
  }
});

app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/notification",NotificationRouter);
app.use("/api/task", taskRouter);
app.use("/api/file/project", fileRouter);
app.use("/api/project", fileRouter);
app.use("/api/project",projectRouter);

app.get("/", (_req, res) => {
  return res.status(200).json({ message: "Mindly API is running" });
});

app.get("/health", async (_req, res) => {
  try {
    await connectRequiredServices();
    const ready = mongoose.connection.readyState === 1 &&
      (config.SKIP_REDIS || redisClient.isReady);
    return res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable" });
  } catch {
    return res.status(503).json({ status: "unavailable" });
  }
});

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorMiddleware);


export default app;
