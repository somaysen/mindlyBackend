import express from "express";
import authRouter from "./routers/auth.routes.js"
import cookieParser from "cookie-parser"
import userRoute from "./routers/user.routes.js"
import AppError from "./utils/errors.js";
import logger from "./utils/logger.js";
import cors from "cors"
import {corsOptions} from "./config/corsOptions.js"


const app = express();
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/user",userRoute)

app.use((error, req, res, next) => {
  const statusCode = Number.isInteger(error.statusCode)
    ? error.statusCode
    : 500;

  if (statusCode >= 500) {
    logger.error(`${req.method} ${req.originalUrl}: ${error.stack || error.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message:
      error instanceof AppError
        ? error.message
        : "Internal server error",
  });
});


export default app;
