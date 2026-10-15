import mongoose from "mongoose";
import config from "./environment.js";
const { MONGO_URI } = config;
import logger from "../utils/logger.js";

let connectionPromise;

export async function connectDB() {
  if (!MONGO_URI) throw new Error("MONGO_URI is not configured");
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;
  if (mongoose.connection.readyState === 2) {
    return mongoose.connection.asPromise();
  }

  connectionPromise = mongoose
    .connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
    .then(() => {
      logger.info("MongoDB connected successfully");
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = undefined;
      throw error;
    });

  return connectionPromise;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  connectionPromise = undefined;
}
