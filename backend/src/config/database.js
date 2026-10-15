import mongoose from "mongoose";
import config from "./environment.js";
const { MONGO_URI } = config;
import logger from "../utils/logger.js";

export async function connectDB() {
  if (!MONGO_URI) throw new Error("MONGO_URI is not configured");
  await mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 10000 });
  logger.info("MongoDB connected successfully");
}

export async function disconnectDB() {
  await mongoose.disconnect();
}
