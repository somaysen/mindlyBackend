import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routers/auth.routes.js";
import userRoute from "./routers/user.routes.js";
import TaskRouter from "./routers/task.routes.js";
import NotificationRoute from "./routers/notification.routes.js";

import errorMiddleware from "./middlewares/errorMiddleware.js";
import { corsOptions } from "./config/corsOptions.js";
import connectDB from "./config/db.js";
import { connectRedis } from "./config/redis.js";
import config, { validateProductionConfig } from "./config/env.js";
import AppError from "./utils/errors.js";

validateProductionConfig();

const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Referrer-Policy", "no-referrer");
  res.set("X-Frame-Options", "DENY");
  res.set("Cache-Control", "no-store");
  next();
});

// ==========================
// Global Middleware
// ==========================

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
const cookieMutationOrigins = new Set([
  ...config.CORS_ORIGINS,
  ...config.ALLOWED_ORIGINS,
  (() => {
    try {
      return new URL(config.FRONTEND_URL).origin;
    } catch {
      return null;
    }
  })(),
].filter(Boolean));
app.use((req, res, next) => {
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(req.method);
  const usesCookieAuth = req.cookies?.accessToken || req.cookies?.refreshToken;

  if (
    isMutation &&
    usesCookieAuth &&
    (!req.get("origin") || !cookieMutationOrigins.has(req.get("origin")))
  ) {
    return next(new AppError("Request origin is not allowed", 403));
  }

  return next();
});
app.use(express.json());
app.use((req, res, next) => {
  if (
    req.body !== undefined &&
    (req.body === null || typeof req.body !== "object" || Array.isArray(req.body))
  ) {
    return next(new AppError("Request body must be a JSON object", 400));
  }
  return next();
});

// Serverless platforms import the Express app without running server.js.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    await connectRedis();
    next();
  } catch (error) {
    next(error);
  }
});

// ==========================
// Routes
// ==========================

app.use("/api/auth", authRouter);
app.use("/api/user", userRoute);
app.use("/api/task", TaskRouter);
app.use("/api/notification", NotificationRoute);

app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// ==========================
// Error Middleware
// MUST BE LAST
// ==========================

app.use(errorMiddleware);

export default app;
