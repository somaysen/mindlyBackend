import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    const mongoURI = config.MONGODB;

    if (!mongoURI) {
      throw new Error("MONGODB URI is not configured");
    }

    connectionPromise = mongoose
      .connect(mongoURI, { serverSelectionTimeoutMS: 10000 })
      .then(() => {
        logger.info("MongoDB connected successfully");
        return mongoose.connection;
      })
      .catch((error) => {
        logger.error("MongoDB connection failed: %s", error.message);
        throw error;
      })
      .finally(() => {
        connectionPromise = undefined;
      });
  }

  return connectionPromise;
};

export default connectDB;
