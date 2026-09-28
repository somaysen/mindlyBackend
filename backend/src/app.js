import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRouter from "./routers/auth.routes.js";
import userRoute from "./routers/user.routes.js";
import TaskRouter from "./routers/task.routes.js";
import NotificationRoute from "./routers/notification.routes.js";

import errorMiddleware from "./middlewares/errorMiddleware.js";
import { corsOptions } from "./config/corsOptions.js";

const app = express();

// ==========================
// Global Middleware
// ==========================

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));
app.use(express.json());

// ==========================
// Routes
// ==========================

app.use("/api/auth", authRouter);
app.use("/api/user", userRoute);
app.use("/api/task", TaskRouter);
app.use("/api/notification", NotificationRoute);

// ==========================
// Error Middleware
// MUST BE LAST
// ==========================

app.use(errorMiddleware);

export default app;
