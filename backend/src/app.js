import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";

import { corsOptions } from "./config/corsOption.js";
import AppError from "./utils/error.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";
import authRouter from "./router/auth.routes.js";
import userRouter from "./router/user.routes.js";
import NotificationRouter from "./router/notification.routes.js";
import taskRouter from "./router/task.routes.js"
import projectRouter from "./router/project.routes.js"

const app = express();

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
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


app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/notification",NotificationRouter);
app.use("/api/task", taskRouter);
app.use("/api/project",projectRouter);


app.use((req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

app.use(errorMiddleware);


export default app;
