
import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const mongoURI = config.MONGO_URI;

  if (!mongoURI) {
    throw new Error(
      "MongoDB URI is not configured. Check backend/.env and MONGO_URI."
    );
  }

  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(mongoURI)
      .then(() => {
        logger.info("MongoDB connected successfully");
        return mongoose.connection;
      })
      .catch((error) => {
        connectionPromise = null;
        throw error;
      });
  }

  return connectionPromise;
};

export default connectDB;
