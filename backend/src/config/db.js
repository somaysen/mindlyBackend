import mongoose from "mongoose";
import config from "./env.js";
import logger from "../utils/logger.js";

const connectDB = async () => {
  // if (config.SKIP_DB) {
  //   logger.warn("MongoDB connection skipped by configuration");
  //   return;
  // }

  try {
    const mongoURI = config.MONGODB;

    if (!mongoURI) {
      throw new Error("MONGODB URI is not configured");
    }

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
    });

    logger.info("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectDB;
