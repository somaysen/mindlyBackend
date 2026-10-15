import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import config from "./config/environment.js";
import { corsOptions } from "./config/corsOption.js";
import { redisClient } from "./config/redis.js";
import AppError from "./utils/error.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import authRouter from "./router/auth.routes.js";
import userRouter from "./router/user.routes.js";
import NotificationRouter from "./router/notification.routes.js";
import taskRouter from "./router/task.routes.js"
import projectRouter from "./router/project.routes.js"

const app = express();

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

  if (
    isMutation &&
    usesCookieAuth &&
    !cookieMutationOrigins.has(req.get("origin"))
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


app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/notification",NotificationRouter);
app.use("/api/task", taskRouter);
app.use("/api/project",projectRouter);

app.get("/health", (_req, res) => {
  const ready = mongoose.connection.readyState === 1 &&
    (config.SKIP_REDIS || redisClient.isReady);
  return res.status(ready ? 200 : 503).json({ status: ready ? "ok" : "unavailable" });
});

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorMiddleware);


export default app;
