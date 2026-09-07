import express from "express";
import authRouter from "./routers/auth.routes.js"
import cookieParser from "cookie-parser"
import userRoute from "./routers/user.routes.js"


const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/user",userRoute)

app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
});


export default app;
